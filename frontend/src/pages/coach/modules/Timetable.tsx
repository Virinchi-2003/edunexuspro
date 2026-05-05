import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User as UserIcon,
  Users,
  Loader2,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Check,
  X
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', 
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM'
];

const CoachTimetable: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, classRes, timetableRes, schoolRes, sportsRes] = await Promise.all([
        api.get(`/staff/user/${user.uid}`),
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/timetable/school/${user.schoolId}`),
        api.get(`/schools/${user.schoolId}`),
        api.get(`/coach/sports/${user.schoolId}`)
      ]);
      
      const prof = profileRes.data.data;
      setProfile(prof);
      setClasses(classRes.data.data || []);
      setSchoolInfo(schoolRes.data.data);
      setSports(sportsRes.data.data || []);
      
      const allTimetables = timetableRes.data.data || [];
      const processedSlots = allTimetables.reduce((acc: any[], t: any) => {
        const tSlots = (t.slots || []).map((s: any) => ({ 
          ...s, 
          classId: t.classId,
          className: getClassNameFromList(t.classId, classRes.data.data)
        }));
        return [...acc, ...tSlots];
      }, []);

      // Filter slots where this coach is assigned
      const coachSlots = processedSlots.filter((s: any) => s.teacherId === prof.id);
      
      // Sort slots by time for each day
      const sortedSlots = coachSlots.sort((a, b) => {
        const timeA = timeToMinutes(a.startTime);
        const timeB = timeToMinutes(b.startTime);
        return timeA - timeB;
      });

      setSlots(sortedSlots);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast.error('Failed to load your schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const getClassNameFromList = (classId: string, classList: any[]) => {
    const cls = classList.find(c => c.id === classId);
    return cls ? `${cls.name}-${cls.section}` : 'N/A';
  };

  const handleAddSession = () => {
    setSelectedSlot(null);
    setSelectedClassId('');
    setSubject(sports.length > 0 ? sports[0].name : 'Physical Education');
    setStartTime('08:00 AM');
    setEndTime('09:00 AM');
    setSelectedDay('Monday');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditSession = (session: any) => {
    setSelectedSlot(session);
    setSelectedClassId(session.classId);
    setSubject(session.subject);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setSelectedDay(session.dayOfWeek);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlot?.id) return;
    
    if (!confirm('Do you want to remove this training session?')) return;

    try {
      setSaving(true);
      await api.delete(`/timetable/slot/${selectedSlot.id}`);
      toast.success('Session removed successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove session');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSlot = async () => {
    if (!selectedClassId || !subject || !startTime || !endTime || !selectedDay) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      if (isEditing && selectedSlot?.id) {
        await api.delete(`/timetable/slot/${selectedSlot.id}`);
      }

      await api.post('/timetable/slot', {
        schoolId: user.schoolId,
        classId: selectedClassId,
        dayOfWeek: selectedDay,
        startTime: startTime,
        endTime: endTime,
        subject: subject,
        teacherId: profile.id
      });
      
      toast.success(isEditing ? 'Session updated successfully' : 'Session added successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const timeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Generating your planner...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Flexible Training Planner</h2>
          <p className="text-slate-500 font-medium mt-1">Define your own training hours and session durations.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleAddSession}
            className="rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 h-12 px-6 font-bold uppercase tracking-widest text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Training Session
          </Button>
          <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 text-indigo-700 rounded-[1.5rem] border border-indigo-50 h-12">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">{schoolInfo?.currentAcademicYear || '2026-27'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {DAYS.map(day => (
          <div key={day} className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-display font-bold text-slate-400 uppercase tracking-widest text-[10px]">{day}</h3>
              <Badge variant="outline" className="text-[9px] border-slate-100 text-slate-400">{slots.filter(s => s.dayOfWeek === day).length} Sessions</Badge>
            </div>
            
            <div className="space-y-4 min-h-[200px]">
              {slots.filter(s => s.dayOfWeek === day).length > 0 ? (
                slots.filter(s => s.dayOfWeek === day).map(session => (
                  <Card 
                    key={session.id}
                    onClick={() => handleEditSession(session)}
                    className="group relative border-none shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer bg-white rounded-[2rem] overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{session.startTime}</div>
                      </div>
                      <div className="font-bold text-slate-900 mb-1">{session.subject}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Class {session.className}</div>
                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-bold">
                          {Math.round((timeToMinutes(session.endTime) - timeToMinutes(session.startTime)))} Mins
                        </Badge>
                        <div className="text-[9px] font-bold text-slate-300 uppercase">to {session.endTime}</div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="h-full border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center opacity-50">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5 text-slate-200" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Sessions</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assignment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-slate-900">
              {isEditing ? 'Modify Session' : 'New Training Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Start Time</label>
                <Input 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="08:00 AM"
                  className="rounded-2xl border-slate-100 h-14 font-bold text-slate-700 bg-slate-50/50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">End Time</label>
                <Input 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="09:30 AM"
                  className="rounded-2xl border-slate-100 h-14 font-bold text-slate-700 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Day of Week</label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="rounded-2xl border-slate-100 h-14 bg-slate-50/50 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assign to Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger className="rounded-2xl border-slate-100 h-14 bg-slate-50/50 font-bold">
                  <SelectValue placeholder="Select class..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>Class {cls.name}-{cls.section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sport / Activity</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="rounded-2xl border-slate-100 h-14 bg-slate-50/50 font-bold">
                  <SelectValue placeholder="Select activity..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {sports.length > 0 ? (
                    sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.name}>{sport.name}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Physical Education">Physical Education</SelectItem>
                      <SelectItem value="Football">Football</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:justify-between pt-4">
            {isEditing ? (
              <Button 
                variant="ghost" 
                onClick={handleDeleteSlot} 
                disabled={saving}
                className="rounded-2xl font-bold uppercase tracking-widest text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 h-14 px-8"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-2xl font-bold uppercase tracking-widest text-[10px] h-14 px-8">Cancel</Button>
            )}
            
            <Button 
              onClick={handleSaveSlot} 
              disabled={saving}
              className="rounded-2xl bg-primary text-white font-bold uppercase tracking-widest text-[10px] px-10 h-14 shadow-lg shadow-primary/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Save Changes' : 'Add Session')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachTimetable;
