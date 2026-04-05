import { usePatientBundle } from "../../context/PatientBundleContext"

const DRUG_COLORS = [
  { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.35)", accent: "#c084fc", bar: "#a855f7", top: "linear-gradient(90deg,#a855f7,#7c3aed)" },
  { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.35)", accent: "#93c5fd", bar: "#3b82f6", top: "linear-gradient(90deg,#3b82f6,#6366f1)" },
  { bg: "rgba(20,184,166,0.12)",  border: "rgba(20,184,166,0.35)", accent: "#5eead4", bar: "#14b8a6", top: "linear-gradient(90deg,#14b8a6,#0891b2)" },
  { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.35)", accent: "#fcd34d", bar: "#f59e0b", top: "linear-gradient(90deg,#f59e0b,#fb923c)" },
  { bg: "rgba(239,68,68,0.10)",   border: "rgba(239,68,68,0.30)",  accent: "#fca5a5", bar: "#ef4444", top: "linear-gradient(90deg,#ef4444,#f97316)" },
]

function sortedOptions(cheapest5) {
  if (!Array.isArray(cheapest5)) return []
  return [...cheapest5].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
}

export default function MedicinesPage() {
  const { bundle } = usePatientBundle()
  const med = bundle?.medicines
  const results = med?.results ?? []

  if (!med) {
    return (
      <div className="screen">
        <div className="screen-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>💊</div>
            <div style={{ color: "var(--muted)", fontSize: "14px" }}>No medication data available yet.</div>
          </div>
        </div>
      </div>
    )
  }

  const totalBest = results.reduce((sum, row) => {
    const opts = sortedOptions(row.cheapest_5)
    return sum + (opts[0]?.price ?? 0)
  }, 0)

  return (
    <div className="screen">
      <div className="screen-body">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(59,130,246,0.08) 60%, rgba(20,184,166,0.06) 100%)",
          border: "0.5px solid rgba(168,85,247,0.35)",
          borderRadius: "20px",
          padding: "28px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: "-40px", right: "-30px",
            width: "160px", height: "160px",
            background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{ fontSize: "11px", color: "rgba(168,85,247,0.9)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
            Medication Cost Summary
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: "48px", fontWeight: 800,
                color: "#c084fc", lineHeight: 1, letterSpacing: "-0.03em",
                textShadow: "0 0 40px rgba(168,85,247,0.35)",
              }}>
                ${totalBest > 0 ? Number(totalBest.toFixed(2)).toLocaleString() : "—"}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "6px" }}>
                Best-price total across {results.length} medication{results.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {results.map((row, i) => {
                const col = DRUG_COLORS[i % DRUG_COLORS.length]
                const opts = sortedOptions(row.cheapest_5)
                return (
                  <div key={i} style={{
                    background: col.bg, border: `0.5px solid ${col.border}`,
                    borderRadius: "10px", padding: "8px 14px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: "10px", color: col.accent, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "2px" }}>
                      {row.drug?.split(" ")[0]}
                    </div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>
                      {opts[0]?.price_str ?? "—"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Drug cards ────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {results.map((row, drugIdx) => {
            const options = sortedOptions(row.cheapest_5)
            const chosen = options[0]
            const col = DRUG_COLORS[drugIdx % DRUG_COLORS.length]
            const maxPrice = options[options.length - 1]?.price ?? 1

            return (
              <div key={`${row.drug}-${drugIdx}`} style={{
                background: "var(--card)",
                border: `0.5px solid ${col.border}`,
                borderRadius: "18px",
                overflow: "hidden",
                position: "relative",
              }}>
                {/* colored top bar */}
                <div style={{ height: "3px", background: col.top }} />

                <div style={{ padding: "22px 24px" }}>
                  {/* Drug header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{
                        width: "46px", height: "46px", borderRadius: "14px",
                        background: col.bg,
                        border: `0.5px solid ${col.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "22px", flexShrink: 0,
                      }}>💊</div>
                      <div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800, color: "white" }}>
                          {row.drug}
                        </div>
                        {row.qty && (
                          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>
                            {row.qty}
                          </div>
                        )}
                      </div>
                    </div>

                    {chosen && (
                      <div style={{
                        background: col.bg,
                        border: `0.5px solid ${col.border}`,
                        borderRadius: "14px",
                        padding: "12px 20px",
                        textAlign: "right",
                      }}>
                        <div style={{ fontSize: "10px", color: col.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                          Best Price
                        </div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: col.accent, lineHeight: 1 }}>
                          {chosen.price_str ?? "—"}
                        </div>
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
                          {chosen.pharmacy_name}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pharmacy list */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {options.map((opt, i) => {
                      const isChosen = i === 0
                      const barPct = maxPrice > 0 ? Math.round(((opt.price ?? 0) / maxPrice) * 100) : 0
                      return (
                        <div key={`${opt.pharmacy_name}-${i}`} style={{
                          padding: "14px 16px",
                          borderRadius: "12px",
                          background: isChosen ? col.bg : "rgba(255,255,255,0.03)",
                          border: `0.5px solid ${isChosen ? col.border : "var(--border)"}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", gap: "12px", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {isChosen && (
                                <span style={{
                                  fontSize: "10px", fontWeight: 700, padding: "2px 8px",
                                  borderRadius: "20px", background: col.bar, color: "white",
                                  letterSpacing: "0.05em",
                                }}>BEST</span>
                              )}
                              <span style={{ fontSize: "15px", color: "white", fontWeight: isChosen ? 700 : 400 }}>
                                {opt.pharmacy_name}
                              </span>
                              {opt.coupon_available && (
                                <span style={{
                                  fontSize: "10px", padding: "2px 8px", borderRadius: "10px",
                                  background: "rgba(20,184,166,0.15)", color: "#5eead4",
                                  border: "0.5px solid rgba(20,184,166,0.3)",
                                }}>Coupon</span>
                              )}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                              <div style={{
                                fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 800,
                                color: isChosen ? col.accent : "white",
                              }}>
                                {opt.price_str ?? "—"}
                              </div>
                              {opt.url && (
                                <a
                                  href={opt.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    padding: "6px 14px", borderRadius: "8px",
                                    background: isChosen ? col.bar : "rgba(255,255,255,0.08)",
                                    color: "white", textDecoration: "none",
                                    fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap",
                                  }}
                                >
                                  View →
                                </a>
                              )}
                            </div>
                          </div>
                          {/* price bar */}
                          <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                            <div style={{
                              width: `${barPct}%`, height: "100%",
                              background: isChosen ? col.bar : "rgba(255,255,255,0.2)",
                              borderRadius: "2px", transition: "width 0.4s ease",
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {med.searched_at && (
          <div style={{ marginTop: "16px", fontSize: "11px", color: "var(--muted)", textAlign: "right" }}>
            Prices fetched {new Date(med.searched_at).toLocaleString()}
            {med.pharmacy ? ` · ${med.pharmacy}` : ""}
          </div>
        )}
      </div>
    </div>
  )
}
