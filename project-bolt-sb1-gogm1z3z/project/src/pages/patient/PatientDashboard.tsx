import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, FileText, Pill, Plus, ArrowRight, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment, Prescription, MedicalRecord, Notification } from '@/types';

export function PatientDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [upcRes, pastRes, presRes, recRes, notifRes] = await Promise.all([
        supabase.from('appointments').select('*, doctor:profiles!appointments_doctor_id_fkey(*)').eq('patient_id', profile.id).gte('appointment_date', today).in('status', ['pending', 'confirmed']).order('appointment_date', { ascending: true }).limit(5),
        supabase.from('appointments').select('*, doctor:profiles!appointments_doctor_id_fkey(*)').eq('patient_id', profile.id).lt('appointment_date', today).order('appointment_date', { ascending: false }).limit(5),
        supabase.from('prescriptions').select('*, doctor:profiles!prescriptions_doctor_id_fkey(*)').eq('patient_id', profile.id).order('prescribed_date', { ascending: false }).limit(3),
        supabase.from('medical_records').select('*, doctor:profiles!medical_records_doctor_id_fkey(*)').eq('patient_id', profile.id).order('record_date', { ascending: false }).limit(3),
        supabase.from('notifications').select('*').eq('user_id', profile.id).eq('is_read', false).order('created_at', { ascending: false }).limit(3),
      ]);
      setUpcoming((upcRes.data as Appointment[]) || []);
      setPast((pastRes.data as Appointment[]) || []);
      setPrescriptions((presRes.data as Prescription[]) || []);
      setRecords((recRes.data as MedicalRecord[]) || []);
      setNotifications((notifRes.data as Notification[]) || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const stats = [
    { label: 'Upcoming', value: upcoming.length, icon: <CalendarDays className="h-5 w-5" />, color: 'bg-primary-50 text-primary-600' },
    { label: 'Past Visits', value: past.length, icon: <Clock className="h-5 w-5" />, color: 'bg-teal-50 text-teal-600' },
    { label: 'Prescriptions', value: prescriptions.length, icon: <Pill className="h-5 w-5" />, color: 'bg-success-50 text-success-600' },
    { label: 'Records', value: records.length, icon: <FileText className="h-5 w-5" />, color: 'bg-warning-50 text-warning-600' },
  ];

  return (
    <div>
      <PageHeader title={`Welcome, ${profile?.full_name.split(' ')[0]}`} description="Your health overview and upcoming appointments"
        action={<Link to="/patient/book-appointment"><Button size="sm"><Plus className="h-4 w-4" />Book Appointment</Button></Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}><CardBody>
            <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </CardBody></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Upcoming Appointments</CardTitle><Link to="/patient/appointments" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link></CardHeader>
          <CardBody className="p-0">
            {upcoming.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcoming.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3"><Avatar name={a.doctor?.full_name || 'Dr'} size="sm" /><div><p className="text-sm font-medium text-slate-900">{a.doctor?.full_name}</p><p className="text-xs text-slate-400">{formatDate(a.appointment_date)} at {formatTime(a.start_time)}</p></div></div>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            ) : <EmptyState title="No upcoming appointments" description="Book an appointment to see it here." action={<Link to="/patient/book-appointment"><Button size="sm">Book Now</Button></Link>} />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Prescriptions</CardTitle><Link to="/patient/prescriptions" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link></CardHeader>
          <CardBody className="p-0">
            {prescriptions.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {prescriptions.map((p) => (
                  <div key={p.id} className="px-5 py-3"><p className="text-sm font-medium text-slate-900">{p.medication_name} — {p.dosage}</p><p className="text-xs text-slate-400">{p.doctor?.full_name} • {formatDate(p.prescribed_date)}</p></div>
                ))}
              </div>
            ) : <EmptyState title="No prescriptions" description="Your prescriptions will appear here." />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Medical Records</CardTitle><Link to="/patient/medical-records" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link></CardHeader>
          <CardBody className="p-0">
            {records.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {records.map((r) => (
                  <div key={r.id} className="px-5 py-3"><p className="text-sm font-medium text-slate-900">{r.diagnosis}</p><p className="text-xs text-slate-400">{r.doctor?.full_name} • {formatDate(r.record_date)}</p></div>
                ))}
              </div>
            ) : <EmptyState title="No medical records" description="Your records will appear here." />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle><Link to="/patient/notifications" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">View all <ArrowRight className="h-3.5 w-3.5" /></Link></CardHeader>
          <CardBody className="p-0">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="px-5 py-3"><p className="text-sm font-medium text-slate-900">{n.title}</p><p className="text-xs text-slate-400">{n.message}</p></div>
                ))}
              </div>
            ) : <EmptyState icon={<Bell className="h-10 w-10" />} title="No new notifications" description="You're all caught up!" />}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
