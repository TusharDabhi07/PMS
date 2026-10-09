import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { LoadingSpinner, ErrorState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { fetchDepartments, fetchDoctorById, updateProfile } from '@/services/data';
import { doctorProfileSchema, type DoctorProfileInput } from '@/lib/validation';
import { getAuthErrorMessage } from '@/lib/errors';
import type { Department } from '@/types';

export function AdminDoctorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DoctorProfileInput>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: { appointment_type: 'consultation' } as unknown as DoctorProfileInput,
  });

  const load = useCallback(async () => {
    try {
      const depts = await fetchDepartments();
      setDepartments(depts);
      if (isEdit && id) {
        const d = await fetchDoctorById(id);
        if (!d) { setError('Doctor not found'); return; }
        reset({
          full_name: d.profile?.full_name || '',
          email: d.profile?.email || '',
          employee_id: d.employee_id,
          specialty: d.specialty,
          department_id: d.department_id || '',
          qualification: d.qualification,
          license_number: d.license_number,
          consultation_fee: d.consultation_fee || undefined,
          years_of_experience: d.years_of_experience || undefined,
          biography: d.biography || '',
          password: '',
        });
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load data'); }
    finally { setLoading(false); }
  }, [id, isEdit, reset]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data: DoctorProfileInput) => {
    setSaving(true);
    try {
      if (isEdit && id) {
        const existing = await fetchDoctorById(id);
        if (!existing) throw new Error('Doctor not found');
        await updateProfile(existing.user_id, { full_name: data.full_name, phone: null });
        const { error: dpError } = await supabase.from('doctor_profiles').update({
          specialty: data.specialty,
          department_id: data.department_id,
          qualification: data.qualification,
          license_number: data.license_number,
          consultation_fee: data.consultation_fee || null,
          years_of_experience: data.years_of_experience || null,
          biography: data.biography || null,
        }).eq('id', id);
        if (dpError) throw dpError;
        toast('Doctor updated successfully.', 'success');
        navigate(`/admin/doctors/${id}`);
      } else {
        // Create new auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { full_name: data.full_name } },
        });
        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user account');
        const newUserId = authData.user.id;

        // Wait a moment for the trigger to create the profile
        await new Promise(r => setTimeout(r, 500));

        // Update role to doctor (admin can do this)
        await updateProfile(newUserId, { role: 'doctor', full_name: data.full_name });

        // Create doctor profile
        const { error: dpError } = await supabase.from('doctor_profiles').insert({
          user_id: newUserId,
          employee_id: data.employee_id,
          specialty: data.specialty,
          department_id: data.department_id,
          qualification: data.qualification,
          license_number: data.license_number,
          consultation_fee: data.consultation_fee || null,
          years_of_experience: data.years_of_experience || null,
          biography: data.biography || null,
        });
        if (dpError) throw dpError;
        toast('Doctor created successfully.', 'success');
        navigate('/admin/doctors');
      }
    } catch (err) {
      toast(getAuthErrorMessage(err), 'error');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Doctor' : 'Add New Doctor'} description={isEdit ? 'Update doctor information' : 'Create a new doctor account'}
        breadcrumbs={[{ label: 'Doctors', href: '/admin/doctors' }, { label: isEdit ? 'Edit' : 'New' }]}
        action={<Link to="/admin/doctors"><Button variant="secondary" size="sm"><ArrowLeft className="h-4 w-4" />Back</Button></Link>} />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Full Name" {...register('full_name')} error={errors.full_name?.message} />
                <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} disabled={isEdit} hint={isEdit ? 'Email cannot be changed' : undefined} />
                {!isEdit && <Input label="Password" type="password" {...register('password')} error={errors.password?.message} placeholder="At least 6 characters" />}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Employee ID" {...register('employee_id')} error={errors.employee_id?.message} />
                <Input label="Specialty" {...register('specialty')} error={errors.specialty?.message} />
                <Select label="Department" {...register('department_id')} error={errors.department_id?.message}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </Select>
                <Input label="Qualification" {...register('qualification')} error={errors.qualification?.message} />
                <Input label="License Number" {...register('license_number')} error={errors.license_number?.message} />
                <Input label="Consultation Fee ($)" type="number" step="0.01" {...register('consultation_fee', { valueAsNumber: true })} error={errors.consultation_fee?.message} />
                <Input label="Years of Experience" type="number" {...register('years_of_experience', { valueAsNumber: true })} error={errors.years_of_experience?.message} />
              </div>
              <div className="mt-4"><Textarea label="Biography" {...register('biography')} rows={3} error={errors.biography?.message} /></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <Link to="/admin/doctors"><Button variant="secondary" type="button">Cancel</Button></Link>
              <Button type="submit" loading={saving}>{isEdit ? 'Save Changes' : 'Create Doctor'}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
