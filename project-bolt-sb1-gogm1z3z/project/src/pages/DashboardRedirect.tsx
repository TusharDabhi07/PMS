import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/EmptyState';

export function DashboardRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={`/${profile.role}/dashboard`} replace />;
}
