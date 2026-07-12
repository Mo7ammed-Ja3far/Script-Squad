import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/providers/AuthProvider"
import { SocketProvider } from "@/providers/SocketProvider"
import { QueryProvider } from "@/providers/QueryProvider"
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { Toaster } from "@/components/ui/toaster"

// Auth pages
import LoginPage from "@/features/auth/LoginPage"
import RegisterPage from "@/features/auth/RegisterPage"
import VerifyOtpPage from "@/features/auth/VerifyOtpPage"
import { ForgotPasswordPage, ResetPasswordPage } from "@/features/auth/PasswordPages"

// Patient pages
import PatientOverview from "@/features/patient/PatientOverview"
import BookAppointment from "@/features/patient/BookAppointment"
import PatientAppointments from "@/features/patient/PatientAppointments"
import PatientLiveQueue from "@/features/patient/PatientLiveQueue"
import PatientEMR from "@/features/patient/PatientEMR"
import PatientPrescriptions from "@/features/patient/PatientPrescriptions"

// Doctor pages
import DoctorOverview from "@/features/doctor/DoctorOverview"
import DoctorQueue from "@/features/doctor/DoctorQueue"
import DoctorAppointments from "@/features/doctor/DoctorAppointments"
import DoctorConsultations from "@/features/doctor/DoctorConsultations"
import DoctorSchedule from "@/features/doctor/DoctorSchedule"
import DoctorConsultationHistory from "@/features/doctor/DoctorConsultationHistory"

// Admin pages
import AdminDashboard from "@/features/admin/AdminDashboard"
import AdminUsers from "@/features/admin/AdminUsers"

// Landing page (placeholder)
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-clinic-blue-light to-clinic-teal-light flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-display font-bold text-foreground mb-2">ClinicFlow</h1>
        <p className="text-muted-foreground mb-6">Healthcare management made simple</p>
        <a href="/auth/login" className="px-6 py-2.5 gradient-brand text-white rounded-xl font-medium hover:opacity-90 inline-block transition-opacity">
          Sign in
        </a>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/auth/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route path="/auth/verify-otp" element={<PublicOnlyRoute><VerifyOtpPage /></PublicOnlyRoute>} />
              <Route path="/auth/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
              <Route path="/auth/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />

              {/* Patient routes */}
              <Route path="/patient" element={<ProtectedRoute roles={["patient"]}><DashboardLayout><PatientOverview /></DashboardLayout></ProtectedRoute>} />
              <Route path="/patient/book" element={<ProtectedRoute roles={["patient"]}><DashboardLayout><BookAppointment /></DashboardLayout></ProtectedRoute>} />
              <Route path="/patient/appointments" element={<ProtectedRoute roles={["patient"]}><DashboardLayout><PatientAppointments /></DashboardLayout></ProtectedRoute>} />
              <Route path="/patient/queue" element={<ProtectedRoute roles={["patient"]}><DashboardLayout><PatientLiveQueue /></DashboardLayout></ProtectedRoute>} />
              <Route path="/patient/emr" element={<ProtectedRoute roles={["patient"]}><DashboardLayout><PatientEMR /></DashboardLayout></ProtectedRoute>} />
              <Route path="/patient/prescriptions" element={<ProtectedRoute roles={["patient"]}><DashboardLayout><PatientPrescriptions /></DashboardLayout></ProtectedRoute>} />
              <Route path="/patient/profile" element={<ProtectedRoute roles={["patient"]}><DashboardLayout><div className="text-center py-12"><p className="text-muted-foreground">Profile page — coming soon</p></div></DashboardLayout></ProtectedRoute>} />

              {/* Doctor routes */}
              <Route path="/doctor" element={<ProtectedRoute roles={["doctor"]}><DashboardLayout><DoctorOverview /></DashboardLayout></ProtectedRoute>} />
              <Route path="/doctor/queue" element={<ProtectedRoute roles={["doctor"]}><DashboardLayout><DoctorQueue /></DashboardLayout></ProtectedRoute>} />
              <Route path="/doctor/appointments" element={<ProtectedRoute roles={["doctor"]}><DashboardLayout><DoctorAppointments /></DashboardLayout></ProtectedRoute>} />
              <Route path="/doctor/consultations" element={<ProtectedRoute roles={["doctor"]}><DashboardLayout><DoctorConsultations /></DashboardLayout></ProtectedRoute>} />
              <Route path="/doctor/schedule" element={<ProtectedRoute roles={["doctor"]}><DashboardLayout><DoctorSchedule /></DashboardLayout></ProtectedRoute>} />
              <Route path="/doctor/history" element={<ProtectedRoute roles={["doctor"]}><DashboardLayout><DoctorConsultationHistory /></DashboardLayout></ProtectedRoute>} />
              <Route path="/doctor/profile" element={<ProtectedRoute roles={["doctor"]}><DashboardLayout><div className="text-center py-12"><p className="text-muted-foreground">Profile page — coming soon</p></div></DashboardLayout></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><DashboardLayout><AdminUsers /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/appointments" element={<ProtectedRoute roles={["admin"]}><DashboardLayout><div className="text-center py-12"><p className="text-muted-foreground">Appointment management — coming soon</p></div></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/profile" element={<ProtectedRoute roles={["admin"]}><DashboardLayout><div className="text-center py-12"><p className="text-muted-foreground">Profile page — coming soon</p></div></DashboardLayout></ProtectedRoute>} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  )
}

export default App
