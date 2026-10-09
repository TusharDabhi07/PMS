import { useState, useEffect, useCallback } from 'react';
import { Download, TrendingUp, CheckCircle2, XCircle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { toCSV, downloadCSV } from '@/lib/utils';

export function AdminReports() {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
  const [fromDate, setFromDate] = useState(monthAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, cancelled: 0, patients: 0, doctors: 0 });
  const [doctorWorkload, setDoctorWorkload] = useState<{ name: string; appointments: number; completed: number }[]>([]);
  const [deptCounts, setDeptCounts] = useState<{ name: string; count: number }[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: appts, error: e1 } = await supabase.from('appointments').select('*, doctor:profiles!appointments_doctor_id_fkey(full_name)').gte('appointment_date', fromDate).lte('appointment_date', toDate);
      if (e1) throw e1;
      const all = appts || [];
      const patientIds = new Set(all.map((a: { patient_id: string }) => a.patient_id));
      const doctorIds = new Set(all.map((a: { doctor_id: string }) => a.doctor_id));
      setStats({
        total: all.length,
        completed: all.filter((a: { status: string }) => a.status === 'completed').length,
        cancelled: all.filter((a: { status: string }) => a.status === 'cancelled').length,
        patients: patientIds.size,
        doctors: doctorIds.size,
      });

      const workload: Record<string, { appointments: number; completed: number }> = {};
      all.forEach((a: { doctor: { full_name: string } | null; status: string }) => {
        const name = a.doctor?.full_name || 'Unknown';
        if (!workload[name]) workload[name] = { appointments: 0, completed: 0 };
        workload[name].appointments++;
        if (a.status === 'completed') workload[name].completed++;
      });
      setDoctorWorkload(Object.entries(workload).map(([name, v]) => ({ name, ...v })));

      const { data: deptData } = await supabase.from('doctor_profiles').select('department:departments(department_name)').in('user_id', [...doctorIds]);
      const dCounts: Record<string, number> = {};
      (deptData || []).forEach((d: { department: { department_name: string }[] }) => {
        const name = d.department?.[0]?.department_name || 'Unassigned';
        dCounts[name] = (dCounts[name] || 0) + 1;
      });
      setDeptCounts(Object.entries(dCounts).map(([name, count]) => ({ name, count })));
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load report'); }
    finally { setLoading(false); }
  }, [fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    const rows = doctorWorkload.map((d) => ({ Doctor: d.name, 'Total Appointments': d.appointments, Completed: d.completed }));
    if (rows.length === 0) { toast('No data to export.', 'error'); return; }
    downloadCSV(`appointments-report-${fromDate}-to-${toDate}.csv`, toCSV(rows));
    toast('Report exported.', 'success');
  };

  const statCards = [
    { label: 'Total Appointments', value: stats.total, icon: <TrendingUp className="h-5 w-5" />, color: 'bg-primary-50 text-primary-600' },
    { label: 'Completed', value: stats.completed, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-success-50 text-success-600' },
    { label: 'Cancelled', value: stats.cancelled, icon: <XCircle className="h-5 w-5" />, color: 'bg-error-50 text-error-600' },
    { label: 'Unique Patients', value: stats.patients, icon: <Users className="h-5 w-5" />, color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Operational reports and appointment analytics" action={<Button size="sm" variant="secondary" onClick={handleExport}><Download className="h-4 w-4" />Export CSV</Button>} />
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <Input label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="sm:w-48" />
            <Input label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="sm:w-48" />
            <Button onClick={load} loading={loading}>Generate Report</Button>
          </div>
        </CardBody>
      </Card>

      {loading ? <LoadingSpinner /> :
       error ? <ErrorState message={error} onRetry={load} /> :
       <>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
           {statCards.map((s) => (
             <Card key={s.label}><CardBody>
               <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${s.color} mb-3`}>{s.icon}</div>
               <p className="text-2xl font-bold text-slate-900">{s.value}</p>
               <p className="text-xs text-slate-500 mt-1">{s.label}</p>
             </CardBody></Card>
           ))}
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card>
             <CardHeader><CardTitle>Doctor Workload</CardTitle></CardHeader>
             <CardBody>
               {doctorWorkload.length > 0 ?
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={doctorWorkload} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                     <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                     <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                     <Tooltip />
                     <Bar dataKey="appointments" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                   </BarChart>
                 </ResponsiveContainer> :
                 <EmptyState title="No data" description="No appointments in this date range." />}
             </CardBody>
           </Card>
           <Card>
             <CardHeader><CardTitle>Appointments by Department</CardTitle></CardHeader>
             <CardBody>
               {deptCounts.length > 0 ?
                 <ResponsiveContainer width="100%" height={300}>
                   <BarChart data={deptCounts} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                     <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                     <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                     <Tooltip />
                     <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                   </BarChart>
                 </ResponsiveContainer> :
                 <EmptyState title="No data" description="No department data in this range." />}
             </CardBody>
           </Card>
         </div>
       </>}
    </div>
  );
}
