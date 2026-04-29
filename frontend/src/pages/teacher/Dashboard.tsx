import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    examsCount: 0,
    upcomingClasses: 0
  });
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Teacher Profile
      const profileRes = await api.get(`/staff/user/${user.uid}`);
      const teacherProfile = profileRes.data.data;
      
      // 2. Fetch Unified Dashboard Stats
      const statsRes = await api.get(`/staff/dashboard-stats/${teacherProfile.id}`);
      const { stats: dashboardStats, todaySchedule, assignedClasses: classesData } = statsRes.data.data;

      setStats(dashboardStats);
      setSchedule(todaySchedule);
      setAssignedClasses(classesData);

    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      toast.error('Failed to sync dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchTeacherData();
      // Polling for real-time sync (every 30 seconds)
      const interval = setInterval(fetchTeacherData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Hello, {user?.name}</h2>
          <p className="text-slate-500 font-medium mt-1">
            Teacher Portal • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button 
          className="rounded-2xl h-12 px-6 bg-slate-900 text-white font-bold gap-2 shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform"
          onClick={() => navigate('/teacher/attendance')}
        >
          <UserCheck className="w-4 h-4" /> Mark Today's Attendance
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'My Students', value: stats.totalStudents, icon: Users, color: 'bg-indigo-50 text-indigo-600', path: '/teacher/students' },
          { title: 'Present Today', value: stats.presentToday, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600', path: '/teacher/attendance' },
          { title: 'Exams', value: stats.examsCount, icon: AlertCircle, color: 'bg-amber-50 text-amber-600', path: '/teacher/examinations' },
          { title: 'Classes Today', value: stats.upcomingClasses, icon: BookOpen, color: 'bg-violet-50 text-violet-600', path: '/teacher/timetable' },
        ].map((stat, i) => (
          <Card 
            key={i} 
            className="border-none shadow-xl bg-white rounded-[2rem] hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
            onClick={() => navigate(stat.path)}
          >
            <CardContent className="p-6 text-center">
              <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
              <h3 className="text-3xl font-display font-bold text-slate-900 mt-1">{loading ? '...' : stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schedule */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-display font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                Today's Schedule
              </CardTitle>
              <Button 
                variant="ghost" 
                className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl"
                onClick={() => navigate('/teacher/timetable')}
              >
                View Full Timetable
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-4">
              {schedule.length > 0 ? (
                schedule.map((item, i) => {
                  const now = new Date();
                  const [startHour, startMin] = item.startTime.split(':');
                  const [endHour, endMin] = item.endTime.split(':');
                  const startTime = new Date(); startTime.setHours(parseInt(startHour), parseInt(startMin));
                  const endTime = new Date(); endTime.setHours(parseInt(endHour), parseInt(endMin));
                  
                  let status = 'upcoming';
                  if (now > endTime) status = 'completed';
                  else if (now >= startTime && now <= endTime) status = 'ongoing';

                  return (
                    <div key={i} className="flex items-center gap-6 p-5 rounded-[1.5rem] bg-slate-50 hover:bg-indigo-50/50 transition-all group">
                      <div className="w-24 text-center">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{item.startTime}</div>
                        <div className="text-[10px] font-medium text-slate-300 mt-1">{item.endTime}</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.subject}</h4>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{item.className}-{item.section} • {item.room || 'Room 101'}</p>
                      </div>
                      <Badge className={`rounded-xl px-4 py-1.5 border-none font-bold text-[10px] tracking-widest ${
                        status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        status === 'ongoing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 animate-pulse' :
                        'bg-slate-200 text-slate-500'
                      }`}>
                        {status.toUpperCase()}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                  <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                  <p className="font-medium">No classes scheduled for today.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Tools / Assigned Classes */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-display font-bold flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                Assigned Classes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                {assignedClasses.length > 0 ? (
                  assignedClasses.map((cls, i) => (
                    <div key={i} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-slate-900">{cls.className}</h4>
                        <Badge className="bg-indigo-600 text-white border-none px-3 py-1 rounded-lg text-[10px]">
                          {cls.students?.length || 0} Students
                        </Badge>
                      </div>
                      <div className="flex -space-x-3 overflow-hidden">
                        {cls.students?.slice(0, 6).map((s: any) => (
                          <div 
                            key={s.id} 
                            className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600"
                            title={s.name}
                          >
                            {s.name.split(' ').map((n: any) => n[0]).join('')}
                          </div>
                        ))}
                        {cls.students?.length > 6 && (
                          <div className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            +{cls.students.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold text-sm">No classes assigned.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Assignments managed by Principal</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative rounded-[2.5rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-display">Announcements</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm leading-relaxed">
                  Staff meeting at 4:00 PM today in the Conference Hall.
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm leading-relaxed">
                  Exam schedule for Grade 10 has been updated in the portal.
                </div>
                <Button 
                  variant="secondary" 
                  className="w-full font-bold h-12 rounded-xl bg-white text-primary hover:bg-slate-100"
                  onClick={() => toast.info('Announcements managed by Principal.')}
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
