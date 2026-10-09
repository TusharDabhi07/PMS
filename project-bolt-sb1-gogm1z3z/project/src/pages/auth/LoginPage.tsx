import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stethoscope, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { getAuthErrorMessage } from '@/lib/errors';

export function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) toast(getAuthErrorMessage(error), 'error');
    else { toast('Welcome back! You have been signed in.', 'success'); navigate('/dashboard'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/30 to-teal-50/30 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-600 text-white shadow-lg mb-4"><Stethoscope className="h-7 w-7" /></div>
          <h1 className="text-2xl font-bold text-slate-900">MediCare</h1>
          <p className="text-sm text-slate-500 mt-1">Patient Management System</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Sign in to your account</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access your dashboard</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="email" type="email" className="input pl-10" placeholder="you@example.com" {...register('email')} /></div>
              {errors.email && <p className="mt-1 text-xs text-error-600">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="password" type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="Enter your password" {...register('password')} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              {errors.password && <p className="mt-1 text-xs text-error-600">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />Remember me</label>
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-700">Forgot password?</Link>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">Sign In</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Don't have an account? <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">Register as a patient</Link></p>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Authorized personnel only. All access is logged and monitored.</p>
      </div>
    </div>
  );
}
