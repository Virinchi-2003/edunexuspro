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
  MoreHorizontal, 
  Filter,
  Download,
  Loader2,
  School as SchoolIcon,
  Mail,
  MapPin,
  Trash2,
  Ban,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

const SchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    contactEmail: '',
    subscriptionPlan: 'starter'
  });

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/schools', {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('user') || '{}').token || 'mock-token'}` }
      });
      // Handle potential mock data or real backend response
      if (res.data.status === 'success') {
        setSchools(res.data.data);
      } else {
        // Fallback for mock data if backend returns array directly
        setSchools(Array.isArray(res.data) ? res.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      // Mock data for fallback
      setSchools([
        { id: '1', name: 'St. Xavier High School', address: 'Mumbai, MH', contactEmail: 'info@stxavier.edu', subscriptionPlan: 'Elite', status: 'active', students: 1200 },
        { id: '2', name: 'Greenwood Academy', address: 'Bangalore, KA', contactEmail: 'admin@greenwood.ac.in', subscriptionPlan: 'Pro', status: 'active', students: 850 },
        { id: '3', name: 'Little Flowers Primary', address: 'Delhi, DL', contactEmail: 'office@littleflowers.com', subscriptionPlan: 'Starter', status: 'pending', students: 340 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleExportPDF = () => {
    const doc = new jsPDF() as any;
    doc.text('EduNexus Pro - Schools Report', 14, 15);
    
    const tableData = filteredSchools.map(s => [
      s.name, 
      s.address, 
      s.subscriptionPlan, 
      s.status
    ]);

    doc.autoTable({
      head: [['School Name', 'Location', 'Subscription', 'Status']],
      body: tableData,
      startY: 20,
      theme: 'grid',
      headStyles: { fillStyle: [59, 130, 246] }
    });

    doc.save('edunexus-schools-report.pdf');
  };

  const handleAddSchool = async () => {
    try {
      await axios.post('http://localhost:5000/api/schools', newSchool, {
        headers: { Authorization: `Bearer mock-token` }
      });
      setIsAddDialogOpen(false);
      fetchSchools();
      setNewSchool({ name: '', address: '', contactEmail: '', subscriptionPlan: 'starter' });
    } catch (error) {
      console.error('Failed to add school:', error);
      alert('Error adding school. Check console.');
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Schools Management</h2>
          <p className="text-slate-500">Manage all registered institutions and their subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handleExportPDF}>
            <Download className="w-4 h-4" /> Export PDF
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> Add New School
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <SchoolIcon className="w-5 h-5 text-primary" />
                  Register New School
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">School Name</label>
                  <Input 
                    placeholder="Enter school name" 
                    value={newSchool.name}
                    onChange={e => setNewSchool({...newSchool, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location / Address</label>
                  <Input 
                    placeholder="City, State" 
                    value={newSchool.address}
                    onChange={e => setNewSchool({...newSchool, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Email</label>
                  <Input 
                    type="email"
                    placeholder="admin@school.com" 
                    value={newSchool.contactEmail}
                    onChange={e => setNewSchool({...newSchool, contactEmail: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subscription Plan</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newSchool.subscriptionPlan}
                    onChange={e => setNewSchool({...newSchool, subscriptionPlan: e.target.value})}
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddSchool}>Create Registration</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="p-0 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-center gap-4 p-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search schools..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="ghost" className="gap-2 text-slate-600">
                <Filter className="w-4 h-4" /> Filter
              </Button>
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              <p className="text-sm text-slate-500 whitespace-nowrap px-2">Total: {filteredSchools.length} Schools</p>
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
                        <Button variant="ghost" size="icon" className="hover:text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-amber-600">
                          <Ban className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:text-red-600">
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
    </div>
  );
};

export default SchoolsPage;
