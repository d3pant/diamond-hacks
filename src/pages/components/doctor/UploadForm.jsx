import { useState } from "react"

export default function UploadForm({ patient, onSubmit }) {
  const [selectedFiles, setSelectedFiles] = useState([])

  function handleSubmit() {
    onSubmit()
  }

  return (
    <>
      <div style={{fontSize:'11px',color:'var(--accent)',marginBottom:'4px',letterSpacing:'0.05em'}}>UPLOADING FOR</div>
      <div className="page-title">{patient?.name}</div>
      <div className="page-sub">Age {patient?.age} · {patient?.diagnosis}</div>
      <div className="grid-2" style={{marginBottom:'12px'}}>
        <div className="card">
          <div className="section-title">Test Reports & Prescriptions</div>
          <div className="upload-zone" onClick={() => document.getElementById('pdf-upload').click()}>
            <div style={{fontSize:'22px',marginBottom:'6px',opacity:'0.4'}}>⬆</div>
            <div style={{fontSize:'13px',color:'var(--muted)'}}>Drop PDFs here or click to upload</div>
            <div style={{fontSize:'11px',color:'var(--muted)',marginTop:'4px',opacity:'0.6'}}>Multiple files supported</div>
          </div>
          {selectedFiles.length > 0 && (
            <div style={{marginTop:'10px',padding:'8px 12px',background:'rgba(20,184,166,0.08)',border:'0.5px solid rgba(20,184,166,0.2)',borderRadius:'8px',display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{fontSize:'11px',color:'var(--teal)'}}>✓</span>
              <span style={{fontSize:'12px',color:'var(--teal)'}}>{selectedFiles.length} PDFs selected</span>
            </div>
          )}
          <input
            id="pdf-upload"
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files)
              setSelectedFiles(files)
            }}
          />
        </div>
        <div className="card">
          <div className="section-title">Diagnosis Notes</div>
          <div style={{background:'var(--card2)',border:'0.5px solid var(--border)',borderRadius:'8px',padding:'12px',height:'120px'}}>
            <div style={{fontSize:'13px',color:'var(--muted)'}}>Patient presents with stage 2 breast cancer. Recommended treatment includes...</div>
          </div>
        </div>
      </div>
      <button className="btn-primary" style={{width:'100%'}} onClick={handleSubmit}>Submit for AI Analysis →</button>
    </>
  )
}