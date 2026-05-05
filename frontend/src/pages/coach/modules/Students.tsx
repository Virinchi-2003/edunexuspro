import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  UserPlus,
  RefreshCw,
  Trophy,
  Filter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const CoachStudents: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [schoolStudents, setSchoolStudents] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    grade: '',
    section: '',
    sportId: '',
    manualSportName: ''
  });
  const [isManualSport, setIsManualSport] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrolledRes, schoolRes, sportsRes] = await Promise.all([
        api.get(`/coach/enrolled-students/${user.schoolId}`),
        api.get(`/coach/school-students/${user.schoolId}`),
        api.get(`/coach/sports/${user.schoolId}`)
      ]);
      
      setEnrolledStudents(enrolledRes.data.data);
      setSchoolStudents(schoolRes.data.data);
      setSports(sportsRes.data.data);
    } catch (error) {
      toast.error('Failed to load students data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (type: 'new' | 'existing') => {
    try {
      setSaving(true);
      if (type === 'new') {
        await api.post('/coach/students', {
          ...formData,
          sportId: isManualSport ? undefined : formData.sportId,
          manualSportName: isManualSport ? formData.manualSportName : undefined,
          schoolId: user.schoolId
        });
        toast.success('New student added and enrolled');
      } else {
        await api.post('/coach/students/enroll', {
          studentId: selectedStudent.id,
          sportId: isManualSport ? undefined : formData.sportId,
          manualSportName: isManualSport ? formData.manualSportName : undefined,
          schoolId: user.schoolId
        });
        toast.success('Student enrolled in sport');
      }
      setIsAddModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStudent = async () => {
    try {
      setSaving(true);
      await api.put(`/coach/students/${selectedStudent.id}`, formData);
      toast.success('Student details updated');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleUnenroll = async (studentId: string, sportId: string) => {
    if (!confirm('Are you sure you want to remove this student from the sport?')) return;
    try {
      await api.delete(`/coach/students/${studentId}/enrollment/${sportId}`);
      toast.success('Student unenrolled');
      fetchData();
    } catch (error) {
      toast.error('Failed to unenroll student');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      studentId: '',
      grade: '',
      section: '',
      sportId: sports.length > 0 ? sports[0].id : ''
    });
    setSelectedStudent(null);
  };

  const filteredStudents = enrolledStudents.filter(item => 
    item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sport.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Search name, ID or sport..." 
            className="pl-12 h-14 rounded-2xl border-none shadow-xl bg-white focus-visible:ring-2 focus-visible:ring-indigo-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="rounded-2xl h-14 px-6 font-bold bg-white border-slate-100 text-slate-600 gap-2 flex-1 md:flex-none"
            onClick={fetchData}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button 
            className="rounded-2xl h-14 px-8 font-bold bg-slate-900 text-white shadow-xl hover:bg-slate-800 gap-2 flex-1 md:flex-none"
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="w-5 h-5" />
            Add Student
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="p-10 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-display font-bold text-slate-900">Sports Roster</CardTitle>
              <CardDescription className="text-slate-500 font-medium mt-1">Manage athletes enrolled in sports programs</CardDescription>
            </div>
            <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
              {filteredStudents.length} Active Athletes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-10 py-6 text-left">Athlete Name</th>
                  <th className="px-10 py-6 text-left">Student ID</th>
                  <th className="px-10 py-6 text-left">Class & Section</th>
                  <th className="px-10 py-6 text-left">Sport Activity</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                       <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching Roster...</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400">
                       No students found. Add your first athlete!
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            {item.student.name.charAt(0)}
                          </div>
                          <div className="font-bold text-slate-900">{item.student.name}</div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-sm text-slate-600 font-mono">
                        {item.student.studentId}
                      </td>
                      <td className="px-10 py-6">
                        <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-600 border-slate-200">
                          {item.student.grade} - {item.student.section}
                        </Badge>
                      </td>
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="font-bold text-slate-700">{item.sport.name}</span>
                         </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => {
                              setSelectedStudent(item.student);
                              setFormData({
                                name: item.student.name,
                                studentId: item.student.studentId,
                                grade: item.student.grade,
                                section: item.student.section,
                                sportId: item.sportId
                              });
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => handleUnenroll(item.studentId, item.sportId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <Tabs defaultValue="import" className="w-full">
            <div className="bg-slate-900 p-10 pb-6 text-white">
              <DialogTitle className="text-3xl font-display font-bold">Add Athlete</DialogTitle>
              <DialogDescription className="text-slate-400 mt-2">Bring students into the sports program</DialogDescription>
              
              <TabsList className="bg-white/10 p-1 rounded-2xl mt-8 w-full border border-white/5 h-14">
                <TabsTrigger value="import" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 h-12">
                  <RefreshCw className="w-4 h-4 mr-2" /> Sync from School
                </TabsTrigger>
                <TabsTrigger value="new" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 h-12">
                  <Plus className="w-4 h-4 mr-2" /> Direct Entry
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-10 pt-6 bg-white">
              <TabsContent value="import" className="mt-0">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Search Student from School</label>
                    <Select onValueChange={(val) => {
                      const student = schoolStudents.find(s => s.id === val);
                      setSelectedStudent(student);
                    }}>
                      <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none px-6">
                        <SelectValue placeholder="Select a student..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                        {schoolStudents.map(s => (
                          <SelectItem key={s.id} value={s.id} className="rounded-xl h-12 focus:bg-indigo-50">
                            {s.name} ({s.studentId}) - {s.grade}{s.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStudent && (
                    <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center gap-4 animate-in fade-in zoom-in-95">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-bold text-indigo-600">
                        {selectedStudent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{selectedStudent.name}</div>
                        <div className="text-xs text-indigo-600 font-bold uppercase tracking-tighter">
                          ID: {selectedStudent.studentId} • {selectedStudent.grade}-{selectedStudent.section}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assign Sport Activity</label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px] font-bold text-indigo-600 hover:bg-indigo-50"
                        onClick={() => setIsManualSport(!isManualSport)}
                      >
                        {isManualSport ? 'Select from list' : '+ Add New Sport'}
                      </Button>
                    </div>
                    {isManualSport ? (
                      <Input 
                        placeholder="Enter sport name (e.g. Swimming)" 
                        className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                        value={formData.manualSportName}
                        onChange={(e) => setFormData({...formData, manualSportName: e.target.value})}
                      />
                    ) : (
                      <Select onValueChange={(val) => setFormData({...formData, sportId: val})}>
                        <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none px-6">
                          <SelectValue placeholder="Select sport..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                          {sports.map(sport => (
                            <SelectItem key={sport.id} value={sport.id} className="rounded-xl h-12 focus:bg-indigo-50">
                              {sport.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <Button 
                    className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100"
                    onClick={() => handleAddStudent('existing')}
                    disabled={saving || !selectedStudent || !formData.sportId}
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5 mr-2" />}
                    Enroll Selected Athlete
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="new" className="mt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                      <Input 
                        placeholder="Student Name" 
                        className="rounded-2xl h-12 bg-slate-50 border-none px-4"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Student ID</label>
                      <Input 
                        placeholder="STU001" 
                        className="rounded-2xl h-12 bg-slate-50 border-none px-4 font-mono"
                        value={formData.studentId}
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Grade / Class</label>
                      <Input 
                        placeholder="e.g., 10" 
                        className="rounded-2xl h-12 bg-slate-50 border-none px-4"
                        value={formData.grade}
                        onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Section</label>
                      <Input 
                        placeholder="e.g., A" 
                        className="rounded-2xl h-12 bg-slate-50 border-none px-4"
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sport Activity</label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[9px] font-bold text-slate-900 hover:bg-slate-100"
                        onClick={() => setIsManualSport(!isManualSport)}
                      >
                        {isManualSport ? 'Select from list' : '+ Add New Sport'}
                      </Button>
                    </div>
                    {isManualSport ? (
                      <Input 
                        placeholder="Enter sport name (e.g. Swimming)" 
                        className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                        value={formData.manualSportName}
                        onChange={(e) => setFormData({...formData, manualSportName: e.target.value})}
                      />
                    ) : (
                      <Select onValueChange={(val) => setFormData({...formData, sportId: val})}>
                        <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none px-6 text-slate-500">
                          <SelectValue placeholder="Select sport..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                          {sports.map(sport => (
                            <SelectItem key={sport.id} value={sport.id} className="rounded-xl h-12 focus:bg-indigo-50">
                              {sport.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full h-16 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl"
                      onClick={() => handleAddStudent('new')}
                      disabled={saving || !formData.name || (isManualSport ? !formData.manualSportName : !formData.sportId)}
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
                      Add and Enroll
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-10 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Edit Athlete Details</DialogTitle>
            <DialogDescription>Update information for {selectedStudent?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                <Input 
                  className="rounded-2xl h-12 bg-slate-50 border-none px-4"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Grade</label>
                  <Input 
                    className="rounded-2xl h-12 bg-slate-50 border-none px-4"
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Section</label>
                  <Input 
                    className="rounded-2xl h-12 bg-slate-50 border-none px-4"
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                  />
                </div>
             </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              onClick={handleUpdateStudent}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachStudents;
