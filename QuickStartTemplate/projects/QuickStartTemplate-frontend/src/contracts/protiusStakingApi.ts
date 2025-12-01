/**
 * Front-end API wrapper for the Protius staking contract.
 *
 * IMPORTANT:
 * - This file is written by us and is safe to edit.
 * - The auto-generated ProtiusStakingClient.ts file MUST NOT be edited.
 *
 * For now, these functions are stubs: they just log to the console.
 * Once we have the deployed app ID and are ready to wire in Algorand,
 * we'll import the generated ProtiusStakingClient and replace the
 * console.log() calls with real on-chain interactions.
 */

export type StakingState = {
  totalStake: bigint;  // total pool stake (microAlgos)
  userStake: bigint;   // stake for the connected user (microAlgos)
};

/**
 * Fetch current staking state for a given account.
 * Currently returns zeros as a placeholder.
 */
export async function fetchStakingState(
  accountAddress: string
): Promise<StakingState> {
  console.log(
    "[ProtiusStakingApi] TODO: fetch state from chain for",
    accountAddress
  );

  return {
    totalStake: 0n,
    userStake: 0n,
  };
}
