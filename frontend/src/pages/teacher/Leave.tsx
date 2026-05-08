import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle,
  Calendar as CalendarIcon,
  MessageSquare,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TeacherLeave: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teacherMessage, setTeacherMessage] = useState('');
  const [staffProfile, setStaffProfile] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get(`/staff/user/${user.uid}`);
      const profile = profileRes.data.data;
      setStaffProfile(profile);

      if (profile?.id) {
        const res = await api.get(`/leaves/teacher/${profile.id}`);
        setLeaves(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedLeave || !staffProfile) return;

    try {
      setIsSubmitting(true);
      await api.put(`/leaves/update/${selectedLeave.id}`, {
        status,
        teacherMessage,
        staffId: staffProfile.id
      });
      toast.success(`Leave request ${status} successfully`);
      setIsResponseOpen(false);
      setTeacherMessage('');
      fetchData();
    } catch (error) {
      toast.error('Failed to update leave status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string, aiStatus?: string) => {
    const isAi = aiStatus && status === aiStatus.toLowerCase();
    
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest">Pending</Badge>;
      case 'approved':
        return (
          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> {isAi ? 'AI Approved' : 'Approved'}
            </Badge>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex flex-col items-end gap-1">
            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest flex items-center gap-1.5">
              <XCircle className="w-3 h-3" /> {isAi ? 'AI Rejected' : 'Rejected'}
            </Badge>
          </div>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">AI Leave Assistant</h2>
          <p className="text-slate-500 font-medium mt-1">Smart analysis and management of student leave applications.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100">
          <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">AI Auto-Mode Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-40 bg-slate-50 animate-pulse border-none rounded-[2rem]" />
          ))
        ) : leaves.length === 0 ? (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-900">No Pending Requests</h3>
            <p className="text-slate-400 mt-2 font-medium">Any leave applications from your students will appear here.</p>
          </div>
        ) : (
          leaves.map((leave) => (
            <Card key={leave.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden border border-slate-100">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
                          {leave.student?.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h3 className="text-xl font-bold text-slate-900">{leave.student?.name}</h3>
                             <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 font-bold uppercase tracking-widest px-2 py-0">ID: {leave.student?.studentId}</Badge>
                          </div>
                          <p className="text-slate-400 text-sm font-medium">Class {leave.student?.grade}-{leave.student?.section}</p>
                        </div>
                      </div>
                      
                      {leave.aiStatus && (
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-3 border ${
                          leave.aiStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                          leave.aiStatus === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                          'bg-amber-50 border-amber-100 text-amber-700'
                        }`}>
                          <div className="text-left">
                            <div className="text-[9px] font-bold uppercase tracking-wider opacity-60">AI Analysis</div>
                            <div className="text-[11px] font-bold">{leave.aiReason}</div>
                          </div>
                          {leave.aiConfidence && (
                            <div className="pl-3 border-l border-current/10 text-center">
                              <div className="text-[9px] font-bold uppercase tracking-wider opacity-60">Conf.</div>
                              <div className="text-[11px] font-bold">{Math.round(leave.aiConfidence * 100)}%</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                             <CalendarIcon className="w-5 h-5" />
                          </div>
                           <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</div>
                              <div className="font-bold text-slate-700">
                                 {leave.startDate} <ArrowRight className="inline w-3 h-3 mx-1 text-slate-300" /> {leave.endDate}
                                 <Badge variant="outline" className="ml-2 border-indigo-100 bg-indigo-50 text-indigo-600 text-[9px] font-bold">
                                    {leave.totalDays || 0} Days
                                 </Badge>
                              </div>
                           </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                             <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Reason</div>
                             <div className="flex items-center gap-2 mt-0.5">
                                {leave.templateType && leave.templateType !== 'custom' && (
                                   <Badge className="bg-slate-100 text-slate-600 border-none text-[8px] uppercase tracking-wider font-bold h-4">
                                      {leave.templateType} Leave
                                   </Badge>
                                )}
                                <p className="text-slate-600 font-medium leading-relaxed">{leave.reason}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:items-end justify-between gap-4 self-stretch min-w-[200px]">
                     {getStatusBadge(leave.status, leave.aiStatus)}
                     
                     <div className="space-y-2 w-full text-right">
                       {leave.status === 'pending' || (leave.aiStatus && leave.status === leave.aiStatus.toLowerCase()) ? (
                         <Button 
                           onClick={() => {
                             setSelectedLeave(leave);
                             setIsResponseOpen(true);
                           }}
                           className="w-full rounded-2xl h-12 px-6 bg-slate-900 hover:bg-indigo-600 text-white font-bold transition-all gap-2"
                         >
                           Override Decision
                         </Button>
                       ) : (
                         <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Decision Comment</div>
                            <p className="text-sm font-medium text-slate-600 italic">"{leave.teacherMessage || 'No comments'}"</p>
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={isResponseOpen} onOpenChange={setIsResponseOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
           <div className="h-32 bg-slate-900 p-8 flex flex-col justify-center">
              <DialogTitle className="text-2xl font-display font-bold text-white">Leave Response</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium mt-1">Reviewing request from {selectedLeave?.student?.name}</DialogDescription>
           </div>
           <div className="p-8 space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Teacher Feedback/Message</label>
                 <textarea 
                    className="w-full h-32 rounded-2xl border-slate-100 bg-slate-50/50 p-4 text-sm focus:bg-white transition-all shadow-inner focus:outline-none"
                    placeholder="Provide a reason for approval/rejection or instructions for the student..."
                    value={teacherMessage}
                    onChange={(e) => setTeacherMessage(e.target.value)}
                 />
              </div>
           </div>
           <DialogFooter className="p-8 pt-0 flex flex-row gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleUpdateStatus('rejected')}
                disabled={isSubmitting}
                className="flex-1 rounded-2xl h-14 border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold gap-2"
              >
                <XCircle className="w-5 h-5" /> Reject
              </Button>
              <Button 
                onClick={() => handleUpdateStatus('approved')}
                disabled={isSubmitting}
                className="flex-1 rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-xl shadow-emerald-100"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Approve</>}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherLeave;
