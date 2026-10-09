import { useState, useEffect, useCallback } from 'react';
import { FileText, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { fetchMedicalRecords, createMedicalRecord } from '@/services/data';
import { formatDate } from '@/lib/utils';
import type { MedicalRecord, Appointment } from '@/types';

export function DoctorMedicalRecords() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<MedicalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [form, setForm] = useState({ patient_id: '', appointment_id: '', diagnosis: '', symptoms: '', treatment_plan: '', clinical_notes: '', record_date: new Date().toISOString().split('T')[0] });

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetchMedicalRecords({ doctorId: profile.id, page });
      setData(r.data); setTotal(r.total);
      const { data: appts } = await supabase.from('appointments').select('*, patient:profiles!appointments_patient_id_fkey(*)').eq('doctor_id', profile.id).in('status', ['confirmed', 'completed']).order('appointment_date', { ascending: false }).limit(50);
      setMyAppointments((appts as Appointment[]) || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id, page]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!profile?.id || !form.patient_id || !form.diagnosis) { toast('Patient and diagnosis are required.', 'error'); return; }
    setSaving(true);
    try {
      await createMedicalRecord({
        patient_id: form.patient_id,
        doctor_id: profile.id,
        appointment_id: form.appointment_id || undefined,
        diagnosis: form.diagnosis,
        symptoms: form.symptoms || undefined,
        treatment_plan: form.treatment_plan || undefined,
        clinical_notes: form.clinical_notes || undefined,
        record_date: form.record_date,
      });
      toast('Medical record created.', 'success');
      setModalOpen(false);
      setForm({ patient_id: '', appointment_id: '', diagnosis: '', symptoms: '', treatment_plan: '', clinical_notes: '', record_date: new Date().toISOString().split('T')[0] });
      load();
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to create record', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Medical Records" description="Create and view patient medical records" action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" />New Record</Button>} />
      <Card>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<FileText className="h-12 w-12" />} title="No medical records" description="Create a record for a patient under your care." action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" />New Record</Button>} /> :
         <>
           <div className="divide-y divide-slate-100">
             {data.map((r) => (
               <div key={r.id} className="px-5 py-4">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2"><Avatar name={r.patient?.full_name || 'P'} size="sm" /><div><p className="text-sm font-medium text-slate-900">{r.patient?.full_name}</p><p className="text-xs text-slate-400">{formatDate(r.record_date)}</p></div></div>
                 </div>
                 <p className="text-sm text-slate-700"><strong>Diagnosis:</strong> {r.diagnosis}</p>
                 {r.symptoms && <p className="text-sm text-slate-600 mt-1"><strong>Symptoms:</strong> {r.symptoms}</p>}
                 {r.treatment_plan && <p className="text-sm text-slate-600 mt-1"><strong>Treatment:</strong> {r.treatment_plan}</p>}
                 {r.clinical_notes && <p className="text-sm text-slate-600 mt-1"><strong>Notes:</strong> {r.clinical_notes}</p>}
               </div>
             ))}
           </div>
           <Pagination page={page} total={total} pageSize={10} onPageChange={setPage} />
         </>}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Medical Record" size="lg">
        <div className="space-y-4">
          <Select label="Select Appointment / Patient" value={form.appointment_id} onChange={(e) => {
            const appt = myAppointments.find(a => a.id === e.target.value);
            setForm({ ...form, appointment_id: e.target.value, patient_id: appt?.patient_id || '' });
          }}>
            <option value="">Select an appointment...</option>
            {myAppointments.map((a) => <option key={a.id} value={a.id}>{a.patient?.full_name} — {formatDate(a.appointment_date)}</option>)}
          </Select>
          <Input label="Patient" value={form.patient_id ? myAppointments.find(a => a.id === form.appointment_id)?.patient?.full_name || 'Selected' : ''} disabled hint="Patient is auto-selected from appointment" />
          <Input label="Diagnosis" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Primary diagnosis" />
          <Textarea label="Symptoms" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} placeholder="Reported symptoms" />
          <Textarea label="Treatment Plan" value={form.treatment_plan} onChange={(e) => setForm({ ...form, treatment_plan: e.target.value })} placeholder="Recommended treatment" />
          <Textarea label="Clinical Notes" value={form.clinical_notes} onChange={(e) => setForm({ ...form, clinical_notes: e.target.value })} placeholder="Additional clinical notes" />
          <Input label="Record Date" type="date" value={form.record_date} onChange={(e) => setForm({ ...form, record_date: e.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Create Record</Button></div>
        </div>
      </Modal>
    </div>
  );
}
