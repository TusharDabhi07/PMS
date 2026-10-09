import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import type { Role } from '@/types';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (profile && profile.account_status !== 'active')
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4"><div className="card p-8 max-w-md text-center"><h2 className="text-xl font-semibold text-slate-900 mb-2">Account Inactive</h2><p className="text-sm text-slate-500">Your account is currently {profile.account_status}. Please contact your administrator to reactivate your account.</p></div></div>;
  return <>{children}</>;
}

export function RoleRoute({ allowedRoles, children }: { allowedRoles: Role[]; children: ReactNode }) {
  const { profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!allowedRoles.includes(profile.role)) return <Navigate to={`/${profile.role}/dashboard`} replace />;
  return <>{children}</>;
}
