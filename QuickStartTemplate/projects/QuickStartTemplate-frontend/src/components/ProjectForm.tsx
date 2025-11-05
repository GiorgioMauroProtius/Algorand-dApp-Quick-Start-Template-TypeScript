import React, { useMemo, useState } from "react";
import { enqueueSnackbar } from "notistack";

export type ProjectInput = {
  // Basics
  name: string;
  country: string;
  capacity_kw: number;
  description: string;

  // Extra basics
  distance_km: number;

  // Advanced (developer checklist)
  land_status: string;
  land_zoning: string;
  permitting: string;
  insurances: string;
  contracts: string;
  studies_done: string;
  studies_pending: string;
  preconstruction_approvals: string;

  // Financials
  currency: "USD" | "EUR" | "ZAR" | "CAD";
  dev_capital: number;      // parsed number (from formatted string)
  debt_ratio: number;       // percent 0–100
  equity_required: number;  // parsed number (from formatted string)

  // Delivery
  expected_cod: string;               // YYYY-MM-DD
  epc_contracted: boolean;
  owner_engineer_contracted: boolean;
};

type Props = {
  devAddr: string; // connected wallet (display only for now)
  onSubmit: (data: ProjectInput) => Promise<void> | void;
};

const labelStyle: React.CSSProperties = { fontSize: 14, color: "#b9b9b9" };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#111",
  border: "1px solid #222",
  borderRadius: 8,
  color: "#eaeaea",
};
const rowStyle: React.CSSProperties = { display: "grid", gap: 8 };

/* ===== Helpers (always-return; fixes TS7030) ===== */
const nf = new Intl.NumberFormat("en-US");

/** Format any money-like text as '1,234'; returns "" if nothing valid. */
const formatMoney = (raw: string): string => {
  try {
    const digits = raw.replace(/[^\d]/g, "");
    return digits ? nf.format(Number(digits)) : "";
  } catch {
    return "";
  }
};

/** Parse a formatted money string to a number; returns 0 on empty/bad input. */
const toNumber = (formatted: string): number => {
  try {
    const digits = formatted.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  } catch {
    return 0;
  }
};

export default function ProjectForm({ devAddr, onSubmit }: Props) {
  // UI toggle for advanced section
  const [showAdvanced, setShowAdvanced] = useState(false);

  // local form state (strings for numeric inputs to preserve user typing)
  const [form, setForm] = useState({
    // basics
    name: "",
    country: "",
    capacity_kw: "",
    description: "",
    distance_km: "",

    // advanced
    land_status: "",
    land_zoning: "",
    permitting: "",
    insurances: "",
    contracts: "",
    studies_done: "",
    studies_pending: "",
    preconstruction_approvals: "",

    // financials (with currency dropdown)
    currency: "USD" as ProjectInput["currency"],
    dev_capital_fmt: "",
    debt_ratio: "",
    equity_required_fmt: "",

    // delivery
    expected_cod: "",
    epc_contracted: false,
    owner_engineer_contracted: false,
  });

  const [busy, setBusy] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // derived, parsed payload for submit
  const payload: ProjectInput = useMemo(() => {
    return {
      // basics
      name: form.name.trim(),
      country: form.country.trim(),
      capacity_kw: Number(form.capacity_kw || 0),
      description: form.description.trim(),
      distance_km: Number(form.distance_km || 0),

      // advanced
      land_status: form.land_status.trim(),
      land_zoning: form.land_zoning.trim(),
      permitting: form.permitting.trim(),
      insurances: form.insurances.trim(),
      contracts: form.contracts.trim(),
      studies_done: form.studies_done.trim(),
      studies_pending: form.studies_pending.trim(),
      preconstruction_approvals: form.preconstruction_approvals.trim(),

      // financials
      currency: form.currency,
      dev_capital: toNumber(form.dev_capital_fmt),
      debt_ratio: Number(form.debt_ratio || 0),
      equity_required: toNumber(form.equity_required_fmt),

      // delivery
      expected_cod: form.expected_cod,
      epc_contracted: form.epc_contracted,
      owner_engineer_contracted: form.owner_engineer_contracted,
    };
  }, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // minimal validation
    if (!payload.name) return enqueueSnackbar("Please enter a project name.", { variant: "warning" });
    if (!payload.country) return enqueueSnackbar("Please select a country.", { variant: "warning" });
    if (!payload.capacity_kw || payload.capacity_kw <= 0) {
      return enqueueSnackbar("Capacity (kW) must be > 0.", { variant: "warning" });
    }

    try {
      setBusy(true);
      await onSubmit(payload);
      enqueueSnackbar("Project submitted for verification.", { variant: "success" });

      // reset form
      setForm({
        name: "",
        country: "",
        capacity_kw: "",
        description: "",
        distance_km: "",

        land_status: "",
        land_zoning: "",
        permitting: "",
        insurances: "",
        contracts: "",
        studies_done: "",
        studies_pending: "",
        preconstruction_approvals: "",

        currency: "USD",
        dev_capital_fmt: "",
        debt_ratio: "",
        equity_required_fmt: "",

        expected_cod: "",
        epc_contracted: false,
        owner_engineer_contracted: false,
      });
      setShowAdvanced(false);
    } catch (err: any) {
      enqueueSnackbar(err?.message ?? "Could not submit project.", { variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      {/* Wallet */}
      <div style={rowStyle}>
        <span style={labelStyle}>Developer Wallet</span>
        <div style={{ ...inputStyle, border: "1px dashed #333", color: "#a8ffea" }}>
          {devAddr}
        </div>
      </div>

      {/* Basics */}
      <div style={rowStyle}>
        <label style={labelStyle}>Project Name</label>
        <input
          style={inputStyle}
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g., Sunny Ridge Solar"
          maxLength={80}
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Country</label>
        <select
          style={inputStyle}
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
        >
          <option value="">Select country…</option>
          <option>Italy</option>
          <option>France</option>
          <option>South Africa</option>
          <option>Canada</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={rowStyle}>
          <label style={labelStyle}>Capacity (kW)</label>
          <input
            style={inputStyle}
            type="number"
            min={1}
            step={1}
            value={form.capacity_kw}
            onChange={(e) => update("capacity_kw", e.target.value)}
            placeholder="e.g., 5000"
          />
        </div>
        <div style={rowStyle}>
          <label style={labelStyle}>Distance from Substation (km)</label>
          <input
            style={inputStyle}
            type="number"
            min={0}
            step={0.1}
            value={form.distance_km}
            onChange={(e) => update("distance_km", e.target.value)}
            placeholder="e.g., 12.5"
          />
        </div>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Description / Notes</label>
        <textarea
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Key details, permits/status, grid, site notes…"
          maxLength={3000}
        />
      </div>

      {/* Toggle for advanced checklist */}
      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #00ffd0",
          background: showAdvanced ? "#003f37" : "#002f2a",
          color: "#00ffd0",
          cursor: "pointer",
          fontWeight: 700,
        }}
        aria-expanded={showAdvanced}
      >
        {showAdvanced ? "▴ Hide full developer checklist" : "▾ Show full developer checklist"}
      </button>

      {showAdvanced && (
        <div
          style={{
            display: "grid",
            gap: 16,
            padding: 16,
            border: "1px solid #1f1f1f",
            borderRadius: 12,
            background: "#0b0b0b",
          }}
        >
          {/* Land */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Land Status</label>
              <select
                style={inputStyle}
                value={form.land_status}
                onChange={(e) => update("land_status", e.target.value)}
              >
                <option value="">Select…</option>
                <option>Owned</option>
                <option>Rented</option>
                <option>Concession</option>
              </select>
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Land Zoning</label>
              <select
                style={inputStyle}
                value={form.land_zoning}
                onChange={(e) => update("land_zoning", e.target.value)}
              >
                <option value="">Select…</option>
                <option>Commercial</option>
                <option>Industrial</option>
                <option>Agricultural</option>
              </select>
            </div>
          </div>

          {/* Text areas */}
          {[
            ["Permitting (completed / pending)", "permitting", "List permits obtained and those outstanding…"],
            ["Insurances", "insurances", "List insurances in place or committed…"],
            ["Contracts", "contracts", "List contracts already in place… (DD off-chain)"],
            ["Technical Studies completed", "studies_done", "List completed studies…"],
            ["Technical Studies outstanding", "studies_pending", "List outstanding studies…"],
            ["Pre-Construction Approvals", "preconstruction_approvals", "If any, list…"],
          ].map(([label, key, placeholder]) => (
            <div key={String(key)} style={rowStyle}>
              <label style={labelStyle}>{label}</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                value={(form as any)[key]}
                onChange={(e) => update(key as any, e.target.value)}
                placeholder={String(placeholder)}
              />
            </div>
          ))}

          {/* Financials */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Currency</label>
              <select
                style={inputStyle}
                value={form.currency}
                onChange={(e) => update("currency", e.target.value as ProjectInput["currency"])}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="ZAR">ZAR</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Development Capital Required</label>
              <input
                style={inputStyle}
                inputMode="numeric"
                value={form.dev_capital_fmt}
                onChange={(e) => update("dev_capital_fmt", formatMoney(e.target.value))}
                placeholder="e.g., 1,250,000"
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Equity Required</label>
              <input
                style={inputStyle}
                inputMode="numeric"
                value={form.equity_required_fmt}
                onChange={(e) => update("equity_required_fmt", formatMoney(e.target.value))}
                placeholder="e.g., 900,000"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Debt Ratio (%)</label>
              <input
                style={inputStyle}
                type="number"
                min={0}
                max={100}
                step={1}
                value={form.debt_ratio}
                onChange={(e) => update("debt_ratio", e.target.value)}
                placeholder="e.g., 65"
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Expected COD date</label>
              <input
                style={inputStyle}
                type="date"
                value={form.expected_cod}
                onChange={(e) => update("expected_cod", e.target.value)}
              />
            </div>
          </div>

          {/* Binaries */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={form.epc_contracted}
                onChange={(e) => update("epc_contracted", e.target.checked)}
              />
              EPC contracted
            </label>
            <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="checkbox"
                checked={form.owner_engineer_contracted}
                onChange={(e) => update("owner_engineer_contracted", e.target.checked)}
              />
              Owner’s Engineer contracted
            </label>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={busy}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #00ffd0",
          background: busy ? "#003f37" : "#002f2a",
          color: "#00ffd0",
          cursor: busy ? "not-allowed" : "pointer",
          width: 220,
          justifySelf: "start",
          fontWeight: 700,
        }}
      >
        {busy ? "Submitting…" : "Submit Project"}
      </button>
    </form>
  );
}
