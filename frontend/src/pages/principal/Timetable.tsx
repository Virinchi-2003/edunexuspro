import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  User as UserIcon,
  AlertCircle,
  Users,
  Loader2,
  BookOpen,
  Clock,
  Trash2,
  Calendar
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

const Timetable: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    startTime: '08:00 AM',
    endTime: '09:00 AM',
    subject: '',
    teacherId: ''
  });

  const fetchData = async () => {
    try {
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
    }
  };

  useEffect(() => {
    if (user?.schoolId) {
      fetchData();
    }
  }, [user]);

  const handleAddSlot = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    if (!formData.subject || !formData.teacherId || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all details');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/timetable/slot', { 
        ...formData, 
        schoolId: user.schoolId,
        classId: selectedClass
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

  const handleDeleteSlot = async (slotId: string) => {
     try {
        await api.delete(`/timetable/slot/${slotId}`);
        toast.success('Slot removed');
        fetchData();
     } catch (error) {
        toast.error('Failed to delete slot');
     }
  };

  // Filter slots for the currently selected class
  const filteredSlots = slots.filter(s => s.classId === selectedClass);
  
  // Get unique time slots for this specific class
  const classTimeSlots = Array.from(new Set(filteredSlots.map(s => `${s.startTime} - ${s.endTime}`)))
    .sort((a, b) => {
       const [timeA] = a.split(' - ');
       const [timeB] = b.split(' - ');
       return timeA.localeCompare(timeB);
    });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200">
                <Calendar className="w-7 h-7" />
             </div>
             Class Timetable
          </h2>
          <p className="text-slate-500 font-medium ml-1 mt-1">Configure custom time slots and teacher assignments for each class.</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[240px] bg-white border-slate-200 shadow-sm h-14 rounded-2xl font-bold">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id} className="font-medium py-3">Class {c.name}-{c.section}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsSlotDialogOpen(true)} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-100 h-14 px-8 font-bold gap-2">
            <Plus className="w-5 h-5" /> Add New Period
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-10 border-b border-r border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] w-48">Time Slot</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-10 border-b border-slate-100 text-slate-900 font-display font-bold text-sm uppercase tracking-widest">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {classTimeSlots.length === 0 ? (
                   <tr>
                      <td colSpan={7} className="py-32 text-center text-slate-300">
                         <div className="flex flex-col items-center gap-4">
                            <Clock className="w-16 h-16 opacity-5" />
                            <p className="font-bold uppercase text-xs tracking-widest">No custom time slots added for this class.</p>
                            <Button variant="ghost" onClick={() => setIsSlotDialogOpen(true)} className="text-indigo-600 font-bold">Initialize Schedule</Button>
                         </div>
                      </td>
                   </tr>
                ) : (
                  classTimeSlots.map(timeRange => (
                    <tr key={timeRange} className="group/row hover:bg-slate-50/30 transition-colors">
                      <td className="p-10 bg-slate-50/30 border-r border-slate-100">
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-200" />
                              <span className="text-slate-900 font-black text-xs uppercase tracking-tighter">{timeRange.split(' - ')[0]}</span>
                           </div>
                           <div className="text-[10px] font-bold text-slate-400 ml-5.5 uppercase tracking-widest">to {timeRange.split(' - ')[1]}</div>
                        </div>
                      </td>
                      {DAYS.map(day => {
                        const slot = filteredSlots.find(s => s.dayOfWeek === day && `${s.startTime} - ${s.endTime}` === timeRange);
                        const teacher = staff.find(st => st.id === slot?.teacherId);

                        return (
                          <td key={`${day}-${timeRange}`} className="p-4 border-slate-100 relative">
                            {slot ? (
                              <div className="group relative p-6 rounded-3xl bg-indigo-50/40 border border-indigo-100/30 hover:bg-white hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-default">
                                <div className="font-black text-indigo-900 text-base mb-2 flex items-center justify-between">
                                  {slot.subject}
                                  <div className="flex items-center gap-2">
                                     <Badge className="bg-indigo-600/10 text-indigo-600 border-none text-[8px] font-black tracking-widest px-2 py-0.5">ACTIVE</Badge>
                                     <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       className="h-6 w-6 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSlot(slot.id);
                                       }}
                                     >
                                        <Trash2 className="w-3.5 h-3.5" />
                                     </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-500">
                                     <UserIcon className="w-4 h-4" />
                                  </div>
                                  {teacher?.name || 'Assigned'}
                                </div>
                              </div>
                            ) : (
                              <button 
                                className="w-full min-h-[100px] rounded-[2rem] border-2 border-dashed border-slate-50 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all flex items-center justify-center group/btn"
                                onClick={() => {
                                   const [start, end] = timeRange.split(' - ');
                                   setFormData({ ...formData, dayOfWeek: day, startTime: start, endTime: end });
                                   setIsSlotDialogOpen(true);
                                }}
                              >
                                <Plus className="w-6 h-6 text-slate-100 group-hover/btn:text-indigo-300 transition-colors" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-[3rem] p-12 border-none shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4 text-3xl font-display font-bold text-slate-900 relative z-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                Configure Period
                <p className="text-sm font-medium text-slate-400 mt-1">Class {classes.find(c => c.id === selectedClass)?.name || 'Planning'}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-10 py-12 relative z-10">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Day</label>
                <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData({...formData, dayOfWeek: v})}>
                  <SelectTrigger className="bg-slate-50 border-none h-16 rounded-2xl font-bold px-6"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">{DAYS.map(d => <SelectItem key={d} value={d} className="font-bold py-3">{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Subject</label>
                <Input 
                  placeholder="e.g. Physics" 
                  value={formData.subject} 
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="bg-slate-50 border-none h-16 rounded-2xl font-bold px-6 focus:bg-white transition-all shadow-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Start Time</label>
                  <Input 
                    type="text"
                    placeholder="08:00 AM"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="bg-slate-50 border-none h-16 rounded-2xl font-bold px-6 focus:bg-white transition-all shadow-none"
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">End Time</label>
                  <Input 
                    type="text"
                    placeholder="09:00 AM"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="bg-slate-50 border-none h-16 rounded-2xl font-bold px-6 focus:bg-white transition-all shadow-none"
                  />
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Subject Teacher</label>
              <Select value={formData.teacherId} onValueChange={(v) => setFormData({...formData, teacherId: v})}>
                <SelectTrigger className="bg-slate-50 border-none h-16 rounded-2xl font-bold px-6"><SelectValue placeholder="Assign Faculty" /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {staff.filter(s => s.department === 'teaching').map(s => (
                    <SelectItem key={s.id} value={s.id} className="font-bold py-3">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="relative z-10 pt-4">
            <Button variant="ghost" onClick={() => setIsSlotDialogOpen(false)} className="rounded-2xl h-16 px-8 font-bold">Discard</Button>
            <Button onClick={handleAddSlot} disabled={isSaving} className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold h-16 px-10 shadow-2xl">
              {isSaving ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Plus className="mr-2 h-6 w-6" />}
              Create Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timetable;
