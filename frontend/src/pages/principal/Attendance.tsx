import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  Bell, 
  Mail, 
  Loader2,
  Calendar,
  Filter,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

type ViewMode = 'overview' | 'teachers' | 'classes' | 'class-detail';

const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>('overview');
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [staff, setStaff] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>({
    students: 0,
    staff: 0,
    todayAttendance: '0.0'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, classesRes, statsRes] = await Promise.all([
        api.get(`/staff/school/${user.schoolId}`),
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/management/school-stats/${user.schoolId}`)
      ]);
      setStaff(staffRes.data.data || []);
      setClassesList(classesRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (date: string) => {
    try {
      const res = await api.get(`/attendance/school/${user.schoolId}?date=${date}`);
      setAttendanceRecords(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students/school/${user.schoolId}`);
      const classStudents = res.data.data.filter((s: any) => 
        s.grade?.toLowerCase().trim() === selectedClass?.name?.toLowerCase().trim()
      );
      setStudents(classStudents);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.schoolId) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (view !== 'overview') {
      fetchAttendance(selectedDate);
    }
  }, [view, selectedDate]);

  const getStatusBadge = (entityId: string, type: 'student' | 'staff') => {
    const record = attendanceRecords.find(r => 
      type === 'student' ? r.studentId === entityId : r.staffId === entityId
    );
    
    if (!record) return <Badge variant="outline" className="bg-slate-50 text-slate-400 border-dashed">Not Marked</Badge>;

    switch (record.status) {
      case 'present':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 font-bold">Present</Badge>;
      case 'absent':
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 py-1 font-bold">Absent</Badge>;
      case 'late':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 font-bold">Late</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400">Unknown</Badge>;
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <Card 
        className="group hover:shadow-2xl transition-all cursor-pointer border-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[2.5rem] p-4 relative overflow-hidden"
        onClick={() => setView('teachers')}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
        <CardContent className="pt-8 relative z-10">
          <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-3xl font-display font-bold mb-3 tracking-tight">Staff Attendance Log</h3>
          <p className="text-blue-100/80 mb-8 font-medium leading-relaxed">Review daily check-in records for all faculty and administrative members.</p>
          <div className="flex items-center gap-3 text-sm font-bold bg-white/15 w-fit px-5 py-2.5 rounded-2xl backdrop-blur-sm hover:bg-white/25 transition-colors">
            View History <ArrowUpRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      <Card 
        className="group hover:shadow-2xl transition-all cursor-pointer border-none bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-[2.5rem] p-4 relative overflow-hidden"
        onClick={() => setView('classes')}
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
        <CardContent className="pt-8 relative z-10">
          <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-3xl font-display font-bold mb-3 tracking-tight">Student History</h3>
          <p className="text-purple-100/80 mb-8 font-medium leading-relaxed">Access historical attendance data across all grades, sections and individual students.</p>
          <div className="flex items-center gap-3 text-sm font-bold bg-white/15 w-fit px-5 py-2.5 rounded-2xl backdrop-blur-sm hover:bg-white/25 transition-colors">
            Track Records <ArrowUpRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTeachers = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button variant="ghost" className="gap-2 w-fit rounded-xl hover:bg-slate-100" onClick={() => setView('overview')}>
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 w-44 rounded-xl border-slate-200 shadow-sm focus:ring-primary/20"
            />
          </div>
          <Button className="rounded-xl gap-2 shadow-sm" variant="outline">
            <TrendingUp className="w-4 h-4" /> Monthly Stats
          </Button>
          <Button className="rounded-xl gap-2 shadow-md bg-slate-900 text-white">
            <Mail className="w-4 h-4" /> Export PDF
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-display font-bold">Staff Presence Logs</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">Reviewing status for {new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Find a staff member..." 
                className="pl-11 rounded-2xl border-slate-100 bg-white shadow-inner h-12 focus:bg-slate-50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5 text-left w-[40%]">Faculty Information</th>
                  <th className="px-8 py-5 text-left">Department</th>
                  <th className="px-8 py-5 text-center">Final Status</th>
                  <th className="px-8 py-5 text-right">Log Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staff.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-sm">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{member.name}</div>
                          <div className="text-xs text-slate-400 font-medium">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant="outline" className="capitalize bg-white text-slate-500 font-bold text-[10px] px-2.5 border-slate-200">{member.department}</Badge>
                    </td>
                    <td className="px-8 py-5 text-center">
                      {getStatusBadge(member.id, 'staff')}
                    </td>
                    <td className="px-8 py-5 text-right font-mono text-xs text-slate-400">
                      {attendanceRecords.find(r => r.staffId === member.id) ? '08:45 AM' : '--:--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 rounded-xl" onClick={() => setView('overview')}>
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {classesList.map((cls) => (
          <Card 
            key={cls.id} 
            className="group hover:shadow-2xl transition-all cursor-pointer rounded-[2rem] border-none shadow-sm bg-white overflow-hidden relative"
            onClick={() => {
              setSelectedClass(cls);
              setView('class-detail');
              fetchStudents();
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
            <CardContent className="p-8 relative z-10">
              <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-display font-bold text-slate-900 mb-1">{cls.name}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Section {cls.section || 'A'}</p>
              <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                <div className="flex -space-x-2">
                   {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100" />)}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderClassDetail = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50" onClick={() => setView('classes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Class History: {selectedClass?.name}</h2>
            <p className="text-sm font-medium text-slate-500">Section {selectedClass?.section || 'A'} • Archive Records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 w-44 rounded-xl border-slate-200 shadow-sm"
            />
          </div>
          <Button className="rounded-xl gap-2 shadow-md bg-indigo-600">
             <Filter className="w-4 h-4" /> Custom Filter
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6 text-left">Student Profile</th>
                    <th className="px-10 py-6 text-left">Identity (Roll)</th>
                    <th className="px-10 py-6 text-center">Status</th>
                    <th className="px-10 py-6 text-right">Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student) => {
                    const statusRecord = attendanceRecords.find(r => r.studentId === student.id);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:scale-105 transition-transform">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-slate-500 font-mono text-xs">
                          {student.studentId}
                        </td>
                        <td className="px-10 py-6 text-center">
                          {getStatusBadge(student.id, 'student')}
                        </td>
                        <td className="px-10 py-6 text-right">
                          {statusRecord?.remarks ? (
                             <span className="text-xs text-slate-500 font-medium">{statusRecord.remarks}</span>
                          ) : (
                            <span className="text-xs text-slate-300 italic font-medium">Auto-recorded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                         <AlertTriangle className="w-10 h-10 text-amber-300 mx-auto mb-4" />
                         <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No student records found for this class.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Attendance Tracking</h2>
          <p className="text-slate-500 font-medium mt-1">Institutional presence history and real-time monitoring dashboard.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 text-indigo-700 rounded-[1.5rem] border border-indigo-50">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200" />
          <span className="text-xs font-bold uppercase tracking-widest">Network Synchronized</span>
        </div>
      </div>

      {view === 'overview' && renderOverview()}
      {view === 'teachers' && renderTeachers()}
      {view === 'classes' && renderClasses()}
      {view === 'class-detail' && renderClassDetail()}

      {/* Analytics Summary */}
      {view === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-none shadow-xl rounded-[2rem] bg-white p-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Institutional Average</span>
                <div className="bg-emerald-50 p-2 rounded-xl"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-display font-bold text-slate-900">{stats.todayAttendance}%</div>
                <span className="text-xs font-bold text-emerald-600">+1.2%</span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-400 leading-relaxed">Overall student presence for the current academic session.</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-xl rounded-[2rem] bg-white p-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Faculty Coverage</span>
                <div className="bg-blue-50 p-2 rounded-xl"><Users className="w-4 h-4 text-blue-600" /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-display font-bold text-slate-900">{stats.staff}</div>
                <span className="text-xs font-bold text-slate-400">Members</span>
              </div>
              <p className="mt-4 text-xs font-medium text-slate-400 leading-relaxed">Daily check-in logs processed from physical biometric terminal.</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2rem] bg-indigo-600 text-white p-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Pending Alerts</span>
                <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md"><Bell className="w-4 h-4" /></div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-display font-bold">124</div>
                <span className="text-xs font-bold text-indigo-200">Notified</span>
              </div>
              <p className="mt-4 text-xs font-medium text-indigo-100 leading-relaxed">Automated absence notifications sent to parents today.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Attendance;
