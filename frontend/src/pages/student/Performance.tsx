import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  BookOpen, 
  Award, 
  Download,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const StudentPerformance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      // Ensure we use plural /students/
      const studentRes = await api.get(`/students/user/${user.uid}`);
      const sData = studentRes.data.data;
      
      if (!sData) {
        console.error('Student profile not found for UID:', user.uid);
        return;
      }
      
      setStudent(sData);

      if (sData.id) {
        const res = await api.get(`/exams/marks/student/${sData.id}`);
        setMarks(res.data.data || []);

        const skillRes = await api.get(`/coach/assessment/history/${sData.id}`);
        setSkillAssessments(skillRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  const getGradeColor = (grade: string) => {
    const g = grade || 'N/A';
    if (g.startsWith('A')) return 'text-emerald-500 bg-emerald-50';
    if (g.startsWith('B')) return 'text-blue-500 bg-blue-50';
    if (g.startsWith('C')) return 'text-amber-500 bg-amber-50';
    return 'text-rose-500 bg-rose-50';
  };

  const downloadReportCard = async () => {
    console.log('Final Report Card button clicked. Student ID:', student?.id);
    
    if (!student?.id) {
      toast.error('Student profile data is missing. Please refresh.');
      fetchData();
      return;
    }

    const toastId = toast.loading('Compiling your academic record...', {
      description: 'Please wait while we generate your PDF report card.'
    });

    try {
      console.log('Requesting PDF from backend...');
      const response = await api.get(`/exams/report/${student.id}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      console.log('PDF received. Status:', response.status);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ReportCard_${student.name.replace(/\s+/g, '_')}_${student.studentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup to prevent memory leaks
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 200);

      toast.success('Report Card Downloaded!', {
        id: toastId,
        description: 'Your academic report has been saved to your device.'
      });
    } catch (error: any) {
      console.error('PDF Download Error:', error);
      toast.error('Download Failed', {
        id: toastId,
        description: error.response?.data?.message || 'Server was unable to generate the PDF at this time.'
      });
    }
  };

  const calculateAverage = () => {
    if (!marks || marks.length === 0) return 0;
    const totalObtained = marks.reduce((sum, m) => sum + (m.marksObtained || 0), 0);
    const totalPossible = marks.reduce((sum, m) => sum + (m.totalMarks || 100), 0);
    return (totalObtained / totalPossible) * 100;
  };

  const overallAverage = calculateAverage();

  if (loading && !student) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Accessing Academic Vault...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Academic Performance</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time synchronization with the institutional gradebook.</p>
        </div>
        <Button 
          onClick={downloadReportCard}
          className="gap-3 rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold"
        >
          <Download className="w-5 h-5" /> Download Final Report Card
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Subject Wise Performance */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {marks.map((mark) => (
                <Card key={mark.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden p-8">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                         <BookOpen className="w-6 h-6" />
                      </div>
                      <Badge className={`${getGradeColor(mark.grade)} border-none px-4 py-1.5 rounded-full font-bold`}>
                         Grade {mark.grade || 'N/A'}
                      </Badge>
                   </div>
                   <h3 className="text-xl font-display font-bold text-slate-900 mb-1">{mark.examSchedule?.subject}</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{mark.examSchedule?.exam?.name || 'Academic Assessment'}</p>
                   
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                         <span className="text-slate-400 uppercase tracking-wider">Marks Scored</span>
                         <span className="text-slate-900">{mark.marksObtained} / {mark.totalMarks}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-primary rounded-full transition-all duration-1000" 
                           style={{ width: `${(mark.marksObtained / (mark.totalMarks || 100)) * 100}%` }}
                         />
                      </div>
                   </div>
                </Card>
              ))}

              {marks.length === 0 && (
                <Card className="col-span-full border-none shadow-sm bg-slate-50/50 rounded-[3rem] py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                   <Trophy className="w-16 h-16 text-slate-200 mb-6" />
                   <h3 className="text-xl font-bold text-slate-900">Awaiting Results</h3>
                   <p className="text-slate-400 mt-2 font-medium text-center px-8">Examination results are currently being processed by the administration.</p>
                </Card>
              )}
           </div>

           {/* Sports & Skill Assessments */}
           <div className="space-y-6 mt-12">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Trophy className="w-5 h-5" />
                 </div>
                 <h3 className="text-2xl font-display font-bold text-slate-900">Coaching Feedback</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {skillAssessments.length > 0 ? (
                    skillAssessments.map((sa) => (
                       <Card key={sa.id} className="border-none shadow-xl rounded-[2rem] bg-white p-6 hover:shadow-2xl transition-all border-l-4 border-l-indigo-500">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <h4 className="font-bold text-slate-900">{sa.skill}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sa.sport?.name || 'Sport Activity'}</p>
                             </div>
                             <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold">
                                Rating: {sa.score}/5
                             </Badge>
                          </div>
                          <p className="text-sm text-slate-600 italic line-clamp-3 mb-4">
                             "{sa.comments}"
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(sa.createdAt).toLocaleDateString()}
                             </span>
                             <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                                Coach Assessment
                             </span>
                          </div>
                       </Card>
                    ))
                 ) : (
                    <div className="col-span-full py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                       <Award className="w-10 h-10 mb-3 opacity-20" />
                       <p className="font-medium">No coaching feedback recorded yet.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <Award className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-2xl font-display font-bold mb-1">Cumulative Performance</h3>
              <p className="text-slate-400 font-medium text-sm mb-8">Aggregated score for Class {student?.grade}-{student?.section}</p>
              
              <div className="flex items-baseline gap-2 mb-8">
                 <span className="text-6xl font-display font-black text-white">{overallAverage.toFixed(1)}</span>
                 <span className="text-xl font-bold text-slate-500 uppercase tracking-widest">%</span>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>Performance Rating</span>
                    <span className="text-emerald-400">{overallAverage >= 90 ? 'Exceptional' : overallAverage >= 75 ? 'Superior' : 'Satisfactory'}</span>
                 </div>
                 <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${overallAverage}%` }} />
                 </div>
              </div>
           </Card>

           <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-50 p-8 border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900">Academic Standing</h4>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Your performance data is synchronized directly with the school's central database. If you notice any discrepancies, please contact your class teacher.
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentPerformance;
