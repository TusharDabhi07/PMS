import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AccountStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { fetchPatients } from '@/services/data';
import { formatDate } from '@/lib/utils';
import type { Profile } from '@/types';

export function AdminPatients() {
  const [data, setData] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await fetchPatients({ page, search, status, sortBy, sortOrder });
      setData(result.data); setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally { setLoading(false); }
  }, [page, search, status, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">{label}{sortBy === field && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</span>
    </th>
  );

  return (
    <div>
      <PageHeader title="Patients" description="Manage patient registrations and profiles" />
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or phone..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
        </div>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<Users className="h-12 w-12" />} title="No patients found" description="Patients will appear here once they register." /> :
         <>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50">
                 <tr>
                   <SortHeader field="full_name" label="Name" />
                   <SortHeader field="email" label="Email" />
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                   <SortHeader field="created_at" label="Registered" />
                   <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {data.map((p) => (
                   <tr key={p.id} className="hover:bg-slate-50">
                     <td className="px-5 py-3">
                       <div className="flex items-center gap-3">
                         <Avatar name={p.full_name} src={p.avatar_url} size="sm" />
                         <span className="text-sm font-medium text-slate-900">{p.full_name}</span>
                       </div>
                     </td>
                     <td className="px-5 py-3 text-sm text-slate-600">{p.email}</td>
                     <td className="px-5 py-3 text-sm text-slate-600">{p.phone || '—'}</td>
                     <td className="px-5 py-3"><AccountStatusBadge status={p.account_status} /></td>
                     <td className="px-5 py-3 text-sm text-slate-600">{formatDate(p.created_at)}</td>
                     <td className="px-5 py-3 text-right">
                       <Link to={`/admin/patients/${p.id}`} className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"><Eye className="h-4 w-4" />View</Link>
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
