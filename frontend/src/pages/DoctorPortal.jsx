import { useState } from "react"
import PatientTable from "./components/doctor/PatientTable"
import UploadForm from "./components/doctor/UploadForm"
import UploadConfirm from "./components/doctor/UploadConfirm"
import AIReviewPanel from "./components/doctor/AIReview"
import { postAnalyse, postApproveComplete } from "../api"

export default function DoctorPortal() {
  const [step, setStep] = useState("list")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [uploadDraft, setUploadDraft] = useState({ files: [], text: "" })
  const [analysis, setAnalysis] = useState(null)
  const [busy, setBusy] = useState(false)
  const [approveBusy, setApproveBusy] = useState(false)
  const [error, setError] = useState(null)

  const analysisComplete = analysis?.status === "complete"

  function handleSelectPatient(patient) {
    setSelectedPatient(patient)
    setUploadDraft({ files: [], text: "" })
    setAnalysis(null)
    setError(null)
    setStep("upload")
  }

  function handleUploadContinue({ files, text }) {
    setUploadDraft({ files, text })
    setError(null)
    setStep("confirm")
  }

  function handleConfirmBack() {
    setStep("upload")
  }

  async function handleConfirmApproveSend() {
    setBusy(true)
    setError(null)
    try {
      const { data } = await postAnalyse(uploadDraft.files, uploadDraft.text, { merge: false })
      setAnalysis(data)
      setStep("review")
    } catch (e) {
      setError(e.message || "Analysis failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleResubmitMerge({ files, text }) {
    setBusy(true)
    setError(null)
    try {
      const { data } = await postAnalyse(files, text, { merge: true })
      setAnalysis(data)
      setStep("review")
    } catch (e) {
      setError(e.message || "Resubmit failed")
    } finally {
      setBusy(false)
    }
  }

  async function handleFinalApprove() {
    setApproveBusy(true)
    setError(null)
    try {
      await postApproveComplete()
      setStep("list")
      setSelectedPatient(null)
      setAnalysis(null)
      setUploadDraft({ files: [], text: "" })
    } catch (e) {
      setError(e.message || "Could not start agents")
    } finally {
      setApproveBusy(false)
    }
  }

  function handleDismiss() {
    setStep("list")
    setSelectedPatient(null)
    setAnalysis(null)
    setUploadDraft({ files: [], text: "" })
    setError(null)
  }

  return (
    <div className="section">
      <h2>Doctor Portal</h2>

      {step === "list" && (
        <div className="screen">
          <div className="screen-label">
                      Screen 1 — Patient List &nbsp;·&nbsp; localhost:5173/doctor
          </div>
          <div className="screen-body">
            <PatientTable onSelectPatient={handleSelectPatient} />
          </div>
        </div>
      )}

      {step === "upload" && (
        <div className="screen">
          <div className="screen-label">
                      Screen 2 — Upload (not sent until you confirm)
          </div>
          <div className="screen-body">
            <UploadForm
              patient={selectedPatient}
              initialFiles={uploadDraft.files}
              initialNotes={uploadDraft.text}
              onSubmit={handleUploadContinue}
              busy={false}
              error={error}
              submitLabel="Review & confirm →"
            />
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="screen">
          <div className="screen-label">
                      Screen 3 — Confirm before AI
          </div>
          <div className="screen-body">
            <UploadConfirm
              patient={selectedPatient}
              files={uploadDraft.files}
              notes={uploadDraft.text}
              onBack={handleConfirmBack}
              onApproveSend={handleConfirmApproveSend}
              busy={busy}
              error={error}
            />
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="screen">
          <div className="screen-label">
                      Screen 4 — AI review
          </div>
          <div className="screen-body">
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
            <AIReviewPanel
              patient={selectedPatient}
              analysis={analysis}
              complete={analysisComplete}
              onFinalApprove={handleFinalApprove}
              onDismiss={handleDismiss}
              onResubmit={() => {
                setError(null)
                setStep("resubmit")
              }}
              approveBusy={approveBusy}
            />
          </div>
        </div>
      )}

      {step === "resubmit" && (
        <div className="screen">
          <div className="screen-label">
                      Resubmit — merged with prior extraction
          </div>
          <div className="screen-body">
            <UploadForm
              patient={selectedPatient}
              initialFiles={[]}
              initialNotes=""
              onSubmit={handleResubmitMerge}
              busy={busy}
              error={error}
              submitLabel="Merge & re-analyze →"
            />
            <button
              type="button"
              className="btn-danger"
              style={{ width: "100%", marginTop: "12px" }}
              onClick={() => setStep("review")}
              disabled={busy}
            >
              Cancel — back to review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
