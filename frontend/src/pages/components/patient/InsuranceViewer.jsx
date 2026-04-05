import React from "react"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

export default function InsuranceViewer() {
  const [status, setStatus] = React.useState("idle")
  const [err, setErr] = React.useState(null)

  async function handleDownload() {
    setStatus("loading")
    setErr(null)
    try {
      const res = await fetch(`${API_BASE}/api/patient/insurance-claim`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "insurance_claim.pdf"
      a.click()
      URL.revokeObjectURL(url)
      setStatus("done")
    } catch (e) {
      setStatus("error")
      setErr(e.message)
    }
  }

  return (
    <div className="card col-span-2">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div className="section-title" style={{ margin: "0" }}>Insurance Claim</div>
        {status === "done" && <span className="badge badge-teal">Downloaded</span>}
        {status === "idle" && <span className="badge badge-muted">CA DGS ORIM 006</span>}
        {status === "loading" && <span className="badge badge-muted">Generating…</span>}
        {status === "error" && <span className="badge badge-red">Error</span>}
      </div>

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "0.5px solid var(--border)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        marginBottom: "12px",
      }}>
        <div style={{
          width: "44px", height: "52px",
          background: "rgba(239,68,68,0.12)",
          border: "0.5px solid rgba(239,68,68,0.3)",
          borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 700, color: "#f87171",
          letterSpacing: "0.04em",
        }}>
          PDF
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "12px", color: "white", fontWeight: 500 }}>Government Claim Form</div>
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
            California DGS ORIM 006 — auto-filled with your profile
          </div>
        </div>
      </div>

      <button
        className="btn-primary"
        style={{
          width: "100%",
          fontSize: "12px",
          padding: "10px 12px",
          opacity: status === "loading" ? 0.6 : 1,
        }}
        disabled={status === "loading"}
        onClick={handleDownload}
      >
        {status === "loading" ? "Generating PDF…" : status === "done" ? "✓ Downloaded" : "Download Claim PDF →"}
      </button>

      {err && (
        <div style={{ fontSize: "10px", color: "#fca5a5", marginTop: "6px" }}>{err}</div>
      )}
    </div>
  )
}
