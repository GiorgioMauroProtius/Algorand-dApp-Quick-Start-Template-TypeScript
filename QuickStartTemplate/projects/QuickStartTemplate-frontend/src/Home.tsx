import React from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";
// ⬇️ adjust this path to where algokit generated the client
import { HelloWorldClient } from "@/lib/algorand/clients/HelloWorldClient";

export default function Home() {
  const { wallets, activeAccount, signer } = useWallet();
  const addr = activeAccount?.address ?? null;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(/protius-bg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center 90%",
        backgroundRepeat: "no-repeat",
        color: "#eaeaea",
      }}
    >
      <div style={{ padding: 24, maxWidth: 880, margin: "0 auto", backdropFilter: "blur(3px)" }}>
        <h1 style={{ color: "#00ffd0", marginBottom: 8 }}>⚡ Protius Project Registration</h1>
        <p style={{ color: "#9b9b9b", marginBottom: 24 }}>
          Register a renewable energy project to start the Protius lifecycle (DEVT → kWp → kWh).
        </p>

        {!addr ? (
          <div style={{ border: "1px dashed #333", borderRadius: 12, padding: 24, background: "#0f0f0f", color: "#bcbcbc" }}>
            <p style={{ marginBottom: 12 }}>Connect your Algorand wallet to begin:</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {wallets.map((w) => {
                const meta = (w as any).metadata || {};
                const name: string = meta.name || "Wallet";
                return (
                  <button
                    key={name}
                    onClick={() => (w as any).connect?.()}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #00ffd0",
                      background: "#002f2a",
                      color: "#00ffd0",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                    aria-label={`Connect ${name}`}
                  >
                    Connect {name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <ProjectForm
            devAddr={addr}
            onSubmit={async (data) => {
              try {
                const appId = Number(process.env.NEXT_PUBLIC_HELLO_APP_ID); // put this in .env.local
                const client = new HelloWorldClient({
                  appId,
                  sender: addr,
                  signer,
                });

                // Example method; adjust to your ABI if different
                const res = await client.send.hello({
                  args: { name: data.name ?? "Protius" },
                  signer,
                });

                console.log("HelloWorld return:", res.return);
              } catch (err) {
                console.error("Smart contract error:", err);
              }
            }}
          />
        )}
      </div>

      <footer style={{ maxWidth: 880, margin: "24px auto", padding: "12px 0", color: "#8a8a8a", borderTop: "1px solid #222", textAlign: "center", fontSize: 12 }}>
        © 2025 Protius Protocol — Built on Algorand TestNet
      </footer>
    </div>
  );
}
