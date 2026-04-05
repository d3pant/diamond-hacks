/**
 * True when analyse has run and each agent that must produce a file has done so.
 * Agent 1 does not write medicines_result.json when there are zero medicines — we treat that as satisfied.
 */
export function isBundlePipelineReady(bundle) {
  if (!bundle?.patient_state) return false
  const medicines = bundle.patient_state.data?.medicines
  const needsMedicineAgent = Array.isArray(medicines) && medicines.length > 0
  if (needsMedicineAgent && bundle.medicines == null) return false
  if (bundle.surgery == null) return false
  if (bundle.travel == null) return false
  return true
}

export function surgeryCostLabel(surgery) {
  if (!surgery || surgery.status === "skipped" || surgery.status === "failed") {
    return null
  }
  const lo = surgery.total?.minimum
  const hi = surgery.total?.maximum
  if (lo != null && hi != null) {
    return `$${Number(lo).toLocaleString()} – $${Number(hi).toLocaleString()}`
  }
  return null
}

export function medicinesMonthlySum(medicines) {
  if (!medicines?.results?.length) return null
  let sum = 0
  let n = 0
  for (const r of medicines.results) {
    const p = r.cheapest_5?.[0]?.price
    if (typeof p === "number") {
      sum += p
      n += 1
    }
  }
  if (!n) return null
  return sum
}

export function travelCabLabel(travel) {
  if (!travel?.cab_cost?.estimate_str) return null
  return travel.cab_cost.estimate_str
}

export function headlineEstimate(bundle) {
  const surg = surgeryCostLabel(bundle?.surgery)
  const med = medicinesMonthlySum(bundle?.medicines)
  const cab = travelCabLabel(bundle?.travel)
  const parts = []
  if (surg) parts.push(surg)
  if (med != null) parts.push(`~$${Math.round(med)}/mo meds`)
  if (cab) parts.push(`${cab} transport (est.)`)
  if (!parts.length) return { primary: "—", secondary: "Run agents after analysis" }
  return { primary: parts[0], secondary: parts.slice(1).join(" · ") }
}
