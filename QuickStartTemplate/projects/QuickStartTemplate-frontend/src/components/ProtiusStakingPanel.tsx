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
  const { activeAddress, isReady, transactionSigner } = useWallet();

  const [stakingState, setStakingState] = useState<StakingState | null>(null);
  const [amount, setAmount] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isOptedIn =
    stakingState !== null && stakingState.userStake !== undefined;

  console.log('[ProtiusStakingPanel] stakingState:', stakingState);
  console.log('[ProtiusStakingPanel] isOptedIn:', isOptedIn);

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
    if (!activeAddress || !transactionSigner) {
      setMessage("Wallet not connected.");
      return;
    }

    try {
      setIsBusy(true);
      setMessage("Sending opt-in transaction...");
      await optIn(activeAddress, transactionSigner);
      await loadState();
      setMessage("✅ Opted in successfully!");
    } catch (err: any) {
      console.error("[ProtiusStakingPanel] Opt-in failed", err);
      setMessage(`Opt-in failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStake = async () => {
    if (!activeAddress || !transactionSigner) {
      setMessage("Wallet not connected.");
      return;
    }
    if (!isOptedIn) {
      setMessage("You must opt-in before staking.");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }
    try {
      setIsBusy(true);
      setMessage("Sending stake transaction...");
      await stakeApi(activeAddress, transactionSigner, amountNum);
      await loadState(); // Refresh state after stake
      setAmount("");
      setMessage(`✅ Staked ${amountNum} ALGO successfully!`);
    } catch (err: any) {
      console.error(err);
      // Error handling for common cases
      if (err.message?.includes("not opted-in")) {
        setMessage("Stake failed: You must opt-in before staking.");
      } else if (err.message?.includes("insufficient funds") || err.message?.includes("min balance")) {
        setMessage("Stake failed: Insufficient funds or minimum balance not met.");
      } else if (err.message?.includes("group size") || err.message?.includes("group index") || err.message?.includes("rejected")) {
        setMessage("Stake failed: Transaction rejected (group size/order).");
      } else {
        setMessage(`Stake failed: ${err.message || "Unknown error"}`);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!activeAddress || !transactionSigner) {
      setMessage("Wallet not connected.");
      return;
    }
    if (!isOptedIn) {
      setMessage("You must opt-in before withdrawing.");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }
    try {
      setIsBusy(true);
      setMessage("Sending withdraw transaction...");
      await withdrawApi(activeAddress, transactionSigner, amountNum);
      await loadState(); // Refresh state after withdraw
      setAmount("");
      setMessage(`✅ Withdrew ${amountNum} ALGO successfully!`);
    } catch (err: any) {
      console.error(err);
      // Error handling for common cases
      if (err.message?.includes("not opted-in")) {
        setMessage("Withdraw failed: You must opt-in before withdrawing.");
      } else if (err.message?.includes("insufficient funds") || err.message?.includes("min balance")) {
        setMessage("Withdraw failed: Insufficient funds or minimum balance not met.");
      } else if (err.message?.includes("group size") || err.message?.includes("group index") || err.message?.includes("rejected")) {
        setMessage("Withdraw failed: Transaction rejected (group size/order).");
      } else {
        setMessage(`Withdraw failed: ${err.message || "Unknown error"}`);
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-slate-900/80 p-4 space-y-3 text-sm text-emerald-50">
      <p className="text-xs text-emerald-100/85 font-semibold">
        🟢 Protius Staking (Algorand TestNet - LIVE)
      </p>

      <div className="text-xs space-y-1">
        <div>Wallet: {activeAddress ?? "not connected"}</div>
        <div>
          Your stake:{" "}
          <span className="font-mono">
            {stakingState && stakingState.userStake !== undefined
              ? Number(stakingState.userStake) / 1_000_000
              : 0} ALGO
          </span>
        </div>
        <div>
          Total pool:{" "}
          <span className="font-mono">
            {stakingState ? Number(stakingState.totalStake) / 1_000_000 : 0} ALGO
          </span>
        </div>
      </div>

      {!isOptedIn && (
        <button
          type="button"
          onClick={handleOptIn}
          disabled={!activeAddress || isBusy}
          className="w-full rounded-md bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-40"
        >
          {isBusy ? "Processing..." : "Opt-in to Staking"}
        </button>
      )}

      <input
        type="number"
        step="0.1"
        min="0.1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-md px-2 py-1 text-black"
        placeholder="Amount in ALGO"
        disabled={!isOptedIn || isBusy}
      />

      <div className="flex gap-2">
        <button
          onClick={handleStake}
          disabled={!activeAddress || isBusy || !isOptedIn}
          className="flex-1 bg-emerald-500 text-black rounded px-2 py-1 font-semibold hover:bg-emerald-400 disabled:opacity-40"
        >
          {isBusy ? "⏳" : "Stake"}
        </button>
        <button
          onClick={handleWithdraw}
          disabled={!activeAddress || isBusy || !isOptedIn}
          className="flex-1 border border-emerald-500 rounded px-2 py-1 hover:bg-emerald-500/20 disabled:opacity-40"
        >
          {isBusy ? "⏳" : "Withdraw"}
        </button>
      </div>

      {message && (
        <p className={`text-xs ${message.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ProtiusStakingPanel;
