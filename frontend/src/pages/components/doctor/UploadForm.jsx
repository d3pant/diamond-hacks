import { useState, useEffect } from "react"

export default function UploadForm({
  patient,
  busy,
  error,
  submitLabel,
  onSubmit,
  initialFiles = [],
  initialNotes = "",
}) {
  const [selectedFiles, setSelectedFiles] = useState(initialFiles)
  const [notes, setNotes] = useState(initialNotes)

  useEffect(() => {
    setSelectedFiles(initialFiles)
    setNotes(initialNotes)
  }, [initialFiles, initialNotes, patient?.id])

  function handleSubmit() {
    if (!selectedFiles.length && !notes.trim()) {
      return
    }
    onSubmit({ files: selectedFiles, text: notes })
  }

  const canSubmit = (selectedFiles.length > 0 || notes.trim().length > 0) && !busy

  return (
    <>
      <div style={{ fontSize: "11px", color: "var(--accent)", marginBottom: "4px", letterSpacing: "0.05em" }}>
        {submitLabel?.startsWith("Add") ? "ADD MORE FOR MERGE" : "UPLOADING FOR"}
      </div>
      <div className="page-title">{patient?.name}</div>
      <div className="page-sub">Age {patient?.age} · {patient?.diagnosis}</div>
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
      <div className="grid-2" style={{ marginBottom: "12px" }}>
        <div className="card">
          <div className="section-title">Test Reports & Prescriptions</div>
          <div className="upload-zone" onClick={() => document.getElementById("pdf-upload").click()}>
            <div style={{ fontSize: "22px", marginBottom: "6px", opacity: "0.4" }}>⬆</div>
            <div style={{ fontSize: "13px", color: "var(--muted)" }}>Drop PDFs here or click to upload</div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", opacity: "0.6" }}>
              Up to 5 PDFs, or use notes only
            </div>
          </div>
          {selectedFiles.length > 0 && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px 12px",
                background: "rgba(20,184,166,0.08)",
                border: "0.5px solid rgba(20,184,166,0.2)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "11px", color: "var(--teal)" }}>✓</span>
              <span style={{ fontSize: "12px", color: "var(--teal)" }}>{selectedFiles.length} PDFs selected</span>
            </div>
          )}
          <input
            id="pdf-upload"
            type="file"
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              setSelectedFiles(files.slice(0, 5))
            }}
          />
        </div>
        <div className="card">
          <div className="section-title">Diagnosis Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste clinical notes or summary text (optional if PDFs are attached)…"
            style={{
              width: "100%",
              minHeight: "120px",
              resize: "vertical",
              background: "var(--card2)",
              border: "0.5px solid var(--border)",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "13px",
              color: "var(--text2)",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      <button
        type="button"
        className="btn-primary"
        style={{ width: "100%", opacity: canSubmit ? 1 : 0.5 }}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {busy ? "Working…" : submitLabel ?? "Continue"}
      </button>
    </>
  )
}
