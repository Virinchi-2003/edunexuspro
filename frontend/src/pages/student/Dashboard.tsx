import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  BookOpen, 
  Calendar,
  CreditCard,
  Bell,
  Download,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Clock,
  Layout
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const studentRes = await api.get(`/students/user/${user.id}`);
        const sData = studentRes.data.data;
        setStudent(sData);

        if (sData?.id) {
          const statsRes = await api.get(`/portal/dashboard/${sData.id}`);
          setStats(statsRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchData();
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Welcome, {student?.name || 'Student'}</h2>
          <p className="text-slate-500 font-medium mt-1">Student Portal • {student?.grade}-{student?.section} • Session 2024-25</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-bold uppercase tracking-widest">Active Status</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden relative group">
          <div className="h-32 bg-gradient-to-br from-indigo-600 to-violet-700" />
          <CardContent className="pt-0 -mt-16 text-center relative z-10">
            <div className="w-32 h-32 rounded-[2rem] border-8 border-white bg-slate-50 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
              <User className="w-16 h-16 text-slate-300" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900">{student?.name}</h3>
            <p className="text-sm text-slate-400 font-mono font-bold tracking-widest mt-1">ID: {student?.studentId}</p>
            <div className="mt-6 flex flex-col gap-2">
              <div className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">Class {student?.grade}-{student?.section}</div>
              <div className="px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 border border-slate-100">Blood Group: {student?.bloodGroup || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Stats */}
        <div className="md:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Calendar className="w-5 h-5" /></div>
                   <Badge className="bg-white/20 text-white border-none">Month</Badge>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Attendance</p>
                <h3 className="text-4xl font-display font-bold mt-1">{stats?.attendance?.status === 'present' ? 'Present' : stats?.attendance?.status || '94.5%'}</h3>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-100">
                  <CheckCircle2 className="w-3 h-3" /> {stats?.attendance?.status === 'present' ? 'Marked for today' : 'Not marked yet'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Trophy className="w-5 h-5" /></div>
                   <Badge className="bg-white/20 text-white border-none">Term 1</Badge>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Performance</p>
                <h3 className="text-4xl font-display font-bold mt-1">{stats?.averagePerformance || 'A+'}%</h3>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-100">
                  <CheckCircle2 className="w-3 h-3" /> Average Score
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-amber-500 to-orange-600 text-white p-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                   <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><BookOpen className="w-5 h-5" /></div>
                   <Badge className="bg-white/20 text-white border-none">Pending</Badge>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-100">Homework</p>
                <h3 className="text-4xl font-display font-bold mt-1">{stats?.pendingHomeworkCount || '04'}</h3>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-100">
                  <Clock className="w-3 h-3" /> Need Submission
                </div>
              </CardContent>
            </Card>
          </div>

          {/* B3 AI Early Warning System */}
          {stats?.aiFlags?.length > 0 && (
            <Card className="border-none shadow-xl rounded-[2rem] bg-rose-50 border-2 border-rose-100 overflow-hidden">
               <CardContent className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500 text-white flex items-center justify-center animate-pulse">
                     <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-lg font-bold text-rose-900">AI Performance Warning</h4>
                     <p className="text-rose-600 font-medium text-sm">{stats.aiFlags[0].message}</p>
                  </div>
                  <Button className="rounded-xl bg-rose-900 hover:bg-rose-800 text-white font-bold">Take Action</Button>
               </CardContent>
            </Card>
          )}

          {/* Recent Updates */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <CardTitle className="text-xl font-display font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary"><Bell className="w-5 h-5" /></div>
                Recent Activities & Notices
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="space-y-4">
                {[
                  { title: 'Mathematics Homework Assigned', time: '2 hours ago', type: 'homework', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
                  { title: 'Attendance Marked: Present', time: '5 hours ago', type: 'attendance', icon: Calendar, color: 'text-emerald-500 bg-emerald-50' },
                  { title: 'New Performance Report Generated', time: '1 day ago', type: 'performance', icon: Trophy, color: 'text-amber-500 bg-amber-50' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-400 font-medium">{item.time}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                       <Layout className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
