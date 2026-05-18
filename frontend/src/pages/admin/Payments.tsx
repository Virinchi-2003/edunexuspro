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
  DollarSign, 
  Search, 
  Calendar,
  Building,
  Trash2,
  Loader2,
  Plus,
  ArrowUpRight,
  Bell,
  CheckCircle,
  FileText,
  Clock,
  ExternalLink
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

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Manual Payment Form
  const [formData, setFormData] = useState({
    schoolId: '',
    schoolName: '',
    plan: 'starter',
    amount: 4999,
    transactionId: '',
    paymentDate: new Date().toISOString().slice(0, 16) // Date & Time format
  });

  // Repayment Reminder Form
  const [reminderData, setReminderData] = useState({
    schoolId: '',
    message: '',
    amount: 4999,
    dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
  });

  const planPrices: any = {
    'starter': 4999,
    'growth': 9999,
    'pro': 18999,
    'elite': 50000
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, schoolsRes] = await Promise.all([
        api.get('/management/payments'),
        api.get('/schools')
      ]);
      setPayments(paymentsRes.data.data || []);
      setSchools(schoolsRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load payments and schools data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlanChange = (plan: string) => {
    setFormData({
      ...formData,
      plan,
      amount: planPrices[plan.toLowerCase()] || 4999
    });
  };

  const handleSchoolChange = (schoolId: string) => {
    const selectedSchool = schools.find(s => s.id === schoolId);
    setFormData({
      ...formData,
      schoolId,
      schoolName: selectedSchool ? selectedSchool.name : '',
      plan: selectedSchool ? selectedSchool.subscriptionPlan || 'starter' : 'starter',
      amount: selectedSchool ? planPrices[selectedSchool.subscriptionPlan?.toLowerCase()] || 4999 : 4999
    });
  };

  const handleAddPayment = async () => {
    if (!formData.schoolId || !formData.amount || !formData.transactionId || !formData.paymentDate) {
      toast.error('All fields are required to log a payment');
      return;
    }

    try {
      setIsSaving(true);
      // Format paymentDate beautifully
      const formattedDate = formData.paymentDate.replace('T', ' ');
      const payload = {
        ...formData,
        paymentDate: formattedDate
      };

      await api.post('/management/payments', payload);
      toast.success('Manual payment successfully logged and database synchronized!');
      setIsAddDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register payment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this payment transaction record?')) return;
    try {
      await api.delete(`/management/payments/${id}`);
      toast.success('Payment record successfully deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete transaction failed');
    }
  };

  const handleReminderClick = (schoolId: string, plan: string, amount: number) => {
    const selectedSchool = schools.find(s => s.id === schoolId);
    setReminderData({
      schoolId,
      message: `Dear Principal, this is a reminder for your EduNexus Pro Plan Repayment. Your current ${plan.toUpperCase()} plan is due for renewal. Please make the payment of ₹${amount.toLocaleString()} to avoid service disruption.`,
      amount,
      dueDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0]
    });
    setIsReminderDialogOpen(true);
  };

  const handleSendReminder = async () => {
    if (!reminderData.schoolId || !reminderData.message) {
      toast.error('School and reminder message are required');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/management/payments/remind', reminderData);
      toast.success('Repayment reminder message successfully sent to Principal portal!');
      setIsReminderDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send repayment reminder');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      schoolId: '',
      schoolName: '',
      plan: 'starter',
      amount: 4999,
      transactionId: '',
      paymentDate: new Date().toISOString().slice(0, 16)
    });
  };

  const filteredPayments = payments.filter(p => {
    const sName = p.schoolName?.toLowerCase() || '';
    const sId = p.schoolId?.toLowerCase() || '';
    const txId = p.transactionId?.toLowerCase() || '';
    const planName = p.plan?.toLowerCase() || '';
    const sQuery = search.toLowerCase();

    return sName.includes(sQuery) || 
           sId.includes(sQuery) || 
           txId.includes(sQuery) || 
           planName.includes(sQuery);
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Upper header panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-primary" />
            School SaaS Payments
          </h2>
          <p className="text-slate-500">Log payments, track subscription plans, and send repayment renewals to school principals.</p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Log Payment
          </Button>
          <Button variant="outline" className="gap-2 border-slate-200 bg-white shadow-sm" onClick={() => {
            if (schools.length > 0) {
              handleReminderClick(schools[0].id, schools[0].subscriptionPlan || 'starter', planPrices[schools[0].subscriptionPlan || 'starter']);
            } else {
              toast.error('No institutions registered yet.');
            }
          }}>
            <Bell className="w-4 h-4 text-amber-500" /> Send Reminder
          </Button>
        </div>
      </div>

      {/* Analytics stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">Total Revenue</Badge>
            </div>
            <p className="text-white/70 text-sm mb-1">Received Payments</p>
            <h3 className="text-3xl font-bold">
              ₹{payments.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <Badge className="bg-blue-50 text-blue-600 border-none">Transactions</Badge>
            </div>
            <p className="text-slate-500 text-sm mb-1">Total Logs</p>
            <h3 className="text-3xl font-bold text-slate-900">{payments.length}</h3>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Building className="w-5 h-5 text-amber-600" />
              </div>
              <Badge className="bg-amber-50 text-amber-600 border-none">Subscribers</Badge>
            </div>
            <p className="text-slate-500 text-sm mb-1">Registered Schools</p>
            <h3 className="text-3xl font-bold text-slate-900">{schools.length}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Search and filtered transactions table */}
      <Card className="border-none shadow-sm">
        <CardHeader className="p-0 border-b border-slate-100">
          <div className="flex items-center gap-4 p-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by institution name, plan, transaction ID, or school ID..." 
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
              <p className="text-slate-500">Loading payment ledger details...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead>Institution (School ID)</TableHead>
                  <TableHead>Purchased Plan</TableHead>
                  <TableHead>Payment Date & Time</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                      No payments found matching the search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((p) => {
                    const selectedSchool = schools.find(sch => sch.id === p.schoolId);
                    const humanReadableSchoolId = selectedSchool ? selectedSchool.school_id : 'N/A';
                    
                    return (
                      <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-800">{p.schoolName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">School ID: {humanReadableSchoolId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`capitalize border-none ${
                              p.plan.toLowerCase() === 'elite' ? 'bg-purple-100 text-purple-700' :
                              p.plan.toLowerCase() === 'pro' ? 'bg-blue-100 text-blue-700' :
                              p.plan.toLowerCase() === 'growth' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {p.paymentDate}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-500">
                          {p.transactionId}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          ₹{p.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 border-none gap-1 py-0.5">
                            <CheckCircle className="w-3 h-3" /> Paid
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => handleReminderClick(p.schoolId, p.plan, p.amount)}
                            >
                              <Bell className="w-3.5 h-3.5 mr-1" /> Remind
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-600 hover:bg-red-50" 
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Payment Logger Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Log Manual Plan Payment
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select School / Institution</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.schoolId}
                onChange={e => handleSchoolChange(e.target.value)}
              >
                <option value="">Choose Institution</option>
                {schools.map(sch => (
                  <option key={sch.id} value={sch.id}>{sch.name} ({sch.school_id})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Subscription Plan</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
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
                <label className="text-sm font-semibold text-slate-700">Billing Amount (₹)</label>
                <Input 
                  type="number"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Payment Date & Time</label>
              <Input 
                type="datetime-local"
                value={formData.paymentDate}
                onChange={e => setFormData({...formData, paymentDate: e.target.value})}
                className="bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Transaction ID</label>
              <Input 
                value={formData.transactionId}
                onChange={e => setFormData({...formData, transactionId: e.target.value})}
                placeholder="e.g. TXN-95180456201"
                className="bg-slate-50 border-slate-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Repayment Renewal Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={(open) => {
        if (!open) setIsReminderDialogOpen(false)}
      }>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Bell className="w-6 h-6 text-amber-500" />
              Send Repayment Reminder
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Target School / Institution</label>
              <select 
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={reminderData.schoolId}
                onChange={e => {
                  const s = schools.find(sch => sch.id === e.target.value);
                  const price = s ? planPrices[s.subscriptionPlan?.toLowerCase()] || 4999 : 4999;
                  setReminderData({
                    ...reminderData,
                    schoolId: e.target.value,
                    amount: price,
                    message: `Dear Principal, this is a reminder for your EduNexus Pro Plan Repayment. Your current ${(s?.subscriptionPlan || 'starter').toUpperCase()} plan is due for renewal. Please make the payment of ₹${price.toLocaleString()} to avoid service disruption.`
                  });
                }}
              >
                <option value="">Choose Institution</option>
                {schools.map(sch => (
                  <option key={sch.id} value={sch.id}>{sch.name} ({sch.school_id})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Due Amount (₹)</label>
                <Input 
                  type="number"
                  value={reminderData.amount}
                  onChange={e => setReminderData({...reminderData, amount: parseInt(e.target.value)})}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Payment Due Date</label>
                <Input 
                  type="date"
                  value={reminderData.dueDate}
                  onChange={e => setReminderData({...reminderData, dueDate: e.target.value})}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Reminder Message Details</label>
              <textarea 
                rows={4}
                value={reminderData.message}
                onChange={e => setReminderData({...reminderData, message: e.target.value})}
                placeholder="Type renewal reminder..."
                className="flex w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReminderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendReminder} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-white border-none">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reminder Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentsPage;
