import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, Users, CheckCircle2, ArrowRight, FileText, Pill } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { formatTime } from '@/lib/utils';
import type { Appointment } from '@/types';

export function DoctorDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({ today: 0, upcoming: 0, completed: 0, patients: 0 });

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData } = await supabase.from('appointments').select('*, patient:profiles!appointments_patient_id_fkey(*)').eq('doctor_id', profile.id).eq('appointment_date', today).order('start_time', { ascending: true });
      setTodayAppointments((todayData as Appointment[]) || []);

      const { data: upcomingData } = await supabase.from('appointments').select('*, patient:profiles!appointments_patient_id_fkey(*)').eq('doctor_id', profile.id).gt('appointment_date', today).in('status', ['pending', 'confirmed']).order('appointment_date', { ascending: true }).limit(5);
      setUpcoming((upcomingData as Appointment[]) || []);

      const [completedRes, patientsRes] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', profile.id).eq('status', 'completed'),
        supabase.from('appointments').select('patient_id').eq('doctor_id', profile.id),
      ]);
      const uniquePatients = new Set((patientsRes.data || []).map((a: { patient_id: string }) => a.patient_id));
      setStats({ today: todayAppointments.length, upcoming: (upcomingData || []).length, completed: completedRes.count || 0, patients: uniquePatients.size });
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load dashboard'); }
    finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const statCards = [
    { label: "Today's Appointments", value: todayAppointments.length, icon: <CalendarDays className="h-5 w-5" />, color: 'bg-primary-50 text-primary-600' },
    { label: 'Upcoming', value: upcoming.length, icon: <Clock className="h-5 w-5" />, color: 'bg-warning-50 text-warning-600' },
    { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-success-50 text-success-600' },
    { label: 'My Patients', value: stats.patients, icon: <Users className="h-5 w-5" />, color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <div>
      <PageHeader title={`Welcome, Dr. ${profile?.full_name.split(' ').pop()}`} description="Your schedule and patient overview" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label}><CardBody>
            <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </CardBody></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <Link to="/doctor/appointments" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </CardHeader>
          <CardBody className="p-0">
            {todayAppointments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {todayAppointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.patient?.full_name || 'P'} size="sm" />
                      <div><p className="text-sm font-medium text-slate-900">{a.patient?.full_name}</p><p className="text-xs text-slate-400">{formatTime(a.start_time)} — {a.reason_for_visit}</p></div>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No appointments today" description="Your schedule is clear for today." />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Consultations</CardTitle>
            <Link to="/doctor/appointments" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
          </CardHeader>
          <CardBody className="p-0">
            {upcoming.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.patient?.full_name || 'P'} size="sm" />
                      <div><p className="text-sm font-medium text-slate-900">{a.patient?.full_name}</p><p className="text-xs text-slate-400">{formatDate(a.appointment_date)} at {formatTime(a.start_time)}</p></div>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No upcoming appointments" description="Upcoming consultations will appear here." />}
          </CardBody>
        </Card>
      </div>
      <div className="mt-6 flex gap-3">
        <Link to="/doctor/medical-records"><Button variant="secondary"><FileText className="h-4 w-4" />Medical Records</Button></Link>
        <Link to="/doctor/prescriptions"><Button variant="secondary"><Pill className="h-4 w-4" />Prescriptions</Button></Link>
      </div>
    </div>
  );
}
