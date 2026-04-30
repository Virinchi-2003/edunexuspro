import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Calendar,
  Clock,
  Trophy,
  FileText,
  Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    reason: '',
    startDate: '',
    endDate: ''
  });

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      // 1. Fetch Student Profile using user UID
      const studentRes = await api.get(`/students/user/${user.uid}`);
      const sData = studentRes.data.data;
      if (!sData) {
        toast.error('Student profile not found');
        return;
      }
      setStudent(sData);

      // 2. Fetch all portal data in parallel only if we have IDs
      const fetchers = [];
      if (sData.id) fetchers.push(api.get(`/portal/dashboard/${sData.id}`));
      if (sData.classId) fetchers.push(api.get(`/students/homework/${sData.classId}`));
      if (sData.id) fetchers.push(api.get(`/students/leave/${sData.id}`));
      if (sData.id) fetchers.push(api.get(`/exams/marks/student/${sData.id}`));

      const results = await Promise.all(fetchers);
      
      // Map results back to state
      let resIdx = 0;
      if (sData.id) setStats(results[resIdx++].data.data);
      if (sData.classId) setHomeworkList(results[resIdx++].data.data || []);
      if (sData.id) setLeaves(results[resIdx++].data.data || []);
      if (sData.id) setPerformance(results[resIdx++].data.data || []);

    } catch (error) {
      console.error('Error fetching student data:', error);
      // Don't toast on polling errors unless it's the first load
      if (!student) toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchData();
      // Near real-time sync via polling
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleApplyLeave = async () => {
    if (!leaveForm.reason || !leaveForm.startDate || !leaveForm.endDate) {
      toast.error('Please fill all leave details');
      return;
    }
    try {
      await api.post('/students/leave', {
        ...leaveForm,
        studentId: student.id,
        schoolId: student.schoolId
      });
      toast.success('Leave request submitted successfully');
      setLeaveForm({ reason: '', startDate: '', endDate: '' });
      fetchData(); // Refresh list
    } catch (error) {
      toast.error('Failed to submit leave request');
    }
  };

  if (loading && !student) {
    return <div className="flex items-center justify-center min-h-[400px]"><Clock className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Student Portal</h2>
          <p className="text-slate-500 font-medium mt-1">
            {student?.name} • Class {student?.grade}-{student?.section}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Quick Stats */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-emerald-500 text-white p-2">
          <CardContent className="p-6">
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Calendar className="w-5 h-5" /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-100">Attendance</p>
            <h3 className="text-3xl font-bold mt-1 capitalize">{stats?.attendance?.status || 'Present'}</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-blue-500 text-white p-2">
          <CardContent className="p-6">
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><BookOpen className="w-5 h-5" /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Homework</p>
            <h3 className="text-3xl font-bold mt-1">{stats?.pendingHomeworkCount || 0} Pending</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-amber-500 text-white p-2">
          <CardContent className="p-6">
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Trophy className="w-5 h-5" /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-100">Performance</p>
            <h3 className="text-3xl font-bold mt-1">{stats?.averagePerformance || '0.0'}%</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-indigo-500 text-white p-2">
          <CardContent className="p-6">
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Clock className="w-5 h-5" /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">ID Number</p>
            <h3 className="text-3xl font-bold mt-1">{student?.studentId}</h3>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="homework" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-8 h-14">
          <TabsTrigger value="homework" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12">Homework</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12">Attendance</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12">Performance</TabsTrigger>
          <TabsTrigger value="leave" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white h-12">Leave Request</TabsTrigger>
        </TabsList>

        <TabsContent value="homework" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {homeworkList.map((hw, idx) => (
              <Card key={idx} className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <Badge className="bg-blue-50 text-blue-600 border-none px-4 py-1.5 rounded-full font-bold">{hw.subject}</Badge>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> Due: {hw.dueDate}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{hw.title}</h4>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-6">{hw.description}</p>
                  <Button className="w-full rounded-2xl h-12 font-bold group-hover:scale-105 transition-transform">Submit Homework</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attendance">
           <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
              <CardHeader className="p-8 pb-0">
                <CardTitle>Monthly Attendance Records</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                 <div className="text-center py-20 text-slate-400 italic">
                    Detailed attendance calendar view coming soon. Currently marked as <span className="font-bold text-emerald-500">Present</span> for today.
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="performance">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {performance.map((record, idx) => (
                <Card key={idx} className="border-none shadow-lg rounded-[2.5rem] bg-white">
                   <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                         <FileText className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-slate-900">{record.examSchedule?.subject}</h4>
                      <div className="text-4xl font-display font-black text-primary mt-2">{record.marksObtained}/{record.totalMarks}</div>
                      <Badge className="mt-4 bg-emerald-100 text-emerald-700 border-none">Grade: {record.grade || 'A'}</Badge>
                   </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="leave">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 border-none shadow-xl rounded-[2.5rem] bg-white">
              <CardHeader className="p-8">
                <CardTitle className="text-xl">Apply for Leave</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Reason for Leave</label>
                  <Input 
                    placeholder="Medical, Family Event, etc." 
                    className="rounded-xl h-12 bg-slate-50 border-none"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                  <Input 
                    type="date" 
                    className="rounded-xl h-12 bg-slate-50 border-none"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">End Date</label>
                  <Input 
                    type="date" 
                    className="rounded-xl h-12 bg-slate-50 border-none"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                  />
                </div>
                <Button onClick={handleApplyLeave} className="w-full rounded-2xl h-14 font-bold mt-4 shadow-lg shadow-primary/20 gap-2">
                  <Send className="w-4 h-4" /> Submit Application
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
               <CardHeader className="p-8 border-b border-slate-50">
                  <CardTitle>Previous Requests</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  {leaves.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 italic">No leave history found.</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {leaves.map((leave, idx) => (
                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                                leave.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                 <Clock className="w-6 h-6" />
                              </div>
                              <div>
                                 <div className="font-bold text-slate-900">{leave.reason}</div>
                                 <div className="text-xs text-slate-400 font-medium">{leave.startDate} to {leave.endDate}</div>
                              </div>
                           </div>
                           <Badge className={`rounded-full px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest border-none ${
                             leave.status === 'approved' ? 'bg-emerald-500 text-white' : 
                             leave.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                           }`}>
                             {leave.status}
                           </Badge>
                        </div>
                      ))}
                    </div>
                  )}
               </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
