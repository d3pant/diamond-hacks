import { useState } from "react"
import { postPatientProfile } from "../../api"

const EMPTY_INSURANCE = {
  provider: "",
  policy_number: "",
  group_number: "",
  type: "",
  member_id: "",
  plan_name: "",
}

const inputStyle = {
  background: "var(--card2)",
  border: "0.5px solid var(--border)",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "13px",
  color: "var(--text)",
  width: "100%",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "11px", color: "var(--text2)", fontWeight: "500" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  )
}

export default function PatientProfileForm({ onComplete }) {
  const [personal, setPersonal] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  })
  const [insurance, setInsurance] = useState([{ ...EMPTY_INSURANCE }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function setP(key) {
    return (val) => setPersonal((p) => ({ ...p, [key]: val }))
  }

  function setI(index, key) {
    return (val) =>
      setInsurance((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, [key]: val } : entry))
      )
  }

  function addInsurance() {
    setInsurance((prev) => [...prev, { ...EMPTY_INSURANCE }])
  }

  function removeInsurance(index) {
    setInsurance((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await postPatientProfile({ personal, insurance })
      onComplete()
    } catch (err) {
      setError(err.message || "Failed to save profile")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="section">
      <h2>Patient Portal</h2>
      <div className="screen">
        <div className="screen-label">
                    Patient Profile Setup
        </div>
        <div className="screen-body">
          <div className="page-title">Tell us about yourself</div>
          <div className="page-sub">Your information is used to plan your medical journey and logistics.</div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Personal info */}
            <div className="card">
              <div className="accent-label">Personal Information</div>
              <div className="grid-2" style={{ gap: "12px" }}>
                <Field label="First Name" value={personal.first_name} onChange={setP("first_name")} placeholder="James" />
                <Field label="Last Name" value={personal.last_name} onChange={setP("last_name")} placeholder="Mercer" />
              </div>
              <div style={{ marginTop: "12px" }}>
                <Field label="Date of Birth" value={personal.dob} onChange={setP("dob")} type="date" />
              </div>
              <div className="grid-2" style={{ gap: "12px", marginTop: "12px" }}>
                <Field label="Phone" value={personal.phone} onChange={setP("phone")} placeholder="+1 310-555-0000" />
                <Field label="Email" value={personal.email} onChange={setP("email")} type="email" placeholder="you@email.com" />
              </div>
              <div style={{ marginTop: "12px" }}>
                <Field label="Street Address" value={personal.address} onChange={setP("address")} placeholder="2450 Wilshire Blvd" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
                <Field label="City" value={personal.city} onChange={setP("city")} placeholder="Santa Monica" />
                <Field label="State" value={personal.state} onChange={setP("state")} placeholder="CA" />
                <Field label="ZIP" value={personal.zip} onChange={setP("zip")} placeholder="90403" />
              </div>
            </div>

            {/* Insurance entries */}
            <div>
              <div className="accent-label" style={{ marginBottom: "10px" }}>Insurance</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {insurance.map((ins, idx) => (
                  <div key={idx} className="card" style={{ position: "relative" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "var(--text2)" }}>
                        Policy {idx + 1}
                      </span>
                      {insurance.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInsurance(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text2)",
                            cursor: "pointer",
                            fontSize: "13px",
                            padding: "2px 6px",
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid-2" style={{ gap: "12px" }}>
                      <Field label="Provider" value={ins.provider} onChange={setI(idx, "provider")} placeholder="Aetna" />
                      <Field label="Plan Name" value={ins.plan_name} onChange={setI(idx, "plan_name")} placeholder="PPO" />
                      <Field label="Policy Number" value={ins.policy_number} onChange={setI(idx, "policy_number")} placeholder="AET-000000" />
                      <Field label="Group Number" value={ins.group_number} onChange={setI(idx, "group_number")} placeholder="GRP-001" />
                      <Field label="Member ID" value={ins.member_id} onChange={setI(idx, "member_id")} placeholder="MEM-123456" />
                      <Field label="Type" value={ins.type} onChange={setI(idx, "type")} placeholder="General Medical" />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addInsurance}
                style={{
                  marginTop: "10px",
                  background: "none",
                  border: "0.5px dashed var(--border)",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontSize: "12px",
                  color: "var(--text2)",
                  cursor: "pointer",
                  width: "100%",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                + Add another insurance policy
              </button>
            </div>

            {error && (
              <div
                style={{
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

            <button
              type="submit"
              className="btn-primary"
              disabled={busy}
              style={{ width: "100%" }}
            >
              {busy ? "Saving…" : "Save & continue →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
