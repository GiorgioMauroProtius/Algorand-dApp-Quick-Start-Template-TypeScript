import React, { useMemo, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";
import { HelloWorldClient } from "./contracts/HelloWorld";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";

/**
 * Read the HelloWorld app id from Vite env and return it as bigint.
 */
function getHelloAppId(): bigint {
  const raw = import.meta.env.VITE_HELLO_APP_ID as string | undefined;
  if (!raw) throw new Error("VITE_HELLO_APP_ID is not set in your environment.");
  return BigInt(raw);
}

/**
 * Build an Algorand client that ALWAYS uses the TestNet
 * Algonode endpoints coming from Vite / Vercel env variables.
 *
 * This prevents the default "localhost:4001" behaviour you saw in the
 * browser Console.
 */
function useAlgorandClient() {
  return useMemo(() => {
    const algodServer = import.meta.env.VITE_ALGOD_SERVER as string;
    const algodToken = (import.meta.env.VITE_ALGOD_TOKEN as string) || "";
    const algodPortEnv = import.meta.env.VITE_ALGOD_PORT as string | undefined;
    const algodPort = algodPortEnv ? Number(algodPortEnv) : 443;

    const indexerServer = import.meta.env.VITE_INDEXER_SERVER as string;
    const indexerToken = (import.meta.env.VITE_INDEXER_TOKEN as string) || "";
    const indexerPortEnv = import.meta.env.VITE_INDEXER_PORT as string | undefined;
    const indexerPort = indexerPortEnv ? Number(indexerPortEnv) : 443;

    const client = AlgorandClient.fromConfig({
      algodConfig: {
        server: algodServer,
        port: algodPort,
        token: algodToken,
      },
      indexerConfig: {
        server: indexerServer,
        port: indexerPort,
        token: indexerToken,
      },
    });

    // Tiny helper so you can inspect config safely in the browser console
    if (typeof window !== "undefined") {
      (window as any).__APP_ENV__ = {
        environment: import.meta.env.VITE_ENVIRONMENT,
        helloAppId: import.meta.env.VITE_HELLO_APP_ID,
        algod: algodServer,
        indexer: indexerServer,
      };
    }

    return client;
  }, []);
}

export default function Home() {
  const { activeAccount, transactionSigner } = useWallet();
  const addr = activeAccount?.address ?? null;
  const algorand = useAlgorandClient();

  const [helloName, setHelloName] = useState("world");
  const [helloResult, setHelloResult] = useState<string | null>(null);
  const [helloError, setHelloError] = useState<string | null>(null);
  const [helloLoading, setHelloLoading] = useState(false);

  const handleHello = async () => {
    try {
      setHelloError(null);
      setHelloResult(null);
      setHelloLoading(true);

      if (!addr || !transactionSigner) {
        throw new Error("Connect your Pera wallet first.");
      }

      const client = new HelloWorldClient({
        algorand,
        appId: getHelloAppId(),
        defaultSender: addr,
        defaultSigner: transactionSigner,
      });

      console.log("Calling HelloWorld.hello with appId", getHelloAppId().toString());

      const res = await client.send.hello({
        args: { name: helloName },
      });

      console.log("HelloWorld response:", res.return);
      setHelloResult(String(res.return));
    } catch (e: any) {
      console.error("Error calling HelloWorld:", e);
      setHelloError(e?.message ?? "Unknown error");
    } finally {
      setHelloLoading(false);
    }
  };

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

        {addr && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #00ffd0",
              background: "rgba(0, 60, 54, 0.6)",
              fontSize: 14,
            }}
          >
            <strong>Connected wallet:</strong>{" "}
            <span style={{ fontFamily: "monospace" }}>{addr}</span>
          </div>
        )}

        {!addr ? (
          <div
            style={{
              border: "1px dashed #333",
              borderRadius: 12,
              padding: 24,
              background: "#0f0f0f",
              color: "#bcbcbc",
              marginBottom: 32,
            }}
          >
            <p style={{ marginBottom: 12 }}>
              Connect your Algorand wallet to begin (use the wallet button in
              your header).
            </p>
          </div>
        ) : (
          <ProjectForm
            devAddr={addr}
            onSubmit={async (data) => {
              // Still just logging for now – we’ll wire this to PV staking later
              console.log(
                "Project form submitted (not yet wired to chain):",
                data,
              );
            }}
          />
        )}

        {/* HelloWorld TestNet block */}
        <div
          style={{
            marginTop: 32,
            padding: 20,
            borderRadius: 16,
            border: "1px solid #00ffd0",
            background: "rgba(0, 32, 28, 0.85)",
          }}
        >
          <h2
            style={{
              color: "#00ffd0",
              marginTop: 0,
              marginBottom: 8,
              fontSize: 20,
            }}
          >
            TestNet HelloWorld smart contract
          </h2>

          <p style={{ marginBottom: 8, color: "#c0fff2" }}>
            This demo dApp is currently pointing at the live{" "}
            <strong>HelloWorld</strong> application on Algorand TestNet.
          </p>

          <p style={{ marginBottom: 12 }}>
            <strong>App ID:</strong>{" "}
            <span style={{ fontFamily: "monospace" }}>
              {getHelloAppId().toString()}
            </span>
          </p>

          <a
            href={`https://explorer.perawallet.app/apps/${getHelloAppId().toString()}?network=testnet`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #00ffd0",
              color: "#00ffd0",
              textDecoration: "none",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            View app on TestNet explorer
          </a>

          <h3 style={{ marginTop: 16, marginBottom: 8, fontSize: 16 }}>
            Try calling the contract
          </h3>
          <p style={{ marginBottom: 12, fontSize: 14 }}>
            Type a name and call <code>hello(name)</code> on the contract.
            You&apos;ll see the response below if your TestNet wallet is
            connected.
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <input
              value={helloName}
              onChange={(e) => setHelloName(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "#111",
                color: "#eaeaea",
              }}
            />
            <button
              type="button"
              onClick={handleHello}
              disabled={helloLoading}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "1px solid #00ffd0",
                background: helloLoading ? "#003e35" : "#00352e",
                color: "#00ffd0",
                cursor: helloLoading ? "default" : "pointer",
                fontWeight: 700,
              }}
            >
              {helloLoading ? "Calling..." : "Call HelloWorld"}
            </button>
          </div>

          {helloResult && (
            <p style={{ color: "#00ffb4", fontSize: 14 }}>
              ✅ Received: <code>{helloResult}</code>
            </p>
          )}

          {helloError && (
            <p style={{ color: "#ff6b6b", fontSize: 14 }}>
              ❌ Error: <code>{helloError}</code>
            </p>
          )}
        </div>
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
