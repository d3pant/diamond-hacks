import JourneyTimeline from "../components/patient/JourneyTimeline"
import CostBreakdown from "../components/patient/CostBreakdown"
import CostInfographic from "../components/patient/CostInfographic"
import InsuranceViewer from "../components/patient/InsuranceViewer"
import N8nActions from "../components/patient/N8nActions"
import { usePatientBundle } from "../../context/PatientBundleContext"

export default function PatientDashboard() {
  const { bundle } = usePatientBundle()

  return (
    <div className="screen">
      <div className="screen-body">
        <div className="page-title">Your Medical Journey</div>

        <div className="grid-3" style={{ marginBottom: "12px" }}>
          <JourneyTimeline bundle={bundle} />

          {/* Cost card */}
          <div
            className="card"
            style={{
              background: "radial-gradient(ellipse at 30% 20%, #1e2330 0%, #13161e 50%, #0d0f15 100%)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Radiant glow */}
            <div style={{ position:"absolute", top:"-60px", right:"-60px", width:"200px", height:"200px", borderRadius:"50%", background:"#ffffff", opacity:0.03, filter:"blur(50px)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:"-40px", left:"-30px", width:"160px", height:"160px", borderRadius:"50%", background:"#ffffff", opacity:0.02, filter:"blur(40px)", pointerEvents:"none" }} />

            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"2px" }}>
              Cost Overview
            </div>

            <CostInfographic bundle={bundle} />
          </div>

          <CostBreakdown />
          <InsuranceViewer />
          <N8nActions bundle={bundle} />
        </div>
      </div>
    </div>
  )
}
