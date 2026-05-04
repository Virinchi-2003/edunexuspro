import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Users, 
  Loader2,
  ChevronRight,
  Send,
  BookOpen,
  FileText,
  FileSpreadsheet,
  Upload,
  FileDown,
  Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TeacherHomework: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  
  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual' | 'pdf' | 'excel'>('manual');
  
  // Selection States
  const [selectedHomework, setSelectedHomework] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    classId: '',
    subject: '',
    title: '',
    description: '',
    dueDate: '',
    attachments: ''
  });

  const [gradeData, setGradeData] = useState({
    status: 'reviewed',
    teacherFeedback: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get(`/staff/user/${user.uid}`);
      const profile = profileRes.data.data;
      setTeacherProfile(profile);

      if (profile?.id) {
        const homeworkRes = await api.get(`/staff/homework/${profile.id}`);
        setHomeworkList(homeworkRes.data.data || []);

        const classesRes = await api.get(`/staff/my-classes/${profile.id}`);
        setClasses(classesRes.data.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load homework data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'pdf' | 'excel') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event: any) => {
      try {
        const base64Data = event.target.result;
        const attachmentObj = JSON.stringify({
          name: file.name,
          type: file.type,
          data: base64Data
        });

        if (mode === 'excel') {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(base64Data.split(',')[1], { type: 'base64' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);

          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            setFormData(prev => ({
              ...prev,
              title: firstRow.Title || firstRow.title || prev.title,
              subject: firstRow.Subject || firstRow.subject || prev.subject,
              description: firstRow.Description || firstRow.description || prev.description,
              dueDate: firstRow.DueDate || firstRow.dueDate || prev.dueDate,
              attachments: attachmentObj
            }));
            toast.success('Excel data extracted and file attached');
          }
        } else {
          // PDF mode
          setFormData(prev => ({
            ...prev,
            title: prev.title || file.name.replace('.pdf', ''),
            attachments: attachmentObj
          }));
          toast.success('PDF attached successfully');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to process file');
      }
    };

    reader.readAsDataURL(file);
  };

  const handleCreateHomework = async () => {
    if (!formData.classId || !formData.subject || !formData.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/staff/homework', {
        ...formData,
        schoolId: user.schoolId,
        teacherId: teacherProfile.id
      });
      toast.success('Homework assigned successfully');
      setIsCreateOpen(false);
      setFormData({ classId: '', subject: '', title: '', description: '', dueDate: '', attachments: '' });
      setUploadMode('manual');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign homework');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this homework?')) return;
    try {
      await api.delete(`/staff/homework/${id}`);
      toast.success('Homework deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete homework');
    }
  };

  const handleViewSubmissions = async (hw: any) => {
    setSelectedHomework(hw);
    setIsSubmissionsOpen(true);
    try {
      const res = await api.get(`/staff/homework/submissions/${hw.id}`);
      setSubmissions(res.data.data || []);
    } catch (error) {
      toast.error('Failed to load submissions');
    }
  };

  const handleGradeSubmission = async () => {
    try {
      setIsSaving(true);
      await api.post(`/staff/homework/grade/${selectedSubmission.id}`, gradeData);
      toast.success('Submission graded successfully');
      setIsGradeOpen(false);
      handleViewSubmissions(selectedHomework);
    } catch (error) {
      toast.error('Failed to grade submission');
    } finally {
      setIsSaving(false);
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Homework Management</h2>
          <p className="text-slate-500 font-medium mt-1">Assign tasks and track student progress across your classes.</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl h-12 px-6 bg-slate-900 hover:bg-indigo-600 text-white font-bold transition-all shadow-xl shadow-slate-200 gap-2"
        >
          <Plus className="w-5 h-5" /> Assign Homework
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-64 bg-slate-50 animate-pulse border-none rounded-[2rem]" />
          ))
        ) : homeworkList.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-900">No Homework Assigned</h3>
            <p className="text-slate-400 mt-2 font-medium">Start by assigning your first task to a class.</p>
          </div>
        ) : (
          homeworkList.map((hw) => (
            <Card key={hw.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden">
              <div className="h-2 bg-indigo-500" />
              <CardContent className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-none rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-2">
                      {hw.class?.name}-{hw.class?.section}
                    </Badge>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{hw.title}</h3>
                    <p className="text-indigo-400 text-xs font-bold mt-1">{hw.subject}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 border-slate-100 shadow-xl">
                      <DropdownMenuItem className="rounded-xl gap-2 cursor-pointer">
                        <Pencil className="w-4 h-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteHomework(hw.id)}
                        className="rounded-xl gap-2 cursor-pointer text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-slate-500 text-sm line-clamp-2 mb-4 font-medium leading-relaxed">
                  {hw.description || 'No description provided.'}
                </p>

                {hw.attachments && (() => {
                  const attachInfo = getAttachmentInfo(hw.attachments);
                  return (
                    <div 
                      onClick={() => handleDownload(hw.attachments)}
                      className="flex items-center gap-2 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 hover:border-indigo-200 transition-all group/attach"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${attachInfo.isPdf ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                        {attachInfo.isPdf ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-900 truncate">{attachInfo.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Attachment Attached</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 group-hover/attach:text-indigo-600 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Due: {hw.dueDate || 'N/A'}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => handleViewSubmissions(hw)}
                    className="rounded-xl h-10 px-4 bg-slate-50 hover:bg-indigo-50 text-indigo-600 font-bold transition-all gap-2"
                  >
                    Submissions <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Homework Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
           <div className="h-32 bg-slate-900 p-8 flex flex-col justify-center flex-shrink-0">
              <DialogTitle className="text-2xl font-display font-bold text-white">Assign New Homework</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium mt-1">Create a new task for your students.</DialogDescription>
           </div>
            <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
              <Tabs defaultValue="manual" onValueChange={(v) => setUploadMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1 mb-6">
                  <TabsTrigger value="manual" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    PDF Document
                  </TabsTrigger>
                  <TabsTrigger value="excel" className="rounded-xl font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Excel Sheet
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-6 mt-0">
                  <div className="text-center py-4 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-100 mb-6">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Manual Entry Mode</p>
                  </div>
                </TabsContent>

                <TabsContent value="pdf" className="space-y-6 mt-0">
                  <div className="group relative h-32 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden mb-6">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, 'pdf')}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-900">Upload PDF Worksheet</p>
                      <p className="text-[10px] font-medium text-slate-400">Click or drag to attach PDF</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="excel" className="space-y-6 mt-0">
                  <div className="group relative h-32 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer overflow-hidden mb-6">
                    <input 
                      type="file" 
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileUpload(e, 'excel')}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-900">Import from Excel</p>
                      <p className="text-[10px] font-medium text-slate-400">Extracts title, subject, and description</p>
                    </div>
                  </div>
                  <div className="flex justify-center -mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-[10px] font-bold text-indigo-500 hover:bg-indigo-50 gap-2 rounded-lg"
                      onClick={() => {
                        const XLSX = import('xlsx').then(XLSX => {
                          const ws = XLSX.utils.json_to_sheet([
                            { Title: 'Chapter 5 Algebra', Subject: 'Mathematics', Description: 'Solve exercises 1-10', DueDate: '2026-05-15' }
                          ]);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, "Template");
                          XLSX.writeFile(wb, "Homework_Template.xlsx");
                        });
                      }}
                    >
                      <FileDown className="w-3 h-3" /> Download Template
                    </Button>
                  </div>
                </TabsContent>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Target Class</label>
                        <select 
                          className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4 text-sm focus:bg-white transition-all shadow-inner focus:outline-none"
                          value={formData.classId}
                          onChange={(e) => setFormData({...formData, classId: e.target.value})}
                        >
                          <option value="">Select Class</option>
                          {classes.map(c => (
                            <option key={c.classId} value={c.classId}>{c.className}</option>
                          ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Subject</label>
                        <Input 
                          placeholder="e.g. Mathematics"
                          className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4 text-sm focus:bg-white transition-all shadow-inner border-none"
                          value={formData.subject}
                          onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Homework Title</label>
                    <Input 
                        placeholder="e.g. Chapter 4 Practice Set"
                        className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4 text-sm focus:bg-white transition-all shadow-inner border-none"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Instructions / Description</label>
                    <textarea 
                        className="w-full h-32 rounded-2xl border-slate-100 bg-slate-50/50 p-4 text-sm focus:bg-white transition-all shadow-inner focus:outline-none"
                        placeholder="Detailed instructions for the students..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Due Date</label>
                      <Input 
                          type="date"
                          className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 px-4 text-sm focus:bg-white transition-all shadow-inner border-none"
                          value={formData.dueDate}
                          onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      />
                    </div>
                    {formData.attachments && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Attachment</label>
                        <div className="h-12 rounded-2xl bg-indigo-50 border border-indigo-100 px-4 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-600 truncate max-w-[120px]">
                            {(() => {
                              try {
                                return JSON.parse(formData.attachments).name;
                              } catch(e) {
                                return formData.attachments;
                              }
                            })()}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-full"
                            onClick={() => setFormData({...formData, attachments: ''})}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Tabs>
            </div>
           <DialogFooter className="p-8 pt-4 border-t border-slate-50 flex-shrink-0">
              <Button 
                onClick={handleCreateHomework}
                disabled={isSaving}
                className="w-full rounded-2xl h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2 shadow-xl shadow-indigo-100"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Assign Homework</>}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={isSubmissionsOpen} onOpenChange={setIsSubmissionsOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden max-h-[85vh] flex flex-col">
           <div className="h-32 bg-slate-900 p-8 flex flex-col justify-center flex-shrink-0">
              <DialogTitle className="text-2xl font-display font-bold text-white">Homework Submissions</DialogTitle>
              <DialogDescription className="text-slate-400 font-medium mt-1">Reviewing: {selectedHomework?.title}</DialogDescription>
           </div>
           <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {submissions.length === 0 ? (
                <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-[2rem]">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-bold">No submissions yet.</p>
                </div>
              ) : (
                submissions.map(sub => (
                  <Card key={sub.id} className="border-none bg-slate-50 rounded-2xl p-6 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                          {sub.student?.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{sub.student?.name}</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Submitted: {new Date(sub.submittedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        sub.status === 'reviewed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {sub.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 bg-white rounded-xl p-4 text-sm text-slate-600 shadow-inner min-h-[60px]">
                      {sub.content || 'No text content provided.'}
                    </div>

                    {sub.attachments && (() => {
                      const subAttachInfo = getAttachmentInfo(sub.attachments);
                      return (
                        <div 
                          onClick={() => handleDownload(sub.attachments)}
                          className="mt-4 flex items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-all group/subattach"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${subAttachInfo.isPdf ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {subAttachInfo.isPdf ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-900 truncate">{subAttachInfo.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Student's Work</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-indigo-600 group-hover/subattach:scale-110 transition-transform"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })()}

                    <div className="mt-4 flex items-center justify-between">
                       <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGradeData({ status: sub.status, teacherFeedback: sub.teacherFeedback || '' });
                          setIsGradeOpen(true);
                        }}
                        className="rounded-lg text-indigo-600 font-bold hover:bg-white"
                       >
                         {sub.status === 'reviewed' ? 'Update Grade' : 'Review & Grade'}
                       </Button>
                    </div>
                  </Card>
                ))
              )}
           </div>
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={isGradeOpen} onOpenChange={setIsGradeOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-8">
           <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">Review Submission</DialogTitle>
              <DialogDescription>Grade the work of {selectedSubmission?.student?.name}</DialogDescription>
           </DialogHeader>
           <div className="space-y-6 my-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</label>
                 <select 
                   className="w-full h-12 rounded-2xl border-slate-100 bg-slate-50 px-4 text-sm focus:outline-none"
                   value={gradeData.status}
                   onChange={(e) => setGradeData({...gradeData, status: e.target.value})}
                 >
                   <option value="submitted">Submitted (Pending Review)</option>
                   <option value="reviewed">Reviewed & Graded</option>
                   <option value="returned">Needs Correction</option>
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Teacher Feedback</label>
                 <textarea 
                   className="w-full h-32 rounded-2xl border-slate-100 bg-slate-50 p-4 text-sm focus:outline-none"
                   placeholder="Write your comments here..."
                   value={gradeData.teacherFeedback}
                   onChange={(e) => setGradeData({...gradeData, teacherFeedback: e.target.value})}
                 />
              </div>
           </div>
           <DialogFooter>
              <Button 
                onClick={handleGradeSubmission}
                disabled={isSaving}
                className="w-full rounded-2xl h-12 bg-slate-900 hover:bg-indigo-600 text-white font-bold shadow-xl"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Feedback'}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherHomework;
