import React, { useState } from "react";
import { enqueueSnackbar } from "notistack";

export type ProjectInput = {
  name: string;
  country: string;
  capacity_kw: number;
  description: string; // off-chain text → later becomes meta_cid
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

export default function ProjectForm({ devAddr, onSubmit }: Props) {
  const [form, setForm] = useState<ProjectInput>({
    name: "",
    country: "",
    capacity_kw: 0,
    description: "",
  });
  const [busy, setBusy] = useState(false);

  function update<K extends keyof ProjectInput>(k: K, v: ProjectInput[K]): void {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (!form.name.trim()) {
      enqueueSnackbar("Please enter a project name.", { variant: "warning" });
      return;
    }
    if (!form.country.trim()) {
      enqueueSnackbar("Please select a country.", { variant: "warning" });
      return;
    }
    if (!form.capacity_kw || form.capacity_kw <= 0) {
      enqueueSnackbar("Capacity must be > 0.", { variant: "warning" });
      return;
    }

    try {
      setBusy(true);
      await onSubmit(form);
      enqueueSnackbar("Project submitted (frontend only for now).", { variant: "success" });
      setForm({ name: "", country: "", capacity_kw: 0, description: "" });
    } catch (err: any) {
      enqueueSnackbar(err?.message ?? "Could not submit project.", { variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
      <div style={rowStyle}>
        <span style={labelStyle}>Developer Wallet</span>
        <div style={{ ...inputStyle, border: "1px dashed #333", color: "#a8ffea" }}>
          {devAddr}
        </div>
      </div>

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
          <option value="Italy">Italy</option>
          <option value="France">France</option>
          <option value="South Africa">South Africa</option>
          <option value="Canada">Canada</option>
        </select>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Capacity (kW)</label>
        <input
          style={inputStyle}
          type="number"
          min={1}
          step={1}
          value={form.capacity_kw || ""}
          onChange={(e) => update("capacity_kw", Number(e.target.value))}
          placeholder="e.g., 5000"
        />
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Description / Notes</label>
        <textarea
          style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Key details, permits/status, grid, site notes…"
          maxLength={2000}
        />
        <small style={{ color: "#777" }}>
          (For the POC we’ll upload this to IPFS/Supabase and store the resulting <em>meta_cid</em> on-chain.)
        </small>
      </div>

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
          width: 180,
        }}
      >
        {busy ? "Submitting…" : "Submit Project"}
      </button>
    </form>
  );
}

