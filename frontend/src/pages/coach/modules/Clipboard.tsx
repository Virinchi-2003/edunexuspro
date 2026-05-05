import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Loader2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText,
  Clock,
  UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const CoachClipboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [activeSport, setActiveSport] = useState<any>(null);
  const [sportsList, setSportsList] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [loadData, setLoadData] = useState<any>({
    avgIntensity: 0,
    flaggedCount: 0,
    flaggedStudents: []
  });

  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [assessmentForm, setAssessmentForm] = useState({
    skill: '',
    score: 5,
    comments: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sportsRes, assessmentsRes, loadRes] = await Promise.all([
        api.get(`/coach/sports/${user.schoolId}`),
        api.get(`/coach/analytics/recent-assessments/${user.schoolId}`),
        api.get(`/coach/analytics/training-load/${user.schoolId}`)
      ]);
      
      setSportsList(sportsRes.data.data);
      setRecentAssessments(assessmentsRes.data.data);
      setLoadData(loadRes.data.data);
      
      if (sportsRes.data.data.length > 0 && !activeSport) {
        setActiveSport(sportsRes.data.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load sports data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (sportId: string) => {
    try {
      const res = await api.get(`/coach/students/${sportId}/${user.schoolId}`);
      const fetchedStudents = res.data.data.map((e: any) => e.student);
      setStudents(fetchedStudents);
      
      // Auto-initialize attendance as present
      const initialAttendance: Record<string, string> = {};
      fetchedStudents.forEach((s: any) => {
        initialAttendance[s.id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSport) {
      fetchStudents(activeSport.id);
    }
  }, [activeSport]);

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        schoolId: user.schoolId,
        date: today,
        status,
        remarks: `Field Attendance - ${activeSport.name}`
      }));

      if (records.length === 0) return toast.error('No attendance marked');

      // 1. Mark Attendance
      await api.post('/attendance/mark', { schoolId: user.schoolId, records });

      // 2. Create Training Logs for present students
      const presentStudentIds = Object.entries(attendance)
        .filter(([_, status]) => status === 'present')
        .map(([id]) => id);

      await Promise.all(presentStudentIds.map(studentId => 
        api.post('/coach/training-log', {
          studentId,
          schoolId: user.schoolId,
          sportId: activeSport.id,
          date: today,
          intensity: 7, // Default intensity
          loadScore: 7,
          notes: 'Standard session'
        })
      ));

      toast.success(`Field attendance & ${presentStudentIds.length} training logs synced`);
      fetchData(); // Refresh analytics
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const submitAssessment = async () => {
    try {
      setSaving(true);
      await api.post('/coach/assessment', {
        ...assessmentForm,
        studentId: selectedStudent.id,
        schoolId: user.schoolId,
        sportId: activeSport.id,
        assessedBy: user.uid
      });
      toast.success(`Assessment logged for ${selectedStudent.name}`);
      setIsAssessmentModalOpen(false);
      setAssessmentForm({ skill: '', score: 5, comments: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading && sportsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Loading Digital Clipboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Sport Selector */}
      <div className="flex flex-wrap gap-4 overflow-x-auto pb-4 no-scrollbar">
        {sportsList.map((sport) => (
          <Button
            key={sport.id}
            variant={activeSport?.id === sport.id ? 'default' : 'outline'}
            onClick={() => setActiveSport(sport)}
            className={`rounded-2xl h-14 px-8 font-bold transition-all whitespace-nowrap border-none ${
              activeSport?.id === sport.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' 
                : 'bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm'
            }`}
          >
            {sport.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance List */}
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <CardTitle className="text-3xl font-display font-bold text-slate-900">Field Attendance</CardTitle>
               <CardDescription className="text-slate-500 font-medium mt-1">Today's {activeSport?.name} roster for {new Date().toLocaleDateString()}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
               <Button 
                 variant="outline"
                 className="rounded-2xl border-slate-100 text-slate-400 font-bold h-14 px-6 hover:bg-slate-50"
                 onClick={() => {
                   const allPresent: Record<string, string> = {};
                   students.forEach(s => allPresent[s.id] = 'present');
                   setAttendance(allPresent);
                 }}
               >
                 Mark All
               </Button>
               <Button 
                 className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 font-bold gap-2 px-8 h-14 transition-all hover:scale-[1.02]"
                 onClick={saveAttendance}
                 disabled={saving}
               >
                 {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                 Sync Today
               </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-10 py-6 text-left">Athlete</th>
                    <th className="px-10 py-6 text-center">Status</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center font-bold shadow-sm transition-all duration-500">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                             <div className="font-bold text-slate-900 text-lg">{student.name}</div>
                             <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Grade {student.grade}-{student.section}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                         <div className="flex items-center justify-center gap-3">
                            <Button
                              size="lg"
                              variant="ghost"
                              onClick={() => toggleAttendance(student.id)}
                              className={`rounded-2xl px-8 h-12 font-bold transition-all border-2 ${
                                 attendance[student.id] === 'present' 
                                   ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                   : 'bg-white text-slate-300 border-slate-50 hover:bg-slate-50 hover:text-slate-400'
                              }`}
                            >
                              {attendance[student.id] === 'present' ? <UserCheck className="w-5 h-5 mr-2" /> : <Activity className="w-5 h-5 mr-2" />}
                              {attendance[student.id] === 'present' ? 'Attended' : 'Mark Present'}
                            </Button>
                            {attendance[student.id] === 'present' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'absent' }))}
                                className="h-12 w-12 rounded-2xl text-rose-500 hover:bg-rose-50 group-hover:scale-110 transition-transform"
                              >
                                <XCircle className="w-5 h-5" />
                              </Button>
                            )}
                         </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <Button 
                           variant="ghost" 
                           className="rounded-2xl text-indigo-600 font-bold hover:bg-indigo-50 px-6 h-12"
                           onClick={() => {
                             setSelectedStudent(student);
                             setIsAssessmentModalOpen(true);
                           }}
                         >
                           Assess Skill <ChevronRight className="w-4 h-4 ml-1" />
                         </Button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-32 text-center text-slate-400">
                         <div className="flex flex-col items-center">
                            <Activity className="w-12 h-12 mb-4 opacity-10" />
                            <p className="font-bold uppercase text-[10px] tracking-widest">No athletes enrolled in this sport yet.</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Training Insights */}
        <div className="space-y-8">
           <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-32 -mt-32 blur-[100px]" />
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                       <TrendingUp className="w-8 h-8" />
                    </div>
                    <h4 className="text-2xl font-display font-bold">Training Load</h4>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Avg. Daily Intensity</p>
                       <div className="flex items-end justify-between mt-3">
                          <span className="text-5xl font-display font-black tracking-tighter">{loadData.avgIntensity}<span className="text-base font-normal text-indigo-400 ml-1">/10</span></span>
                          <Badge className={`border-none px-4 py-1.5 rounded-full text-[10px] font-bold ${
                             loadData.avgIntensity > 8 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                          }`}>
                             {loadData.avgIntensity > 8 ? 'Overload' : 'Optimal Zone'}
                          </Badge>
                       </div>
                    </div>

                    <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400 flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Potential Risks
                       </p>
                       <div className="mt-4 space-y-3">
                          {loadData.flaggedStudents.map((s: any, i: number) => (
                             <div key={i} className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-white/5 pb-2">
                                <span>{s.name}</span>
                                <span className="text-rose-400">High Load: {s.score}</span>
                             </div>
                          ))}
                          {loadData.flaggedCount === 0 && (
                             <div className="text-xs font-bold text-emerald-400">All athletes within recovery limits.</div>
                          )}
                       </div>
                    </div>
                 </div>
                 <Button 
                   className="w-full mt-10 rounded-[1.5rem] bg-white text-slate-900 font-bold h-16 shadow-2xl hover:scale-[1.02] transition-transform text-lg"
                   onClick={() => setIsAnalysisModalOpen(true)}
                  >
                    <FileText className="w-6 h-6 mr-3 text-indigo-600" /> Load Analysis Report
                 </Button>
              </div>
           </Card>

           <Card className="border-none shadow-xl rounded-[3rem] bg-white p-10">
              <h4 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <Clock className="w-6 h-6 text-indigo-600" /> Recent Feedback
              </h4>
              <div className="space-y-6">
                 {recentAssessments.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                       <p className="text-xs font-bold uppercase tracking-widest">No recent assessments</p>
                    </div>
                 ) : (
                    recentAssessments.map((t, i) => (
                       <div key={i} className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-slate-50 border border-slate-50 group hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xs font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             {t.sport?.name?.slice(0, 2).toUpperCase() || 'SP'}
                          </div>
                          <div className="flex-1">
                             <div className="text-sm font-bold text-slate-900">{t.skill}</div>
                             <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                               {t.student?.name} • {new Date(t.createdAt).toLocaleDateString()}
                             </div>
                          </div>
                          <div className="text-lg font-black text-indigo-600">{t.score}<span className="text-[10px] font-normal text-slate-400 ml-0.5">/5</span></div>
                       </div>
                    ))
                 )}
              </div>
           </Card>
        </div>
      </div>

      {/* Skill Assessment Modal */}
      <Dialog open={isAssessmentModalOpen} onOpenChange={setIsAssessmentModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Skill Assessment</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Log a performance rating for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Skill Category</label>
              <Input 
                placeholder="e.g., Dribbling, Stamina, Defense" 
                className="rounded-2xl h-16 bg-slate-50 border-none px-8 font-bold text-lg"
                value={assessmentForm.skill}
                onChange={(e) => setAssessmentForm({...assessmentForm, skill: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Rating (Out of 5)</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((val) => (
                  <Button
                    key={val}
                    variant={assessmentForm.score === val ? 'default' : 'outline'}
                    onClick={() => setAssessmentForm({...assessmentForm, score: val})}
                    className={`flex-1 h-14 rounded-2xl font-black text-lg transition-all ${
                      assessmentForm.score === val 
                        ? 'bg-indigo-600 text-white shadow-xl scale-110' 
                        : 'border-slate-100 bg-white text-slate-300 hover:border-indigo-200'
                    }`}
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Coach's Comments</label>
              <textarea 
                className="w-full min-h-[120px] rounded-[1.5rem] bg-slate-50 border-none p-6 text-sm font-medium focus:ring-2 focus:ring-indigo-100 resize-none"
                placeholder="Share your technical observations..."
                value={assessmentForm.comments}
                onChange={(e) => setAssessmentForm({...assessmentForm, comments: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xl shadow-2xl shadow-slate-200"
              onClick={submitAssessment}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 mr-3" />}
              Archive Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analysis Report Modal */}
      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Load Analysis Report</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Institutional athlete fatigue and recovery audit.</DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-10">
             <div className="p-8 rounded-[2rem] bg-indigo-50 border border-indigo-100">
                <div className="flex items-center justify-between mb-6">
                   <h5 className="font-bold text-indigo-900">Session Intensity Distribution</h5>
                   <Badge className="bg-indigo-600 text-white">Active Cycles</Badge>
                 </div>
                 <div className="space-y-4">
                    <div className="h-4 bg-white rounded-full overflow-hidden flex">
                       <div className="h-full bg-emerald-500 w-[60%]" />
                       <div className="h-full bg-amber-500 w-[30%]" />
                       <div className="h-full bg-rose-500 w-[10%]" />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-400">
                       <span>Low (60%)</span>
                       <span>Mod (30%)</span>
                       <span>High (10%)</span>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h5 className="text-sm font-bold text-slate-900 px-1">At-Risk Athletes</h5>
                 {loadData.flaggedStudents.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-rose-50 border border-rose-100">
                       <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                          <div>
                             <div className="font-bold text-slate-900">{s.name}</div>
                             <div className="text-[10px] text-rose-500 font-bold uppercase">{s.reason}</div>
                          </div>
                       </div>
                       <Button variant="outline" className="rounded-xl border-rose-200 text-rose-600 font-bold h-10">Schedule Recovery</Button>
                    </div>
                 ))}
                 {loadData.flaggedCount === 0 && (
                    <div className="text-center py-10 text-slate-300 italic">
                       No athletes currently at high fatigue risk.
                    </div>
                 )}
              </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachClipboard;
