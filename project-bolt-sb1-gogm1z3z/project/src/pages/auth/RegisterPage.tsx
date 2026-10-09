import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stethoscope, User, Mail, Lock, Phone, Calendar, MapPin, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { registerSchema, type RegisterInput } from '@/lib/validation';
import { getAuthErrorMessage } from '@/lib/errors';

export function RegisterPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.full_name);
    setLoading(false);
    if (error) toast(getAuthErrorMessage(error), 'error');
    else { toast('Account created successfully! Please sign in.', 'success'); navigate('/login'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/30 to-teal-50/30 px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-600 text-white shadow-lg mb-4"><Stethoscope className="h-7 w-7" /></div>
          <h1 className="text-2xl font-bold text-slate-900">MediCare</h1>
          <p className="text-sm text-slate-500 mt-1">Patient Management System</p>
        </div>
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Create a patient account</h2>
          <p className="text-sm text-slate-500 mb-6">Fill in your details to register as a patient</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="label">Full Name</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="full_name" className="input pl-10" placeholder="John Doe" {...register('full_name')} /></div>
              {errors.full_name && <p className="mt-1 text-xs text-error-600">{errors.full_name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="email" type="email" className="input pl-10" placeholder="you@example.com" {...register('email')} /></div>
              {errors.email && <p className="mt-1 text-xs text-error-600">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="password" type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="At least 6 characters" {...register('password')} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
              {errors.password && <p className="mt-1 text-xs text-error-600">{errors.password.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label htmlFor="phone" className="label">Phone Number</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="phone" className="input pl-10" placeholder="+1 234 567 890" {...register('phone')} /></div></div>
              <div><label htmlFor="date_of_birth" className="label">Date of Birth</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="date_of_birth" type="date" className="input pl-10" {...register('date_of_birth')} /></div></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Gender" {...register('gender')}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select>
              <div><label htmlFor="address" className="label">Address</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="address" className="input pl-10" placeholder="123 Main St, City" {...register('address')} /></div></div>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">Create Account</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Sign in</Link></p>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Patient accounts are created with patient-level access. Doctor and admin accounts are provisioned separately.</p>
      </div>
    </div>
  );
}
