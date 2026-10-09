import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Save } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AccountStatusBadge } from '@/components/ui/Badge';
import { profileEditSchema, type ProfileEditInput } from '@/lib/validation';
import { updateProfile } from '@/services/data';
import { supabase } from '@/lib/supabase';
import { getAuthErrorMessage } from '@/lib/errors';
import { formatDate, calculateAge } from '@/lib/utils';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileEditInput>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      date_of_birth: profile?.date_of_birth || '',
      gender: (profile?.gender as 'male' | 'female' | 'other') || undefined,
      address: profile?.address || '',
    },
  });

  if (!profile) return null;

  const onSubmit = async (data: ProfileEditInput) => {
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        full_name: data.full_name,
        phone: data.phone || null,
        date_of_birth: data.date_of_birth || null,
        gender: (data.gender as 'male' | 'female' | 'other') || null,
        address: data.address || null,
      });
      await refreshProfile();
      toast('Profile updated successfully.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
    if (newPassword !== confirmNewPassword) { toast('Passwords do not match.', 'error'); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) toast(getAuthErrorMessage(error), 'error');
    else { toast('Password updated successfully.', 'success'); setNewPassword(''); setConfirmNewPassword(''); }
  };

  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  return (
    <div>
      <PageHeader title="My Profile" description="View and update your personal information" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardBody className="text-center">
            <Avatar name={profile.full_name} src={profile.avatar_url} size="xl" className="mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900">{profile.full_name}</h2>
            <p className="text-sm text-slate-500">{roleLabel}</p>
            <div className="mt-2 flex justify-center"><AccountStatusBadge status={profile.account_status} /></div>
            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{profile.email}</span></div>
              <div className="flex items-center gap-3 text-sm"><Lock className="h-4 w-4 text-slate-400" /><span className="text-slate-600">DOB: {formatDate(profile.date_of_birth)} ({calculateAge(profile.date_of_birth)})</span></div>
            </div>
          </CardBody>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Phone Number" {...register('phone')} error={errors.phone?.message} />
                  <Input label="Date of Birth" type="date" {...register('date_of_birth')} error={errors.date_of_birth?.message} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Gender" {...register('gender')}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select>
                  <Input label="Address" {...register('address')} error={errors.address?.message} />
                </div>
                <div className="flex justify-end"><Button type="submit" loading={saving}><Save className="h-4 w-4" />Save Changes</Button></div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardBody>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
                <Input label="Confirm New Password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Re-enter new password" />
                <div className="flex justify-end"><Button type="submit" loading={changingPassword}>Update Password</Button></div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
