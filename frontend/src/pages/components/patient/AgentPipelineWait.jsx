function stepRow(done, label, detail) {
  return (
    <div className="ticker-step" style={{ opacity: done ? 1 : 0.65 }}>
      <div className={`tick-icon ${done ? "tick-done" : "tick-pending"}`}>
        {done ? "✓" : ""}
      </div>
      <div>
        <span style={{ fontSize: "13px", color: done ? "white" : "var(--muted)" }}>{label}</span>
        {detail && (
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>{detail}</div>
        )}
      </div>
    </div>
  )
}

export default function AgentPipelineWait({ bundle }) {
  const ps = Boolean(bundle?.patient_state)
  const meds = bundle?.patient_state?.data?.medicines
  const needsMeds = Array.isArray(meds) && meds.length > 0
  const medDone = !needsMeds || bundle?.medicines != null
  const surgDone = bundle?.surgery != null
  const travDone = bundle?.travel != null

  return (
    <>
      <div
        style={{
          fontFamily: "'Syne',sans-serif",
          fontSize: "20px",
          fontWeight: "600",
          color: "white",
          marginBottom: "6px",
          textAlign: "center",
        }}
      >
        Waiting for pipeline
      </div>
      <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "28px", textAlign: "center", maxWidth: "420px" }}>
        After the doctor submits analysis, the server runs agents 1–3 in the background. This page polls{" "}
        <code style={{ fontSize: "11px" }}>/api/results/bundle</code> until the expected JSON files exist (or the wait limit is
        reached).
      </div>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {stepRow(ps, "Doctor analysis (patient_state.json)", ps ? "Saved" : "Submit for AI Analysis on /doctor")}
        {stepRow(
          medDone,
          needsMeds ? "Agent 1 — Medication prices" : "Agent 1 — Medications (skipped)",
          needsMeds ? (bundle?.medicines ? "medicines_result.json" : "Running or failed — check server logs") : "No prescriptions in analysis"
        )}
        {stepRow(surgDone, "Agent 2 — Surgery estimate", surgDone ? "surgery_result.json" : "Running or failed — check server logs")}
        {stepRow(travDone, "Agent 3 — Travel & calendar", travDone ? "travel_result.json" : "Running or failed — check server logs")}
      </div>
    </>
  )
}
