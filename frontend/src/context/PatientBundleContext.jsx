import { createContext, useContext } from "react"

export const PatientBundleContext = createContext(null)

export function usePatientBundle() {
  const ctx = useContext(PatientBundleContext)
  if (!ctx) {
    throw new Error("usePatientBundle must be used under PatientLayout")
  }
  return ctx
}
