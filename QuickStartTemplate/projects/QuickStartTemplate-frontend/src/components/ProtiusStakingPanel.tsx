import React, { useEffect, useState } from "react";
import {
  fetchStakingState,
  setPayoutMode,
  stake,
  withdraw,
  ClaimMode,
  StakingState,
} from "../contracts/protiusStakingApi";
import { useWallet } from "@txnlab/use-wallet-react";

const MODE_LABELS: Record<ClaimMode, string> = {
  cash: "Cash (2× return)",
  hybrid: "Hybrid (1× cash + 1× equity)",
  equity: "Full Equity (2× equity)",
};

const ProtiusStakingPanel: React.FC = () => {
  const { activeAddress, isReady } = useWallet();

  const [state, setState] = useState<StakingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [stakeInput, setStakeInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");

  /* -----------------------------------------
     Load staking state whenever wallet changes
  ----------------------------------------- */
  useEffect(() => {
    if (!isReady || !activeAddress) return;

    (async () => {
      const s = await fetchStakingState(activeAddress);
      setState(s);
    })();
  }, [isReady, activeAddress]);

  /* -----------------------------------------
     Handlers
  ----------------------------------------- */

  const handleChangeMode = async (mode: ClaimMode) => {
    if (!activeAddress) return;
    setLoading(true);
    const s = await setPayoutMode(activeAddress, mode);
    setState(s);
    setLoading(false);
  };

  const handleStake = async () => {
    if (!activeAddress) return;

    const amt = Number(stakeInput.replace(/,/g, ""));
    if (!amt || amt <= 0) {
      alert("Enter a positive number.");
      return;
    }

    setLoading(true);
    const res = await stake(activeAddress, amt);
    setState(res.newState);
    setStakeInput("");
    setLoading(false);
  };

  const handleWithdraw = async () => {
    if (!activeAddress) return;

    const amt = Number(withdrawInput.replace(/,/g, ""));
    if (!amt || amt <= 0) {
      alert("Enter a positive number.");
      return;
    }

    setLoading(true);
    const res = await withdraw(activeAddress, amt);
    setState(res.newState);
    setWithdrawInput("");
    setLoading(false);
  };

  /* -----------------------------------------
     Render
  ----------------------------------------- */

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-slate-900/80 p-4 space-y-4 text-sm text-emerald-50 shadow-xl">
      <h3 className="text-emerald-300 font-semibold text-base">
        🔗 Protius Staking Panel (Track A Demo)
      </h3>

      {!activeAddress ? (
        <p className="text-xs text-emerald-200">
          Connect a wallet to start staking.
        </p>
      ) : !state ? (
        <p className="text-xs text-emerald-200">Loading staking data…</p>
      ) : (
        <>
          {/* WALLET STATE SUMMARY */}
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-emerald-300">Your stake:</span>{" "}
              {Number(state.userStake).toLocaleString()} USDC
            </div>
            <div>
              <span className="text-emerald-300">Your share:</span>{" "}
              {state.userSharePct.toFixed(2)}%
            </div>
          </div>

          {/* PAYOUT MODE SELECTOR */}
          <div className="space-y-2">
            <div className="text-xs text-emerald-300">Payout preference:</div>
            <select
              value={state.claimMode}
              onChange={(e) => handleChangeMode(e.target.value as ClaimMode)}
              disabled={loading}
              className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-100"
            >
              <option value="cash">{MODE_LABELS.cash}</option>
              <option value="hybrid">{MODE_LABELS.hybrid}</option>
              <option value="equity">{MODE_LABELS.equity}</option>
            </select>
          </div>

          {/* PROJECTED PAYOUTS */}
          <div className="space-y-1 pt-1 text-xs">
            <div>
              <span className="text-emerald-300">Cash payout at FC:</span>{" "}
              {Number(state.projectedCashPayout).toLocaleString()} USDC
            </div>
            <div>
              <span className="text-emerald-300">Equity credit:</span>{" "}
              {Number(state.projectedEquityCredit).toLocaleString()} USDC
            </div>
          </div>

          {/* STAKE INPUT */}
          <div className="grid grid-cols-[1fr,auto] gap-3 items-end">
            <div>
              <label className="block text-[11px] font-medium mb-1 text-emerald-100">
                Stake amount (demo USDC)
              </label>
              <input
                className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-50"
                value={stakeInput}
                onChange={(e) => setStakeInput(e.target.value)}
                placeholder="100"
              />
            </div>

            <button
              onClick={handleStake}
              disabled={loading}
              className="rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-1.5"
            >
              Stake
            </button>
          </div>

          {/* WITHDRAW INPUT */}
          <div className="grid grid-cols-[1fr,auto] gap-3 items-end">
            <div>
              <label className="block text-[11px] font-medium mb-1 text-emerald-100">
                Withdraw amount (demo)
              </label>
              <input
                className="w-full rounded-md bg-slate-900/80 border border-red-500/40 px-3 py-1.5 text-sm text-emerald-50"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
                placeholder="50"
              />
            </div>

            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="rounded-md bg-red-500 hover:bg-red-400 text-slate-950 font-semibold text-xs px-4 py-1.5"
            >
              Withdraw
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProtiusStakingPanel;
