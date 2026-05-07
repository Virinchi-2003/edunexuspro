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
  Plus, 
  Search, 
  Download,
  Loader2,
  School as SchoolIcon,
  Mail,
  MapPin,
  Trash2,
  Ban,
  CheckCircle2,
  Pencil,
  ShieldCheck
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '@/lib/api';
import { toast } from 'sonner';

const SchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    contactEmail: '',
    subscriptionPlan: 'starter',
    adminEmail: '',
    password: '',
    school_id: ''
  });

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await api.get('/schools');
      if (res.data.status === 'success') {
        setSchools(res.data.data);
      } else {
        setSchools(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      toast.error('Connection failed. Using offline data.');
      setSchools([
        { id: '1', name: 'St. Xavier High School', address: 'Mumbai, MH', contactEmail: 'info@stxavier.edu', subscriptionPlan: 'Elite', status: 'active', students: 1200 },
        { id: '2', name: 'Greenwood Academy', address: 'Bangalore, KA', contactEmail: 'admin@greenwood.ac.in', subscriptionPlan: 'Pro', status: 'active', students: 850 },
        { id: '3', name: 'Little Flowers Primary', address: 'Delhi, DL', contactEmail: 'office@littleflowers.com', subscriptionPlan: 'Starter', status: 'pending', students: 340 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDatabase = async () => {
    try {
      setLoading(true);
      const res = await api.post('/schools/sync');
      if (res.data.status === 'success') {
        toast.success(res.data.message);
        await fetchSchools();
      }
    } catch (error) {
      toast.error('Sync failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleExportPDF = () => {
    try {
      if (filteredSchools.length === 0) {
        toast.warning('No schools available to export.');
        return;
      }

      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text('EduNexus Pro', 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text('Institutional Audit Report', 14, 28);
      
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(`Generated on: ${timestamp}`, 14, 34);
      
      const tableData = filteredSchools.map(s => [
        s.name, 
        s.address, 
        s.contactEmail,
        s.subscriptionPlan.toUpperCase(), 
        (s.status || 'active').toUpperCase()
      ]);

      autoTable(doc, {
        head: [['School Name', 'Location', 'Email', 'Plan', 'Status']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: { 
          fillColor: [37, 99, 235], // Primary Blue
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate 50
        margin: { top: 40 }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${i} of ${pageCount}`, 
          doc.internal.pageSize.width / 2, 
          doc.internal.pageSize.height - 10, 
          { align: 'center' }
        );
      }

      doc.save(`edunexus-schools-${Date.now()}.pdf`);
      toast.success('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleAddSchool = async () => {
    if (!newSchool.name || !newSchool.address || !newSchool.adminEmail || !newSchool.password) {
      toast.error('Please fill in all institutional and credential fields.');
      return;
    }

    try {
      setIsAdding(true);
      const res = await api.post('/schools', newSchool);
      
      if (res.status === 201 || res.status === 200) {
        toast.success(`${newSchool.name} registered and admin account created!`);
        setIsAddDialogOpen(false);
        await fetchSchools(); 
        setNewSchool({ 
          name: '', 
          address: '', 
          contactEmail: '', 
          subscriptionPlan: 'starter',
          adminEmail: '',
          password: '',
          school_id: ''
        });
      }
    } catch (error: any) {
      console.error('Failed to add school:', error);
      const errorMsg = error.response?.data?.message || 'Failed to register school. Please check your connection.';
      toast.error(errorMsg);
    } finally {
      setIsAdding(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  const handleEditClick = (school: any) => {
    setEditingSchool({
      ...school,
      subscriptionPlan: school.subscriptionPlan.toLowerCase()
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSchool = async () => {
    if (!editingSchool.name || !editingSchool.address || !editingSchool.contactEmail) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsUpdating(true);
      const res = await api.put(`/schools/${editingSchool.id}`, editingSchool);
      
      if (res.status === 200) {
        toast.success(`${editingSchool.name} updated successfully!`);
        setIsEditDialogOpen(false);
        fetchSchools();
      }
    } catch (error) {
      toast.error('Failed to update school details.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await api.put(`/schools/${id}/status`, { status: newStatus });
      if (res.status === 200) {
        toast.success(`School status updated to ${newStatus}`);
        fetchSchools(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update school status.');
    }
  };

  const handleDeleteSchool = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await api.delete(`/schools/${id}`);
      if (res.status === 200) {
        toast.success(`${name} deleted and synced with database.`);
        fetchSchools(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete school:', error);
      toast.error('Failed to delete school.');
    }
  };

  const filteredSchools = schools.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                         s.address.toLowerCase().includes(search.toLowerCase()) ||
                         s.contactEmail.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || (s.status || 'active') === statusFilter;
    const matchesPlan = planFilter === 'all' || s.subscriptionPlan.toLowerCase() === planFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Schools Management</h2>
          <p className="text-slate-500">Manage all registered institutions and their subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleSyncDatabase} disabled={loading}>
            <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Database
          </Button>

          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4" /> Add New School
            </Button>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                  <SchoolIcon className="w-6 h-6 text-primary" />
                  Register New Institution
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <SchoolIcon className="w-4 h-4 text-slate-400" /> School Name
                    </label>
                    <Input 
                      placeholder="e.g. Global International School" 
                      value={newSchool.name}
                      onChange={e => setNewSchool({...newSchool, name: e.target.value})}
                      className="bg-slate-50 border-none focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-slate-400" /> Unique School ID
                    </label>
                    <Input 
                      placeholder="e.g. SCH-001 (Leave blank for auto)" 
                      value={newSchool.school_id}
                      onChange={e => setNewSchool({...newSchool, school_id: e.target.value})}
                      className="bg-slate-50 border-none focus:bg-white transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" /> Location / Address
                    </label>
                    <Input 
                      placeholder="City, State, Country" 
                      value={newSchool.address}
                      onChange={e => setNewSchool({...newSchool, address: e.target.value})}
                      className="bg-slate-50 border-none focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrator Credentials</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Admin Email</label>
                    <Input 
                      type="email"
                      placeholder="admin@school.com" 
                      value={newSchool.adminEmail}
                      onChange={e => setNewSchool({...newSchool, adminEmail: e.target.value})}
                      className="bg-slate-50 border-none focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Setup Password</label>
                    <Input 
                      type="password"
                      placeholder="••••••••" 
                      value={newSchool.password}
                      onChange={e => setNewSchool({...newSchool, password: e.target.value})}
                      className="bg-slate-50 border-none focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Subscription Plan</label>
                  <select 
                    className="flex h-10 w-full rounded-md border-none bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    value={newSchool.subscriptionPlan}
                    onChange={e => setNewSchool({...newSchool, subscriptionPlan: e.target.value})}
                  >
                    <option value="starter">Starter Plan (₹4,999/mo)</option>
                    <option value="growth">Growth Plan (₹9,999/mo)</option>
                    <option value="pro">Pro Plan (₹18,999/mo)</option>
                    <option value="elite">Elite Plan (Custom)</option>
                  </select>
                </div>
              </div>
              <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-lg">
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} disabled={isAdding}>Cancel</Button>
                <Button onClick={handleAddSchool} disabled={isAdding} className="px-8 shadow-lg shadow-primary/20">
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Identity...
                    </>
                  ) : (
                    'Confirm Registration'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="p-0 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row items-center gap-4 p-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by school name, location, or email..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status:</span>
                <select 
                  className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plan:</span>
                <select 
                  className="bg-slate-50 border-none rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                </select>
              </div>

              <div className="h-6 w-px bg-slate-200 hidden lg:block" />
              <p className="text-sm text-slate-500 whitespace-nowrap px-2">
                Found <span className="font-bold text-primary">{filteredSchools.length}</span> results
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p>Fetching institutional data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="w-[300px]">School Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchools.map((school) => (
                  <TableRow key={school.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {school.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span>{school.name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                            <Mail className="w-2 h-2" /> {school.contactEmail}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {school.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`
                          capitalize border-none
                          ${school.subscriptionPlan.toLowerCase() === 'elite' ? 'bg-purple-100 text-purple-700' : 
                            school.subscriptionPlan.toLowerCase() === 'pro' ? 'bg-blue-100 text-blue-700' : 
                            'bg-slate-100 text-slate-700'}
                        `}
                      >
                        {school.subscriptionPlan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          school.status === 'active' ? 'bg-green-500' : 
                          school.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm capitalize text-slate-700">{school.status || 'active'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:text-primary"
                          onClick={() => handleEditClick(school)}
                          title="Edit School"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:text-green-600"
                          onClick={() => handleUpdateStatus(school.id, 'active')}
                          title="Approve / Activate"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:text-amber-600"
                          onClick={() => handleUpdateStatus(school.id, 'suspended')}
                          title="Suspend / Ban"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:text-red-600"
                          onClick={() => handleDeleteSchool(school.id, school.name)}
                          title="Delete School"
                        >
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

      {/* Edit School Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Pencil className="w-6 h-6 text-primary" />
              Edit Institution Details
            </DialogTitle>
          </DialogHeader>
          {editingSchool && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <SchoolIcon className="w-4 h-4 text-slate-400" /> School Name
                  </label>
                  <Input 
                    placeholder="e.g. Global International School" 
                    value={editingSchool.name}
                    onChange={e => setEditingSchool({...editingSchool, name: e.target.value})}
                    className="bg-slate-50 border-none focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400" /> School ID
                  </label>
                  <Input 
                    placeholder="e.g. SCH-001" 
                    value={editingSchool.school_id}
                    onChange={e => setEditingSchool({...editingSchool, school_id: e.target.value})}
                    className="bg-slate-50 border-none focus:bg-white transition-all font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Location / Address
                  </label>
                  <Input 
                    placeholder="City, State, Country" 
                    value={editingSchool.address}
                    onChange={e => setEditingSchool({...editingSchool, address: e.target.value})}
                    className="bg-slate-50 border-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Contact Email</label>
                <Input 
                  type="email"
                  placeholder="admin@school.com" 
                  value={editingSchool.contactEmail}
                  onChange={e => setEditingSchool({...editingSchool, contactEmail: e.target.value})}
                  className="bg-slate-50 border-none focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Subscription Plan</label>
                <select 
                  className="flex h-10 w-full rounded-md border-none bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  value={editingSchool.subscriptionPlan}
                  onChange={e => setEditingSchool({...editingSchool, subscriptionPlan: e.target.value})}
                >
                  <option value="starter">Starter Plan (₹4,999/mo)</option>
                  <option value="growth">Growth Plan (₹9,999/mo)</option>
                  <option value="pro">Pro Plan (₹18,999/mo)</option>
                  <option value="elite">Elite Plan (Custom)</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-lg">
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>Cancel</Button>
            <Button onClick={handleUpdateSchool} disabled={isUpdating} className="px-8 shadow-lg shadow-primary/20">
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Update Institution'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolsPage;
