import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, CalendarX } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { SearchBar } from '@/components/ui/SearchBar';
import { Avatar } from '@/components/ui/Avatar';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { fetchAppointments, updateAppointmentStatus } from '@/services/data';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment } from '@/types';

export function DoctorAppointments() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetchAppointments({ page, search, status, doctorId: profile.id });
      setData(r.data); setTotal(r.total);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id, page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateAppointmentStatus(id, newStatus);
      setData((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus as Appointment['status'] } : a));
      toast(`Appointment marked as ${newStatus}.`, 'success');
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed', 'error'); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <PageHeader title="My Appointments" description="Manage your patient appointments" />
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by reason..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option value="all">All Status</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No Show</option>
          </Select>
        </div>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<CalendarX className="h-12 w-12" />} title="No appointments" description="Your appointments will appear here." /> :
         <>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50">
                 <tr><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Patient</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Time</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th><th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th></tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {data.map((a) => (
                   <tr key={a.id} className="hover:bg-slate-50">
                     <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar name={a.patient?.full_name || 'P'} size="sm" /><span className="text-sm font-medium text-slate-900">{a.patient?.full_name}</span></div></td>
                     <td className="px-5 py-3 text-sm text-slate-600">{formatDate(a.appointment_date)}</td>
                     <td className="px-5 py-3 text-sm text-slate-600">{formatTime(a.start_time)}</td>
                     <td className="px-5 py-3 text-sm text-slate-600 max-w-xs truncate">{a.reason_for_visit}</td>
                     <td className="px-5 py-3"><AppointmentStatusBadge status={a.status} /></td>
                     <td className="px-5 py-3"><div className="flex items-center justify-end gap-1">
                       {a.status === 'pending' && <Button size="sm" variant="success" onClick={() => handleStatusUpdate(a.id, 'confirmed')} loading={actionLoading === a.id}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                       {a.status === 'confirmed' && <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(a.id, 'completed')} loading={actionLoading === a.id}>Complete</Button>}
                       {(a.status === 'pending' || a.status === 'confirmed') && <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(a.id, 'cancelled')} loading={actionLoading === a.id}><XCircle className="h-3.5 w-3.5" /></Button>}
                       {a.status === 'confirmed' && <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(a.id, 'no_show')} loading={actionLoading === a.id}><Clock className="h-3.5 w-3.5" /></Button>}
                     </div></td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           <Pagination page={page} total={total} pageSize={10} onPageChange={setPage} />
         </>}
      </Card>
    </div>
  );
}
