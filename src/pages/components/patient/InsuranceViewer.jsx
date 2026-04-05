export default function InsuranceViewer() {
  return (
    <div className="card col-span-2">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
        <div className="section-title" style={{margin:'0'}}>Insurance Claim</div>
        <span className="badge badge-teal">Submitted</span>
      </div>
      <div className="pdf-mock">
        <div className="pdf-icon">PDF</div>
        <div style={{fontSize:'12px',color:'var(--muted)'}}>BlueCross_Claim_March2026.pdf</div>
        <div style={{fontSize:'11px',color:'var(--teal)'}}>View document →</div>
      </div>
    </div>
  )
}