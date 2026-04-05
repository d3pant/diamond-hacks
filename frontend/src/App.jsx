import { BrowserRouter, Routes, Route } from "react-router-dom"
import Landing from "./pages/Landing"
import DoctorPortal from "./pages/DoctorPortal"
import PatientLayout from "./pages/patient/PatientLayout"
import PatientDashboard from "./pages/patient/PatientDashboard"
import MedicinesPage from "./pages/patient/MedicinesPage"
import TravelPage from "./pages/patient/TravelPage"
import SurgeryPage from "./pages/patient/SurgeryPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/doctor" element={<DoctorPortal />} />
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<PatientDashboard />} />
          <Route path="medicines" element={<MedicinesPage />} />
          <Route path="travel" element={<TravelPage />} />
          <Route path="surgery" element={<SurgeryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
