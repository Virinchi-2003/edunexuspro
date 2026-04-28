import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  BookOpen, 
  Award, 
  Download,
  Loader2,
  Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const StudentPerformance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [marks, setMarks] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.id}`);
      const sData = studentRes.data.data;
      setStudent(sData);

      if (sData?.id) {
        const res = await api.get(`/exams/marks/student/${sData.id}`);
        setMarks(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-500 bg-emerald-50';
    if (grade.startsWith('B')) return 'text-blue-500 bg-blue-50';
    if (grade.startsWith('C')) return 'text-amber-500 bg-amber-50';
    return 'text-rose-500 bg-rose-50';
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Compiling Performance Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Academic Performance</h2>
          <p className="text-slate-500 font-medium mt-1">Track your progress, grades, and academic achievements.</p>
        </div>
        <Button className="gap-2 rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 bg-slate-900 text-white">
          <Download className="w-4 h-4" /> Final Report Card
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
                      <Badge className={`${getGradeColor(mark.grade || 'A')} border-none px-4 py-1.5 rounded-full font-bold`}>
                        Grade {mark.grade || 'N/A'}
                      </Badge>
                   </div>
                   <h3 className="text-xl font-display font-bold text-slate-900 mb-1">{mark.examSchedule?.subject}</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{mark.examSchedule?.exam?.name || 'Academic Exam'}</p>
                   
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                         <span className="text-slate-400 uppercase tracking-wider">Scored</span>
                         <span className="text-slate-900">{mark.marksObtained} / {mark.totalMarks}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-primary rounded-full transition-all duration-1000" 
                           style={{ width: `${(mark.marksObtained / mark.totalMarks) * 100}%` }}
                         />
                      </div>
                   </div>
                </Card>
              ))}

              {marks.length === 0 && (
                <Card className="col-span-full border-none shadow-sm bg-slate-50/50 rounded-[3rem] py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                   <Trophy className="w-16 h-16 text-slate-200 mb-6" />
                   <h3 className="text-xl font-bold text-slate-900">No Grades Yet</h3>
                   <p className="text-slate-400 mt-2 font-medium">Your examination results will be published here.</p>
                </Card>
              )}
           </div>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <Award className="w-10 h-10 text-amber-400 mb-6" />
              <h3 className="text-2xl font-display font-bold mb-1">Academic Rank</h3>
              <p className="text-slate-400 font-medium text-sm mb-8">Overall performance in Class {student?.grade}-{student?.section}</p>
              
              <div className="flex items-baseline gap-2 mb-8">
                 <span className="text-6xl font-display font-bold text-white">04</span>
                 <span className="text-xl font-bold text-slate-500 uppercase tracking-widest">/ 42</span>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>Percentile</span>
                    <span className="text-emerald-400">92nd</span>
                 </div>
                 <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                 </div>
              </div>
           </Card>

           <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
              <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Recent Accolades
              </h4>
              <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold"><Trophy className="w-5 h-5" /></div>
                    <div>
                       <div className="text-sm font-bold text-slate-900">Math Olympiad</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Silver Medalist</div>
                    </div>
                 </div>
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold"><TrendingUp className="w-5 h-5" /></div>
                    <div>
                       <div className="text-sm font-bold text-slate-900">Most Improved</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">April 2024</div>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentPerformance;
