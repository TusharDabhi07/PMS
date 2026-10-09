import { useState, useEffect, useCallback } from 'react';
import { Pill } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { PrescriptionStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { fetchPrescriptions } from '@/services/data';
import { formatDate } from '@/lib/utils';
import type { Prescription } from '@/types';

export function PatientPrescriptions() {
  const { profile } = useAuth();
  const [data, setData] = useState<Prescription[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetchPrescriptions({ patientId: profile.id, page });
      setData(r.data); setTotal(r.total);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="My Prescriptions" description="View your prescribed medications" />
      <Card>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<Pill className="h-12 w-12" />} title="No prescriptions" description="Your prescriptions will appear here after your consultations." /> :
         <>
           <div className="divide-y divide-slate-100">
             {data.map((p) => (
               <div key={p.id} className="px-5 py-4">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-3">
                     <Avatar name={p.doctor?.full_name || 'Dr'} size="sm" />
                     <div><p className="text-sm font-medium text-slate-900">{p.doctor?.full_name}</p><p className="text-xs text-slate-400">{formatDate(p.prescribed_date)}</p></div>
                   </div>
                   <PrescriptionStatusBadge status={p.status} />
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
    </div>
  );
}
