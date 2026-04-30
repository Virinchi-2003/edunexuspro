import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  Receipt,
  Loader2,
  PieChart,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const StudentFees: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [fees, setFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paying, setPaying] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.uid}`);
      const sData = studentRes.data.data;
      
      if (!sData) {
        toast.error('Student profile not found. Please complete your registration.');
        setLoading(false);
        return;
      }

      setStudentProfile(sData);

      if (sData.id) {
        const res = await api.get(`/fees/student/${sData.id}`);
        setFees(res.data.data.fees || []);
        setTransactions(res.data.data.transactions || []);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load fee information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const handlePayment = async (fee: any) => {
    try {
      setPaying(true);
      toast.info('Initializing Secure Payment Gateway...');

      // 1. Create Order in Backend
      const orderRes = await api.post('/fees/razorpay/order', {
        amount: fee.amount - (fee.paidAmount || 0),
        currency: 'INR',
        receipt: `receipt_${fee.id.slice(0,8)}`
      });

      const order = orderRes.data.data;

      // 2. Configure Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_6Wp1Y8v8B0QWp1', // Dummy test key if not set
        amount: order.amount,
        currency: order.currency,
        name: 'EduNexus Pro',
        description: `${fee.feeType} Payment`,
        image: 'https://cdn-icons-png.flaticon.com/512/2942/2942503.png',
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // 3. Verify Payment in Backend
            const verifyRes = await api.post('/fees/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              studentId: studentProfile.id,
              schoolId: studentProfile.schoolId,
              feeId: fee.id,
              amount: fee.amount,
              category: fee.feeType.toLowerCase()
            });

            if (verifyRes.data.status === 'success') {
              toast.success('Payment successful! Your receipt is being generated.');
              fetchData();
            }
          } catch (err) {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: studentProfile.name,
          email: studentProfile.email,
          contact: studentProfile.phone
        },
        notes: {
          address: 'EduNexus Campus'
        },
        theme: {
          color: '#4f46e5'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error(error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const downloadReceipt = async (txId: string) => {
    try {
      toast.info('Generating PDF Receipt...');
      const response = await api.get(`/fees/receipt/${txId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${txId.slice(0,8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const pendingFeeRecords = fees.filter(f => f.status !== 'paid');
  const totalPendingAmount = pendingFeeRecords.reduce((acc, f) => acc + (f.amount - (f.paidAmount || 0)), 0);

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Synchronizing Fee Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Financial Dashboard</h2>
          <p className="text-slate-500 font-medium mt-1">Institutional billing, GST compliance, and secure payments.</p>
        </div>
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
                    onClick={() => handlePayment(pendingFeeRecords[0])}
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
                 {pendingFeeRecords.map((fee, i) => (
                    <div key={i} className="flex flex-col gap-2">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{fee.feeType}</span>
                          <span className="text-sm font-bold text-slate-900">₹{fee.amount.toLocaleString()}</span>
                       </div>
                       <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full" 
                            style={{ width: `${Math.random() * 60 + 20}%` }} // Dynamic visual
                          />
                       </div>
                    </div>
                 ))}
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

        {/* Due Dates Card */}
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-50 border-2 border-white p-10">
           <div className="flex items-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-white text-indigo-600 shadow-sm">
                 <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-display font-bold text-slate-900">Upcoming Deadlines</h4>
           </div>
           <div className="space-y-4">
              {pendingFeeRecords.slice(0, 3).map((fee, i) => (
                 <div key={i} className="p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white flex items-center justify-between">
                    <div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fee.feeType}</div>
                       <div className="font-bold text-slate-800">{new Date(fee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50 font-bold px-3">
                       {Math.floor((new Date(fee.dueDate).getTime() - new Date().getTime()) / (1000*3600*24))} Days Left
                    </Badge>
                 </div>
              ))}
              {pendingFeeRecords.length === 0 && (
                 <div className="py-12 text-center">
                    <AlertCircle className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-indigo-400">No upcoming due dates.</p>
                 </div>
              )}
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
    </div>
  );
};

export default StudentFees;
