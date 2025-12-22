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
    // Local (user) state → proves opt-in + stake
    const acctInfo = await algod
      .accountApplicationInformation(accountAddress, PROTIUS_STAKING_APP_ID)
      .do();

    const localState = acctInfo["app-local-state"]?.["key-value"] ?? [];

    let userStake = 0n;

    for (const kv of localState) {
      const key = Buffer.from(kv.key, "base64").toString();
      if (key === "stake") {
        userStake = BigInt(kv.value.uint);
      }
    }

    // Global state → total pool
    const appInfo = await algod
      .getApplicationByID(PROTIUS_STAKING_APP_ID)
      .do();

    const globalState = appInfo.params["global-state"] ?? [];

    let totalStake = 0n;

    for (const kv of globalState) {
      const key = Buffer.from(kv.key, "base64").toString();
      if (key === "total_stake") {
        totalStake = BigInt(kv.value.uint);
      }
    }

    return { totalStake, userStake };
  } catch (err: any) {
    // Not opted in yet
    if (err?.status === 404) {
      return { totalStake: 0n, userStake: 0n };
    }
    throw err;
  }
}

/**
 * ============================
 * OPTION B – SIMPLIFIED OPT-IN
 * ============================
 * (Handled in UI later via useWallet)
 */
export async function optIn(): Promise<void> {
  console.warn(
    "[optIn] Signing handled at UI layer (Track-C demo mode)"
  );
}

/**
 * ============================
 * STAKE (placeholder)
 * ============================
 */
export async function stake(): Promise<void> {
  console.warn(
    "[stake] Signing handled at UI layer (Track-C demo mode)"
  );
}

/**
 * ============================
 * WITHDRAW (placeholder)
 * ============================
 */
export async function withdraw(): Promise<void> {
  console.warn(
    "[withdraw] Signing handled at UI layer (Track-C demo mode)"
  );
}
