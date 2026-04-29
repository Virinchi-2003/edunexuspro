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
  Trash2,
  Pencil,
  Loader2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Calendar,
  IndianRupee,
  Building2
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

const StaffPage: React.FC = () => {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDept, setSelectedDept] = useState<'teaching' | 'non-teaching' | null>(null);
  const [classList, setClassList] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'teaching',
    role: '',
    dob: '',
    subjects: '',
    classes: '',
    branch: '',
    salary: ''
  });

  const fetchData = async () => {
    if (!user?.schoolId) return;
    try {
      setLoading(true);
      const [staffRes, classesRes] = await Promise.all([
        api.get(`/staff/school/${user.schoolId}`),
        api.get(`/classes/school/${user.schoolId}`)
      ]);
      setStaffList(staffRes.data.data || []);
      setClassList(classesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddStaff = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast.error('Name, Email and Role are required');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/staff', { ...formData, schoolId: user.schoolId });
      toast.success('Staff member registered successfully');
      setIsAddDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (member: any) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      department: member.department,
      role: member.role,
      dob: member.dob || '',
      subjects: member.subjects || '',
      classes: member.classes || '',
      branch: member.branch || '',
      salary: member.salary?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStaff = async () => {
    try {
      setIsSaving(true);
      await api.put(`/staff/${editingId}`, formData);
      toast.success('Staff details updated');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this staff member? This will also remove their portal access.')) return;
    try {
      await api.delete(`/staff/${id}`);
      toast.success('Staff record removed');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      department: selectedDept || 'teaching',
      role: '',
      dob: '',
      subjects: '',
      classes: '',
      branch: '',
      salary: ''
    });
  };

  const filteredStaff = staffList.filter(s => 
    (selectedDept ? s.department === selectedDept : true) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
     s.role.toLowerCase().includes(search.toLowerCase()) ||
     s.email.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    teaching: staffList.filter(s => s.department === 'teaching').length,
    nonTeaching: staffList.filter(s => s.department === 'non-teaching').length
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {selectedDept && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                onClick={() => setSelectedDept(null)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-3xl font-display font-bold text-slate-900">
              {selectedDept === 'teaching' ? 'Teaching Staff' : selectedDept === 'non-teaching' ? 'Non-Teaching Staff' : 'Staff Management'}
            </h2>
          </div>
          <p className="text-slate-500">
            {selectedDept 
              ? `Manage all ${selectedDept === 'teaching' ? 'teachers and academic mentors' : 'administrative and support staff'}.` 
              : 'Overview of all departments and faculty members.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="gap-2 shadow-lg shadow-primary/20" 
            onClick={() => {
              if (selectedDept) setFormData({ ...formData, department: selectedDept });
              setIsAddDialogOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4" /> Add Member
          </Button>
        </div>
      </div>

      {!selectedDept ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Teaching Staff Card */}
          <Card 
            className="group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 cursor-pointer border-none shadow-sm overflow-hidden"
            onClick={() => setSelectedDept('teaching')}
          >
            <div className="h-2 bg-indigo-500" />
            <CardHeader className="pb-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Teaching Staff</h3>
                <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none px-3 py-1">
                  {stats.teaching} Members
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 mb-6">Manage teachers, subject experts, and academic department heads.</p>
              <div className="flex items-center text-indigo-600 font-bold text-sm group-hover:gap-2 transition-all">
                Access Department <ChevronRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Non-Teaching Staff Card */}
          <Card 
            className="group hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 cursor-pointer border-none shadow-sm overflow-hidden"
            onClick={() => setSelectedDept('non-teaching')}
          >
            <div className="h-2 bg-amber-500" />
            <CardHeader className="pb-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Non-Teaching Staff</h3>
                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none px-3 py-1">
                  {stats.nonTeaching} Members
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 mb-6">Manage administrative staff, accountants, and campus support teams.</p>
              <div className="flex items-center text-amber-600 font-bold text-sm group-hover:gap-2 transition-all">
                Access Department <ChevronRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-none shadow-sm">
          <CardHeader className="p-0 border-b border-slate-100">
            <div className="flex items-center gap-4 p-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search by name, role or email..." 
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
                <p className="text-slate-500">Loading staff records...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead>Staff Details</TableHead>
                    <TableHead>Role & Department</TableHead>
                    {selectedDept === 'teaching' ? (
                      <TableHead>Academic Info</TableHead>
                    ) : (
                      <TableHead>Branch / Location</TableHead>
                    )}
                    <TableHead>Salary Info</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                        No staff members found in this department.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((s) => (
                      <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${s.department === 'teaching' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{s.name}</div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {s.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-slate-700">{s.role}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Born: {s.dob || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.department === 'teaching' ? (
                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-slate-600">Subjects: {s.subjects || 'N/A'}</div>
                              <div className="text-xs text-slate-500">Classes: {s.classes || 'N/A'}</div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                              <Building2 className="w-3.5 h-3.5" /> {s.branch || 'Main Campus'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                            <IndianRupee className="w-3 h-3" />
                            {s.salary?.toLocaleString() || '0'}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Per Month</div>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px] overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
              <div className={`p-2 rounded-xl ${formData.department === 'teaching' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                {formData.department === 'teaching' ? <GraduationCap className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
              </div>
              {isEditDialogOpen ? 'Edit Staff Member' : 'Register New Staff'}
            </DialogTitle>
            <DialogDescription>
              Complete the profile details below for the {formData.department} department.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Department</label>
              <select 
                className="w-full h-10 px-3 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 text-sm"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              >
                <option value="teaching">Teaching Staff</option>
                <option value="non-teaching">Non-Teaching Staff</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Designation / Role</label>
              <Input 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                placeholder="e.g. Senior Teacher, Admin"
                className="bg-slate-50 border-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Staff member name"
                className="bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
              <Input 
                type="date"
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: e.target.value})}
                className="bg-slate-50 border-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Official Email</label>
              <Input 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="email@school.com"
                className="bg-slate-50 border-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Salary (Monthly)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="number"
                  value={formData.salary}
                  onChange={e => setFormData({...formData, salary: e.target.value})}
                  className="pl-9 bg-slate-50 border-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            {formData.department === 'teaching' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Teaching Subjects</label>
                  <Input 
                    value={formData.subjects}
                    onChange={e => setFormData({...formData, subjects: e.target.value})}
                    placeholder="e.g. Physics, Math"
                    className="bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Assigned Classes (Select to add/remove)</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl min-h-[50px] border-2 border-dashed border-slate-200">
                    {classList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No classes found. Create classes in Students page first.</p>
                    ) : (
                      classList.map((cls) => {
                        const classStr = `${cls.name}${cls.section}`;
                        const isSelected = formData.classes.split(',').map(s => s.trim()).includes(classStr);
                        return (
                          <Badge 
                            key={cls.id}
                            className={`cursor-pointer px-3 py-1.5 transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-indigo-50 border-slate-200'}`}
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => {
                              const current = formData.classes.split(',').map(s => s.trim()).filter(Boolean);
                              if (isSelected) {
                                setFormData({...formData, classes: current.filter(c => c !== classStr).join(', ')});
                              } else {
                                setFormData({...formData, classes: [...current, classStr].join(', ')});
                              }
                            }}
                          >
                            {cls.name}-{cls.section}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                  <Input 
                    value={formData.classes}
                    onChange={e => setFormData({...formData, classes: e.target.value})}
                    placeholder="e.g. 10A, 11B (comma separated)"
                    className="bg-slate-50 border-none text-xs"
                  />
                  <p className="text-[10px] text-slate-400">You can also type manually if a class is not in the list.</p>
                </div>
              </>
            ) : (
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-semibold text-slate-700">Branch / Department Location</label>
                <Input 
                  value={formData.branch}
                  onChange={e => setFormData({...formData, branch: e.target.value})}
                  placeholder="e.g. Admin Block, Front Office"
                  className="bg-slate-50 border-none"
                />
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-semibold text-slate-700">Portal Password</label>
              <Input 
                type="password"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder={isEditDialogOpen ? "Leave blank to keep current" : "Default password for login"}
                className="bg-slate-50 border-none"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button variant="ghost" className="rounded-xl" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}>Cancel</Button>
            <Button 
              className="rounded-xl px-8 shadow-lg shadow-primary/20" 
              onClick={isEditDialogOpen ? handleUpdateStaff : handleAddStaff} 
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditDialogOpen ? 'Save Changes' : 'Register Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;
