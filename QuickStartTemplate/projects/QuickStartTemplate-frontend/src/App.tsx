// src/App.tsx
import React from "react";
import Home from "./Home";
import { useWallet } from "@txnlab/use-wallet-react";

const App: React.FC = () => {
  const { activeAccount, providers } = useWallet();

  const activeProvider = providers?.find((p) => p.isActive);
  const activeAddress = activeAccount?.address;

  const connect = async () => {
    const pera =
      providers.find((p) => p.metadata?.id === "pera") || providers[0];

    if (!pera) return;

    try {
      if (!pera.isConnected) {
        await pera.connect();
      }
      if (!pera.isActive) {
        await pera.setActiveProvider();
      }
    } catch (err) {
      console.error("Wallet connect error:", err);
      alert("Failed to connect wallet");
    }
  };

  const disconnect = async () => {
    try {
      if (activeProvider) {
        await activeProvider.disconnect();
      }
    } catch (err) {
      console.error("Wallet disconnect error:", err);
    }
  };

  const shortAddress = activeAddress
    ? `${activeAddress.slice(0, 4)}...${activeAddress.slice(-4)}`
    : "Not connected";

  return (
    <div className="app-root">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          background: "rgba(0,0,0,0.7)",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div
          style={{
            color: "#00ffaa",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          Protius Protocol — TestNet
        </div>

        <button
          onClick={activeAddress ? disconnect : connect}
          style={{
            borderRadius: "999px",
            border: "1px solid #00ffaa",
            background: activeAddress
              ? "rgba(0,255,170,0.12)"
              : "transparent",
            color: "white",
            padding: "6px 16px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          {shortAddress} — {activeAddress ? "Disconnect" : "Connect"}
        </button>
      </header>

      <Home />
    </div>
  );
};

export default App;
