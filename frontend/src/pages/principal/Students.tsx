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
  UserPlus, 
  Search, 
  Mail, 
  Phone,
  Trash2,
  Pencil,
  Loader2,
  GraduationCap,
  FileSpreadsheet,
  Download,
  Upload,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const StudentsPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    parentName: '',
    email: '',
    phone: '',
    password: '',
    grade: '',
    section: ''
  });

  const [classes, setClasses] = useState<any[]>([]);
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [classFormData, setClassFormData] = useState({ name: '', section: '', roomNumber: '' });
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user?.schoolId) return;
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        api.get(`/students/school/${user.schoolId}`),
        api.get(`/classes/school/${user.schoolId}`)
      ]);
      setStudents(studentsRes.data.data || []);
      setClasses(classesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddClass = async () => {
    if (!classFormData.name || !classFormData.section) {
      toast.error('Class Name and Section are required');
      return;
    }
    try {
      setIsSaving(true);
      await api.post('/classes', { ...classFormData, schoolId: user.schoolId });
      toast.success('Class created successfully');
      setIsAddClassDialogOpen(false);
      setClassFormData({ name: '', section: '', roomNumber: '' });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create class');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClass = (cls: any) => {
    setEditingClassId(cls.id);
    setClassFormData({ name: cls.name, section: cls.section, roomNumber: cls.roomNumber || '' });
    setIsEditClassDialogOpen(true);
  };

  const handleUpdateClass = async () => {
    try {
      setIsSaving(true);
      await api.put(`/classes/${editingClassId}`, classFormData);
      toast.success('Class updated');
      setIsEditClassDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this class? Students will be unassigned.')) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  // Group students by classId or grade
  const classGroups = classes.reduce((acc: any, cls: any) => {
    acc[cls.id] = {
      ...cls,
      studentList: students.filter((s: any) => s.classId === cls.id || (s.grade === cls.name && s.section === cls.section))
    };
    return acc;
  }, {});

  // Handle students with no class
  const unassignedStudents = students.filter((s: any) => !s.classId && !classes.find((c: any) => c.name === s.grade && c.section === s.section));
  if (unassignedStudents.length > 0) {
    classGroups['unassigned'] = {
      id: 'unassigned',
      name: 'N/A',
      section: 'Unassigned',
      studentList: unassignedStudents
    };
  }

  const sortedClasses = Object.values(classGroups).sort((a: any, b: any) => {
    if (a.id === 'unassigned') return 1;
    if (b.id === 'unassigned') return -1;
    const numA = parseInt(a.name);
    const numB = parseInt(b.name);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA - numB;
      return a.section.localeCompare(b.section);
    }
    return a.name.localeCompare(b.name);
  });

  const handleAddStudent = async () => {
    if (!formData.studentId || !formData.name || !formData.grade) {
      toast.error('Student ID, Name and Class are required');
      return;
    }

    // Auto-match classId if possible
    const matchedClass = classes.find(c => c.name === formData.grade && c.section === formData.section);

    try {
      setIsSaving(true);
      await api.post('/students', { 
        ...formData, 
        schoolId: user.schoolId,
        classId: matchedClass?.id 
      });
      toast.success('Student registered successfully');
      setIsAddDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register student');
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
      password: '', // Don't load password
      grade: student.grade,
      section: student.section || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    const matchedClass = classes.find(c => c.name === formData.grade && c.section === formData.section);
    try {
      setIsSaving(true);
      await api.put(`/students/${editingId}`, { ...formData, classId: matchedClass?.id });
      toast.success('Student details updated');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
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

  const resetForm = () => {
    setFormData({
      studentId: '',
      name: '',
      parentName: '',
      email: '',
      phone: '',
      password: '',
      grade: '',
      section: ''
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          toast.error('Excel sheet is empty');
          return;
        }

        setIsSaving(true);
        await api.post('/students/bulk', { 
          schoolId: user.schoolId, 
          students: data 
        });
        
        toast.success(`Successfully imported ${data.length} students`);
        setIsBulkDialogOpen(false);
        fetchData();
      } catch (error) {
        toast.error('Failed to parse or upload Excel file');
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      { studentId: 'STU001', name: 'John Doe', parentName: 'Mr. Doe', email: 'john@example.com', phone: '1234567890', grade: '10', section: 'A', password: 'password123' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StudentsTemplate");
    XLSX.writeFile(wb, "students_import_template.xlsx");
  };

  const currentClassData = selectedClass ? classGroups[selectedClass] : null;
  const filteredStudents = (currentClassData?.studentList || [])
    .filter((s: any) => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.parentName?.toLowerCase().includes(search.toLowerCase())
    );

  const planLimits: Record<string, number> = {
    'starter': 500,
    'growth': 2000,
    'pro': 5000,
    'elite': 1000000
  };

  const currentPlan = user?.subscriptionPlan?.toLowerCase() || 'starter';
  const limit = planLimits[currentPlan] || 0;
  const isNearLimit = students.length >= limit * 0.9;
  const isFull = students.length >= limit;

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
              {selectedClass ? `Class ${currentClassData?.name} - Section ${currentClassData?.section}` : 'Students Directory'}
            </h2>
          </div>
          <p className="text-slate-500">
            {selectedClass 
              ? `Manage students belonging to ${currentClassData?.name} ${currentClassData?.section}.` 
              : 'Select a class section to manage student profiles.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan Capacity</div>
            <div className={`text-sm font-bold ${isFull ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-primary'}`}>
              {students.length} / {limit >= 1000000 ? '∞' : limit} Students
            </div>
          </div>
          <div className="flex gap-2">
            {!selectedClass && (
              <Button variant="outline" className="gap-2" onClick={() => setIsAddClassDialogOpen(true)}>
                <Building className="w-4 h-4" /> Add Class
              </Button>
            )}
            <Button variant="outline" className="gap-2" onClick={() => setIsBulkDialogOpen(true)}>
              <FileSpreadsheet className="w-4 h-4" /> Bulk Import
            </Button>
            <Button 
              className="gap-2 shadow-lg shadow-primary/20" 
              onClick={() => {
                if (selectedClass && currentClassData) {
                  setFormData({ ...formData, grade: currentClassData.name, section: currentClassData.section });
                }
                setIsAddDialogOpen(true);
              }}
              disabled={isFull}
            >
              <UserPlus className="w-4 h-4" /> Add Student
            </Button>
          </div>
        </div>
      </div>

      {!selectedClass ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
             Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse bg-slate-50 border-none h-40" />
            ))
          ) : sortedClasses.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-500">
              <GraduationCap className="w-12 h-12 mb-4 opacity-20" />
              <p>No classes or students found. Start by adding a class.</p>
              <Button variant="link" onClick={() => setIsAddClassDialogOpen(true)} className="mt-2 text-primary">
                Create your first class section
              </Button>
            </div>
          ) : (
            sortedClasses.map((cls: any) => (
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
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono">
                      {cls.studentList?.length || 0} Students
                    </Badge>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {cls.id !== 'unassigned' && (
                        <>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleEditClass(cls); }}>
                            <Pencil className="w-3 h-3 text-slate-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => handleDeleteClass(cls.id, e)}>
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold text-slate-900 mb-1">
                    Class {cls.name} - Section {cls.section}
                  </div>
                  <p className="text-xs text-slate-500">Manage all students and academic records for this section.</p>
                  <div className="mt-4 flex items-center text-xs font-bold text-primary group-hover:gap-2 transition-all">
                    View Student List <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </CardContent>
              </Card>
            ))
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
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-slate-500">Loading student records...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>Student Details</TableHead>
                    <TableHead>Parent Info</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                        No students found in this section.
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
                              <div className="text-xs font-mono text-slate-400">ID: {s.studentId}</div>
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
                          <div className="space-y-1">
                            {s.email && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Mail className="w-3 h-3" /> {s.email}
                              </div>
                            )}
                            {s.phone && (
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Phone className="w-3 h-3" /> {s.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(s.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Class Dialog */}
      <Dialog open={isAddClassDialogOpen || isEditClassDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddClassDialogOpen(false);
          setIsEditClassDialogOpen(false);
          setClassFormData({ name: '', section: '', roomNumber: '' });
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{isEditClassDialogOpen ? 'Edit Class Section' : 'Create New Class Section'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Class / Grade Name</label>
              <Input 
                value={classFormData.name}
                onChange={e => setClassFormData({...classFormData, name: e.target.value})}
                placeholder="e.g. 10, XII, UKG"
                className="bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Section Name</label>
              <Input 
                value={classFormData.section}
                onChange={e => setClassFormData({...classFormData, section: e.target.value})}
                placeholder="e.g. A, B, Rose"
                className="bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Room Number (Optional)</label>
              <Input 
                value={classFormData.roomNumber}
                onChange={e => setClassFormData({...classFormData, roomNumber: e.target.value})}
                placeholder="e.g. 101"
                className="bg-slate-50 border-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setIsAddClassDialogOpen(false);
              setIsEditClassDialogOpen(false);
            }}>Cancel</Button>
            <Button onClick={isEditClassDialogOpen ? handleUpdateClass : handleAddClass} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditClassDialogOpen ? 'Update Class' : 'Create Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              {isEditDialogOpen ? 'Edit Student Details' : 'Register New Student'}
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Grade / Class</label>
                <Input 
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value})}
                  placeholder="e.g. 10"
                  className="bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Section</label>
                <Input 
                  value={formData.section}
                  onChange={e => setFormData({...formData, section: e.target.value})}
                  placeholder="e.g. A"
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
                <label className="text-sm font-semibold">Email Address</label>
                <Input 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="student@school.com"
                  className="bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Phone Number</label>
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
                placeholder={isEditDialogOpen ? "Leave blank to keep current" : "Min 6 characters"}
                className="bg-slate-50 border-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}>Cancel</Button>
            <Button onClick={isEditDialogOpen ? handleUpdateStudent : handleAddStudent} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditDialogOpen ? 'Update Record' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Bulk Import Students</DialogTitle>
            <DialogDescription>
              Upload an Excel file with student details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Choose Excel File</p>
              <p className="text-xs text-slate-500">Supports .xlsx, .xls</p>
            </div>
            <Input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
              className="cursor-pointer"
              disabled={isSaving}
            />
            {isSaving && (
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </div>
            )}
          </div>
          <DialogFooter className="flex-col gap-2">
            <Button variant="outline" className="w-full gap-2" onClick={downloadTemplate}>
              <Download className="w-4 h-4" /> Download Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentsPage;
