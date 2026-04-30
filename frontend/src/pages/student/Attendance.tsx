import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.uid}`);
      const sData = studentRes.data.data;
      setStudent(sData);

      if (sData?.id) {
        const attendanceRes = await api.get(`/attendance/student/${sData.id}`);
        setAttendance(attendanceRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const calculateStats = () => {
    const monthStr = currentMonth.toISOString().slice(0, 7);
    const monthRecords = attendance.filter(r => r.date.startsWith(monthStr));
    
    const present = monthRecords.filter(r => r.status === 'present').length;
    const late = monthRecords.filter(r => r.status === 'late').length;
    const absent = monthRecords.filter(r => r.status === 'absent').length;
    const total = monthRecords.length;
    
    const percentage = total > 0 ? ((present + (late * 0.5)) / total * 100).toFixed(1) : '0.0';
    
    return { present, absent, late, total, percentage };
  };

  const stats = calculateStats();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const startOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const startDay = startOfMonth(currentMonth);
    const calendarDays = [];

    // Padding for start of month
    for (let i = 0; i < startDay; i++) {
      calendarDays.push(<div key={`pad-${i}`} className="h-24 bg-slate-50/30 rounded-2xl" />);
    }

    for (let d = 1; d <= days; d++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = attendance.find(r => r.date === dateStr);
      
      let statusColor = 'bg-white border-slate-100 text-slate-400';
      let icon = null;

      if (record) {
        if (record.status === 'present') {
          statusColor = 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100';
          icon = <CheckCircle2 className="w-4 h-4" />;
        } else if (record.status === 'absent') {
          statusColor = 'bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-100';
          icon = <XCircle className="w-4 h-4" />;
        } else if (record.status === 'late') {
          statusColor = 'bg-amber-50 border-amber-100 text-amber-600 shadow-sm shadow-amber-100';
          icon = <Clock className="w-4 h-4" />;
        }
      }

      calendarDays.push(
        <div key={d} className={`h-24 p-3 rounded-[1.5rem] border transition-all hover:scale-105 cursor-pointer ${statusColor} group relative overflow-hidden`}>
          <div className="absolute top-2 right-3 font-display font-black text-xl opacity-20 group-hover:opacity-40">{d}</div>
          <div className="mt-8 flex flex-col gap-1 items-start">
             {icon}
             <span className="text-[10px] font-bold uppercase tracking-wider">{record?.status || 'No Data'}</span>
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Records...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Attendance History</h2>
          <p className="text-slate-500 font-medium mt-1">Reviewing presence records for <span className="text-primary font-bold">{student?.name}</span></p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full hover:bg-slate-50"><ChevronLeft className="w-5 h-5" /></Button>
          <span className="text-sm font-bold min-w-[140px] text-center uppercase tracking-widest text-slate-700">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full hover:bg-slate-50"><ChevronRight className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Analytics Card */}
        <div className="space-y-6">
           <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative p-8">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
             <div className="relative z-10">
               <TrendingUp className="w-8 h-8 text-emerald-400 mb-6" />
               <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Average</p>
               <h3 className="text-5xl font-display font-bold mt-2">{stats.percentage}%</h3>
               <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present</div>
                    <div className="text-2xl font-bold text-emerald-400">{stats.present}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absent</div>
                    <div className="text-2xl font-bold text-rose-400">{stats.absent}</div>
                  </div>
               </div>
             </div>
           </Card>

           <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
              <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Legend
              </h4>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
                    <span className="text-xs font-bold text-slate-600">Present</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600"><XCircle className="w-4 h-4" /></div>
                    <span className="text-xs font-bold text-slate-600">Absent</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Clock className="w-4 h-4" /></div>
                    <span className="text-xs font-bold text-slate-600">Late</span>
                 </div>
              </div>
           </Card>
        </div>

        {/* Calendar Grid */}
        <Card className="lg:col-span-3 border-none shadow-2xl rounded-[3rem] bg-white p-8 overflow-hidden">
           <div className="grid grid-cols-7 gap-4 mb-8">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
               <div key={day} className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 py-2">
                 {day}
               </div>
             ))}
           </div>
           <div className="grid grid-cols-7 gap-4">
              {renderCalendar()}
           </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentAttendance;
