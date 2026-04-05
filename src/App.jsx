import { BrowserRouter, Routes, Route } from "react-router-dom"
import DoctorPortal from "./pages/DoctorPortal"
import PatientPortal from "./pages/PatientPortal"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/doctor" element={<DoctorPortal />} />
        <Route path="/patient" element={<PatientPortal />} />
      </Routes>
    </BrowserRouter>
  )
}