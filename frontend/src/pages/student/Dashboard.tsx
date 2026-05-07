import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Upload, 
  Trash2, 
  MessageSquare, 
  AlertCircle,
  BookOpen, 
  Calendar,
  Clock,
  Trophy,
  FileText,
  Send,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import AnnouncementBoard from '@/components/AnnouncementBoard';
import QRCode from 'qrcode';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataURL, setQrDataURL] = useState<string>('');
  
  // Homework Submission State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState({
    content: '',
    attachments: ''
  });

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
      const studentRes = await api.get(`/students/user/${user.uid}`);
      const sData = studentRes.data.data;
      if (!sData) {
        toast.error('Student profile not found');
        return;
      }
      setStudent(sData);

      const results = await Promise.all([
        sData.id ? api.get(`/portal/dashboard/${sData.id}`).catch(() => ({ data: { data: null } })) : null,
        sData.classId ? api.get(`/student/homework-list/${sData.classId}?studentId=${sData.id}`).catch(() => ({ data: { data: [] } })) : null,
        sData.id ? api.get(`/students/leave/${sData.id}`).catch(() => ({ data: { data: [] } })) : null,
        sData.id ? api.get(`/exams/marks/student/${sData.id}`).catch(() => ({ data: { data: [] } })) : null,
      ]);
      
      setStats(results[0]?.data.data || null);
      setHomeworkList(results[1]?.data.data || []);
      setLeaves(results[2]?.data.data || []);
      setPerformance(results[3]?.data.data || []);

    } catch (error) {
      console.error('Error fetching student data:', error);
      if (!student) toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const base64Data = event.target.result;
      setSubmissionData(prev => ({
        ...prev,
        attachments: JSON.stringify({
          name: file.name,
          type: file.type,
          data: base64Data
        })
      }));
      toast.success('File attached');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitHomework = async () => {
    if (!submissionData.content.trim()) {
      return toast.error('Please provide submission content');
    }
    try {
      setIsSubmitting(true);
      await api.post('/student/homework/submit', {
        ...submissionData,
        homeworkId: selectedHomework.id,
        studentId: student.id
      });
      toast.success('Homework submitted!');
      setIsSubmitOpen(false);
      setSubmissionData({ content: '', attachments: '' });
      fetchData();
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (student) {
      const generateQR = async () => {
        try {
          const payload = JSON.stringify({
            type: 'student',
            studentId: student.studentId,
            class: `${student.grade}-${student.section}`,
            schoolId: student.schoolId
          });
          const url = await QRCode.toDataURL(payload, {
            width: 300,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' }
          });
          setQrDataURL(url);
        } catch (err) {
          console.error('QR Generation Error:', err);
        }
      };
      generateQR();
    }
  }, [student]);

  useEffect(() => {
    if (user?.uid) {
      fetchData();
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
      fetchData();
    } catch (error) {
      toast.error('Failed to submit leave request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <Badge className="bg-blue-100 text-blue-600 border-none">Submitted</Badge>;
      case 'reviewed': return <Badge className="bg-emerald-100 text-emerald-600 border-none">Reviewed</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-600 border-none">Pending</Badge>;
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
            <h3 className="text-3xl font-bold mt-1">{homeworkList.filter(h => h.submissionStatus === 'pending').length} Pending</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-amber-500 text-white p-2">
          <CardContent className="p-6">
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4"><Trophy className="w-5 h-5" /></div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-100">Performance</p>
            <h3 className="text-3xl font-bold mt-1">{stats?.averagePerformance || '0.0'}%</h3>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-slate-900 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all" />
          <CardContent className="p-6 flex flex-col items-center justify-center relative z-10">
             {student?.id ? (
               <div className="space-y-3 flex flex-col items-center">
                  <div className="bg-white p-2 rounded-2xl shadow-lg hover:scale-105 transition-transform duration-500">
                    {qrDataURL ? (
                      <img src={qrDataURL} className="w-24 h-24 rounded-lg" alt="Digital ID QR" />
                    ) : (
                      <div className="w-24 h-24 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Institutional Digital ID</p>
                    <h4 className="text-sm font-bold text-white mt-0.5">{student?.studentId}</h4>
                    <button 
                      onClick={async () => {
                        if (!qrDataURL) return;
                        const link = document.createElement('a');
                        link.href = qrDataURL;
                        link.download = `QR_ID_${student.studentId}.png`;
                        link.click();
                        toast.success('QR ID downloaded');
                      }}
                      className="mt-2 text-[8px] font-bold uppercase tracking-tighter text-indigo-400 hover:text-white transition-colors"
                    >
                      Download For Print
                    </button>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-2">
                 <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
                 <p className="text-[10px] font-bold text-slate-500">Generating ID...</p>
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnnouncementBoard limit={3} />
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
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Clock className="w-3.5 h-3.5" /> Due: {hw.dueDate}
                      </div>
                      {getStatusBadge(hw.submissionStatus)}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{hw.title}</h4>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-6">{hw.description}</p>
                  
                  {hw.feedback && (
                    <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border-l-4 border-emerald-400">
                      <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Teacher Feedback
                      </p>
                      <p className="text-emerald-600 text-sm italic font-medium">"{hw.feedback}"</p>
                    </div>
                  )}

                  <Button 
                    onClick={() => {
                      setSelectedHomework(hw);
                      setIsSubmitOpen(true);
                      setSubmissionData({ content: hw.submissionContent || '', attachments: hw.submissionAttachments || '' });
                    }}
                    className={`w-full rounded-2xl h-12 font-bold group-hover:scale-105 transition-transform ${
                      hw.submissionId ? 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600' : 'bg-slate-900 text-white'
                    }`}
                  >
                    {hw.submissionId ? 'View / Update Submission' : 'Submit Homework'}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {homeworkList.length === 0 && (
              <div className="md:col-span-2 py-20 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No homework assigned yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="attendance">
           <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
              <CardHeader className="p-8 pb-0"><CardTitle>Monthly Attendance Records</CardTitle></CardHeader>
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
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8" /></div>
                      <h4 className="font-bold text-slate-900">{record.examSchedule?.subject}</h4>
                      <div className="text-4xl font-display font-black text-primary mt-2">{record.marksObtained}/{record.totalMarks}</div>
                      <Badge className="mt-4 bg-emerald-100 text-emerald-700 border-none">Grade: {record.grade || 'A'}</Badge>
                   </CardContent>
                </Card>
              ))}
              {performance.length === 0 && (
                <div className="md:col-span-3 py-20 text-center bg-slate-50/50 rounded-[2.5rem]">
                  <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium">No performance records found.</p>
                </div>
              )}
           </div>
        </TabsContent>

        <TabsContent value="leave">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="md:col-span-1 border-none shadow-xl rounded-[2.5rem] bg-white">
              <CardHeader className="p-8"><CardTitle className="text-xl">Apply for Leave</CardTitle></CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Reason for Leave</label>
                  <Input placeholder="Medical, Family Event, etc." className="rounded-xl h-12 bg-slate-50 border-none" value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                  <Input type="date" className="rounded-xl h-12 bg-slate-50 border-none" value={leaveForm.startDate} onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">End Date</label>
                  <Input type="date" className="rounded-xl h-12 bg-slate-50 border-none" value={leaveForm.endDate} onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})} />
                </div>
                <Button onClick={handleApplyLeave} className="w-full rounded-2xl h-14 font-bold mt-4 shadow-lg shadow-primary/20 gap-2"><Send className="w-4 h-4" /> Submit Application</Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
               <CardHeader className="p-8 border-b border-slate-50"><CardTitle>Previous Requests</CardTitle></CardHeader>
               <CardContent className="p-0">
                  {leaves.length === 0 ? (
                    <div className="p-20 text-center text-slate-400 italic">No leave history found.</div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {leaves.map((leave, idx) => (
                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : leave.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}><Clock className="w-6 h-6" /></div>
                              <div>
                                 <div className="font-bold text-slate-900">{leave.reason}</div>
                                 <div className="text-xs text-slate-400 font-medium">{leave.startDate} to {leave.endDate}</div>
                              </div>
                           </div>
                           <Badge className={`rounded-full px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest border-none ${leave.status === 'approved' ? 'bg-emerald-500 text-white' : leave.status === 'rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>{leave.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
               </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Homework Dialog */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
           <div className="h-32 bg-slate-900 p-8 flex flex-col justify-center">
              <DialogTitle className="text-2xl font-display font-bold text-white">Homework Submission</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium mt-1">Completing: {selectedHomework?.title}</DialogDescription>
           </div>
           <div className="p-8 space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Your Solution / Notes</label>
                 <textarea 
                    className="w-full h-48 rounded-2xl border-slate-100 bg-slate-50/50 p-6 text-sm focus:bg-white transition-all shadow-inner focus:outline-none leading-relaxed"
                    placeholder="Type your answer, observations, or solution here..."
                    value={submissionData.content}
                    onChange={(e) => setSubmissionData({...submissionData, content: e.target.value})}
                 />
              </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Upload Work (Optional)</label>
                  {!submissionData.attachments ? (
                    <div className="group relative h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer overflow-hidden">
                      <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attach PDF or Image</p>
                    </div>
                  ) : (
                    <div className="h-16 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm"><FileText className="w-4 h-4" /></div>
                           <div>
                             <p className="text-[10px] font-bold text-indigo-600 truncate max-w-[150px]">
                               {(() => { try { return JSON.parse(submissionData.attachments).name; } catch(e) { return submissionData.attachments; } })()}
                             </p>
                             <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Ready to upload</p>
                           </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-full" onClick={() => setSubmissionData({...submissionData, attachments: ''})}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  )}
               </div>
              
              <div className="p-4 bg-blue-50 rounded-2xl flex gap-3">
                 <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                 <p className="text-xs text-blue-600 font-medium leading-relaxed">Your work will be timestamped and visible to your teacher.</p>
              </div>
           </div>
           <DialogFooter className="p-8 pt-0">
              <Button onClick={handleSubmitHomework} disabled={isSubmitting} className="w-full rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-xl shadow-indigo-100">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Submit Assignment</>}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
