import React, { useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium",
  "Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria",
  "Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad",
  "Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)","Costa Rica","Côte d’Ivoire","Croatia",
  "Cuba","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada",
  "Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati",
  "Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania",
  "Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania",
  "Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique",
  "Myanmar (Burma)","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay",
  "Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis",
  "Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia",
  "Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago",
  "Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen",
  "Zambia","Zimbabwe"
];

const Home: React.FC = () => {
  const { activeAccount } = useWallet();

  // registration state
  const [userName, setUserName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [country, setCountry] = useState("");
  const [capacityKw, setCapacityKw] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [notes, setNotes] = useState("");

  // checklist state
  const [showChecklist, setShowChecklist] = useState(false);
  const [landStatus, setLandStatus] = useState("");
  const [landZoning, setLandZoning] = useState("");
  const [permitting, setPermitting] = useState("");
  const [insurances, setInsurances] = useState("");
  const [contracts, setContracts] = useState("");
  const [techCompleted, setTechCompleted] = useState("");
  const [techOutstanding, setTechOutstanding] = useState("");
  const [preApprovals, setPreApprovals] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [devCapRequired, setDevCapRequired] = useState("");
  const [equityRequired, setEquityRequired] = useState("");
  const [debtRatio, setDebtRatio] = useState("");
  const [expectedCod, setExpectedCod] = useState("");
  const [epcContracted, setEpcContracted] = useState(false);
  const [ownersEngineerContracted, setOwnersEngineerContracted] = useState(false);

  // investor / staking demo state
  const [stakeInput, setStakeInput] = useState("");
  const [demoTotalStaked, setDemoTotalStaked] = useState(1); // start from 1 demo USDC
  const [demoStakers, setDemoStakers] = useState(1);

  // HelloWorld demo state (simulated response, so no "Failed to fetch")
  const [helloName, setHelloName] = useState("Giorgio");
  const [helloResult, setHelloResult] = useState<string | null>(null);
  const [helloError, setHelloError] = useState<string | null>(null);
  const [helloLoading, setHelloLoading] = useState(false);

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    // demo only: log to console
    console.log("Project submitted", {
      developerWallet: activeAccount?.address,
      userName,
      projectName,
      country,
      capacityKw,
      distanceKm,
      notes,
      checklist: showChecklist ? {
        landStatus,
        landZoning,
        permitting,
        insurances,
        contracts,
        techCompleted,
        techOutstanding,
        preApprovals,
        currency,
        devCapRequired,
        equityRequired,
        debtRatio,
        expectedCod,
        epcContracted,
        ownersEngineerContracted,
      } : null,
    });
    alert("Project registered (demo only).");
  };

  const handleStakeDemo = () => {
    const amount = Number(stakeInput);
    if (!amount || amount <= 0 || isNaN(amount)) return;
    setDemoTotalStaked(prev => prev + amount);
    setDemoStakers(prev => prev + 1);
    setStakeInput("");
  };

  const handleCallHelloWorld = async () => {
    try {
      setHelloLoading(true);
      setHelloError(null);
      const nameToSend = helloName.trim() || "world";

      // Demo response so we never get "Failed to fetch" in Vercel
      await new Promise(resolve => setTimeout(resolve, 400));
      setHelloResult(`Hello, ${nameToSend}! (demo response)`);
    } catch (err: any) {
      setHelloError(err?.message ?? "Unknown error");
    } finally {
      setHelloLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Header + tabs + metrics */}
        <header className="space-y-4 border-b border-emerald-500/40 pb-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold text-emerald-300">
              ⚡ Protius Protocol — Demo
            </h1>
            <p className="text-sm md:text-base text-emerald-50/90">
              Register a renewable energy project, simulate community staking, and ping a live
              Algorand smart contract — all in one simple flow.
            </p>
            <div className="text-xs md:text-sm text-emerald-100/80">
              Connected wallet:{" "}
              <span className="font-mono text-emerald-300">
                {activeAccount?.address ?? "No wallet connected"}
              </span>
            </div>
          </div>

          {/* Step "tabs" */}
          <div className="flex flex-wrap gap-3 text-xs md:text-sm">
            <button className="px-4 py-2 rounded-full bg-emerald-600 text-black font-semibold shadow shadow-emerald-900/50">
              1 Register project
            </button>
            <button className="px-4 py-2 rounded-full bg-emerald-900/40 border border-emerald-600/60 text-emerald-100">
              2 Approve &amp; view projects (1)
            </button>
            <button className="px-4 py-2 rounded-full bg-emerald-900/40 border border-emerald-600/60 text-emerald-100">
              3 Investor / staking demo
            </button>
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap gap-3 text-[11px] md:text-xs text-emerald-100/80">
            <div className="px-3 py-1 rounded-full bg-black/60 border border-emerald-600/70">
              <span className="font-semibold">1</span> projects registered
            </div>
            <div className="px-3 py-1 rounded-full bg-black/60 border border-emerald-600/70">
              <span className="font-semibold">1</span> approved
            </div>
            <div className="px-3 py-1 rounded-full bg-black/60 border border-emerald-600/70">
              <span className="font-semibold">{demoTotalStaked.toFixed(2)}</span> demo USDC staked
            </div>
          </div>
        </header>

        {/* 1. Project registration */}
        <section className="bg-black/75 border border-emerald-500/60 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-lg md:text-xl font-semibold text-emerald-200">
            1️⃣ Protius Project Registration
          </h2>

          <form onSubmit={handleSubmitProject} className="space-y-4 text-xs md:text-sm">
            <div>
              <label className="block mb-1 text-emerald-100/80">Developer Wallet</label>
              <input
                type="text"
                readOnly
                value={activeAccount?.address ?? ""}
                placeholder="Connect wallet to populate…"
                className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 font-mono text-[11px] md:text-xs"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-emerald-100/80">Your name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g., Giorgio Mauro"
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block mb-1 text-emerald-100/80">Project name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Sunny Ridge Solar"
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-[2fr,1fr,1fr] gap-4">
              <div>
                <label className="block mb-1 text-emerald-100/80">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-emerald-100/80">Capacity (kW)</label>
                <input
                  type="number"
                  value={capacityKw}
                  onChange={(e) => setCapacityKw(e.target.value)}
                  placeholder="e.g., 5000"
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                />
              </div>
              <div>
                <label className="block mb-1 text-emerald-100/80">Distance to substation (km)</label>
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="e.g., 12.5"
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-emerald-100/80">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key details, permits / grid / site notes…"
                rows={3}
                className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
              />
            </div>

            {/* Checklist toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowChecklist(v => !v)}
                className="w-full md:w-auto px-4 py-2 rounded-full border border-emerald-500 bg-emerald-700/20 hover:bg-emerald-600/30 text-[11px] md:text-xs font-semibold"
              >
                {showChecklist ? "▲ Hide Developer Checklist" : "▼ Show Developer Checklist"}
              </button>
            </div>

            {showChecklist && (
              <div className="mt-4 border-t border-emerald-700/60 pt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-emerald-100/80">Land status</label>
                    <select
                      value={landStatus}
                      onChange={(e) => setLandStatus(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                    >
                      <option value="">Select…</option>
                      <option>Owned</option>
                      <option>Option to purchase</option>
                      <option>Leased</option>
                      <option>Under negotiation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100/80">Land zoning</label>
                    <select
                      value={landZoning}
                      onChange={(e) => setLandZoning(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                    >
                      <option value="">Select…</option>
                      <option>Agricultural</option>
                      <option>Industrial</option>
                      <option>Commercial</option>
                      <option>Mixed use</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <textarea
                    value={permitting}
                    onChange={(e) => setPermitting(e.target.value)}
                    placeholder="Permitting (completed / pending)…"
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                  />
                  <textarea
                    value={insurances}
                    onChange={(e) => setInsurances(e.target.value)}
                    placeholder="Insurances in place or committed…"
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <textarea
                    value={contracts}
                    onChange={(e) => setContracts(e.target.value)}
                    placeholder="Contracts already in place…"
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                  />
                  <textarea
                    value={techCompleted}
                    onChange={(e) => setTechCompleted(e.target.value)}
                    placeholder="Technical studies completed…"
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <textarea
                    value={techOutstanding}
                    onChange={(e) => setTechOutstanding(e.target.value)}
                    placeholder="Technical studies outstanding…"
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                  />
                  <textarea
                    value={preApprovals}
                    onChange={(e) => setPreApprovals(e.target.value)}
                    placeholder="Pre-construction approvals (if any)…"
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                      >
                        <option>USD</option>
                        <option>EUR</option>
                        <option>ZAR</option>
                        <option>GBP</option>
                        <option>CAD</option>
                      </select>
                      <input
                        type="number"
                        value={devCapRequired}
                        onChange={(e) => setDevCapRequired(e.target.value)}
                        placeholder="Dev capital"
                        className="rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                      />
                      <input
                        type="number"
                        value={equityRequired}
                        onChange={(e) => setEquityRequired(e.target.value)}
                        placeholder="Equity"
                        className="rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={debtRatio}
                        onChange={(e) => setDebtRatio(e.target.value)}
                        placeholder="Debt ratio (%)"
                        className="rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                      />
                      <input
                        type="date"
                        value={expectedCod}
                        onChange={(e) => setExpectedCod(e.target.value)}
                        className="rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={epcContracted}
                        onChange={(e) => setEpcContracted(e.target.checked)}
                      />
                      EPC contracted
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ownersEngineerContracted}
                        onChange={(e) => setOwnersEngineerContracted(e.target.checked)}
                      />
                      Owner&apos;s Engineer contracted
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-black shadow-lg shadow-emerald-800/50"
              >
                Submit Project
              </button>
            </div>
          </form>
        </section>

        {/* 2 & 3: Investor / staking + HelloWorld */}
        <section className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Investor / staking demo */}
          <div className="bg-black/75 border border-emerald-500/60 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-emerald-200">
              2️⃣ Investor / staking demo
            </h2>
            <p className="text-xs md:text-sm text-emerald-50/90">
              Imagine you are a community investor. Here you can pick an approved project and
              simulate staking demo USDC into it. This is front-end only for now; the real
              Protius staking contract will plug in next.
            </p>

            <div className="space-y-3 text-xs md:text-sm">
              <div>
                <label className="block mb-1 text-emerald-100/80">
                  Stake amount (demo USDC)
                </label>
                <input
                  type="number"
                  value={stakeInput}
                  onChange={(e) => setStakeInput(e.target.value)}
                  placeholder="e.g., 1"
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2"
                />
              </div>

              <div className="rounded-xl border border-emerald-600/70 bg-black/70 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-emerald-100">Drombeg2</div>
                    <div className="text-xs text-emerald-200/80">62 kW — Canada</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-300">
                      Total demo staked: {demoTotalStaked.toFixed(2)} USDC
                    </div>
                    <div className="text-xs text-emerald-100/80">
                      {demoStakers} stakers
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStakeDemo}
                  className="mt-1 w-full md:w-auto px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-xs md:text-sm font-semibold text-black shadow-md shadow-emerald-800/50"
                >
                  Stake (demo only)
                </button>
              </div>

              <p className="text-[11px] text-emerald-100/70 pt-1">
                Note: this staking is <span className="font-semibold">front-end only</span>. 
                The only on-chain call in this demo will be the Protius staking contract
                we add later.
              </p>
            </div>
          </div>

          {/* HelloWorld demo */}
          <div className="bg-emerald-900/40 border border-emerald-500/70 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-emerald-200">
              3️⃣ HelloWorld on Algorand (demo wire-up)
            </h2>
            <p className="text-xs md:text-sm text-emerald-50/90">
              This box simulates a call to the <span className="font-semibold">HelloWorld</span>{" "}
              smart contract on Algorand TestNet (App ID:{" "}
              <span className="font-mono">749547327</span>). For now we return a local demo
              response, so the UI is always stable on Vercel.
            </p>

            <div className="space-y-3 text-xs md:text-sm">
              <div>
                <label className="block mb-1 text-emerald-100/80">Name to send</label>
                <input
                  type="text"
                  value={helloName}
                  onChange={(e) => setHelloName(e.target.value)}
                  className="w-full rounded-md bg-black/70 border border-emerald-600 px-3 py-2"
                />
              </div>

              <button
                type="button"
                onClick={handleCallHelloWorld}
                disabled={helloLoading}
                className="w-full px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-xs md:text-sm font-semibold text-black shadow-md shadow-emerald-800/60"
              >
                {helloLoading ? "Calling HelloWorld…" : "Call HelloWorld"}
              </button>

              {helloResult && (
                <div className="mt-2 rounded-md bg-black/60 border border-emerald-500/60 px-3 py-2 font-mono text-xs md:text-sm text-emerald-200">
                  {helloResult}
                </div>
              )}

              {helloError && (
                <div className="mt-2 rounded-md bg-red-900/40 border border-red-500/70 px-3 py-2 text-xs md:text-sm text-red-100">
                  Error: {helloError}
                </div>
              )}

              <p className="text-[11px] text-emerald-100/70 pt-1">
                Next step: swap this demo call for the real{" "}
                <span className="font-mono">HelloWorld</span> client generated by AlgoKit, 
                signed by your connected wallet — or replace it with the Protius staking contract.
              </p>
            </div>
          </div>
        </section>

        <footer className="pt-4 pb-6 text-[11px] text-center text-emerald-100/60">
          © {new Date().getFullYear()} Protius Protocol — Built on Algorand TestNet.
        </footer>
      </main>
    </div>
  );
};

export default Home;
