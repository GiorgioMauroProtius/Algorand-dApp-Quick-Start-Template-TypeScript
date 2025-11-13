import React, { useMemo, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";
import { HelloWorldClient } from "./contracts/HelloWorld";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";

/**
 * Read the HelloWorld app ID from Vite env and return as bigint.
 * This must match the TestNet app you deployed (749547327).
 */
function getHelloAppId(): bigint {
  const raw = import.meta.env.VITE_HELLO_APP_ID as string | undefined;
  if (!raw) throw new Error("VITE_HELLO_APP_ID is not set in your environment.");
  return BigInt(raw);
}

export default function Home() {
  const { activeAccount, transactionSigner } = useWallet();
  const addr = activeAccount?.address ?? null;

  // Algorand client configured from VITE_ENVIRONMENT + Algonode URLs
  const algorand = useMemo(() => AlgorandClient.fromEnvironment(), []);

  // --- HelloWorld test UI state ---
  const [helloInput, setHelloInput] = useState<string>("world");
  const [helloStatus, setHelloStatus] = useState<string | null>(null);
  const [helloResult, setHelloResult] = useState<string | null>(null);
  const [helloError, setHelloError] = useState<string | null>(null);

  async function callHelloWorld() {
    setHelloError(null);
    setHelloResult(null);

    if (!addr || !transactionSigner) {
      setHelloError("Wallet not connected. Please connect your Pera / Algorand wallet first.");
      return;
    }

    try {
      setHelloStatus("Sending transaction to HelloWorld on TestNet…");

      const client = new HelloWorldClient({
        algorand,
        appId: getHelloAppId(),
        defaultSender: addr,
        defaultSigner: transactionSigner,
      });

      const res = await client.send.hello({
        args: { name: helloInput.trim() || "world" },
      });

      // res.return usually contains the string from the contract
      const value = (res as any).return ?? "";
      const asString = String(value);

      console.log("HelloWorld response:", res);
      setHelloResult(asString || "(no return value)");
      setHelloStatus("✅ Transaction confirmed on TestNet");
    } catch (e: any) {
      console.error("Error calling HelloWorld:", e);
      setHelloError(e?.message ?? String(e));
      setHelloStatus("❌ Failed to call HelloWorld");
    }
  }

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
          Register a renewable energy project to start the Protius lifecycle (DEVT → kWp → kWh).
        </p>

        {/* Wallet status notice */}
        <div
          style={{
            marginBottom: 24,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #222",
            background: "#0f0f0f",
            color: addr ? "#a8ffea" : "#bcbcbc",
          }}
        >
          {addr ? (
            <span>
              Connected wallet:{" "}
              <span style={{ fontFamily: "monospace" }}>{addr}</span>
            </span>
          ) : (
            <span>
              No wallet connected. Use the wallet button in the header (Pera / Protius Wallet)
              to connect a TestNet account.
            </span>
          )}
        </div>

        {/* Main Protius project form */}
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
              Connect your Algorand wallet to begin (use the wallet button in your header if
              present).
            </p>
          </div>
        ) : (
          <ProjectForm
            devAddr={addr}
            onSubmit={async (data) => {
              // For now we just log the project data.
              // Later we will replace this with PVProjectStaking.create / stake logic.
              console.log("Project submitted:", data);
            }}
          />
        )}

        {/* HelloWorld TestNet info + test area */}
        <div
          style={{
            marginTop: 32,
            borderRadius: 16,
            border: "1px solid #00ffd0",
            background: "rgba(0, 0, 0, 0.6)",
            padding: 20,
          }}
        >
          <h2
            style={{
              color: "#00ffd0",
              fontSize: 18,
              marginBottom: 4,
            }}
          >
            TestNet HelloWorld smart contract
          </h2>
          <p style={{ color: "#bcbcbc", marginBottom: 8 }}>
            This demo dApp is currently pointing at the live{" "}
            <span style={{ fontWeight: 600 }}>HelloWorld</span> application on Algorand TestNet.
          </p>

          <p style={{ fontSize: 14, marginBottom: 12 }}>
            <strong>App ID:</strong>{" "}
            <span style={{ fontFamily: "monospace" }}>749547327</span>
          </p>

          <button
            type="button"
            onClick={() =>
              window.open(
                "https://allo.info/application/testnet/749547327",
                "_blank",
                "noopener,noreferrer"
              )
            }
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #00ffd0",
              background: "#002f29",
              color: "#00ffd0",
              cursor: "pointer",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            View app on TestNet explorer
          </button>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid #09453d",
              margin: "12px 0 16px",
            }}
          />

          <h3
            style={{
              fontSize: 15,
              marginBottom: 8,
              color: "#eaeaea",
            }}
          >
            Try calling the contract
          </h3>

          <p style={{ fontSize: 13, color: "#bcbcbc", marginBottom: 8 }}>
            Type a name and call <code>hello(name)</code> on the contract. You&apos;ll see the
            response below if your TestNet wallet is connected.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <input
              type="text"
              value={helloInput}
              onChange={(e) => setHelloInput(e.target.value)}
              placeholder="world"
              style={{
                flex: "1 1 180px",
                minWidth: 0,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#111",
                color: "#eaeaea",
              }}
            />
            <button
              type="button"
              onClick={callHelloWorld}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid #00ffd0",
                background: "#003f36",
                color: "#00ffd0",
                cursor: "pointer",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Call HelloWorld
            </button>
          </div>

          {helloStatus && (
            <p style={{ fontSize: 13, color: "#bcbcbc", marginBottom: 4 }}>{helloStatus}</p>
          )}

          {helloResult && (
            <p style={{ fontSize: 13, color: "#a8ffe4", marginBottom: 4 }}>
              <strong>Received:</strong> {helloResult}
            </p>
          )}

          {helloError && (
            <p style={{ fontSize: 13, color: "#ff8080" }}>
              <strong>Error:</strong> {helloError}
            </p>
          )}
        </div>
      </div>

      <footer
        style={{
          borderTop: "1px solid #222",
          padding: "12px 24px",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#888",
        }}
      >
        © 2025 Protius Protocol — Powered by Algorand TestNet
      </footer>
    </div>
  );
}
