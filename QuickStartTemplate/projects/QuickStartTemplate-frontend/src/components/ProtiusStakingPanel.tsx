import React, { useState } from "react";
import { ProtiusStakingClient } from "../contracts/ProtiusStakingClient";
import { useWallet } from "@txnlab/use-wallet-react";

type Props = {
  appId?: number;
};

const ProtiusStakingPanel: React.FC<Props> = ({ appId }) => {
  const { activeAddress, signer } = useWallet();

  const [fundingGoal, setFundingGoal] = useState("");
  const [minimumGoal, setMinimumGoal] = useState("");
  const [stakeSeconds, setStakeSeconds] = useState("");
  const [stakeAmount, setStakeAmount] = useState("");
  const [premium, setPremium] = useState("");
  const [appID, setAppID] = useState<number | null>(appId ?? null);

  const [message, setMessage] = useState("");

  const algod = {
    server: "https://testnet-api.algonode.cloud",
    port: "",
    token: "",
  };

  const client = appID
    ? new ProtiusStakingClient({ id: appID }, algod)
    : null;

  const deployApp = async () => {
    try {
      if (!activeAddress || !signer) {
        setMessage("Connect your wallet first.");
        return;
      }

      const tmpClient = new ProtiusStakingClient(
        { sender: { addr: activeAddress, signer } },
        algod
      );

      const result = await tmpClient.createApplication({
        developer: activeAddress,
        fundingGoal: BigInt(fundingGoal),
        minimumGoal: BigInt(minimumGoal),
        stakingPeriodSeconds: BigInt(stakeSeconds),
      });

      setAppID(Number(result.appId));
      setMessage(`App created! ID = ${result.appId}`);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  const doStake = async () => {
    try {
      if (!client || !activeAddress || !signer) {
        setMessage("Missing client or wallet.");
        return;
      }

      const result = await client.stake(
        { amount: BigInt(stakeAmount) },
        { sender: { addr: activeAddress, signer } }
      );

      setMessage("Stake successful. TxID: " + result.txId);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  const confirmFunded = async () => {
    try {
      if (!client || !activeAddress || !signer) {
        setMessage("Missing client or wallet.");
        return;
      }

      const result = await client.confirmFundingSuccess(
        {},
        { sender: { addr: activeAddress, signer } }
      );

      setMessage("Funding confirmed. TxID: " + result.txId);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  const addPremiumPool = async () => {
    try {
      if (!client || !activeAddress || !signer) {
        setMessage("Missing client or wallet.");
        return;
      }

      const result = await client.addPremium(
        { premiumAmount: BigInt(premium) },
        { sender: { addr: activeAddress, signer } }
      );

      setMessage("Premium added. TxID: " + result.txId);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  const withdrawReward = async () => {
    try {
      if (!client || !activeAddress || !signer) {
        setMessage("Missing client or wallet.");
        return;
      }

      const result = await client.withdraw(
        {},
        { sender: { addr: activeAddress, signer } }
      );

      setMessage("Withdraw success. Payout = " + result.returnValue);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    }
  };

  return (
    <div style={{ padding: "16px", border: "1px solid #ccc" }}>
      <h2>🔆 Protius Staking Contract</h2>

      {!appID && (
        <>
          <h3>Deploy Contract</h3>
          <input
            placeholder="Funding goal"
            value={fundingGoal}
            onChange={(e) => setFundingGoal(e.target.value)}
          />
          <input
            placeholder="Minimum goal"
            value={minimumGoal}
            onChange={(e) => setMinimumGoal(e.target.value)}
          />
          <input
            placeholder="Staking duration (seconds)"
            value={stakeSeconds}
            onChange={(e) => setStakeSeconds(e.target.value)}
          />
          <button onClick={deployApp}>Deploy App</button>
        </>
      )}

      {appID && (
        <>
          <h3>App ID: {appID}</h3>

          <h4>Stake</h4>
          <input
            placeholder="Stake amount"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
          />
          <button onClick={doStake}>Stake</button>

          <h4>Developer Actions</h4>
          <button onClick={confirmFunded}>Confirm Funding Success</button>

          <input
            placeholder="Premium amount"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
          />
          <button onClick={addPremiumPool}>Add Premium</button>

          <h4>Withdraw</h4>
          <button onClick={withdrawReward}>Withdraw</button>
        </>
      )}

      <p style={{ marginTop: "16px", color: "green" }}>{message}</p>
    </div>
  );
};

export default ProtiusStakingPanel;

