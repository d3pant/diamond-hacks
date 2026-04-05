import { useEffect, useState } from "react"
import { usePatientBundle } from "../../context/PatientBundleContext"
import { fetchSurgeryBreakdown } from "../../api"

function fmt(n) {
  if (n == null) return "—"
  return "$" + Number(n).toLocaleString()
}

function fmtRange(lo, hi) {
  if (lo == null && hi == null) return "—"
  if (lo === hi) return fmt(lo)
  return `${fmt(lo)} – ${fmt(hi)}`
}

export default function SurgeryPage() {
  const { bundle } = usePatientBundle()
  const fallback = bundle?.surgery
  const [detail, setDetail] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchSurgeryBreakdown()
      .then((d) => { if (!cancelled) setDetail(d) })
      .catch((e) => { if (!cancelled) setErr(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const result = detail?.surgery_result ?? fallback
  const calc = detail?.calculation

  if (loading) {
    return (
      <div className="screen">
        <div className="screen-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>🏥</div>
            <div style={{ color: "var(--muted)", fontSize: "14px" }}>Loading surgery data…</div>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="screen">
        <div className="screen-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>🏥</div>
            <div style={{ color: "var(--muted)", fontSize: "14px" }}>No surgery data available yet.</div>
          </div>
        </div>
      </div>
    )
  }

  const surgeonAmt = result?.surgeon_fee?.amount
  const facMin = result?.facility_fee?.minimum
  const facMax = result?.facility_fee?.maximum
  const totalMin = result?.total?.minimum
  const totalMax = result?.total?.maximum

  const surgTotal = surgeonAmt ?? 0
  const facMid = facMin != null && facMax != null ? (facMin + facMax) / 2 : (facMin ?? facMax ?? 0)
  const combinedForBar = surgTotal + facMid
  const surgPct = combinedForBar > 0 ? Math.round((surgTotal / combinedForBar) * 100) : 50
  const facPct = 100 - surgPct

  const STEP_COLORS = {
    cpt_lookup:   { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.4)", text: "#c4b5fd", icon: "📋" },
    rvu_lookup:   { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.4)",  text: "#93c5fd", icon: "📊" },
    surgeon_fee:  { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.4)",  text: "#93c5fd", icon: "🩺" },
    facility_fee: { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.4)",  text: "#fcd34d", icon: "🏥" },
    total_gross:  { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.4)",   text: "#86efac", icon: "💰" },
  }

  return (
    <div className="screen">
      <div className="screen-body">

        {/* ── Hero card ─────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(20,184,166,0.08) 50%, rgba(59,130,246,0.08) 100%)",
          border: "0.5px solid rgba(34,197,94,0.3)",
          borderRadius: "20px",
          padding: "28px 28px 24px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* subtle glow */}
          <div style={{
            position: "absolute", top: "-40px", right: "-40px",
            width: "180px", height: "180px",
            background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* procedure + hospital */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "22px",
              fontWeight: 800,
              color: "white",
              lineHeight: 1.2,
              marginBottom: "6px",
            }}>
              {result?.procedure ?? "Surgery"}
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>🏥</span>
              <span>{result?.hospital ?? "Hospital"}</span>
            </div>
          </div>

          {/* total cost hero */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "11px", color: "rgba(34,197,94,0.8)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                Total Estimated Cost
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "48px",
                fontWeight: 800,
                color: "#4ade80",
                lineHeight: 1,
                letterSpacing: "-0.03em",
                textShadow: "0 0 40px rgba(34,197,94,0.3)",
              }}>
                {fmtRange(totalMin, totalMax)}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "6px" }}>
                Surgeon + facility combined · before insurance
              </div>
            </div>

            {result?.cpt_code && (
              <div style={{
                marginLeft: "auto",
                background: "rgba(139,92,246,0.2)",
                border: "0.5px solid rgba(139,92,246,0.5)",
                borderRadius: "14px",
                padding: "12px 18px",
                textAlign: "center",
                flexShrink: 0,
              }}>
                <div style={{ fontSize: "10px", color: "#c4b5fd", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>CPT Code</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: 800, color: "white" }}>
                  {result.cpt_code}
                </div>
                {result.cpt_description && (
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "4px", maxWidth: "200px", lineHeight: 1.4 }}>
                    {result.cpt_description}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Two cost cards ────────────────────────────────────────── */}
        <div className="grid-2" style={{ marginBottom: "20px" }}>

          {/* Surgeon fee */}
          <div style={{
            background: "var(--card)",
            border: "0.5px solid rgba(59,130,246,0.3)",
            borderRadius: "16px",
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "3px",
              background: "linear-gradient(90deg, #3b82f6, #6366f1)",
              borderRadius: "16px 16px 0 0",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: "rgba(59,130,246,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px",
              }}>🩺</div>
              <div>
                <div style={{ fontSize: "12px", color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  Surgeon Fee
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                  {surgPct}% of total
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontSize: "34px", fontWeight: 800,
              color: "#93c5fd", letterSpacing: "-0.02em",
            }}>
              {fmt(surgeonAmt)}
            </div>
            {result?.surgeon_fee?.source && (
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
                {result.surgeon_fee.source}
              </div>
            )}
          </div>

          {/* Facility fee */}
          <div style={{
            background: "var(--card)",
            border: "0.5px solid rgba(245,158,11,0.3)",
            borderRadius: "16px",
            padding: "20px 22px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "3px",
              background: "linear-gradient(90deg, #f59e0b, #fb923c)",
              borderRadius: "16px 16px 0 0",
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: "rgba(245,158,11,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px",
              }}>🏛️</div>
              <div>
                <div style={{ fontSize: "12px", color: "#fcd34d", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  Facility Fee
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "1px" }}>
                  {facPct}% of total
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontSize: "34px", fontWeight: 800,
              color: "#fcd34d", letterSpacing: "-0.02em",
            }}>
              {fmtRange(facMin, facMax)}
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "8px" }}>
              Hospital / facility charge
            </div>
          </div>
        </div>

        {/* ── Cost split bar ────────────────────────────────────────── */}
        {surgTotal > 0 && facMid > 0 && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "14px", color: "white", fontWeight: 600, marginBottom: "16px" }}>
              Cost split
            </div>
            <div style={{ display: "flex", height: "16px", borderRadius: "8px", overflow: "hidden", gap: "3px" }}>
              <div style={{
                width: `${surgPct}%`,
                background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                borderRadius: "8px 0 0 8px",
                position: "relative",
              }} />
              <div style={{
                width: `${facPct}%`,
                background: "linear-gradient(90deg, #f59e0b, #fb923c)",
                borderRadius: "0 8px 8px 0",
              }} />
            </div>
            <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#3b82f6" }} />
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>Surgeon fee</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#93c5fd" }}>{surgPct}%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#f59e0b" }} />
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>Facility fee</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#fcd34d" }}>{facPct}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Calculation steps ─────────────────────────────────────── */}
        {calc?.steps?.length > 0 && (
          <div className="card" style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "15px", color: "white", fontWeight: 700, marginBottom: "4px" }}>
              How this was calculated
            </div>
            <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "18px", lineHeight: 1.6 }}>
              Surgeon fees = Medicare conversion factor ({calc.conversion_factor_medicare}) × RVU (CMS PPRRVU
              {calc.code_reference ? ` · ${calc.code_reference}` : ""})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {calc.steps.map((step) => {
                const style = STEP_COLORS[step.id] ?? STEP_COLORS.cpt_lookup
                return (
                  <div key={step.id} style={{
                    display: "flex",
                    gap: "14px",
                    padding: "16px 18px",
                    background: style.bg,
                    borderRadius: "14px",
                    border: `0.5px solid ${style.border}`,
                    alignItems: "flex-start",
                  }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "12px",
                      background: "rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "20px", flexShrink: 0,
                    }}>
                      {style.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "15px", color: "white", fontWeight: 700, marginBottom: "4px" }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                            {step.description}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          {step.value_usd != null && (
                            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, color: style.text }}>
                              {fmt(step.value_usd)}
                            </div>
                          )}
                          {step.minimum_usd != null && step.maximum_usd != null && (
                            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 800, color: style.text }}>
                              {fmtRange(step.minimum_usd, step.maximum_usd)}
                            </div>
                          )}
                        </div>
                      </div>
                      {step.formula && (
                        <div style={{
                          marginTop: "10px", padding: "8px 12px",
                          background: "rgba(0,0,0,0.35)", borderRadius: "8px",
                          fontFamily: "monospace", fontSize: "12px", color: style.text,
                          letterSpacing: "0.02em",
                        }}>
                          {step.formula}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Note ──────────────────────────────────────────────────── */}
        {(result?.note || result?.reason) && (
          <div style={{
            padding: "16px 18px",
            borderRadius: "14px",
            background: "rgba(250,204,21,0.07)",
            border: "0.5px solid rgba(250,204,21,0.3)",
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "18px" }}>⚠️</span>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                {result.note ?? result.reason}
              </div>
            </div>
          </div>
        )}

        {err && !result && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", border: "0.5px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", fontSize: "12px", color: "#fca5a5" }}>
            Breakdown API: {err}
          </div>
        )}

      </div>
    </div>
  )
}
