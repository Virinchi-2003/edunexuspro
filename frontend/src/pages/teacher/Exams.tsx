import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  BookOpen,
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TeacherExams: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  const handleDownloadSchedule = async (examId: string, examName: string) => {
    try {
      setDownloading(examId);
      const res = await api.get(`/exams/download-schedule/${examId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Schedule_${examName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Schedule downloaded successfully');
    } catch (error) {
      toast.error('Failed to download schedule');
    } finally {
      setDownloading(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, classRes, examsRes] = await Promise.all([
        api.get(`/staff/user/${user.uid}`),
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/exams/school/${user.schoolId}`)
      ]);

      const profile = profileRes.data.data;
      const allClasses = classRes.data.data || [];
      const assignedStrings = profile.classes ? profile.classes.split(',').map((s: string) => s.trim().toLowerCase()) : [];

      // Same lenient matching as Students.tsx
      const matchedClasses = allClasses.filter((c: any) => {
        const className = c.name.toLowerCase().trim();
        const sectionName = c.section.toLowerCase().trim();
        const cleanClassName = className.replace(/(\d+)(st|nd|rd|th)/i, '$1');
        const cleanC = `${cleanClassName}${sectionName}`.replace(/[\s-]/g, '');
        
        return assignedStrings.some((a: string) => {
          const lowerA = a.toLowerCase().trim();
          const cleanA = lowerA.replace(/(\d+)(st|nd|rd|th)/i, '$1').replace(/[\s-]/g, '').replace(/^class/i, '');
          return cleanA === cleanC || cleanA === cleanClassName || lowerA.includes(cleanC);
        });
      });

      setAssignedClasses(matchedClasses);
      
      const allExams = examsRes.data.data || [];
      const classIds = matchedClasses.map(c => c.id);
      
      // Filter exams that are assigned to this teacher's classes
      const filteredExams = allExams.filter((exam: any) => {
        if (!exam.assignedClasses) return false;
        const examClassIds = exam.assignedClasses.split(',').map((id: string) => id.trim());
        return examClassIds.some(cid => classIds.includes(cid));
      });
      
      setExams(filteredExams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Failed to load examination schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const filteredExamsList = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (exam.term || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    
    const matchesClass = filterClass === 'all' || 
                        (exam.assignedClasses && exam.assignedClasses.includes(filterClass));

    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Examinations</h2>
          <p className="text-slate-500 font-medium mt-1">Manage exam schedules and student assessments for your classes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
               placeholder="Search exams or terms..." 
               className="pl-10 w-64 rounded-xl border-slate-200 bg-white"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`rounded-xl gap-2 border-slate-200 bg-white transition-all ${
                (filterStatus !== 'all' || filterClass !== 'all') ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : ''
              }`}>
                <Filter className="w-4 h-4" /> 
                {filterStatus !== 'all' || filterClass !== 'all' ? 'Active Filters' : 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-slate-100 shadow-2xl">
              <div className="p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</div>
              <DropdownMenuItem className="rounded-xl font-medium" onClick={() => setFilterStatus('all')}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl font-medium" onClick={() => setFilterStatus('scheduled')}>Scheduled</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl font-medium" onClick={() => setFilterStatus('ongoing')}>Ongoing</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl font-medium" onClick={() => setFilterStatus('completed')}>Completed</DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-slate-50" />
              
              <div className="p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Classes</div>
              <DropdownMenuItem className="rounded-xl font-medium" onClick={() => setFilterClass('all')}>All Classes</DropdownMenuItem>
              {assignedClasses.map(cls => (
                <DropdownMenuItem key={cls.id} className="rounded-xl font-medium" onClick={() => setFilterClass(cls.id)}>
                  {cls.name}-{cls.section}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem className="rounded-xl font-bold text-rose-500 hover:bg-rose-50" onClick={() => {
                setFilterStatus('all');
                setFilterClass('all');
                setSearchQuery('');
              }}>
                Clear All Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loading ? (
        <div className="h-[50vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Scanning academic records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExamsList.map((exam) => (
            <Card key={exam.id} className="group hover:shadow-2xl transition-all rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden relative border border-slate-100">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700" />
              <CardHeader className="p-8 pb-4 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-6">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <Badge className={`border-none font-bold uppercase text-[8px] tracking-widest ${
                    exam.status === 'scheduled' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {exam.status}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-display font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{exam.name}</CardTitle>
                <CardDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{exam.term}</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 relative z-10">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-500">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium">{exam.startDate} — {exam.endDate}</span>
                  </div>
                  <div className="flex items-start gap-3 text-slate-500">
                    <Users className="w-4 h-4 text-indigo-400 mt-1" />
                    <div className="flex flex-wrap gap-1">
                      {exam.assignedClasses ? (
                        exam.assignedClasses.split(',').map((cid: string) => {
                          const cls = assignedClasses.find(c => c.id === cid);
                          return cls ? (
                            <Badge key={cid} variant="outline" className="bg-slate-50 border-slate-100 text-[9px] font-bold text-slate-600">
                              {cls.name}-{cls.section}
                            </Badge>
                          ) : null;
                        })
                      ) : (
                        <span className="text-sm italic text-slate-400">All Classes</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium">{exam.schedules?.length || 0} Subjects Configured</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100" />)}
                  </div>
                  <Button 
                    variant="ghost" 
                    className="text-xs font-bold text-indigo-600 gap-1 rounded-xl p-0 h-auto hover:bg-transparent group/btn"
                    onClick={() => {
                      setSelectedExam(exam);
                      setIsScheduleOpen(true);
                    }}
                  >
                    View Schedule <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredExamsList.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-500 font-bold">No examination records found.</p>
               <p className="text-slate-400 text-sm mt-1">Scheduled exams for your assigned classes will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              {selectedExam?.name} Schedule
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Examination timetable and subject details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="rounded-[2rem] border border-slate-100 overflow-hidden bg-slate-50/30">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 pl-6">Subject</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Date</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 pr-6">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedExam?.schedules?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center text-slate-400 font-medium italic">
                        No subject schedule available yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedExam?.schedules?.map((item: any) => (
                      <TableRow key={item.id} className="border-slate-50 hover:bg-white transition-colors">
                        <TableCell className="font-bold py-5 pl-6 text-slate-900">{item.subject}</TableCell>
                        <TableCell className="text-slate-500 font-medium">
                          {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-slate-600 font-bold font-mono text-xs pr-6">
                          {item.startTime} - {item.endTime}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50" 
              onClick={() => handleDownloadSchedule(selectedExam.id, selectedExam.name)}
              disabled={downloading === selectedExam?.id}
            >
              {downloading === selectedExam?.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
            <Button 
              className="flex-1 h-12 rounded-2xl font-bold bg-slate-900 shadow-xl" 
              onClick={() => setIsScheduleOpen(false)}
            >
              Close Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TeacherExams;
