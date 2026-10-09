import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', success: 'btn-success', ghost: 'btn-ghost',
};
const sizeClasses: Record<Size, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, children, className, ...props }: ButtonProps) {
  return (
    <button className={cn(variantClasses[variant], sizeClasses[size], className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
