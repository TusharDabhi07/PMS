import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Stethoscope, LayoutDashboard, Users, UserCog, CalendarDays, Building2,
  FileText, Pill, Bell, Settings, LogOut, Menu, X, ChevronDown,
  Activity, ClipboardList, Clock, User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Role } from '@/types';

interface NavItem { label: string; icon: ReactNode; href: string; }

const navItems: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, href: '/admin/dashboard' },
    { label: 'Patients', icon: <Users className="h-5 w-5" />, href: '/admin/patients' },
    { label: 'Doctors', icon: <UserCog className="h-5 w-5" />, href: '/admin/doctors' },
    { label: 'Appointments', icon: <CalendarDays className="h-5 w-5" />, href: '/admin/appointments' },
    { label: 'Departments', icon: <Building2 className="h-5 w-5" />, href: '/admin/departments' },
    { label: 'Reports', icon: <Activity className="h-5 w-5" />, href: '/admin/reports' },
    { label: 'Activity Logs', icon: <ClipboardList className="h-5 w-5" />, href: '/admin/activity-logs' },
    { label: 'Notifications', icon: <Bell className="h-5 w-5" />, href: '/admin/notifications' },
    { label: 'Settings', icon: <Settings className="h-5 w-5" />, href: '/admin/settings' },
  ],
  doctor: [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, href: '/doctor/dashboard' },
    { label: 'Appointments', icon: <CalendarDays className="h-5 w-5" />, href: '/doctor/appointments' },
    { label: 'My Patients', icon: <Users className="h-5 w-5" />, href: '/doctor/patients' },
    { label: 'Medical Records', icon: <FileText className="h-5 w-5" />, href: '/doctor/medical-records' },
    { label: 'Prescriptions', icon: <Pill className="h-5 w-5" />, href: '/doctor/prescriptions' },
    { label: 'Availability', icon: <Clock className="h-5 w-5" />, href: '/doctor/availability' },
    { label: 'Notifications', icon: <Bell className="h-5 w-5" />, href: '/doctor/notifications' },
    { label: 'My Profile', icon: <User className="h-5 w-5" />, href: '/doctor/profile' },
  ],
  patient: [
    { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, href: '/patient/dashboard' },
    { label: 'Appointments', icon: <CalendarDays className="h-5 w-5" />, href: '/patient/appointments' },
    { label: 'Book Appointment', icon: <CalendarDays className="h-5 w-5" />, href: '/patient/book-appointment' },
    { label: 'Medical Records', icon: <FileText className="h-5 w-5" />, href: '/patient/medical-records' },
    { label: 'Prescriptions', icon: <Pill className="h-5 w-5" />, href: '/patient/prescriptions' },
    { label: 'Notifications', icon: <Bell className="h-5 w-5" />, href: '/patient/notifications' },
    { label: 'My Profile', icon: <User className="h-5 w-5" />, href: '/patient/profile' },
  ],
};

const roleLabels: Record<Role, string> = { admin: 'Administrator', doctor: 'Doctor', patient: 'Patient' };

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = profile?.role || 'patient';
  const items = navItems[role];

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    const fetchCount = async () => {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false);
      if (active) setUnreadCount(count || 0);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [profile?.id, location.pathname]);

  if (!profile) return null;

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    return <Link to={item.href} onClick={() => setSidebarOpen(false)} className={cn('sidebar-link', isActive && 'sidebar-link-active')}><span className="flex-shrink-0">{item.icon}</span><span>{item.label}</span></Link>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <aside className={cn('fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-600 text-white"><Stethoscope className="h-5 w-5" /></div>
          <div><h1 className="text-lg font-bold text-slate-900">MediCare</h1><p className="text-xs text-slate-400">Management System</p></div>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{roleLabels[role]}</div>
          {items.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 truncate">{profile.full_name}</p><p className="text-xs text-slate-400 truncate">{profile.email}</p></div>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-slate-600 hover:text-slate-900" aria-label="Toggle navigation menu">{sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
            <div className="flex items-center gap-3 ml-auto">
              <Link to={`/${role}/notifications`} className="relative text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </Link>
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors" aria-label="User menu">
                  <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {userMenuOpen && (<>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 animate-slide-up">
                    <div className="px-4 py-2 border-b border-slate-100"><p className="text-sm font-medium text-slate-900">{profile.full_name}</p><p className="text-xs text-slate-400">{roleLabels[role]}</p></div>
                    <Link to={`/${role}/profile`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><User className="h-4 w-4" />My Profile</Link>
                    <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 w-full text-left"><LogOut className="h-4 w-4" />Sign Out</button>
                  </div>
                </>)}
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6 max-w-7xl mx-auto animate-fade-in"><Outlet /></main>
      </div>
    </div>
  );
}
