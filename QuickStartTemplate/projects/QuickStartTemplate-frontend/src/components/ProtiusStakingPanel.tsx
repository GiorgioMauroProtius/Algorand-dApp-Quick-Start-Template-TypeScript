import React, { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import {
  fetchStakingState,
  stake as stakeApi,
  withdraw as withdrawApi,
  setPayoutMode,
  isDemoMode,
  type StakingState,
  type ClaimMode,
} from "../contracts/protiusStakingApi";

/* -------------------------------
   Formatting helpers
------------------------------- */
const formatBigInt = (value: bigint): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/* -------------------------------
   Main Component
------------------------------- */
const ProtiusStakingPanel: React.FC = () => {
  const { activeAddress, isReady } = useWallet();

  const [stakingState, setStakingState] = useState<StakingState | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const demo = isDemoMode();

  /* -------------------------------
     Load staking state
  ------------------------------- */
  useEffect(() => {
    if (!isReady || !activeAddress) {
      setStakingState(null);
      setMessage(null);
      setError(null);
      return;
    }

    (async () => {
      await loadState();
    })();
  }, [isReady, activeAddress]);

  const loadState = async () => {
    if (!activeAddress) return;
    try {
      setIsBusy(true);
      setError(null);
      const state = await fetchStakingState(activeAddress);
      setStakingState(state);
    } catch (err) {
      console.error("[ProtiusStakingPanel] Failed to fetch staking state", err);
      setError("Unable to load staking state.");
    } finally {
      setIsBusy(false);
    }
  };

  /* -------------------------------
     Parsing helpers
  ------------------------------- */
  const parseAmount = (): number | null => {
    const trimmed = amount.trim();
    if (!trimmed) return null;
    const asNumber = Number(trimmed.replace(",", "."));
    if (Number.isNaN(asNumber) || asNumber <= 0) return null;
    return asNumber;
  };

  /* -------------------------------
     Stake / Withdraw handlers
  ------------------------------- */
  const handleStake = async () => {
    if (!activeAddress) {
      setMessage("Connect a wallet first.");
      return;
    }
    const numericAmount = parseAmount();
    if (numericAmount === null) {
      setMessage("Enter a valid amount (in USDC).");
      return;
    }

    try {
      setIsBusy(true);
      setMessage("Broadcasting stake transaction…");
      setError(null);

      const result = await stakeApi(activeAddress, numericAmount);
      setStakingState(result.newState);
      setAmount("");
      setMessage(`Stake confirmed. Tx: ${result.txId}`);
    } catch (err) {
      console.error("[ProtiusStakingPanel] Stake failed", err);
      setError("Stake transaction failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!activeAddress) {
      setMessage("Connect a wallet first.");
      return;
    }
    const numericAmount = parseAmount();
    if (numericAmount === null) {
      setMessage("Enter a valid amount (in USDC).");
      return;
    }

    try {
      setIsBusy(true);
      setMessage("Broadcasting withdraw transaction…");
      setError(null);

      const result = await withdrawApi(activeAddress, numericAmount);
      setStakingState(result.newState);
      setAmount("");
      setMessage(`Withdraw confirmed. Tx: ${result.txId}`);
    } catch (err) {
      console.error("[ProtiusStakingPanel] Withdraw failed", err);
      setError("Withdraw transaction failed.");
    } finally {
      setIsBusy(false);
    }
  };

  /* -------------------------------
     Mode switch: Cash / Equity
  ------------------------------- */
  const handleModeChange = async (mode: ClaimMode) => {
    if (!activeAddress) return;

    try {
      setIsBusy(true);
      setMessage("Updating payout mode…");
      setError(null);

      const state = await setPayoutMode(activeAddress, mode);
      setStakingState(state);
      setMessage(`Payout mode updated to: ${mode.toUpperCase()}`);
    } catch (err) {
      console.error("[ProtiusStakingPanel] Mode change failed", err);
      setError("Unable to update payout mode.");
    } finally {
      setIsBusy(false);
    }
  };

  /* -------------------------------
     Render
  ------------------------------- */
  return (
    <div className="rounded-lg border border-emerald-500/40 bg-slate-900/80 p-4 space-y-3 text-sm text-emerald-50">
      {/* Header + mode badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-emerald-100">
          Protius Staking
        </h2>
        <span className="inline-flex items-center rounded-full border border-emerald-500/60 px-2 py-0.5 text-[10px] font-medium text-emerald-100">
          {demo ? "Demo mode (no real funds)" : "Live on TestNet"}
        </span>
      </div>

      <p className="text-[11px] text-emerald-100/85">
        This panel simulates the{" "}
        <span className="font-semibold">ProtiusStaking</span> contract economics.
        When switched to TestNet mode, all calls route through the live
        blockchain.
      </p>

      {/* Wallet status */}
      <div className="text-xs text-emerald-200/90 space-y-1">
        <div>
          Wallet status:{" "}
          {isReady ? (
            <span className="text-emerald-300 font-semibold">ready</span>
          ) : (
            <span className="text-amber-300 font-semibold">
              not initialised
            </span>
          )}
        </div>
        <div className="break-all">
          Connected address:{" "}
          {activeAddress ? (
            <span className="font-mono text-emerald-200">{activeAddress}</span>
          ) : (
            <span className="text-emerald-300/80">none (connect above)</span>
          )}
        </div>
      </div>

      {/* Economics display */}
      <div className="rounded-md border border-emerald-500/20 bg-slate-950/60 px-3 py-2 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-emerald-200/80">Dev capital target:</span>
          <span className="font-mono text-emerald-100">
            {stakingState ? formatBigInt(stakingState.devCap) : "0"} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-200/80">Reward pool at FC:</span>
          <span className="font-mono text-emerald-100">
            {stakingState ? formatBigInt(stakingState.rewardPool) : "0"} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-200/80">Total staked (pool):</span>
          <span className="font-mono text-emerald-100">
            {stakingState ? formatBigInt(stakingState.totalStake) : "0"} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-200/80">Your stake:</span>
          <span className="font-mono text-emerald-100">
            {stakingState ? formatBigInt(stakingState.userStake) : "0"} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-emerald-200/80">Your share of pool:</span>
          <span className="font-mono text-emerald-100">
            {stakingState ? stakingState.userSharePct.toFixed(2) : "0.00"}%
          </span>
        </div>

        {/* Payout projections */}
        <div className="mt-2 pt-2 border-t border-emerald-500/20">
          <div className="flex justify-between">
            <span className="text-emerald-200/80">Cash payout at FC:</span>
            <span className="font-mono text-emerald-100">
              {stakingState
                ? formatBigInt(stakingState.projectedCashPayout)
                : "0"}{" "}
              USDC
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-emerald-200/80">Equity credit:</span>
            <span className="font-mono text-emerald-100">
              {stakingState
                ? formatBigInt(stakingState.projectedEquityCredit)
                : "0"}{" "}
              USDC
            </span>
          </div>
        </div>

        {/* Mode selector */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-emerald-200/80">Payout mode:</span>

          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange("cash")}
              disabled={isBusy || !activeAddress}
              className={`px-2 py-1 rounded-md text-[11px] ${
                stakingState?.claimMode === "cash"
                  ? "bg-emerald-500 text-slate-900 font-semibold"
                  : "border border-emerald-500/40 text-emerald-200"
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => handleModeChange("equity")}
              disabled={isBusy || !activeAddress}
              className={`px-2 py-1 rounded-md text-[11px] ${
                stakingState?.claimMode === "equity"
                  ? "bg-emerald-500 text-slate-900 font-semibold"
                  : "border border-emerald-500/40 text-emerald-200"
              }`}
            >
              Equity
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={loadState}
          disabled={!activeAddress || isBusy}
          className="mt-3 inline-flex items-center rounded-md border border-emerald-500/60 px-2 py-1 text-[11px] font-medium text-emerald-100
                     hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isBusy ? "Refreshing…" : "Refresh state"}
        </button>
      </div>

      {/* Stake / withdraw controls */}
      <div className="space-y-2 text-[11px]">
        <label className="block space-y-1">
          <span className="text-emerald-200/80">Amount (USDC)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-emerald-500/30 bg-slate-950/60 px-2 py-1
                       text-xs text-emerald-50 outline-none focus:border-emerald-400 focus:ring-0"
            placeholder="e.g. 10.0"
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleStake}
            disabled={!activeAddress || isBusy}
            className="flex-1 rounded-md bg-emerald-500/90 px-2 py-1 text-xs font-semibold text-slate-900
                       hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBusy ? "Broadcasting…" : "Stake"}
          </button>
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={!activeAddress || isBusy}
            className="flex-1 rounded-md border border-emerald-500/60 px-2 py-1 text-xs font-semibold text-emerald-100
                       hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBusy ? "Broadcasting…" : "Withdraw"}
          </button>
        </div>

        {message && (
          <p className="text-[11px] text-emerald-200/80 pt-1 break-all">
            {message}
          </p>
        )}
        {error && (
          <p className="text-[11px] text-red-400/90 pt-1 break-all">{error}</p>
        )}
      </div>

      <p className="text-[11px] text-emerald-200/70">
        In demo mode, all values are stored in a local ledger. When the staking
        contract is deployed on Algorand TestNet, this panel will connect to the
        live blockchain without requiring UI changes.
      </p>
    </div>
  );
};

export default ProtiusStakingPanel;
