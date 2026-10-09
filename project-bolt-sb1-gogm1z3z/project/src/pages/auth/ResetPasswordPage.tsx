import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { getAuthErrorMessage } from '@/lib/errors';

export function ResetPasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
    if (password !== confirmPassword) { toast('Passwords do not match.', 'error'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast(getAuthErrorMessage(error), 'error');
    else { toast('Password updated successfully!', 'success'); navigate('/login'); }
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
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Set a new password</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your new password below</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="password" className="label">New Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="password" type={showPassword ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <div><label htmlFor="confirmPassword" className="label">Confirm New Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="confirmPassword" type={showPassword ? 'text' : 'password'} className="input pl-10" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div></div>
            <Button type="submit" loading={loading} className="w-full" size="lg">Update Password</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500"><Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
