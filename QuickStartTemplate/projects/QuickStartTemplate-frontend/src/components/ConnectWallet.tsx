import React from "react";
import { useWallet } from "@txnlab/use-wallet-react";

interface ConnectWalletProps {
  // Passed from Home.tsx but we don't need them right now;
  // we keep them here so Typescript stays happy.
  openModal: (_config?: any) => void;
  closeModal: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = () => {
  const { wallets, activeAddress } = useWallet();

  // Prefer an already-active wallet first
  const activeWallet = wallets.find((w) => w.isActive);

  // Then prefer PERA if it's one of the configured wallets
  const peraWallet =
    wallets.find((w) =>
      w.metadata?.name?.toLowerCase().includes("pera"),
    ) ?? wallets.find((w) => (w as any).id === "pera");

  // Fallback to the first wallet in the list
  const defaultWallet = activeWallet ?? peraWallet ?? wallets[0];

  const handleConnect = async () => {
    if (!defaultWallet) {
      alert("No wallet providers are configured.");
      return;
    }

    try {
      await defaultWallet.connect();
    } catch (err) {
      console.error("Error connecting wallet", err);
      alert(
        "Could not connect wallet. Please check that your wallet (Pera / Defly) is installed and unlocked.",
      );
    }
  };

  const handleDisconnect = async () => {
    try {
      // Disconnect all wallets just to be safe
      await Promise.all(wallets.map((w) => w.disconnect()));
    } catch (err) {
      console.error("Error disconnecting wallet", err);
      alert("Could not disconnect wallet. Please try again.");
    }
  };

  const isConnected = !!activeAddress;
  const buttonLabel = isConnected ? "Disconnect wallet" : "Connect wallet";
  const onClick = isConnected ? handleDisconnect : handleConnect;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-emerald-500/70 bg-slate-900/90 px-4 py-2 text-xs md:text-sm font-semibold text-emerald-100 hover:bg-emerald-500 hover:text-slate-950 transition"
    >
      {buttonLabel}
    </button>
  );
};

export default ConnectWallet;
