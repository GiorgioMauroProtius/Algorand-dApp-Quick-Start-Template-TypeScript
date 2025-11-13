import React, { useMemo, useEffect } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";
import { HelloWorldClient } from "./contracts/HelloWorld";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";

/** Read HelloWorld App ID from Vite env as bigint */
function getHelloAppId(): bigint {
  const raw = import.meta.env.VITE_HELLO_APP_ID as string | undefined;
  if (!raw) {
    throw new Error("VITE_HELLO_APP_ID is not set in your environment.");
  }
  return BigInt(raw); // must be bigint for the client
}

/** Small info block to show the live TestNet HelloWorld app */
function HelloWorldInfo() {
  const raw = import.meta.env.VITE_HELLO_APP_ID as string | undefined;
  if (!raw) return null;

  const explorerUrl = `https://allo.info/application/${raw}?network=testnet`;

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 10,
        border: "1px solid #00ffd0",
        background: "rgba(0, 47, 42, 0.6)",
      }}
    >
      <h2 style={{ marginTop: 0, color: "#00ffd0" }}>
        TestNet HelloWorld smart contract
      </h2>
      <p style={{ marginBottom: 8, fontSize: "0.9rem" }}>
        This demo dApp is currently pointing at the live{" "}
        <strong>HelloWorld</strong> application on Algorand TestNet.
      </p>
      <p style={{ marginBottom: 8, fontSize: "0.9rem" }}>
        <strong>App ID:</strong> {raw}
      </p>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "inline-block",
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #00ffd0",
          color: "#00ffd0",
          textDecoration: "none",
          fontSize: "0.9rem",
        }}
      >
        View app on TestNet explorer
      </a>
    </section>
  );
}

export default function Home() {
  // Only pull what we actually use
  const { activeAccount, transactionSigner } = useWallet();
  const addr = activeAccount?.address ?? null;

  // Build an Algorand client from your Vite .env (VITE_ENVIRONMENT=testnet)
  const algorand = useMemo(() => AlgorandClient.fromEnvironment(), []);

  // Log useful info into DevTools → Console
  useEffect(() => {
    try {
      const appId = getHelloAppId();
      console.log("HelloWorld App ID (TestNet):", appId.toString());
    } catch (e) {
      console.error("VITE_HELLO_APP_ID is missing or invalid:", e);
    }

    if (addr) {
      console.log("✅ Connected wallet address:", addr);
    } else {
      console.log("⏳ No wallet connected yet.");
    }
  }, [addr]);

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
              Connect your Algorand wallet to begin (use the wallet button in
              your header if present).
            </p>
          </div>
        ) : (
          <ProjectForm
            devAddr={addr}
            onSubmit={async (data) => {
              try {
                if (!transactionSigner) {
                  throw new Error(
                    "Wallet signer not available. Please reconnect your wallet."
                  );
                }

                const client = new HelloWorldClient({
                  algorand,
                  appId: getHelloAppId(), // bigint from env
                  defaultSender: addr, // connected address
                  defaultSigner: transactionSigner, // signer from useWallet
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

        {/* New info block about the live TestNet app */}
        <HelloWorldInfo />
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
