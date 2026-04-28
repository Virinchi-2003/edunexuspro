import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Search,
  Loader2,
  Trophy,
  Download,
  Filter,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Layout
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

const Gradebook: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  
  const [marksData, setMarksData] = useState<Record<string, { marks: string; comments: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examRes, classRes, studentRes] = await Promise.all([
        api.get(`/exams/school/${user.schoolId}`),
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/students/school/${user.schoolId}`)
      ]);
      
      setExams(examRes.data.data || []);
      setClasses(classRes.data.data || []);
      setStudents(studentRes.data.data || []);
      
      if (examRes.data.data?.length > 0) setSelectedExam(examRes.data.data[0].id);
      if (classRes.data.data?.length > 0) setSelectedClass(classRes.data.data[0].id);
    } catch (error) {
      toast.error('Failed to load gradebook data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.schoolId) fetchData();
  }, [user]);

  const handleMarkChange = (studentId: string, field: 'marks' | 'comments', value: string) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { marks: '', comments: '' }),
        [field]: value
      }
    }));
  };

  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedSubject) {
      toast.error('Please select examination and subject');
      return;
    }

    try {
      setIsSaving(true);
      const records = Object.entries(marksData).map(([studentId, data]) => ({
        studentId,
        marksObtained: parseFloat(data.marks),
        comments: data.comments,
        examId: selectedExam,
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
    } catch (error) {
      toast.error('Failed to save marks');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadReportCards = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/exams/report/class/${selectedClass}?examId=${selectedExam}`, { 
        responseType: 'blob' 
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get class name for filename
      const className = classes.find(c => c.id === selectedClass)?.name || 'Class';
      link.setAttribute('download', `Batch_Reports_${className}.pdf`);
      
      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success('Batch Report Cards Downloaded Successfully');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      toast.error('Failed to generate PDF reports');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesClass = !selectedClass || s.classId === selectedClass || s.grade === classes.find(c => c.id === selectedClass)?.name;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-500" /> Academic Gradebook
          </h2>
          <p className="text-slate-500 font-medium mt-1">Manage academic performance and generate automated report cards.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadReportCards} className="gap-2 rounded-xl h-11 border-slate-200 hover:bg-slate-50 shadow-sm">
            <Download className="w-4 h-4" /> Batch Reports
          </Button>
          <Button onClick={handleSaveMarks} disabled={isSaving} className="gap-2 rounded-xl h-11 shadow-lg shadow-primary/20 px-6">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sync Database
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Examination</label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl focus:ring-primary/20 transition-all"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[100]">
                  {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 text-primary">Target Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="bg-white border-primary/20 h-12 rounded-xl focus:ring-primary/20 transition-all text-primary font-bold"><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent className="z-[100]">
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>Class {c.name}-{c.section}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-white border-slate-200 h-12 rounded-xl focus:ring-primary/20 transition-all"><SelectValue /></SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Quick Search</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  className="pl-11 bg-white border-slate-200 h-12 rounded-xl focus:ring-primary/20 transition-all" 
                  placeholder="Filter students..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                <TableHead className="px-8 py-5 text-slate-400 font-bold text-[10px] uppercase tracking-widest w-[120px]">Roll No</TableHead>
                <TableHead className="px-8 py-5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">Student Name</TableHead>
                <TableHead className="px-8 py-5 text-slate-700 font-bold text-[11px] uppercase tracking-wider text-center w-[180px]">Marks (Out of 100)</TableHead>
                <TableHead className="px-8 py-5 text-slate-700 font-bold text-[11px] uppercase tracking-wider text-center w-[120px]">Grade</TableHead>
                <TableHead className="px-8 py-5 text-slate-700 font-bold text-[11px] uppercase tracking-wider">Observation / Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching student database...</p>
                  </td>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <td colSpan={5} className="py-20 text-center">
                    <Layout className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No students found in this class</p>
                  </td>
                </TableRow>
              ) : (
                filteredStudents.map((student, idx) => {
                  const marks = parseFloat(marksData[student.id]?.marks || '0');
                  return (
                    <tr key={student.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6 font-mono text-[11px] text-slate-400">
                        {student.studentId || `#00${idx + 1}`}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">{student.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{student.grade}-{student.section}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="max-w-[120px] mx-auto">
                          <Input 
                            type="number" 
                            className="text-center h-10 font-bold bg-slate-50/50 border-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-lg"
                            placeholder="--"
                            value={marksData[student.id]?.marks || ''}
                            onChange={(e) => handleMarkChange(student.id, 'marks', e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold transition-all shadow-sm ${
                          marks >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          marks >= 60 ? 'bg-blue-100 text-blue-700' :
                          marks >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {marks >= 90 ? 'A+' : 
                           marks >= 80 ? 'A' :
                           marks >= 70 ? 'B' :
                           marks >= 60 ? 'C' :
                           marks > 0 ? 'D' : '--'}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Input 
                          className="bg-slate-50/50 border-none h-10 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all rounded-lg text-xs" 
                          placeholder="Add observation..." 
                          value={marksData[student.id]?.comments || ''}
                          onChange={(e) => handleMarkChange(student.id, 'comments', e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Gradebook;
