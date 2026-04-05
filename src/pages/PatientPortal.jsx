import { useState } from "react"
import LoadingTicker from "./components/patient/LoadingTicker"
import JourneyTimeline from "./components/patient/JourneyTimeline"
import CostBreakdown from "./components/patient/CostBreakdown"
import InsuranceViewer from "./components/patient/InsuranceViewer"
import N8nActions from "./components/patient/N8nActions"

export default function PatientPortal() {
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    return (
      <div className="section">
        <h2>Patient Portal</h2>
        <div className="screen">
          <div className="screen-label">
            <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
            Loading State — Blocks entire page &nbsp;·&nbsp; localhost:5173/patient
          </div>
          <div className="screen-body" style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 24px'}}>
            <LoadingTicker onComplete={() => setLoaded(true)} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <h2>Patient Portal</h2>
      <div className="screen">
        <div className="screen-label">
          <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
          Patient Dashboard — renders after all agents complete
        </div>
        <div className="screen-body">
          <div className="page-title">Your Medical Journey</div>
          <div className="page-sub">Everything prepared and ready for you</div>

          <div className="grid-3" style={{marginBottom:'12px'}}>
            <JourneyTimeline />
            <div className="card" style={{background:'var(--accent)',borderColor:'transparent'}}>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginBottom:'4px'}}>Total Estimated Cost</div>
              <div className="stat-big">$4,280</div>
              <div className="divider" style={{background:'rgba(255,255,255,0.15)'}}></div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.6)',marginBottom:'4px'}}>Uninsured Cost</div>
              <div style={{fontSize:'20px',fontFamily:'\'Syne\',sans-serif',fontWeight:'600',color:'white'}}>$1,180</div>
            </div>
            <CostBreakdown />
            <InsuranceViewer />
            <N8nActions />
          </div>
        </div>
      </div>
    </div>
  )
}
