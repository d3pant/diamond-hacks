export default function N8nActions() {
  return (
    <div className="card">
      <div className="section-title">Automated Actions</div>
      <div className="n8n-card" style={{marginBottom:'8px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
          <span style={{fontSize:'13px',color:'white'}}>📅 Calendar</span>
          <span className="badge badge-teal">Done</span>
        </div>
        <div style={{fontSize:'11px',color:'var(--muted)'}}>Chemo — Apr 10, 9:00 AM added</div>
      </div>
      <div className="n8n-card" style={{marginBottom:'8px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
          <span style={{fontSize:'13px',color:'white'}}>📧 Email</span>
          <span className="badge badge-teal">Done</span>
        </div>
        <div style={{fontSize:'11px',color:'var(--muted)'}}>Summary sent to patient</div>
      </div>
      <div className="n8n-card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'6px'}}>
          <span style={{fontSize:'13px',color:'white'}}>📄 Docs</span>
          <span className="badge badge-teal">Done</span>
        </div>
        <div style={{fontSize:'11px',color:'var(--muted)'}}>Treatment plan logged</div>
      </div>
    </div>
  )
}