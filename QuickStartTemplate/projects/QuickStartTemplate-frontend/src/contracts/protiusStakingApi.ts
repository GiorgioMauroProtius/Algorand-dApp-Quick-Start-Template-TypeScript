import algosdk from "algosdk";
import { getAlgodClient } from "../utils/algodClient";

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

    const localState =
      acctInfo.appLocalState?.keyValue ?? [];

    let userStake = 0n;

    for (const kv of localState) {
      const key = Buffer.from(kv.key).toString("utf8");
      if (key === "stake" && kv.value?.uint !== undefined) {
        userStake = BigInt(kv.value.uint);
      }
    }

    // ---- Global state ----
    const appInfo = await algod
      .getApplicationByID(PROTIUS_STAKING_APP_ID)
      .do();

    const globalState =
      appInfo.params.globalState ?? [];

    let totalStake = 0n;

    for (const kv of globalState) {
      const key = Buffer.from(kv.key).toString("utf8");
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
 * TRACK-C DEMO TXs (NO-OP)
 * ============================
 * Reads are REAL
 * Writes are UI placeholders
 */
export async function optIn(): Promise<void> {
  console.warn("[optIn] Track-C demo mode – no-op");
}

export async function stake(): Promise<void> {
  console.warn("[stake] Track-C demo mode – no-op");
}

export async function withdraw(): Promise<void> {
  console.warn("[withdraw] Track-C demo mode – no-op");
}
