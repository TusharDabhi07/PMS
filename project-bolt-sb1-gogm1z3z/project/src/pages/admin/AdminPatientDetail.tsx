import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, User, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { AppointmentStatusBadge, AccountStatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { fetchPatientById, fetchAppointments, fetchMedicalRecords, fetchPrescriptions, updateAccountStatus } from '@/services/data';
import { formatDate, formatTime, calculateAge } from '@/lib/utils';
import type { Profile, Appointment, MedicalRecord, Prescription } from '@/types';

export function AdminPatientDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [patient, setPatient] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'appointments' | 'records' | 'prescriptions'>('appointments');
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(null);
    try {
      const p = await fetchPatientById(id);
      if (!p) { setError('Patient not found'); return; }
      setPatient(p);
      const [appts, recs, prescs] = await Promise.all([
        fetchAppointments({ patientId: id, page: 1 }),
        fetchMedicalRecords({ patientId: id, page: 1 }),
        fetchPrescriptions({ patientId: id, page: 1 }),
      ]);
      setAppointments(appts.data); setRecords(recs.data); setPrescriptions(prescs.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async () => {
    if (!confirmAction || !patient) return;
    setActionLoading(true);
    try {
      await updateAccountStatus(patient.id, confirmAction.status);
      setPatient({ ...patient, account_status: confirmAction.status as Profile['account_status'] });
      toast(`Account ${confirmAction.label.toLowerCase()}d successfully.`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update account status', 'error');
    } finally { setActionLoading(false); setConfirmAction(null); }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!patient) return null;

  return (
    <div>
      <PageHeader
        title={patient.full_name}
        description="Patient profile and history"
        breadcrumbs={[{ label: 'Patients', href: '/admin/patients' }, { label: patient.full_name }]}
        action={<Link to="/admin/patients"><Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button></Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1">
          <CardBody className="text-center">
            <Avatar name={patient.full_name} src={patient.avatar_url} size="xl" className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900">{patient.full_name}</h2>
            <div className="mt-2 flex justify-center"><AccountStatusBadge status={patient.account_status} /></div>
            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{patient.email}</span></div>
              <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{patient.phone || '—'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Calendar className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{formatDate(patient.date_of_birth)} ({calculateAge(patient.date_of_birth)})</span></div>
              <div className="flex items-center gap-3 text-sm"><User className="h-4 w-4 text-slate-400" /><span className="text-slate-600 capitalize">{patient.gender || '—'}</span></div>
              <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{patient.address || '—'}</span></div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {patient.account_status === 'active' && <Button variant="danger" size="sm" onClick={() => setConfirmAction({ status: 'inactive', label: 'Deactivate' })}><Ban className="h-4 w-4" />Deactivate Account</Button>}
              {patient.account_status === 'active' && <Button variant="secondary" size="sm" onClick={() => setConfirmAction({ status: 'suspended', label: 'Suspend' })}><AlertTriangle className="h-4 w-4" />Suspend Account</Button>}
              {patient.account_status !== 'active' && <Button variant="success" size="sm" onClick={() => setConfirmAction({ status: 'active', label: 'Activate' })}><CheckCircle2 className="h-4 w-4" />Activate Account</Button>}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex border-b border-slate-200">
            {(['appointments', 'records', 'prescriptions'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {t.charAt(0).toUpperCase() + t.slice(1)} ({t === 'appointments' ? appointments.length : t === 'records' ? records.length : prescriptions.length})
              </button>
            ))}
          </div>
          <CardBody className="p-0">
            {tab === 'appointments' && (appointments.length === 0 ? <EmptyState title="No appointments" description="This patient has no appointments yet." /> :
              <div className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3">
                    <div><p className="text-sm font-medium text-slate-900">{formatDate(a.appointment_date)} at {formatTime(a.start_time)}</p><p className="text-xs text-slate-400">{a.reason_for_visit}</p></div>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                ))}
              </div>)}
            {tab === 'records' && (records.length === 0 ? <EmptyState title="No medical records" description="No medical records for this patient." /> :
              <div className="divide-y divide-slate-100">
                {records.map((r) => (
                  <div key={r.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-slate-900">{r.diagnosis}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.record_date)} • {r.doctor?.full_name || 'Doctor'}</p>
                  </div>
                ))}
              </div>)}
            {tab === 'prescriptions' && (prescriptions.length === 0 ? <EmptyState title="No prescriptions" description="No prescriptions for this patient." /> :
              <div className="divide-y divide-slate-100">
                {prescriptions.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div><p className="text-sm font-medium text-slate-900">{p.medication_name} — {p.dosage}</p><p className="text-xs text-slate-400">{formatDate(p.prescribed_date)} • {p.frequency}</p></div>
                  </div>
                ))}
              </div>)}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog open={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={handleStatusChange}
        title={`${confirmAction?.label} Account`} message={`Are you sure you want to ${confirmAction?.label.toLowerCase()} ${patient.full_name}'s account?`} confirmLabel={confirmAction?.label || 'Confirm'} variant={confirmAction?.status === 'active' ? 'success' : 'danger'} loading={actionLoading} />
    </div>
  );
}


