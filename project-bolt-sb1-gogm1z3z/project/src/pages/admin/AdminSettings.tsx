import { useEffect, useState } from 'react';
import { Users, UserCog, Building2, CalendarDays, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/EmptyState';

export function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ patients: 0, doctors: 0, departments: 0, appointments: 0 });

  useEffect(() => {
    (async () => {
      const [p, d, dep, a] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
      ]);
      setCounts({ patients: p.count || 0, doctors: d.count || 0, departments: dep.count || 0, appointments: a.count || 0 });
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  const cards = [
    { label: 'Total Patients', value: counts.patients, icon: <Users className="h-5 w-5" />, color: 'bg-primary-50 text-primary-600' },
    { label: 'Total Doctors', value: counts.doctors, icon: <UserCog className="h-5 w-5" />, color: 'bg-teal-50 text-teal-600' },
    { label: 'Departments', value: counts.departments, icon: <Building2 className="h-5 w-5" />, color: 'bg-warning-50 text-warning-600' },
    { label: 'Appointments', value: counts.appointments, icon: <CalendarDays className="h-5 w-5" />, color: 'bg-success-50 text-success-600' },
  ];

  return (
    <div>
      <PageHeader title="Settings" description="System configuration and overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}><CardBody>
            <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${c.color} mb-3`}>{c.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.label}</p>
          </CardBody></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle><span className="flex items-center gap-2"><Info className="h-5 w-5 text-slate-400" />System Information</span></CardTitle></CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><dt className="text-sm text-slate-500">Application Name</dt><dd className="text-sm font-medium text-slate-900">MediCare Patient Management System</dd></div>
            <div><dt className="text-sm text-slate-500">Version</dt><dd className="text-sm font-medium text-slate-900">1.0.0</dd></div>
            <div><dt className="text-sm text-slate-500">Backend</dt><dd className="text-sm font-medium text-slate-900">Supabase (PostgreSQL)</dd></div>
            <div><dt className="text-sm text-slate-500">Authentication</dt><dd className="text-sm font-medium text-slate-900">Supabase Auth (Email/Password)</dd></div>
          </dl>
          <div className="mt-4 p-4 bg-warning-50 rounded-lg border border-warning-200">
            <p className="text-sm text-warning-700"><strong>Note:</strong> This application is not HIPAA-compliant by default. Additional security, legal, and operational measures are required before using with real patient data.</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
