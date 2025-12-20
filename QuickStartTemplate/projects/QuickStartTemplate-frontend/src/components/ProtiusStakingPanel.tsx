import React, { useEffect, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { useToast } from "../hooks/use-toast";
import { useStaking } from "../hooks/useStaking";
import { setWalletService, clearWalletService } from "../contracts/walletService";
import { setTransactionSigner } from "../contracts/protiusStakingApi";

interface ProtiusStakingPanelProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const ProtiusStakingPanel: React.FC<ProtiusStakingPanelProps> = ({ openModal, setModalState }) => {
  const { algodClient, transactionSigner, activeAddress } = useWallet();
  const { toast } = useToast();
  const staking = useStaking(activeAddress ?? null);

  const [amount, setAmount] = useState("");

  // Wire wallet signer for on-chain transactions
  useEffect(() => {
    if (algodClient && transactionSigner && activeAddress) {
      setWalletService(algodClient, transactionSigner);
      setTransactionSigner(transactionSigner, activeAddress);
    } else {
      clearWalletService();
    }
  }, [algodClient, transactionSigner, activeAddress]);

  const parseAmount = (): number | null => {
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) return null;
    return value;
  };

  const handleStake = async () => {
    if (!transactionSigner || !activeAddress) {
      toast({
        title: "Wallet not ready",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    const parsed = parseAmount();
    if (!parsed) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid ALGO amount.",
        variant: "destructive",
      });
      return;
    }

    await staking.stake(parsed);
  };

  const handleWithdraw = async () => {
    if (!transactionSigner || !activeAddress) {
      toast({
        title: "Wallet not ready",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    const parsed = parseAmount();
    if (!parsed) {
      toast({
        title: "Invalid amount",
        description: "Enter a valid ALGO amount.",
        variant: "destructive",
      });
      return;
    }

    await staking.withdraw(parsed);
  };

  if (!openModal) return null;

  return (
    <div
      id="staking_modal"
      className={`modal modal-bottom sm:modal-middle backdrop-blur-sm ${openModal ? 'modal-open' : ''}`}
    >
      <div className="modal-box bg-[#1a1a2e] border border-[#00fff7]">
        <h3 className="font-bold text-lg text-[#00fff7] mb-4">Protius Staking</h3>
        
        {/* Staking Stats */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#e0e0ff]">Total Staked:</span>
            <span className="text-[#00fff7] font-bold">{staking.totalStake} ALGO</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#e0e0ff]">Your Stake:</span>
            <span className="text-[#00fff7] font-bold">{staking.userStake} ALGO</span>
          </div>
        </div>

        {/* Stake Section */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text text-[#e0e0ff]">Stake Amount (ALGO)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered flex-1 bg-[#23234a] text-[#00fff7] border-[#00fff7]"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={staking.isLoading}
            />
            <button
              className="btn bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-white border-none"
              onClick={handleStake}
              disabled={staking.isLoading || !activeAddress}
            >
              {staking.isLoading ? 'Processing...' : 'Stake'}
            </button>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="mb-6">
          <label className="label">
            <span className="label-text text-[#e0e0ff]">Withdraw Amount (ALGO)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.0"
              className="input input-bordered flex-1 bg-[#23234a] text-[#00fff7] border-[#00fff7]"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={staking.isLoading}
            />
            <button
              className="btn bg-[#ff00cc] hover:bg-[#ff00cc]/80 text-white border-none"
              onClick={handleWithdraw}
              disabled={staking.isLoading || !activeAddress}
            >
              {staking.isLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="modal-action">
          <button
            className="btn btn-sm bg-[#23234a] hover:bg-[#23234a]/80 text-[#00fff7] border-[#00fff7]"
            onClick={() => setModalState(false)}
            disabled={staking.isLoading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProtiusStakingPanel;
