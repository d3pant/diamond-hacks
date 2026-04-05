import { NavLink } from "react-router-dom"

const NAV_CARDS = [
  {
    to: "/patient/medicines",
    label: "Medicine",
    icon: "💊",
    desc: "Pharmacy prices & coupon options",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    hoverBorder: "rgba(239,68,68,0.6)",
    hoverShadow: "0 12px 32px rgba(239,68,68,0.2)",
    delay: "0ms",
  },
  {
    to: "/patient/travel",
    label: "Travel",
    icon: "✈️",
    desc: "Itinerary, cab & flight logistics",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)",
    hoverBorder: "rgba(245,158,11,0.6)",
    hoverShadow: "0 12px 32px rgba(245,158,11,0.2)",
    delay: "80ms",
  },
  {
    to: "/patient/surgery",
    label: "Surgery",
    icon: "🏥",
    desc: "Cost breakdown & procedure detail",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.3)",
    hoverBorder: "rgba(34,197,94,0.6)",
    hoverShadow: "0 12px 32px rgba(34,197,94,0.2)",
    delay: "160ms",
  },
]

export default function CostBreakdown() {
  return (
    <div className="col-span-3" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      {NAV_CARDS.map((card) => (
        <NavLink
          key={card.to}
          to={card.to}
          style={{
            flex: 1,
            minWidth: "140px",
            textDecoration: "none",
            display: "block",
            animation: `navCardIn 0.35s cubic-bezier(0.22,1,0.36,1) ${card.delay} both`,
          }}
        >
          {({ isActive }) => (
            <div
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                background: isActive ? card.bg : "var(--card2)",
                border: `0.5px solid ${isActive ? card.hoverBorder : card.border}`,
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)"
                e.currentTarget.style.boxShadow = card.hoverShadow
                e.currentTarget.style.background = card.bg
                e.currentTarget.style.borderColor = card.hoverBorder
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)"
                e.currentTarget.style.boxShadow = "none"
                e.currentTarget.style.background = isActive ? card.bg : "var(--card2)"
                e.currentTarget.style.borderColor = isActive ? card.hoverBorder : card.border
              }}
            >
              <div style={{
                position: "absolute", top: "-20px", right: "-20px",
                width: "80px", height: "80px", borderRadius: "50%",
                background: card.color, opacity: 0.08, filter: "blur(20px)", pointerEvents: "none",
              }} />
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: `rgba(${card.color === "#ef4444" ? "239,68,68" : card.color === "#f59e0b" ? "245,158,11" : "34,197,94"},0.15)`,
                border: `0.5px solid ${card.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", marginBottom: "12px",
              }}>
                {card.icon}
              </div>
              <div style={{
                fontFamily: "'Syne', sans-serif", fontSize: "15px", fontWeight: 700,
                color: isActive ? card.color : "white", marginBottom: "4px",
                transition: "color 0.2s ease",
              }}>
                {card.label}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text2)", lineHeight: 1.5 }}>
                {card.desc}
              </div>
              <div style={{ marginTop: "12px", fontSize: "11px", color: card.color, fontWeight: 600, opacity: 0.8 }}>
                View details →
              </div>
            </div>
          )}
        </NavLink>
      ))}
    </div>
  )
}
