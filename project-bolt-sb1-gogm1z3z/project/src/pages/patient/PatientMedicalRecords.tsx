import { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { fetchMedicalRecords } from '@/services/data';
import { formatDate } from '@/lib/utils';
import type { MedicalRecord } from '@/types';

export function PatientMedicalRecords() {
  const { profile } = useAuth();
  const [data, setData] = useState<MedicalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const r = await fetchMedicalRecords({ patientId: profile.id, page });
      setData(r.data); setTotal(r.total);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="My Medical Records" description="View your medical history and diagnoses" />
      <Card>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<FileText className="h-12 w-12" />} title="No medical records" description="Your medical records will appear here after your consultations." /> :
         <>
           <div className="divide-y divide-slate-100">
             {data.map((r) => (
               <div key={r.id} className="px-5 py-4">
                 <div className="flex items-center gap-3 mb-2">
                   <Avatar name={r.doctor?.full_name || 'Dr'} size="sm" />
                   <div><p className="text-sm font-medium text-slate-900">{r.doctor?.full_name}</p><p className="text-xs text-slate-400">{formatDate(r.record_date)}</p></div>
                 </div>
                 <p className="text-sm text-slate-700"><strong>Diagnosis:</strong> {r.diagnosis}</p>
                 {r.symptoms && <p className="text-sm text-slate-600 mt-1"><strong>Symptoms:</strong> {r.symptoms}</p>}
                 {r.treatment_plan && <p className="text-sm text-slate-600 mt-1"><strong>Treatment Plan:</strong> {r.treatment_plan}</p>}
                 {r.clinical_notes && <p className="text-sm text-slate-600 mt-1"><strong>Notes:</strong> {r.clinical_notes}</p>}
               </div>
             ))}
           </div>
           <Pagination page={page} total={total} pageSize={10} onPageChange={setPage} />
         </>}
      </Card>
    </div>
  );
}
