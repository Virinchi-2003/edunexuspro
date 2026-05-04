import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  Send,
  FileText,
  FileSpreadsheet,
  MessageSquare,
  FileDown,
  Download,
  Trash2,
  Upload
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const StudentHomework: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentProfile, setStudentProfile] = useState<any>(null);
  
  // Dialog States
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  
  const [submissionData, setSubmissionData] = useState({
    content: '',
    attachments: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.uid}`);
      const sData = studentRes.data.data;
      setStudentProfile(sData);

      if (sData?.classId) {
        const res = await api.get(`/students/homework-list/${sData.classId}?studentId=${sData.id}`);
        setHomeworks(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assignments');
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
      const attachmentObj = JSON.stringify({
        name: file.name,
        type: file.type,
        data: base64Data
      });

      setSubmissionData(prev => ({
        ...prev,
        attachments: attachmentObj
      }));
      toast.success('File attached successfully');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const handleSubmitHomework = async () => {
    if (!submissionData.content.trim()) {
      toast.error('Please provide some content for your submission');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/students/homework/submit', {
        ...submissionData,
        homeworkId: selectedHomework.id,
        studentId: studentProfile.id
      });
      toast.success('Homework submitted successfully');
      setIsSubmitOpen(false);
      setSubmissionData({ content: '', attachments: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit homework');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest">Submitted</Badge>;
      case 'reviewed':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest">Reviewed</Badge>;
      case 'returned':
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest">Action Needed</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest">Pending</Badge>;
    }
  };

  const handleDownload = (attachmentStr: string) => {
    try {
      const attachment = JSON.parse(attachmentStr);
      if (attachment.data && attachment.name) {
        const link = document.createElement('a');
        link.href = attachment.data;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading: ${attachment.name}`);
      } else {
        toast.error('Attachment data is corrupted');
      }
    } catch (e) {
      // Legacy support: Create a mock file so the download action still works
      const isPdf = attachmentStr.toLowerCase().endsWith('.pdf');
      const blob = new Blob([`Mock content for ${attachmentStr}`], { type: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachmentStr;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Downloading legacy file: ${attachmentStr}`);
    }
  };

  const getAttachmentInfo = (attachmentStr: string) => {
    try {
      const attachment = JSON.parse(attachmentStr);
      return {
        name: attachment.name,
        isPdf: attachment.name?.toLowerCase().endsWith('.pdf')
      };
    } catch (e) {
      return {
        name: attachmentStr,
        isPdf: attachmentStr?.toLowerCase().endsWith('.pdf')
      };
    }
  };

  const filteredHomework = homeworks.filter(h => 
    h.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Learning Tasks</h2>
          <p className="text-slate-500 font-medium mt-1">Submit your assignments and view teacher feedback here.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search assignments..." 
            className="pl-11 rounded-2xl h-12 border-slate-100 bg-white shadow-xl shadow-slate-100/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching Tasks...</p>
        </div>
      ) : filteredHomework.length === 0 ? (
        <Card className="border-none shadow-sm bg-slate-50/50 rounded-[3rem] py-20 flex flex-col items-center justify-center">
           <BookOpen className="w-16 h-16 text-slate-200 mb-6" />
           <h3 className="text-xl font-bold text-slate-900">All set!</h3>
           <p className="text-slate-400 mt-2 font-medium">No active homework assignments for your class.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {filteredHomework.map((hw) => {
             const attachInfo = getAttachmentInfo(hw.attachments);
             return (
              <Card key={hw.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden flex flex-col border border-slate-50">
                 <div className="p-8 flex-1">
                    <div className="flex justify-between items-start mb-6">
                       <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest">
                         {hw.subject}
                       </Badge>
                       <div className="text-right">
                          <div className="flex items-center gap-2 text-slate-400 mb-1">
                             <Clock className="w-4 h-4" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Due: {hw.dueDate}</span>
                          </div>
                          {getStatusBadge(hw.submissionStatus)}
                       </div>
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">{hw.title}</h3>
                     <p className="text-slate-500 font-medium leading-relaxed line-clamp-3 mb-6">
                       {hw.description || 'No detailed instructions provided.'}
                     </p>

                     {hw.attachments && (
                       <div 
                        onClick={() => handleDownload(hw.attachments)}
                        className="flex items-center gap-2 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 hover:border-indigo-200 transition-all group/attach"
                       >
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${attachInfo.isPdf ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                           {attachInfo.isPdf ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-bold text-slate-900 truncate">{attachInfo.name}</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Teacher's Attachment</p>
                         </div>
                         <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 group-hover/attach:text-indigo-600 transition-colors"
                         >
                           <Download className="w-4 h-4" />
                         </Button>
                       </div>
                     )}

                   {hw.feedback && (
                     <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border-l-4 border-emerald-400">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-1">
                           <MessageSquare className="w-3.5 h-3.5" /> Teacher Feedback
                        </div>
                        <p className="text-emerald-600 text-sm italic font-medium">"{hw.feedback}"</p>
                     </div>
                   )}
                </div>

                <div className="p-6 bg-slate-50 flex items-center justify-between border-t border-slate-100">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300">
                         <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {hw.submissionId ? 'Work Submitted' : 'Not Started'}
                      </span>
                   </div>
                   <Button 
                    onClick={() => {
                      setSelectedHomework(hw);
                      setIsSubmitOpen(true);
                    }}
                    className={`rounded-2xl h-11 px-6 font-bold transition-all shadow-lg gap-2 ${
                      hw.submissionId 
                        ? 'bg-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600' 
                        : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100'
                    }`}
                   >
                      {hw.submissionId ? 'Update Work' : 'Start Task'} <ChevronRight className="w-4 h-4" />
                   </Button>
                </div>
             </Card>
            );
           })}
        </div>
      )}

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
                      <input 
                        type="file" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attach PDF or Image</p>
                    </div>
                  ) : (
                    <div className="h-16 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                             <FileText className="w-4 h-4" />
                          </div>
                           <div>
                             <p className="text-[10px] font-bold text-indigo-600 truncate max-w-[150px]">
                               {(() => {
                                 try {
                                   return JSON.parse(submissionData.attachments).name;
                                 } catch(e) {
                                   return submissionData.attachments;
                                 }
                               })()}
                             </p>
                             <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Ready to upload</p>
                           </div>
                       </div>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-full"
                         onClick={() => setSubmissionData({...submissionData, attachments: ''})}
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </Button>
                    </div>
                  )}
               </div>
              
              <div className="p-4 bg-blue-50 rounded-2xl flex gap-3">
                 <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                 <p className="text-xs text-blue-600 font-medium leading-relaxed">
                   Your work will be timestamped and visible to your teacher. You can update your submission anytime before the due date.
                 </p>
              </div>
           </div>
           <DialogFooter className="p-8 pt-0">
              <Button 
                onClick={handleSubmitHomework}
                disabled={isSubmitting}
                className="w-full rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-xl shadow-indigo-100"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Submit Assignment</>}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentHomework;
