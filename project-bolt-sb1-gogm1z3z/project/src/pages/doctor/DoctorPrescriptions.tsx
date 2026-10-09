import { useState, useEffect, useCallback } from 'react';
import { Pill, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { PrescriptionStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { fetchPrescriptions, createPrescription, updatePrescriptionStatus } from '@/services/data';
import { formatDate } from '@/lib/utils';
import type { Prescription, Appointment } from '@/types';

export function DoctorPrescriptions() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Prescription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [form, setForm] = useState({ appointment_id: '', patient_id: '', medication_name: '', dosage: '', frequency: '', duration: '', instructions: '', prescribed_date: new Date().toISOString().split('T')[0] });

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetchPrescriptions({ doctorId: profile.id, page });
      setData(r.data); setTotal(r.total);
      const { data: appts } = await supabase.from('appointments').select('*, patient:profiles!appointments_patient_id_fkey(*)').eq('doctor_id', profile.id).in('status', ['confirmed', 'completed']).order('appointment_date', { ascending: false }).limit(50);
      setMyAppointments((appts as Appointment[]) || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id, page]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!profile?.id || !form.patient_id || !form.medication_name || !form.dosage || !form.frequency || !form.duration) { toast('Please fill all required fields.', 'error'); return; }
    setSaving(true);
    try {
      await createPrescription({
        patient_id: form.patient_id, doctor_id: profile.id,
        appointment_id: form.appointment_id || undefined,
        medication_name: form.medication_name, dosage: form.dosage,
        frequency: form.frequency, duration: form.duration,
        instructions: form.instructions || undefined, prescribed_date: form.prescribed_date,
      });
      toast('Prescription created.', 'success');
      setModalOpen(false);
      setForm({ appointment_id: '', patient_id: '', medication_name: '', dosage: '', frequency: '', duration: '', instructions: '', prescribed_date: new Date().toISOString().split('T')[0] });
      load();
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await updatePrescriptionStatus(id, status); setData((prev) => prev.map((p) => p.id === id ? { ...p, status: status as Prescription['status'] } : p)); toast('Prescription status updated.', 'success'); }
    catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  return (
    <div>
      <PageHeader title="Prescriptions" description="Manage patient prescriptions" action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" />New Prescription</Button>} />
      <Card>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<Pill className="h-12 w-12" />} title="No prescriptions" description="Create a prescription for a patient under your care." action={<Button size="sm" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" />New Prescription</Button>} /> :
         <>
           <div className="divide-y divide-slate-100">
             {data.map((p) => (
               <div key={p.id} className="px-5 py-4">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2"><Avatar name={p.patient?.full_name || 'P'} size="sm" /><div><p className="text-sm font-medium text-slate-900">{p.patient?.full_name}</p><p className="text-xs text-slate-400">{formatDate(p.prescribed_date)}</p></div></div>
                   <div className="flex items-center gap-2"><PrescriptionStatusBadge status={p.status} />
                     <Select value={p.status} onChange={(e) => handleStatusChange(p.id, e.target.value)} className="text-xs py-1 w-36"><option value="active">Active</option><option value="discontinued">Discontinue</option><option value="completed">Complete</option></Select>
                   </div>
                 </div>
                 <p className="text-sm text-slate-700"><strong>{p.medication_name}</strong> — {p.dosage}</p>
                 <p className="text-sm text-slate-600 mt-1">{p.frequency} for {p.duration}</p>
                 {p.instructions && <p className="text-sm text-slate-500 mt-1">Instructions: {p.instructions}</p>}
               </div>
             ))}
           </div>
           <Pagination page={page} total={total} pageSize={10} onPageChange={setPage} />
         </>}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Prescription" size="lg">
        <div className="space-y-4">
          <Select label="Select Appointment / Patient" value={form.appointment_id} onChange={(e) => {
            const appt = myAppointments.find(a => a.id === e.target.value);
            setForm({ ...form, appointment_id: e.target.value, patient_id: appt?.patient_id || '' });
          }}>
            <option value="">Select an appointment...</option>
            {myAppointments.map((a) => <option key={a.id} value={a.id}>{a.patient?.full_name} — {formatDate(a.appointment_date)}</option>)}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Medication Name" value={form.medication_name} onChange={(e) => setForm({ ...form, medication_name: e.target.value })} placeholder="e.g. Amoxicillin" />
            <Input label="Dosage" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 500mg" />
            <Input label="Frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="e.g. 3 times daily" />
            <Input label="Duration" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 7 days" />
          </div>
          <Textarea label="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Special instructions for the patient" />
          <Input label="Prescribed Date" type="date" value={form.prescribed_date} onChange={(e) => setForm({ ...form, prescribed_date: e.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Create Prescription</Button></div>
        </div>
      </Modal>
    </div>
  );
}
