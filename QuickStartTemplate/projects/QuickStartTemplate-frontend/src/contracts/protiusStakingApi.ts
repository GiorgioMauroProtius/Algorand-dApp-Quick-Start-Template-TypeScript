/**
 * Track A Demo Ledger for Protius Staking
 * ----------------------------------------
 * - Per-investor staking
 * - Per-investor payout mode (“cash” or “equity”)
 * - devCap = 1,000,000
 * - rewardPool = 1,000,000 (1:1 premium)
 * - Cash return = stake
 * - Equity credit = stake (premium)
 * - Cash-only mode = 2× payout, no equity
 */

export const isDemoMode = () => true;

export type ClaimMode = "cash" | "equity";

export type StakingState = {
  devCap: bigint;
  rewardPool: bigint;
  totalStake: bigint;
  userStake: bigint;
  userSharePct: number;
  projectedCashPayout: bigint;
  projectedEquityCredit: bigint;
  claimMode: ClaimMode;
};

type InternalLedger = {
  devCap: number;
  rewardPool: number;
  stakes: Record<string, number>;
  claimMode: Record<string, ClaimMode>;
};

const LS_KEY = "protius_demo_ledger_v2";

/* -------------------------------
   Ledger helpers
------------------------------- */

function loadLedger(): InternalLedger {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return JSON.parse(raw);

  const initial: InternalLedger = {
    devCap: 1_000_000,
    rewardPool: 1_000_000,
    stakes: {},
    claimMode: {}, // per-wallet payout preference
  };
  saveLedger(initial);
  return initial;
}

function saveLedger(ledger: InternalLedger) {
  localStorage.setItem(LS_KEY, JSON.stringify(ledger));
}

/* -------------------------------
   Core computation
------------------------------- */

function computeState(addr: string, ledger: InternalLedger): StakingState {
  const userStake = ledger.stakes[addr] ?? 0;
  const totalStake = Object.values(ledger.stakes).reduce((a, b) => a + b, 0);

  const share = totalStake > 0 ? (userStake / totalStake) * 100 : 0;
  const mode: ClaimMode = ledger.claimMode[addr] ?? "cash";

  let projectedCash = 0;
  let projectedEquity = 0;

  if (mode === "cash") {
    projectedCash = userStake * 2; // full 2× payout
    projectedEquity = 0;
  } else {
    projectedCash = userStake;     // capital only
    projectedEquity = userStake;   // premium becomes equity
  }

  return {
    devCap: BigInt(ledger.devCap),
    rewardPool: BigInt(ledger.rewardPool),
    totalStake: BigInt(totalStake),
    userStake: BigInt(userStake),
    userSharePct: share,
    projectedCashPayout: BigInt(projectedCash),
    projectedEquityCredit: BigInt(projectedEquity),
    claimMode: mode,
  };
}

/* -------------------------------
   Public API
------------------------------- */

export async function fetchStakingState(address: string): Promise<StakingState> {
  const ledger = loadLedger();
  return computeState(address, ledger);
}

export async function setPayoutMode(address: string, mode: ClaimMode) {
  const ledger = loadLedger();
  ledger.claimMode[address] = mode;
  saveLedger(ledger);
  return computeState(address, ledger);
}

export async function stake(address: string, amount: number) {
  const ledger = loadLedger();
  ledger.stakes[address] = (ledger.stakes[address] ?? 0) + amount;
  saveLedger(ledger);

  return {
    txId: `DEMO-${Math.random().toString(36).slice(2, 10)}`,
    newState: computeState(address, ledger),
  };
}

export async function withdraw(address: string, amount: number) {
  const ledger = loadLedger();
  const current = ledger.stakes[address] ?? 0;
  ledger.stakes[address] = Math.max(0, current - amount);
  saveLedger(ledger);

  return {
    txId: `DEMO-${Math.random().toString(36).slice(2, 10)}`,
    newState: computeState(address, ledger),
  };
}
