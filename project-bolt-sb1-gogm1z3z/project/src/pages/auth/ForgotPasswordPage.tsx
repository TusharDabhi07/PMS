import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { getAuthErrorMessage } from '@/lib/errors';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) toast(getAuthErrorMessage(error), 'error');
    else { setSent(true); toast('Password reset instructions sent to your email.', 'success'); }
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
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-success-100 mb-4"><Mail className="h-6 w-6 text-success-600" /></div>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h2>
              <p className="text-sm text-slate-500 mb-6">We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and follow the link to reset your password.</p>
              <Link to="/login" className="btn-primary inline-flex"><ArrowLeft className="h-4 w-4" />Back to sign in</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Forgot your password?</h2>
              <p className="text-sm text-slate-500 mb-6">Enter your email address and we'll send you instructions to reset your password.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="email" className="label">Email Address</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /><input id="email" type="email" className="input pl-10" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
                <Button type="submit" loading={loading} className="w-full" size="lg">Send Reset Instructions</Button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-500"><Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" />Back to sign in</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
