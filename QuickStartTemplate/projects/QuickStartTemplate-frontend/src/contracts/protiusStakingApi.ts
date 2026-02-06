import algosdk from "algosdk";
import { getAlgodClient } from "../utils/algodClient";
import { ProtiusStakingClient } from "./ProtiusStakingClient";

// MUST match your deployed app
const PROTIUS_STAKING_APP_ID = Number(
  import.meta.env.VITE_PROTIUS_STAKING_APP_ID ?? "0"
);

export type StakingState = {
  totalStake: bigint; // microAlgos
  userStake: bigint;  // microAlgos
};

/**
 * ============================
 * READ STATE (REAL ON-CHAIN)
 * ============================
 */
export async function fetchStakingState(
  accountAddress: string
): Promise<StakingState> {
  const algod = getAlgodClient();

  try {
    // ---- Local (user) state ----
    const acctInfo = await algod
      .accountApplicationInformation(accountAddress, PROTIUS_STAKING_APP_ID)
      .do();

    const localState = acctInfo.appLocalState?.keyValue ?? [];
    let userStake = 0n;

    for (const kv of localState) {
      const key = Buffer.from(kv.key, "base64").toString("utf8");
      if (key === "stake" && kv.value?.uint !== undefined) {
        userStake = BigInt(kv.value.uint);
      }
    }

    // ---- Global state ----
    const appInfo = await algod
      .getApplicationByID(PROTIUS_STAKING_APP_ID)
      .do();

    const globalState = appInfo.params.globalState ?? [];
    let totalStake = 0n;

    for (const kv of globalState) {
      const key = Buffer.from(kv.key, "base64").toString("utf8");
      if (key === "total_stake" && kv.value?.uint !== undefined) {
        totalStake = BigInt(kv.value.uint);
      }
    }

    return { totalStake, userStake };
  } catch (err: any) {
    // User not opted in yet
    if (err?.status === 404) {
      return { totalStake: 0n, userStake: 0n };
    }
    throw err;
  }
}

/**
 * ============================
 * REAL ON-CHAIN TRANSACTIONS
 * ============================
 */

/**
 * Opt-in to the staking app (one-time)
 */
export async function optIn(
  activeAddress: string,
  signer: algosdk.TransactionSigner
): Promise<void> {
  if (PROTIUS_STAKING_APP_ID === 0) {
    throw new Error("VITE_PROTIUS_STAKING_APP_ID not configured");
  }

  const algod = getAlgodClient();
  const client = new ProtiusStakingClient(
    {
      sender: activeAddress,
      resolveBy: "id",
      id: PROTIUS_STAKING_APP_ID,
    },
    algod
  );

  const result = await client.optIn.optInToApplication({}, { sendParams: { signer } });
  console.log("[optIn] Transaction ID:", result.txIds[0]);
}

/**
 * Stake ALGO into the contract
 */
export async function stake(
  activeAddress: string,
  signer: algosdk.TransactionSigner,
  amountInAlgo: number
): Promise<void> {
  if (PROTIUS_STAKING_APP_ID === 0) {
    throw new Error("VITE_PROTIUS_STAKING_APP_ID not configured");
  }

  const algod = getAlgodClient();
  const client = new ProtiusStakingClient(
    {
      sender: activeAddress,
      resolveBy: "id",
      id: PROTIUS_STAKING_APP_ID,
    },
    algod
  );

  const amountMicroAlgos = BigInt(Math.floor(amountInAlgo * 1_000_000));

  // Create payment transaction to contract
  const suggestedParams = await algod.getTransactionParams().do();
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: activeAddress,
    to: algosdk.getApplicationAddress(PROTIUS_STAKING_APP_ID),
    amount: amountMicroAlgos,
    suggestedParams,
  });

  // Call stake method
  const result = await client.stake(
    { payment: paymentTxn },
    { sendParams: { signer } }
  );

  console.log("[stake] Transaction ID:", result.txIds[0]);
}

/**
 * Withdraw/Unstake ALGO from the contract
 */
export async function withdraw(
  activeAddress: string,
  signer: algosdk.TransactionSigner,
  amountInAlgo: number
): Promise<void> {
  if (PROTIUS_STAKING_APP_ID === 0) {
    throw new Error("VITE_PROTIUS_STAKING_APP_ID not configured");
  }

  const algod = getAlgodClient();
  const client = new ProtiusStakingClient(
    {
      sender: activeAddress,
      resolveBy: "id",
      id: PROTIUS_STAKING_APP_ID,
    },
    algod
  );

  const amountMicroAlgos = BigInt(Math.floor(amountInAlgo * 1_000_000));

  const result = await client.withdraw(
    { amount: amountMicroAlgos },
    { sendParams: { signer } }
  );

  console.log("[withdraw] Transaction ID:", result.txIds[0]);
}
