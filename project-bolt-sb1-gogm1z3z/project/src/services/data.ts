import { supabase } from '@/lib/supabase';
import type { Profile, Department, DoctorProfile, Appointment, MedicalRecord, Prescription, Notification, ActivityLog, DoctorAvailability } from '@/types';

const PAGE_SIZE = 10;

export async function fetchPatients(opts: { page?: number; search?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
  const { page = 1, search, status, sortBy = 'created_at', sortOrder = 'desc' } = opts;
  const from = (page - 1) * PAGE_SIZE; const to = from + PAGE_SIZE - 1;
  let query = supabase.from('profiles').select('*', { count: 'exact' }).eq('role', 'patient').range(from, to).order(sortBy, { ascending: sortOrder === 'asc' });
  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  if (status && status !== 'all') query = query.eq('account_status', status);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Profile[], total: count || 0, pageSize: PAGE_SIZE };
}

export async function fetchPatientById(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function fetchDoctors(opts: { page?: number; search?: string; department?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
  const { page = 1, search, department, sortBy = 'created_at', sortOrder = 'desc' } = opts;
  const from = (page - 1) * PAGE_SIZE; const to = from + PAGE_SIZE - 1;
  let query = supabase.from('doctor_profiles').select('*, department:departments(*), profile:profiles(*)', { count: 'exact' }).range(from, to).order(sortBy, { ascending: sortOrder === 'asc' });
  if (search) query = query.or(`specialty.ilike.%${search}%,employee_id.ilike.%${search}%`);
  if (department && department !== 'all') query = query.eq('department_id', department);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as DoctorProfile[], total: count || 0, pageSize: PAGE_SIZE };
}

export async function fetchDoctorById(id: string) {
  const { data, error } = await supabase.from('doctor_profiles').select('*, department:departments(*), profile:profiles(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as DoctorProfile | null;
}

export async function fetchDoctorByUserId(userId: string) {
  const { data, error } = await supabase.from('doctor_profiles').select('*, department:departments(*)').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data as DoctorProfile | null;
}

export async function fetchDepartments() {
  const { data, error } = await supabase.from('departments').select('*').order('department_name');
  if (error) throw error;
  return data as Department[];
}

export async function fetchAppointments(opts: {
  page?: number; search?: string; status?: string; doctorId?: string; patientId?: string; date?: string;
  sortBy?: string; sortOrder?: 'asc' | 'desc';
}) {
  const { page = 1, search, status, doctorId, patientId, date, sortBy = 'appointment_date', sortOrder = 'desc' } = opts;
  const from = (page - 1) * PAGE_SIZE; const to = from + PAGE_SIZE - 1;
  let query = supabase.from('appointments').select('*, patient:profiles!appointments_patient_id_fkey(*), doctor:profiles!appointments_doctor_id_fkey(*)', { count: 'exact' }).range(from, to).order(sortBy, { ascending: sortOrder === 'asc' });
  if (status && status !== 'all') query = query.eq('status', status);
  if (doctorId && doctorId !== 'all') query = query.eq('doctor_id', doctorId);
  if (patientId && patientId !== 'all') query = query.eq('patient_id', patientId);
  if (date) query = query.eq('appointment_date', date);
  if (search) query = query.or(`reason_for_visit.ilike.%${search}%`);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Appointment[], total: count || 0, pageSize: PAGE_SIZE };
}

export async function fetchAppointmentById(id: string) {
  const { data, error } = await supabase.from('appointments').select('*, patient:profiles!appointments_patient_id_fkey(*), doctor:profiles!appointments_doctor_id_fkey(*)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Appointment | null;
}

export async function createAppointment(input: {
  patient_id: string; doctor_id: string; appointment_date: string; start_time: string; end_time: string;
  reason_for_visit: string; appointment_type: string;
}) {
  const { data, error } = await supabase.from('appointments').insert(input).select().single();
  if (error) throw error;
  await supabase.from('notifications').insert({ user_id: input.doctor_id, title: 'New Appointment Request', message: `A new appointment has been booked for ${input.appointment_date} at ${input.start_time}.`, notification_type: 'appointment' });
  return data as Appointment;
}

export async function updateAppointmentStatus(id: string, status: string, notes?: string) {
  const update: Record<string, string> = { status };
  if (notes !== undefined) update.notes = notes;
  const { data, error } = await supabase.from('appointments').update(update).eq('id', id).select('*, patient:profiles!appointments_patient_id_fkey(*), doctor:profiles!appointments_doctor_id_fkey(*)').single();
  if (error) throw error;
  const appt = data as Appointment;
  const msgs: Record<string, string> = { confirmed: 'Your appointment has been confirmed.', completed: 'Your appointment has been marked as completed.', cancelled: 'Your appointment has been cancelled.', no_show: 'Your appointment has been marked as no-show.' };
  if (msgs[status] && appt.patient_id) await supabase.from('notifications').insert({ user_id: appt.patient_id, title: 'Appointment Update', message: msgs[status], notification_type: 'appointment' });
  return appt;
}

export async function fetchMedicalRecords(opts: { page?: number; patientId?: string; doctorId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
  const { page = 1, patientId, doctorId, sortBy = 'record_date', sortOrder = 'desc' } = opts;
  const from = (page - 1) * PAGE_SIZE; const to = from + PAGE_SIZE - 1;
  let query = supabase.from('medical_records').select('*, patient:profiles!medical_records_patient_id_fkey(*), doctor:profiles!medical_records_doctor_id_fkey(*)', { count: 'exact' }).range(from, to).order(sortBy, { ascending: sortOrder === 'asc' });
  if (patientId) query = query.eq('patient_id', patientId);
  if (doctorId) query = query.eq('doctor_id', doctorId);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as MedicalRecord[], total: count || 0, pageSize: PAGE_SIZE };
}

export async function createMedicalRecord(input: {
  patient_id: string; doctor_id: string; appointment_id?: string; diagnosis: string;
  symptoms?: string; treatment_plan?: string; clinical_notes?: string; record_date: string;
}) {
  const { data, error } = await supabase.from('medical_records').insert(input).select().single();
  if (error) throw error;
  await supabase.from('notifications').insert({ user_id: input.patient_id, title: 'New Medical Record', message: 'A new medical record has been added to your file.', notification_type: 'medical_record' });
  return data as MedicalRecord;
}

export async function fetchPrescriptions(opts: { page?: number; patientId?: string; doctorId?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
  const { page = 1, patientId, doctorId, sortBy = 'prescribed_date', sortOrder = 'desc' } = opts;
  const from = (page - 1) * PAGE_SIZE; const to = from + PAGE_SIZE - 1;
  let query = supabase.from('prescriptions').select('*, patient:profiles!prescriptions_patient_id_fkey(*), doctor:profiles!prescriptions_doctor_id_fkey(*)', { count: 'exact' }).range(from, to).order(sortBy, { ascending: sortOrder === 'asc' });
  if (patientId) query = query.eq('patient_id', patientId);
  if (doctorId) query = query.eq('doctor_id', doctorId);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Prescription[], total: count || 0, pageSize: PAGE_SIZE };
}

export async function createPrescription(input: {
  patient_id: string; doctor_id: string; appointment_id?: string; medication_name: string;
  dosage: string; frequency: string; duration: string; instructions?: string; prescribed_date: string;
}) {
  const { data, error } = await supabase.from('prescriptions').insert(input).select().single();
  if (error) throw error;
  await supabase.from('notifications').insert({ user_id: input.patient_id, title: 'New Prescription', message: `A prescription for ${input.medication_name} has been added to your file.`, notification_type: 'prescription' });
  return data as Prescription;
}

export async function updatePrescriptionStatus(id: string, status: string) {
  const { data, error } = await supabase.from('prescriptions').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data as Prescription;
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  if (error) throw error;
}

export async function fetchActivityLogs(page = 1) {
  const from = (page - 1) * PAGE_SIZE; const to = from + PAGE_SIZE - 1;
  const { data, error, count } = await supabase.from('activity_logs').select('*, actor:profiles(*)', { count: 'exact' }).range(from, to).order('created_at', { ascending: false });
  if (error) throw error;
  return { data: data as ActivityLog[], total: count || 0, pageSize: PAGE_SIZE };
}

export async function fetchDoctorAvailability(doctorId: string) {
  const { data, error } = await supabase.from('doctor_availability').select('*').eq('doctor_id', doctorId).order('weekday');
  if (error) throw error;
  return data as DoctorAvailability[];
}

export async function saveDoctorAvailability(doctorId: string, slots: { weekday: number; start_time: string; end_time: string; is_available: boolean }[]) {
  const { error: deleteError } = await supabase.from('doctor_availability').delete().eq('doctor_id', doctorId);
  if (deleteError) throw deleteError;
  if (slots.length === 0) return;
  const { error: insertError } = await supabase.from('doctor_availability').insert(slots.map(s => ({ ...s, doctor_id: doctorId })));
  if (insertError) throw insertError;
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Profile;
}

export async function updateAccountStatus(id: string, status: string) {
  const { data, error } = await supabase.from('profiles').update({ account_status: status }).eq('id', id).select().single();
  if (error) throw error;
  return data as Profile;
}
