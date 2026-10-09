import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { SearchBar } from '@/components/ui/SearchBar';
import { Avatar } from '@/components/ui/Avatar';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { fetchAppointments, updateAppointmentStatus } from '@/services/data';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment } from '@/types';

export function PatientAppointments() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetchAppointments({ page, search, status, patientId: profile.id });
      setData(r.data); setTotal(r.total);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id, page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try { await updateAppointmentStatus(cancelTarget.id, 'cancelled'); setData((prev) => prev.map((a) => a.id === cancelTarget.id ? { ...a, status: 'cancelled' as Appointment['status'] } : a)); toast('Appointment cancelled.', 'success'); }
    catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); }
    finally { setCancelling(false); setCancelTarget(null); }
  };

  return (
    <div>
      <PageHeader title="My Appointments" description="View and manage your appointments" />
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by reason..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option value="all">All Status</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No Show</option>
          </Select>
        </div>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<CalendarDays className="h-12 w-12" />} title="No appointments" description="Book an appointment to get started." /> :
         <>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Doctor</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Time</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th><th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th></tr></thead>
               <tbody className="divide-y divide-slate-100">
                 {data.map((a) => (
                   <tr key={a.id} className="hover:bg-slate-50">
                     <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar name={a.doctor?.full_name || 'Dr'} size="sm" /><span className="text-sm font-medium text-slate-900">{a.doctor?.full_name}</span></div></td>
                     <td className="px-5 py-3 text-sm text-slate-600">{formatDate(a.appointment_date)}</td>
                     <td className="px-5 py-3 text-sm text-slate-600">{formatTime(a.start_time)}</td>
                     <td className="px-5 py-3 text-sm text-slate-600 capitalize">{a.appointment_type.replace('_', ' ')}</td>
                     <td className="px-5 py-3"><AppointmentStatusBadge status={a.status} /></td>
                     <td className="px-5 py-3 text-right">
                       {(a.status === 'pending' || a.status === 'confirmed') && <Button size="sm" variant="danger" onClick={() => setCancelTarget(a)}><XCircle className="h-3.5 w-3.5" />Cancel</Button>}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <Pagination page={page} total={total} pageSize={10} onPageChange={setPage} />
         </>}
      </Card>
      <ConfirmDialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} title="Cancel Appointment" message="Are you sure you want to cancel this appointment?" confirmLabel="Cancel Appointment" variant="danger" loading={cancelling} />
    </div>
  );
}
