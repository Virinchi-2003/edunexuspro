import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Plus, 
  CreditCard,
  CheckCircle2,
  Mail,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

const AccountantFees: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'records' | 'history'>('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  
  const [updateFormData, setUpdateFormData] = useState({
    status: 'paid',
    paidAmount: 0,
    transactionId: '',
    amount: 0
  });

  const [reminderData, setReminderData] = useState({
    message: '',
    subject: 'Fee Payment Reminder',
    recipients: [] as string[]
  });

  const [modalFilter, setModalFilter] = useState({
    classId: '',
    section: ''
  });

  const [createFormData, setCreateFormData] = useState({
    studentId: '',
    amount: 0,
    dueDate: '',
    feeType: 'Tuition Fee',
    breakdown: ''
  });

  const fetchData = async () => {
    if (!user?.schoolId) {
      console.warn('No schoolId found for accountant');
      return;
    }
    try {
      setLoading(true);
      const [feesRes, classesRes] = await Promise.all([
        api.get(`/accountant/fees/${user.schoolId}`),
        api.get(`/classes/school/${user.schoolId}`)
      ]);
      
      const data = feesRes.data?.data || {};
      setFeeRecords(data.fees || []);
      setStudents(data.students || []);
      setTransactions(data.transactions || []);
      setInstallments(data.installments || []);
      setClassList(classesRes.data?.data || []);
      
      console.log(`Loaded ${data.fees?.length || 0} fee records for school ${user.schoolId}`);
    } catch (error) {
      console.error('Accountant Fees Fetch Error:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateFee = async () => {
    try {
      setSaving(true);
      await api.put(`/accountant/fees/${selectedFee.id}`, updateFormData);
      toast.success('Fee record updated successfully');
      setIsUpdateModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update fee');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFee = async () => {
    try {
      setSaving(true);
      await api.post('/accountant/fees/record', { 
        ...createFormData, 
        schoolId: user.schoolId 
      });
      toast.success('New fee record created');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create fee record');
    } finally {
      setSaving(false);
    }
  };

  const handleSendReminders = () => {
    // Open the custom reminder modal instead of immediate send
    const pendingRecipients = Array.from(new Set(
      feeRecords
        .filter(f => f.status !== 'paid')
        .map(f => students.find(s => s.id === f.studentId)?.email)
        .filter(Boolean) as string[]
    ));
    
    setReminderData({
      ...reminderData,
      recipients: pendingRecipients
    });
    setIsReminderModalOpen(true);
  };

  const handleSendCustomReminder = async () => {
    if (!reminderData.message) return toast.error('Please enter a message');
    if (reminderData.recipients.length === 0) return toast.error('No recipients selected');
    
    try {
      setSaving(true);
      await api.post('/accountant/fees/custom-reminder', {
        ...reminderData,
        schoolId: user.schoolId
      });
      toast.success(`Custom reminders sent to ${reminderData.recipients.length} recipients`);
      setIsReminderModalOpen(false);
    } catch (error) {
      toast.error('Failed to send custom reminders');
    } finally {
      setSaving(false);
    }
  };

  const filteredRecords = React.useMemo(() => {
    const records: any[] = [];
    
    // Process existing fee records
    feeRecords.forEach(f => {
      const student = students.find(s => s.id === f.studentId);
      const studentName = student?.name || 'Unknown Student';
      const studentId = student?.studentId || '';
      
      const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           studentId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = !filterClass || student?.classId === filterClass;
      const matchesSection = !filterSection || student?.section === filterSection;
      
      if (matchesSearch && matchesClass && matchesSection) {
        records.push({ ...f, student });
      }
    });

    // Add "Virtual" records for students with NO fees assigned
    if (filterStatus === 'all' || filterStatus === 'unpaid' || filterStatus === 'pending') {
      students.forEach(s => {
        const hasFees = feeRecords.some(f => f.studentId === s.id);
        if (!hasFees) {
          const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                               s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesClass = !filterClass || s.classId === filterClass;
          const matchesSection = !filterSection || s.section === filterSection;
          
          if (matchesSearch && matchesClass && matchesSection) {
            records.push({
              id: `pending-${s.id}`,
              studentId: s.id,
              student: s,
              status: 'unassigned',
              feeType: 'Not Assigned',
              amount: 0,
              dueDate: null,
              isVirtual: true
            });
          }
        }
      });
    }

    return records.filter(r => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'unpaid') return r.status === 'unpaid' || r.status === 'unassigned' || r.status === 'partially_paid';
      return r.status === filterStatus;
    });
  }, [feeRecords, students, searchQuery, filterStatus, filterClass, filterSection]);

  const filteredTransactions = transactions.filter(t => {
    const student = students.find(s => s.id === t.studentId);
    const matchesSearch = (student?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (student?.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !filterClass || student?.classId === filterClass;
    const matchesSection = !filterSection || student?.section === filterSection;
    
    return matchesSearch && matchesClass && matchesSection;
  });

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <Input 
              placeholder="Search by student name or ID..." 
              className="pl-12 h-14 rounded-2xl border-none shadow-xl bg-white focus-visible:ring-2 focus-visible:ring-emerald-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select 
              className="h-14 rounded-2xl bg-white border-none shadow-xl px-6 font-bold text-slate-900 appearance-none min-w-[140px]"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="">All Classes</option>
              {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              className="h-14 rounded-2xl bg-white border-none shadow-xl px-6 font-bold text-slate-900 appearance-none min-w-[140px]"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="">All Sections</option>
              {Array.from(new Set(students.map(s => s.section))).filter(Boolean).map(s => (
                <option key={s as string} value={s as string}>{s as string}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="rounded-2xl h-14 px-6 font-bold bg-white border-slate-200 text-slate-600 gap-2 flex-1 md:flex-none shadow-sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
          <Button 
            variant="outline" 
            className="rounded-2xl h-14 px-6 font-bold bg-white border-slate-200 text-slate-600 gap-2 flex-1 md:flex-none shadow-sm"
            onClick={handleSendReminders}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 text-emerald-600" />}
            Send Reminders
          </Button>
          <Button 
            className="rounded-2xl h-14 px-8 font-bold bg-slate-900 text-white shadow-xl hover:bg-slate-800 gap-2 flex-1 md:flex-none"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Assign Fee
          </Button>
        </div>
      </div>

      <div className="flex gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-[1.5rem] shadow-sm border border-slate-100 w-fit">
         <Button
           variant={activeView === 'records' ? 'default' : 'ghost'}
           onClick={() => setActiveView('records')}
           className={`rounded-xl px-6 font-bold ${activeView === 'records' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
         >
           Fee Records
         </Button>
         <Button
           variant={activeView === 'history' ? 'default' : 'ghost'}
           onClick={() => setActiveView('history')}
           className={`rounded-xl px-6 font-bold ${activeView === 'history' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
         >
           Paid History
         </Button>
      </div>

      {activeView === 'records' ? (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {['all', 'unpaid', 'partially_paid', 'paid'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'ghost'}
                onClick={() => setFilterStatus(status)}
                className={`rounded-full px-6 h-10 font-bold capitalize ${
                  filterStatus === status ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-500 hover:bg-emerald-50'
                }`}
              >
                {status.replace('_', ' ')}
              </Button>
           ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-4">
           Showing transaction history for selected filters
        </div>
      )}

      <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeView === 'records' ? (
               <table className="w-full">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="px-10 py-6 text-left">Student Name</th>
                      <th className="px-10 py-6 text-left">Challan #</th>
                      <th className="px-10 py-6 text-left">Fee Type</th>
                      <th className="px-10 py-6 text-left">Amount</th>
                      <th className="px-10 py-6 text-left">Due Date</th>
                      <th className="px-10 py-6 text-center">Status</th>
                      <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={7} className="px-10 py-8 bg-slate-50/50 h-24" />
                        </tr>
                      ))
                    ) : filteredRecords.map((fee) => (
                      <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-10 py-8">
                           <div className="font-bold text-slate-900">{getStudentName(fee.studentId)}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {fee.id.slice(0,8).toUpperCase()}</div>
                        </td>
                        <td className="px-10 py-8 text-sm font-mono text-slate-500">{fee.challanNumber || 'Pending'}</td>
                        <td className="px-10 py-8 font-medium text-slate-600">{fee.feeType}</td>
                        <td className="px-10 py-8">
                           <div className="font-bold text-slate-900">₹{fee.amount}</div>
                           {fee.lateFee > 0 && <div className="text-[10px] text-rose-500 font-bold">+₹{fee.lateFee} Late Fee</div>}
                        </td>
                        <td className="px-10 py-8 text-sm text-slate-500 font-medium">
                           {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-10 py-8 text-center">
                           <Badge className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none ${
                              fee.status === 'paid' ? 'bg-emerald-500 text-white' : 
                              fee.status === 'partially_paid' ? 'bg-amber-500 text-white' : 
                              fee.status === 'unassigned' ? 'bg-slate-200 text-slate-500' :
                              'bg-rose-500 text-white'
                           }`}>
                              {fee.status.replace('_', ' ')}
                           </Badge>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <Button 
                             variant="ghost" 
                             className="rounded-xl h-10 px-4 text-emerald-600 font-bold hover:bg-emerald-50"
                             onClick={() => {
                               if (fee.isVirtual) {
                                 setCreateFormData({
                                   ...createFormData,
                                   studentId: fee.studentId
                                 });
                                 setIsCreateModalOpen(true);
                               } else {
                                 setSelectedFee(fee);
                                 setUpdateFormData({
                                   status: fee.status,
                                   paidAmount: fee.paidAmount || 0,
                                   transactionId: fee.transactionId || '',
                                   amount: fee.amount
                                 });
                                 setIsUpdateModalOpen(true);
                               }
                             }}
                           >
                             {fee.isVirtual ? 'Assign' : 'Manage'}
                           </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="px-10 py-20 text-center text-slate-400">
                           <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
                           <p className="font-bold uppercase text-xs tracking-widest">No fee records found for this selection</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
            ) : (
               <table className="w-full">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="px-10 py-6 text-left">Student</th>
                      <th className="px-10 py-6 text-left">Payment Method</th>
                      <th className="px-10 py-6 text-left">Transaction Ref</th>
                      <th className="px-10 py-6 text-left">Amount Paid</th>
                      <th className="px-10 py-6 text-left">Date</th>
                      <th className="px-10 py-6 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                       Array.from({ length: 5 }).map((_, i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="h-24 bg-slate-50/50" /></tr>)
                    ) : filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-8">
                           <div className="font-bold text-slate-900">{getStudentName(tx.studentId)}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{students.find(s => s.id === tx.studentId)?.studentId}</div>
                        </td>
                        <td className="px-10 py-8">
                           <Badge variant="outline" className="rounded-lg bg-emerald-50 text-emerald-600 border-none px-3 font-bold capitalize">
                              {tx.paymentMethod || 'Manual'}
                           </Badge>
                        </td>
                        <td className="px-10 py-8 text-sm font-mono text-slate-500">
                           {tx.razorpayPaymentId || 'N/A'}
                        </td>
                        <td className="px-10 py-8">
                           <div className="font-bold text-slate-900">₹{tx.amount.toLocaleString()}</div>
                           <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Successfull Credit</div>
                        </td>
                        <td className="px-10 py-8 text-sm text-slate-500">
                           {new Date(tx.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-10 py-8 text-center">
                           <div className="flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Verified</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredTransactions.length === 0 && (
                       <tr>
                          <td colSpan={6} className="px-10 py-20 text-center text-slate-400">
                             <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
                             <p className="font-bold uppercase text-xs tracking-widest">No payment history found for selected filters</p>
                          </td>
                       </tr>
                    )}
                  </tbody>
               </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Fee Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold">Assign Fee Record</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Initialize a new financial obligation for a student.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Student</label>
              <select 
                className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-emerald-100"
                value={createFormData.studentId}
                onChange={(e) => setCreateFormData({...createFormData, studentId: e.target.value})}
              >
                <option value="">Select student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.studentId})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base Amount</label>
                <Input 
                  type="number" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={createFormData.amount}
                  onChange={(e) => setCreateFormData({...createFormData, amount: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Due Date</label>
                <Input 
                  type="date" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={createFormData.dueDate}
                  onChange={(e) => setCreateFormData({...createFormData, dueDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fee Type</label>
              <Input 
                placeholder="e.g. Annual Sports Fee" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                value={createFormData.feeType}
                onChange={(e) => setCreateFormData({...createFormData, feeType: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg"
              onClick={handleCreateFee}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <DollarSign className="w-6 h-6 mr-3 text-emerald-400" />}
              Publish Fee Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Fee Modal */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Manage Payment</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Update status for {selectedFee && getStudentName(selectedFee.studentId)}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Status</label>
              <select 
                className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none"
                value={updateFormData.status}
                onChange={(e) => setUpdateFormData({...updateFormData, status: e.target.value})}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Fully Paid</option>
              </select>
            </div>
            
            {/* Installment Viewer for Accountants */}
            {selectedFee && (
              <div className="space-y-3 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Linked Installments</h5>
                  <Badge variant="outline" className="text-[8px] bg-white border-slate-100">Synced</Badge>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {installments.filter(i => i.feeRecordId === selectedFee.id).length > 0 ? (
                    installments.filter(i => i.feeRecordId === selectedFee.id).map((inst: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-50 animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Installment {idx + 1}</div>
                          <div className="text-xs font-bold text-slate-900">₹{inst.amount.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Due</div>
                          <div className="text-xs font-bold text-slate-600">{new Date(inst.dueDate).toLocaleDateString()}</div>
                        </div>
                        <Badge className={`ml-2 text-[8px] h-5 px-2 ${inst.status === 'paid' ? 'bg-emerald-500' : 'bg-slate-200 text-slate-500'}`}>
                          {inst.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs italic">No manual installments defined.</div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Amount</label>
                <Input 
                  type="number" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={updateFormData.amount}
                  onChange={(e) => setUpdateFormData({...updateFormData, amount: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Paid Amount</label>
                <Input 
                  type="number" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold text-emerald-600"
                  value={updateFormData.paidAmount}
                  onChange={(e) => setUpdateFormData({...updateFormData, paidAmount: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Manual Transaction ID / Ref</label>
              <Input 
                placeholder="e.g. CHK-5521 or BANK-REF" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-mono"
                value={updateFormData.transactionId}
                onChange={(e) => setUpdateFormData({...updateFormData, transactionId: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg"
              onClick={handleUpdateFee}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6 mr-3" />}
              Sync Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Reminder Modal */}
      <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Custom Fee Reminder</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Send a personalized message to students with pending fees.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Subject</label>
              <Input 
                placeholder="e.g. Action Required: Pending Term Fees" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                value={reminderData.subject}
                onChange={(e) => setReminderData({...reminderData, subject: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Custom Message</label>
              <textarea 
                className="w-full min-h-[150px] rounded-[2rem] bg-slate-50 border-none p-6 text-slate-900 font-medium focus:ring-2 focus:ring-emerald-100"
                placeholder="Type your reminder message here..."
                value={reminderData.message}
                onChange={(e) => setReminderData({...reminderData, message: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filter by Class</label>
                  <select 
                     className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 font-bold text-slate-900 appearance-none"
                     value={modalFilter.classId}
                     onChange={(e) => setModalFilter({...modalFilter, classId: e.target.value})}
                  >
                     <option value="">All Classes</option>
                     {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Section</label>
                  <select 
                     className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 font-bold text-slate-900 appearance-none"
                     value={modalFilter.section}
                     onChange={(e) => setModalFilter({...modalFilter, section: e.target.value})}
                  >
                     <option value="">All Sections</option>
                     {Array.from(new Set(students.map(s => s.section))).filter(Boolean).map(s => (
                        <option key={s} value={s}>{s}</option>
                     ))}
                  </select>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Add Recipient</label>
               <div className="flex gap-2">
                  <select 
                     className="flex-1 h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none"
                     onChange={(e) => {
                        const email = e.target.value;
                        if (email && !reminderData.recipients.includes(email)) {
                           setReminderData({
                              ...reminderData,
                              recipients: [...reminderData.recipients, email]
                           });
                        }
                     }}
                     value=""
                  >
                     <option value="">Select individual student...</option>
                     {students
                        .filter(s => (!modalFilter.classId || s.classId === modalFilter.classId) && (!modalFilter.section || s.section === modalFilter.section))
                        .map(s => (
                           <option key={s.id} value={s.email}>{s.name} ({s.email})</option>
                        ))}
                  </select>
                  <Button 
                    variant="outline"
                    className="h-14 rounded-2xl px-6 font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50 whitespace-nowrap"
                    onClick={() => {
                       const filtered = students
                          .filter(s => (!modalFilter.classId || s.classId === modalFilter.classId) && (!modalFilter.section || s.section === modalFilter.section))
                          .map(s => s.email)
                          .filter(email => email && !reminderData.recipients.includes(email));
                       
                       setReminderData({
                          ...reminderData,
                           recipients: [...reminderData.recipients, ...filtered]
                       });
                    }}
                  >
                     Add All
                  </Button>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Recipients ({reminderData.recipients.length})</label>
               <div className="max-h-[120px] overflow-y-auto p-4 bg-slate-50 rounded-2xl flex flex-wrap gap-2 shadow-inner">
                  {reminderData.recipients.map(email => (
                     <Badge key={email} className="bg-white text-slate-600 border border-slate-100 px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                        {email}
                        <button onClick={() => setReminderData({
                           ...reminderData,
                           recipients: reminderData.recipients.filter(r => r !== email)
                        })} className="text-slate-400 hover:text-rose-500 font-bold ml-1 transition-colors">×</button>
                     </Badge>
                  ))}
                  {reminderData.recipients.length === 0 && <span className="text-xs text-slate-400 italic">No recipients selected</span>}
               </div>
               <div className="flex justify-between items-center mt-2 px-2">
                  <p className="text-[10px] text-slate-400 italic">Click student to add, or click '×' to remove.</p>
                  {reminderData.recipients.length > 0 && (
                     <button 
                        className="text-[10px] font-bold text-rose-500 hover:underline"
                        onClick={() => setReminderData({...reminderData, recipients: []})}
                     >
                        Clear All
                     </button>
                  )}
               </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-xl shadow-emerald-100"
              onClick={handleSendCustomReminder}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mail className="w-6 h-6 mr-3" />}
              Dispatch Custom Reminders
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountantFees;
