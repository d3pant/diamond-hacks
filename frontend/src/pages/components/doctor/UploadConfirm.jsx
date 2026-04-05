export default function UploadConfirm({ patient, files, notes, onBack, onApproveSend, busy, error }) {
  return (
    <>
      <div style={{ fontSize: "11px", color: "var(--accent)", marginBottom: "4px", letterSpacing: "0.05em" }}>
        CONFIRM UPLOAD
      </div>
      {error && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "0.5px solid rgba(239,68,68,0.35)",
            background: "rgba(239,68,68,0.08)",
            fontSize: "13px",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}
      <div className="page-title">{patient?.name}</div>
      <div className="page-sub">Age {patient?.age} · {patient?.diagnosis}</div>
      <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
        Nothing is sent to the AI until you approve below. You can go back to change files or notes.
      </p>
      <div className="card" style={{ marginBottom: "12px" }}>
        <div className="section-title">PDFs ({files?.length ?? 0})</div>
        {(!files || files.length === 0) && (
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>No PDFs — text-only submission.</div>
        )}
        {files?.map((f) => (
          <div
            key={f.name + f.size}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 0",
              borderBottom: "0.5px solid var(--border)",
              fontSize: "13px",
              color: "white",
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
              }}
            >
              PDF
            </div>
            {f.name}
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: "16px" }}>
        <div className="section-title">Diagnosis notes</div>
        <div
          style={{
            fontSize: "13px",
            color: notes?.trim() ? "var(--text2)" : "var(--muted)",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            maxHeight: "160px",
            overflow: "auto",
          }}
        >
          {notes?.trim() || "(none)"}
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px" }}>
        <button type="button" className="btn-danger" style={{ flex: 1 }} onClick={onBack} disabled={busy}>
          ← Back
        </button>
        <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={onApproveSend} disabled={busy}>
          {busy ? "Analyzing…" : "Approve & send to AI"}
        </button>
      </div>
    </>
  )
}
