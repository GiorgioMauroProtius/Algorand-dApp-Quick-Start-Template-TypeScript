// QuickStartTemplate/projects/QuickStartTemplate-frontend/src/contracts/protiusStakingApi.ts

/**
 * Front-end API wrapper for the Protius staking contract.
 *
 * IMPORTANT:
 * - This file is written by us and is safe to edit.
 * - The auto-generated ProtiusStaking.ts client MUST NOT be edited.
 *
 * For now, these functions are stubs: they just log to the console.
 * Once we have the deployed app ID and are ready to wire in Algorand,
 * we'll import the generated ProtiusStaking client here and replace the
 * console.log() calls with real on-chain interactions.
 */

export type StakingState = {
  totalStake: bigint; // total pool stake (microAlgos)
  userStake: bigint;  // stake for the connected user (microAlgos)
};

/**
 * Fetch current staking state for a given account.
 * Currently returns zeros as a placeholder.
 */
export async function fetchStakingState(
  accountAddress: string
): Promise<StakingState> {
  console.log(
    "[protiusStakingApi] TODO: fetch state from chain for",
    accountAddress
  );

  // Placeholder: no on-chain calls yet
  return {
    totalStake: 0n,
    userStake: 0n,
  };
}

/**
 * Stake a given amount (in microAlgos) for the given account.
 * Currently just logs to the console.
 */
export async function stake(
  accountAddress: string,
  amount: bigint
): Promise<void> {
  console.log(
    "[protiusStakingApi] TODO: stake on-chain",
    amount.toString(),
    "microAlgos for",
    accountAddress
  );

  // Placeholder: real Algorand transaction will be added later.
}

/**
 * Withdraw a given amount (in microAlgos) for the given account.
 * Currently just logs to the console.
 */
export async function withdraw(
  accountAddress: string,
  amount: bigint
): Promise<void> {
  console.log(
    "[protiusStakingApi] TODO: withdraw on-chain",
    amount.toString(),
    "microAlgos for",
    accountAddress
  );

  // Placeholder: real Algorand transaction will be added later.
}
