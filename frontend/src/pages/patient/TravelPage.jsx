import { usePatientBundle } from "../../context/PatientBundleContext"

function calendarDayUrl(isoStr) {
  if (!isoStr) return "https://calendar.google.com"
  try {
    const d = new Date(isoStr)
    return `https://calendar.google.com/calendar/r/day/${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  } catch { return "https://calendar.google.com" }
}

const TIMELINE_STEPS = [
  { strKey: "wake_up_str",        isoKey: "wake_up",        label: "Wake up",         icon: "⏰", color: "#a855f7", bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.4)" },
  { strKey: "cab_pickup_str",     isoKey: "cab_pickup",     label: "Leave home",      icon: "🚕", color: "#3b82f6", bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.4)"  },
  { strKey: "required_arrival_str", isoKey: "required_arrival", label: "Arrive",      icon: "📍", color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.4)"  },
  { strKey: "appointment_str",    isoKey: "appointment",    label: "Procedure",       icon: "🏥", color: "#22c55e", bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.4)"   },
]

export default function TravelPage() {
  const { bundle } = usePatientBundle()
  const travel = bundle?.travel
  const tl = travel?.timeline ?? {}
  const isFlight = travel?.mode === "flight"
  const apptIso = tl.appointment ?? null
  const calUrl = calendarDayUrl(apptIso)

  if (!travel) {
    return (
      <div className="screen">
        <div className="screen-body" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "28px", marginBottom: "12px" }}>✈️</div>
            <div style={{ color: "var(--muted)", fontSize: "14px" }}>No travel data available yet.</div>
          </div>
        </div>
      </div>
    )
  }

  const flightOpts = travel.flights?.options ?? []
  const bestFlight = flightOpts[0]

  return (
    <div className="screen">
      <div className="screen-body">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div style={{
          background: isFlight
            ? "linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(99,102,241,0.10) 50%, rgba(168,85,247,0.08) 100%)"
            : "linear-gradient(135deg, rgba(20,184,166,0.14) 0%, rgba(59,130,246,0.08) 100%)",
          border: `0.5px solid ${isFlight ? "rgba(59,130,246,0.4)" : "rgba(20,184,166,0.4)"}`,
          borderRadius: "20px",
          padding: "28px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: "-40px", right: "-30px",
            width: "160px", height: "160px",
            background: `radial-gradient(circle, ${isFlight ? "rgba(59,130,246,0.18)" : "rgba(20,184,166,0.18)"} 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* mode badge */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{
              fontSize: "12px", fontWeight: 700, padding: "5px 14px",
              borderRadius: "20px",
              background: isFlight ? "rgba(59,130,246,0.25)" : "rgba(20,184,166,0.25)",
              border: `0.5px solid ${isFlight ? "rgba(59,130,246,0.5)" : "rgba(20,184,166,0.5)"}`,
              color: isFlight ? "#93c5fd" : "#5eead4",
              letterSpacing: "0.04em",
            }}>
              {isFlight ? "✈️  Flight" : "🚕  Cab"}
            </span>
          </div>

          {/* route */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: isFlight ? "#93c5fd" : "#5eead4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>From</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 700, color: "white", lineHeight: 1.3 }}>
                {travel.origin ?? "—"}
              </div>
            </div>
            <div style={{ fontSize: "28px", opacity: 0.6 }}>{isFlight ? "✈️" : "🚕"}</div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: isFlight ? "#93c5fd" : "#5eead4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>To</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", fontWeight: 700, color: "white", lineHeight: 1.3 }}>
                {travel.destination ?? "—"}
              </div>
            </div>
          </div>

          {/* stat pills */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {travel.distance_miles != null && (
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "8px 16px" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "2px" }}>Distance</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 800, color: "white" }}>
                  {travel.distance_miles} mi
                </div>
              </div>
            )}
            {(travel.travel_time_text || travel.travel_time_minutes) && (
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "8px 16px" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "2px" }}>Travel Time</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 800, color: "white" }}>
                  {travel.travel_time_text ?? `${travel.travel_time_minutes} min`}
                </div>
              </div>
            )}
            {!isFlight && travel.cab_cost?.estimate_str && (
              <div style={{ background: "rgba(20,184,166,0.15)", border: "0.5px solid rgba(20,184,166,0.3)", borderRadius: "10px", padding: "8px 16px" }}>
                <div style={{ fontSize: "10px", color: "#5eead4", marginBottom: "2px" }}>Cab Estimate</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 800, color: "#5eead4" }}>
                  {travel.cab_cost.estimate_str}
                </div>
              </div>
            )}
            {isFlight && bestFlight?.price_str && (
              <div style={{ background: "rgba(59,130,246,0.15)", border: "0.5px solid rgba(59,130,246,0.3)", borderRadius: "10px", padding: "8px 16px" }}>
                <div style={{ fontSize: "10px", color: "#93c5fd", marginBottom: "2px" }}>Best Flight</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px", fontWeight: 800, color: "#93c5fd" }}>
                  {bestFlight.price_str}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Map + Day-of timeline ─────────────────────────────── */}
        <div className="grid-2" style={{ marginBottom: "20px" }}>

          {/* Map */}
          {travel.map_url ? (
            <div style={{ borderRadius: "16px", overflow: "hidden", border: "0.5px solid var(--border)" }}>
              <img src={travel.map_url} alt="Route map" style={{ width: "100%", display: "block" }} />
            </div>
          ) : (
            <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "180px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🗺️</div>
                <div style={{ color: "var(--muted)", fontSize: "13px" }}>No map available</div>
              </div>
            </div>
          )}

          {/* Day-of itinerary */}
          <div className="card">
            <div style={{ fontSize: "14px", color: "white", fontWeight: 700, marginBottom: "18px" }}>Day-of Itinerary</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {TIMELINE_STEPS.map((step, idx) => {
                const label = tl[step.strKey]
                const isLast = idx === TIMELINE_STEPS.length - 1
                return (
                  <div key={step.strKey} style={{ display: "flex", gap: "14px" }}>
                    {/* connector column */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "40px", flexShrink: 0 }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "12px",
                        background: label ? step.bg : "rgba(255,255,255,0.04)",
                        border: `0.5px solid ${label ? step.border : "var(--border)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "18px",
                      }}>
                        {step.icon}
                      </div>
                      {!isLast && (
                        <div style={{
                          width: "2px", flex: 1, minHeight: "14px", margin: "4px 0",
                          background: label ? step.color : "var(--border)",
                          borderRadius: "1px", opacity: label ? 0.4 : 0.2,
                        }} />
                      )}
                    </div>
                    {/* content */}
                    <div style={{ paddingBottom: isLast ? 0 : "16px", paddingTop: "4px", flex: 1 }}>
                      <div style={{ fontSize: "11px", color: label ? step.color : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>
                        {step.label}
                      </div>
                      <div style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: "20px", fontWeight: 800,
                        color: label ? "white" : "var(--muted)",
                        marginTop: "2px", lineHeight: 1,
                      }}>
                        {label ?? "—"}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Flight options ────────────────────────────────────── */}
        {isFlight && flightOpts.length > 0 && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "15px", color: "white", fontWeight: 700, marginBottom: "14px" }}>
              ✈️ Flight Options — {flightOpts.length} found
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {flightOpts.map((f, i) => (
                <div key={i} style={{
                  padding: "16px 18px",
                  borderRadius: "14px",
                  background: i === 0 ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
                  border: `0.5px solid ${i === 0 ? "rgba(59,130,246,0.4)" : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {i === 0 && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                      background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                    }} />
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {i === 0 && (
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: "#3b82f6", color: "white", letterSpacing: "0.05em" }}>
                        BEST
                      </span>
                    )}
                    <div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px", color: "white", fontWeight: 700 }}>{f.airline}</div>
                      <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>
                        {f.departure_time} → {f.arrival_time}
                        {f.duration ? <span style={{ color: i === 0 ? "#93c5fd" : "rgba(255,255,255,0.35)" }}> · {f.duration}</span> : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: 800,
                      color: i === 0 ? "#93c5fd" : "white",
                    }}>
                      {f.price_str}
                    </div>
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noreferrer" style={{
                        padding: "8px 16px", borderRadius: "10px",
                        background: i === 0 ? "#3b82f6" : "rgba(255,255,255,0.08)",
                        color: "white", textDecoration: "none",
                        fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap",
                      }}>
                        Book →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cab breakdown (non-flight) ────────────────────────── */}
        {!isFlight && travel.cab_cost && (
          <div className="card" style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "15px", color: "white", fontWeight: 700, marginBottom: "16px" }}>🚕 Cab Cost Breakdown</div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{
                flex: 1, minWidth: "110px", background: "rgba(20,184,166,0.10)",
                border: "0.5px solid rgba(20,184,166,0.3)", borderRadius: "12px", padding: "14px 16px",
              }}>
                <div style={{ fontSize: "11px", color: "#5eead4", marginBottom: "6px" }}>Low</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 800, color: "#5eead4" }}>
                  {travel.cab_cost.low != null ? `$${Number(travel.cab_cost.low).toFixed(2)}` : "—"}
                </div>
              </div>
              <div style={{
                flex: 1, minWidth: "110px", background: "rgba(245,158,11,0.10)",
                border: "0.5px solid rgba(245,158,11,0.3)", borderRadius: "12px", padding: "14px 16px",
              }}>
                <div style={{ fontSize: "11px", color: "#fcd34d", marginBottom: "6px" }}>High</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: 800, color: "#fcd34d" }}>
                  {travel.cab_cost.high != null ? `$${Number(travel.cab_cost.high).toFixed(2)}` : "—"}
                </div>
              </div>
              {travel.distance_miles != null && (
                <div style={{
                  flex: 2, minWidth: "160px", background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid var(--border)", borderRadius: "12px", padding: "14px 16px",
                  display: "flex", alignItems: "center",
                }}>
                  <div style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--teal)", lineHeight: 1.6 }}>
                    $5 base<br />+ $2.50 × {travel.distance_miles} mi
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Calendar button ───────────────────────────────────── */}
        <a
          href={calUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            background: travel.calendar_events_created
              ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(20,184,166,0.10))"
              : "rgba(255,255,255,0.04)",
            border: `0.5px solid ${travel.calendar_events_created ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
            color: travel.calendar_events_created ? "#4ade80" : "var(--muted)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            boxSizing: "border-box",
          }}
        >
          <span style={{ fontSize: "18px" }}>📅</span>
          {travel.calendar_events_created ? "View Events in Google Calendar →" : "Google Calendar (no events yet)"}
        </a>

      </div>
    </div>
  )
}
