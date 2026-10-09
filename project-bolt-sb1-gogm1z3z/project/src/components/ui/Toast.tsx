import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; type: ToastType; message: string; }
interface ToastContextValue { toast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success-600" />,
  error: <XCircle className="h-5 w-5 text-error-600" />,
  info: <Info className="h-5 w-5 text-primary-600" />,
  warning: <AlertCircle className="h-5 w-5 text-warning-600" />,
};
const bgClasses: Record<ToastType, string> = {
  success: 'border-success-200 bg-success-50', error: 'border-error-200 bg-error-50',
  info: 'border-primary-200 bg-primary-50', warning: 'border-warning-200 bg-warning-50',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className={cn('flex items-start gap-3 rounded-lg border px-4 py-3 shadow-soft animate-slide-up pointer-events-auto', bgClasses[t.type])} role="alert">
              {icons[t.type]}
              <p className="flex-1 text-sm text-slate-700">{t.message}</p>
              <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>, document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
