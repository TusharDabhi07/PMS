import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { AccountStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { calculateAge } from '@/lib/utils';
import type { Profile } from '@/types';

export function DoctorPatients() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const { data } = await supabase.from('appointments').select('patient:profiles!appointments_patient_id_fkey(*)').eq('doctor_id', profile.id);
      const uniquePatients = new Map<string, Profile>();
      (data || []).forEach((a: { patient: Profile | Profile[] }) => { const p = Array.isArray(a.patient) ? a.patient[0] : a.patient; if (p) uniquePatients.set(p.id, p); });
      const all = [...uniquePatients.values()];
      setTotal(all.length);
      setPatients(all.slice((page - 1) * 10, page * 10));
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="My Patients" description="Patients under your care" />
      <Card>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={load} /> :
         patients.length === 0 ? <EmptyState icon={<Users className="h-12 w-12" />} title="No patients yet" description="Patients will appear here once you have appointments." /> :
         <>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Age</th><th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th><th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th></tr></thead>
               <tbody className="divide-y divide-slate-100">
                 {patients.map((p) => (
                   <tr key={p.id} className="hover:bg-slate-50">
                     <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar name={p.full_name} size="sm" /><span className="text-sm font-medium text-slate-900">{p.full_name}</span></div></td>
                     <td className="px-5 py-3 text-sm text-slate-600">{p.email}</td>
                     <td className="px-5 py-3 text-sm text-slate-600">{calculateAge(p.date_of_birth)}</td>
                     <td className="px-5 py-3"><AccountStatusBadge status={p.account_status} /></td>
                     <td className="px-5 py-3 text-right">{/* Doctor can view patient info inline */}<span className="text-sm text-slate-400">Under your care</span></td>
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
