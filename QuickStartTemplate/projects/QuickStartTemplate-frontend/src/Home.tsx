import React from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm, { ProjectInput } from "./components/ProjectForm";

export default function Home(): JSX.Element {
  const { activeAccount, wallets } = useWallet();
  const addr = activeAccount?.address ?? "";

  async function handleSubmit(data: ProjectInput): Promise<void> {
    // Frontend-only for now
    console.log("Submitting project:", data);
    // Later:
    // 1. Upload description → IPFS/Supabase (meta_cid)
    // 2. Call smart contract create_project(name, country, capacity_kw, meta_cid)
  }

  return (
    <div style={{ padding: 24, maxWidth: 880, margin: "0 auto" }}>
      <h1 style={{ color: "#00ffd0", marginBottom: 8 }}>⚡ Protius Project Registration</h1>
      <p style={{ color: "#b9b9b9", marginBottom: 24 }}>
        Register a renewable energy project to start the Protius lifecycle (DEVT → kWp → kWh).
      </p>

      {!addr ? (
        <div
          style={{
            border: "1px dashed #333",
            borderRadius: 12,
            padding: 24,
            background: "#0f0f0f",
            textAlign: "center",
            color: "#cfcfcf",
          }}
        >
          <p style={{ marginBottom: 8 }}>
            Connect your Algorand wallet (Pera, Defly, Exodus) to begin.
          </p>
          {wallets.length === 0 && (
            <small style={{ color: "#777" }}>
              If no wallets appear, ensure your wallet extension/app is installed.
            </small>
          )}
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #1f1f1f",
            borderRadius: 12,
            padding: 24,
            background: "#0e0e0e",
          }}
        >
          <ProjectForm devAddr={addr} onSubmit={handleSubmit} />
        </div>
      )}

      <footer
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: "1px solid #222",
          color: "#777",
          fontSize: "0.85rem",
          textAlign: "center",
        }}
      >
        © 2025 Protius Protocol — Built on Algorand TestNet
      </footer>
    </div>
  );
}
