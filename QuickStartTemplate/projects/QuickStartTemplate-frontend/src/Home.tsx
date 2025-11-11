import React from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";

// Generated App Client (already created by your Vercel build step)
import { HelloWorldClient } from "./contracts/HelloWorld";

// Algorand client helper from algokit-utils
import { AlgorandClient } from "@algorandfoundation/algokit-utils";

export default function Home() {
  const { wallets, activeAccount, transactionSigner } = useWallet();
  const addr = activeAccount?.address ?? null;

  // Build an Algorand client from your .env (VITE_ENVIRONMENT etc.)
  // Valid values: 'local', 'testnet', 'mainnet'
  const algorand = React.useMemo(() => {
    const env = (import.meta.env.VITE_ENVIRONMENT as string) || "testnet";
    return AlgorandClient.fromEnvironment({ environment: env });
  }, []);

  // Pull your App ID from .env (must be an integer)
  const appId = React.useMemo(() => {
    const raw = import.meta.env.VITE_HELLO_APP_ID as string | undefined;
    if (!raw) return undefined;
    try {
      return BigInt(raw);
    } catch {
      console.warn("VITE_HELLO_APP_ID is not a valid integer:", raw);
      return undefined;
    }
  }, []);

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
      <div
        style={{
          padding: 24,
          maxWidth: 880,
          margin: "0 auto",
          backdropFilter: "blur(3px)",
        }}
      >
        <h1 style={{ color: "#00ffd0", marginBottom: 8 }}>
          ⚡ Protius Project Registration
        </h1>
        <p style={{ color: "#9b9b9b", marginBottom: 24 }}>
          Register a renewable energy project to start the Protius lifecycle
          (DEVT → kWp → kWh).
        </p>

        {!addr ? (
          <div
            style={{
              border: "1px dashed #333",
              borderRadius: 12,
              padding: 24,
              background: "#0f0f0f",
              color: "#bcbcbc",
            }}
          >
            <p style={{ marginBottom: 12 }}>
              Connect your Algorand wallet to begin:
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {wallets.map((w) => {
                const meta = (w as any).metadata || {};
                const name: string = meta.name || "Wallet";
                return (
                  <button
                    key={name}
                    onClick={() => {
                      const connect = (w as any).connect;
                      if (typeof connect === "function") connect();
                    }}
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
              // Guard: need a valid appId
              if (!appId) {
                console.error(
                  "VITE_HELLO_APP_ID is missing or invalid. Set it in your .env / Vercel env."
                );
                return;
              }

              try {
                // Create a typed client for your deployed HelloWorld app
                const client = new HelloWorldClient({
                  appId,
                  algorand,
                });

                // Call the on-chain method; pass sender + signer here (NOT in constructor)
                const res = await client.send.hello({
                  args: { name: data?.name ?? "Protius" }, // <- use a real field from your form
                  sender: addr,
                  signer: transactionSigner,
                });

                console.log("hello() return:", res.return);
              } catch (err) {
                console.error("Error calling hello():", err);
              }
            }}
          />
        )}
      </div>

      <footer
        style={{
          maxWidth: 880,
          margin: "24px auto",
          padding: "12px 0",
          color: "#8a8a8a",
          borderTop: "1px solid #222",
          textAlign: "center",
          fontSize: 12,
        }}
      >
        © 2025 Protius Protocol — Built on Algorand TestNet
      </footer>
    </div>
  );
}
