import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCog, CalendarDays, Clock, CheckCircle2, XCircle,
  TrendingUp, Activity, ArrowRight, UserPlus,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { AppointmentStatusBadge, AccountStatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment, Profile } from '@/types';

interface DashboardStats {
  totalPatients: number;
  activeDoctors: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedConsultations: number;
  cancelledAppointments: number;
}

interface ChartData {
  appointmentsOverTime: { date: string; count: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  patientTrends: { date: string; count: number }[];
  departmentAppointments: { name: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
  no_show: '#94a3b8',
};

export function AdminDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [patientsRes, doctorsRes, todayApptsRes, pendingRes, completedRes, cancelledRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor').eq('account_status', 'active'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
      ]);

      setStats({
        totalPatients: patientsRes.count || 0,
        activeDoctors: doctorsRes.count || 0,
        todayAppointments: todayApptsRes.count || 0,
        pendingAppointments: pendingRes.count || 0,
        completedConsultations: completedRes.count || 0,
        cancelledAppointments: cancelledRes.count || 0,
      });

      // Appointments over time (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const startDate = sevenDaysAgo.toISOString().split('T')[0];

      const { data: apptHistory } = await supabase
        .from('appointments')
        .select('appointment_date, status')
        .gte('appointment_date', startDate)
        .order('appointment_date', { ascending: true });

      const dateCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      (apptHistory || []).forEach((a: { appointment_date: string; status: string }) => {
        dateCounts[a.appointment_date] = (dateCounts[a.appointment_date] || 0) + 1;
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });

      const appointmentsOverTime = Object.entries(dateCounts).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      }));

      const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#94a3b8',
      }));

      // Patient registration trends (last 7 days)
      const { data: patientHistory } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('role', 'patient')
        .gte('created_at', startDate + 'T00:00:00')
        .order('created_at', { ascending: true });

      const patientDateCounts: Record<string, number> = {};
      (patientHistory || []).forEach((p: { created_at: string }) => {
        const day = p.created_at.split('T')[0];
        patientDateCounts[day] = (patientDateCounts[day] || 0) + 1;
      });

      const patientTrends = Object.entries(patientDateCounts).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      }));

      // Appointments by department
      const { data: deptAppts } = await supabase
        .from('appointments')
        .select('doctor_id')
        .gte('appointment_date', startDate);

      const doctorIds = [...new Set((deptAppts || []).map((a: { doctor_id: string }) => a.doctor_id))];
      let departmentAppointments: { name: string; count: number }[] = [];

      if (doctorIds.length > 0) {
        const { data: doctorDepts } = await supabase
          .from('doctor_profiles')
          .select('department_id, department:departments(department_name)')
          .in('user_id', doctorIds);

        const deptCounts: Record<string, number> = {};
        (doctorDepts || []).forEach((d: { department: { department_name: string }[] }) => {
          const name = d.department?.[0]?.department_name || 'Unassigned';
          deptCounts[name] = (deptCounts[name] || 0) + 1;
        });
        departmentAppointments = Object.entries(deptCounts).map(([name, count]) => ({ name, count }));
      }

      setChartData({ appointmentsOverTime, statusDistribution, patientTrends, departmentAppointments });

      // Recent appointments
      const { data: recentAppts } = await supabase
        .from('appointments')
        .select('*, patient:profiles!appointments_patient_id_fkey(*), doctor:profiles!appointments_doctor_id_fkey(*)')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentAppointments(recentAppts as Appointment[] || []);

      // Recently registered users
      const { data: recent } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentUsers(recent as Profile[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;
  if (!stats || !chartData) return null;

  const statCards = [
    { label: 'Total Patients', value: stats.totalPatients, icon: <Users className="h-5 w-5" />, color: 'bg-primary-50 text-primary-600' },
    { label: 'Active Doctors', value: stats.activeDoctors, icon: <UserCog className="h-5 w-5" />, color: 'bg-teal-50 text-teal-600' },
    { label: "Today's Appointments", value: stats.todayAppointments, icon: <CalendarDays className="h-5 w-5" />, color: 'bg-warning-50 text-warning-600' },
    { label: 'Pending Requests', value: stats.pendingAppointments, icon: <Clock className="h-5 w-5" />, color: 'bg-orange-50 text-orange-600' },
    { label: 'Completed', value: stats.completedConsultations, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-success-50 text-success-600' },
    { label: 'Cancelled', value: stats.cancelledAppointments, icon: <XCircle className="h-5 w-5" />, color: 'bg-error-50 text-error-600' },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name.split(' ')[0]}`}
        description="Hospital overview and key metrics at a glance"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <div className={`inline-flex items-center justify-center h-10 w-10 rounded-lg ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Appointments Over Time</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary-500" />
          </CardHeader>
          <CardBody>
            {chartData.appointmentsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData.appointmentsOverTime}>
                  <defs>
                    <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAppt)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No appointment data" description="Appointment trends will appear here once bookings are made." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Status Distribution</CardTitle>
            <Activity className="h-5 w-5 text-teal-500" />
          </CardHeader>
          <CardBody>
            {chartData.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {chartData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No status data" description="Status distribution will appear here once appointments exist." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Registration Trends</CardTitle>
            <UserPlus className="h-5 w-5 text-success-500" />
          </CardHeader>
          <CardBody>
            {chartData.patientTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData.patientTrends}>
                  <defs>
                    <linearGradient id="colorPatient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} fill="url(#colorPatient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No registration data" description="Patient registration trends will appear here." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments by Department</CardTitle>
            <Users className="h-5 w-5 text-primary-500" />
          </CardHeader>
          <CardBody>
            {chartData.departmentAppointments.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData.departmentAppointments} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No department data" description="Department appointment counts will appear here." />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <Link to="/admin/appointments" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {recentAppointments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentAppointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={appt.patient?.full_name || 'Patient'} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{appt.patient?.full_name}</p>
                        <p className="text-xs text-slate-400">{formatDate(appt.appointment_date)} at {formatTime(appt.start_time)}</p>
                      </div>
                    </div>
                    <AppointmentStatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No appointments yet" description="Recent appointments will appear here." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recently Registered Users</CardTitle>
            <Link to="/admin/patients" className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {recentUsers.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.full_name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{user.full_name}</p>
                        <p className="text-xs text-slate-400 capitalize">{user.role} • {formatDate(user.created_at)}</p>
                      </div>
                    </div>
                    <AccountStatusBadge status={user.account_status} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No users yet" description="Recently registered users will appear here." />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
