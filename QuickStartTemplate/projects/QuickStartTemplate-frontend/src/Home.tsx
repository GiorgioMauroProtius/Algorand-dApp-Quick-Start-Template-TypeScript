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

const landStatusOptions = ["Owned", "Leased", "Lease in negotiation", "Option"];
const landZoningOptions = ["Agricultural", "Industrial", "Commercial", "Residential", "Mixed use"];

const Home: React.FC = () => {
  const { activeAddress } = useWallet();

  // Basic fields
  const [userName, setUserName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [country, setCountry] = useState("");
  const [capacityKw, setCapacityKw] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [notes, setNotes] = useState("");

  // Checklist
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

  // HelloWorld demo
  const [helloName, setHelloName] = useState("");
  const [helloResult, setHelloResult] = useState<string | null>(null);
  const [helloError, setHelloError] = useState<string | null>(null);
  const [helloLoading, setHelloLoading] = useState(false);

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Project submitted:", {
      developerWallet: activeAddress,
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
        technicalStudiesCompleted,
        technicalStudiesOutstanding,
        preConstructionApprovals,
        currency,
        devCapRequired,
        equityRequired,
        debtRatio,
        expectedCod,
        epcContracted,
        ownersEngineerContracted
      } : null
    });
    alert("Project registered (demo mode)");
  };

  const handleCallHelloWorld = async () => {
    try {
      setHelloLoading(true);
      setHelloError(null);
      setHelloResult(null);
      const response = await fetch(`/api/helloworld?name=${encodeURIComponent(helloName || "world")}`);
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setHelloResult(data.message);
    } catch (err: any) {
      setHelloError(err.message);
    } finally {
      setHelloLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      {/* Container */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* Registration card */}
        <div className="bg-black/70 border border-emerald-500/60 rounded-xl p-6 shadow-xl space-y-6">
          <h1 className="text-2xl font-semibold text-emerald-300">
            ⚡ Protius Project Registration
          </h1>

          <p className="text-sm text-emerald-100/80">
            Register a renewable energy project to begin the Protius lifecycle.
          </p>

          <div className="bg-emerald-900/50 px-4 py-2 rounded-lg text-sm">
            <span className="font-semibold">Connected wallet:</span>{" "}
            {activeAddress || "Not connected"}
          </div>

          <form onSubmit={handleSubmitProject} className="space-y-4">
            {/* Basic fields */}
            <input
              type="text"
              value={activeAddress || ""}
              readOnly
              className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
            />

            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
              required
            />

            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
              required
            />

            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
              required
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Capacity (kW)"
                value={capacityKw}
                onChange={(e) => setCapacityKw(e.target.value)}
                className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm w-full"
              />

              <input
                type="number"
                placeholder="Distance to substation (km)"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm w-full"
              />
            </div>

            <textarea
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
            />

            {/* Checklist toggle */}
            <button
              type="button"
              onClick={() => setShowChecklist(!showChecklist)}
              className="w-full border border-emerald-500 bg-emerald-900/40 hover:bg-emerald-800/60 py-2 rounded-md text-sm font-semibold"
            >
              {showChecklist ? "▲ Hide Developer Checklist" : "▼ Show Developer Checklist"}
            </button>

            {/* Checklist */}
            {showChecklist && (
              <div className="bg-black/50 border border-emerald-800 rounded-lg p-4 space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={landStatus}
                    onChange={(e) => setLandStatus(e.target.value)}
                    className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                  >
                    <option value="">Land status</option>
                    {landStatusOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>

                  <select
                    value={landZoning}
                    onChange={(e) => setLandZoning(e.target.value)}
                    className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                  >
                    <option value="">Land zoning</option>
                    {landZoningOptions.map((z) => <option key={z}>{z}</option>)}
                  </select>
                </div>

                <textarea
                  placeholder="Permitting"
                  value={permitting}
                  onChange={(e) => setPermitting(e.target.value)}
                  rows={2}
                  className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                />

                <textarea
                  placeholder="Insurances"
                  value={insurances}
                  onChange={(e) => setInsurances(e.target.value)}
                  rows={2}
                  className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                />

                <textarea
                  placeholder="Contracts"
                  value={contracts}
                  onChange={(e) => setContracts(e.target.value)}
                  rows={2}
                  className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                />

                <textarea
                  placeholder="Technical studies completed"
                  value={technicalStudiesCompleted}
                  onChange={(e) => setTechnicalStudiesCompleted(e.target.value)}
                  rows={2}
                  className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                />

                <textarea
                  placeholder="Technical studies outstanding"
                  value={technicalStudiesOutstanding}
                  onChange={(e) => setTechnicalStudiesOutstanding(e.target.value)}
                  rows={2}
                  className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                />

                <textarea
                  placeholder="Pre-construction approvals"
                  value={preConstructionApprovals}
                  onChange={(e) => setPreConstructionApprovals(e.target.value)}
                  rows={2}
                  className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>ZAR</option>
                    <option>CAD</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Dev Cap Required"
                    value={devCapRequired}
                    onChange={(e) => setDevCapRequired(e.target.value)}
                    className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                  />

                  <input
                    type="number"
                    placeholder="Equity Required"
                    value={equityRequired}
                    onChange={(e) => setEquityRequired(e.target.value)}
                    className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    placeholder="Debt Ratio (%)"
                    value={debtRatio}
                    onChange={(e) => setDebtRatio(e.target.value)}
                    className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                  />

                  <input
                    type="date"
                    value={expectedCod}
                    onChange={(e) => setExpectedCod(e.target.value)}
                    className="bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
                  />

                  <div className="flex items-center gap-4 mt-2">
                    <label className="text-xs flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={epcContracted}
                        onChange={(e) => setEpcContracted(e.target.checked)}
                      />
                      EPC contracted
                    </label>

                    <label className="text-xs flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={ownersEngineerContracted}
                        onChange={(e) => setOwnersEngineerContracted(e.target.checked)}
                      />
                      Owner’s Engineer contracted
                    </label>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2 rounded-md text-sm mt-4"
            >
              Submit Project
            </button>
          </form>
        </div>

        {/* HelloWorld Smart Contract Demo */}
        <div className="bg-emerald-900/60 border border-emerald-500 rounded-xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xl font-semibold text-emerald-200">HelloWorld TestNet</h2>

          <p className="text-xs text-emerald-100/80">
            Sends a TestNet transaction to the HelloWorld smart contract.
          </p>

          <input
            type="text"
            placeholder="Name to send"
            value={helloName}
            onChange={(e) => setHelloName(e.target.value)}
            className="w-full bg-black/60 border border-emerald-700 px-3 py-2 rounded-md text-sm"
          />

          <button
            onClick={handleCallHelloWorld}
            disabled={helloLoading}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-md text-sm"
          >
            {helloLoading ? "Sending…" : "Call HelloWorld"}
          </button>

          {helloResult && (
            <p className="text-xs text-emerald-100">
              Response: <span className="font-mono">{helloResult}</span>
            </p>
          )}

          {helloError && (
            <p className="text-xs text-red-300">
              Error: <span className="font-mono">{helloError}</span>
            </p>
          )}
        </div>

        <footer className="pb-6 text-center text-xs text-emerald-100/60">
          © 2025 Protius Protocol — Algorand Demo
        </footer>
      </div>
    </div>
  );
};

export default Home;
