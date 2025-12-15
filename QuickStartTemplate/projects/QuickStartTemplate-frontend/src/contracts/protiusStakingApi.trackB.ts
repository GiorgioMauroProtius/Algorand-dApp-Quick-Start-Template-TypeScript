/**
 * Track B – Project-Scoped Staking Ledger
 * --------------------------------------
 * Each project has its own staking pool.
 * Track A remains untouched and demo-safe.
 */

export type ClaimMode = "cash" | "hybrid" | "equity";

export type ProjectStakingState = {
  projectId: number;
  devCap: bigint;
  rewardPool: bigint;

  totalStake: bigint;
  userStake: bigint;
  userSharePct: number;

  projectedCashPayout: bigint;
  projectedEquityCredit: bigint;

  claimMode: ClaimMode;
};

type ProjectLedger = {
  devCap: number;
  rewardPool: number;
  stakes: Record<string, number>;
  claimMode: Record<string, ClaimMode>;
};

type TrackBLedger = Record<number, ProjectLedger>;

const LS_KEY_TRACK_B = "protius_project_ledgers_v1";

/* -------------------------------
   Storage helpers
-------------------------------- */

function loadLedgers(): TrackBLedger {
  const raw = localStorage.getItem(LS_KEY_TRACK_B);
  if (raw) return JSON.parse(raw);
  return {};
}

function saveLedgers(ledgers: TrackBLedger) {
  localStorage.setItem(LS_KEY_TRACK_B, JSON.stringify(ledgers));
}

/* -------------------------------
   Project initialisation
-------------------------------- */

function ensureProjectLedger(
  projectId: number,
  devCap: number
): ProjectLedger {
  const ledgers = loadLedgers();

  if (!ledgers[projectId]) {
    ledgers[projectId] = {
      devCap,
      rewardPool: devCap, // 1:1 dev premium
      stakes: {},
      claimMode: {},
    };
    saveLedgers(ledgers);
  }

  return ledgers[projectId];
}

/* -------------------------------
   Core computation logic
-------------------------------- */

function computeProjectState(
  projectId: number,
  address: string
): ProjectStakingState {
  const ledgers = loadLedgers();
  const ledger = ledgers[projectId];

  const userStake = ledger.stakes[address] ?? 0;
  const totalStake = Object.values(ledger.stakes).reduce((a, b) => a + b, 0);
  const share = totalStake > 0 ? (userStake / totalStake) * 100 : 0;

  const mode: ClaimMode = ledger.claimMode[address] ?? "cash";

  let projectedCash = 0;
  let projectedEquity = 0;

  switch (mode) {
    case "cash":
      projectedCash = userStake * 2;
      break;
    case "hybrid":
      projectedCash = userStake;
      projectedEquity = userStake;
      break;
    case "equity":
      projectedEquity = userStake * 2;
      break;
  }

  return {
    projectId,
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
   Public API (Track B)
-------------------------------- */

export async function fetchProjectStakingState(
  projectId: number,
  address: string,
  devCap: number
): Promise<ProjectStakingState> {
  ensureProjectLedger(projectId, devCap);
  return computeProjectState(projectId, address);
}

