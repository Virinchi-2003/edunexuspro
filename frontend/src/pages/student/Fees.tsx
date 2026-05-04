import React, { useState, useEffect } from 'react';
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
  History
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const StudentFees = () => {
  const [fees, setFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [feeStructure, setFeeStructure] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [isAdvanceDialogOpen, setIsAdvanceDialogOpen] = useState(false);
  const [advanceData, setAdvanceData] = useState({ amount: '', type: 'Activity Fee' });

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
      const { fees: studentFees, transactions: studentTxs } = feesRes.data.data;

      setFees(studentFees || []);
      setTransactions(studentTxs || []);
      setStudentProfile(student); // Use the student record we already have

      if (student.schoolId && student.grade) {
        const structRes = await api.get(`/fee-structures/school/${student.schoolId}`);
        const structures = structRes.data.data || [];
        const myStruct = structures.find((s: any) => 
          s.grade.toLowerCase().trim() === student.grade.toLowerCase().replace(/(\d+)(st|nd|rd|th)/i, '$1').trim() ||
          s.grade.toLowerCase().trim() === student.grade.toLowerCase().trim()
        );
        setFeeStructure(myStruct);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (feeRecords: any | any[]) => {
    try {
      setPaying(true);
      const user = JSON.parse(localStorage.getItem('user')!);
      
      const records = Array.isArray(feeRecords) ? feeRecords : [feeRecords];
      const totalAmount = records.reduce((acc, f) => acc + (f.amount + (f.lateFee || 0) - (f.paidAmount || 0)), 0);
      
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
  const totalPendingAmount = pendingFeeRecords.reduce((acc, f) => acc + (f.amount + (f.lateFee || 0) - (f.paidAmount || 0)), 0);

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Pending Card */}
            <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                        <CreditCard className="w-6 h-6 text-indigo-400" />
                     </div>
                     <Badge className="bg-rose-500/20 text-rose-400 border-none px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Outstanding
                     </Badge>
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Total Payable Amount</p>
                  <h3 className="text-6xl font-display font-bold tracking-tighter">₹{totalPendingAmount.toLocaleString()}</h3>
                  
                  <div className="mt-10 pt-8 border-t border-white/5 flex flex-col gap-4">
                     <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" /> 
                        <span>128-bit SSL Secured Razorpay Gateway</span>
                     </div>
                     {pendingFeeRecords.length > 0 && (
                       <Button 
                        disabled={paying}
                        onClick={() => handlePayment(pendingFeeRecords)}
                        className="w-full h-14 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-900/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                       >
                        {paying ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CreditCard className="w-5 h-5 mr-2" />}
                        Pay Full Dues Now
                       </Button>
                     )}
                  </div>
               </div>
            </Card>

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
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All Dues Paid</p>
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
                <Button variant="outline" className="w-full rounded-xl border-indigo-200 text-indigo-600 font-bold group">
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
                    value={advanceData.type}
                    onChange={(e) => setAdvanceData({...advanceData, type: e.target.value})}
                 >
                    <option value="Activity Fee">Activity Fee</option>
                    <option value="Library Fee">Library Fee</option>
                    <option value="Transport Fee">Transport Fee</option>
                    <option value="Exam Fee">Exam Fee</option>
                    <option value="Advance Tuition">Advance Tuition</option>
                    <option value="Others">Others</option>
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
                    id: `custom_${Date.now()}`,
                    feeType: advanceData.type,
                    amount: parseInt(advanceData.amount),
                    lateFee: 0,
                    paidAmount: 0
                  });
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
    </div>
  );
};

export default StudentFees;
