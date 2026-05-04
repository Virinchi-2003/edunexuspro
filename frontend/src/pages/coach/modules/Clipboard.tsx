import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Users, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Save, 
  Loader2,
  ChevronRight,
  Plus
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
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [assessmentForm, setAssessmentForm] = useState({
    skill: '',
    score: 5,
    comments: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coach/sports/${user.schoolId}`);
      setSportsList(res.data.data);
      if (res.data.data.length > 0) {
        setActiveSport(res.data.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load sports data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (sportId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/coach/students/${sportId}`);
      setStudents(res.data.data.map((e: any) => e.student));
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
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
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        schoolId: user.schoolId,
        date: new Date().toISOString().split('T')[0],
        status,
        remarks: 'Field Attendance'
      }));

      if (records.length === 0) {
        toast.error('No attendance marked');
        return;
      }

      await api.post('/attendance/mark', { schoolId: user.schoolId, records });
      toast.success('Field attendance saved');
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sport Selector */}
      <div className="flex flex-wrap gap-4">
        {sportsList.map((sport) => (
          <Button
            key={sport.id}
            variant={activeSport?.id === sport.id ? 'default' : 'outline'}
            onClick={() => setActiveSport(sport)}
            className={`rounded-2xl h-14 px-8 font-bold transition-all ${
              activeSport?.id === sport.id 
                ? 'bg-slate-900 text-white shadow-xl scale-105' 
                : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {sport.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance List */}
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-2xl font-display font-bold">Field Attendance</CardTitle>
               <CardDescription>Mark attendance for today's {activeSport?.name} session</CardDescription>
            </div>
            <Button 
              className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold gap-2"
              onClick={saveAttendance}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Sync Today
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-10 py-6 text-left">Athlete</th>
                    <th className="px-10 py-6 text-center">Status</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                             <div className="font-bold text-slate-900">{student.name}</div>
                             <div className="text-[10px] text-slate-400 font-medium">Class {student.grade}-{student.section}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center justify-center gap-2">
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => toggleAttendance(student.id)}
                             className={`rounded-xl px-4 h-10 font-bold transition-all ${
                               attendance[student.id] === 'present' 
                                 ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                 : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                             }`}
                           >
                             {attendance[student.id] === 'present' ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                             {attendance[student.id] === 'present' ? 'Present' : 'Mark Present'}
                           </Button>
                           {attendance[student.id] === 'present' && (
                             <Button
                               size="icon"
                               variant="ghost"
                               onClick={() => {
                                 setAttendance(prev => ({ ...prev, [student.id]: 'absent' }));
                               }}
                               className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-50"
                             >
                               <XCircle className="w-4 h-4" />
                             </Button>
                           )}
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="rounded-xl text-indigo-600 font-bold hover:bg-indigo-50"
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
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Training Insights */}
        <div className="space-y-6">
           <Card className="border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative z-10">
                 <h4 className="text-xl font-bold mb-6">Training Load Tracker</h4>
                 <div className="space-y-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">Daily Average Intensity</p>
                       <div className="flex items-end justify-between mt-2">
                          <span className="text-3xl font-display font-black">7.4<span className="text-sm font-normal text-indigo-200">/10</span></span>
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-none px-3 py-1 rounded-full text-[9px] font-bold">Optimal Load</Badge>
                       </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                       <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">Potential Overload Risks</p>
                       <div className="flex items-center gap-3 mt-4">
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-sm font-bold">3 Athletes flagged for fatigue</span>
                       </div>
                    </div>
                 </div>
                 <Button className="w-full mt-8 rounded-2xl bg-white text-indigo-600 font-bold h-12 shadow-xl shadow-black/10">
                    Generate Load Analysis
                 </Button>
              </div>
           </Card>

           <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
              <h4 className="text-lg font-bold text-slate-900 mb-6">Recent Assessments</h4>
              <div className="space-y-4">
                 {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                       <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xs font-bold text-indigo-600">
                          {i === 0 ? 'FB' : i === 1 ? 'BB' : 'SK'}
                       </div>
                       <div className="flex-1">
                          <div className="text-xs font-bold text-slate-900">Sprint Speed</div>
                          <div className="text-[9px] text-slate-400 font-medium">Player: Aryan Khan • 2h ago</div>
                       </div>
                       <div className="text-sm font-black text-indigo-600">4.5/5</div>
                    </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>

      {/* Skill Assessment Modal */}
      <Dialog open={isAssessmentModalOpen} onOpenChange={setIsAssessmentModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Skill Assessment</DialogTitle>
            <DialogDescription>Log a skill rating for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Skill Category</label>
              <Input 
                placeholder="e.g., Dribbling, Stamina, Defense" 
                className="rounded-2xl h-12 bg-slate-50 border-none px-4"
                value={assessmentForm.skill}
                onChange={(e) => setAssessmentForm({...assessmentForm, skill: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Rating (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <Button
                    key={val}
                    variant={assessmentForm.score === val ? 'default' : 'outline'}
                    onClick={() => setAssessmentForm({...assessmentForm, score: val})}
                    className={`flex-1 h-12 rounded-xl font-bold ${
                      assessmentForm.score === val ? 'bg-indigo-600 text-white shadow-lg' : 'border-slate-100 text-slate-400'
                    }`}
                  >
                    {val}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Coach's Comments</label>
              <textarea 
                className="w-full min-h-[100px] rounded-2xl bg-slate-50 border-none p-4 text-sm focus:ring-2 focus:ring-indigo-100"
                placeholder="Observed strong progress in ball control..."
                value={assessmentForm.comments}
                onChange={(e) => setAssessmentForm({...assessmentForm, comments: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg"
              onClick={submitAssessment}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              Save Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachClipboard;
