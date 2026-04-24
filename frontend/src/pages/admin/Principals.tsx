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
  ShieldCheck,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';

const PrincipalsPage: React.FC = () => {
  const [principals, setPrincipals] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    schoolId: '',
    userId: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [principalsRes, schoolsRes] = await Promise.all([
        api.get('/management/principals'),
        api.get('/schools')
      ]);
      
      setPrincipals(principalsRes.data.data || []);
      setSchools(schoolsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load records from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPrincipal = async () => {
    if (!formData.name || !formData.email || !formData.schoolId) {
      toast.error('Name, Email and School are required');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/management/principals', formData);
      toast.success('Principal record created successfully');
      setIsAddDialogOpen(false);
      fetchData();
      setFormData({ name: '', email: '', phone: '', schoolId: '', userId: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create principal record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (principal: any) => {
    setEditingId(principal.id);
    setFormData({
      name: principal.name,
      email: principal.email,
      phone: principal.phone || '',
      schoolId: principal.schoolId,
      userId: principal.userId || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePrincipal = async () => {
    try {
      setIsSaving(true);
      await api.put(`/management/principals/${editingId}`, formData);
      toast.success('Principal record updated');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this principal record?')) return;
    try {
      await api.delete(`/management/principals/${id}`);
      toast.success('Record deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const getSchoolName = (id: string) => {
    const s = schools.find(school => school.id === id);
    return s ? s.name : 'Unknown School';
  };

  const filteredPrincipals = principals.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Principals Management</h2>
          <p className="text-slate-500">Manage school leadership details and administrative access.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="w-4 h-4" /> Add Principal
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="p-0 border-b border-slate-100">
          <div className="flex items-center gap-4 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by name, email or phone..." 
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
              <p className="text-slate-500">Synchronizing with database...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Principal Name</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrincipals.map((p) => (
                  <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {p.name.charAt(0)}
                        </div>
                        {p.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building className="w-3.5 h-3.5" />
                        {getSchoolName(p.schoolId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-3 h-3" /> {p.email}
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Phone className="w-3 h-3" /> {p.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setFormData({ name: '', email: '', phone: '', schoolId: '', userId: '' });
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              {isEditDialogOpen ? 'Update Principal Details' : 'Register New Principal'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Full Name</label>
              <Input 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Dr. John Doe"
                className="bg-slate-50 border-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email Address</label>
                <Input 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="principal@school.com"
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
              <label className="text-sm font-semibold">Assign School</label>
              <select 
                className="flex h-10 w-full rounded-md border-none bg-slate-50 px-3 py-2 text-sm outline-none"
                value={formData.schoolId}
                onChange={e => setFormData({...formData, schoolId: e.target.value})}
              >
                <option value="">Select a School</option>
                {schools.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}>Cancel</Button>
            <Button onClick={isEditDialogOpen ? handleUpdatePrincipal : handleAddPrincipal} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditDialogOpen ? 'Save Changes' : 'Confirm Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrincipalsPage;
