import React, { useMemo, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { HelloWorldClient } from "./contracts/HelloWorld";

type ProjectStatus = "Draft" | "Approved";

interface Project {
  id: number;
  devAddr: string;
  userName: string;
  projectName: string;
  country: string;
  capacityKw: number;
  distanceKm: number;
  description: string;
  status: ProjectStatus;
  totalStaked: number;
  stakerCount: number;
}

function getHelloAppId(): bigint {
  const raw = import.meta.env.VITE_HELLO_APP_ID as string | undefined;
  if (!raw) throw new Error("VITE_HELLO_APP_ID is not set in your environment.");
  return BigInt(raw);
}

const COUNTRIES = ["Italy", "France", "South Africa", "Canada"];

export default function Home() {
  const { activeAccount, transactionSigner } = useWallet();
  const addr = activeAccount?.address ?? null;

  const [helloName, setHelloName] = useState("");
  const [helloResult, setHelloResult] = useState<string | null>(null);
  const [helloLoading, setHelloLoading] = useState(false);
  const [helloError, setHelloError] = useState<string | null>(null);

  const [tab, setTab] = useState<"register" | "projects" | "investor">("register");

  const [userName, setUserName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [country, setCountry] = useState("");
  const [capacityKw, setCapacityKw] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [description, setDescription] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [nextProjectId, setNextProjectId] = useState(1);

  const [stakeAmount, setStakeAmount] = useState("");

  const algorand = useMemo(() => AlgorandClient.fromEnvironment(), []);

  async function handleHelloSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addr || !transactionSigner) {
      setHelloError("Connect your wallet first.");
      return;
    }
    setHelloError(null);
    setHelloLoading(true);
    try {
      const client = new HelloWorldClient({
        algorand,
        appId: getHelloAppId(),
        defaultSender: addr,
        defaultSigner: transactionSigner,
      });

      const res: any = await client.send.hello({
        args: { name: helloName || "world" },
      });

      console.log("HelloWorld response:", res);
      const msg =
        (res?.return && String(res.return)) ||
        (res?.returnValue && String(res.returnValue)) ||
        "Call succeeded.";
      setHelloResult(msg);
    } catch (err: any) {
      console.error("Error calling HelloWorld:", err);
      setHelloError(err?.message ?? "Unknown error");
      setHelloResult(null);
    } finally {
      setHelloLoading(false);
    }
  }

  function handleRegisterProject(e: React.FormEvent) {
    e.preventDefault();
    if (!addr) return;

    const newProject: Project = {
      id: nextProjectId,
      devAddr: addr,
      userName: userName.trim() || "Unnamed developer",
      projectName: projectName.trim() || "Untitled project",
      country: country || "N/A",
      capacityKw: capacityKw ? Number(capacityKw) : 0,
      distanceKm: distanceKm ? Number(distanceKm) : 0,
      description: description.trim(),
      status: "Draft",
      totalStaked: 0,
      stakerCount: 0,
    };

    setProjects((prev) => [...prev, newProject]);
    setNextProjectId((n) => n + 1);

    // Clear the form
    setUserName("");
    setProjectName("");
    setCountry("");
    setCapacityKw("");
    setDistanceKm("");
    setDescription("");

    setTab("projects");
  }

  function handleApprove(id: number) {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Approved" } : p)),
    );
  }

  function handleMockStake(p: Project) {
    const amount = stakeAmount ? Number(stakeAmount) : 0;
    if (!amount || amount <= 0) return;

    setProjects((prev) =>
      prev.map((proj) =>
        proj.id === p.id
          ? {
              ...proj,
              totalStaked: proj.totalStaked + amount,
              stakerCount: proj.stakerCount + 1,
            }
          : proj,
      ),
    );
    setStakeAmount("");
  }

  const totalApproved = projects.filter((p) => p.status === "Approved").length;
  const totalRegistered = projects.length;
  const totalStakedAll = projects.reduce((sum, p) => sum + p.totalStaked, 0);

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
      <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto", backdropFilter: "blur(3px)" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h1 style={{ color: "#00ffd0", margin: 0 }}>⚡ Protius Protocol – Demo</h1>
          <div style={{ fontSize: 12, color: "#bdbdbd", textAlign: "right" }}>
            <div>Network: TestNet</div>
            <div style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis" }}>
              Wallet: {addr ?? "Not connected"}
            </div>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setTab("register")}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #00ffd0",
              background: tab === "register" ? "#002f2a" : "transparent",
              color: "#00ffd0",
              cursor: "pointer",
            }}
          >
            1️⃣ Register project
          </button>
          <button
            type="button"
            onClick={() => setTab("projects")}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #00ffd0",
              background: tab === "projects" ? "#002f2a" : "transparent",
              color: "#00ffd0",
              cursor: "pointer",
            }}
          >
            2️⃣ Approve & view projects ({totalRegistered})
          </button>
          <button
            type="button"
            onClick={() => setTab("investor")}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #00ffd0",
              background: tab === "investor" ? "#002f2a" : "transparent",
              color: "#00ffd0",
              cursor: "pointer",
            }}
          >
            3️⃣ Investor / staking demo
          </button>
        </div>

        {/* Small metrics strip */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
            fontSize: 13,
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <strong>{totalRegistered}</strong> projects registered
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <strong>{totalApproved}</strong> approved
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <strong>{totalStakedAll}</strong> demo USDC staked
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.2fr)",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* LEFT SIDE – main tab content */}
          <div>
            {tab === "register" && (
              <>
                <h2 style={{ color: "#00ffd0", marginBottom: 8 }}>⚡ Protius Project Registration</h2>
                <p style={{ color: "#9b9b9b", marginBottom: 24 }}>
                  Register a renewable energy project and simulate the Protius lifecycle (developer
                  → approval → staking).
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
                      Connect your Algorand wallet to begin (use the wallet button in the header of
                      the dApp).
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={handleRegisterProject}
                    style={{ display: "grid", gap: 16, fontSize: 14 }}
                  >
                    <div style={{ display: "grid", gap: 6 }}>
                      <span style={{ color: "#b9b9b9" }}>Developer Wallet</span>
                      <div
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#111",
                          border: "1px dashed #333",
                          borderRadius: 8,
                          color: "#a8ffea",
                          fontSize: 12,
                          wordBreak: "break-all",
                        }}
                      >
                        {addr}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <label style={{ color: "#b9b9b9" }}>User Name</label>
                      <input
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="e.g., Giorgio Mauro"
                        maxLength={80}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#111",
                          border: "1px solid #222",
                          borderRadius: 8,
                          color: "#eaeaea",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <label style={{ color: "#b9b9b9" }}>Project Name</label>
                      <input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g., Sunny Ridge Solar"
                        maxLength={80}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#111",
                          border: "1px solid #222",
                          borderRadius: 8,
                          color: "#eaeaea",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <label style={{ color: "#b9b9b9" }}>Country</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#111",
                          border: "1px solid #222",
                          borderRadius: 8,
                          color: "#eaeaea",
                        }}
                      >
                        <option value="">Select country…</option>
                        {COUNTRIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={{ display: "grid", gap: 6 }}>
                        <label style={{ color: "#b9b9b9" }}>Capacity (kW)</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={capacityKw}
                          onChange={(e) => setCapacityKw(e.target.value)}
                          placeholder="e.g., 5000"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "#111",
                            border: "1px solid #222",
                            borderRadius: 8,
                            color: "#eaeaea",
                          }}
                        />
                      </div>
                      <div style={{ display: "grid", gap: 6 }}>
                        <label style={{ color: "#b9b9b9" }}>Distance from Substation (km)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={distanceKm}
                          onChange={(e) => setDistanceKm(e.target.value)}
                          placeholder="e.g., 12.5"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "#111",
                            border: "1px solid #222",
                            borderRadius: 8,
                            color: "#eaeaea",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <label style={{ color: "#b9b9b9" }}>Description / Notes</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Key details, permits/status, grid, site notes…"
                        maxLength={3000}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "#111",
                          border: "1px solid #222",
                          borderRadius: 8,
                          color: "#eaeaea",
                          minHeight: 120,
                          resize: "vertical",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #00ffd0",
                        background: "#002f2a",
                        color: "#00ffd0",
                        cursor: "pointer",
                        width: 220,
                        justifySelf: "start",
                        fontWeight: 700,
                      }}
                    >
                      Save project (demo only)
                    </button>
                  </form>
                )}
              </>
            )}

            {tab === "projects" && (
              <>
                <h2 style={{ color: "#00ffd0", marginBottom: 8 }}>📁 Projects overview</h2>
                <p style={{ color: "#9b9b9b", marginBottom: 16 }}>
                  These projects live only in the browser for demo purposes, but the flow mirrors
                  what Protius will do on-chain.
                </p>
                {projects.length === 0 ? (
                  <p style={{ color: "#b9b9b9" }}>No projects yet. Register one first.</p>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: "1px solid #333",
                          background: "rgba(0,0,0,0.7)",
                          fontSize: 13,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <strong>{p.projectName}</strong>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "1px solid #555",
                              fontSize: 11,
                              color: p.status === "Approved" ? "#00ffd0" : "#f5c542",
                            }}
                          >
                            {p.status}
                          </span>
                        </div>
                        <div style={{ marginBottom: 4, color: "#bdbdbd" }}>
                          Dev: {p.userName} — {p.country || "N/A"} — {p.capacityKw} kW
                        </div>
                        <div style={{ marginBottom: 4, color: "#8a8a8a", fontSize: 12 }}>
                          Substation distance: {p.distanceKm} km
                        </div>
                        {p.description && (
                          <div style={{ marginBottom: 6, color: "#9b9b9b", fontSize: 12 }}>
                            {p.description}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 4,
                            fontSize: 12,
                            color: "#bdbdbd",
                          }}
                        >
                          <div>
                            Staked (demo): <strong>{p.totalStaked}</strong> USDC —{" "}
                            <strong>{p.stakerCount}</strong> stakers
                          </div>
                          {p.status === "Draft" && (
                            <button
                              type="button"
                              onClick={() => handleApprove(p.id)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: "1px solid #00ffd0",
                                background: "#002f2a",
                                color: "#00ffd0",
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                            >
                              Approve project
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "investor" && (
              <>
                <h2 style={{ color: "#00ffd0", marginBottom: 8 }}>👥 Investor / staking demo</h2>
                <p style={{ color: "#9b9b9b", marginBottom: 16 }}>
                  Imagine you are a community investor. Here you can pick an approved project and
                  simulate staking USDC into it.
                </p>
                {projects.filter((p) => p.status === "Approved").length === 0 ? (
                  <p style={{ color: "#b9b9b9" }}>No approved projects yet.</p>
                ) : (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ color: "#b9b9b9", fontSize: 13, marginRight: 8 }}>
                        Stake amount (demo USDC)
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        style={{
                          width: 160,
                          padding: "6px 10px",
                          background: "#111",
                          border: "1px solid #222",
                          borderRadius: 8,
                          color: "#eaeaea",
                          fontSize: 13,
                        }}
                      />
                    </div>
                    <div style={{ display: "grid", gap: 12 }}>
                      {projects
                        .filter((p) => p.status === "Approved")
                        .map((p) => (
                          <div
                            key={p.id}
                            style={{
                              padding: 12,
                              borderRadius: 10,
                              border: "1px solid #333",
                              background: "rgba(0,0,0,0.7)",
                              fontSize: 13,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 6,
                              }}
                            >
                              <strong>{p.projectName}</strong>
                              <span style={{ fontSize: 12, color: "#bdbdbd" }}>
                                {p.capacityKw} kW — {p.country}
                              </span>
                            </div>
                            <div style={{ marginBottom: 6, fontSize: 12, color: "#9b9b9b" }}>
                              Total demo staked: <strong>{p.totalStaked}</strong> USDC —{" "}
                              <strong>{p.stakerCount}</strong> stakers
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMockStake(p)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "1px solid #00ffd0",
                                background: "#002f2a",
                                color: "#00ffd0",
                                cursor: "pointer",
                                fontSize: 13,
                              }}
                            >
                              Stake (demo only)
                            </button>
                          </div>
                        ))}
                    </div>
                    <p
                      style={{
                        marginTop: 16,
                        fontSize: 11,
                        color: "#808080",
                      }}
                    >
                      Note: this staking is <strong>front-end only</strong> for demo purposes. The
                      only live on-chain call today is the HelloWorld contract on Algorand TestNet.
                    </p>
                  </>
                )}
              </>
            )}
          </div>

          {/* RIGHT SIDE – HelloWorld on-chain box */}
          <aside
            style={{
              borderRadius: 12,
              border: "1px solid #333",
              background: "rgba(0,0,0,0.7)",
              padding: 16,
              fontSize: 13,
            }}
          >
            <h3 style={{ marginTop: 0, color: "#00ffd0" }}>HelloWorld on Algorand</h3>
            <p style={{ color: "#b9b9b9", marginBottom: 10 }}>
              This box talks to the real <strong>HelloWorld</strong> smart contract already deployed
              on Algorand TestNet with app ID <code>{String(getHelloAppId())}</code>.
            </p>
            {!addr || !transactionSigner ? (
              <p style={{ color: "#b9b9b9" }}>
                Connect your wallet, then come back here to call the contract.
              </p>
            ) : (
              <form onSubmit={handleHelloSubmit} style={{ display: "grid", gap: 10 }}>
                <label style={{ color: "#b9b9b9" }}>
                  Name to send:
                  <input
                    value={helloName}
                    onChange={(e) => setHelloName(e.target.value)}
                    placeholder="e.g., Giorgio"
                    style={{
                      marginTop: 4,
                      width: "100%",
                      padding: "8px 10px",
                      background: "#111",
                      border: "1px solid #222",
                      borderRadius: 8,
                      color: "#eaeaea",
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={helloLoading}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #00ffd0",
                    background: helloLoading ? "#01352f" : "#002f2a",
                    color: "#00ffd0",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {helloLoading ? "Calling..." : "Call HelloWorld"}
                </button>
              </form>
            )}
            {helloError && (
              <p style={{ marginTop: 10, color: "#ff9b9b" }}>Error: {helloError}</p>
            )}
            {helloResult && !helloError && (
              <p style={{ marginTop: 10, color: "#a8ffea" }}>Response: {helloResult}</p>
            )}
            <hr style={{ borderColor: "#333", margin: "16px 0" }} />
            <p style={{ color: "#808080", fontSize: 11 }}>
              For this demo, the Protius project / staking flow on the left is{" "}
              <strong>off-chain UI only</strong>. Next step is to replace HelloWorld with the real
              Protius staking smart contract.
            </p>
          </aside>
        </div>

        <footer
          style={{
            marginTop: 32,
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
    </div>
  );
}
