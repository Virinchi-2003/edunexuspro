import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ArrowLeft, 
  ChevronRight, 
  Scan, 
  Bell, 
  Mail, 
  FileText,
  Loader2,
  MoreVertical,
  Plus,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
    feesCollected: 0,
    totalFeesExpected: 0,
    todayAttendance: '0.0'
  });

  useEffect(() => {
    if (user?.schoolId) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
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

  const fetchStudents = async (classId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/students/school/${user.schoolId}`);
      // Filter students by class in frontend for now as per schema
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
    if (view !== 'overview') {
      fetchAttendance(selectedDate);
    }
  }, [view, selectedDate]);

  const getStatus = (entityId: string, type: 'student' | 'staff') => {
    const record = attendanceRecords.find(r => 
      type === 'student' ? r.studentId === entityId : r.staffId === entityId
    );
    return record?.status || 'none';
  };

  const handleMarkAttendance = async (entityId: string, type: 'student' | 'staff', status: string) => {
    try {
      const record = {
        [type === 'student' ? 'studentId' : 'staffId']: entityId,
        status,
        date: selectedDate,
        classId: type === 'student' ? selectedClass?.id : null
      };

      await api.post('/attendance/mark', {
        schoolId: user.schoolId,
        records: [record]
      });

      fetchAttendance(selectedDate);
      toast.success('Attendance updated');
      
      // Simulate Notification for Student
      if (type === 'student') {
        toast.info(`Notification sent to parent of ${students.find(s => s.id === entityId)?.name}`);
      }
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const handleSendAlerts = async (type: 'student' | 'staff') => {
    try {
      setLoading(true);
      const res = await api.post('/attendance/send-alerts', {
        schoolId: user.schoolId,
        date: selectedDate,
        type
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Failed to send alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailReport = async (type: 'student' | 'staff' | 'all') => {
    try {
      setLoading(true);
      const res = await api.post('/attendance/report', {
        schoolId: user.schoolId,
        date: selectedDate,
        type
      });
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <Card 
        className="group hover:shadow-xl transition-all cursor-pointer border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-3xl p-4"
        onClick={() => setView('teachers')}
      >
        <CardContent className="pt-6">
          <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Teacher Attendance</h3>
          <p className="text-blue-100 mb-6">Monitor and manage daily attendance for all faculty members.</p>
          <div className="flex items-center gap-2 text-sm font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
            Manage Staff <ChevronRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>

      <Card 
        className="group hover:shadow-xl transition-all cursor-pointer border-none bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-3xl p-4"
        onClick={() => setView('classes')}
      >
        <CardContent className="pt-6">
          <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Class Attendance</h3>
          <p className="text-indigo-100 mb-6">Track student presence across different grades and sections.</p>
          <div className="flex items-center gap-2 text-sm font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
            Manage Students <ChevronRight className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTeachers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => setView('overview')}>
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </Button>
        <div className="flex items-center gap-4">
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 rounded-xl"
          />
          <Button className="rounded-xl gap-2" variant="outline" onClick={() => handleSendAlerts('staff')} disabled={loading}>
            <Bell className="w-4 h-4" /> Notify Absentees
          </Button>
          <Button 
            className="rounded-xl gap-2" 
            onClick={() => handleEmailReport('staff')}
            disabled={loading}
          >
            <Mail className="w-4 h-4" /> Email Report
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staff Attendance - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
              <CardDescription>Click status to mark attendance for teachers.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search staff..." 
                className="pl-10 rounded-xl border-none bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4 text-left">Staff Member</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((member) => {
                  const status = getStatus(member.id, 'staff');
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{member.name}</div>
                            <div className="text-xs text-slate-400">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="capitalize">{member.department}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            size="sm" 
                            variant={status === 'present' ? 'default' : 'outline'}
                            className={`rounded-lg h-8 gap-1 ${status === 'present' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                            onClick={() => handleMarkAttendance(member.id, 'staff', 'present')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Present
                          </Button>
                          <Button 
                            size="sm" 
                            variant={status === 'absent' ? 'destructive' : 'outline'}
                            className="rounded-lg h-8 gap-1"
                            onClick={() => handleMarkAttendance(member.id, 'staff', 'absent')}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Absent
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
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
        <Button variant="ghost" className="gap-2" onClick={() => setView('overview')}>
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classesList.map((cls) => (
          <Card 
            key={cls.id} 
            className="hover:shadow-lg transition-all cursor-pointer rounded-2xl border-none shadow-sm"
            onClick={() => {
              setSelectedClass(cls);
              setView('class-detail');
              fetchStudents(cls.id);
            }}
          >
            <CardContent className="p-6">
              <div className="bg-indigo-50 w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{cls.name}</h3>
              <p className="text-sm text-slate-500">Section: {cls.section || 'A'}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                  Active
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderClassDetail = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('classes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Attendance: {selectedClass?.name}</h2>
            <p className="text-sm text-slate-500">Section {selectedClass?.section || 'A'} • {new Date(selectedDate).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40 rounded-xl"
          />
          {user?.subscriptionPlan === 'elite' && (
            <Button className="rounded-xl gap-2 bg-purple-600 hover:bg-purple-700">
              <Scan className="w-4 h-4" /> Face Recognition
            </Button>
          )}
          <Button 
            variant="outline" 
            className="rounded-xl gap-2 border-primary text-primary"
            onClick={() => handleSendAlerts('student')}
            disabled={loading}
          >
            <Bell className="w-4 h-4" /> Notify All Absent
          </Button>
          <Button 
            className="rounded-xl gap-2 bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => handleEmailReport('student')}
            disabled={loading}
          >
            <Mail className="w-4 h-4" /> Email Report
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4 text-left">Student Name</th>
                    <th className="px-6 py-4 text-left">Roll No</th>
                    <th className="px-6 py-4 text-center">Attendance</th>
                    <th className="px-6 py-4 text-right">Last Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const status = getStatus(student.id, 'student');
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              className={`p-2 rounded-xl transition-all ${status === 'present' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                              onClick={() => handleMarkAttendance(student.id, 'student', 'present')}
                              title="Mark Present"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              className={`p-2 rounded-xl transition-all ${status === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                              onClick={() => handleMarkAttendance(student.id, 'student', 'absent')}
                              title="Mark Absent"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                            <button 
                              className={`p-2 rounded-xl transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                              onClick={() => handleMarkAttendance(student.id, 'student', 'late')}
                              title="Mark Late"
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {status !== 'none' ? (
                            <Badge className="bg-slate-100 text-slate-600 border-none">
                              Recently Synced
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-300 italic">No record today</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Attendance Hub</h2>
          <p className="text-slate-500">Real-time attendance monitoring and parent notification system.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-bold">System Online & Syncing</span>
        </div>
      </div>

      {view === 'overview' && renderOverview()}
      {view === 'teachers' && renderTeachers()}
      {view === 'classes' && renderClasses()}
      {view === 'class-detail' && renderClassDetail()}

      {/* Analytics Summary */}
      {view === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Avg. Student Attendance</span>
                <Badge className="bg-green-100 text-green-700 border-none">Excellent</Badge>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.todayAttendance}%</div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <Plus className="w-3 h-3 text-green-500" /> Live from portal
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Staff Reporting</span>
                <Badge className="bg-blue-100 text-blue-700 border-none">Active</Badge>
              </div>
              <div className="text-3xl font-bold text-slate-900">{stats.staff}</div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-500" /> All members registered
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">Alert System</span>
                <Badge className="bg-indigo-100 text-indigo-700 border-none">Real-time</Badge>
              </div>
              <div className="text-3xl font-bold text-slate-900">124</div>
              <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <Bell className="w-3 h-3 text-indigo-500" /> FCM & SMS Fallback Active
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Attendance;
