import React, { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  fetchProjectStakingState,
  ProjectStakingState,
  ClaimMode,
} from "../contracts/protiusStakingApi.trackB";

type Props = {
  projectId: number;
  devCap: number;
};

const MODE_LABELS: Record<ClaimMode, string> = {
  cash: "Cash (2× return)",
  hybrid: "Hybrid (1× cash + 1× equity)",
  equity: "Full Equity (2× equity)",
};

const ProjectStakingPanel: React.FC<Props> = ({ projectId, devCap }) => {
  const { activeAddress, isReady } = useWallet();
  const [state, setState] = useState<ProjectStakingState | null>(null);

  useEffect(() => {
    if (!isReady || !activeAddress) return;

    (async () => {
      const s = await fetchProjectStakingState(
        projectId,
        activeAddress,
        devCap
      );
      setState(s);
    })();
  }, [isReady, activeAddress, projectId, devCap]);

  if (!activeAddress) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-slate-900/60 p-4 text-xs text-emerald-200">
        Connect a wallet to view project staking.
      </div>
    );
  }

  if (!state) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-slate-900/60 p-4 text-xs text-emerald-200">
        Loading project staking…
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-slate-900/80 p-4 space-y-3 text-sm text-emerald-50">
      <h4 className="text-emerald-300 font-semibold text-sm">
        Project Staking (Track B)
      </h4>

      <div className="space-y-1 text-xs">
        <div>
          <span className="text-emerald-300">Development cap:</span>{" "}
          {Number(state.devCap).toLocaleString()} USDC
        </div>
        <div>
          <span className="text-emerald-300">Total staked:</span>{" "}
          {Number(state.totalStake).toLocaleString()} USDC
        </div>
        <div>
          <span className="text-emerald-300">Your stake:</span>{" "}
          {Number(state.userStake).toLocaleString()} USDC
        </div>
        <div>
          <span className="text-emerald-300">Your share:</span>{" "}
          {state.userSharePct.toFixed(2)}%
        </div>
      </div>

      <div className="space-y-1 pt-1 text-xs">
        <div>
          <span className="text-emerald-300">Payout mode:</span>{" "}
          {MODE_LABELS[state.claimMode]}
        </div>
        <div>
          <span className="text-emerald-300">Projected cash:</span>{" "}
          {Number(state.projectedCashPayout).toLocaleString()} USDC
        </div>
        <div>
          <span className="text-emerald-300">Projected equity:</span>{" "}
          {Number(state.projectedEquityCredit).toLocaleString()} USDC
        </div>
      </div>
    </div>
  );
};

export default ProjectStakingPanel;

