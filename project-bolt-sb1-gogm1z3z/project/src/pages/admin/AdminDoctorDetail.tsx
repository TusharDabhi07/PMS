import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, GraduationCap, Stethoscope, Award, Clock, DollarSign, Ban, CheckCircle2, Edit } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { AccountStatusBadge, AppointmentStatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { fetchDoctorById, fetchAppointments, fetchDoctorAvailability, updateAccountStatus } from '@/services/data';
import { formatDate, formatTime, getWeekdayName } from '@/lib/utils';
import type { DoctorProfile, Appointment } from '@/types';

export function AdminDoctorDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<{ weekday: number; start_time: string; end_time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const d = await fetchDoctorById(id);
      if (!d) { setError('Doctor not found'); return; }
      setDoctor(d);
      const [appts, avail] = await Promise.all([
        fetchAppointments({ doctorId: d.user_id, page: 1 }),
        fetchDoctorAvailability(d.user_id),
      ]);
      setAppointments(appts.data);
      setAvailability(avail.map(a => ({ weekday: a.weekday, start_time: a.start_time, end_time: a.end_time })));
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load doctor'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async () => {
    if (!confirmAction || !doctor?.profile) return;
    setActionLoading(true);
    try {
      await updateAccountStatus(doctor.profile.id, confirmAction.status);
      setDoctor({ ...doctor, profile: { ...doctor.profile!, account_status: confirmAction.status as 'active' | 'inactive' | 'suspended' } });
      toast(`Account ${confirmAction.label.toLowerCase()}d successfully.`, 'success');
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to update status', 'error'); }
    finally { setActionLoading(false); setConfirmAction(null); }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!doctor) return null;

  const profile = doctor.profile;

  return (
    <div>
      <PageHeader title={profile?.full_name || 'Doctor'} description={doctor.specialty}
        breadcrumbs={[{ label: 'Doctors', href: '/admin/doctors' }, { label: profile?.full_name || 'Doctor' }]}
        action={<div className="flex gap-2"><Link to={`/admin/doctors/${doctor.id}/edit`}><Button variant="secondary" size="sm"><Edit className="h-4 w-4" />Edit</Button></Link><Link to="/admin/doctors"><Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button></Link></div>} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardBody className="text-center">
            <Avatar name={profile?.full_name || 'Doctor'} src={profile?.avatar_url} size="xl" className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900">{profile?.full_name}</h2>
            <p className="text-sm text-slate-500">{doctor.specialty}</p>
            <div className="mt-2 flex justify-center"><AccountStatusBadge status={profile?.account_status || 'active'} /></div>
            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{profile?.email}</span></div>
              <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{profile?.phone || '—'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Stethoscope className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{doctor.specialty}</span></div>
              <div className="flex items-center gap-3 text-sm"><GraduationCap className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{doctor.qualification}</span></div>
              <div className="flex items-center gap-3 text-sm"><Award className="h-4 w-4 text-slate-400" /><span className="text-slate-600">License: {doctor.license_number}</span></div>
              <div className="flex items-center gap-3 text-sm"><DollarSign className="h-4 w-4 text-slate-400" /><span className="text-slate-600">${doctor.consultation_fee || '—'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Clock className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{doctor.years_of_experience || 0} years experience</span></div>
            </div>
            {doctor.biography && <p className="mt-4 text-sm text-slate-500 text-left border-t border-slate-100 pt-4">{doctor.biography}</p>}
            <div className="mt-6 flex flex-col gap-2">
              {profile?.account_status === 'active' && <Button variant="danger" size="sm" onClick={() => setConfirmAction({ status: 'inactive', label: 'Deactivate' })}><Ban className="h-4 w-4" />Deactivate</Button>}
              {profile?.account_status !== 'active' && <Button variant="success" size="sm" onClick={() => setConfirmAction({ status: 'active', label: 'Activate' })}><CheckCircle2 className="h-4 w-4" />Activate</Button>}
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Weekly Availability</CardTitle></CardHeader>
            <CardBody>
              {availability.length > 0 ? (
                <div className="space-y-2">
                  {availability.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{getWeekdayName(a.weekday)}</span>
                      <span className="text-slate-500">{formatTime(a.start_time)} — {formatTime(a.end_time)}</span>
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="No availability set" description="This doctor has not set their availability schedule." />}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Recent Appointments</CardTitle></CardHeader>
            <CardBody className="p-0">
              {appointments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {appointments.slice(0, 10).map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-5 py-3">
                      <div><p className="text-sm font-medium text-slate-900">{a.patient?.full_name}</p><p className="text-xs text-slate-400">{formatDate(a.appointment_date)} at {formatTime(a.start_time)}</p></div>
                      <AppointmentStatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              ) : <EmptyState title="No appointments" description="No appointments for this doctor." />}
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={handleStatusChange}
        title={`${confirmAction?.label} Account`} message={`Are you sure you want to ${confirmAction?.label?.toLowerCase()} this doctor's account?`} confirmLabel={confirmAction?.label || 'Confirm'} variant={confirmAction?.status === 'active' ? 'success' : 'danger'} loading={actionLoading} />
    </div>
  );
}
