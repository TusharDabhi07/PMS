import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, CalendarX } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AppointmentStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { fetchAppointments, fetchDoctors, updateAppointmentStatus } from '@/services/data';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment, DoctorProfile } from '@/types';

export function AdminAppointments() {
  const { toast } = useToast();
  const [data, setData] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [doctorId, setDoctorId] = useState('all');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [result, docs] = await Promise.all([
        fetchAppointments({ page, search, status, doctorId, date }),
        fetchDoctors({ page: 1 }),
      ]);
      setData(result.data); setTotal(result.total); setDoctors(docs.data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load appointments'); }
    finally { setLoading(false); }
  }, [page, search, status, doctorId, date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status, doctorId, date]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateAppointmentStatus(id, newStatus);
      setData((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus as Appointment['status'] } : a));
      toast(`Appointment ${newStatus}.`, 'success');
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to update appointment', 'error'); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <PageHeader title="Appointments" description="Manage all hospital appointments" />
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-200 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by reason..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </Select>
          <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="sm:w-48">
            <option value="all">All Doctors</option>
            {doctors.map((d) => <option key={d.id} value={d.user_id}>{d.profile?.full_name}</option>)}
          </Select>
          <input type="date" className="input sm:w-44" value={date} onChange={(e) => setDate(e.target.value)} />
          {(search || status !== 'all' || doctorId !== 'all' || date) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus('all'); setDoctorId('all'); setDate(''); }}>Clear</Button>
          )}
        </div>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<CalendarX className="h-12 w-12" />} title="No appointments found" description="Appointments will appear here once booked." /> :
         <>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50">
                 <tr>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Patient</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Doctor</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Time</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                   <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {data.map((a) => (
                   <tr key={a.id} className="hover:bg-slate-50">
                     <td className="px-5 py-3">
                       <div className="flex items-center gap-2"><Avatar name={a.patient?.full_name || 'P'} size="sm" /><span className="text-sm font-medium text-slate-900">{a.patient?.full_name}</span></div>
                     </td>
                     <td className="px-5 py-3 text-sm text-slate-600">{a.doctor?.full_name}</td>
                     <td className="px-5 py-3 text-sm text-slate-600">{formatDate(a.appointment_date)}</td>
                     <td className="px-5 py-3 text-sm text-slate-600">{formatTime(a.start_time)}</td>
                     <td className="px-5 py-3 text-sm text-slate-600 capitalize">{a.appointment_type.replace('_', ' ')}</td>
                     <td className="px-5 py-3"><AppointmentStatusBadge status={a.status} /></td>
                     <td className="px-5 py-3">
                       <div className="flex items-center justify-end gap-1">
                         {a.status === 'pending' && <Button size="sm" variant="success" onClick={() => handleStatusUpdate(a.id, 'confirmed')} loading={actionLoading === a.id}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                         {(a.status === 'pending' || a.status === 'confirmed') && <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(a.id, 'completed')} loading={actionLoading === a.id}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                         {(a.status === 'pending' || a.status === 'confirmed') && <Button size="sm" variant="danger" onClick={() => handleStatusUpdate(a.id, 'cancelled')} loading={actionLoading === a.id}><XCircle className="h-3.5 w-3.5" /></Button>}
                         {a.status === 'confirmed' && <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(a.id, 'no_show')} loading={actionLoading === a.id}><Clock className="h-3.5 w-3.5" /></Button>}
                       </div>
                     </td>
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
