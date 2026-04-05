import React from "react"

const API_BASE = import.meta.env.VITE_API_URL ?? ""

async function triggerWebhook(payload) {
  const res = await fetch(`${API_BASE}/api/n8n/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
}

function calendarDayUrl(isoStr) {
  if (!isoStr) return "https://calendar.google.com"
  try {
    const d = new Date(isoStr)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `https://calendar.google.com/calendar/r/day/${y}/${m}/${day}`
  } catch {
    return "https://calendar.google.com"
  }
}

export default function N8nActions({ bundle }) {
  const travel = bundle?.travel
  const calDone = Boolean(travel?.calendar_events_created)
  const apptIso = travel?.timeline?.appointment ?? null
  const appt =
    travel?.timeline?.appointment_str ??
    apptIso ??
    "—"
  const calUrl = calendarDayUrl(apptIso)

  const [emailStatus, setEmailStatus] = React.useState("idle")
  const [emailErr,    setEmailErr]    = React.useState(null)

  async function handleEmail() {
    setEmailStatus("loading"); setEmailErr(null)
    try {
      await triggerWebhook({ action: "send_summary", bundle })
      setEmailStatus("done")
    } catch (e) {
      setEmailStatus("error"); setEmailErr(e.message)
    }
  }

  const statusBadge = (s) => {
    if (s === "loading") return <span className="badge badge-muted">Sending…</span>
    if (s === "done")    return <span className="badge badge-teal">Sent</span>
    if (s === "error")   return <span className="badge badge-red">Failed</span>
    return null
  }

  return (
    <div className="card">
      <div className="section-title">Automated Actions</div>

      <div className="n8n-card" style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "13px", color: "white" }}>📅 Calendar</span>
          <span className={`badge ${calDone ? "badge-teal" : "badge-muted"}`}>{calDone ? "Done" : "Pending"}</span>
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: calDone ? "8px" : "0" }}>
          {calDone ? `Surgery / visit — ${appt}` : "Agent 3 creates events when OAuth is configured."}
        </div>
        {calDone && (
          <a
            href={calUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              fontSize: "12px",
              padding: "7px 12px",
              borderRadius: "8px",
              background: "rgba(20,184,166,0.12)",
              border: "0.5px solid rgba(20,184,166,0.35)",
              color: "var(--teal)",
              textDecoration: "none",
              boxSizing: "border-box",
            }}
          >
            Open in Google Calendar →
          </a>
        )}
      </div>

      <div className="n8n-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "13px", color: "white" }}>📧 Email Summary</span>
          {statusBadge(emailStatus)}
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "8px" }}>
          Send patient cost summary via n8n workflow.
        </div>
        <button
          className="btn-primary"
          style={{ width: "100%", fontSize: "12px", padding: "8px 12px", opacity: emailStatus === "loading" ? 0.6 : 1 }}
          disabled={emailStatus === "loading" || emailStatus === "done"}
          onClick={handleEmail}
        >
          {emailStatus === "done" ? "✓ Sent" : "Trigger →"}
        </button>
        {emailErr && <div style={{ fontSize: "10px", color: "#fca5a5", marginTop: "6px" }}>{emailErr}</div>}
      </div>
    </div>
  )
}
