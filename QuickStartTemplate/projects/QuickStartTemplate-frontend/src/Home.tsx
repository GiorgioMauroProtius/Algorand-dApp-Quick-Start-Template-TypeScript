// projects/QuickStartTemplate-frontend/src/Home.tsx

import React, { useState } from "react";
import { useWallet } from "@txnlab/use-wallet";

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
  "Congo (Congo-Brazzaville)",
  "Costa Rica",
  "Côte d’Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
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
  "Myanmar (Burma)",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
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
  "South Korea",
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
  "United States of America",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const landStatusOptions = ["Owned", "Leased", "Lease in negotiation", "Option"];
const landZoningOptions = ["Agricultural", "Industrial", "Commercial", "Residential", "Mixed use"];

const Home: React.FC = () => {
  const { activeAddress } = useWallet();

  // Project registration basic fields
  const [userName, setUserName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [country, setCountry] = useState("");
  const [capacityKw, setCapacityKw] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [notes, setNotes] = useState("");

  // Checklist toggle + fields
  const [showChecklist, setShowChecklist] = useState(false);
  const [landStatus, setLandStatus] = useState("");
  const [landZoning, setLandZoning] = useState("");
  const [permitting, setPermitting] = useState("");
  const [insurances, setInsurances] = useState("");
  const [contracts, setContracts] = useState("");
  const [technicalStudiesCompleted, setTechnicalStudiesCompleted] = useState("");
  const [technicalStudiesOutstanding, setTechnicalStudiesOutstanding] = useState("");
  const [preConstructionApprovals, setPreConstructionApprovals] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [devCapRequired, setDevCapRequired] = useState("");
  const [equityRequired, setEquityRequired] = useState("");
  const [debtRatio, setDebtRatio] = useState("");
  const [expectedCod, setExpectedCod] = useState("");
  const [epcContracted, setEpcContracted] = useState(false);
  const [ownersEngineerContracted, setOwnersEngineerContracted] = useState(false);

  // HelloWorld demo state
  const [helloName, setHelloName] = useState("");
  const [helloResult, setHelloResult] = useState<string | null>(null);
  const [helloError, setHelloError] = useState<string | null>(null);
  const [helloLoading, setHelloLoading] = useState(false);

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      developerWallet: activeAddress,
      userName,
      projectName,
      country,
      capacityKw,
      distanceKm,
      notes,
      checklist: showChecklist
        ? {
            landStatus,
            landZoning,
            permitting,
            insurances,
            contracts,
            technicalStudiesCompleted,
            technicalStudiesOutstanding,
            preConstructionApprovals,
            currency,
            devCapRequired,
            equityRequired,
            debtRatio,
            expectedCod,
            epcContracted,
            ownersEngineerContracted,
          }
        : null,
    };

    // For now just log to console – later we can wire this to backend or Algorand.
    console.log("Submit Protius project:", payload);
    alert("Project submitted (demo only – no on-chain write yet).");
  };

  /**
   * HelloWorld call – this is just a thin wrapper around a fetch.
   * In your current template you likely already have a helper for this.
   * If so, you can replace the body of this function with that helper.
   */
  const handleCallHelloWorld = async () => {
    try {
      setHelloLoading(true);
      setHelloError(null);
      setHelloResult(null);

      // Example: call a backend API route that talks to the HelloWorld contract.
      // Update `/api/helloworld` to match your actual route or client function.
      const response = await fetch(
        `/api/helloworld?name=${encodeURIComponent(helloName || "world")}`
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      const data = await response.json();
      // Expecting something like { message: "Hello, Giorgio" }
      setHelloResult(data.message ?? JSON.stringify(data));
    } catch (err: any) {
      console.error("HelloWorld error", err);
      setHelloError(err?.message || "Failed to call HelloWorld");
    } finally {
      setHelloLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Main container overlays the background image configured in CSS */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Project registration card */}
        <div className="bg-black/70 rounded-xl border border-emerald-500/60 shadow-xl p-6 space-y-6">
          <h1 className="text-2xl font-semibold text-emerald-300">
            ⚡ Protius Project Registration
          </h1>
          <p className="text-sm text-emerald-100/80">
            Register a renewable energy project to start the Protius lifecycle (DEVT → kWp → kWh).
          </p>

          <div className="bg-emerald-900/50 text-emerald-100 rounded-lg px-4 py-2 text-sm">
            <span className="font-semibold">Connected wallet:</span>{" "}
            {activeAddress ?? "No wallet connected"}
          </div>

          <form onSubmit={handleSubmitProject} className="space-y-5">
            {/* Basic fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1">Developer Wallet</label>
                <input
                  type="text"
                  value={activeAddress ?? ""}
                  readOnly
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs mb-1">User Name</label>
                <input
                  type="text"
                  placeholder="e.g., Giorgio Mauro"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g., Sunny Ridge Solar"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1">Capacity (kW)</label>
                  <input
                    type="number"
                    placeholder="e.g., 5000"
                    value={capacityKw}
                    onChange={(e) => setCapacityKw(e.target.value)}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">
                    Distance from Substation (km)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 12.5"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-1">Description / Notes</label>
                <textarea
                  placeholder="Key details, permits/status, grid, site notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Toggle checklist */}
            <button
              type="button"
              onClick={() => setShowChecklist((v) => !v)}
              className="w-full mt-2 rounded-md border border-emerald-500 bg-emerald-900/40 hover:bg-emerald-800/60 py-2 text-sm font-semibold text-emerald-200"
            >
              {showChecklist ? "▲ Hide full developer checklist" : "▼ Show full developer checklist"}
            </button>

            {/* Checklist content */}
            {showChecklist && (
              <div className="mt-4 space-y-4 bg-black/50 border border-emerald-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Land Status</label>
                    <select
                      value={landStatus}
                      onChange={(e) => setLandStatus(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                    >
                      <option value="">Select...</option>
                      {landStatusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Land Zoning</label>
                    <select
                      value={landZoning}
                      onChange={(e) => setLandZoning(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                    >
                      <option value="">Select...</option>
                      {landZoningOptions.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs mb-1">
                    Permitting (completed / pending)
                  </label>
                  <textarea
                    placeholder="List permits obtained and those outstanding..."
                    value={permitting}
                    onChange={(e) => setPermitting(e.target.value)}
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Insurances</label>
                  <textarea
                    placeholder="List insurances in place or committed..."
                    value={insurances}
                    onChange={(e) => setInsurances(e.target.value)}
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">Contracts</label>
                  <textarea
                    placeholder="List contracts already in place..."
                    value={contracts}
                    onChange={(e) => setContracts(e.target.value)}
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">
                    Technical Studies completed
                  </label>
                  <textarea
                    placeholder="List completed studies..."
                    value={technicalStudiesCompleted}
                    onChange={(e) =>
                      setTechnicalStudiesCompleted(e.target.value)
                    }
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">
                    Technical Studies outstanding
                  </label>
                  <textarea
                    placeholder="List outstanding studies..."
                    value={technicalStudiesOutstanding}
                    onChange={(e) =>
                      setTechnicalStudiesOutstanding(e.target.value)
                    }
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs mb-1">
                    Pre-Construction Approvals
                  </label>
                  <textarea
                    placeholder="If any, list..."
                    value={preConstructionApprovals}
                    onChange={(e) =>
                      setPreConstructionApprovals(e.target.value)
                    }
                    rows={2}
                    className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="ZAR">ZAR</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Development Capital Required
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 1,250,000"
                      value={devCapRequired}
                      onChange={(e) => setDevCapRequired(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Equity Required
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 900,000"
                      value={equityRequired}
                      onChange={(e) => setEquityRequired(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs mb-1">Debt Ratio (%)</label>
                    <input
                      type="number"
                      placeholder="e.g., 65"
                      value={debtRatio}
                      onChange={(e) => setDebtRatio(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      Expected COD date
                    </label>
                    <input
                      type="date"
                      value={expectedCod}
                      onChange={(e) => setExpectedCod(e.target.value)}
                      className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-5 md:mt-7">
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={epcContracted}
                        onChange={(e) => setEpcContracted(e.target.checked)}
                      />
                      EPC contracted
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={ownersEngineerContracted}
                        onChange={(e) =>
                          setOwnersEngineerContracted(e.target.checked)
                        }
                      />
                      Owner&apos;s Engineer contracted
                    </label>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="mt-6 w-full rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 text-sm"
            >
              Submit Project
            </button>
          </form>
        </div>

        {/* HelloWorld smart contract demo */}
        <div className="bg-emerald-900/60 rounded-xl border border-emerald-500/80 shadow-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-emerald-200">
            TestNet HelloWorld smart contract
          </h2>
          <p className="text-xs text-emerald-100/80">
            This demo box is meant to talk to the live <strong>HelloWorld</strong>{" "}
            application on Algorand TestNet (App ID set in your config).
          </p>

          <div className="space-y-2">
            <label className="block text-xs mb-1">Name to send:</label>
            <input
              type="text"
              value={helloName}
              onChange={(e) => setHelloName(e.target.value)}
              placeholder="e.g., Giorgio"
              className="w-full rounded-md bg-black/60 border border-emerald-700 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={handleCallHelloWorld}
            disabled={helloLoading}
            className="mt-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 text-sm"
          >
            {helloLoading ? "Calling HelloWorld..." : "Call HelloWorld"}
          </button>

          {helloResult && (
            <p className="mt-3 text-xs text-emerald-100">
              Response: <span className="font-mono">{helloResult}</span>
            </p>
          )}

          {helloError && (
            <p className="mt-3 text-xs text-red-300">
              Error: <span className="font-mono">{helloError}</span>
            </p>
          )}

          <p className="mt-4 text-[11px] text-emerald-100/70">
            For this demo, the Protius project / staking flow on the left is still
            off-chain UI only. The next step is to replace this HelloWorld card with
            the real Protius staking smart contract.
          </p>
        </div>

        <footer className="pb-6 text-center text-[11px] text-emerald-100/60">
          © 2025 Protius Protocol — Built on Algorand TestNet
        </footer>
      </div>
    </div>
  );
};

export default Home;
