import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User as UserIcon,
  Save,
  AlertCircle,
  Users,
  Building,
  Loader2,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'
];

const Timetable: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    startTime: '08:00 AM',
    subject: '',
    teacherId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, staffRes, timetableRes] = await Promise.all([
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/staff/school/${user.schoolId}`),
        api.get(`/timetable/school/${user.schoolId}`)
      ]);
      
      const fetchedClasses = classRes.data.data || [];
      setClasses(fetchedClasses);
      setStaff(staffRes.data.data || []);
      
      const allTimetables = timetableRes.data.data || [];
      const processedSlots = allTimetables.reduce((acc: any[], t: any) => {
        const tSlots = (t.slots || []).map((s: any) => ({ ...s, classId: t.classId }));
        return [...acc, ...tSlots];
      }, []);
      
      setSlots(processedSlots);
      
      if (fetchedClasses.length > 0 && !selectedClass) {
        setSelectedClass(fetchedClasses[0].id);
      }
    } catch (error) {
      console.error('Error fetching timetable data:', error);
      toast.error('Failed to load scheduler data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.schoolId) {
      fetchData();
    }
  }, [user]);

  const handleOpenAssign = (day: string, time: string) => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    setFormData({
      ...formData,
      dayOfWeek: day,
      startTime: time,
      subject: '',
      teacherId: ''
    });
    setIsSlotDialogOpen(true);
  };

  const handleAddSlot = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    if (!formData.subject || !formData.teacherId) {
      toast.error('Please fill in all assignment details');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/timetable/slot', { 
        ...formData, 
        schoolId: user.schoolId,
        classId: selectedClass,
        endTime: formData.startTime
      });
      toast.success('Period assigned successfully');
      setIsSlotDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Conflict detected!');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter slots for the currently selected class
  const filteredSlots = slots.filter(s => s.classId === selectedClass);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 text-primary tracking-tight">Timetable & Resource Planner</h2>
          <p className="text-slate-500 font-medium">Manage classroom schedules and teacher assignments.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[220px] bg-white border-slate-200 shadow-sm hover:border-primary/30 transition-colors h-11">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {classes.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No classes found</div>
                ) : (
                  classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>Class {c.name}-{c.section}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsSlotDialogOpen(true)} className="gap-2 shadow-lg shadow-primary/20 h-11 px-6">
            <Plus className="w-5 h-5" /> Add Period
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-3xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-5 bg-slate-50/80 border-b border-r border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] w-36">Time Slot</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-5 bg-slate-50/80 border-b border-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-[0.1em] min-w-[200px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMES.map(time => (
                  <tr key={time} className="group/row hover:bg-slate-50/30 transition-colors">
                    <td className="p-5 bg-slate-50/30 border-r border-b border-slate-100 text-slate-500 font-bold text-[11px] uppercase">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                        {time}
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const slot = filteredSlots.find(s => s.dayOfWeek === day && s.startTime === time);
                      const teacher = staff.find(st => st.id === slot?.teacherId);

                      return (
                        <td key={`${day}-${time}`} className="p-3 border-b border-r border-slate-100 last:border-r-0 relative">
                          {slot ? (
                            <div className="group relative p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/50 hover:bg-indigo-100/70 hover:border-indigo-200/50 transition-all cursor-default overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/30" />
                              <div className="font-bold text-indigo-900 text-sm mb-1.5 flex items-center justify-between">
                                {slot.subject}
                                <Badge variant="outline" className="text-[9px] bg-white border-indigo-200 text-indigo-600 px-1.5 py-0">Active</Badge>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px] text-slate-600 font-semibold">
                                  <UserIcon className="w-3 h-3 text-indigo-400" /> {teacher?.name || 'Assigned'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button 
                              className="w-full min-h-[85px] rounded-2xl border-2 border-dashed border-slate-100 hover:border-primary/20 hover:bg-primary/[0.02] hover:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1.5 group/btn"
                              onClick={() => handleOpenAssign(day, time)}
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/btn:bg-primary/10 transition-colors">
                                <Plus className="w-4 h-4 text-slate-300 group-hover/btn:text-primary transition-colors" />
                              </div>
                              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.1em] group-hover/btn:text-primary transition-colors">Assign</span>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 opacity-90">
              <Users className="w-4 h-4" /> Faculty Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold">96%</div>
            <p className="text-xs opacity-80 mt-2 font-medium">High teacher presence for current session.</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 opacity-90">
              <Users className="w-4 h-4" /> Teacher Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold">6.2 <span className="text-xl opacity-60">Avg</span></div>
            <p className="text-xs opacity-80 mt-2 font-medium">Balanced distribution across departments.</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 opacity-90">
              <AlertCircle className="w-4 h-4" /> Conflict Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold">Live</div>
            <p className="text-xs opacity-80 mt-2 font-medium">Automated prevention of double bookings.</p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-display font-bold text-slate-900">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                Assign Period Slot
                <p className="text-xs font-medium text-slate-400 mt-1">Class {classes.find(c => c.id === selectedClass)?.name || 'Planning'}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Day of Week</label>
                <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData({...formData, dayOfWeek: v})}>
                  <SelectTrigger className="bg-slate-50 border-none h-12 rounded-xl focus:ring-primary/20 transition-all"><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Start Time</label>
                <Select value={formData.startTime} onValueChange={(v) => setFormData({...formData, startTime: v})}>
                  <SelectTrigger className="bg-slate-50 border-none h-12 rounded-xl focus:ring-primary/20 transition-all"><SelectValue /></SelectTrigger>
                  <SelectContent>{TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Subject Name</label>
              <Input 
                placeholder="e.g. Mathematics" 
                value={formData.subject} 
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="bg-slate-50 border-none h-12 rounded-xl focus:bg-white focus:ring-primary/20 transition-all px-4"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Subject Teacher</label>
              <Select value={formData.teacherId} onValueChange={(v) => setFormData({...formData, teacherId: v})}>
                <SelectTrigger className="bg-slate-50 border-none h-12 rounded-xl focus:ring-primary/20 transition-all"><SelectValue placeholder="Assign Teacher" /></SelectTrigger>
                <SelectContent>
                  {staff.filter(s => s.department === 'teaching').length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No teachers found</div>
                  ) : (
                    staff.filter(s => s.department === 'teaching').map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setIsSlotDialogOpen(false)} className="rounded-xl h-12 px-6">Cancel</Button>
            <Button onClick={handleAddSlot} disabled={isSaving} className="rounded-xl h-12 px-8 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timetable;
