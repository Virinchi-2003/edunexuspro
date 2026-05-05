import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Wallet, 
  History, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Loader2,
  Calendar,
  IndianRupee,
  Receipt
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
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const AccountantSalaries: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'roster' | 'history'>('roster');
  
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  
  const [payFormData, setPayFormData] = useState({
    amount: 0,
    month: '',
    bonus: 0,
    deductions: 0,
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rosterRes, historyRes] = await Promise.all([
        api.get(`/accountant/salaries/records/${user.schoolId}`),
        api.get(`/accountant/salaries/history/${user.schoolId}`)
      ]);
      setStaffList(rosterRes.data.data);
      setPaymentHistory(historyRes.data.data);
    } catch (error) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProcessPayment = async () => {
    if (!payFormData.month) return toast.error('Please select payment month');
    try {
      setSaving(true);
      await api.post('/accountant/salaries/pay', {
        ...payFormData,
        schoolId: user.schoolId,
        staffId: selectedStaff.id
      });
      toast.success(`Salary processed for ${selectedStaff.name}`);
      setIsPayModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Payment processing failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = paymentHistory.filter(h => 
    h.staff?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.month.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
          <Input 
            placeholder="Search staff by name or role..." 
            className="pl-12 h-14 rounded-2xl border-none shadow-xl bg-white focus-visible:ring-2 focus-visible:ring-violet-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-[1.5rem] shadow-xl border border-slate-50">
           <Button 
             variant={view === 'roster' ? 'default' : 'ghost'}
             className={`rounded-xl px-6 font-bold ${view === 'roster' ? 'bg-violet-600 text-white' : 'text-slate-500'}`}
             onClick={() => setView('roster')}
           >
             Payroll Roster
           </Button>
           <Button 
             variant={view === 'history' ? 'default' : 'ghost'}
             className={`rounded-xl px-6 font-bold ${view === 'history' ? 'bg-violet-600 text-white' : 'text-slate-500'}`}
             onClick={() => setView('history')}
           >
             Payment History
           </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {view === 'roster' ? (
               <table className="w-full">
               <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                 <tr>
                   <th className="px-10 py-6 text-left">Staff Member</th>
                   <th className="px-10 py-6 text-left">Department</th>
                   <th className="px-10 py-6 text-left">Role</th>
                   <th className="px-10 py-6 text-left">Base Salary</th>
                   <th className="px-10 py-6 text-center">Status</th>
                   <th className="px-10 py-6 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {loading ? (
                    Array.from({ length: 5 }).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-24 bg-slate-50/50" /></tr>)
                 ) : filteredStaff.map((s) => (
                   <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-10 py-8">
                        <div className="font-bold text-slate-900 text-lg">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {s.id.slice(0,8).toUpperCase()}</div>
                     </td>
                     <td className="px-10 py-8">
                        <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-500 border-slate-100 font-bold capitalize">
                           {s.department}
                        </Badge>
                     </td>
                     <td className="px-10 py-8 font-medium text-slate-600">{s.role}</td>
                     <td className="px-10 py-8">
                        <div className="font-bold text-slate-900">₹{s.salary?.toLocaleString() || '0'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monthly Base</div>
                     </td>
                     <td className="px-10 py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.status}</span>
                        </div>
                     </td>
                     <td className="px-10 py-8 text-right">
                        <Button 
                          className="rounded-2xl h-12 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-100 gap-2"
                          onClick={() => {
                            setSelectedStaff(s);
                            setPayFormData({
                              amount: s.salary || 0,
                              month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
                              bonus: 0,
                              deductions: 0,
                              notes: ''
                            });
                            setIsPayModalOpen(true);
                          }}
                        >
                          <Wallet className="w-4 h-4" /> Pay
                        </Button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <tr>
                    <th className="px-10 py-6 text-left">Recipient</th>
                    <th className="px-10 py-6 text-left">Month</th>
                    <th className="px-10 py-6 text-left">Amount Paid</th>
                    <th className="px-10 py-6 text-left">Transaction ID</th>
                    <th className="px-10 py-6 text-left">Date</th>
                    <th className="px-10 py-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-8">
                         <div className="font-bold text-slate-900">{h.staff?.name}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{h.staff?.role}</div>
                      </td>
                      <td className="px-10 py-8 font-bold text-slate-600">{h.month}</td>
                      <td className="px-10 py-8">
                         <div className="font-bold text-emerald-600">₹{(h.amount + (h.bonus || 0) - (h.deductions || 0)).toLocaleString()}</div>
                         <div className="text-[10px] text-slate-400 font-medium">B: ₹{h.bonus} | D: ₹{h.deductions}</div>
                      </td>
                      <td className="px-10 py-8 text-sm font-mono text-slate-400">
                         {h.id.slice(0,12).toUpperCase()}
                      </td>
                      <td className="px-10 py-8 text-sm text-slate-500">
                         {new Date(h.paymentDate).toLocaleDateString()}
                      </td>
                      <td className="px-10 py-8 text-center">
                         <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {h.status}
                         </Badge>
                      </td>
                    </tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-10 py-20 text-center text-slate-400">
                         <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                         <p className="font-bold uppercase text-xs tracking-widest">No payment records found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Process Payroll</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Disburse salary for {selectedStaff?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Month</label>
              <Input 
                placeholder="e.g. October 2026" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                value={payFormData.month}
                onChange={(e) => setPayFormData({...payFormData, month: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bonus (₹)</label>
                <Input 
                  type="number" 
                  className="rounded-2xl h-14 bg-emerald-50 border-none px-6 font-bold text-emerald-600"
                  value={payFormData.bonus}
                  onChange={(e) => setPayFormData({...payFormData, bonus: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deductions (₹)</label>
                <Input 
                  type="number" 
                  className="rounded-2xl h-14 bg-rose-50 border-none px-6 font-bold text-rose-600"
                  value={payFormData.deductions}
                  onChange={(e) => setPayFormData({...payFormData, deductions: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Net Amount</label>
               <div className="h-14 rounded-2xl bg-slate-900 flex items-center px-6 text-white font-bold text-xl">
                  ₹{(payFormData.amount + payFormData.bonus - payFormData.deductions).toLocaleString()}
               </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-violet-600 hover:bg-violet-700 text-white font-bold text-lg shadow-xl shadow-violet-100"
              onClick={handleProcessPayment}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wallet className="w-6 h-6 mr-3" />}
              Confirm Disbursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountantSalaries;
