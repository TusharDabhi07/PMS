import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/EmptyState';
import { createAppointment } from '@/services/data';
import { getAuthErrorMessage } from '@/lib/errors';
import { formatDate, formatTime, getWeekdayName } from '@/lib/utils';
import type { Department, DoctorProfile, DoctorAvailability } from '@/types';

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

export function BookAppointment() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [reason, setReason] = useState('');
  const [apptType, setApptType] = useState('consultation');

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('departments').select('*').order('department_name');
      setDepartments(data as Department[] || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDepartments(); }, [loadDepartments]);

  const loadDoctors = useCallback(async () => {
    if (!departmentId) return;
    const { data } = await supabase.from('doctor_profiles').select('*, profile:profiles(*)').eq('department_id', departmentId);
    setDoctors((data as DoctorProfile[]) || []);
  }, [departmentId]);

  const loadAvailability = useCallback(async () => {
    if (!doctorId) return;
    const doctor = doctors.find(d => d.user_id === doctorId);
    if (!doctor) return;
    const { data: avail } = await supabase.from('doctor_availability').select('*').eq('doctor_id', doctorId).eq('is_available', true).order('weekday');
    setAvailability((avail as DoctorAvailability[]) || []);
  }, [doctorId, doctors]);

  const loadBookedSlots = useCallback(async () => {
    if (!doctorId || !date) return;
    const { data } = await supabase.from('appointments').select('start_time').eq('doctor_id', doctorId).eq('appointment_date', date).in('status', ['pending', 'confirmed']);
    setBookedSlots((data || []).map((a: { start_time: string }) => a.start_time));
  }, [doctorId, date]);

  useEffect(() => { if (departmentId) loadDoctors(); }, [departmentId, loadDoctors]);
  useEffect(() => { if (doctorId) loadAvailability(); }, [doctorId, loadAvailability]);
  useEffect(() => { if (date) loadBookedSlots(); }, [date, loadBookedSlots]);

  const getAvailableSlots = () => {
    if (!date) return [];
    const weekday = new Date(date).getDay();
    const dayAvail = availability.filter(a => a.weekday === weekday);
    if (dayAvail.length === 0) return [];
    return TIME_SLOTS.filter(slot => {
      const inAvail = dayAvail.some(a => slot >= a.start_time && slot < a.end_time);
      const isBooked = bookedSlots.includes(slot);
      const isPast = new Date(date + 'T' + slot) < new Date();
      return inAvail && !isBooked && !isPast;
    });
  };

  const availableSlots = getAvailableSlots();

  const handleSubmit = async () => {
    if (!profile?.id || !doctorId || !date || !startTime || !reason) { toast('Please complete all fields.', 'error'); return; }
    if (reason.length < 5) { toast('Please provide a more detailed reason.', 'error'); return; }
    setSubmitting(true);
    try {
      const endTime = new Date(`2000-01-01T${startTime}`);
      endTime.setMinutes(endTime.getMinutes() + 30);
      await createAppointment({
        patient_id: profile.id, doctor_id: doctorId, appointment_date: date,
        start_time: startTime, end_time: endTime.toTimeString().slice(0, 5),
        reason_for_visit: reason, appointment_type: apptType,
      });
      toast('Appointment booked successfully!', 'success');
      navigate('/patient/appointments');
    } catch (err) { toast(getAuthErrorMessage(err), 'error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  const steps = ['Department', 'Doctor', 'Date & Time', 'Details'];

  return (
    <div>
      <PageHeader title="Book an Appointment" description="Schedule a visit with a doctor" />

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${step === i + 1 ? 'bg-primary-600 text-white' : step > i + 1 ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-400'}`}>
              {step > i + 1 ? <Check className="h-4 w-4" /> : <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">{i + 1}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </div>
        ))}
      </div>

      <Card>
        <CardBody>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Select a Department</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((d) => (
                  <button key={d.id} onClick={() => { setDepartmentId(d.id); setDoctorId(''); setStep(2); }}
                    className={`text-left p-4 rounded-lg border transition-all ${departmentId === d.id ? 'border-primary-600 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p className="text-sm font-semibold text-slate-900">{d.department_name}</p>
                    <p className="text-xs text-slate-500 mt-1">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Select a Doctor</h3>
              {doctors.length === 0 ? <p className="text-sm text-slate-400">No doctors available in this department.</p> :
                <div className="space-y-2">
                  {doctors.map((d) => (
                    <button key={d.id} onClick={() => { setDoctorId(d.user_id); setStep(3); }}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${doctorId === d.user_id ? 'border-primary-600 bg-primary-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <Avatar name={d.profile?.full_name || 'Dr'} size="md" />
                      <div className="flex-1"><p className="text-sm font-semibold text-slate-900">{d.profile?.full_name}</p><p className="text-xs text-slate-500">{d.specialty} • {d.qualification}</p></div>
                      {d.years_of_experience && <span className="text-xs text-slate-400">{d.years_of_experience} yrs exp</span>}
                    </button>
                  ))}
                </div>}
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Back</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Select Date & Time</h3>
              <Input label="Appointment Date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setStartTime(''); }} min={new Date().toISOString().split('T')[0]} />
              {date && (
                <div>
                  <label className="label">Available Time Slots</label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button key={slot} onClick={() => setStartTime(slot)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${startTime === slot ? 'border-primary-600 bg-primary-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  ) : <p className="text-sm text-slate-400">No available slots for this date. The doctor may not be available on this day.</p>}
                  {availability.length > 0 && <p className="text-xs text-slate-400 mt-2">Doctor available on: {availability.map(a => getWeekdayName(a.weekday)).join(', ')}</p>}
                </div>
              )}
              <div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>{startTime && <Button size="sm" onClick={() => setStep(4)}>Continue</Button>}</div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Appointment Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Appointment Type" value={apptType} onChange={(e) => setApptType(e.target.value)}>
                  <option value="consultation">Consultation</option><option value="follow_up">Follow-up</option><option value="checkup">Check-up</option><option value="emergency">Emergency</option><option value="telemedicine">Telemedicine</option>
                </Select>
                <Input label="Date" value={formatDate(date)} disabled />
                <Input label="Time" value={formatTime(startTime)} disabled />
                <Input label="Doctor" value={doctors.find(d => d.user_id === doctorId)?.profile?.full_name || ''} disabled />
              </div>
              <Textarea label="Reason for Visit" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe your symptoms or reason for the visit" rows={4} />
              <div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setStep(3)}>Back</Button><Button onClick={handleSubmit} loading={submitting}>Book Appointment</Button></div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
