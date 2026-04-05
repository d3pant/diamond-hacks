function basename(path) {
  if (!path) return ""
  return String(path).replace(/^.*[/\\]/, "")
}

export default function AIReviewPanel({
  patient,
  analysis,
  onFinalApprove,
  onDismiss,
  onResubmit,
  approveBusy,
  complete,
}) {
  const data = analysis?.data ?? {}
  const uploaded = analysis?.uploaded_files ?? []
  const missing = analysis?.missing_fields ?? []
  const status = analysis?.status
  const diagnosis = data.diagnosis ?? "—"
  const medicines = Array.isArray(data.medicines) ? data.medicines : []
  const surgery = data.surgery_treatment ?? {}
  const followups = Array.isArray(data.followups) ? data.followups : []

  const summaryParts = [diagnosis !== "—" ? `Diagnosis: ${diagnosis}.` : null]
  if (medicines.length) {
    summaryParts.push(`${medicines.length} medication(s) recorded.`)
  }
  if (surgery?.name) {
    summaryParts.push(`Procedure: ${surgery.name}.`)
  }
  if (followups.length) {
    summaryParts.push(`${followups.length} follow-up item(s).`)
  }
  const summaryText =
    summaryParts.filter(Boolean).join(" ") || "No structured fields were extracted yet."

  return (
    <>
      <div style={{ fontSize: "11px", color: "var(--accent)", marginBottom: "4px", letterSpacing: "0.05em" }}>
        AI REVIEW
      </div>
      <div className="page-title">{patient?.name}</div>
      <div className="page-sub">
        {complete ? "Review interpretation before sending to patient" : "Add documents or notes, then resubmit to fill gaps"}
        {status === "incomplete" && (
          <span style={{ marginLeft: "8px", color: "#fca5a5" }}>· Incomplete — see flagged items</span>
        )}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="section-title">Documents on file (cumulative)</div>
          {uploaded.length === 0 && (
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>No PDFs recorded (text-only or pending).</div>
          )}
          {uploaded.map((path) => {
            const doc = basename(path)
            return (
              <div
                key={path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 0",
                  borderBottom: "0.5px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "var(--accent)",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "600",
                    color: "white",
                    flexShrink: "0",
                  }}
                >
                  PDF
                </div>
                <span style={{ fontSize: "13px", color: "white" }}>{doc}</span>
              </div>
            )
          })}
          {medicines.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div className="section-title" style={{ fontSize: "11px" }}>
                Medications
              </div>
              {medicines.map((m) => (
                <div key={`${m.name}-${m.qty}`} style={{ fontSize: "12px", color: "var(--text2)", marginTop: "6px" }}>
                  · {m.name}
                  {m.qty ? ` — ${m.qty}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="card">
            <div className="section-title">AI Summary</div>
            <div style={{ fontSize: "13px", color: "var(--text2)", lineHeight: "1.6" }}>{summaryText}</div>
          </div>
          {(missing.length > 0 || (surgery?.name && (!surgery.when || !surgery.where))) && (
            <div className="card" style={{ borderColor: "rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: "13px", fontWeight: "500", color: "#fca5a5", marginBottom: "10px" }}>
                ⚠ Flagged / missing
              </div>
              {missing.map((line) => (
                <div key={line} className="flag-item">
                  <span style={{ color: "#fca5a5", fontSize: "12px" }}>!</span>
                  <span style={{ fontSize: "12px", color: "var(--text2)" }}>{line}</span>
                </div>
              ))}
            </div>
          )}
          {complete ? (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: "1" }}
                onClick={onFinalApprove}
                disabled={approveBusy}
              >
                {approveBusy ? "Starting agents…" : "Approve & send ✓"}
              </button>
              <button type="button" className="btn-danger" style={{ flex: "1" }} onClick={onDismiss}>
                Dismiss
              </button>
            </div>
          ) : (
            <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={onResubmit}>
              Resubmit with more documents / notes →
            </button>
          )}
        </div>
      </div>
    </>
  )
}
