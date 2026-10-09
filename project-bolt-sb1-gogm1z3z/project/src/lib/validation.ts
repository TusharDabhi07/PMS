import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
});

export const profileEditSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional(),
});

export const doctorProfileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  employee_id: z.string().min(1, 'Employee ID is required'),
  specialty: z.string().min(1, 'Specialty is required'),
  department_id: z.string().min(1, 'Department is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  license_number: z.string().min(1, 'License number is required'),
  consultation_fee: z.number().min(0).optional(),
  years_of_experience: z.number().min(0).optional(),
  biography: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const appointmentBookingSchema = z.object({
  department_id: z.string().min(1, 'Please select a department'),
  doctor_id: z.string().min(1, 'Please select a doctor'),
  appointment_date: z.string().min(1, 'Please select a date'),
  start_time: z.string().min(1, 'Please select a time slot'),
  reason_for_visit: z.string().min(5, 'Please describe your reason for visit (at least 5 characters)'),
  appointment_type: z.enum(['consultation', 'follow_up', 'checkup', 'emergency', 'telemedicine']),
});

export const medicalRecordSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  appointment_id: z.string().optional(),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  symptoms: z.string().optional(),
  treatment_plan: z.string().optional(),
  clinical_notes: z.string().optional(),
  record_date: z.string().min(1, 'Record date is required'),
});

export const prescriptionSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  appointment_id: z.string().optional(),
  medication_name: z.string().min(2, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional(),
  prescribed_date: z.string().min(1, 'Prescribed date is required'),
});

export const departmentSchema = z.object({
  department_name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileEditInput = z.infer<typeof profileEditSchema>;
export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;
export type AppointmentBookingInput = z.infer<typeof appointmentBookingSchema>;
export type MedicalRecordInput = z.infer<typeof medicalRecordSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
