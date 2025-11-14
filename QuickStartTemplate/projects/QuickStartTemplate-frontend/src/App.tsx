// src/App.tsx
import React from "react";
import Home from "./Home";
import { useWallet } from "@txnlab/use-wallet";

const App: React.FC = () => {
  // Cast to any so we don't depend on the library's TS types
  const { providers, activeAccount } = useWallet() as any;

  const activeAddress: string | undefined = activeAccount?.address;

  const activeProvider = providers?.find((p: any) => p.isActive);

  const handleConnect = async () => {
    try {
      if (!providers || providers.length === 0) return;

      // Prefer Pera if available, otherwise first provider
      const pera =
        providers.find((p: any) => p.metadata?.id === "pera") ?? providers[0];

      if (!pera) return;

      if (!pera.isConnected) {
        await pera.connect();
      }
      if (!pera.isActive) {
        await pera.setActiveProvider();
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      alert("Could not connect wallet. Please try again.");
    }
  };

  const handleDisconnect = async () => {
    try {
      if (!activeProvider) return;
      await activeProvider.disconnect();
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    }
  };

  const shortAddress = activeAddress
    ? `${activeAddress.slice(0, 4)}...${activeAddress.slice(-4)}`
    : "Not connected";

  return (
    <div className="app-root">
      {/* Header with brand, network and wallet pill */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.9), rgba(0,40,60,0.9))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span
            style={{
              color: "#00ffaa",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: "0.9rem",
            }}
          >
            Protius Protocol
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              padding: "0.1rem 0.5rem",
              borderRadius: "999px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ccc",
            }}
          >
            Network: TestNet
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {/* Simple nav labels – non-clickable for now */}
          <nav
            style={{
              display: "flex",
              gap: "1rem",
              fontSize: "0.9rem",
              color: "#ccc",
            }}
          >
            <span style={{ cursor: "default" }}>Home</span>
            <span style={{ cursor: "default", opacity: 0.6 }}>Projects</span>
            <span style={{ cursor: "default", opacity: 0.6 }}>Profile</span>
          </nav>

          {/* Wallet pill */}
          <button
            onClick={activeAddress ? handleDisconnect : handleConnect}
            style={{
              borderRadius: "999px",
              border: "1px solid rgba(0, 255, 170, 0.6)",
              backgroundColor: activeAddress ? "rgba(0, 255, 170, 0.12)" : "transparent",
              color: "#e5ffe5",
              padding: "0.35rem 0.9rem",
              fontSize: "0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: activeAddress ? "#00ff99" : "#999",
              }}
            />
            <span>{shortAddress}</span>
            <span style={{ opacity: 0.8 }}>
              {activeAddress ? "Disconnect" : "Connect"}
            </span>
          </button>
        </div>
      </header>

      {/* Existing demo page */}
      <Home />
    </div>
  );
};

export default App;
