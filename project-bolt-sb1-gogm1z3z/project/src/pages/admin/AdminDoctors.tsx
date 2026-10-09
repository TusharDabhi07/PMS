import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserCog, Eye, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AccountStatusBadge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { fetchDoctors, fetchDepartments } from '@/services/data';
import type { DoctorProfile, Department } from '@/types';

export function AdminDoctors() {
  const [data, setData] = useState<DoctorProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [result, depts] = await Promise.all([fetchDoctors({ page, search, department, sortBy, sortOrder }), fetchDepartments()]);
      setData(result.data); setTotal(result.total); setDepartments(depts);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load doctors'); }
    finally { setLoading(false); }
  }, [page, search, department, sortBy, sortOrder]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, department]);

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  return (
    <div>
      <PageHeader title="Doctors" description="Manage doctor accounts and profiles" action={<Link to="/admin/doctors/new"><Button size="sm"><UserPlus className="h-4 w-4" />Add Doctor</Button></Link>} />
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by specialty or employee ID..." />
          <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="sm:w-48">
            <option value="all">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.department_name}</option>)}
          </Select>
        </div>
        {loading ? <LoadingSpinner /> :
         error ? <ErrorState message={error} onRetry={load} /> :
         data.length === 0 ? <EmptyState icon={<UserCog className="h-12 w-12" />} title="No doctors found" description="Add a doctor to get started." action={<Link to="/admin/doctors/new"><Button size="sm"><UserPlus className="h-4 w-4" />Add Doctor</Button></Link>} /> :
         <>
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead className="bg-slate-50">
                 <tr>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('specialty')}>
                     <span className="inline-flex items-center gap-1">Name</span>
                   </th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('specialty')}>Specialty</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee ID</th>
                   <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                   <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {data.map((d) => (
                   <tr key={d.id} className="hover:bg-slate-50">
                     <td className="px-5 py-3">
                       <div className="flex items-center gap-3">
                         <Avatar name={d.profile?.full_name || 'Doctor'} size="sm" />
                         <div><span className="text-sm font-medium text-slate-900 block">{d.profile?.full_name}</span><span className="text-xs text-slate-400">{d.profile?.email}</span></div>
                       </div>
                     </td>
                     <td className="px-5 py-3 text-sm text-slate-600">{d.specialty}</td>
                     <td className="px-5 py-3 text-sm text-slate-600">{d.department?.department_name || '—'}</td>
                     <td className="px-5 py-3 text-sm text-slate-600">{d.employee_id}</td>
                     <td className="px-5 py-3"><AccountStatusBadge status={d.profile?.account_status || 'active'} /></td>
                     <td className="px-5 py-3 text-right"><Link to={`/admin/doctors/${d.id}`} className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"><Eye className="h-4 w-4" />View</Link></td>
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
