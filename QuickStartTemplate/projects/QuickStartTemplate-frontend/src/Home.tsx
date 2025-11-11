import React, { useMemo } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";
import { HelloWorldClient } from "./contracts/HelloWorld";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";

function getHelloAppId(): bigint {
  const raw = import.meta.env.VITE_HELLO_APP_ID as string | undefined;
  if (!raw) throw new Error("VITE_HELLO_APP_ID is not set in your environment.");
  return BigInt(raw); // must be bigint
}

export default function Home() {
  const { wallets, activeAccount, transactionSigner } = useWallet();
  const addr = activeAccount?.address ?? null;

  const algorand = useMemo(() => AlgorandClient.fromEnvironment(), []);

  // Optional safety if your hook version doesn't expose transactionSigner:
  const signer =
    transactionSigner ??
    (wallets.find((w: any) => w.isConnected)?.transactionSigner as any);

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
              try {
                const client = new HelloWorldClient({
                  algorand,
                  appId: getHelloAppId(), // bigint
                  defaultSender: addr,
                  defaultSigner: signer,
                });

                const res = await client.send.hello({
                  args: { name: data.name },
                });

                console.log("Smart contract response:", res.return);
              } catch (err) {
                console.error("Error calling smart contract:", err);
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
