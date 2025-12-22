import React, { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  fetchStakingState,
  stake as stakeApi,
  withdraw as withdrawApi,
  optIn,
  StakingState,
} from "../contracts/protiusStakingApi";

const ProtiusStakingPanel: React.FC = () => {
  const { activeAddress, isReady } = useWallet();

  const [stakingState, setStakingState] = useState<StakingState | null>(null);
  const [amount, setAmount] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Track-C logic:
  // If we can read local state → user is opted in
  const isOptedIn =
    stakingState !== null && stakingState.userStake !== undefined;

  useEffect(() => {
    if (isReady && activeAddress) {
      void loadState();
    } else {
      setStakingState(null);
    }
  }, [isReady, activeAddress]);

  const loadState = async () => {
    if (!activeAddress) return;
    try {
      setIsBusy(true);
      setMessage(null);
      const state = await fetchStakingState(activeAddress);
      setStakingState(state);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load staking state.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleOptIn = async () => {
    try {
      setIsBusy(true);
      setMessage(null);
      await optIn(); // Track-C no-op
      await loadState();
      setMessage(
        "Staking initialized (demo mode). On-chain opt-in required once."
      );
    } catch (err) {
      console.error("[ProtiusStakingPanel] Opt-in failed", err);
      setMessage("Opt-in failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleStake = async () => {
    try {
      setIsBusy(true);
      setMessage(null);
      await stakeApi(); // Track-C no-op
      setMessage(
        "Stake action submitted (demo). On-chain stake reflected once executed."
      );
    } catch (err) {
      console.error(err);
      setMessage("Stake failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsBusy(true);
      setMessage(null);
      await withdrawApi(); // Track-C no-op
      setMessage(
        "Withdraw action submitted (demo). On-chain withdraw reflected once executed."
      );
    } catch (err) {
      console.error(err);
      setMessage("Withdraw failed.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-slate-900/80 p-4 space-y-3 text-sm text-emerald-50">
      <p className="text-xs text-emerald-100/85">
        Protius staking panel (Algorand TestNet — Track-C demo).
      </p>

      <div className="text-xs space-y-1">
        <div>Wallet: {activeAddress ?? "not connected"}</div>
        <div>
          Your stake (on-chain):{" "}
          {stakingState
            ? Number(stakingState.userStake) / 1_000_000
            : 0}{" "}
          ALGO
        </div>
        <div>
          Total pool (on-chain):{" "}
          {stakingState
            ? Number(stakingState.totalStake) / 1_000_000
            : 0}{" "}
          ALGO
        </div>
      </div>

      {!isOptedIn && (
        <button
          type="button"
          onClick={handleOptIn}
          disabled={!activeAddress || isBusy}
          className="w-full rounded-md bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-40"
        >
          Initialize staking (demo)
        </button>
      )}

      <input
        type="number"
        step="0.000001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-md px-2 py-1 text-black"
        placeholder="Amount in ALGO (demo input)"
        disabled
      />

      <div className="flex gap-2">
        <button
          onClick={handleStake}
          disabled={!activeAddress || isBusy || !isOptedIn}
          className="flex-1 bg-emerald-500 text-black rounded px-2 py-1 disabled:opacity-40"
        >
          Stake
        </button>
        <button
          onClick={handleWithdraw}
          disabled={!activeAddress || isBusy || !isOptedIn}
          className="flex-1 border border-emerald-500 rounded px-2 py-1 disabled:opacity-40"
        >
          Withdraw
        </button>
      </div>

      {message && <p className="text-xs">{message}</p>}
    </div>
  );
};

export default ProtiusStakingPanel;
