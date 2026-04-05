export default function JourneyTimeline({ bundle }) {
  const ps = bundle?.patient_state
  const diagnosis = ps?.data?.diagnosis
  const medOk = bundle?.medicines?.status === "complete" && (bundle.medicines.successful_searches ?? 0) > 0
  const surgOk =
    bundle?.surgery &&
    bundle.surgery.status !== "skipped" &&
    bundle.surgery.status !== "failed" &&
    bundle.surgery.total?.minimum != null
  const travelOk = bundle?.travel?.status === "complete"

  const steps = [
    { done: Boolean(diagnosis), text: "Diagnosis",  sub: "Analysis complete"  },
    { done: medOk && surgOk,    text: "Cost Plan",  sub: "Priced & ready"     },
    { done: false,              text: "Insurance",  sub: "Claim pending"      },
    { done: travelOk,           text: "Travel",     sub: "Itinerary set"      },
  ]

  const doneCount  = steps.filter((s) => s.done).length
  const currentIdx = steps.findIndex((s) => !s.done) // first incomplete = active
  const summary    = diagnosis || "Complete doctor analysis to see your diagnosis summary."

  return (
    <div
      className="col-span-2"
      style={{
        background: "var(--card)",
        border: "0.5px solid rgba(20,184,166,0.28)",
        borderRadius: "14px",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(20,184,166,0.12)"
        e.currentTarget.style.borderColor = "rgba(20,184,166,0.5)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none"
        e.currentTarget.style.borderColor = "rgba(20,184,166,0.28)"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
          Journey Progress
        </div>
        <div style={{
          fontFamily: "'Syne',sans-serif", fontSize: "12px", fontWeight: 700,
          color: "var(--teal)",
          background: "rgba(20,184,166,0.1)",
          border: "0.5px solid rgba(20,184,166,0.25)",
          padding: "3px 10px", borderRadius: "20px",
          letterSpacing: "0.02em",
        }}>
          {doneCount}/{steps.length} done
        </div>
      </div>

      {/* Progress track */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {steps.map((step, i) => (
          <div
            key={step.text}
            style={{
              flex: 1, height: "4px", borderRadius: "2px",
              background: step.done
                ? "var(--teal)"
                : i === currentIdx
                  ? "rgba(59,130,246,0.5)"
                  : "rgba(255,255,255,0.08)",
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Step list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
        {steps.map((step, i) => {
          const isActive  = i === currentIdx
          const isDone    = step.done
          const isPending = !isDone && !isActive

          return (
            <div
              key={step.text}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: isDone
                  ? "rgba(20,184,166,0.07)"
                  : isActive
                    ? "rgba(59,130,246,0.07)"
                    : "transparent",
                border: isActive
                  ? "0.5px solid rgba(59,130,246,0.2)"
                  : "0.5px solid transparent",
                opacity: isPending ? 0.45 : 1,
                transition: "opacity 0.2s ease",
              }}
            >
              {/* Icon */}
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isDone
                  ? "rgba(20,184,166,0.18)"
                  : isActive
                    ? "rgba(59,130,246,0.15)"
                    : "rgba(255,255,255,0.04)",
                border: `0.5px solid ${
                  isDone ? "rgba(20,184,166,0.4)" : isActive ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.08)"
                }`,
                fontFamily: "'Syne',sans-serif",
                fontSize: "11px", fontWeight: 800,
                color: isDone ? "var(--teal)" : isActive ? "var(--accent)" : "rgba(255,255,255,0.3)",
              }}>
                {isDone ? "✓" : i + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "13px", fontWeight: 600,
                  color: isDone ? "white" : isActive ? "white" : "rgba(255,255,255,0.5)",
                }}>
                  {step.text}
                </div>
                <div style={{
                  fontSize: "11px", marginTop: "1px",
                  color: isDone
                    ? "rgba(20,184,166,0.7)"
                    : isActive
                      ? "rgba(59,130,246,0.7)"
                      : "rgba(255,255,255,0.25)",
                }}>
                  {step.sub}
                </div>
              </div>

              {isDone && (
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "var(--teal)", flexShrink: 0,
                  boxShadow: "0 0 6px rgba(20,184,166,0.7)",
                }} />
              )}
              {isActive && (
                <div style={{
                  fontSize: "10px", color: "var(--accent)", fontWeight: 600,
                  background: "rgba(59,130,246,0.12)",
                  border: "0.5px solid rgba(59,130,246,0.3)",
                  padding: "2px 7px", borderRadius: "10px", flexShrink: 0,
                }}>
                  Next
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Diagnosis */}
      <div style={{
        background: "var(--card2)",
        border: "0.5px solid var(--border)",
        borderRadius: "10px",
        padding: "12px 14px",
      }}>
        <div style={{
          fontSize: "10px", color: "var(--teal)", textTransform: "uppercase",
          letterSpacing: "0.1em", marginBottom: "5px", fontWeight: 600,
        }}>
          Diagnosis
        </div>
        <div style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.65 }}>{summary}</div>
      </div>
    </div>
  )
}
