import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Plus, 
  Scale, 
  Ruler, 
  History, 
  TrendingUp, 
  User,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const CoachMeasurements: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    chest: '',
    waist: '',
    fatPercentage: '',
    muscleMass: '',
    notes: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, measurementsRes] = await Promise.all([
        api.get(`/coach/school-students/${user.schoolId}`),
        api.get(`/coach/measurements/${user.schoolId}`)
      ]);
      setStudents(studentsRes.data.data || []);
      setMeasurements(measurementsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to sync measurement data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const calculateBMI = (h: number, w: number) => {
    if (!h || !w) return 0;
    const heightInMeters = h / 100;
    return (w / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    try {
      setIsSaving(true);
      const h = parseFloat(formData.height);
      const w = parseFloat(formData.weight);
      const bmi = calculateBMI(h, w);

      const payload = {
        schoolId: user.schoolId,
        studentId: selectedStudent.id,
        height: h,
        weight: w,
        bmi: parseFloat(bmi as string),
        chest: parseFloat(formData.chest) || null,
        waist: parseFloat(formData.waist) || null,
        fatPercentage: parseFloat(formData.fatPercentage) || null,
        muscleMass: parseFloat(formData.muscleMass) || null,
        notes: formData.notes,
        recordedBy: user.id
      };

      await api.post('/coach/measurements', payload);
      toast.success(`Measurements logged for ${selectedStudent.name}`);
      setIsAddModalOpen(false);
      setFormData({ height: '', weight: '', chest: '', waist: '', fatPercentage: '', muscleMass: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to save measurements');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this measurement record?')) return;
    try {
      setIsDeleting(id);
      await api.delete(`/coach/measurements/${id}`);
      toast.success('Record deleted');
      fetchData();
      if (isHistoryModalOpen && historyStudent) {
         handleViewHistory(historyStudent);
      }
    } catch (error) {
      toast.error('Delete failed');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewHistory = async (student: any) => {
    try {
      setHistoryStudent(student);
      const res = await api.get(`/coach/measurements/${user.schoolId}?studentId=${student.id}`);
      setHistoryData(res.data.data || []);
      setIsHistoryModalOpen(true);
    } catch (error) {
      toast.error('Failed to load history');
    }
  };

  const grades = ['All', ...new Set(students.map(s => s.grade))].sort();
  const sections = ['All', ...new Set(students.map(s => s.section))].sort();

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'All' || s.grade === selectedGrade;
    const matchesSection = selectedSection === 'All' || s.section === selectedSection;
    return matchesSearch && matchesGrade && matchesSection;
  });

  const getLatestMeasurement = (studentId: string) => {
    return measurements.find(m => m.studentId === studentId);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200">
                 <Activity className="w-7 h-7" />
              </div>
              <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Athlete Measurements</h2>
           </div>
           <p className="text-slate-500 font-medium ml-1">Track physical evolution and body composition of your squad.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             className="rounded-[1.5rem] bg-slate-900 text-white shadow-xl hover:bg-slate-800 px-8 h-14 font-bold gap-2"
             onClick={() => {
                setSelectedStudent(null);
                setIsAddModalOpen(true);
             }}
           >
             <Plus className="w-5 h-5" /> Log New Metrics
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="pb-2">
                 <CardTitle className="text-lg font-bold text-slate-800">Quick Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Search athletes..." 
                      className="pl-10 bg-slate-50 border-none h-12 rounded-xl focus:ring-2 focus:ring-indigo-100"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Grade / Class</label>
                       <select 
                         className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 appearance-none"
                         value={selectedGrade}
                         onChange={(e) => setSelectedGrade(e.target.value)}
                       >
                          {grades.map(g => (
                             <option key={g} value={g}>{g === 'All' ? 'All Grades' : `Grade ${g}`}</option>
                          ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Section</label>
                       <select 
                         className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 appearance-none"
                         value={selectedSection}
                         onChange={(e) => setSelectedSection(e.target.value)}
                       >
                          {sections.map(s => (
                             <option key={s} value={s}>{s === 'All' ? 'All Sections' : `Section ${s}`}</option>
                          ))}
                       </select>
                    </div>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-50">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-slate-500 font-bold hover:bg-slate-50"
                      onClick={() => {
                        setSelectedGrade('All');
                        setSelectedSection('All');
                        setSearchQuery('');
                      }}
                    >
                       Reset Filters
                    </Button>
                 </div>
              </CardContent>
           </Card>

         </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                 Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse bg-slate-100 border-none h-64 rounded-[2.5rem]" />
                 ))
              ) : filteredStudents.length === 0 ? (
                 <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <User className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                    <h3 className="text-xl font-bold text-slate-400">No athletes found matching your search.</h3>
                 </div>
              ) : filteredStudents.map((student) => {
                 const latest = getLatestMeasurement(student.id);
                 return (
                    <Card key={student.id} className="border-none shadow-xl rounded-[2.5rem] bg-white group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden border border-transparent hover:border-indigo-100">
                       <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                             <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-indigo-600 text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                   {student.name.charAt(0)}
                                </div>
                                <div>
                                   <h4 className="font-bold text-slate-900">{student.name}</h4>
                                   <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[9px] uppercase tracking-widest font-black mt-1">Grade {student.grade}-{student.section}</Badge>
                                </div>
                             </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="icon" className="rounded-full text-slate-400"><MoreVertical className="w-5 h-5" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl p-2 border-none shadow-2xl">
                                   <DropdownMenuItem className="rounded-xl font-bold gap-2 text-indigo-600" onClick={() => {
                                      setSelectedStudent(student);
                                      setIsAddModalOpen(true);
                                   }}><Plus className="w-4 h-4" /> New Record</DropdownMenuItem>
                                   <DropdownMenuItem 
                                      className="rounded-xl font-bold gap-2"
                                      onClick={() => handleViewHistory(student)}
                                    >
                                       <History className="w-4 h-4" /> View History
                                    </DropdownMenuItem>
                                   {latest && (
                                     <DropdownMenuItem className="rounded-xl font-bold gap-2 text-rose-600" onClick={() => handleDelete(latest.id)}>
                                        <Trash2 className="w-4 h-4" /> Delete Latest
                                     </DropdownMenuItem>
                                   )}
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </div>
                       </CardHeader>
                       <CardContent>
                          {latest ? (
                             <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                                      <div className="flex items-center gap-2 mb-1">
                                         <Ruler className="w-3 h-3 text-indigo-500" />
                                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Height</span>
                                      </div>
                                      <div className="text-xl font-black text-slate-900">{latest.height}<span className="text-xs ml-1 text-slate-400 font-bold">cm</span></div>
                                   </div>
                                   <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                                      <div className="flex items-center gap-2 mb-1">
                                         <Scale className="w-3 h-3 text-emerald-500" />
                                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Weight</span>
                                      </div>
                                      <div className="text-xl font-black text-slate-900">{latest.weight}<span className="text-xs ml-1 text-slate-400 font-bold">kg</span></div>
                                   </div>
                                </div>
                                <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-50">
                                   <div className="flex flex-col">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current BMI</span>
                                      <span className="text-sm font-black text-indigo-600">{latest.bmi}</span>
                                   </div>
                                   <div className="flex flex-col text-right">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Last Update</span>
                                      <span className="text-xs font-bold text-slate-500">{new Date(latest.createdAt).toLocaleDateString()}</span>
                                   </div>
                                </div>
                             </div>
                          ) : (
                             <div className="py-12 text-center bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-100">
                                <Activity className="w-8 h-8 mx-auto mb-3 text-slate-200" />
                                <p className="text-xs font-bold text-slate-400">No data available.</p>
                                <Button variant="link" className="text-indigo-600 font-bold h-auto p-0 mt-1" onClick={() => {
                                   setSelectedStudent(student);
                                   setIsAddModalOpen(true);
                                }}>Log Metrics</Button>
                             </div>
                          )}
                       </CardContent>
                    </Card>
                 );
              })}
           </div>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
         <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
            <div className="h-32 bg-indigo-600 p-8 flex items-end">
               <DialogTitle className="text-3xl font-display font-bold text-white">Log Metrics</DialogTitle>
            </div>
            <div className="p-8 space-y-6">
               {!selectedStudent ? (
                  <div className="space-y-4">
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400">Select Athlete</label>
                     <select 
                       className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-indigo-100"
                       onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value))}
                     >
                        <option value="">Choose an athlete...</option>
                        {students.map(s => (
                           <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                        ))}
                     </select>
                  </div>
               ) : (
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">{selectedStudent.name.charAt(0)}</div>
                     <div>
                        <div className="font-bold text-slate-900">{selectedStudent.name}</div>
                        <div className="text-xs text-slate-400">Grade {selectedStudent.grade}-{selectedStudent.section}</div>
                     </div>
                     <Button variant="ghost" size="sm" className="ml-auto text-indigo-600" onClick={() => setSelectedStudent(null)}>Change</Button>
                  </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400">Height (cm)</label>
                     <Input 
                       type="number" 
                       placeholder="175"
                       className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                       value={formData.height}
                       onChange={e => setFormData({...formData, height: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400">Weight (kg)</label>
                     <Input 
                       type="number" 
                       placeholder="68"
                       className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                       value={formData.weight}
                       onChange={e => setFormData({...formData, weight: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400">Chest (in)</label>
                     <Input 
                       type="number" 
                       placeholder="38"
                       className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                       value={formData.chest}
                       onChange={e => setFormData({...formData, chest: e.target.value})}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400">Waist (in)</label>
                     <Input 
                       type="number" 
                       placeholder="32"
                       className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold"
                       value={formData.waist}
                       onChange={e => setFormData({...formData, waist: e.target.value})}
                     />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Additional Notes</label>
                  <textarea 
                    className="w-full h-24 rounded-2xl bg-slate-50 border-none p-6 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Physical condition, injury notes, etc."
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
               </div>
            </div>
            <DialogFooter className="p-8 bg-slate-50 flex items-center justify-between">
               <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
               <Button 
                 className="rounded-[1.25rem] bg-indigo-600 px-10 h-12 font-bold shadow-xl shadow-indigo-600/20"
                 disabled={isSaving || !selectedStudent || !formData.height || !formData.weight}
                 onClick={handleSave}
               >
                 {isSaving ? 'Logging Metrics...' : 'Log Metrics'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
         <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
            <div className="h-32 bg-slate-900 p-8 flex items-end justify-between">
               <div>
                  <DialogTitle className="text-3xl font-display font-bold text-white">Measurement History</DialogTitle>
                  <p className="text-slate-400 font-medium">Tracking progress for {historyStudent?.name}</p>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {historyStudent?.name?.charAt(0)}
               </div>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
               {historyData.length === 0 ? (
                  <div className="text-center py-12">
                     <History className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                     <p className="text-slate-400 font-bold">No history records found.</p>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {historyData.map((record) => (
                        <div key={record.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-colors">
                           <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/50">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                 </div>
                                 <div>
                                    <div className="font-bold text-slate-900">{new Date(record.createdAt).toLocaleDateString()}</div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recorded By {record.recordedBy === user.id ? 'You' : 'Coach'}</div>
                                 </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                onClick={() => handleDelete(record.id)}
                                disabled={isDeleting === record.id}
                              >
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>

                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                              <div>
                                 <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                    <Ruler className="w-3 h-3" /> Height
                                 </div>
                                 <div className="font-bold text-slate-900">{record.height} cm</div>
                              </div>
                              <div>
                                 <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                    <Scale className="w-3 h-3" /> Weight
                                 </div>
                                 <div className="font-bold text-slate-900">{record.weight} kg</div>
                              </div>
                              <div>
                                 <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> BMI
                                 </div>
                                 <div className="font-bold text-indigo-600">{record.bmi}</div>
                              </div>
                              {(record.fatPercentage || record.muscleMass) && (
                                 <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                       <TrendingUp className="w-3 h-3" /> Composition
                                    </div>
                                    <div className="text-xs font-bold text-slate-700">
                                       {record.fatPercentage && `BF: ${record.fatPercentage}%`}
                                       {record.fatPercentage && record.muscleMass && ' | '}
                                       {record.muscleMass && `MM: ${record.muscleMass}kg`}
                                    </div>
                                 </div>
                              )}
                              {(record.chest || record.waist) && (
                                 <div className="col-span-full pt-2">
                                    <div className="flex gap-4">
                                       {record.chest && (
                                          <div>
                                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Chest: </span>
                                             <span className="text-xs font-bold text-slate-700">{record.chest} in</span>
                                          </div>
                                       )}
                                       {record.waist && (
                                          <div>
                                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Waist: </span>
                                             <span className="text-xs font-bold text-slate-700">{record.waist} in</span>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              )}
                              {record.notes && (
                                 <div className="col-span-full mt-2 p-3 bg-white rounded-xl border border-slate-100 italic text-xs text-slate-500">
                                    "{record.notes}"
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-end">
               <Button 
                 className="rounded-xl font-bold bg-slate-900 text-white"
                 onClick={() => setIsHistoryModalOpen(false)}
               >
                  Close History
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachMeasurements;
