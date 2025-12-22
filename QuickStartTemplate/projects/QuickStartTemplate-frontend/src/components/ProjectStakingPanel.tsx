import React, { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  fetchStakingState,
  stake as stakeApi,
  withdraw as withdrawApi,
  StakingState,
} from "../contracts/protiusStakingApi";

const ProtiusStakingPanel: React.FC = () => {
  const { activeAddress, isReady } = useWallet();

  const [stakingState, setStakingState] = useState<StakingState | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && activeAddress) {
      void loadState();
    } else {
      setStakingState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, activeAddress]);

  const loadState = async () => {
    if (!activeAddress) return;
    try {
      setIsBusy(true);
      setMessage(null);
      const state = await fetchStakingState(activeAddress);
      setStakingState(state);
    } catch (err) {
      console.error("[ProtiusStakingPanel] Failed to fetch staking state", err);
      setMessage("Unable to load staking state (stub mode).");
    } finally {
      setIsBusy(false);
    }
  };

  const parseAmountToMicroAlgos = (): bigint | null => {
    const trimmed = amount.trim();
    if (!trimmed) return null;
    const asNumber = Number(trimmed.replace(",", "."));
    if (Number.isNaN(asNumber) || asNumber <= 0) return null;
    return BigInt(Math.round(asNumber * 1_000_000));
  };

  const handleStake = async () => {
    if (!activeAddress) {
      setMessage("Connect a wallet first.");
      return;
    }

    const microAmount = parseAmountToMicroAlgos();
    if (microAmount === null) {
      setMessage("Enter a valid amount (in ALGO).");
      return;
    }

    try {
      setIsBusy(true);
      setMessage(null);
      await stakeApi(activeAddress, microAmount);
      await loadState();
      setMessage("Stake call sent (stub mode).");
    } catch (err) {
      console.error("[ProtiusStakingPanel] Stake failed", err);
      setMessage("Stake failed (stub mode).");
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!activeAddress) {
      setMessage("Connect a wallet first.");
      return;
    }

    const microAmount = parseAmountToMicroAlgos();
    if (microAmount === null) {
      setMessage("Enter a valid amount (in ALGO).");
      return;
    }

    try {
      setIsBusy(true);
      setMessage(null);
      await withdrawApi(activeAddress, microAmount);
      await loadState();
      setMessage("Withdraw call sent (stub mode).");
    } catch (err) {
      console.error("[ProtiusStakingPanel] Withdraw failed", err);
      setMessage("Withdraw failed (stub mode).");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-slate-900/80 p-4 space-y-3 text-sm text-emerald-50">
      <p className="text-xs text-emerald-100/85">
        Protius staking panel (safe stub mode – no on-chain calls yet).
      </p>

      <div className="text-xs text-emerald-200/90 space-y-1">
        <div>
          Wallet status:{" "}
          {isReady ? (
            <span className="text-emerald-300 font-semibold">ready</span>
          ) : (
            <span className="text-amber-300 font-semibold">not initialised</span>
          )}
        </div>
        <div className="break-all">
          Connected address:{" "}
          {activeAddress ? (
            <span className="font-mono text-emerald-200">{activeAddress}</span>
          ) : (
            <span className="text-emerald-300/80">none</span>
          )}
        </div>
      </div>

      <div className="rounded-md border border-emerald-500/20 bg-slate-950/60 px-3 py-2 text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>Total stake:</span>
          <span>
            {stakingState ? Number(stakingState.totalStake) / 1_000_000 : 0} ALGO
          </span>
        </div>
        <div className="flex justify-between">
          <span>Your stake:</span>
          <span>
            {stakingState ? Number(stakingState.userStake) / 1_000_000 : 0} ALGO
          </span>
        </div>
      </div>

      <div className="space-y-2 text-[11px]">
        <input
          type="number"
          min="0"
          step="0.000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-md border border-emerald-500/30 bg-slate-950/60 px-2 py-1 text-xs text-emerald-50"
          placeholder="Amount in ALGO"
        />

        <div className="flex gap-2">
          <button
            onClick={handleStake}
            disabled={!activeAddress || isBusy}
            className="flex-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-slate-950 disabled:opacity-40"
          >
            Stake (stub)
          </button>
          <button
            onClick={handleWithdraw}
            disabled={!activeAddress || isBusy}
            className="flex-1 rounded-md border border-emerald-500 px-2 py-1 text-xs font-semibold text-emerald-100 disabled:opacity-40"
          >
            Withdraw (stub)
          </button>
        </div>

        {message && <p className="text-emerald-200">{message}</p>}
      </div>
    </div>
  );
};

export default ProtiusStakingPanel;


