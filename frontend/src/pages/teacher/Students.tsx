import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Mail, 
  Phone,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const TeacherStudents: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    parentName: '',
    email: '',
    phone: '',
    grade: '',
    section: '',
    password: ''
  });

  const fetchData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      
      // 1. Get teacher profile to know assigned classes
      const profileRes = await api.get(`/staff/user/${user.uid}`);
      const profile = profileRes.data.data;
      setTeacherProfile(profile);

      // Parse assigned classes (e.g. "10A, 11B")
      const assigned = profile.classes ? profile.classes.split(',').map((s: string) => s.trim().toLowerCase()) : [];

      // 2. Get all classes of the school
      const classesRes = await api.get(`/classes/school/${user.schoolId}`);
      const allClasses = classesRes.data.data || [];

      // 3. Filter classes that teacher teaches
      const filteredClasses = allClasses.filter((c: any) => {
        const className = c.name.toLowerCase().trim();
        const sectionName = c.section.toLowerCase().trim();
        
        // Clean class name: "10th" -> "10", "2nd" -> "2"
        const cleanClassName = className.replace(/(\d+)(st|nd|rd|th)/i, '$1');
        const cleanC = `${cleanClassName}${sectionName}`.replace(/[\s-]/g, '');
        
        return assigned.some(a => {
          const lowerA = a.toLowerCase().trim();
          // "10thA" -> "10A", "10 A" -> "10A", "Class 10-A" -> "class10A"
          const cleanA = lowerA.replace(/(\d+)(st|nd|rd|th)/i, '$1').replace(/[\s-]/g, '').replace(/^class/i, '');
          
          return cleanA === cleanC || 
                 cleanA === cleanClassName || // Match if only grade is assigned (e.g. "10th" assigned to teacher)
                 lowerA.includes(cleanC) || 
                 cleanA.includes(cleanC);
        });
      });

      console.log('Teacher assigned classes (raw):', profile.classes);
      console.log('Parsed assigned list:', assigned);
      console.log('All school classes:', allClasses.map((c: any) => `${c.name}${c.section}`));
      console.log('Filtered assigned classes:', filteredClasses.map((c: any) => `${c.name}${c.section}`));

      setClasses(filteredClasses);

      // 4. Fetch students for these specific classes only
      if (filteredClasses.length > 0) {
        const classIds = filteredClasses.map((c: any) => c.id);
        const studentsRes = await api.post('/students/multiple-classes', { classIds });
        setStudents(studentsRes.data.data || []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading teacher students:', error);
      toast.error('Failed to load assigned students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddStudent = async () => {
    if (!formData.studentId || !formData.name) {
      toast.error('Student ID and Name are required');
      return;
    }

    const currentClass = classes.find(c => c.id === selectedClass);
    if (!currentClass) return;

    try {
      setIsSaving(true);
      await api.post('/students', { 
        ...formData, 
        schoolId: user.schoolId,
        classId: currentClass.id,
        grade: currentClass.name,
        section: currentClass.section
      });
      toast.success('Student added successfully');
      setIsAddDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (student: any) => {
    setEditingId(student.id);
    setFormData({
      studentId: student.studentId,
      name: student.name,
      parentName: student.parentName || '',
      email: student.email || '',
      phone: student.phone || '',
      grade: student.grade,
      section: student.section || '',
      password: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    try {
      setIsSaving(true);
      await api.put(`/students/${editingId}`, formData);
      toast.success('Student details updated');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      name: '',
      parentName: '',
      email: '',
      phone: '',
      grade: '',
      section: '',
      password: ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this student record?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student record removed');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const currentClassData = selectedClass ? classes.find(c => c.id === selectedClass) : null;
  const filteredStudents = (students.filter(s => !selectedClass || s.classId === selectedClass))
    .filter((s: any) => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {selectedClass && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                onClick={() => setSelectedClass(null)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-3xl font-display font-bold text-slate-900">
              {selectedClass ? `Class ${currentClassData?.name}-${currentClassData?.section}` : 'My Assigned Classes'}
            </h2>
          </div>
          <p className="text-slate-500">
            {selectedClass 
              ? `Managing students for ${currentClassData?.name}${currentClassData?.section}.` 
              : `You are assigned to ${teacherProfile?.classes || 'no'} classes.`}
          </p>
        </div>
        {selectedClass && (
          <Button 
            className="gap-2 shadow-lg shadow-primary/20"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <UserIcon className="w-4 h-4" /> Add Student
          </Button>
        )}
      </div>

      {!selectedClass ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse bg-slate-50 border-none h-40" />
            ))
          ) : classes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
              <BookOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>No classes assigned to you yet.</p>
              <p className="text-sm">Contact the principal to assign classes to your profile.</p>
            </div>
          ) : (
            classes.map((cls: any) => {
              const studentCount = students.filter(s => s.classId === cls.id).length;
              return (
                <Card 
                  key={cls.id} 
                  className="group hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none shadow-sm overflow-hidden"
                  onClick={() => setSelectedClass(cls.id)}
                >
                  <div className="h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {cls.name}
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono">
                      {studentCount} Students
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                      Section {cls.section}
                    </div>
                    <p className="text-xs text-slate-500">View and update academic records for this class.</p>
                    <div className="mt-4 flex items-center text-xs font-bold text-primary group-hover:gap-2 transition-all">
                      Open Student List <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <Card className="border-none shadow-sm">
          <CardHeader className="p-0 border-b border-slate-100">
            <div className="flex items-center gap-4 p-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder={`Search in Section ${currentClassData?.section}...`} 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Parent Info</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                      No students found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((s: any) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{s.name}</div>
                            <div className="text-xs font-mono text-slate-400">{s.studentId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex items-center gap-2 text-sm">
                          <UserIcon className="w-3.5 h-3.5" />
                          {s.parentName || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs text-slate-500">
                          {s.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</div>}
                          {s.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(s.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display font-bold text-2xl">
              <UserIcon className="w-6 h-6 text-primary" />
              Add New Student
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Student ID / Roll No</label>
                <Input 
                  value={formData.studentId}
                  onChange={e => setFormData({...formData, studentId: e.target.value})}
                  placeholder="e.g. 2024-001"
                  className="bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name</label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Student's name"
                  className="bg-slate-50 border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Parent Name</label>
              <Input 
                value={formData.parentName}
                onChange={e => setFormData({...formData, parentName: e.target.value})}
                placeholder="Guardian's name"
                className="bg-slate-50 border-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email</label>
                <Input 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="student@school.com"
                  className="bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Phone</label>
                <Input 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91..."
                  className="bg-slate-50 border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Portal Password</label>
              <Input 
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="Default: student123"
                className="bg-slate-50 border-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStudent} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display font-bold text-2xl">
              <Pencil className="w-6 h-6 text-primary" />
              Edit Student Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Student ID</label>
                <Input value={formData.studentId} readOnly className="bg-slate-100 border-none cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name</label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-slate-50 border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Parent Name</label>
              <Input 
                value={formData.parentName}
                onChange={e => setFormData({...formData, parentName: e.target.value})}
                className="bg-slate-50 border-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email</label>
                <Input 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Phone</label>
                <Input 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="bg-slate-50 border-none"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStudent} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherStudents;
