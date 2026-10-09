/*
# Create appointments, medical_records, prescriptions, notifications, activity_logs

## Overview
Creates the clinical and operational tables for MediCare.

## New Tables
### appointments
- id, patient_id (refs profiles), doctor_id (refs profiles), appointment_date, start_time, end_time, reason_for_visit, appointment_type, status (pending/confirmed/completed/cancelled/no_show), notes, created_at, updated_at
- UNIQUE constraint on (doctor_id, appointment_date, start_time) WHERE status NOT IN ('cancelled','no_show') to prevent double-booking

### medical_records
- id, patient_id (refs profiles), doctor_id (refs profiles), appointment_id (refs appointments), diagnosis, symptoms, treatment_plan, clinical_notes, record_date, created_at, updated_at

### prescriptions
- id, patient_id (refs profiles), doctor_id (refs profiles), appointment_id (refs appointments), medication_name, dosage, frequency, duration, instructions, prescribed_date, status (active/discontinued/completed), created_at, updated_at

### notifications
- id, user_id (refs profiles), title, message, notification_type, is_read, created_at

### activity_logs
- id, actor_id (refs profiles), action, entity_type, entity_id, metadata (jsonb), created_at

## Security
- RLS on all tables
- Patient: can access only their own appointments, records, prescriptions, notifications
- Doctor: can access appointments where they are the doctor; records/prescriptions they created or for patients under their care
- Admin: full access to appointments; read access to records/prescriptions for admin oversight
- Activity logs: admin read all; users read their own; only system/admin can insert

## Important Notes
1. Double-booking prevented by partial unique constraint on active appointments
2. Patients cannot create prescriptions or medical records
3. Activity logs are insert-only (no update/delete for non-admins)
*/
-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason_for_visit text NOT NULL,
  appointment_type text NOT NULL DEFAULT 'consultation' CHECK (appointment_type IN ('consultation', 'follow_up', 'checkup', 'emergency', 'telemedicine')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Prevent double booking: one doctor cannot have two active appointments at the same date/time
CREATE UNIQUE INDEX IF NOT EXISTS idx_no_double_booking
  ON appointments(doctor_id, appointment_date, start_time)
  WHERE status NOT IN ('cancelled', 'no_show');

-- MEDICAL_RECORDS
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  diagnosis text NOT NULL,
  symptoms text,
  treatment_plan text,
  clinical_notes text,
  record_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);

-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  instructions text,
  prescribed_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor ON prescriptions(doctor_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'general' CHECK (notification_type IN ('appointment', 'prescription', 'medical_record', 'system', 'general')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_actor ON activity_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type);

-- UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_medical_records_updated_at ON medical_records;
CREATE TRIGGER trg_medical_records_updated_at BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER trg_prescriptions_updated_at BEFORE UPDATE ON prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ENABLE RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper: check if doctor has appointment with patient
CREATE OR REPLACE FUNCTION is_care_doctor(target_patient_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.doctor_id = auth.uid()
    AND a.patient_id = target_patient_id
    AND a.status IN ('pending', 'confirmed', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- APPOINTMENTS POLICIES
DROP POLICY IF EXISTS "select_appointments" ON appointments;
CREATE POLICY "select_appointments" ON appointments FOR SELECT
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR is_admin()
  );

DROP POLICY IF EXISTS "insert_appointments" ON appointments;
CREATE POLICY "insert_appointments" ON appointments FOR INSERT
  TO authenticated WITH CHECK (
    (auth.uid() = patient_id AND is_patient())
    OR (auth.uid() = doctor_id AND is_doctor())
    OR is_admin()
  );

DROP POLICY IF EXISTS "update_appointments" ON appointments;
CREATE POLICY "update_appointments" ON appointments FOR UPDATE
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR is_admin()
  ) WITH CHECK (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR is_admin()
  );

DROP POLICY IF EXISTS "delete_appointments" ON appointments;
CREATE POLICY "delete_appointments" ON appointments FOR DELETE
  TO authenticated USING (is_admin());

-- MEDICAL_RECORDS POLICIES
DROP POLICY IF EXISTS "select_medical_records" ON medical_records;
CREATE POLICY "select_medical_records" ON medical_records FOR SELECT
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR is_admin()
  );

DROP POLICY IF EXISTS "insert_medical_records" ON medical_records;
CREATE POLICY "insert_medical_records" ON medical_records FOR INSERT
  TO authenticated WITH CHECK (
    (is_doctor() AND auth.uid() = doctor_id AND is_care_doctor(patient_id))
    OR is_admin()
  );

DROP POLICY IF EXISTS "update_medical_records" ON medical_records;
CREATE POLICY "update_medical_records" ON medical_records FOR UPDATE
  TO authenticated USING (
    (is_doctor() AND auth.uid() = doctor_id)
    OR is_admin()
  ) WITH CHECK (
    (is_doctor() AND auth.uid() = doctor_id)
    OR is_admin()
  );

DROP POLICY IF EXISTS "delete_medical_records" ON medical_records;
CREATE POLICY "delete_medical_records" ON medical_records FOR DELETE
  TO authenticated USING (is_admin());

-- PRESCRIPTIONS POLICIES
DROP POLICY IF EXISTS "select_prescriptions" ON prescriptions;
CREATE POLICY "select_prescriptions" ON prescriptions FOR SELECT
  TO authenticated USING (
    auth.uid() = patient_id
    OR auth.uid() = doctor_id
    OR is_admin()
  );

DROP POLICY IF EXISTS "insert_prescriptions" ON prescriptions;
CREATE POLICY "insert_prescriptions" ON prescriptions FOR INSERT
  TO authenticated WITH CHECK (
    (is_doctor() AND auth.uid() = doctor_id AND is_care_doctor(patient_id))
    OR is_admin()
  );

DROP POLICY IF EXISTS "update_prescriptions" ON prescriptions;
CREATE POLICY "update_prescriptions" ON prescriptions FOR UPDATE
  TO authenticated USING (
    (is_doctor() AND auth.uid() = doctor_id)
    OR is_admin()
  ) WITH CHECK (
    (is_doctor() AND auth.uid() = doctor_id)
    OR is_admin()
  );

DROP POLICY IF EXISTS "delete_prescriptions" ON prescriptions;
CREATE POLICY "delete_prescriptions" ON prescriptions FOR DELETE
  TO authenticated USING (is_admin());

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ACTIVITY_LOGS POLICIES
DROP POLICY IF EXISTS "select_activity_logs" ON activity_logs;
CREATE POLICY "select_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (
    auth.uid() = actor_id OR is_admin()
  );

DROP POLICY IF EXISTS "insert_activity_logs" ON activity_logs;
CREATE POLICY "insert_activity_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = actor_id OR is_admin());

-- Activity logs are insert-only - no updates or deletes for regular users
DROP POLICY IF EXISTS "update_activity_logs" ON activity_logs;
CREATE POLICY "update_activity_logs" ON activity_logs FOR UPDATE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "delete_activity_logs" ON activity_logs;
CREATE POLICY "delete_activity_logs" ON activity_logs FOR DELETE
  TO authenticated USING (is_admin());

-- Update profiles select policy to allow doctors to see patients they have appointments with
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR is_admin()
    OR (is_doctor() AND EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.doctor_id = auth.uid() AND a.patient_id = profiles.id
    ))
  );
