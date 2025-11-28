import React from "react";
import { useWallet } from "@txnlab/use-wallet-react";

const ProtiusStakingPanel: React.FC = () => {
  const { activeAddress, isReady } = useWallet();

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-slate-900/80 p-4 space-y-3 text-sm text-emerald-50">
      <p className="text-xs text-emerald-100/85">
        This panel is reserved for the{" "}
        <span className="font-semibold">ProtiusStaking</span> smart contract on
        Algorand TestNet. On this branch it&apos;s a safe placeholder so the
        front-end and Vercel build cleanly while we finish wiring the on-chain
        calls.
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
            <span className="text-emerald-300/80">none (connect above)</span>
          )}
        </div>
      </div>

      <p className="text-[11px] text-emerald-200/70">
        Next step: replace this placeholder with calls to the generated{" "}
        <code className="font-mono text-emerald-200">
          ProtiusStaking
        </code>{" "}
        client in <code className="font-mono text-emerald-200">src/contracts/ProtiusStaking.ts</code>{" "}
        (deploy, stake, confirm funding success, add premium, withdraw).
      </p>
    </div>
  );
};

export default ProtiusStakingPanel;
