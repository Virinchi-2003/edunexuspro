import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    assignmentsPending: 4,
    upcomingClasses: 3
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        setLoading(true);
        // In a real app, we'd fetch specific teacher stats
        // For now, let's get general class stats if available
        const res = await api.get(`/management/school-stats/${user.schoolId}`);
        const s = res.data.data;
        setStats(prev => ({
          ...prev,
          totalStudents: s.students || 0,
          presentToday: Math.round((s.students || 0) * (parseFloat(s.todayAttendance) / 100))
        }));
      } catch (error) {
        console.error('Error fetching teacher stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherData();
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Hello, {user?.name}</h2>
          <p className="text-slate-500">Teacher Portal • Class 10-A • Monday, April 28</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <UserCheck className="w-4 h-4" /> Mark Today's Attendance
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'My Students', value: stats.totalStudents, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { title: 'Present Today', value: stats.presentToday, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { title: 'Pending Tasks', value: stats.assignmentsPending, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' },
          { title: 'Classes Today', value: stats.upcomingClasses, icon: BookOpen, color: 'bg-indigo-50 text-indigo-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '09:00 AM', subject: 'Mathematics', class: '10-A', room: 'Room 302', status: 'completed' },
                { time: '11:30 AM', subject: 'Advanced Algebra', class: '12-B', room: 'Lab 1', status: 'ongoing' },
                { time: '02:00 PM', subject: 'Basic Geometry', class: '9-C', room: 'Room 205', status: 'upcoming' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-20 text-sm font-bold text-slate-400">{item.time}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{item.subject}</h4>
                    <p className="text-xs text-slate-500">{item.class} • {item.room}</p>
                  </div>
                  <Badge className={
                    item.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    item.status === 'ongoing' ? 'bg-primary text-white animate-pulse' :
                    'bg-slate-200 text-slate-600'
                  }>
                    {item.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Tools */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-white overflow-hidden relative">
            <CardHeader>
              <CardTitle className="text-lg">Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm">
                  Staff meeting at 4:00 PM today in the Conference Hall.
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm">
                  Exam schedule for Grade 10 has been updated in the portal.
                </div>
                <Button variant="secondary" className="w-full font-bold">Post New</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
