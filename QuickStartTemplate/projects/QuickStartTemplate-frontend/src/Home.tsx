import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

const COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo (Congo-Brazzaville)',
  'Costa Rica',
  'Côte d’Ivoire',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
]

const Home: React.FC = () => {
  const { activeAccount } = useWallet()

  const [country, setCountry] = useState<string>('')
  const [showChecklist, setShowChecklist] = useState<boolean>(false)

  // Simple local demo state for the staking box
  const [stakeInput, setStakeInput] = useState<string>('')
  const [demoTotalStaked, setDemoTotalStaked] = useState<number>(1) // start from 1 USDC demo
  const [demoStakers, setDemoStakers] = useState<number>(1)

  // HelloWorld demo state (for now: simulated response instead of a failing fetch)
  const [helloName, setHelloName] = useState<string>('Giorgio')
  const [helloResult, setHelloResult] = useState<string | null>(null)
  const [helloError, setHelloError] = useState<string | null>(null)
  const [helloLoading, setHelloLoading] = useState<boolean>(false)

  const handleStakeDemo = () => {
    const amount = Number(stakeInput)
    if (!amount || amount <= 0 || isNaN(amount)) return
    setDemoTotalStaked((prev) => prev + amount)
    setDemoStakers((prev) => prev + 1)
    setStakeInput('')
  }

  const handleCallHelloWorld = async () => {
    try {
      setHelloLoading(true)
      setHelloError(null)

      const nameToSend = helloName.trim() || 'world'

      // 🔁 For now this is a **simulated** HelloWorld response so that
      // the UI doesn’t show “Failed to fetch” on Vercel.
      // Later we will plug this into the real Algorand HelloWorld client.
      await new Promise((resolve) => setTimeout(resolve, 400))
      setHelloResult(`Hello, ${nameToSend}! (demo response)`)
    } catch (err: any) {
      setHelloError(err?.message ?? 'Unknown error')
    } finally {
      setHelloLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-900 to-black text-slate-100">
      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-2 border-b border-emerald-500/40 pb-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-300">
            ⚡ Protius Protocol — Demo
          </h1>
          <p className="text-sm md:text-base text-slate-300">
            Register a renewable energy project, capture key developer details, and simulate
            community staking. One wallet, one flow, Algorand TestNet-ready.
          </p>
          <div className="text-xs md:text-sm text-slate-400">
            Connected wallet:{' '}
            <span className="font-mono text-emerald-300">
              {activeAccount?.address ?? 'No wallet connected'}
            </span>
          </div>
        </header>

        {/* 1. Project registration */}
        <section className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-lg shadow-emerald-900/40">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-emerald-200">
            1️⃣ Protius Project Registration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Developer Wallet
              </label>
              <input
                type="text"
                readOnly
                value={activeAccount?.address ?? ''}
                placeholder="Connect wallet to populate..."
                className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">User Name</label>
                <input
                  type="text"
                  placeholder="e.g., Giorgio Mauro"
                  className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sunny Ridge Solar"
                  className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-[2fr,1fr,1fr] gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Capacity (kW)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 5000"
                  className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Distance from Substation (km)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 12.5"
                  className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description / Notes
              </label>
              <textarea
                placeholder="Key details, permits/status, grid, site notes..."
                rows={3}
                className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Toggle for full developer checklist */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowChecklist((v) => !v)}
                className="w-full md:w-auto px-4 py-2 text-xs md:text-sm font-medium rounded-full border border-emerald-500 bg-emerald-600/10 hover:bg-emerald-600/20 transition"
              >
                {showChecklist ? '▲ Hide full developer checklist' : '▼ Show full developer checklist'}
              </button>
            </div>

            {showChecklist && (
              <div className="mt-4 border-t border-slate-700 pt-4 space-y-4 text-xs md:text-sm">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Land Status
                    </label>
                    <select className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">Select...</option>
                      <option>Owned</option>
                      <option>Option to purchase</option>
                      <option>Leased</option>
                      <option>Under negotiation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Land Zoning
                    </label>
                    <select className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">Select...</option>
                      <option>Industrial</option>
                      <option>Agricultural</option>
                      <option>Commercial</option>
                      <option>Mixed-use</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Permitting (completed / pending)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="List permits obtained and those outstanding..."
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Insurances
                    </label>
                    <textarea
                      rows={2}
                      placeholder="List insurances in place or committed..."
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contracts
                    </label>
                    <textarea
                      rows={2}
                      placeholder="List contracts already in place..."
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Technical Studies completed
                    </label>
                    <textarea
                      rows={2}
                      placeholder="List completed studies..."
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Technical Studies outstanding
                    </label>
                    <textarea
                      rows={2}
                      placeholder="List outstanding studies..."
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Pre-Construction Approvals
                    </label>
                    <textarea
                      rows={2}
                      placeholder="If any, list..."
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
                    <select className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option>USD</option>
                      <option>EUR</option>
                      <option>ZAR</option>
                      <option>GBP</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Development Capital Required
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 1,250,000"
                        className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Equity Required
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 900,000"
                        className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Debt Ratio (%)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 65"
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Expected COD date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center text-xs text-slate-300">
                      <input type="checkbox" className="mr-2 rounded border-slate-600" />
                      EPC contracted
                    </label>
                    <label className="inline-flex items-center text-xs text-slate-300">
                      <input type="checkbox" className="mr-2 rounded border-slate-600" />
                      Owner&apos;s Engineer contracted
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                className="px-6 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-sm font-semibold text-black shadow-lg shadow-emerald-700/40 transition"
              >
                Submit Project
              </button>
            </div>
          </div>
        </section>

        {/* 2 & 3. Investor / staking demo + HelloWorld */}
        <section className="grid lg:grid-cols-2 gap-6 items-start">
          {/* Investor / staking demo */}
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-lg shadow-emerald-900/40">
            <h2 className="text-lg md:text-xl font-semibold mb-1 text-emerald-200">
              2️⃣ Investor / staking demo
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mb-4">
              Imagine you are a community investor. Pick an approved project and simulate staking
              demo USDC into it. This is front-end only for now — the Protius staking smart contract
              will plug in next.
            </p>

            <div className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Stake amount (demo USDC)
                </label>
                <input
                  type="number"
                  value={stakeInput}
                  onChange={(e) => setStakeInput(e.target.value)}
                  placeholder="e.g., 1"
                  className="w-full rounded-md bg-slate-950/70 border border-slate-700 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">Drombeg2</div>
                    <div className="text-xs text-slate-400">62 kW — Canada</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-300">
                      Total demo staked: {demoTotalStaked.toFixed(2)} USDC
                    </div>
                    <div className="text-xs text-slate-400">{demoStakers} stakers</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStakeDemo}
                  className="mt-2 w-full md:w-auto px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-xs md:text-sm font-semibold text-black shadow-md shadow-emerald-700/40 transition"
                >
                  Stake (demo only)
                </button>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                Note: this staking is <span className="font-semibold">front-end only</span> for demo
                purposes. The only live on-chain call will be the Protius staking contract we add
                next.
              </p>
            </div>
          </div>

          {/* HelloWorld box */}
          <div className="bg-emerald-900/20 border border-emerald-500/40 rounded-2xl p-5 md:p-6 shadow-lg shadow-emerald-900/40">
            <h2 className="text-lg md:text-xl font-semibold mb-1 text-emerald-200">
              3️⃣ HelloWorld on Algorand (demo wire-up)
            </h2>
            <p className="text-xs md:text-sm text-emerald-100 mb-3">
              This box will talk to the real <span className="font-semibold">HelloWorld</span> smart
              contract on Algorand TestNet (App ID: <span className="font-mono">749547327</span>){' '}
              once we plug in the generated client. For now it returns a local demo response so the
              UI is stable on Vercel.
            </p>

            <div className="space-y-3 text-xs md:text-sm">
              <label className="block">
                <span className="block text-xs font-medium text-emerald-100 mb-1">
                  Name to send:
                </span>
                <input
                  type="text"
                  value={helloName}
                  onChange={(e) => setHelloName(e.target.value)}
                  className="w-full rounded-md bg-slate-950/70 border border-emerald-500/40 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </label>

              <button
                type="button"
                onClick={handleCallHelloWorld}
                disabled={helloLoading}
                className="w-full px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-xs md:text-sm font-semibold text-black shadow-md shadow-emerald-800/50 transition"
              >
                {helloLoading ? 'Calling HelloWorld…' : 'Call HelloWorld'}
              </button>

              {helloResult && (
                <div className="mt-2 rounded-md bg-slate-950/60 border border-emerald-500/40 px-3 py-2 font-mono text-xs md:text-sm text-emerald-200">
                  {helloResult}
                </div>
              )}
              {helloError && (
                <div className="mt-2 rounded-md bg-red-900/40 border border-red-500/60 px-3 py-2 text-xs md:text-sm text-red-100">
                  Error: {helloError}
                </div>
              )}

              <p className="text-[11px] text-emerald-200/80 pt-1">
                Next step: replace the demo response with the real{' '}
                <span className="font-mono text-emerald-100">HelloWorld</span> client generated by
                AlgoKit, signed by your connected wallet.
              </p>
            </div>
          </div>
        </section>

        <footer className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
          © {new Date().getFullYear()} Protius Protocol — Built on Algorand TestNet.
        </footer>
      </main>
    </div>
  )
}

export default Home
