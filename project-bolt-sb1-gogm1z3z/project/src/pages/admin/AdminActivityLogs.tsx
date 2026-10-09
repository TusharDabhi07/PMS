import { useState, useEffect, useCallback } from 'react';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { fetchActivityLogs } from '@/services/data';
import { formatDateTime } from '@/lib/utils';
import type { ActivityLog } from '@/types';

export function AdminActivityLogs() {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await fetchActivityLogs(page); setData(r.data); setTotal(r.total); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load logs'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader title="Activity Logs" description="System audit trail of all user actions" />
      <Card>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<ClipboardList className="h-12 w-12" />} title="No activity logs" description="System activity will be logged here." /> :
         <>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50">
                 <tr>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Time</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actor</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Entity Type</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Entity ID</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {data.map((log) => (
                   <tr key={log.id} className="hover:bg-slate-50">
                     <td className="px-5 py-3 text-sm text-slate-600">{formatDateTime(log.created_at)}</td>
                     <td className="px-5 py-3">
                       <div className="flex items-center gap-2"><Avatar name={log.actor?.full_name || 'System'} size="sm" /><span className="text-sm font-medium text-slate-900">{log.actor?.full_name || 'System'}</span></div>
                     </td>
                     <td className="px-5 py-3 text-sm text-slate-600">{log.action}</td>
                     <td className="px-5 py-3 text-sm text-slate-600 capitalize">{log.entity_type || '—'}</td>
                     <td className="px-5 py-3 text-sm text-slate-400 font-mono text-xs">{log.entity_id ? log.entity_id.substring(0, 8) + '...' : '—'}</td>
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
