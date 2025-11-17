import React from "react";
import { useWallet } from "@txnlab/use-wallet-react";

interface WalletButtonProps {
  openModal: () => void;
  closeModal: () => void;
}

const ConnectWallet: React.FC<WalletButtonProps> = ({ openModal, closeModal }) => {
  const { activeAddress, wallets, connect, disconnect } = useWallet();

  const handleConnect = () => {
    // Always select Pera or Defly if available
    if (wallets.length > 0) {
      connect(wallets[0].id);
    }
  };

  return (
    <div>
      {!activeAddress ? (
        <button
          onClick={handleConnect}
          className="rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm shadow-lg shadow-emerald-500/30"
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={disconnect}
          className="rounded-md bg-red-500 hover:bg-red-400 text-black font-semibold px-4 py-2 text-sm shadow-lg shadow-red-500/30"
        >
          Disconnect
        </button>
      )}
    </div>
  );
};

export default ConnectWallet;
