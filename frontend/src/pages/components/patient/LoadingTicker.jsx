import { useState, useEffect } from "react"

const steps = [
  { text: "Diagnosis received & interpreted", done: true },
  { text: "Calculating medication costs", done: true },
  { text: "Finding cheapest pharmacies near you", done: false, active: true },
  { text: "Estimating travel & logistics costs", done: false },
  { text: "Generating insurance claim document", done: false },
  { text: "Notifying n8n — calendar, email, docs", done: false },
]

export default function LoadingTicker({ onComplete }) {
  const [current, setCurrent] = useState(2)

  useEffect(() => {
    if (current < steps.length - 1) {
      const timer = setTimeout(() => setCurrent((c) => c + 1), 1600)
      return () => clearTimeout(timer)
    } else {
      setTimeout(onComplete, 800)
    }
  }, [current, onComplete])

  return (
    <>
      <div style={{fontFamily:'\'Syne\',sans-serif',fontSize:'20px',fontWeight:'600',color:'white',marginBottom:'6px',textAlign:'center'}}>Preparing your journey</div>
      <div style={{fontSize:'13px',color:'var(--muted)',marginBottom:'32px',textAlign:'center'}}>Our agents are working. This will only take a moment.</div>
      <div style={{width:'100%',maxWidth:'380px'}}>
        {steps.map((step, i) => (
          <div key={step.text} className="ticker-step">
            <div className={`tick-icon ${step.done ? 'tick-done' : step.active ? 'tick-active' : 'tick-pending'}`}>
              {step.done ? '✓' : step.active ? <div style={{width:'10px',height:'10px',borderRadius:'50%',border:'2px solid white',borderTopColor:'transparent'}}></div> : ''}
            </div>
            <span style={{fontSize:'13px',color: step.done ? 'white' : step.active ? 'white' : 'var(--muted)', fontWeight: step.active ? '500' : 'normal'}}>{step.text}</span>
          </div>
        ))}
      </div>
    </>
  )
}
