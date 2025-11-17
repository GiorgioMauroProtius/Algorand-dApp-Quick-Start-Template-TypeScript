import React, { useMemo, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ConnectWallet from "./components/ConnectWallet";
import AppCalls from "./components/AppCalls";

type Project = {
  id: number;
  developerWallet: string;
  userName: string;
  name: string;
  country: string;
  capacityKw: string;
  distanceKm: string;
  notes: string;
  isApproved: boolean;
  totalStaked: number;
  stakers: number;
};

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo, Democratic Republic of the",
  "Congo, Republic of the",
  "Costa Rica",
  "Côte d’Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const Home: React.FC = () => {
  const { activeAddress } = useWallet();

  // --- Project registration state ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [developerWallet, setDeveloperWallet] = useState("");
  const [userName, setUserName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [country, setCountry] = useState("");
  const [capacityKw, setCapacityKw] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [notes, setNotes] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);

  // Extended developer checklist fields (just kept as text, demo only)
  const [landStatus, setLandStatus] = useState("");
  const [landZoning, setLandZoning] = useState("");
  const [permitting, setPermitting] = useState("");
  const [insurances, setInsurances] = useState("");
  const [contracts, setContracts] = useState("");
  const [studiesCompleted, setStudiesCompleted] = useState("");
  const [studiesOutstanding, setStudiesOutstanding] = useState("");
  const [approvals, setApprovals] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [devCapRequired, setDevCapRequired] = useState("");
  const [equityRequired, setEquityRequired] = useState("");
  const [debtRatio, setDebtRatio] = useState("");
  const [codDate, setCodDate] = useState("");

  // --- Investor demo staking ---
  const [stakeAmountInput, setStakeAmountInput] = useState("");

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeAddress) {
      alert("Connect your wallet first.");
      return;
    }
    if (!projectName || !country) {
      alert("Please enter at least a project name and country.");
      return;
    }

    const id = projects.length + 1;

    const newProject: Project = {
      id,
      developerWallet: developerWallet || activeAddress,
      userName,
      name: projectName,
      country,
      capacityKw,
      distanceKm,
      notes: [
        notes,
        landStatus && `Land status: ${landStatus}`,
        landZoning && `Land zoning: ${landZoning}`,
        permitting && `Permits: ${permitting}`,
        insurances && `Insurances: ${insurances}`,
        contracts && `Contracts: ${contracts}`,
        studiesCompleted && `Studies completed: ${studiesCompleted}`,
        studiesOutstanding && `Studies outstanding: ${studiesOutstanding}`,
        approvals && `Pre-construction approvals: ${approvals}`,
        currency &&
          (devCapRequired || equityRequired || debtRatio || codDate) &&
          `Financials (${currency}) – Dev cap: ${devCapRequired || "n/a"}, Equity: ${
            equityRequired || "n/a"
          }, Debt ratio: ${debtRatio || "n/a"}%, COD: ${codDate || "n/a"}`,
      ]
        .filter(Boolean)
        .join(" | "),
      isApproved: false,
      totalStaked: 0,
      stakers: 0,
    };

    setProjects((prev) => [...prev, newProject]);

    // reset light fields but keep some context
    setDeveloperWallet("");
    setUserName("");
    setProjectName("");
    setCountry("");
    setCapacityKw("");
    setDistanceKm("");
    setNotes("");
    setLandStatus("");
    setLandZoning("");
    setPermitting("");
    setInsurances("");
    setContracts("");
    setStudiesCompleted("");
    setStudiesOutstanding("");
    setApprovals("");
    setDevCapRequired("");
    setEquityRequired("");
    setDebtRatio("");
    setCodDate("");
  };

  const handleApproveProject = (id: number) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isApproved: true } : p)),
    );
  };

  const handleStakeDemo = (id: number) => {
    const amount = parseFloat(stakeAmountInput || "0");
    if (!amount || amount <= 0) {
      alert("Enter a positive amount to stake.");
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              totalStaked: p.totalStaked + amount,
              stakers: p.stakers + 1,
            }
          : p,
      ),
    );

    setStakeAmountInput("");
  };

  const registeredCount = projects.length;
  const approvedCount = projects.filter((p) => p.isApproved).length;
  const totalDemoStaked = useMemo(
    () => projects.reduce((sum, p) => sum + p.totalStaked, 0),
    [projects],
  );

  const firstApprovedProject = projects.find((p) => p.isApproved) ?? null;

  return (
    <div className="min-h-screen bg-black/70 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Header + wallet + metrics */}
        <header className="space-y-4 border-b border-emerald-500/40 pb-4 bg-black/60 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-emerald-300">
                ⚡ Protius Protocol — Demo
              </h1>
              <p className="text-sm md:text-base text-emerald-100/80 max-w-2xl">
                Register a renewable energy project, simulate community staking,
                and ping a live Algorand smart contract — all in one simple
                flow. The background stays subtle so we can focus on the data
                and the staking contract we add later.
              </p>
              {activeAddress && (
                <p className="text-xs md:text-sm text-emerald-200/90 break-all">
                  Connected wallet:{" "}
                  <span className="font-mono">
                    {activeAddress}
                  </span>
                </p>
              )}
            </div>

            <div className="self-start">
              {/* Top-right connect / disconnect button */}
              <ConnectWallet />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs md:text-sm">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/40">
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-xs text-black">
                1
              </span>
              Register project
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/40">
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-xs text-black">
                2
              </span>
              Approve &amp; view projects ({approvedCount})
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/40">
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-xs text-black">
                3
              </span>
              Investor / staking demo
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs md:text-sm text-emerald-200/90">
            <span>{registeredCount} projects registered</span>
            <span>• {approvedCount} approved</span>
            <span>• {totalDemoStaked.toFixed(2)} demo USDC staked</span>
          </div>
        </header>

        {/* Main content */}
        <div className="space-y-6">
          {/* Project registration card */}
          <section className="bg-slate-950/80 border border-emerald-500/40 rounded-xl shadow-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-emerald-500/30 bg-slate-950/90 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-black font-semibold">
                1
              </span>
              <h2 className="font-semibold text-emerald-100">
                Protius Project Registration
              </h2>
            </div>

            <form onSubmit={handleSubmitProject} className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-emerald-100">
                    Developer Wallet
                  </label>
                  <input
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 font-mono"
                    placeholder="Will default to connected wallet"
                    value={developerWallet}
                    onChange={(e) => setDeveloperWallet(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-emerald-100">
                    Project name
                  </label>
                  <input
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40"
                    placeholder="e.g., Sunny Ridge Solar"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-emerald-100">
                    Your name
                  </label>
                  <input
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40"
                    placeholder="e.g., Giorgio Mauro"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-emerald-100">
                      Capacity (kW)
                    </label>
                    <input
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40"
                      placeholder="e.g., 5000"
                      value={capacityKw}
                      onChange={(e) => setCapacityKw(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-emerald-100">
                      Distance to substation (km)
                    </label>
                    <input
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40"
                      placeholder="e.g., 12.5"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-emerald-100">
                    Country
                  </label>
                  <select
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="">Select country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-emerald-100">
                  Notes
                </label>
                <textarea
                  className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40"
                  rows={3}
                  placeholder="Key details, permits/status, grid, site notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-slate-900/80 px-3 py-1.5 text-xs text-emerald-100 hover:bg-slate-900"
                onClick={() => setShowChecklist((prev) => !prev)}
              >
                <span>{showChecklist ? "▴ Hide" : "▾ Show"} Developer Checklist</span>
              </button>

              {showChecklist && (
                <div className="mt-3 grid md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block mb-1 text-emerald-100">Land status</label>
                    <input
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      value={landStatus}
                      onChange={(e) => setLandStatus(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">Land zoning</label>
                    <input
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      value={landZoning}
                      onChange={(e) => setLandZoning(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">
                      Permitting (completed / pending)
                    </label>
                    <textarea
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      rows={2}
                      value={permitting}
                      onChange={(e) => setPermitting(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">Insurances</label>
                    <textarea
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      rows={2}
                      value={insurances}
                      onChange={(e) => setInsurances(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">Contracts</label>
                    <textarea
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      rows={2}
                      value={contracts}
                      onChange={(e) => setContracts(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">
                      Technical studies completed
                    </label>
                    <textarea
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      rows={2}
                      value={studiesCompleted}
                      onChange={(e) => setStudiesCompleted(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">
                      Technical studies outstanding
                    </label>
                    <textarea
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      rows={2}
                      value={studiesOutstanding}
                      onChange={(e) => setStudiesOutstanding(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">
                      Pre-construction approvals
                    </label>
                    <textarea
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      rows={2}
                      value={approvals}
                      onChange={(e) => setApprovals(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 text-emerald-100">Currency</label>
                      <select
                        className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="ZAR">ZAR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-emerald-100">Debt ratio (%)</label>
                      <input
                        className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                        value={debtRatio}
                        onChange={(e) => setDebtRatio(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">
                      Development capital required ({currency})
                    </label>
                    <input
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      value={devCapRequired}
                      onChange={(e) => setDevCapRequired(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">
                      Equity required ({currency})
                    </label>
                    <input
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      value={equityRequired}
                      onChange={(e) => setEquityRequired(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-emerald-100">Expected COD date</label>
                    <input
                      type="date"
                      className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                      value={codDate}
                      onChange={(e) => setCodDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full md:w-auto rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6 py-2 text-sm shadow-lg shadow-emerald-500/30"
                >
                  Submit Project
                </button>
              </div>
            </form>
          </section>

          {/* Investor + HelloWorld grid */}
          <div className="grid md:grid-cols-[1.4fr,1.2fr] gap-6">
            {/* Investor / staking demo */}
            <section className="bg-slate-950/80 border border-emerald-500/40 rounded-xl shadow-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-black font-semibold">
                  2
                </span>
                <h2 className="font-semibold text-emerald-100">
                  Investor / staking demo
                </h2>
              </div>
              <p className="text-xs text-emerald-100/80">
                Imagine you are a community investor. Pick an approved project and
                simulate staking demo USDC into it. This is front-end only for
                now — in the next step, the Protius staking smart contract will
                plug in.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-emerald-100">
                    Stake amount (demo USDC)
                  </label>
                  <input
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40"
                    placeholder="e.g., 1.00"
                    value={stakeAmountInput}
                    onChange={(e) => setStakeAmountInput(e.target.value)}
                  />
                </div>

                {firstApprovedProject ? (
                  <div className="rounded-lg border border-emerald-500/40 bg-slate-900/70 px-3 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-emerald-100">
                          {firstApprovedProject.name}
                        </div>
                        <div className="text-xs text-emerald-200/80">
                          {firstApprovedProject.capacityKw || "n/a"} kW —{" "}
                          {firstApprovedProject.country || "Country"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold px-4 py-1.5"
                        onClick={() => handleStakeDemo(firstApprovedProject.id)}
                      >
                        Stake (demo only)
                      </button>
                    </div>
                    <div className="text-xs text-emerald-200/80">
                      Total demo staked:{" "}
                      <span className="font-semibold">
                        {firstApprovedProject.totalStaked.toFixed(2)} USDC
                      </span>{" "}
                      —{" "}
                      <span className="font-semibold">
                        {firstApprovedProject.stakers}
                      </span>{" "}
                      stakers
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-200/70">
                    Approve at least one project above to enable the staking demo.
                  </p>
                )}
              </div>
            </section>

            {/* HelloWorld / on-chain demo */}
            <section className="bg-slate-950/80 border border-emerald-500/40 rounded-xl shadow-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-black font-semibold">
                  3
                </span>
                <h2 className="font-semibold text-emerald-100">
                  HelloWorld on Algorand (demo wire-up)
                </h2>
              </div>
              <p className="text-xs text-emerald-100/80">
                This panel talks to the live <span className="font-semibold">HelloWorld</span>{" "}
                smart contract already deployed on Algorand TestNet. For now it
                returns a simple response; next we replace this with the Protius
                staking contract.
              </p>

              <div className="mt-2">
                <AppCalls />
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-4">
          <p className="text-white/85 text-xs text-center drop-shadow-md bg-black/40 inline-block px-3 py-1 rounded-full mx-auto">
            Protius Protocol — Built on Algorand TestNet.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
