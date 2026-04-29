import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User as UserIcon,
  Users,
  Loader2,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIMES = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM'
];

const TeacherTimetable: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, classRes, timetableRes, schoolRes] = await Promise.all([
        api.get(`/staff/user/${user.uid}`),
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/timetable/school/${user.schoolId}`),
        api.get(`/schools/${user.schoolId}`)
      ]);
      
      const profile = profileRes.data.data;
      setClasses(classRes.data.data || []);
      setSchoolInfo(schoolRes.data.data);
      
      const allTimetables = timetableRes.data.data || [];
      const processedSlots = allTimetables.reduce((acc: any[], t: any) => {
        const tSlots = (t.slots || []).map((s: any) => ({ ...s, classId: t.classId }));
        return [...acc, ...tSlots];
      }, []);

      // Filter slots where this teacher is assigned
      const teacherSlots = processedSlots.filter((s: any) => s.teacherId === profile.id);
      setSlots(teacherSlots);
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

  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.name}-${cls.section}` : 'N/A';
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Generating your schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">My Timetable</h2>
          <p className="text-slate-500 font-medium mt-1">Review your weekly teaching schedule and class assignments.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 text-indigo-700 rounded-[1.5rem] border border-indigo-50">
          <Calendar className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Academic Session {schoolInfo?.currentAcademicYear || '2026-27'}</span>
        </div>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-6 bg-slate-50/80 border-b border-r border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] w-36 text-center">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-6 bg-slate-50/80 border-b border-slate-100 text-slate-700 font-bold text-[11px] uppercase tracking-[0.1em] min-w-[180px] text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMES.map(time => (
                  <tr key={time} className="group/row">
                    <td className="p-6 bg-slate-50/30 border-r border-b border-slate-100 text-slate-500 font-bold text-[11px] uppercase text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {time}
                      </div>
                    </td>
                    {DAYS.map(day => {
                      const slot = slots.find(s => s.dayOfWeek === day && s.startTime === time);

                      return (
                        <td key={`${day}-${time}`} className="p-3 border-b border-r border-slate-100 last:border-r-0">
                          {slot ? (
                            <div className="group relative p-5 rounded-[2rem] bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 hover:scale-[1.02] transition-all cursor-default">
                              <div className="font-bold text-base mb-1">{slot.subject}</div>
                              <div className="flex items-center gap-2 text-[10px] text-indigo-100 font-bold uppercase tracking-widest mb-3">
                                <Users className="w-3 h-3" /> Class {getClassName(slot.classId)}
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                                <Badge className="bg-white/20 hover:bg-white/30 border-none text-[8px] font-bold">Room 302</Badge>
                                <ArrowRight className="w-3 h-3 text-white/40" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-50 flex items-center justify-center">
                              <span className="text-[10px] text-slate-200 font-bold uppercase tracking-widest">Free Period</span>
                            </div>
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
      
      {/* Legend / Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none shadow-xl bg-white rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <BookOpen className="w-6 h-6" />
               </div>
               <div>
                  <div className="text-2xl font-display font-bold text-slate-900">{slots.length}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Weekly Periods</div>
               </div>
            </div>
         </Card>
         <Card className="border-none shadow-xl bg-white rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="w-6 h-6" />
               </div>
               <div>
                  <div className="text-2xl font-display font-bold text-slate-900">~24h</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Lecture Hours</div>
               </div>
            </div>
         </Card>
         <Card className="border-none shadow-xl bg-white rounded-[2rem] p-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <UserIcon className="w-6 h-6" />
               </div>
               <div>
                  <div className="text-2xl font-display font-bold text-slate-900">{Array.from(new Set(slots.map(s => s.classId))).length}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Different Classes</div>
               </div>
            </div>
         </Card>
      </div>
    </div>
  );
};

export default TeacherTimetable;
