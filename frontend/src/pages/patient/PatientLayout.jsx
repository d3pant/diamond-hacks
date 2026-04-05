import { useCallback, useEffect, useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { PatientBundleContext } from "../../context/PatientBundleContext"
import AgentPipelineWait from "../components/patient/AgentPipelineWait"
import PatientProfileForm from "./PatientProfileForm"
import { fetchResultsBundle, fetchPatientProfileStatus } from "../../api"
import { isBundlePipelineReady } from "../../patientUtils"

const POLL_MS = 2000
const MAX_POLLS = 300

const navStyle = (active) => ({
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "12px",
  textDecoration: "none",
  color: active ? "white" : "var(--muted)",
  background: active ? "var(--accent)" : "transparent",
  border: active ? "none" : "0.5px solid var(--border)",
})

export default function PatientLayout() {
  const [profileChecked, setProfileChecked] = useState(false)
  const [profileExists, setProfileExists] = useState(false)
  const [bundle, setBundle] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [ready, setReady] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    fetchPatientProfileStatus()
      .then(({ exists }) => {
        setProfileExists(exists)
        setProfileChecked(true)
      })
      .catch(() => {
        // If check fails, let them through to avoid blocking
        setProfileExists(true)
        setProfileChecked(true)
      })
  }, [])

  const refresh = useCallback(async () => {
    const b = await fetchResultsBundle()
    setBundle(b)
    return b
  }, [])

  useEffect(() => {
    if (!profileExists) return

    let cancelled = false
    let n = 0
    let intervalId

    async function tick() {
      try {
        const b = await fetchResultsBundle()
        if (cancelled) return true
        setBundle(b)
        setFetchError(null)
        if (isBundlePipelineReady(b)) {
          setReady(true)
          setTimedOut(false)
          return true
        }
        n += 1
        setPollCount(n)
        if (n >= MAX_POLLS) {
          setTimedOut(true)
          setReady(true)
          return true
        }
      } catch (e) {
        if (!cancelled) setFetchError(e.message || "Could not load results")
      }
      return false
    }

    function schedule() {
      intervalId = setInterval(() => {
        void tick().then((stop) => {
          if (stop && intervalId) clearInterval(intervalId)
        })
      }, POLL_MS)
    }

    void tick().then((done) => {
      if (!done && !cancelled) schedule()
    })

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [profileExists])

  if (!profileChecked) return null

  if (!profileExists) {
    return <PatientProfileForm onComplete={() => setProfileExists(true)} />
  }

  if (!ready) {
    return (
      <div className="section">
        <h2>Patient Portal</h2>
        <div className="screen">
          <div className="screen-label">
                      Waiting for pipeline &nbsp;·&nbsp; localhost:5173/patient
            {pollCount > 0 && (
              <span style={{ marginLeft: "8px", opacity: 0.7 }}>
                (poll #{pollCount})
              </span>
            )}
          </div>
          <div
            className="screen-body"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px" }}
          >
            {fetchError && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "0.5px solid rgba(239,68,68,0.35)",
                  background: "rgba(239,68,68,0.08)",
                  fontSize: "13px",
                  color: "#fca5a5",
                  maxWidth: "420px",
                }}
              >
                {fetchError}
              </div>
            )}
            <AgentPipelineWait bundle={bundle} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <PatientBundleContext.Provider value={{ bundle, refresh, timedOut, fetchError }}>
      <div className="section">
        <h2>Patient Portal</h2>
        {fetchError && (
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
            {fetchError}
          </div>
        )}
        {timedOut && (
          <div
            style={{
              marginBottom: "12px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "0.5px solid rgba(250,204,21,0.35)",
              background: "rgba(250,204,21,0.08)",
              fontSize: "13px",
              color: "#fde68a",
            }}
          >
            Waited ~{Math.round((MAX_POLLS * POLL_MS) / 60000)} minutes — showing the latest bundle anyway. Refresh after
            agents finish.
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "16px",
            alignItems: "center",
          }}
        >
          <NavLink to="/patient" end style={({ isActive }) => navStyle(isActive)}>
            Overview
          </NavLink>
          <NavLink to="/patient/medicines" style={({ isActive }) => navStyle(isActive)}>
            Medicines
          </NavLink>
          <NavLink to="/patient/travel" style={({ isActive }) => navStyle(isActive)}>
            Travel
          </NavLink>
          <NavLink to="/patient/surgery" style={({ isActive }) => navStyle(isActive)}>
            Surgery
          </NavLink>
        </div>
        <Outlet />
      </div>
    </PatientBundleContext.Provider>
  )
}
