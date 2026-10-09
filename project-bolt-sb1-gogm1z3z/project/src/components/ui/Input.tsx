import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div>
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <input ref={ref} id={inputId} className={cn('input', error && 'border-error-500 focus:border-error-500 focus:ring-error-200', className)} aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : undefined} {...props} />
        {error && <p id={`${inputId}-error`} className="mt-1 text-xs text-error-600">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div>
        {label && <label htmlFor={selectId} className="label">{label}</label>}
        <select ref={ref} id={selectId} className={cn('input', error && 'border-error-500 focus:border-error-500 focus:ring-error-200', className)} aria-invalid={!!error} {...props}>{children}</select>
        {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const textareaId = id || props.name;
    return (
      <div>
        {label && <label htmlFor={textareaId} className="label">{label}</label>}
        <textarea ref={ref} id={textareaId} className={cn('input', error && 'border-error-500 focus:border-error-500 focus:ring-error-200', className)} rows={4} aria-invalid={!!error} {...props} />
        {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
