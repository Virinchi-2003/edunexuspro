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
  CreditCard, 
  Search, 
  Calendar,
  Building,
  Trash2,
  Pencil,
  Loader2,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  History
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

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    schoolId: '',
    plan: 'starter',
    status: 'active',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    amount: 4999,
    transactionId: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subsRes, schoolsRes] = await Promise.all([
        api.get('/management/subscriptions'),
        api.get('/schools')
      ]);
      
      setSubscriptions(subsRes.data.data || []);
      setSchools(schoolsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubscription = async () => {
    if (!formData.schoolId || !formData.amount) {
      toast.error('School and Amount are required');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/management/subscriptions', formData);
      toast.success('Subscription plan activated');
      setIsAddDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (sub: any) => {
    setEditingId(sub.id);
    setFormData({
      schoolId: sub.schoolId,
      plan: sub.plan,
      status: sub.status,
      startDate: sub.startDate.split('T')[0],
      endDate: sub.endDate.split('T')[0],
      amount: sub.amount,
      transactionId: sub.transactionId || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSubscription = async () => {
    try {
      setIsSaving(true);
      await api.put(`/management/subscriptions/${editingId}`, formData);
      toast.success('Subscription details updated');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this subscription record?')) return;
    try {
      await api.delete(`/management/subscriptions/${id}`);
      toast.success('Record deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      schoolId: '',
      plan: 'starter',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      amount: 4999,
      transactionId: ''
    });
  };

  const getSchoolName = (id: string) => {
    const s = schools.find(school => school.id === id);
    return s ? s.name : 'Unknown Institution';
  };

  const filteredSubs = subscriptions.filter(s => {
    const schoolName = getSchoolName(s.schoolId).toLowerCase();
    return schoolName.includes(search.toLowerCase()) || 
           s.plan.toLowerCase().includes(search.toLowerCase()) ||
           s.transactionId?.toLowerCase().includes(search.toLowerCase());
  });

  const planPrices: any = {
    'starter': 4999,
    'growth': 9999,
    'pro': 18999,
    'elite': 50000
  };

  const handlePlanChange = (plan: string) => {
    setFormData({
      ...formData,
      plan,
      amount: planPrices[plan.toLowerCase()] || 4999
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Subscription Plans</h2>
          <p className="text-slate-500">Manage institutional billing, plans, and renewal schedules.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4" /> New Subscription
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary to-blue-700 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">Active Plans</Badge>
            </div>
            <p className="text-white/70 text-sm mb-1">Total Subscriptions</p>
            <h3 className="text-3xl font-bold">{subscriptions.length}</h3>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <History className="w-5 h-5 text-amber-600" />
              </div>
              <Badge className="bg-amber-100 text-amber-600 border-none">Upcoming</Badge>
            </div>
            <p className="text-slate-500 text-sm mb-1">Renewals this Month</p>
            <h3 className="text-3xl font-bold text-slate-900">0</h3>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-600 border-none">Revenue</Badge>
            </div>
            <p className="text-slate-500 text-sm mb-1">Total Value</p>
            <h3 className="text-3xl font-bold text-slate-900">
              ₹{subscriptions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="p-0 border-b border-slate-100">
          <div className="flex items-center gap-4 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by school, plan, or transaction ID..." 
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
              <p className="text-slate-500">Loading subscription records...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Active Plan</TableHead>
                  <TableHead>Validity Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.map((s) => (
                  <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                          <Building className="w-4 h-4" />
                        </div>
                        {getSchoolName(s.schoolId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`capitalize border-none ${
                          s.plan.toLowerCase() === 'elite' ? 'bg-purple-100 text-purple-700' :
                          s.plan.toLowerCase() === 'pro' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Transaction: {s.transactionId || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      ₹{s.amount.toLocaleString()}
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
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              {isEditDialogOpen ? 'Modify Plan Details' : 'Activate New Plan'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Institution</label>
              <select 
                className="flex h-10 w-full rounded-md border-none bg-slate-50 px-3 py-2 text-sm outline-none"
                value={formData.schoolId}
                onChange={e => setFormData({...formData, schoolId: e.target.value})}
                disabled={isEditDialogOpen}
              >
                <option value="">Select Institution</option>
                {schools.map(sch => (
                  <option key={sch.id} value={sch.id}>{sch.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Subscription Plan</label>
                <select 
                  className="flex h-10 w-full rounded-md border-none bg-slate-50 px-3 py-2 text-sm outline-none"
                  value={formData.plan}
                  onChange={e => handlePlanChange(e.target.value)}
                >
                  <option value="starter">Starter Plan</option>
                  <option value="growth">Growth Plan</option>
                  <option value="pro">Pro Plan</option>
                  <option value="elite">Elite Plan</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Billing Amount (₹)</label>
                <Input 
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})}
                  className="bg-slate-50 border-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Start Date</label>
                <Input 
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  className="bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Expiry Date</label>
                <Input 
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                  className="bg-slate-50 border-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Transaction ID (Optional)</label>
              <Input 
                value={formData.transactionId}
                onChange={e => setFormData({...formData, transactionId: e.target.value})}
                placeholder="TXN..."
                className="bg-slate-50 border-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setIsAddDialogOpen(false);
              setIsEditDialogOpen(false);
            }}>Cancel</Button>
            <Button onClick={isEditDialogOpen ? handleUpdateSubscription : handleAddSubscription} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditDialogOpen ? 'Save Changes' : 'Confirm Activation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Pricing Matrix
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Modules Included</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-bold">Starter</TableCell>
                  <TableCell>₹4,999/mo</TableCell>
                  <TableCell>500 Students</TableCell>
                  <TableCell className="text-xs text-slate-500">Core Admin, Parent App, Attendance, Fee Portal</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-blue-600">Growth</TableCell>
                  <TableCell>₹9,999/mo</TableCell>
                  <TableCell>2,000 Students</TableCell>
                  <TableCell className="text-xs text-slate-500">Starter + GPS Transport, Library, AI Early Warning</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-purple-600">Pro</TableCell>
                  <TableCell>₹18,999/mo</TableCell>
                  <TableCell>5,000 Students</TableCell>
                  <TableCell className="text-xs text-slate-500">Growth + Sports ECA, Multi-Curriculum, SEL Dashboard</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-bold text-amber-600">Elite</TableCell>
                  <TableCell>Custom</TableCell>
                  <TableCell>Unlimited</TableCell>
                  <TableCell className="text-xs text-slate-500">All Modules + Biometrics, Campus Wallet, White Labeling</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-display font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Optional Add-on Features
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Add-On</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-xs">Campus Wallet</TableCell>
                  <TableCell className="text-xs">₹2,499/mo</TableCell>
                  <TableCell className="text-[10px] text-slate-500">Parent wallet, QR canteen payments, spend analytics</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-xs">Biometric Sync</TableCell>
                  <TableCell className="text-xs">₹1,999/mo</TableCell>
                  <TableCell className="text-[10px] text-slate-500">Face-recognition API, RFID gate hardware sync</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-xs">AI Highlight Reel</TableCell>
                  <TableCell className="text-xs">₹1,499/mo</TableCell>
                  <TableCell className="text-[10px] text-slate-500">Video clips, digital trophy room, sports recruiter</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-xs">24x7 SLA Support</TableCell>
                  <TableCell className="text-xs">₹3,999/mo</TableCell>
                  <TableCell className="text-[10px] text-slate-500">Named account manager + 2-hour SLA response</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-xs">White Labeling</TableCell>
                  <TableCell className="text-xs">₹24,999</TableCell>
                  <TableCell className="text-[10px] text-slate-500">One-time branding fee for school-branded apps</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionsPage;
