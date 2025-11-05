import { useWallet } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";

export default function Home() {
  const { activeAccount, wallets } = useWallet();
  const addr = activeAccount?.address ?? null;

  // simple helper: label buttons nicely by wallet id/name
  const prettyName = (id: string, name?: string) => {
    if (name) return name;
    const n = id.toLowerCase();
    if (n.includes("pera")) return "Pera";
    if (n.includes("defly")) return "Defly";
    if (n.includes("exodus")) return "Exodus";
    return id;
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

        {!addr ? (
          <div
            style={{
              border: "1px dashed #333",
              borderRadius: 12,
              padding: 24,
              background: "#0f0f0f",
              color: "#bcbcbc",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 12 }}>
              Connect your Algorand wallet to begin.
            </div>

            {/* Render a real button for each configured wallet provider */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => w.connect()}
                  disabled={!w.isAvailable}
                  title={w.isAvailable ? "" : "Wallet not available in this browser"}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #00ffd0",
                    background: w.isAvailable ? "#002f2a" : "#0b1a18",
                    color: "#00ffd0",
                    cursor: w.isAvailable ? "pointer" : "not-allowed",
                  }}
                >
                  {`Connect ${prettyName(w.id, w.metadata?.name)}`}
                </button>
              ))}
            </div>

            {/* Fallback text if no wallets are exposed */}
            {wallets.length === 0 && (
              <div style={{ marginTop: 12, fontSize: 13, color: "#9b9b9b" }}>
                No wallet providers detected. Install Pera, Defly, or Exodus, then refresh.
              </div>
            )}
          </div>
        ) : (
          <ProjectForm
            devAddr={addr}
            onSubmit={async (data) => {
              // TODO: wire to on-chain in next steps
              console.log("new project →", data, "from", addr);
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
