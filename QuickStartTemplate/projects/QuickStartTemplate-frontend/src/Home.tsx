import { useWallet, PROVIDER_ID } from "@txnlab/use-wallet-react";
import ProjectForm from "./components/ProjectForm";

export default function Home() {
  const { activeAccount, connect } = useWallet();
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
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => connect(PROVIDER_ID.PERA)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #00ffd0",
                  background: "#002f2a",
                  color: "#00ffd0",
                  cursor: "pointer",
                }}
              >
                Connect Pera
              </button>
              <button
                onClick={() => connect(PROVIDER_ID.DEFLY)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #00ffd0",
                  background: "#002f2a",
                  color: "#00ffd0",
                  cursor: "pointer",
                }}
              >
                Connect Defly
              </button>
              <button
                onClick={() => connect(PROVIDER_ID.EXODUS)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #00ffd0",
                  background: "#002f2a",
                  color: "#00ffd0",
                  cursor: "pointer",
                }}
              >
                Connect Exodus
              </button>
            </div>
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
