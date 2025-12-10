// src/contracts/protiusStakingApi.ts

/**
 * This file implements Track A ("Demo Mode"):
 * A mock blockchain ledger that simulates the staking contract logic.
 * No real network calls. All state is persisted in localStorage.
 */

export const isDemoMode = () => true;

/* -------------------------------
   Types
------------------------------- */
export type StakingState = {
  devCap: bigint;
  rewardPool: bigint;
  totalStake: bigint;
  userStake: bigint;
  userSharePct: number;        // 0–100
  projectedReward: bigint;
};

type InternalLedger = {
  devCap: number;
  rewardPool: number;
  stakes: Record<string, number>; // address → number (USDC)
};

/* -------------------------------
   Local ledger storage helpers
------------------------------- */

const LS_KEY = "protius_demo_ledger";

function loadLedger(): InternalLedger {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    return JSON.parse(raw);
  }

  // initial ledger with example values
  const initial: InternalLedger = {
    devCap: 1000000,      // 1,000,000 USDC target
    rewardPool: 1000000,  // 1,000,000 reward at FC
    stakes: {},
  };
  localStorage.setItem(LS_KEY, JSON.stringify(initial));
  return initial;
}

function saveLedger(ledger: InternalLedger) {
  localStorage.setItem(LS_KEY, JSON.stringify(ledger));
}

/* -------------------------------
   State computation
------------------------------- */

function computeState(addr: string, ledger: InternalLedger): StakingState {
  const userStake = ledger.stakes[addr] ?? 0;
  const totalStake = Object.values(ledger.stakes).reduce((a, b) => a + b, 0);

  const userShare = totalStake > 0 ? (userStake / totalStake) * 100 : 0;
  const projectedReward =
    totalStake > 0 ? (userStake / totalStake) * ledger.rewardPool : 0;

  return {
    devCap: BigInt(ledger.devCap),
    rewardPool: BigInt(ledger.rewardPool),
    totalStake: BigInt(totalStake),
    userStake: BigInt(userStake),
    userSharePct: userShare,
    projectedReward: BigInt(Math.round(projectedReward)),
  };
}

/* -------------------------------
   API: Fetch state for user
------------------------------- */

export async function fetchStakingState(
  address: string
): Promise<StakingState> {
  const ledger = loadLedger();
  return computeState(address, ledger);
}

/* -------------------------------
   API: Stake
------------------------------- */

export async function stake(address: string, amount: number) {
  const ledger = loadLedger();

  // add stake
  ledger.stakes[address] = (ledger.stakes[address] ?? 0) + amount;

  saveLedger(ledger);

  const newState = computeState(address, ledger);

  const txId = `DEMO-${Math.random().toString(36).slice(2, 10)}`;

  return { txId, newState };
}

/* -------------------------------
   API: Withdraw
------------------------------- */

export async function withdraw(address: string, amount: number) {
  const ledger = loadLedger();

  const current = ledger.stakes[address] ?? 0;

  const newAmount = Math.max(current - amount, 0);

  ledger.stakes[address] = newAmount;

  saveLedger(ledger);

  const newState = computeState(address, ledger);

  const txId = `DEMO-${Math.random().toString(36).slice(2, 10)}`;

  return { txId, newState };
}
