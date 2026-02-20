// --- Hoisted helper for Algorand SDK param normalization ---
function normalizeSuggestedParams(sp: any) {
  if (!sp) throw new Error("[stake] suggestedParams missing");

  const first = sp.firstRound ?? sp.firstValid;
  const last  = sp.lastRound  ?? sp.lastValid;

  const genesisHash = sp.genesisHash;
  const genesisID   = sp.genesisID;

  if (!first) throw new Error("[stake] missing first round");
  if (!last) throw new Error("[stake] missing last round");
  if (!genesisHash) throw new Error("[stake] missing genesisHash");
  if (!genesisID) throw new Error("[stake] missing genesisID");

  const toNum = (v: any) => (typeof v === "bigint" ? Number(v) : v);

  return {
    flatFee: true,
    fee: Math.max(1000, toNum(sp.fee ?? 1000)),
    firstRound: toNum(first),
    lastRound: toNum(last),
    genesisHash,
    genesisID,
  };
}
import algosdk, { SuggestedParams, AtomicTransactionComposer, ABIContract } from "algosdk";
import { getAlgodClient } from "../utils/algodClient";
import abiJson from "./artifacts/protius_staking/ProtiusStaking.arc56.json";

// --- Read staking app ID from environment ---
const stakingAppIdEnv = import.meta.env.VITE_PROTIUS_STAKING_APP_ID;
if (!stakingAppIdEnv) {
  throw new Error("VITE_PROTIUS_STAKING_APP_ID is missing from environment. Please set it in .env.local or .env.");
}
const PROTIUS_STAKING_APP_ID = Number(stakingAppIdEnv);
if (!PROTIUS_STAKING_APP_ID || isNaN(PROTIUS_STAKING_APP_ID) || PROTIUS_STAKING_APP_ID <= 0) {
  throw new Error("VITE_PROTIUS_STAKING_APP_ID is invalid. Must be a positive integer.");
}

// Withdraw function: allows user to withdraw their staked ALGO
export async function withdraw(
  activeAddress: string,
  transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>,
  amountInAlgo: number
): Promise<void> {
  if (!activeAddress || typeof activeAddress !== 'string' || activeAddress.length !== 58) {
    throw new Error('Invalid or missing sender address');
  }
  if (!transactionSigner || typeof transactionSigner !== 'function') {
    throw new Error('Transaction signer is not set or invalid');
  }
  if (typeof amountInAlgo !== 'number' || isNaN(amountInAlgo) || amountInAlgo <= 0) {
    throw new Error('Withdraw amount must be a positive number');
  }

  const sender = activeAddress;
  const amountMicroAlgos = Math.floor(amountInAlgo * 1_000_000);
  if (!Number.isSafeInteger(amountMicroAlgos) || amountMicroAlgos <= 0) {
    throw new Error('Withdraw amount in microAlgos is invalid or too large');
  }

  const algod = getAlgodClient();
  let suggestedParams;
  try {
    suggestedParams = await algod.getTransactionParams().do();
  } catch (err) {
    throw new Error('Failed to fetch suggestedParams: ' + ((err as any)?.message || err));
  }
  if (!suggestedParams) {
    throw new Error('suggestedParams is null or undefined');
  }

  // Build app call transaction for withdraw
  let appCallTxn;
  try {
    // ABI method selector for withdraw(uint64)void
    const withdrawMethodSelector = new Uint8Array([0x51, 0x5b, 0x7d, 0x0b]);
    // Encode the amount as uint64 (8 bytes, big-endian)
    const amountBuffer = new ArrayBuffer(8);
    const amountView = new DataView(amountBuffer);
    amountView.setBigUint64(0, BigInt(amountMicroAlgos), false); // false = big-endian
    // Combine selector + encoded amount
    const appArgs = new Uint8Array(withdrawMethodSelector.length + 8);
    appArgs.set(withdrawMethodSelector, 0);
    appArgs.set(new Uint8Array(amountBuffer), withdrawMethodSelector.length);
    appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
      sender,
      appIndex: PROTIUS_STAKING_APP_ID,
      appArgs: [appArgs],
      suggestedParams,
    });
  } catch (err) {
    throw new Error('Failed to build app call transaction: ' + ((err as any)?.message || err));
  }

  // Sign and send
  let signedTxns, response, txId;
  try {
    signedTxns = await transactionSigner([appCallTxn], [0]);
    response = await algod.sendRawTransaction(signedTxns).do();
    txId = response.txid;
    await algosdk.waitForConfirmation(algod, txId, 4);
  } catch (err) {
    throw new Error('Failed to sign/send/confirm withdraw transaction: ' + ((err as any)?.message || err));
  }
  console.log('[withdraw] Transaction sent. TxID:', txId);
}

export type StakingState = {
  totalStake: bigint;
  userStake: bigint | undefined;
};

/**
 * READ STATE (REAL ON-CHAIN)
 */
export async function fetchStakingState(
  accountAddress: string
): Promise<StakingState> {
  const algod = getAlgodClient();

  try {
    // Local (user) state
    const acctInfo = await algod
      .accountApplicationInformation(accountAddress, PROTIUS_STAKING_APP_ID)
      .do();

    console.log('[fetchStakingState] Account info:', acctInfo);

    const localState = acctInfo.appLocalState?.keyValue ?? [];
    let userStake = 0n;

    for (const kv of localState) {
      const key = new TextDecoder().decode(kv.key);
      if (key === "s" && kv.value?.uint !== undefined) {
        userStake = BigInt(kv.value.uint);
      }
    }

    console.log('[fetchStakingState] User is opted in, stake:', userStake);

    // Global state
    const appInfo = await algod.getApplicationByID(PROTIUS_STAKING_APP_ID).do();
    const globalState = appInfo.params.globalState ?? [];
    let totalStake = 0n;

    for (const kv of globalState) {
      const key = new TextDecoder().decode(kv.key);
      if (key === "totalStaked" && kv.value?.uint !== undefined) {
        totalStake = BigInt(kv.value.uint);
      }
    }

    return { totalStake, userStake };
  } catch (err: any) {
    console.log('[fetchStakingState] Error:', err);
    if (err?.status === 404) {
      // User not opted in - return undefined for userStake
      console.log('[fetchStakingState] User NOT opted in (404)');
      return { totalStake: 0n, userStake: undefined };
    }
    throw err;
  }
}

/**
 * REAL ON-CHAIN TRANSACTIONS
 */

export async function optIn(
  activeAddress: string,
  transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>
): Promise<void> {
  if (PROTIUS_STAKING_APP_ID === 0) {
    throw new Error("VITE_PROTIUS_STAKING_APP_ID not configured");
  }

  const algod = getAlgodClient();
  const suggestedParams = await algod.getTransactionParams().do();

  // Call the ABI optIn() method with OnCompletion=OptIn to initialize local state
  const abiContract = new ABIContract(abiJson as any);
  const atcSigner: algosdk.TransactionSigner = (txns, indexes) =>
    transactionSigner(txns, indexes);

  const atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    appID: PROTIUS_STAKING_APP_ID,
    method: abiContract.getMethodByName("optIn"),
    sender: activeAddress,
    suggestedParams,
    signer: atcSigner,
    onComplete: algosdk.OnApplicationComplete.OptInOC,
    methodArgs: [],
  });

  const result = await atc.execute(algod, 4);
  console.log("[optIn] Transaction ID:", result.txIDs);
}

export async function stake(
  activeAddress: string,
  transactionSigner: (txns: algosdk.Transaction[], indexes: number[]) => Promise<Uint8Array[]>,
  amountInAlgo: number
): Promise<void> {
  if (!activeAddress || typeof activeAddress !== "string" || activeAddress.length !== 58) {
    throw new Error("Invalid or missing sender address");
  }
  if (!transactionSigner || typeof transactionSigner !== "function") {
    throw new Error("Transaction signer is not set or invalid");
  }
  if (!PROTIUS_STAKING_APP_ID || typeof PROTIUS_STAKING_APP_ID !== "number" || PROTIUS_STAKING_APP_ID <= 0) {
    throw new Error("Staking App ID is missing or invalid");
  }
  if (typeof amountInAlgo !== "number" || isNaN(amountInAlgo) || amountInAlgo <= 0) {
    throw new Error("Stake amount must be a positive number");
  }

  const sender = activeAddress;
  const amountMicroAlgos = algosdk.algosToMicroalgos(amountInAlgo);
  if (amountMicroAlgos <= 0) {
    throw new Error("Stake amount must be greater than zero");
  }

  const algod = getAlgodClient();
  let suggestedParams;
  try {
    suggestedParams = await algod.getTransactionParams().do();
  } catch (err) {
    throw new Error("Failed to fetch suggestedParams: " + ((err as any)?.message || err));
  }

  const abiContract = new ABIContract(abiJson as any);

  const atcSigner: algosdk.TransactionSigner = (txns, indexes) =>
    transactionSigner(txns, indexes);

  const appAddress = algosdk.getApplicationAddress(PROTIUS_STAKING_APP_ID);
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver: appAddress,
    amount: amountMicroAlgos,
    suggestedParams,
  });

  const atc = new AtomicTransactionComposer();
  atc.addTransaction({ txn: paymentTxn, signer: atcSigner });

  atc.addMethodCall({
    appID: PROTIUS_STAKING_APP_ID,
    method: abiContract.getMethodByName("stake"),
    sender,
    suggestedParams,
    signer: atcSigner,
    methodArgs: [amountMicroAlgos],
  });

  try {
    const result = await atc.execute(algod, 4);
    console.log("[stake] Transaction group sent. TxID:", result.txIDs);
  } catch (err) {
    throw new Error("Failed to execute staking transaction group: " + ((err as any)?.message || err));
  }
}
