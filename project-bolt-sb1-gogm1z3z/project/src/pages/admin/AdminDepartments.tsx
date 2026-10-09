import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { fetchDepartments } from '@/services/data';
import type { Department } from '@/types';

export function AdminDepartments() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setDepartments(await fetchDepartments()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load departments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditingDept(null); setName(''); setDescription(''); setModalOpen(true); };
  const openEdit = (d: Department) => { setEditingDept(d); setName(d.department_name); setDescription(d.description || ''); setModalOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { toast('Department name is required.', 'error'); return; }
    setSaving(true);
    try {
      if (editingDept) {
        const { error } = await supabase.from('departments').update({ department_name: name, description: description || null }).eq('id', editingDept.id);
        if (error) throw error;
        toast('Department updated.', 'success');
      } else {
        const { error } = await supabase.from('departments').insert({ department_name: name, description: description || null });
        if (error) throw error;
        toast('Department created.', 'success');
      }
      setModalOpen(false); load();
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to save department', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDept) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from('departments').delete().eq('id', deleteDept.id);
      if (error) throw error;
      toast('Department deleted.', 'success');
      setDeleteDept(null); load();
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to delete department', 'error'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Departments" description="Manage hospital departments and specialties" action={<Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" />Add Department</Button>} />
      {loading ? <LoadingSpinner /> :
       error ? <ErrorState message={error} onRetry={load} /> :
       departments.length === 0 ? <Card><EmptyState icon={<Building2 className="h-12 w-12" />} title="No departments" description="Add a department to get started." action={<Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" />Add Department</Button>} /></Card> :
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         {departments.map((d) => (
           <Card key={d.id}>
            <CardBody>
              <div className="flex items-start justify-between mb-2">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-primary-50 text-primary-600"><Building2 className="h-5 w-5" /></div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(d)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteDept(d)} className="p-1.5 text-slate-400 hover:text-error-600 hover:bg-error-50 rounded-lg" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <h3 className="text-base font-semibold text-slate-900">{d.department_name}</h3>
              <p className="text-sm text-slate-500 mt-1">{d.description || 'No description'}</p>
            </CardBody>
          </Card>
        ))}
      </div>}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingDept ? 'Edit Department' : 'Add Department'}>
        <div className="space-y-4">
          <Input label="Department Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cardiology" />
          <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the department" />
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>{editingDept ? 'Save Changes' : 'Create'}</Button></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteDept} onClose={() => setDeleteDept(null)} onConfirm={handleDelete} title="Delete Department" message={`Are you sure you want to delete ${deleteDept?.department_name}? Doctors in this department will be unassigned.`} confirmLabel="Delete" variant="danger" loading={deleteLoading} />
    </div>
  );
}
