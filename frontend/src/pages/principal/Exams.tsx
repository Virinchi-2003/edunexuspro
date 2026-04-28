import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Calendar, 
  FileText,
  GraduationCap,
  Layout
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Examinations: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddExamOpen, setIsAddExamOpen] = useState(false);
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examSchedule, setExamSchedule] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    term: '',
    startDate: '',
    endDate: ''
  });

  const [scheduleData, setScheduleData] = useState({
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    totalMarks: '100'
  });

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/exams/school/${user.schoolId}`);
      setExams(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (examId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/exams/school/${user.schoolId}`);
      // Find the specific exam to get its schedule (since we don't have a direct schedule endpoint)
      const currentExam = res.data.data.find((e: any) => e.id === examId);
      // If our backend schema/controller doesn't support 'with: { schedule: true }' yet, we might need to update it.
      // For now, let's assume we can fetch it or I'll add a specific fetch if needed.
      // Actually, I'll update the controller to include schedule in a moment.
      setExamSchedule(currentExam?.schedules || []); 
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.schoolId) fetchExams();
  }, [user]);

  const handleCreateExam = async () => {
    try {
      await api.post('/exams', { ...formData, schoolId: user.schoolId });
      toast.success('Examination scheduled successfully');
      setIsAddExamOpen(false);
      fetchExams();
    } catch (error) {
      toast.error('Failed to create exam');
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedExam) return;
    if (!scheduleData.subject || !scheduleData.date || !scheduleData.startTime) {
      toast.error('Please fill in all schedule details');
      return;
    }

    try {
      await api.post('/exams/schedule', { 
        ...scheduleData, 
        examId: selectedExam.id,
        totalMarks: parseInt(scheduleData.totalMarks)
      });
      toast.success('Subject added to schedule');
      setScheduleData({ subject: '', date: '', startTime: '', endTime: '', totalMarks: '100' });
      
      // Refresh both to update main view and dialog view
      const res = await api.get(`/exams/school/${user.schoolId}`);
      const updatedExam = res.data.data.find((e: any) => e.id === selectedExam.id);
      setExamSchedule(updatedExam?.schedules || []);
      fetchExams();
    } catch (error) {
      toast.error('Failed to add subject');
    }
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    try {
      await api.delete(`/exams/schedule/${scheduleId}`);
      toast.success('Subject removed from schedule');
      
      // Refresh
      const res = await api.get(`/exams/school/${user.schoolId}`);
      const updatedExam = res.data.data.find((e: any) => e.id === selectedExam.id);
      setExamSchedule(updatedExam?.schedules || []);
      fetchExams();
    } catch (error) {
      toast.error('Failed to remove subject');
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Examinations & Assessments</h2>
          <p className="text-slate-500 font-medium mt-1">Plan, manage and coordinate school-wide examination schedules.</p>
        </div>
        <Button onClick={() => setIsAddExamOpen(true)} className="gap-2 rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 hover:scale-105 transition-all">
          <Plus className="w-5 h-5" /> Schedule New Exam
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-[2rem] bg-slate-50 animate-pulse" />
          ))
        ) : exams.length === 0 ? (
          <Card className="col-span-full border-none shadow-sm bg-slate-50/50 rounded-[3rem] py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
              <GraduationCap className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Exams Scheduled</h3>
            <p className="text-slate-400 mt-2 font-medium">Click the button above to start planning assessments.</p>
          </Card>
        ) : (
          exams.map((exam) => (
            <Card key={exam.id} className="group relative border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="pb-4 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
                    {exam.term || 'Academic Term'}
                  </Badge>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-bold text-[10px] uppercase">
                    {exam.status}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-display font-bold group-hover:text-primary transition-colors">{exam.name}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
                    <span className="text-sm">{exam.startDate} — {exam.endDate}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
                    <span className="text-sm">Subjects: <span className="font-bold text-slate-900">Configured</span></span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-2xl h-12 font-bold hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 border-slate-100 shadow-sm"
                    onClick={() => {
                      setSelectedExam(exam);
                      setIsEditScheduleOpen(true);
                      fetchSchedule(exam.id);
                    }}
                  >
                    Edit Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditScheduleOpen} onOpenChange={setIsEditScheduleOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Layout className="w-6 h-6" /></div>
              Configure Schedule: {selectedExam?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[2rem]">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Subject</label>
                <Input 
                  placeholder="e.g. Maths" 
                  className="rounded-xl border-none shadow-sm"
                  value={scheduleData.subject}
                  onChange={(e) => setScheduleData({...scheduleData, subject: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</label>
                <Input 
                  type="date" 
                  className="rounded-xl border-none shadow-sm"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time</label>
                <Input 
                  placeholder="09:00 AM" 
                  className="rounded-xl border-none shadow-sm"
                  value={scheduleData.startTime}
                  onChange={(e) => setScheduleData({...scheduleData, startTime: e.target.value})}
                />
              </div>
              <div className="pt-6">
                <Button onClick={handleAddSchedule} className="w-full rounded-xl gap-2 font-bold"><Plus className="w-4 h-4" /> Add</Button>
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Subject</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Start Time</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examSchedule.length === 0 ? (
                    <TableRow>
                      <td colSpan={4} className="py-10 text-center text-slate-400 font-medium italic">
                        No subjects added to this schedule yet.
                      </td>
                    </TableRow>
                  ) : (
                    examSchedule.map((item) => (
                      <TableRow key={item.id} className="border-slate-50 group/row">
                        <TableCell className="font-bold py-4">{item.subject}</TableCell>
                        <TableCell className="text-slate-500 font-medium">{item.date}</TableCell>
                        <TableCell className="text-slate-500 font-medium font-mono">{item.startTime}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover/row:opacity-100 transition-opacity"
                            onClick={() => handleRemoveSchedule(item.id)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
             <Button className="w-full h-14 rounded-2xl font-bold bg-slate-900 shadow-xl" onClick={() => setIsEditScheduleOpen(false)}>Done Configuring</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exam Dialog */}
      <Dialog open={isAddExamOpen} onOpenChange={setIsAddExamOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">New Assessment Setup</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Examination Title</label>
              <Input 
                placeholder="e.g. Mid-Term Examination 2024" 
                className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-6 focus:bg-white transition-all shadow-inner"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Academic Term</label>
              <Input 
                placeholder="e.g. Semester 1" 
                className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-6 focus:bg-white transition-all shadow-inner"
                value={formData.term}
                onChange={(e) => setFormData({...formData, term: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Commencement</label>
                <Input 
                  type="date" 
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-6"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Completion</label>
                <Input 
                  type="date" 
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-6"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-3">
             <Button variant="ghost" onClick={() => setIsAddExamOpen(false)} className="rounded-2xl h-14 px-8 font-bold">Discard</Button>
             <Button onClick={handleCreateExam} className="rounded-2xl h-14 px-10 font-bold shadow-xl shadow-primary/20">Finalize Setup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Examinations;
