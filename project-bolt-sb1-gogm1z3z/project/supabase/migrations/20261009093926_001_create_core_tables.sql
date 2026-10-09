/*
# Create core tables: profiles, departments, doctor_profiles, doctor_availability

## Overview
Creates foundational tables for MediCare Patient Management System.

## New Tables
### profiles
- id (uuid PK, refs auth.users), full_name, email, phone, date_of_birth, gender, address, avatar_url, role (admin/doctor/patient), account_status (active/inactive/suspended), created_at, updated_at

### departments
- id (uuid PK), department_name, description, created_at

### doctor_profiles
- id (uuid PK), user_id (refs profiles), employee_id, specialty, department_id (refs departments), qualification, license_number, consultation_fee, years_of_experience, biography, created_at, updated_at

### doctor_availability
- id (uuid PK), doctor_id (refs profiles), weekday (0-6), start_time, end_time, is_available, created_at

## Security
- RLS enabled on all tables
- Helper functions: is_admin(), is_doctor(), is_patient()
- Auto-create profile on signup with 'patient' role via trigger
- Trigger prevents non-admins from changing role/account_status
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  address text,
  avatar_url text,
  role text NOT NULL DEFAULT 'patient' CHECK (role IN ('admin', 'doctor', 'patient')),
  account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- DOCTOR_PROFILES
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id text NOT NULL UNIQUE,
  specialty text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  qualification text NOT NULL,
  license_number text NOT NULL UNIQUE,
  consultation_fee numeric(10,2),
  years_of_experience integer CHECK (years_of_experience >= 0),
  biography text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_department ON doctor_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_specialty ON doctor_profiles(specialty);

-- DOCTOR_AVAILABILITY
CREATE TABLE IF NOT EXISTS doctor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_id);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_doctor_profiles_updated_at ON doctor_profiles;
CREATE TRIGGER trg_doctor_profiles_updated_at BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- PROTECT ROLE AND ACCOUNT_STATUS
CREATE OR REPLACE FUNCTION protect_profile_fields()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role text;
BEGIN
  SELECT role INTO current_user_role FROM profiles WHERE id = auth.uid();
  IF current_user_role != 'admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You are not authorized to change user role';
    END IF;
    IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
      RAISE EXCEPTION 'You are not authorized to change account status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE OF role, account_status ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_profile_fields();

-- HELPER FUNCTIONS FOR RLS
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND account_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_doctor()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'doctor' AND account_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_patient()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'patient' AND account_status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ENABLE RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id OR is_admin()
  );

DROP POLICY IF EXISTS "insert_profiles" ON profiles;
CREATE POLICY "insert_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_profiles" ON profiles;
CREATE POLICY "update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (
    auth.uid() = id OR is_admin()
  ) WITH CHECK (
    auth.uid() = id OR is_admin()
  );

DROP POLICY IF EXISTS "delete_profiles" ON profiles;
CREATE POLICY "delete_profiles" ON profiles FOR DELETE
  TO authenticated USING (is_admin());

-- DEPARTMENTS POLICIES
DROP POLICY IF EXISTS "select_departments" ON departments;
CREATE POLICY "select_departments" ON departments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_departments" ON departments;
CREATE POLICY "insert_departments" ON departments FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_departments" ON departments;
CREATE POLICY "update_departments" ON departments FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_departments" ON departments;
CREATE POLICY "delete_departments" ON departments FOR DELETE
  TO authenticated USING (is_admin());

-- DOCTOR_PROFILES POLICIES
DROP POLICY IF EXISTS "select_doctor_profiles" ON doctor_profiles;
CREATE POLICY "select_doctor_profiles" ON doctor_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_doctor_profiles" ON doctor_profiles;
CREATE POLICY "insert_doctor_profiles" ON doctor_profiles FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_doctor_profiles" ON doctor_profiles;
CREATE POLICY "update_doctor_profiles" ON doctor_profiles FOR UPDATE
  TO authenticated USING (
    is_admin() OR auth.uid() = user_id
  ) WITH CHECK (
    is_admin() OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "delete_doctor_profiles" ON doctor_profiles;
CREATE POLICY "delete_doctor_profiles" ON doctor_profiles FOR DELETE
  TO authenticated USING (is_admin());

-- DOCTOR_AVAILABILITY POLICIES
DROP POLICY IF EXISTS "select_doctor_availability" ON doctor_availability;
CREATE POLICY "select_doctor_availability" ON doctor_availability FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_doctor_availability" ON doctor_availability;
CREATE POLICY "insert_doctor_availability" ON doctor_availability FOR INSERT
  TO authenticated WITH CHECK (
    is_admin() OR auth.uid() = doctor_id
  );

DROP POLICY IF EXISTS "update_doctor_availability" ON doctor_availability;
CREATE POLICY "update_doctor_availability" ON doctor_availability FOR UPDATE
  TO authenticated USING (
    is_admin() OR auth.uid() = doctor_id
  ) WITH CHECK (
    is_admin() OR auth.uid() = doctor_id
  );

DROP POLICY IF EXISTS "delete_doctor_availability" ON doctor_availability;
CREATE POLICY "delete_doctor_availability" ON doctor_availability FOR DELETE
  TO authenticated USING (
    is_admin() OR auth.uid() = doctor_id
  );
