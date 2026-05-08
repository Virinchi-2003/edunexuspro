import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard, 
  Receipt, 
  Clock, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Plus, 
  RefreshCw,
  IndianRupee,
  PieChart,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Send
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const StudentFees = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [advanceData, setAdvanceData] = useState({ amount: '', type: 'Activity Fee', installmentId: '' });
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [supportData, setSupportData] = useState({ subject: 'Fee Query', message: '', category: 'fee_issue', priority: 'medium' });
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [isPaymentModeDialogOpen, setIsPaymentModeDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('online');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const identifier = user.uid || user.id;
      
      if (!identifier) {
        console.error('No user identifier found');
        return;
      }

      // 1. Get the actual student record first to get the UUID (id)
      const studentRes = await api.get(`/students/user/${identifier}`);
      const student = studentRes.data.data;
      
      if (!student) {
        toast.error('Student profile not found');
        return;
      }

      const feesRes = await api.get(`/fees/student/${student.id}`);
      const { 
        fees: studentFees, 
        transactions: studentTxs, 
        feeStructure: backendStruct,
        installments: studentInsts 
      } = feesRes.data.data;

      setFees(studentFees || []);
      setTransactions(studentTxs || []);
      setStudentProfile(student);
      setFeeStructure(backendStruct);
      setInstallments(studentInsts || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!supportData.message) return toast.error('Please enter your query');
    try {
      setSubmittingTicket(true);
      await api.post('/students/support-ticket', {
        ...supportData,
        schoolId: studentProfile.schoolId,
        studentId: studentProfile.id
      });
      toast.success('Your query has been sent to the Accounts Office');
      setIsSupportDialogOpen(false);
      setSupportData({ ...supportData, message: '' });
    } catch (error) {
      toast.error('Failed to send query');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handlePayment = async (feeRecords: any | any[], mode: 'cash' | 'online' = 'online', installmentId?: string) => {
    try {
      setPaying(true);
      const user = JSON.parse(localStorage.getItem('user')!);
      
      const records = Array.isArray(feeRecords) ? feeRecords : [feeRecords];
      const totalAmount = records.reduce((acc, f) => acc + (f.amount + (f.lateFee || 0) - (f.paidAmount || 0)), 0);
      
      if (mode === 'cash') {
        await api.post('/fees/pay-installment', {
          installmentId,
          paymentMode: 'cash',
        });
        toast.success('Cash payment submitted for verification');
        fetchData();
        return;
      }

      const response = await api.post('/fees/razorpay/order', {
        amount: totalAmount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      });
      const order = response.data.data;

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "EduNexus Pro",
        description: Array.isArray(feeRecords) ? "Consolidated Fee Payment" : `${feeRecords.feeType} Payment`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            if (installmentId) {
              await api.post('/fees/pay-installment', {
                installmentId,
                paymentMode: 'online',
                transactionId: response.razorpay_payment_id
              });
            } else {
              await api.post('/fees/razorpay/verify', {
                ...response,
                studentId: studentProfile.id,
                schoolId: studentProfile.schoolId,
                feeIds: records.map(r => r.id),
                amount: totalAmount,
                breakdown: records.length === 1 && records[0].breakdown ? records[0].breakdown : JSON.stringify(
                  records.reduce((acc, r) => ({...acc, [r.feeType]: r.amount}), {})
                )
              });
            }
            toast.success('Payment Successful!');
            fetchData();
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#4f46e5",
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Could not initiate payment');
    } finally {
      setPaying(false);
      setIsPaymentModeDialogOpen(false);
    }
  };

  const downloadReceipt = async (transactionId: string) => {
    try {
      toast.loading('Generating receipt...');
      const response = await api.get(`/fees/receipt/${transactionId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.dismiss();
      toast.success('Receipt downloaded');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download receipt');
    }
  };

  const pendingFeeRecords = fees.filter(f => f.status !== 'paid');
  const currentDues = pendingFeeRecords.reduce((acc, f) => acc + (f.amount + (f.lateFee || 0) - (f.paidAmount || 0)), 0);
  
  // Calculate total paid across all time
  const totalPaid = transactions.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  const yearlyTotal = feeStructure?.amount || 0;
  const yearlyRemaining = Math.max(0, yearlyTotal - totalPaid);

  // If no bills generated but structure exists, show structure balance
  const displayPayable = fees.length === 0 ? yearlyTotal : currentDues;

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Synchronizing Fee Data...</p>
    </div>
  );

  return (
    <div className="p-8">
      <Tabs defaultValue="payments" className="w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Institutional Billing</h2>
            <p className="text-slate-500 font-medium mt-1">Manage your academic payments and view billing composition.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 w-full md:w-auto">
              <TabsTrigger value="payments" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold">My Payments</TabsTrigger>
              <TabsTrigger value="structure" className="rounded-xl px-8 h-12 data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold">Fee Structure</TabsTrigger>
            </TabsList>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={fetchData}
              disabled={loading}
              className="rounded-full hover:bg-slate-100 transition-all h-12 w-12"
            >
              <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Payments Tab Content */}
        <TabsContent value="payments" className="space-y-8 outline-none">
          <div className="flex flex-col md:flex-row justify-end items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsAdvanceDialogOpen(true)}
              className="rounded-[1.5rem] px-6 h-12 border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 transition-all gap-2"
            >
              <Plus className="w-4 h-4" /> Pay Advance / Other
            </Button>
            <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 text-indigo-700 rounded-[1.5rem] border border-indigo-50">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Real-time Payment Sync</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Breakdown Card */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 flex flex-col justify-between">
               <div>
                  <div className="flex items-center gap-3 mb-8">
                     <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                        <PieChart className="w-6 h-6" />
                     </div>
                     <h4 className="text-xl font-display font-bold text-slate-900">Fee Breakdown</h4>
                  </div>
                   <div className="space-y-6">
                      {/* Yearly Progress Summary */}
                      {feeStructure && (
                        <div className="p-4 rounded-3xl bg-indigo-50/50 border border-indigo-100/50 mb-4">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Academic Year Progress</span>
                              <span className="text-[10px] font-bold text-indigo-600">{Math.round((totalPaid / (yearlyTotal || 1)) * 100)}% Paid</span>
                           </div>
                           <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                              <div 
                                className="h-full bg-indigo-600 transition-all duration-1000" 
                                style={{ width: `${(totalPaid / (yearlyTotal || 1)) * 100}%` }}
                              />
                           </div>
                           <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-500">Paid: ₹{totalPaid.toLocaleString()}</span>
                              <span className="text-slate-500">Target: ₹{yearlyTotal.toLocaleString()}</span>
                           </div>
                        </div>
                      )}

                      {pendingFeeRecords.map((fee, i) => {
                         let breakdownItems: any[] = [];
                         if (fee.breakdown) {
                           try {
                             const b = JSON.parse(fee.breakdown);
                             breakdownItems = Object.entries(b).filter(([_, v]) => Number(v) > 0);
                           } catch (e) {
                             breakdownItems = [[fee.feeType, fee.amount]];
                           }
                         } else {
                           breakdownItems = [[fee.feeType, fee.amount]];
                         }

                         return (
                           <div key={i} className="flex flex-col gap-3 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 hover:bg-white transition-all">
                               <div className="flex justify-between items-start">
                                  <div className="flex flex-col">
                                     <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">{fee.feeType}</span>
                                     <span className="text-[10px] font-bold text-slate-400 mt-0.5 italic">Itemized Breakdown</span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                     <span className="text-sm font-bold text-indigo-600">₹{(fee.amount + (fee.lateFee || 0)).toLocaleString()}</span>
                                  </div>
                               </div>
                               
                               <div className="space-y-2">
                                 {breakdownItems.map(([label, val], idx) => (
                                   <div key={idx} className="flex justify-between items-center text-[10px] font-bold group/item">
                                     <span className="text-slate-400 uppercase tracking-widest">{label}</span>
                                     <div className="flex items-center gap-2">
                                        <span className="text-slate-600">₹{Number(val).toLocaleString()}</span>
                                        <Button 
                                          variant="ghost" 
                                          className="h-5 px-1.5 text-[8px] bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold rounded"
                                          onClick={() => handlePayment({
                                            ...fee,
                                            amount: Number(val),
                                            feeType: `${label} (Part of ${fee.feeType})`,
                                            breakdown: JSON.stringify({ [label]: val })
                                          })}
                                        >
                                          Pay Only This
                                        </Button>
                                     </div>
                                   </div>
                                 ))}
                                 {fee.lateFee > 0 && (
                                   <div className="flex justify-between items-center text-[10px] font-bold text-rose-500">
                                     <span className="uppercase tracking-widest">LATE FEE PENALTY</span>
                                     <span>₹{fee.lateFee.toLocaleString()}</span>
                                   </div>
                                 )}
                               </div>

                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                 <div 
                                   className="h-full bg-indigo-600 rounded-full" 
                                   style={{ width: '100%' }} 
                                 />
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handlePayment(fee)}
                                className="w-full h-8 rounded-xl bg-slate-900 text-white font-bold text-[10px] hover:bg-indigo-600 transition-all mt-2"
                              >
                                Pay Full Balance
                              </Button>
                           </div>
                         );
                      })}
                     {pendingFeeRecords.length === 0 && (
                        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                              {yearlyRemaining > 0 ? `Remaining Annual Balance: ₹${yearlyRemaining.toLocaleString()}` : 'All Dues Paid'}
                           </p>
                        </div>
                     )}
                  </div>
               </div>
               <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                     <Receipt className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-800 leading-tight uppercase tracking-wider">
                     All payments are GST compliant and tax-deductible under 80G.
                  </p>
               </div>
            </Card>

             {/* Installment Boxes Card */}
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-8">
                   <h4 className="text-xl font-display font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                         <IndianRupee className="w-5 h-5" />
                      </div>
                      Payment Installments
                   </h4>
                   <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-bold border-indigo-100 text-indigo-600">
                      {installments.filter(i => i.status === 'paid').length} / {installments.length} Settled
                   </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {installments.map((inst, i) => {
                      const isOverdue = new Date(inst.dueDate) < new Date() && inst.status !== 'paid';
                      return (
                        <div key={i} className={`relative p-6 rounded-[2rem] border transition-all duration-300 group ${
                          inst.status === 'paid' ? 'bg-emerald-50/30 border-emerald-100' : 
                          isOverdue ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50/50 border-slate-100 hover:border-indigo-200 hover:shadow-lg'
                        }`}>
                           <div className="flex justify-between items-start mb-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                inst.status === 'paid' ? 'bg-emerald-500 text-white' : 
                                isOverdue ? 'bg-rose-500 text-white' : 'bg-white text-slate-400 border border-slate-100'
                              }`}>
                                 {i + 1}
                              </div>
                              <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-none ${
                                inst.status === 'paid' ? 'bg-emerald-500 text-white' : 
                                inst.status === 'pending_verification' ? 'bg-amber-500 text-white' :
                                isOverdue ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white'
                              }`}>
                                 {inst.status === 'pending_verification' ? 'Verification' : inst.status}
                              </Badge>
                           </div>
                           
                           <div className="space-y-1 mb-6">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount Due</div>
                              <div className={`text-2xl font-display font-bold ${inst.status === 'paid' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                 ₹{inst.amount.toLocaleString()}
                              </div>
                           </div>

                           <div className="flex items-center gap-2 mb-6">
                              <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`} />
                              <span className={`text-[10px] font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                                 Due: {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                           </div>

                           {inst.status === 'pending' || (inst.status === 'overdue' || !inst.status) ? (
                              <Button 
                                 onClick={() => {
                                    setSelectedInstallment(inst);
                                    setIsPaymentModeDialogOpen(true);
                                 }}
                                 className="w-full rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold h-10 text-xs transition-all shadow-lg shadow-slate-200 group-hover:scale-[1.02]"
                              >
                                 Pay Now
                              </Button>
                           ) : inst.status === 'paid' ? (
                              <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs py-2">
                                 <CheckCircle2 className="w-4 h-4" /> Paid
                              </div>
                           ) : (
                              <div className="flex items-center justify-center gap-2 text-amber-600 font-bold text-xs py-2 bg-amber-50 rounded-xl">
                                 <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                              </div>
                           )}
                        </div>
                      );
                   })}
                </div>

                {installments.length === 0 && (
                   <div className="py-20 text-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                         <AlertCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No installment plan assigned.</p>
                   </div>
                )}
             </Card>

            {/* Side Card for Quick Info */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-50 border-2 border-white p-10 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  Payment Insights
                </h4>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/60 border border-white">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Transaction</div>
                    <div className="text-sm font-bold text-slate-900">
                      {transactions.length > 0 ? `₹${transactions[0].amount.toLocaleString()}` : 'No history yet'}
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/60 border border-white">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Discounts</div>
                    <div className="text-sm font-bold text-emerald-600">None Applied</div>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSupportDialogOpen(true)}
                  className="w-full rounded-xl border-indigo-200 text-indigo-600 font-bold group"
                >
                  Contact Accounts Office <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Payment History Section */}
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
               <CardTitle className="text-2xl font-display font-bold flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                     <Clock className="w-6 h-6" />
                  </div>
                  Payment History
               </CardTitle>
               <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <ShieldCheck className="w-4 h-4" /> 256-bit Encrypted History
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto px-10 pb-10">
                  <table className="w-full text-sm">
                     <thead>
                        <tr className="text-left bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                           <th className="px-6 py-5 rounded-l-2xl">Transaction Details</th>
                            <th className="px-6 py-5">Category</th>
                            <th className="px-6 py-5 text-center">Status</th>
                            <th className="px-6 py-5 text-right">Amount</th>
                            <th className="px-6 py-5 rounded-r-2xl text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {transactions.map((tx) => (
                            <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                               <td className="px-6 py-8">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                                        <Receipt className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <div className="font-bold text-slate-900">{tx.invoiceNumber || `INV-${tx.id.slice(0,8).toUpperCase()}`}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(tx.createdAt).toLocaleString()}</div>
                                        {tx.breakdown && (
                                           <div className="mt-2 flex flex-wrap gap-2">
                                              {Object.entries(JSON.parse(tx.breakdown)).map(([k, v]: any) => (
                                                 Number(v) > 0 && (
                                                    <Badge key={k} variant="outline" className="text-[8px] py-0 h-4 border-slate-100 text-slate-400">
                                                       {k}: ₹{v}
                                                    </Badge>
                                                 )
                                              ))}
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-8">
                                  <Badge className="bg-slate-100 text-slate-600 border-none font-bold uppercase text-[9px] tracking-widest px-3 py-1">
                                     {tx.category || 'General'}
                                  </Badge>
                               </td>
                               <td className="px-6 py-8 text-center">
                                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold">
                                     <CheckCircle2 className="w-4 h-4" /> Success
                                  </div>
                               </td>
                               <td className="px-6 py-8 text-right font-display font-bold text-slate-900 text-lg">
                                  ₹{tx.amount.toLocaleString()}
                               </td>
                               <td className="px-6 py-8 text-right">
                                  <Button 
                                     onClick={() => downloadReceipt(tx.id)}
                                     variant="outline" 
                                     size="sm" 
                                     className="rounded-xl border-slate-200 hover:border-indigo-600 hover:text-indigo-600 font-bold gap-2"
                                  >
                                     <Download className="w-4 h-4" /> Receipt
                                  </Button>
                               </td>
                            </tr>
                         ))}
                         {transactions.length === 0 && (
                            <tr>
                               <td colSpan={5} className="py-20 text-center">
                                  <div className="opacity-10 grayscale mb-4">
                                     <Receipt className="w-16 h-16 mx-auto" />
                                  </div>
                                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No transaction records found</p>
                               </td>
                            </tr>
                         )}
                      </tbody>
                  </table>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structure Tab Content */}
        <TabsContent value="structure" className="outline-none">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                 <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
                          <ShieldCheck className="w-8 h-8 text-indigo-400" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-display font-bold">Standard Billing</h3>
                          <p className="text-slate-400 text-xs font-medium">Grade {studentProfile?.grade} Fee Composition</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       {feeStructure ? (
                          <>
                             {[
                               { label: 'Academic Tuition', val: feeStructure.tuitionFees, icon: '🎓' },
                               { label: 'Transport Service', val: feeStructure.transportFees, icon: '🚌' },
                               { label: 'Resource & Library', val: feeStructure.libraryFees, icon: '📚' },
                               { label: 'Examination & Assessment', val: feeStructure.examFees, icon: '📝' },
                               { label: 'Extracurricular Activities', val: feeStructure.activityFees, icon: '🎨' },
                             ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                                   <div className="flex items-center gap-3">
                                      <span className="text-xl">{item.icon}</span>
                                      <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">{item.label}</span>
                                   </div>
                                   <span className="text-xl font-display font-bold">₹{item.val?.toLocaleString() || 0}</span>
                                </div>
                             ))}
                             
                             <div className="pt-8 mt-4 border-t border-white/10 flex justify-between items-center">
                                <div>
                                   <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Net Payable</div>
                                   <div className="text-sm text-slate-500 font-medium italic">Exclusive of late fees</div>
                                </div>
                                <div className="text-right">
                                   <div className="text-4xl font-display font-bold text-white">₹{feeStructure.amount?.toLocaleString()}</div>
                                   <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Per Academic Session</div>
                                </div>
                             </div>
                          </>
                       ) : (
                          <div className="py-20 text-center">
                             <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                             <p className="text-slate-500 font-bold uppercase tracking-widest">Structure details unavailable.</p>
                          </div>
                       )}
                    </div>
                 </div>
              </Card>

              <div className="space-y-8">
                 <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10">
                    <h4 className="text-xl font-display font-bold text-slate-900 mb-6 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5" />
                       </div>
                       Policy Guidelines
                    </h4>
                    <div className="space-y-4">
                       <div className="flex gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                          <p className="text-sm text-slate-600 leading-relaxed">Fees are payable in quarterly installments by the 10th of the starting month.</p>
                       </div>
                       <div className="flex gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                          <p className="text-sm text-slate-600 leading-relaxed">A grace period of 5 days is allowed, after which a late fee of ₹50/day applies.</p>
                       </div>
                       <div className="flex gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                          <p className="text-sm text-slate-600 leading-relaxed">All digital payments attract a small convenience fee levied by the gateway.</p>
                       </div>
                    </div>
                 </Card>

                 <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-900 text-white p-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl" />
                    <h4 className="text-lg font-display font-bold mb-2">Need Financial Assistance?</h4>
                    <p className="text-emerald-100/60 text-sm mb-6 leading-relaxed">
                       If you are facing difficulties with payments, please contact the administrative office for installment plans.
                    </p>
                    <Button className="w-full h-12 rounded-xl bg-white text-emerald-900 font-bold hover:bg-emerald-50">
                       Contact School Office
                    </Button>
                 </Card>
              </div>
           </div>
        </TabsContent>
      </Tabs>

      {/* Advance Payment Dialog */}
      <Dialog open={isAdvanceDialogOpen} onOpenChange={setIsAdvanceDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
           <div className="h-32 bg-indigo-600 p-8 flex flex-col justify-center">
              <DialogTitle className="text-2xl font-display font-bold text-white">Custom Payment</DialogTitle>
              <DialogDescription className="text-indigo-100 font-medium mt-1">Pay for library, activities, or advance fees.</DialogDescription>
           </div>
           <div className="p-8 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Fee Category</label>
                 <select 
                    className="w-full h-14 rounded-2xl border-slate-100 bg-slate-50 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={advanceData.installmentId ? `inst_${advanceData.installmentId}` : advanceData.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('inst_')) {
                        const id = val.replace('inst_', '');
                        const inst = installments.find(i => i.id === id);
                        if (inst) {
                          setAdvanceData({
                            ...advanceData,
                            type: `Installment ${inst.installmentNumber}`,
                            amount: inst.amount.toString(),
                            installmentId: id
                          });
                        }
                      } else {
                        setAdvanceData({...advanceData, type: val, installmentId: ''});
                      }
                    }}
                 >
                    <optgroup label="Standard Categories">
                      <option value="Activity Fee">Activity Fee</option>
                      <option value="Library Fee">Library Fee</option>
                      <option value="Transport Fee">Transport Fee</option>
                      <option value="Exam Fee">Exam Fee</option>
                      <option value="Advance Tuition">Advance Tuition</option>
                      <option value="Others">Others</option>
                    </optgroup>
                    {installments.filter(i => i.status !== 'paid').length > 0 && (
                      <optgroup label="Pending Installments">
                        {installments.filter(i => i.status !== 'paid').map(inst => (
                          <option key={inst.id} value={`inst_${inst.id}`}>
                            Installment {inst.installmentNumber} (₹{inst.amount.toLocaleString()})
                          </option>
                        ))}
                      </optgroup>
                    )}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Amount (INR)</label>
                 <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input 
                      type="number" 
                      placeholder="Enter amount" 
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50 text-lg font-bold focus:bg-white transition-all shadow-inner"
                      value={advanceData.amount}
                      onChange={(e) => setAdvanceData({...advanceData, amount: e.target.value})}
                    />
                 </div>
              </div>
              <Button 
                onClick={() => {
                  if (!advanceData.amount || parseInt(advanceData.amount) <= 0) {
                    toast.error('Please enter a valid amount');
                    return;
                  }
                  handlePayment({
                    id: advanceData.installmentId || `custom_${Date.now()}`,
                    feeType: advanceData.type,
                    amount: parseInt(advanceData.amount),
                    lateFee: 0,
                    paidAmount: 0
                  }, 'online', advanceData.installmentId || undefined);
                  setIsAdvanceDialogOpen(false);
                }}
                disabled={paying}
                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white font-bold text-lg shadow-xl shadow-indigo-100 mt-4 transition-all"
              >
                {paying ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CreditCard className="w-5 h-5 mr-2" />}
                Process Payment
              </Button>
           </div>
        </DialogContent>
       </Dialog>
       
       {/* Support Ticket Dialog */}
       <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
         <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden">
            <div className="h-32 bg-slate-900 p-8 flex flex-col justify-center">
               <DialogTitle className="text-2xl font-display font-bold text-white flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-indigo-400" /> Support Ticket
               </DialogTitle>
               <DialogDescription className="text-slate-400 font-medium mt-1">Submit your fee-related queries to the Accounts Office.</DialogDescription>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Issue Category</label>
                  <select 
                     className="w-full h-14 rounded-2xl border-slate-100 bg-slate-50 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                     value={supportData.category}
                     onChange={(e) => setSupportData({...supportData, category: e.target.value})}
                  >
                     <option value="fee_issue">Fee Payment Issue</option>
                     <option value="scholarship">Scholarship Query</option>
                     <option value="technical">Technical Glitch</option>
                     <option value="complaint">Complaint</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Subject</label>
                  <Input 
                    placeholder="Brief summary of issue" 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50 text-sm font-bold focus:bg-white transition-all shadow-inner"
                    value={supportData.subject}
                    onChange={(e) => setSupportData({...supportData, subject: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Message / Detail</label>
                  <textarea 
                    placeholder="Describe your issue in detail..." 
                    className="w-full min-h-[120px] p-4 rounded-2xl border-slate-100 bg-slate-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner resize-none"
                    value={supportData.message}
                    onChange={(e) => setSupportData({...supportData, message: e.target.value})}
                  />
               </div>
               <Button 
                 onClick={handleCreateTicket}
                 disabled={submittingTicket}
                 className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-slate-900 text-white font-bold text-lg shadow-xl shadow-indigo-100 mt-4 transition-all gap-3"
               >
                 {submittingTicket ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                 Submit Request
               </Button>
            </div>
         </DialogContent>
       </Dialog>

       {/* Payment Mode Selection Dialog */}
       <Dialog open={isPaymentModeDialogOpen} onOpenChange={setIsPaymentModeDialogOpen}>
         <DialogContent className="sm:max-w-[400px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden text-left">
            <div className="h-32 bg-indigo-600 p-8 flex flex-col justify-center">
               <DialogTitle className="text-2xl font-display font-bold text-white">Select Payment Mode</DialogTitle>
               <DialogDescription className="text-indigo-100 font-medium mt-1">Choose how you want to pay installment #{selectedInstallment?.installmentNumber}.</DialogDescription>
            </div>
            <div className="p-8 space-y-4">
               <div 
                  onClick={() => setPaymentMode('online')}
                  className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-4 ${paymentMode === 'online' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}
               >
                  <div className={`p-3 rounded-xl ${paymentMode === 'online' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                     <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                     <div className="font-bold text-slate-900">Online Payment</div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase">Cards, UPI, Netbanking</div>
                  </div>
               </div>

               <div 
                  onClick={() => setPaymentMode('cash')}
                  className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-4 ${paymentMode === 'cash' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}
               >
                  <div className={`p-3 rounded-xl ${paymentMode === 'cash' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                     <IndianRupee className="w-6 h-6" />
                  </div>
                  <div>
                     <div className="font-bold text-slate-900">Cash Payment</div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase">Requires School Verification</div>
                  </div>
               </div>

               <Button 
                  onClick={() => handlePayment(selectedInstallment, paymentMode, selectedInstallment.id)}
                  disabled={paying}
                  className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg mt-4"
               >
                  {paying ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                  {paymentMode === 'online' ? 'Proceed to Gateway' : 'Submit for Verification'}
               </Button>
            </div>
         </DialogContent>
       </Dialog>
    </div>
  );
};

export default StudentFees;
