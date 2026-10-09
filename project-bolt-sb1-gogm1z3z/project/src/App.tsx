import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';
import { ProtectedRoute, RoleRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardRedirect } from '@/pages/DashboardRedirect';
import { NotFoundPage } from '@/pages/NotFoundPage';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminPatients } from '@/pages/admin/AdminPatients';
import { AdminPatientDetail } from '@/pages/admin/AdminPatientDetail';
import { AdminDoctors } from '@/pages/admin/AdminDoctors';
import { AdminDoctorDetail } from '@/pages/admin/AdminDoctorDetail';
import { AdminDoctorForm } from '@/pages/admin/AdminDoctorForm';
import { AdminAppointments } from '@/pages/admin/AdminAppointments';
import { AdminDepartments } from '@/pages/admin/AdminDepartments';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminActivityLogs } from '@/pages/admin/AdminActivityLogs';
import { AdminSettings } from '@/pages/admin/AdminSettings';

import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard';
import { DoctorAppointments } from '@/pages/doctor/DoctorAppointments';
import { DoctorPatients } from '@/pages/doctor/DoctorPatients';
import { DoctorMedicalRecords } from '@/pages/doctor/DoctorMedicalRecords';
import { DoctorPrescriptions } from '@/pages/doctor/DoctorPrescriptions';
import { DoctorAvailability } from '@/pages/doctor/DoctorAvailability';

import { PatientDashboard } from '@/pages/patient/PatientDashboard';
import { PatientAppointments } from '@/pages/patient/PatientAppointments';
import { BookAppointment } from '@/pages/patient/BookAppointment';
import { PatientMedicalRecords } from '@/pages/patient/PatientMedicalRecords';
import { PatientPrescriptions } from '@/pages/patient/PatientPrescriptions';

import { NotificationsPage } from '@/pages/shared/NotificationsPage';
import { ProfilePage } from '@/pages/shared/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected dashboard redirect */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route element={<ProtectedRoute><RoleRoute allowedRoles={['admin']}><AppLayout /></RoleRoute></ProtectedRoute>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/patients" element={<AdminPatients />} />
              <Route path="/admin/patients/:id" element={<AdminPatientDetail />} />
              <Route path="/admin/doctors" element={<AdminDoctors />} />
              <Route path="/admin/doctors/new" element={<AdminDoctorForm />} />
              <Route path="/admin/doctors/:id" element={<AdminDoctorDetail />} />
              <Route path="/admin/doctors/:id/edit" element={<AdminDoctorForm />} />
              <Route path="/admin/appointments" element={<AdminAppointments />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/activity-logs" element={<AdminActivityLogs />} />
              <Route path="/admin/notifications" element={<NotificationsPage />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/profile" element={<ProfilePage />} />
            </Route>

            {/* Doctor routes */}
            <Route element={<ProtectedRoute><RoleRoute allowedRoles={['doctor']}><AppLayout /></RoleRoute></ProtectedRoute>}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/appointments" element={<DoctorAppointments />} />
              <Route path="/doctor/patients" element={<DoctorPatients />} />
              <Route path="/doctor/medical-records" element={<DoctorMedicalRecords />} />
              <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
              <Route path="/doctor/availability" element={<DoctorAvailability />} />
              <Route path="/doctor/notifications" element={<NotificationsPage />} />
              <Route path="/doctor/profile" element={<ProfilePage />} />
            </Route>

            {/* Patient routes */}
            <Route element={<ProtectedRoute><RoleRoute allowedRoles={['patient']}><AppLayout /></RoleRoute></ProtectedRoute>}>
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/appointments" element={<PatientAppointments />} />
              <Route path="/patient/book-appointment" element={<BookAppointment />} />
              <Route path="/patient/medical-records" element={<PatientMedicalRecords />} />
              <Route path="/patient/prescriptions" element={<PatientPrescriptions />} />
              <Route path="/patient/notifications" element={<NotificationsPage />} />
              <Route path="/patient/profile" element={<ProfilePage />} />
            </Route>

            <Route path="/" element={<DashboardRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
