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
      const key = new TextDecoder().decode(kv.key);
      if (key === "s" && kv.value?.uint !== undefined) {
        userStake = BigInt(kv.value.uint);
      }
    }

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

  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    sender: activeAddress,
    appIndex: PROTIUS_STAKING_APP_ID,
    suggestedParams,
  });

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

  // ABI method selector for stake(uint64)void
  const stakeMethodSelector = new Uint8Array([0xfa, 0x9d, 0x92, 0xf5]);
  
  // Encode the amount as uint64 (8 bytes, big-endian)
  const amountBuffer = new ArrayBuffer(8);
  const amountView = new DataView(amountBuffer);
  amountView.setBigUint64(0, amountMicroAlgos, false); // false = big-endian
  
  // Combine selector + encoded amount
  const appArgs = new Uint8Array(stakeMethodSelector.length + 8);
  appArgs.set(stakeMethodSelector, 0);
  appArgs.set(new Uint8Array(amountBuffer), stakeMethodSelector.length);

  // App call to stake method (ABI format)
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    sender: activeAddress,
    appIndex: PROTIUS_STAKING_APP_ID,
    appArgs: [appArgs],
    suggestedParams,
  });

  // Sign and send (single transaction, not grouped)
  const signedTxns = await transactionSigner([appCallTxn], [0]);
  const response = await algod.sendRawTransaction(signedTxns).do();
  const txId = response.txid;
  await algosdk.waitForConfirmation(algod, txId, 4);
  
  console.log("[stake] Transaction ID:", txId);
}
