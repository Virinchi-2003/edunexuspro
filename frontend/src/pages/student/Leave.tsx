import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar as CalendarIcon,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const StudentLeave: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    reason: '',
    startDate: '',
    endDate: '',
    templateType: 'custom'
  });

  const templates: Record<string, string> = {
    'sick': "I am feeling unwell due to fever/cold and will not be able to attend classes.",
    'personal': "I need leave due to a personal/family matter.",
    'emergency': "I have an urgent situation and need immediate leave.",
    'custom': ""
  };

  const handleTemplateChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      templateType: type,
      reason: type === 'custom' ? prev.reason : templates[type]
    }));
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = e.getTime() - s.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 0;
  };

  const totalDays = calculateDays(formData.startDate, formData.endDate);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.uid}`);
      const sData = studentRes.data.data;
      setStudent(sData);

      if (sData?.id) {
        const res = await api.get(`/leaves/student/${sData.id}`);
        setLeaves(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const handleApplyLeave = async () => {
    if (!formData.reason || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/leaves/apply', {
        ...formData,
        totalDays,
        studentId: student.id,
        schoolId: student.schoolId
      });
      toast.success(res.data.message);
      setIsApplyOpen(false);
      setFormData({ reason: '', startDate: '', endDate: '', templateType: 'custom' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, aiStatus?: string) => {
    const isAi = aiStatus && status === aiStatus.toLowerCase();
    
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-4 py-1.5 rounded-full font-bold">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-1.5 rounded-full font-bold">{isAi ? 'AI Approved' : 'Approved'}</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-4 py-1.5 rounded-full font-bold">{isAi ? 'AI Rejected' : 'Rejected'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <FileText className="w-7 h-7" />
           </div>
           <div>
              <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">AI Leave Assistant</h2>
              <p className="text-slate-500 font-medium mt-1">Smart leave tracking with automated AI verification.</p>
           </div>
        </div>
        <Button onClick={() => setIsApplyOpen(true)} className="gap-2 rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 hover:scale-105 transition-all bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-5 h-5" /> Apply for Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
               <Card key={i} className="h-40 bg-slate-50 animate-pulse border-none rounded-[2rem]" />
             ))
           ) : leaves.length === 0 ? (
             <Card className="border-none shadow-sm bg-slate-50/50 rounded-[3rem] py-20 flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-slate-200 mb-6" />
                <h3 className="text-xl font-bold text-slate-900">No Leave History</h3>
                <p className="text-slate-400 mt-2 font-medium">Your leave applications will appear here.</p>
             </Card>
           ) : (
             leaves.map((leave) => (
               <Card key={leave.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden border border-slate-50">
                  <CardContent className="p-8">
                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-4 flex-1">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                 <CalendarIcon className="w-6 h-6" />
                              </div>
                              <div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leave Period</div>
                                 <div className="font-display font-bold text-slate-900 text-lg">
                                    {leave.startDate} — {leave.endDate} 
                                    <span className="ml-3 text-indigo-600">({leave.totalDays || 0} Days)</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                 <MessageSquare className="w-5 h-5" />
                              </div>
                              <div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason</div>
                                 <div className="text-slate-600 font-medium leading-relaxed max-w-md">
                                    {leave.templateType && leave.templateType !== 'custom' && (
                                       <Badge variant="outline" className="mr-2 border-indigo-100 bg-indigo-50 text-indigo-600 capitalize text-[9px]">
                                          {leave.templateType} Leave
                                       </Badge>
                                    )}
                                    {leave.reason}
                                 </div>
                              </div>
                           </div>

                           {leave.aiStatus && (
                              <div className={`mt-4 p-4 rounded-2xl border ${
                                leave.aiStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                                leave.aiStatus === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                                'bg-amber-50 border-amber-100 text-amber-800'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">AI Assistant Response</div>
                                  <Badge className="text-[8px] h-4 bg-white/50 border-none font-bold">BOT</Badge>
                                </div>
                                <p className="text-sm font-bold">{leave.aiReason}</p>
                              </div>
                           )}
                        </div>
                        <div className="flex flex-col items-end gap-3 min-w-[150px]">
                           {getStatusBadge(leave.status, leave.aiStatus)}
                           <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">Applied {new Date(leave.createdAt).toLocaleDateString()}</div>
                           {leave.teacherMessage && (
                             <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl border-none max-w-xs shadow-lg">
                                <div className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Teacher Remarks</div>
                                <p className="text-xs font-medium italic leading-relaxed">"{leave.teacherMessage}"</p>
                             </div>
                           )}
                        </div>
                     </div>
                  </CardContent>
               </Card>
             ))
           )}
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-2xl rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative p-8">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <CardTitle className="text-xl font-display font-bold mb-4">Leave Policy</CardTitle>
              <div className="space-y-4 text-indigo-100 text-sm font-medium">
                 <p>• Medical leaves require a doctor's note for more than 3 days.</p>
                 <p>• Prior permission is required for planned travel.</p>
                 <p>• Leave requests should be submitted at least 24h in advance.</p>
              </div>
           </Card>
        </div>
      </div>

      {/* Apply Leave Dialog */}
      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 flex justify-between items-start">
             <div>
                <DialogTitle className="text-2xl font-display font-bold text-white">Leave Application</DialogTitle>
                <DialogDescription className="text-indigo-100 font-medium">Request a leave of absence from the institution.</DialogDescription>
             </div>
             {totalDays > 0 && (
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white font-bold text-sm">
                   {totalDays} Days
                </div>
             )}
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Select Leave Template</label>
              <select 
                className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4 text-sm focus:outline-none"
                value={formData.templateType}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <option value="custom">Custom Application</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="emergency">Emergency Leave</option>
              </select>
              {formData.templateType !== 'custom' && (
                <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-1 ml-1 flex items-center gap-1">
                  AI Suggested Template Applied
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                <Input 
                  type="date" 
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50" 
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">End Date</label>
                <Input 
                  type="date" 
                  className="h-12 rounded-2xl border-slate-100 bg-slate-50/50"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Reason for Absence</label>
              <textarea 
                className="w-full h-32 rounded-2xl border-slate-100 bg-slate-50/50 p-4 text-sm focus:bg-white transition-all shadow-inner focus:outline-none"
                placeholder="Briefly explain the reason for your leave request..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 gap-3">
             <Button variant="ghost" onClick={() => setIsApplyOpen(false)} className="rounded-2xl h-14 px-8 font-bold">Discard</Button>
             <Button onClick={handleApplyLeave} disabled={isSubmitting} className="rounded-2xl h-14 px-10 font-bold shadow-xl shadow-primary/20 bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentLeave;
