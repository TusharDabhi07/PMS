import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { AppointmentStatus, AccountStatus, PrescriptionStatus } from '@/types';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'teal';

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  error: 'bg-error-100 text-error-700',
  neutral: 'bg-slate-100 text-slate-600',
  teal: 'bg-teal-100 text-teal-700',
};

export function Badge({ variant = 'neutral', children, className }: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return <span className={cn('badge', variants[variant], className)}>{children}</span>;
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config: Record<AppointmentStatus, { variant: BadgeVariant; label: string; dot: string }> = {
    pending: { variant: 'warning', label: 'Pending', dot: 'bg-warning-500' },
    confirmed: { variant: 'primary', label: 'Confirmed', dot: 'bg-primary-500' },
    completed: { variant: 'success', label: 'Completed', dot: 'bg-success-500' },
    cancelled: { variant: 'error', label: 'Cancelled', dot: 'bg-error-500' },
    no_show: { variant: 'neutral', label: 'No Show', dot: 'bg-slate-400' },
  };
  const { variant, label, dot } = config[status];
  return <Badge variant={variant}><span className={cn('h-1.5 w-1.5 rounded-full', dot)} />{label}</Badge>;
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const config: Record<AccountStatus, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'neutral', label: 'Inactive' },
    suspended: { variant: 'error', label: 'Suspended' },
  };
  return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
}

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  const config: Record<PrescriptionStatus, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'teal', label: 'Active' },
    discontinued: { variant: 'error', label: 'Discontinued' },
    completed: { variant: 'neutral', label: 'Completed' },
  };
  return <Badge variant={config[status].variant}>{config[status].label}</Badge>;
}
