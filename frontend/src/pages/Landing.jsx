import { useNavigate } from "react-router-dom"

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: "calc(100vh - 48px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "40px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "32px",
            fontWeight: "700",
            color: "white",
            letterSpacing: "-0.02em",
            marginBottom: "8px",
          }}
        >
          Diamond
        </div>
        <div style={{ fontSize: "13px", color: "var(--text2)" }}>
          Medical cost estimation &amp; patient journey platform
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => navigate("/doctor")}
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border)",
            borderRadius: "16px",
            padding: "32px 48px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            width: "200px",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--card2)"
            e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--card)"
            e.currentTarget.style.borderColor = "var(--border)"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(59,130,246,0.15)",
              border: "0.5px solid rgba(59,130,246,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            🩺
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "15px",
                fontWeight: "600",
                color: "white",
                marginBottom: "4px",
              }}
            >
              Doctor
            </div>
            <div style={{ fontSize: "11px", color: "var(--text2)", lineHeight: "1.5" }}>
              Upload documents &amp; manage patients
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/patient")}
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border)",
            borderRadius: "16px",
            padding: "32px 48px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            width: "200px",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--card2)"
            e.currentTarget.style.borderColor = "rgba(20,184,166,0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--card)"
            e.currentTarget.style.borderColor = "var(--border)"
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(20,184,166,0.15)",
              border: "0.5px solid rgba(20,184,166,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            🧑‍⚕️
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "15px",
                fontWeight: "600",
                color: "white",
                marginBottom: "4px",
              }}
            >
              Patient
            </div>
            <div style={{ fontSize: "11px", color: "var(--text2)", lineHeight: "1.5" }}>
              View your cost estimates &amp; journey
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
