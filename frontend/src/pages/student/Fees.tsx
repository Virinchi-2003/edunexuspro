import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Download, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Receipt,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const StudentFees: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.id}`);
      const sData = studentRes.data.data;

      if (sData?.id) {
        const res = await api.get(`/portal/fees/history/${sData.id}`);
        setTransactions(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const handlePayment = async () => {
    toast.info('Initializing Razorpay Secure Payment...');
    // Simulate Razorpay trigger
    setTimeout(() => {
      toast.success('Payment portal opened in secure window.');
    }, 1500);
  };

  const totalFees = 45000;
  const paidFees = transactions.filter(t => t.status === 'success').reduce((acc, t) => acc + t.amount, 0);
  const pendingFees = totalFees - paidFees;

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Fee Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Institutional Fees</h2>
          <p className="text-slate-500 font-medium mt-1">Manage your academic billing and digital receipts.</p>
        </div>
        <Button onClick={handlePayment} className="gap-3 rounded-2xl h-14 px-8 shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg group">
          <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Pay Outstanding Dues
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white p-8 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
           <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Pending Dues</p>
           <h3 className="text-5xl font-display font-bold">₹{pendingFees.toLocaleString()}</h3>
           <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                 <CheckCircle2 className="w-4 h-4" /> Secure Razorpay Billing
              </div>
              <ArrowRight className="w-5 h-5 text-slate-700" />
           </div>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
           <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Total Academic Fees</p>
           <h3 className="text-4xl font-display font-bold text-slate-900">₹{totalFees.toLocaleString()}</h3>
           <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center text-sm font-medium">
                 <span className="text-slate-500">Paid Amount</span>
                 <span className="text-emerald-600 font-bold">₹{paidFees.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(paidFees / totalFees) * 100}%` }} />
              </div>
           </div>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100 p-8">
           <ShieldCheck className="w-10 h-10 text-indigo-600 mb-6" />
           <h4 className="text-xl font-display font-bold text-indigo-900 mb-2">Automatic GST Billing</h4>
           <p className="text-sm text-indigo-600 font-medium leading-relaxed">
             All payments include GST as per institutional policy. Digital receipts are generated instantly upon confirmation.
           </p>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-xl font-display font-bold flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-primary">
                <Receipt className="w-5 h-5" />
             </div>
             Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-4">
             {transactions.length === 0 ? (
               <div className="py-20 text-center flex flex-col items-center">
                  <Clock className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-400 font-medium">No previous transactions found.</p>
               </div>
             ) : (
               transactions.map((tx) => (
                 <div key={tx.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold ${tx.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          ₹{tx.amount / 1000}k
                       </div>
                       <div>
                          <div className="font-bold text-slate-900">{tx.category} Fee</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(tx.createdAt).toLocaleDateString()} • REF: {tx.razorpayPaymentId || 'PENDING'}</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                       <Badge className={`${tx.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} border-none px-4 py-1 rounded-full font-bold uppercase text-[10px] tracking-wider`}>
                          {tx.status}
                       </Badge>
                       <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
               ))
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentFees;
