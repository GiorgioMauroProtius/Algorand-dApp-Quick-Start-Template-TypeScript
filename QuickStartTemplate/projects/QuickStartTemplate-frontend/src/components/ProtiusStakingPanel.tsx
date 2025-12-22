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
  const [amount, setAmount] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage("Failed to load staking state (stub mode).");
    } finally {
      setIsBusy(false);
    }
  };

  const parseAmountToMicroAlgos = (): bigint | null => {
    if (!amount) return null;
    const n = Number(amount);
    if (Number.isNaN(n) || n <= 0) return null;
    return BigInt(Math.round(n * 1_000_000));
  };

  const handleStake = async () => {
    if (!activeAddress) return setMessage("Connect wallet first.");
    const microAmount = parseAmountToMicroAlgos();
    if (!microAmount) return setMessage("Invalid amount.");

    try {
      setIsBusy(true);
      await stakeApi(activeAddress, microAmount);
      await loadState();
      setMessage("Stake sent (stub).");
    } catch {
      setMessage("Stake failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!activeAddress) return setMessage("Connect wallet first.");
    const microAmount = parseAmountToMicroAlgos();
    if (!microAmount) return setMessage("Invalid amount.");

    try {
      setIsBusy(true);
      await withdrawApi(activeAddress, microAmount);
      await loadState();
      setMessage("Withdraw sent (stub).");
    } catch {
      setMessage("Withdraw failed.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-slate-900/80 p-4 space-y-3 text-sm text-emerald-50">
      <p className="text-xs text-emerald-100/85">
        Protius staking panel (safe stub mode).
      </p>

      <div className="text-xs space-y-1">
        <div>Wallet: {activeAddress ?? "not connected"}</div>
        <div>
          Your stake:{" "}
          {stakingState ? Number(stakingState.userStake) / 1_000_000 : 0} ALGO
        </div>
      </div>

      <input
        type="number"
        step="0.000001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-md px-2 py-1 text-black"
        placeholder="Amount in ALGO"
      />

      <div className="flex gap-2">
        <button
          onClick={handleStake}
          disabled={isBusy}
          className="flex-1 bg-emerald-500 text-black rounded px-2 py-1"
        >
          Stake
        </button>
        <button
          onClick={handleWithdraw}
          disabled={isBusy}
          className="flex-1 border border-emerald-500 rounded px-2 py-1"
        >
          Withdraw
        </button>
      </div>

      {message && <p className="text-xs">{message}</p>}
    </div>
  );
};

export default ProtiusStakingPanel;
