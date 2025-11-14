import React, { useMemo, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";
import { HelloWorldClient } from "./contracts/HelloWorld";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import WalletSelector from "./components/WalletSelector";

function getHelloAppId(): bigint {
  const raw = import.meta.env.VITE_HELLO_APP_ID as string | undefined;
  if (!raw) throw new Error("VITE_HELLO_APP_ID is not set in your environment.");
  return BigInt(raw); // must be bigint
}

export default function Home() {
  const { activeAccount, transactionSigner, providers } = useWallet();
  const addr = activeAccount?.address ?? null;

  // Very simple demo counters
  const [projectsRegistered, setProjectsRegistered] = useState(0);
  const [projectsApproved] = useState(0); // placeholder for later
  const [totalStaked] = useState(0); // placeholder for later

  // Algorand client for TestNet (from .env / Vercel env)
  const algorand = useMemo(() => AlgorandClient.fromEnvironment(), []);

  // Optional: find the Pera provider (not strictly required because WalletSelector already handles it)
  const peraProvider = useMemo(
    () => providers?.find((p) => p.metadata.id === "pera"),
    [providers]
  );

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
          padding: "32px 32px 40px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {/* Top demo header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            gap: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#00ffd0", fontSize: 20 }}>
              ⚡ Protius Protocol – Demo
            </h2>
            <p style={{ margin: "4px 0 0", color: "#a3a3a3", fontSize: 13 }}>
              Simulate the Protius lifecycle: developer registers → Protius approves → investors stake.
            </p>
          </div>

          {/* Network + wallet status + Connect button */}
          <div style={{ textAlign: "right", fontSize: 12 }}>
            <div style={{ color: "#9b9b9b" }}>
              <strong>Network:</strong> TestNet
            </div>
            <div style={{ color: addr ? "#a8ffe8" : "#ffb3b3", marginBottom: 6 }}>
              <strong>Wallet:</strong>{" "}
              {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "Not connected"}
            </div>
            {/* Wallet selector button (opens Pera / other wallets modal) */}
            <div style={{ display: "inline-block" }}>
              <WalletSelector />
            </div>
          </div>
        </div>

        {/* Step tabs */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <StepPill
            number={1}
            label="Register project"
            description="Developer submits a new renewable project."
            active
          />
          <StepPill
            number={2}
            label="Approve & view projects (0)"
            description="Protius reviews and approves projects."
          />
          <StepPill
            number={3}
            label="Investor / staking demo"
            description="Investors stake demo USDC into approved projects."
          />
        </div>

        {/* Counters row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <CounterCard label="projects registered" value={projectsRegistered} />
          <CounterCard label="approved" value={projectsApproved} />
          <CounterCard label="demo USDC staked" value={totalStaked} />
        </div>

        {/* Main two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* LEFT: Protius project registration */}
          <div
            style={{
              background: "rgba(0,0,0,0.65)",
              borderRadius: 12,
              padding: 20,
              border: "1px solid rgba(0,255,208,0.3)",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#00ffd0" }}>⚡ Protius Project Registration</h3>
            <p style={{ marginTop: 4, marginBottom: 16, color: "#b3b3b3", fontSize: 13 }}>
              Register a renewable energy project and simulate the Protius lifecycle
              (developer → approval → staking).
            </p>

            {!addr ? (
              <div
                style={{
                  borderRadius: 10,
                  padding: 16,
                  background: "#0f0f0f",
                  border: "1px dashed #444",
                  color: "#d0d0d0",
                  marginTop: 4,
                }}
              >
                <p style={{ marginBottom: 12 }}>
                  <strong>Connect your Algorand wallet to begin.</strong>
                </p>
                <p style={{ marginBottom: 12, fontSize: 13, color: "#a5a5a5" }}>
                  Use the <em>Connect wallet</em> button in the top-right (Pera Wallet via
                  WalletConnect). Make sure your Pera app is switched to{" "}
                  <strong>TestNet</strong>, not MainNet.
                </p>
                <div>
                  {/* Extra explicit button: if you want to trigger Pera directly */}
                  {peraProvider && (
                    <button
                      type="button"
                      onClick={() => peraProvider.connect()}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid #00ffd0",
                        background: "rgba(0,255,208,0.06)",
                        color: "#00ffd0",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Connect Pera wallet (TestNet)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ProjectForm
                devAddr={addr}
                onSubmit={async (data: any) => {
                  // For now this is just UI logic: increment demo counter.
                  setProjectsRegistered((n) => n + 1);
                  console.log("Project registered (demo only, off-chain):", data);
                }}
              />
            )}
          </div>

          {/* RIGHT: HelloWorld smart contract box */}
          <div
            style={{
              background: "rgba(0,0,0,0.78)",
              borderRadius: 12,
              padding: 20,
              border: "1px solid rgba(0,255,208,0.35)",
            }}
          >
            <HelloWorldBox algorand={algorand} addr={addr} transactionSigner={transactionSigner} />
          </div>
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 32,
            textAlign: "center",
            fontSize: 11,
            color: "#8a8a8a",
          }}
        >
          © 2025 Protius Protocol — Built on Algorand TestNet
        </footer>
      </div>
    </div>
  );
}

// Small presentational components

function StepPill(props: {
  number: number;
  label: string;
  description: string;
  active?: boolean;
}) {
  const { number, label, description, active } = props;
  return (
    <div
      style={{
        borderRadius: 999,
        padding: "10px 16px",
        border: active ? "1px solid #00ffd0" : "1px solid #1f2933",
        background: active ? "rgba(0,255,208,0.08)" : "rgba(0,0,0,0.6)",
        color: "#eaeaea",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 180,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "999px",
          background: active ? "#00ffd0" : "#374151",
          color: active ? "#020617" : "#e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {number}
      </span>
      <div style={{ fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>{description}</div>
      </div>
    </div>
  );
}

function CounterCard(props: { label: string; value: number }) {
  const { label, value } = props;
  return (
    <div
      style={{
        flex: "0 0 200px",
        background: "rgba(0,0,0,0.7)",
        borderRadius: 10,
        padding: "10px 14px",
        border: "1px solid rgba(15,118,110,0.8)",
      }}
    >
      <div style={{ fontSize: 11, textTransform: "uppercase", color: "#9ca3af" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#e5e7eb", marginTop: 2 }}>{value}</div>
    </div>
  );
}

type HelloWorldBoxProps = {
  algorand: AlgorandClient;
  addr: string | null;
  transactionSigner: any;
};

function HelloWorldBox({ algorand, addr, transactionSigner }: HelloWorldBoxProps) {
  const [name, setName] = useState("Giorgio");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const appId = getHelloAppId();

  async function handleCall() {
    setError(null);
    setResult(null);

    if (!addr || !transactionSigner) {
      setError("Please connect your TestNet wallet before calling the contract.");
      return;
    }

    try {
      setLoading(true);

      const client = new HelloWorldClient({
        algorand,
        appId,
        defaultSender: addr,
        defaultSigner: transactionSigner,
      });

      const res = await client.send.hello({
        args: { name },
      });

      const returned = res.return as string | undefined;
      setResult(returned ?? "No response value returned");
    } catch (err: any) {
      console.error("Error calling HelloWorld:", err);
      const msg =
        err?.message ??
        (typeof err === "string" ? err : "Failed to call HelloWorld. See console for details.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h3 style={{ marginTop: 0, color: "#00ffd0" }}>HelloWorld on Algorand</h3>
      <p style={{ marginTop: 4, marginBottom: 12, color: "#c4c4c4", fontSize: 13 }}>
        This box talks to the real <strong>HelloWorld</strong> smart contract already deployed on
        Algorand TestNet with app ID <code>{String(appId)}</code>.
      </p>
      <p style={{ marginTop: 0, marginBottom: 16, color: "#9ca3af", fontSize: 12 }}>
        Connect your wallet, then call the contract to see the response below.
      </p>

      <label style={{ fontSize: 12, color: "#d1d5db", display: "block", marginBottom: 4 }}>
        Name to send:
      </label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Giorgio"
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #374151",
          background: "#020617",
          color: "#e5e7eb",
          marginBottom: 12,
          fontSize: 13,
        }}
      />

      <button
        type="button"
        onClick={handleCall}
        disabled={loading}
        style={{
          width: "100%",
          padding: "9px 14px",
          borderRadius: 999,
          border: "1px solid #00ffd0",
          background: loading ? "rgba(0,255,208,0.2)" : "rgba(0,255,208,0.08)",
          color: "#00ffd0",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          marginBottom: 12,
        }}
      >
        {loading ? "Calling HelloWorld..." : "Call HelloWorld"}
      </button>

      {result && (
        <div
          style={{
            marginTop: 4,
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.5)",
            fontSize: 12,
          }}
        >
          ✅ <strong>Received:</strong> {result}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 4,
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(248,113,113,0.12)",
            border: "1px solid rgba(248,113,113,0.6)",
            fontSize: 12,
          }}
        >
          ❌ <strong>Error:</strong> {error}
        </div>
      )}

      <p style={{ marginTop: 16, fontSize: 11, color: "#9ca3af" }}>
        For this demo, the Protius project / staking flow on the left is off-chain UI only. Next step
        is to replace HelloWorld with the real Protius staking smart contract.
      </p>
    </>
  );
}
