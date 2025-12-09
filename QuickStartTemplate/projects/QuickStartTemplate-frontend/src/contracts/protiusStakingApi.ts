// src/api/protiusStakingApi.ts
// Demo-mode “mock blockchain” for Protius staking.
// This file is meant to be the SINGLE interface the UI uses for staking logic.
//
// Later, when the real TestNet backend is live, we will:
//  - keep the function signatures unchanged
//  - replace the "DEMO_MODE" branches with real client calls to the ProtiusStaking app.

export type StakingState = {
  // Total staked in the pool (all users)
  totalStake: bigint;
  // Staked amount for the current user
  userStake: bigint;

  // Demo economics (these will later come from on-chain or config)
  devCap: bigint;
  rewardPool: bigint;

  // Derived values
  userSharePct: number;        // e.g. 8.25 (%)
  projectedReward: bigint;     // user’s share of rewardPool at FC

  // Last “transaction” info (for UX)
  lastTxHash?: string;
  lastTxType?: "stake" | "withdraw";
};

type DemoLedger = {
  totalStake: string; // bigint as string
  userStakes: Record<string, string>; // address -> bigint as string
  lastTxHash?: string;
  lastTxType?: "stake" | "withdraw";
};

// 🔧 Storage key for the mock ledger
const STORAGE_KEY = "protius-demo-staking-v1";

// 🔧 Demo economic parameters (can be overridden by env later if you like)
const DEMO_DEV_CAP =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_PROTIUS_DEVCAP_USDC
    ? BigInt(import.meta.env.VITE_PROTIUS_DEVCAP_USDC)
    : 1_000_000n; // 1,000,000 USDC (demo)

const DEMO_REWARD_POOL =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_PROTIUS_REWARDPOOL_USDC
    ? BigInt(import.meta.env.VITE_PROTIUS_REWARDPOOL_USDC)
    : 1_000_000n; // 1,000,000 USDC at FC (2x, 1x etc. – adjustable)

// 🔧 Future-friendly switch: today we ONLY support demo mode
// Later, when APP_ID is non-zero, we can route to real on-chain calls.
const APP_ID =
  typeof import.meta !== "undefined" &&
  import.meta.env &&
  import.meta.env.VITE_PROTIUS_STAKING_APP_ID
    ? Number(import.meta.env.VITE_PROTIUS_STAKING_APP_ID)
    : 0;

const DEMO_MODE = !APP_ID;

// Simple helper – can be used by the UI to show “Demo mode” badge
export function isDemoMode(): boolean {
  return DEMO_MODE;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getEmptyLedger(): DemoLedger {
  return {
    totalStake: "0",
    userStakes: {},
    lastTxHash: undefined,
    lastTxType: undefined,
  };
}

function loadLedger(): DemoLedger {
  if (typeof window === "undefined") return getEmptyLedger();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getEmptyLedger();
    const parsed = JSON.parse(raw);
    return {
      totalStake: typeof parsed.totalStake === "string" ? parsed.totalStake : "0",
      userStakes:
        parsed.userStakes && typeof parsed.userStakes === "object"
          ? parsed.userStakes
          : {},
      lastTxHash:
        typeof parsed.lastTxHash === "string" ? parsed.lastTxHash : undefined,
      lastTxType:
        parsed.lastTxType === "stake" || parsed.lastTxType === "withdraw"
          ? parsed.lastTxType
          : undefined,
    };
  } catch {
    return getEmptyLedger();
  }
}

function saveLedger(ledger: DemoLedger) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger));
  } catch {
    // ignore storage errors in demo
  }
}

function normaliseAmount(amount: bigint | number | string): bigint {
  if (typeof amount === "bigint") return amount;
  if (typeof amount === "number") return BigInt(Math.floor(amount));
  // string
  return BigInt(amount);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateFakeTxHash(): string {
  const random = Math.floor(Math.random() * 1e16)
    .toString(16)
    .padStart(16, "0");
  return `0xDEMO${random}`;
}

// ---------------------------------------------------------------------------
// Public API – this is what the UI should call
// ---------------------------------------------------------------------------

export async function fetchStakingState(
  account?: string | null,
): Promise<StakingState> {
  if (!DEMO_MODE) {
    // Safety: if someone accidentally sets an APP_ID before we wire live mode
    throw new Error(
      "Live mode not implemented yet – demo mode only. Please leave VITE_PROTIUS_STAKING_APP_ID unset or 0.",
    );
  }

  const ledger = loadLedger();
  const totalStake = BigInt(ledger.totalStake || "0");

  const userStake =
    account && ledger.userStakes[account]
      ? BigInt(ledger.userStakes[account])
      : 0n;

  const devCap = DEMO_DEV_CAP;
  const rewardPool = DEMO_REWARD_POOL;

  let userSharePct = 0;
  let projectedReward = 0n;

  if (totalStake > 0n && userStake > 0n) {
    // userSharePct with 2 decimal places
    const numerator = userStake * 10000n; // basis points
    const bps = Number(numerator / totalStake); // integer bps
    userSharePct = bps / 100; // e.g. 825 -> 8.25 %

    projectedReward = (rewardPool * userStake) / totalStake;
  }

  return {
    totalStake,
    userStake,
    devCap,
    rewardPool,
    userSharePct,
    projectedReward,
    lastTxHash: ledger.lastTxHash,
    lastTxType: ledger.lastTxType,
  };
}

export type StakeResult = {
  txId: string;
  newState: StakingState;
};

export async function stake(
  account: string | null | undefined,
  amount: bigint | number | string,
): Promise<StakeResult> {
  if (!DEMO_MODE) {
    throw new Error(
      "Live mode not implemented yet – demo mode only. Please leave VITE_PROTIUS_STAKING_APP_ID unset or 0.",
    );
  }
  if (!account) {
    throw new Error("No wallet connected.");
  }

  const amt = normaliseAmount(amount);
  if (amt <= 0n) {
    throw new Error("Stake amount must be greater than zero.");
  }

  // Simulate network delay
  await delay(1200);

  const ledger = loadLedger();
  const currentTotal = BigInt(ledger.totalStake || "0");
  const currentUserStake = ledger.userStakes[account]
    ? BigInt(ledger.userStakes[account])
    : 0n;

  const newUserStake = currentUserStake + amt;
  const newTotal = currentTotal + amt;

  ledger.userStakes[account] = newUserStake.toString();
  ledger.totalStake = newTotal.toString();
  ledger.lastTxHash = generateFakeTxHash();
  ledger.lastTxType = "stake";

  saveLedger(ledger);

  const newState = await fetchStakingState(account);
  return {
    txId: newState.lastTxHash || "",
    newState,
  };
}

export async function withdraw(
  account: string | null | undefined,
  amount: bigint | number | string,
): Promise<StakeResult> {
  if (!DEMO_MODE) {
    throw new Error(
      "Live mode not implemented yet – demo mode only. Please leave VITE_PROTIUS_STAKING_APP_ID unset or 0.",
    );
  }
  if (!account) {
    throw new Error("No wallet connected.");
  }

  const amt = normaliseAmount(amount);
  if (amt <= 0n) {
    throw new Error("Withdraw amount must be greater than zero.");
  }

  // Simulate network delay
  await delay(1200);

  const ledger = loadLedger();
  const currentTotal = BigInt(ledger.totalStake || "0");
  const currentUserStake = ledger.userStakes[account]
    ? BigInt(ledger.userStakes[account])
    : 0n;

  if (amt > currentUserStake) {
    throw new Error("Cannot withdraw more than your current stake.");
  }

  const newUserStake = currentUserStake - amt;
  const newTotal = currentTotal - amt;

  ledger.userStakes[account] = newUserStake.toString();
  ledger.totalStake = newTotal.toString();
  ledger.lastTxHash = generateFakeTxHash();
  ledger.lastTxType = "withdraw";

  saveLedger(ledger);

  const newState = await fetchStakingState(account);
  return {
    txId: newState.lastTxHash || "",
    newState,
  };
}
