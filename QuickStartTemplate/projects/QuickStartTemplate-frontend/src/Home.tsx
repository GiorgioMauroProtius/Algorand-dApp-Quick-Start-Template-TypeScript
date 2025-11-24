import React, { useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@txnlab/use-wallet-react";
import ConnectWallet from "./components/ConnectWallet";
import AppCalls from "./components/AppCalls";

type Project = {
  id: number;
  developerWallet: string;
  userName: string;
  name: string;
  country: string;
  capacity: string;
  distanceKm: string;
  notes: string;
  isApproved: boolean;
  totalStaked: number;
  stakers: number;
  devCap?: string;
  equity?: string;
  debtRatioValue?: string;
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

const STORAGE_KEY = "protius-demo-projects-v1";

const Home: React.FC = () => {
  const { activeAddress } = useWallet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const setModalState = (v: boolean) => setIsModalOpen(v);

  const registrationRef = useRef<HTMLDivElement | null>(null);
  const approvalRef = useRef<HTMLDivElement | null>(null);
  const investorRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const [projects, setProjects] = useState<Project[]>([]);
  const [developerWallet, setDeveloperWallet] = useState("");
  const [userName, setUserName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [country, setCountry] = useState("");
  const [capacityValue, setCapacityValue] = useState("");
  const [capacityUnit, setCapacityUnit] = useState<"kW" | "MW">("kW");
  const [distanceKm, setDistanceKm] = useState("");
  const [notes, setNotes] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);

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
  const [debtRatio, setDebtRatio] = useState("70");
  const [equityRequired, setEquityRequired] = useState("");
  const [autoEquity, setAutoEquity] = useState(true);
  const [codDate, setCodDate] = useState("");

  const [stakeAmountInput, setStakeAmountInput] = useState("");

  // project detail modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // helpers -----------------------------------------------------

  const formatLargeNumber = (value: string) => {
    if (!value) return "";
    const cleaned = value.replace(/,/g, "").replace(/\s/g, "");
    const num = Number(cleaned.replace(",", "."));
    if (isNaN(num)) return value;
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  const formatStake = (value: number) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatInputWithCommas = (value: string) => {
    if (!value) return "";
    const cleaned = value.replace(/,/g, "").replace(/\s/g, "");
    const [intPart, decPart] = cleaned.split(".");
    const intNum = Number(intPart);
    if (isNaN(intNum)) return value;
    const formattedInt = intNum.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });
    return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  };

  const parseNumericString = (value: string) => {
    if (!value) return 0;
    const cleaned = value.replace(/,/g, "").replace(/\s/g, "");
    const num = Number(cleaned.replace(",", "."));
    return isNaN(num) ? 0 : num;
  };

  // effects -----------------------------------------------------

  // auto-fill developer wallet
  useEffect(() => {
    if (activeAddress && !developerWallet) {
      setDeveloperWallet(activeAddress);
    }
  }, [activeAddress, developerWallet]);

  // calculate equity from dev cap + debt ratio
  useEffect(() => {
    if (!autoEquity) return;

    const dev = parseNumericString(devCapRequired);
    const debt = parseNumericString(debtRatio);
    if (!dev || !debt) {
      setEquityRequired("");
      return;
    }
    const equityPct = 100 - debt;
    if (equityPct <= 0) {
      setEquityRequired("");
      return;
    }

    const equity = (dev * equityPct) / 100;
    setEquityRequired(formatLargeNumber(equity.toString()));
  }, [devCapRequired, debtRatio, autoEquity]);

  // load projects from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Project[];
        if (Array.isArray(parsed)) {
          setProjects(parsed);
        }
      }
    } catch (err) {
      console.error("Failed to load projects from storage", err);
    }
  }, []);

  // persist projects to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
      console.error("Failed to save projects to storage", err);
    }
  }, [projects]);

  // handlers ----------------------------------------------------

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeAddress && !developerWallet) {
      alert("Connect your wallet first.");
      return;
    }
    if (!projectName || !country) {
      alert("Please enter at least a project name and country.");
      return;
    }

    const id = projects.length + 1;

    const capacityDisplay = capacityValue
      ? `${capacityValue} ${capacityUnit}`
      : "n/a";

    const distanceDisplay = distanceKm ? distanceKm : "n/a";

    const notesCombined = [
      notes,
      landStatus && `Land status: ${landStatus}`,
      landZoning && `Land zoning: ${landZoning}`,
      permitting && `Permits: ${permitting}`,
      insurances && `Insurances: ${insurances}`,
      contracts && `Contracts: ${contracts}`,
      studiesCompleted && `Studies completed: ${studiesCompleted}`,
      studiesOutstanding && `Studies outstanding: ${studiesOutstanding}`,
      approvals && `Pre-construction approvals: ${approvals}`,
      (devCapRequired || equityRequired || debtRatio || codDate) &&
        `Financials (${currency}) – Dev cap: ${
          devCapRequired ? formatLargeNumber(devCapRequired) : "n/a"
        }, Equity: ${
          equityRequired ? formatLargeNumber(equityRequired) : "n/a"
        }, Debt ratio: ${debtRatio || "n/a"}%, COD: ${codDate || "n/a"}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const newProject: Project = {
      id,
      developerWallet: developerWallet || activeAddress || "",
      userName,
      name: projectName,
      country,
      capacity: capacityDisplay,
      distanceKm: distanceDisplay,
      notes: notesCombined,
      isApproved: false,
      totalStaked: 0,
      stakers: 0,
      devCap: devCapRequired,
      equity: equityRequired,
      debtRatioValue: debtRatio,
    };

    setProjects((prev) => [...prev, newProject]);

    // reset some fields
    setProjectName("");
    setCountry("");
    setCapacityValue("");
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
    setCodDate("");

    scrollTo(approvalRef);
  };

  const handleApproveProject = (id: number) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isApproved: true } : p))
    );
  };

  const handleStakeDemo = (id: number) => {
    const amount = parseNumericString(stakeAmountInput);
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
          : p
      )
    );

    setStakeAmountInput("");
  };

  const handleOpenProjectDetails = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseProjectDetails = () => {
    setSelectedProject(null);
  };

  // derived values ----------------------------------------------

  const registeredCount = projects.length;
  const approvedCount = projects.filter((p) => p.isApproved).length;
  const totalDemoStaked = useMemo(
    () => projects.reduce((sum, p) => sum + p.totalStaked, 0),
    [projects]
  );
  const connectedWallets = activeAddress ? 1 : 0;

  const firstApprovedProject = projects.find((p) => p.isApproved) ?? null;

  // render ------------------------------------------------------

  return (
    <div className="min-h-screen bg-black/70 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <header className="space-y-4 border-b border-emerald-500/40 pb-4 bg-black/60 backdrop-blur-sm rounded-xl p-4 md:p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-semibold text-emerald-300">
                ⚡ Protius Protocol — First Demo
              </h1>
              <p className="text-sm md:text-base text-emerald-100/80 max-w-2xl">
                Register a renewable energy project, approve it, simulate
                community staking, and ping a live Algorand smart contract —
                all in one simple flow. Background is subtle so the data and
                staking logic stay front and centre.
              </p>
              {activeAddress && (
                <p className="text-xs md:text-sm text-emerald-200/90 break-all">
                  Connected wallet:{" "}
                  <span className="font-mono">{activeAddress}</span>
                </p>
              )}
            </div>

            <div className="self-start">
              <ConnectWallet openModal={openModal} closeModal={closeModal} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs md:text-sm">
            <button
              type="button"
              onClick={() => scrollTo(registrationRef)}
              className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/40 hover:bg-emerald-500/20 transition"
            >
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-xs text-black">
                1
              </span>
              Register project
            </button>
            <button
              type="button"
              onClick={() => scrollTo(approvalRef)}
              className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/40 hover:bg-emerald-500/20 transition"
            >
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-xs text-black">
                2
              </span>
              Approve &amp; view projects ({approvedCount})
            </button>
            <button
              type="button"
              onClick={() => scrollTo(investorRef)}
              className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/40 hover:bg-emerald-500/20 transition"
            >
              <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400 text-xs text-black">
                3
              </span>
              Investor / staking demo
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs md:text-sm text-emerald-200/90">
            <span>{registeredCount} projects registered</span>
            <span>• {approvedCount} approved</span>
            <span>• {formatStake(totalDemoStaked)} demo USDC staked</span>
            <span>
              • {connectedWallets} wallet
              {connectedWallets === 1 ? "" : "s"} connected
            </span>
          </div>
        </header>

        {/* Registration --------------------------------------------------- */}
        <section
          ref={registrationRef}
          className="bg-slate-950/80 border border-emerald-500/40 rounded-xl shadow-lg overflow-hidden"
        >
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
                  Developer wallet
                </label>
                <input
                  className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 font-mono"
                  placeholder="Will auto-fill from connected wallet"
                  value={developerWallet}
                  onChange={(e) => setDeveloperWallet(e.target.value)}
                />
                <p className="mt-1 text-[10px] text-emerald-200/70">
                  If left empty, Protius will use the connected wallet.
                </p>
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

              <div className="grid grid-cols-[1.4fr,0.8fr] gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-emerald-100">
                    Capacity
                  </label>
                  <input
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40"
                    placeholder="e.g., 5 000"
                    value={capacityValue}
                    onChange={(e) =>
                      setCapacityValue(formatInputWithCommas(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-emerald-100">
                    Unit
                  </label>
                  <select
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-2 text-sm text-emerald-50"
                    value={capacityUnit}
                    onChange={(e) =>
                      setCapacityUnit(e.target.value === "MW" ? "MW" : "kW")
                    }
                  >
                    <option value="kW">kW</option>
                    <option value="MW">MW</option>
                  </select>
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
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-emerald-100">
                  Distance to substation (km)
                </label>
                <input
                  className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40"
                  placeholder="e.g., 12.5"
                  value={distanceKm}
                  onChange={(e) =>
                    setDistanceKm(formatInputWithCommas(e.target.value))
                  }
                />
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
              <span>
                {showChecklist ? "▴ Hide" : "▾ Show"} developer checklist
              </span>
            </button>

            {showChecklist && (
              <div className="mt-3 grid md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block mb-1 text-emerald-100">
                    Land status
                  </label>
                  <select
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                    value={landStatus}
                    onChange={(e) => setLandStatus(e.target.value)}
                  >
                    <option value="">Select…</option>
                    <option value="Owned">Owned</option>
                    <option value="Leased">Leased</option>
                    <option value="Option / Other">Option / Other</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-emerald-100">
                    Land zoning
                  </label>
                  <select
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                    value={landZoning}
                    onChange={(e) => setLandZoning(e.target.value)}
                  >
                    <option value="">Select…</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed / Other">Mixed / Other</option>
                  </select>
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
                  <label className="block mb-1 text-emerald-100">
                    Insurances
                  </label>
                  <textarea
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50"
                    rows={2}
                    value={insurances}
                    onChange={(e) => setInsurances(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-emerald-100">
                    Contracts
                  </label>
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
                    <label className="block mb-1 text-emerald-100">
                      Currency
                    </label>
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
                    <label className="block mb-1 text-emerald-100">
                      Debt ratio (%)
                    </label>
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
                    onChange={(e) =>
                      setDevCapRequired(formatInputWithCommas(e.target.value))
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-emerald-100">
                      Equity required ({currency})
                    </label>
                    <button
                      type="button"
                      onClick={() => setAutoEquity((v) => !v)}
                      className="text-[10px] underline text-emerald-300 hover:text-emerald-200"
                    >
                      {autoEquity
                        ? "Switch to manual input"
                        : "Auto-calculate"}
                    </button>
                  </div>
                  <input
                    className="w-full rounded-md bg-slate-900/80 border border-emerald-500/40 px-2 py-1.5 text-emerald-50 disabled:opacity-70"
                    value={equityRequired}
                    onChange={(e) => {
                      setEquityRequired(
                        formatInputWithCommas(e.target.value)
                      );
                      setAutoEquity(false);
                    }}
                    disabled={autoEquity}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-emerald-100">
                    Expected COD date
                  </label>
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
                Submit project
              </button>
            </div>
          </form>
        </section>

        {/* Approval ------------------------------------------------------- */}
        <section
          ref={approvalRef}
          className="bg-slate-950/80 border border-emerald-500/40 rounded-xl shadow-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-black font-semibold">
              2
            </span>
            <h2 className="font-semibold text-emerald-100">
              Approve &amp; view projects
            </h2>
          </div>
          <p className="text-xs text-emerald-100/80">
            In a full Protius flow, this step sits with InfraPilot AI and the
            investment committee. For this demo, you can approve a project with
            a single click and make it available for the staking panel.
          </p>

          {projects.length === 0 ? (
            <p className="text-xs text-emerald-200/70">
              No projects yet. Submit at least one project above to populate
              this table.
            </p>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg border border-emerald-500/40 bg-slate-900/70 px-3 py-2 text-xs flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-emerald-100 truncate">
                        {p.name}{" "}
                        {p.isApproved && (
                          <span className="ml-1 text-[10px] rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-200">
                            Approved
                          </span>
                        )}
                      </div>
                      <div className="text-emerald-200/80 truncate">
                        {p.capacity} — {p.country} — {p.distanceKm || "n/a"} km
                        to substation
                      </div>
                      {p.userName && (
                        <div className="text-emerald-200/70">
                          Developer: {p.userName}
                        </div>
                      )}
                      {(p.devCap || p.equity || p.debtRatioValue) && (
                        <div className="mt-0.5 text-[10px] text-emerald-200/80">
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5">
                            Dev cap:{" "}
                            {p.devCap
                              ? formatLargeNumber(p.devCap)
                              : "n/a"}{" "}
                            • Equity:{" "}
                            {p.equity ? formatLargeNumber(p.equity) : "n/a"} •
                            Debt: {p.debtRatioValue || "n/a"}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        disabled={p.isApproved}
                        onClick={() => handleApproveProject(p.id)}
                        className={`rounded-md px-3 py-1 text-[11px] font-semibold ${
                          p.isApproved
                            ? "bg-emerald-500/20 text-emerald-200 cursor-default"
                            : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                        }`}
                      >
                        {p.isApproved ? "Approved" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenProjectDetails(p)}
                        className="text-[10px] underline text-emerald-300 hover:text-emerald-100"
                      >
                        View details
                      </button>
                      <div className="text-[10px] text-emerald-200/80">
                        Demo staked: {formatStake(p.totalStaked)} USDC —{" "}
                        {p.stakers} stakers
                      </div>
                    </div>
                  </div>
                  {p.notes && (
                    <div className="mt-1 text-[10px] text-emerald-200/80 line-clamp-3">
                      {p.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Investor + HelloWorld ----------------------------------------- */}
        <div ref={investorRef} className="grid md:grid-cols-[1.4fr,1.2fr] gap-6">
          <section className="bg-slate-950/80 border border-emerald-500/40 rounded-xl shadow-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-black font-semibold">
                3
              </span>
              <h2 className="font-semibold text-emerald-100">
                Investor / staking demo
              </h2>
            </div>
            <p className="text-xs text-emerald-100/80">
              Imagine you are a community investor. Pick the first approved
              project below and simulate staking demo USDC into it. This is
              front-end only for now — in the next step, the Protius staking
              smart contract will plug in.
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
                  onChange={(e) =>
                    setStakeAmountInput(
                      formatInputWithCommas(e.target.value)
                    )
                  }
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
                        {firstApprovedProject.capacity} —{" "}
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
                        {formatStake(firstApprovedProject.totalStaked)} USDC
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
                  Approve at least one project in step 2 to enable the staking
                  demo.
                </p>
              )}
            </div>
          </section>

          <section className="bg-slate-950/80 border border-emerald-500/40 rounded-xl shadow-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm text-black font-semibold">
                4
              </span>
              <h2 className="font-semibold text-emerald-100">
                HelloWorld on Algorand (demo wire-up)
              </h2>
            </div>
            <p className="text-xs text-emerald-100/80">
              This panel talks to the live{" "}
              <span className="font-semibold">HelloWorld</span> smart contract
              already deployed on Algorand TestNet. For now it returns a simple
              response; next we replace this with the Protius staking contract.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setModalState(true)}
                className="rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold px-4 py-2 shadow-lg shadow-emerald-500/30"
              >
                Open HelloWorld demo
              </button>
              <span className="text-[11px] text-emerald-200/80">
                Opens a dialog that deploys and calls the TestNet HelloWorld
                contract.
              </span>
            </div>

            <div className="mt-2">
              <AppCalls openModal={isModalOpen} setModalState={setModalState} />
            </div>
          </section>
        </div>

        <footer className="pt-4 text-center">
          <p className="text-white/85 text-xs inline-block bg-black/40 px-3 py-1 rounded-full drop-shadow-md">
            Protius Protocol — Built on Algorand TestNet.
          </p>
        </footer>
      </div>

      {/* Project detail modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="max-w-lg w-full rounded-xl bg-slate-950 border border-emerald-500/40 shadow-2xl p-4 space-y-3 text-xs text-emerald-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-emerald-200">
                  {selectedProject.name}
                </h3>
                <p className="text-[11px] text-emerald-200/80">
                  {selectedProject.capacity} — {selectedProject.country} —{" "}
                  {selectedProject.distanceKm || "n/a"} km to substation
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseProjectDetails}
                className="text-[11px] text-emerald-300 hover:text-emerald-100"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-emerald-300/90">
                  Developer wallet
                </div>
                <div className="font-mono break-all">
                  {selectedProject.developerWallet || "n/a"}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-300/90">
                  Developer name
                </div>
                <div>{selectedProject.userName || "n/a"}</div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-300/90">
                  Demo staked
                </div>
                <div>
                  {formatStake(selectedProject.totalStaked)} USDC —{" "}
                  {selectedProject.stakers} stakers
                </div>
              </div>
              {(selectedProject.devCap ||
                selectedProject.equity ||
                selectedProject.debtRatioValue) && (
                <div>
                  <div className="text-[10px] text-emerald-300/90">
                    Financial snapshot
                  </div>
                  <div>
                    Dev cap:{" "}
                    {selectedProject.devCap
                      ? formatLargeNumber(selectedProject.devCap)
                      : "n/a"}
                    , Equity:{" "}
                    {selectedProject.equity
                      ? formatLargeNumber(selectedProject.equity)
                      : "n/a"}
                    , Debt: {selectedProject.debtRatioValue || "n/a"}%
                  </div>
                </div>
              )}
            </div>

            {selectedProject.notes && (
              <div className="pt-2 border-t border-emerald-500/30">
                <div className="text-[10px] text-emerald-300/90 mb-1">
                  Project notes & milestones
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-100/90">
                  {selectedProject.notes.split(" | ").map((chunk, idx) => (
                    <li key={idx}>{chunk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
