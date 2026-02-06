import algosdk from "algosdk";
import { getAlgodClient } from "../utils/algodClient";

// MUST match your deployed app
const PROTIUS_STAKING_APP_ID = Number(
  import.meta.env.VITE_PROTIUS_STAKING_APP_ID ?? "0"
);

export type StakingState = {
  totalStake: bigint;
  userStake: bigint;
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

    const localState = acctInfo.appLocalState?.keyValue ?? [];
    let userStake = 0n;

    for (const kv of localState) {
      // kv.key is Uint8Array
      const key = new TextDecoder().decode(kv.key);
      if (key === "stake" && kv.value?.uint !== undefined) {
        userStake = BigInt(kv.value.uint);
      }
    }

    // Global state
    const appInfo = await algod.getApplicationByID(PROTIUS_STAKING_APP_ID).do();
    const globalState = appInfo.params.globalState ?? [];
    let totalStake = 0n;

    for (const kv of globalState) {
      // kv.key is Uint8Array
      const key = new TextDecoder().decode(kv.key);
      if (key === "total_stake" && kv.value?.uint !== undefined) {
        totalStake = BigInt(kv.value.uint);
      }
    }

    return { totalStake, userStake };
  } catch (err: any) {
    if (err?.status === 404) {
      return { totalStake: 0n, userStake: 0n };
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

  // Create opt-in transaction
  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    sender: activeAddress,
    appIndex: PROTIUS_STAKING_APP_ID,
    suggestedParams,
  });

  // Sign and send
  const signedTxns = await transactionSigner([optInTxn], [0]);
  const response = await algod.sendRawTransaction(signedTxns).do();
  const txId = response.txid;
  await algosdk.waitForConfirmation(algod, txId, 4);
  
  console.log("[optIn] Transaction ID:", txId);
}

export async function stake(
  activeAddress: string,
  transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>,
  amountInAlgo: number
): Promise<void> {
  if (PROTIUS_STAKING_APP_ID === 0) {
    throw new Error("VITE_PROTIUS_STAKING_APP_ID not configured");
  }

  const algod = getAlgodClient();
  const suggestedParams = await algod.getTransactionParams().do();
  const amountMicroAlgos = BigInt(Math.floor(amountInAlgo * 1_000_000));

  // Payment to contract
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: activeAddress,
    receiver: algosdk.getApplicationAddress(PROTIUS_STAKING_APP_ID),
    amount: amountMicroAlgos,
    suggestedParams,
  });

  // App call to stake method
  const encoder = new TextEncoder();
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: activeAddress,
    appIndex: PROTIUS_STAKING_APP_ID,
    appArgs: [encoder.encode("stake")],
    suggestedParams,
  });

  // Group transactions
  const txnGroup = algosdk.assignGroupID([paymentTxn, appCallTxn]);
  
  // Sign and send
  const signedTxns = await transactionSigner(txnGroup, [0, 1]);
  const response = await algod.sendRawTransaction(signedTxns).do();
  const txId = response.txid;
  await algosdk.waitForConfirmation(algod, txId, 4);
  
  console.log("[stake] Transaction ID:", txId);
}

export async function withdraw(
  activeAddress: string,
  transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>,
  amountInAlgo: number
): Promise<void> {
  if (PROTIUS_STAKING_APP_ID === 0) {
    throw new Error("VITE_PROTIUS_STAKING_APP_ID not configured");
  }

  const algod = getAlgodClient();
  const suggestedParams = await algod.getTransactionParams().do();
  const amountMicroAlgos = BigInt(Math.floor(amountInAlgo * 1_000_000));

  // Encode amount as big-endian uint64
  const amountBytes = new Uint8Array(8);
  const view = new DataView(amountBytes.buffer);
  view.setBigUint64(0, amountMicroAlgos, false);

  // App call to withdraw method
  const encoder = new TextEncoder();
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: activeAddress,
    appIndex: PROTIUS_STAKING_APP_ID,
    appArgs: [
      encoder.encode("withdraw"),
      amountBytes,
    ],
    suggestedParams,
  });

  // Sign and send
  const signedTxns = await transactionSigner([appCallTxn], [0]);
  const response = await algod.sendRawTransaction(signedTxns).do();
  const txId = response.txid;
  await algosdk.waitForConfirmation(algod, txId, 4);
  
  console.log("[withdraw] Transaction ID:", txId);
}
