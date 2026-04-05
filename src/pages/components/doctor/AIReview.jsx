import { useState } from "react"

export default function AIReviewPanel({ patient, onApprove }) {
  function handleApprove() {
    onApprove()
  }

  return (
    <>
      <div style={{fontSize:'11px',color:'var(--accent)',marginBottom:'4px',letterSpacing:'0.05em'}}>AI REVIEW</div>
      <div className="page-title">{patient?.name}</div>
      <div className="page-sub">Review interpretation before sending to patient</div>
      <div className="grid-2">
        <div className="card">
          <div className="section-title">Uploaded Documents</div>
          {["Lab_Report_March.pdf", "Prescription_v2.pdf", "Scan_Results.pdf"].map((doc) => (
            <div key={doc} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 0',borderBottom:'0.5px solid var(--border)'}}>
              <div style={{width:'32px',height:'32px',background:'var(--accent)',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',fontWeight:'600',color:'white',flexShrink:'0'}}>PDF</div>
              <span style={{fontSize:'13px',color:'white'}}>{doc}</span>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <div className="card">
            <div className="section-title">AI Summary</div>
            <div style={{fontSize:'13px',color:'var(--text2)',lineHeight:'1.6'}}>Patient presents with Stage 2 Breast Cancer. Recommended treatment includes chemotherapy followed by surgery. Three medications prescribed.</div>
          </div>
          <div className="card" style={{borderColor:'rgba(239,68,68,0.2)'}}>
            <div style={{fontSize:'13px',fontWeight:'500',color:'#fca5a5',marginBottom:'10px'}}>⚠ Flagged Items</div>
            <div className="flag-item">
              <span style={{color:'#fca5a5',fontSize:'12px'}}>!</span>
              <span style={{fontSize:'12px',color:'var(--text2)'}}>Potential interaction between Drug A and Drug B</span>
            </div>
            <div className="flag-item">
              <span style={{color:'#fca5a5',fontSize:'12px'}}>!</span>
              <span style={{fontSize:'12px',color:'var(--text2)'}}>Missing follow-up appointment details</span>
            </div>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            <button className="btn-primary" style={{flex:'1'}} onClick={handleApprove}>Approve & Send ✓</button>
            <button className="btn-danger" style={{flex:'1'}}>Deny</button>
          </div>
        </div>
      </div>
    </>
  )
}