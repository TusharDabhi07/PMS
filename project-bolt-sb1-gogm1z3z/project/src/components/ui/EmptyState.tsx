import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      {icon && <div className="mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return <div className={cn('flex items-center justify-center py-8', className)}><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-primary-600" /></div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />;
}

export function CardSkeleton() {
  return <div className="card p-5"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-3 w-32" /></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-3 rounded-full bg-error-50 p-3"><svg className="h-6 w-6 text-error-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
      <p className="text-sm text-slate-600 mb-3">{message}</p>
      {onRetry && <button onClick={onRetry} className="text-sm font-medium text-primary-600 hover:text-primary-700">Try again</button>}
    </div>
  );
}
