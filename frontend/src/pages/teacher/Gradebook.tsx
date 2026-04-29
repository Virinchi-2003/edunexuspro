import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy,
  Users,
  Loader2,
  Save,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TeacherGradebook: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'class-select' | 'marks-entry'>('class-select');
  
  const [exams, setExams] = useState<any[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, { marks: string; remarks: string }>>({});

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
      const classIds = matchedClasses.map((c: any) => c.id);
      
      // Filter exams that are assigned to this teacher's classes
      const filteredExams = allExams.filter((exam: any) => {
        if (!exam.assignedClasses) return false;
        const examClassIds = exam.assignedClasses.split(',').map((id: string) => id.trim());
        return examClassIds.some((cid: string) => classIds.includes(cid));
      });
      
      setExams(filteredExams);
    } catch (error) {
      toast.error('Failed to load gradebook data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndMarks = async (exam: any, classId: string, subject: string) => {
    try {
      setLoading(true);
      const [studentsRes, marksRes] = await Promise.all([
        api.get(`/students/school/${user.schoolId}`),
        api.get(`/exams/marks/query?examId=${exam.id}&classId=${classId}&subject=${subject}`)
      ]);
      
      const filteredStudents = studentsRes.data.data.filter((s: any) => s.classId === classId);
      setStudents(filteredStudents);
      
      const fetchedMarks = marksRes.data.data || [];
      const initialMarks: Record<string, any> = {};
      fetchedMarks.forEach((m: any) => {
        initialMarks[m.studentId] = { 
          marks: m.marksObtained.toString(), 
          remarks: m.comments || '' 
        };
      });
      setMarks(initialMarks);
    } catch (error) {
      toast.error('Failed to load student performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  useEffect(() => {
    if (view === 'marks-entry' && selectedExam && selectedClassId && selectedSubject) {
      fetchStudentsAndMarks(selectedExam, selectedClassId, selectedSubject);
    }
  }, [view, selectedExam, selectedClassId, selectedSubject]);

  const handleSaveMarks = async () => {
    if (!selectedExam || !students.length) return;

    try {
      setSaving(true);
      const records = Object.entries(marks).map(([studentId, data]) => ({
        studentId,
        marksObtained: parseFloat(data.marks),
        comments: data.remarks,
        examId: selectedExam.id,
        subject: selectedSubject
      })).filter(r => !isNaN(r.marksObtained));

      if (records.length === 0) {
        toast.error('No marks entered to save');
        return;
      }

      await api.post('/exams/marks', {
        schoolId: user.schoolId,
        records
      });

      toast.success('Marks synchronized with database', {
        icon: <CheckCircle2 className="text-emerald-500" />
      });
      setView('class-select');
    } catch (error) {
      toast.error('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const renderClassSelect = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {exams.map((exam) => (
        <Card 
          key={exam.id} 
          className="group hover:shadow-2xl transition-all cursor-pointer rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden relative border border-slate-100"
          onClick={() => {
            setSelectedExam(exam);
            setView('marks-entry');
            const examClassIds = exam.assignedClasses?.split(',') || [];
            const commonClasses = assignedClasses.filter(c => examClassIds.includes(c.id));
            if (commonClasses.length > 0) setSelectedClassId(commonClasses[0].id);
            if (exam.schedules?.length > 0) setSelectedSubject(exam.schedules[0].subject);
          }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-100">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-1">{exam.title}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{exam.subject} • Class {exam.grade}</p>
            <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
              <div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                Enter Marks <ChevronRight className="w-3 h-3" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {exams.length === 0 && !loading && (
        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">No active exams found for grading.</p>
          <p className="text-slate-400 text-sm mt-1">Assignments and examinations for your classes will appear here once scheduled.</p>
        </div>
      )}
    </div>
  );

  const renderMarksEntry = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-100" onClick={() => setView('class-select')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">{selectedExam?.title} - Grading</h2>
            <p className="text-sm text-slate-500 font-medium">{selectedExam?.subject} • Max Marks: {selectedExam?.maxMarks || 100}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest">
             {students.length} Students Total
           </Badge>
           <Button className="rounded-xl bg-slate-900 text-white gap-2 h-11 px-6 shadow-xl shadow-slate-200">
              <TrendingUp className="w-4 h-4" /> Performance Stats
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1 bg-slate-50/50 rounded-2xl border border-slate-100 mb-6">
        <div className="p-4 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Target Class</label>
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl shadow-sm">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
              {assignedClasses.filter(c => selectedExam?.assignedClasses?.includes(c.id)).map(c => (
                <SelectItem key={c.id} value={c.id} className="rounded-xl">Class {c.name}-{c.section}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="p-4 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 text-indigo-600">Active Subject</label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="bg-white border-indigo-100 h-12 rounded-xl shadow-sm text-indigo-600 font-bold">
              <SelectValue placeholder="Select Subject" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
              {selectedExam?.schedules?.map((s: any) => (
                <SelectItem key={s.id} value={s.subject} className="rounded-xl font-medium">{s.subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white border border-slate-100">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-10 py-6 text-left">Student Profile</th>
                  <th className="px-10 py-6 text-center">Identity (Roll)</th>
                  <th className="px-10 py-6 text-center w-40">Marks Obtained</th>
                  <th className="px-10 py-6 text-right">Teacher Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:scale-105 transition-transform">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center text-slate-500 font-mono text-xs">
                      {student.studentId}
                    </td>
                    <td className="px-10 py-6">
                      <Input 
                        type="number"
                        placeholder="0.0"
                        className="text-center font-bold h-11 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-primary/20"
                        value={marks[student.id]?.marks || ''}
                        onChange={(e) => setMarks({
                          ...marks,
                          [student.id]: { ...(marks[student.id] || {remarks: ''}), marks: e.target.value }
                        })}
                      />
                    </td>
                    <td className="px-10 py-6 text-right">
                      <Input 
                        placeholder="Good performance..."
                        className="rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-primary/20 h-11"
                        value={marks[student.id]?.remarks || ''}
                        onChange={(e) => setMarks({
                          ...marks,
                          [student.id]: { ...(marks[student.id] || {marks: ''}), remarks: e.target.value }
                        })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <Button 
              className="rounded-[1.5rem] px-10 h-14 bg-indigo-600 shadow-xl shadow-indigo-100 gap-2 text-base font-bold"
              onClick={handleSaveMarks}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Finalize Gradebook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Gradebook</h2>
          <p className="text-slate-500 font-medium mt-1">Record and manage academic performance results.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 text-indigo-700 rounded-[1.5rem] border border-indigo-50">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">Real-time Cloud Sync</span>
        </div>
      </div>

      {loading && view === 'class-select' ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Accessing student records...</p>
        </div>
      ) : (
        <>
          {view === 'class-select' && renderClassSelect()}
          {view === 'marks-entry' && renderMarksEntry()}
        </>
      )}
    </div>
  );
};

export default TeacherGradebook;
