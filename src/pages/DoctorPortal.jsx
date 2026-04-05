import { useState } from "react"
import PatientTable from "./components/doctor/PatientTable"
import UploadForm from "./components/doctor/UploadForm"
import AIReviewPanel from "./components/doctor/AIReview"

export default function DoctorPortal() {
  const [screen, setScreen] = useState(1)
  const [selectedPatient, setSelectedPatient] = useState(null)

  function handleSelectPatient(patient) {
    setSelectedPatient(patient)
    setScreen(2)
  }

  function handleUploadSubmit() {
    setScreen(3)
  }

  function handleApprove() {
    setScreen(1)
  }

  return (
    <div className="section">
      <h2>Doctor Portal</h2>

      {screen === 1 && (
        <div className="screen">
          <div className="screen-label">
            <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
            Screen 1 — Patient List &nbsp;·&nbsp; localhost:5173/doctor
          </div>
          <div className="screen-body">
            <PatientTable onSelectPatient={handleSelectPatient} />
          </div>
        </div>
      )}

      {screen === 2 && (
        <div className="screen">
          <div className="screen-label">
            <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
            Screen 2 — Upload Form
          </div>
          <div className="screen-body">
            <UploadForm patient={selectedPatient} onSubmit={handleUploadSubmit} />
          </div>
        </div>
      )}

      {screen === 3 && (
        <div className="screen">
          <div className="screen-label">
            <div className="dot dot-r"></div><div className="dot dot-y"></div><div className="dot dot-g"></div>
            Screen 3 — AI Review & Approve
          </div>
          <div className="screen-body">
            <AIReviewPanel patient={selectedPatient} onApprove={handleApprove} />
          </div>
        </div>
      )}
    </div>
  )
}