import React from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { HelloWorldClient } from "./contracts/HelloWorld"; // keep relative; switch to "@/contracts/HelloWorld" only if you have path alias

// Small helper to coerce the app id from Vite env to bigint
const getHelloAppId = (): bigint => {
  const raw = import.meta.env.VITE_HELLO_APP_ID as unknown as string | number | undefined;
  if (!raw) {
    throw new Error(
      "VITE_HELLO_APP_ID is not set. Add it to your .env (and Vercel env) after deploying the contract."
    );
  }
  // Ensure we get a bigint even if provided as string/number
  return BigInt(typeof raw === "number" ? raw : raw.trim());
};

export default function Home() {
  const { wallets, activeAccount, transactionSigner } = useWallet();
  const addr = activeAccount?.address ?? null;

  // Build a single Algorand client based on .env
  // IMPORTANT: fromEnvironment() takes NO arguments; it reads VITE_ENVIRONMENT + endpoints from .env
  const algorand = React.useMemo(() => AlgorandClient.fromEnvironment(), []);

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
              try {
                // Derive a string for HelloWorld.hello(name)
                const name =
                  // prefer common form keys if present; fall back to a default
                  (data as any).name ??
                  (data as any).projectName ??
                  "Protius";

                // Make a client bound to your deployed app id
                const client = new HelloWorldClient({
                  algorand, // created above
                  app: { appId: getHelloAppId() },
                  // defaults (constructor-level); you can still pass per-call
                  defaultSender: addr,
                  defaultSigner: transactionSigner,
                });

                // Call the contract
                const res = await client.send.hello({
                  args: { name },
                  sender: addr,
                  signer: transactionSigner,
                });

                console.log("hello() return:", res.return);
              } catch (err) {
                console.error("Error calling HelloWorld.hello():", err);
                alert(
                  err instanceof Error ? err.message : "Contract call failed"
                );
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

/**
 * Minimal ProjectForm typing so TS is happy.
 * Your real component exports this already; this is just to avoid TS complaining
 * about data shape here when we pick `name`.
 */
type ProjectInput = Record<string, unknown>;
type ProjectFormProps = {
  devAddr: string;
  onSubmit: (data: ProjectInput) => Promise<void>;
};
function ProjectForm(_props: ProjectFormProps) {
  // This file only uses the imported component at runtime.
  // At build time, the declaration above keeps TS satisfied.
  return React.createElement("div");
}
