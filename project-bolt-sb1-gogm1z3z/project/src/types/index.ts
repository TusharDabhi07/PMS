export type Role = 'admin' | 'doctor' | 'patient';
export type AccountStatus = 'active' | 'inactive' | 'suspended';
export type Gender = 'male' | 'female' | 'other';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'consultation' | 'follow_up' | 'checkup' | 'emergency' | 'telemedicine';
export type PrescriptionStatus = 'active' | 'discontinued' | 'completed';
export type NotificationType = 'appointment' | 'prescription' | 'medical_record' | 'system' | 'general';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  avatar_url: string | null;
  role: Role;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  department_name: string;
  description: string | null;
  created_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  employee_id: string;
  specialty: string;
  department_id: string | null;
  qualification: string;
  license_number: string;
  consultation_fee: number | null;
  years_of_experience: number | null;
  biography: string | null;
  created_at: string;
  updated_at: string;
  department?: Department | null;
  profile?: Profile;
}

export interface DoctorAvailability {
  id: string;
  doctor_id: string;
  weekday: Weekday;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason_for_visit: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: Profile;
  doctor?: Profile;
  doctor_profile?: DoctorProfile;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  diagnosis: string;
  symptoms: string | null;
  treatment_plan: string | null;
  clinical_notes: string | null;
  record_date: string;
  created_at: string;
  updated_at: string;
  patient?: Profile;
  doctor?: Profile;
  appointment?: Appointment;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  prescribed_date: string;
  status: PrescriptionStatus;
  created_at: string;
  updated_at: string;
  patient?: Profile;
  doctor?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: Profile;
}
