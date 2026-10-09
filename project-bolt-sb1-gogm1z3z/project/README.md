# MediCare — Patient Management System

A full-stack hospital/clinic management application built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Features

### Authentication & Roles
- Email/password sign-up and sign-in via Supabase Auth
- Three roles: **Admin**, **Doctor**, **Patient**
- Auto-profile creation on sign-up via database trigger
- Role-based route guards and navigation
- Account status management (active / inactive / suspended)

### Admin Dashboard
- Overview stats (patients, doctors, appointments, revenue)
- Charts: appointments trend, status distribution, department distribution, user growth
- Patient directory with search, filter, sort, and pagination
- Patient detail view with appointments, medical records, and prescriptions
- Doctor directory with department filter
- Doctor detail view with availability and appointments
- Add/edit doctors (creates auth user, assigns doctor role, creates doctor profile)
- Appointment management with status updates
- Department CRUD
- Reports with date range filtering and CSV export
- Activity logs

### Doctor Dashboard
- Overview stats (today's appointments, total patients, pending, completed)
- Appointment management with confirm/complete/cancel actions
- Patient list
- Medical records creation and viewing
- Prescription writing
- Availability schedule management

### Patient Dashboard
- Overview stats (upcoming appointments, past appointments, prescriptions)
- Appointment booking via 4-step wizard (department → doctor → date/time → details)
- Appointment list with cancel option
- Medical records viewing
- Prescriptions viewing

### Shared Features
- Notification center with mark-as-read
- Profile editing with password change
- Responsive sidebar navigation with mobile drawer
- Toast notifications
- Loading, error, and empty states throughout

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS with custom medical-themed color palette
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Icons:** Lucide React
- **Routing:** React Router v7

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Setup

The Supabase migrations are in `supabase/migrations/`. They create:

- `profiles` — user profiles with role and account status
- `departments` — hospital departments
- `doctor_profiles` — doctor-specific data (specialty, license, fees)
- `doctor_availability` — weekly availability schedules
- `appointments` — appointment bookings with double-booking prevention
- `medical_records` — electronic health records
- `prescriptions` — medication prescriptions
- `notifications` — user notifications
- `activity_logs` — audit trail

All tables have Row Level Security (RLS) enabled with role-based policies.

### Running the App

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Usage

### Creating the First Admin

1. Sign up with any email on the registration page — this creates a patient account.
2. In the Supabase dashboard, open the SQL editor and run:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Sign out and sign back in. You'll now have admin access.

### Adding Doctors

1. Sign in as admin.
2. Go to Doctors → Add Doctor.
3. Fill in the doctor's details. The system creates an auth account, assigns the doctor role, and creates the doctor profile.

### Booking Appointments (Patient)

1. Sign in as a patient.
2. Click "Book Appointment".
3. Select a department, then a doctor, then a date/time slot, then enter the reason.
4. The system checks for slot availability and prevents double-booking.

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components (Button, Input, Card, Modal, etc.)
│   └── layout/       # AppLayout, ProtectedRoute, RoleRoute
├── hooks/
│   └── useAuth.tsx   # Auth context provider
├── lib/
│   ├── supabase.ts   # Supabase client
│   ├── utils.ts      # Utility functions
│   ├── errors.ts     # Error message mapping
│   └── validation.ts # Zod schemas
├── pages/
│   ├── auth/         # Login, Register, Forgot/Reset Password
│   ├── admin/        # Admin dashboard and management pages
│   ├── doctor/       # Doctor dashboard and pages
│   ├── patient/      # Patient dashboard and pages
│   └── shared/       # Notifications, Profile
├── services/
│   └── data.ts       # Data access functions
├── types/
│   └── index.ts      # TypeScript interfaces
└── App.tsx           # Routing
```

## License

MIT
