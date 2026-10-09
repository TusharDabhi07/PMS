import { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Input } from '@/components/ui/Input';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { fetchDoctorAvailability, saveDoctorAvailability } from '@/services/data';
import { getWeekdayName, formatTime } from '@/lib/utils';

interface AvailabilitySlot { weekday: number; start_time: string; end_time: string; }

export function DoctorAvailability() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({ weekday: 1, start_time: '09:00', end_time: '17:00' });

  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true); setError(null);
    try {
      const data = await fetchDoctorAvailability(profile.id);
      setSlots(data.map(a => ({ weekday: a.weekday, start_time: a.start_time, end_time: a.end_time })));
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const addSlot = () => {
    if (newSlot.start_time >= newSlot.end_time) { toast('Start time must be before end time.', 'error'); return; }
    setSlots([...slots, newSlot]);
    setNewSlot({ weekday: 1, start_time: '09:00', end_time: '17:00' });
  };

  const removeSlot = (index: number) => setSlots(slots.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await saveDoctorAvailability(profile.id, slots.map(s => ({ ...s, is_available: true })));
      toast('Availability saved successfully.', 'success');
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Availability" description="Set your weekly working hours" action={<Button size="sm" onClick={handleSave} loading={saving}>Save Schedule</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Current Schedule</CardTitle></CardHeader>
          <CardBody>
            {slots.length > 0 ? (
              <div className="space-y-2">
                {slots.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <div><p className="text-sm font-medium text-slate-900">{getWeekdayName(s.weekday)}</p><p className="text-xs text-slate-500">{formatTime(s.start_time)} — {formatTime(s.end_time)}</p></div>
                    </div>
                    <button onClick={() => removeSlot(i)} className="text-slate-400 hover:text-error-600 p-1" aria-label="Remove slot"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={<Clock className="h-12 w-12" />} title="No availability set" description="Add time slots to set your schedule." />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Add Time Slot</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Select label="Day of Week" value={newSlot.weekday} onChange={(e) => setNewSlot({ ...newSlot, weekday: parseInt(e.target.value) })}>
                {Array.from({ length: 7 }, (_, i) => <option key={i} value={i}>{getWeekdayName(i)}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Start Time" type="time" value={newSlot.start_time} onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })} />
                <Input label="End Time" type="time" value={newSlot.end_time} onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })} />
              </div>
              <Button variant="secondary" onClick={addSlot} className="w-full"><Plus className="h-4 w-4" />Add Slot</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
