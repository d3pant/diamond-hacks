function fmt(n) {
  if (n == null) return null
  return "$" + Number(n).toLocaleString()
}

function fmtCompact(n) {
  if (n == null) return "—"
  if (n >= 10000) return "$" + Math.round(n / 1000) + "K"
  if (n >= 1000)  return "$" + (n / 1000).toFixed(1) + "K"
  return "$" + Number(n).toLocaleString()
}

function fmtRange(lo, hi) {
  if (lo == null && hi == null) return null
  if (lo == null) return fmt(hi)
  if (hi == null) return fmt(lo)
  return `${fmt(lo)} – ${fmt(hi)}`
}

function fmtRangeCompact(lo, hi) {
  if (lo == null && hi == null) return "—"
  if (lo == null) return fmtCompact(hi)
  if (hi == null) return fmtCompact(lo)
  return `${fmtCompact(lo)} – ${fmtCompact(hi)}`
}

const COLORS = {
  surgeon:  "#3b82f6",
  facility: "#14b8a6",
  travel:   "#f59e0b",
}
const MED_COLORS = ["#a78bfa", "#818cf8", "#c084fc", "#e879f9", "#f472b6"]

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: "10px", color: "rgba(255,255,255,0.35)",
      textTransform: "uppercase", letterSpacing: "0.1em",
      fontWeight: 600, padding: "10px 0 4px",
    }}>
      {children}
    </div>
  )
}

function LineItem({ seg, pct, isLast }) {
  return (
    <div style={{
      padding: "8px 0",
      borderBottom: isLast ? "none" : "0.5px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "3px",
            background: seg.color, flexShrink: 0,
          }} />
          <span style={{
            fontSize: "12px", color: "rgba(255,255,255,0.82)",
            fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {seg.label}
          </span>
          <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.38)", flexShrink: 0 }}>
            {seg.source}
          </span>
        </div>
        <span style={{
          fontSize: "12px", fontFamily: "'Syne',sans-serif",
          fontWeight: 700, color: "white", flexShrink: 0, marginLeft: "8px",
        }}>
          {seg.valueStr}
        </span>
      </div>
      <div style={{
        height: "4px", borderRadius: "2px",
        background: "rgba(255,255,255,0.07)", overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: seg.color, borderRadius: "2px",
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  )
}

export default function CostInfographic({ bundle }) {
  const surgery   = bundle?.surgery
  const medicines = bundle?.medicines
  const travel    = bundle?.travel

  // ── Build segments ──────────────────────────────────────────────────────────
  const surgerySegs = []
  const medSegs     = []
  const travelSegs  = []

  const surgeonAmt = surgery?.surgeon_fee?.amount
  if (surgeonAmt != null) {
    surgerySegs.push({
      key: "surgeon", label: "Surgeon Fee", value: surgeonAmt,
      color: COLORS.surgeon, valueStr: fmt(surgeonAmt),
      source: surgery.surgeon_fee?.source ?? "CMS PPRRVU",
    })
  }

  const facMin = surgery?.facility_fee?.minimum
  const facMax = surgery?.facility_fee?.maximum
  const facMid = facMin != null && facMax != null ? (facMin + facMax) / 2 : (facMin ?? facMax)
  if (facMid != null) {
    surgerySegs.push({
      key: "facility", label: "Facility Fee", value: facMid,
      color: COLORS.facility, valueStr: fmtRange(facMin, facMax),
      source: "Hospital pricing",
    })
  }

  ;(medicines?.results ?? []).forEach((r, i) => {
    const price = r.cheapest_5?.[0]?.price
    if (price != null) {
      medSegs.push({
        key: `med_${i}`, label: r.drug, value: price,
        color: MED_COLORS[i % MED_COLORS.length],
        valueStr: r.cheapest_5?.[0]?.price_str ?? fmt(price),
        source: r.cheapest_5?.[0]?.pharmacy_name ?? "GoodRx",
        isMed: true,
      })
    }
  })

  const isFlight = travel?.mode === "flight"
  const travelLo  = isFlight ? null : travel?.cab_cost?.low
  const travelHi  = isFlight ? null : travel?.cab_cost?.high
  const travelMid = isFlight
    ? (travel?.flights?.options?.[0]?.price ?? null)
    : travelLo != null && travelHi != null ? (travelLo + travelHi) / 2 : null
  const travelStr = isFlight
    ? (travel?.flights?.options?.[0]?.price_str ?? null)
    : fmtRange(travelLo, travelHi)
  if (travelMid != null) {
    travelSegs.push({
      key: "travel", label: isFlight ? "Flight" : "Cab", value: travelMid,
      color: COLORS.travel, valueStr: travelStr,
      source: isFlight ? "Kayak" : "Estimate",
    })
  }

  const allSegs = [...surgerySegs, ...medSegs, ...travelSegs]
  const total   = allSegs.reduce((s, seg) => s + seg.value, 0)

  const surgTotalMin = surgery?.total?.minimum
  const surgTotalMax = surgery?.total?.maximum

  if (!allSegs.length) {
    return (
      <div style={{ marginTop: "16px", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
        Run agents to see the cost breakdown.
      </div>
    )
  }

  return (
    <div style={{ marginTop: "16px" }}>

      {/* ── Focal total ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "4px" }}>
        <div style={{
          fontSize: "10px", color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px",
        }}>
          Estimated Total
        </div>
        <div style={{
          fontFamily: "'Syne',sans-serif", fontWeight: 800, lineHeight: 1,
          fontSize: "30px", color: "white", letterSpacing: "-0.03em",
        }}>
          {surgTotalMin != null ? fmtRangeCompact(surgTotalMin, surgTotalMax) : fmtCompact(total)}
        </div>
        {surgTotalMin != null && (
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "5px" }}>
            Out-of-pocket may be lower after insurance
          </div>
        )}
      </div>

      {/* ── Stacked bar ──────────────────────────────────────────────────── */}
      <div style={{
        height: "8px", borderRadius: "6px", overflow: "hidden",
        display: "flex", gap: "2px", margin: "14px 0 4px",
      }}>
        {allSegs.map((seg) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0
          return (
            <div
              key={seg.key}
              title={`${seg.label}: ${seg.valueStr}`}
              style={{
                width: `${pct}%`, background: seg.color,
                minWidth: pct > 0 ? "4px" : "0",
                borderRadius: "3px", transition: "width 0.4s ease",
              }}
            />
          )
        })}
      </div>

      {/* ── Grouped line items ────────────────────────────────────────────── */}
      {surgerySegs.length > 0 && (
        <>
          <SectionLabel>Surgery</SectionLabel>
          {surgerySegs.map((seg, i) => (
            <LineItem
              key={seg.key} seg={seg}
              pct={total > 0 ? (seg.value / total) * 100 : 0}
              isLast={i === surgerySegs.length - 1 && medSegs.length === 0 && travelSegs.length === 0}
            />
          ))}
        </>
      )}

      {medSegs.length > 0 && (
        <>
          <SectionLabel>Medicines</SectionLabel>
          {medSegs.map((seg, i) => (
            <LineItem
              key={seg.key} seg={seg}
              pct={total > 0 ? (seg.value / total) * 100 : 0}
              isLast={i === medSegs.length - 1 && travelSegs.length === 0}
            />
          ))}
        </>
      )}

      {travelSegs.length > 0 && (
        <>
          <SectionLabel>Travel</SectionLabel>
          {travelSegs.map((seg, i) => (
            <LineItem
              key={seg.key} seg={seg}
              pct={total > 0 ? (seg.value / total) * 100 : 0}
              isLast={i === travelSegs.length - 1}
            />
          ))}
        </>
      )}
    </div>
  )
}
