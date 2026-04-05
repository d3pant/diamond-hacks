const steps = [
  { done: true, text: "Diagnosis Received" },
  { done: true, text: "Cost Plan Ready" },
  { done: true, text: "Insurance Filed" },
  { done: false, text: "Appointments Scheduled" },
]

export default function JourneyTimeline() {
  return (
    <div className="card col-span-2">
      <div className="section-title">Your Journey</div>
      <div style={{display:'flex',alignItems:'flex-start',gap:'0',marginBottom:'20px'}}>
        {steps.map((step, i) => (
          <div key={step.text} style={{flex:'1'}}>
            <div className="timeline-row">
              <div className="timeline-dot" style={{background: step.done ? 'var(--teal)' : 'var(--border)'}}></div>
              <div style={{flex:'1'}}>
                <div style={{fontSize:'11px',color: step.done ? 'var(--teal)' : 'var(--muted)'}}>{step.done ? '✓' : '–'}</div>
                <div style={{fontSize:'11px',color:'white',marginTop:'2px'}}>{step.text}</div>
              </div>
            </div>
            {i < steps.length - 1 && <div className="timeline-line"></div>}
          </div>
        ))}
      </div>
      <div style={{background:'var(--card2)',border:'0.5px solid var(--border)',borderRadius:'10px',padding:'14px'}}>
        <div style={{fontSize:'10px',color:'var(--muted)',marginBottom:'4px'}}>Doctor's diagnosis summary</div>
        <div style={{fontSize:'13px',color:'var(--text2)',lineHeight:'1.6'}}>Patient presents with Stage 2 Breast Cancer. Recommended treatment plan includes chemotherapy sessions followed by surgical intervention. All medications have been prescribed with standard dosage protocols.</div>
      </div>
    </div>
  )
}
