import React, { useState } from 'react';
import EliteGating from '@/components/EliteGating';
import { 
  Scan, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { toast } from 'sonner';

const VendorScanner: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [wallet, setWallet] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [category, setCategory] = useState('canteen');

  const handleScan = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!studentId) return;
    
    try {
      setProcessing(true);
      const res = await api.get(`/wallet/${studentId}`);
      setWallet(res.data.data);
      toast.success('Wallet verified');
    } catch (error) {
      toast.error('Student wallet not found or unauthorized');
      setWallet(null);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!wallet || !amount) return;
    
    try {
      setProcessing(true);
      await api.post('/wallet/pay', {
        studentId: wallet.studentId,
        amount: Number(amount),
        vendor: 'Main Campus Canteen',
        category,
        description: `Purchase at ${category}`
      });
      toast.success('Transaction Successful');
      setWallet(null);
      setStudentId('');
      setAmount('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <EliteGating>
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <div className="text-center space-y-4">
           <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 mb-4 transition-transform hover:scale-105 duration-300">
              <Scan className="w-12 h-12" />
           </div>
           <h2 className="text-5xl font-display font-bold text-slate-900 tracking-tight">Campus Merchant</h2>
           <p className="text-slate-500 font-medium text-lg">Scan student QR code or enter ID to process a cashless payment.</p>
        </div>

        {!wallet ? (
          <Card className="border-none shadow-2xl rounded-[4rem] bg-white p-12 overflow-hidden relative border border-slate-100">
             <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -mr-40 -mt-40 -z-0 opacity-50" />
             <form onSubmit={handleScan} className="relative z-10 space-y-10 text-center max-w-md mx-auto">
                <div className="space-y-6">
                   <div className="relative group">
                      <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 transition-colors group-focus-within:text-indigo-600" />
                      <Input 
                        placeholder="Scan QR or Enter Student ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="h-24 pl-16 pr-8 rounded-[2.5rem] border-2 border-slate-100 focus:border-indigo-600 text-xl font-bold transition-all shadow-inner bg-slate-50/30"
                      />
                   </div>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Sample ID: fb3340cc-63f0-4812-b747-3c0c11f84871</p>
                </div>
                <Button 
                  type="submit"
                  disabled={!studentId || processing}
                  className="w-full h-20 rounded-[2rem] bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xl shadow-2xl shadow-slate-200 transition-all active:scale-95 gap-4"
                >
                  <Scan className="w-6 h-6" /> {processing ? 'Authenticating...' : 'Validate Student'}
                </Button>
             </form>
          </Card>
        ) : (
          <div className="space-y-10 animate-in zoom-in-95 duration-500">
             <Card className="border-none shadow-2xl rounded-[4rem] bg-emerald-500 text-white p-12 overflow-hidden relative transition-all">
                <div className="absolute top-0 right-0 p-12">
                   <CheckCircle2 className="w-24 h-24 opacity-15" />
                </div>
                <div className="relative z-10">
                   <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-2 opacity-70">Student Verified Successfully</p>
                   <h3 className="text-5xl font-display font-bold tracking-tight">Arjun Sharma</h3>
                   <div className="flex gap-12 mt-10">
                      <div className="bg-white/10 rounded-3xl p-6 px-8 backdrop-blur-md border border-white/10">
                         <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Available Balance</p>
                         <p className="text-4xl font-display font-bold tabular-nums">₹{wallet.balance}</p>
                      </div>
                      <div className="bg-white/10 rounded-3xl p-6 px-8 backdrop-blur-md border border-white/10">
                         <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Daily Cap</p>
                         <p className="text-4xl font-display font-bold tabular-nums">₹{wallet.limits?.dailyLimit || 500}</p>
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="border-none shadow-2xl rounded-[4rem] bg-white p-12 border border-slate-100">
                <div className="space-y-10">
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['canteen', 'stationery', 'library', 'others'].map((cat) => (
                        <Button
                          key={cat}
                          variant={category === cat ? 'default' : 'outline'}
                          className={`h-16 rounded-[1.5rem] font-bold capitalize border-2 transition-all ${category === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'border-slate-50 hover:bg-slate-50'}`}
                          onClick={() => setCategory(cat)}
                        >
                           {cat}
                        </Button>
                      ))}
                   </div>

                   <div className="relative group">
                      <span className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-4xl group-focus-within:text-indigo-600 transition-colors">₹</span>
                      <Input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-32 pl-16 pr-8 rounded-[3rem] border-2 border-slate-50 focus:border-indigo-600 text-6xl font-display font-bold transition-all shadow-inner bg-slate-50/50 text-slate-900"
                      />
                   </div>

                   <div className="flex gap-6">
                      <Button 
                        variant="outline" 
                        className="h-20 flex-1 rounded-[2rem] border-2 border-slate-100 font-bold text-slate-500 text-lg hover:bg-slate-50"
                        onClick={() => setWallet(null)}
                      >
                        Discard
                      </Button>
                      <Button 
                        disabled={!amount || processing}
                        className="h-20 flex-[2.5] rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-2xl shadow-2xl shadow-indigo-200 transition-all active:scale-95 gap-4"
                        onClick={handlePayment}
                      >
                        <Zap className="w-8 h-8 fill-white" /> {processing ? 'Finalizing...' : 'Confirm Payment'}
                      </Button>
                   </div>
                </div>
             </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <Card className="border-none shadow-xl rounded-[3rem] bg-white p-8 border border-slate-50 flex items-center gap-6 transition-all hover:translate-y-[-4px]">
              <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                 <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Today's Sales</p>
                 <p className="text-3xl font-display font-bold text-slate-900 tabular-nums">₹8,450</p>
              </div>
           </Card>
           <Card className="border-none shadow-xl rounded-[3rem] bg-white p-8 border border-slate-50 flex items-center gap-6 transition-all hover:translate-y-[-4px]">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                 <CreditCard className="w-8 h-8" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Transactions</p>
                 <p className="text-3xl font-display font-bold text-slate-900 tabular-nums">142</p>
              </div>
           </Card>
           <Card className="border-none shadow-xl rounded-[3rem] bg-white p-8 border border-slate-50 flex items-center gap-6 transition-all hover:translate-y-[-4px]">
              <div className="w-16 h-16 rounded-[1.5rem] bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                 <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">Anomalies</p>
                 <p className="text-3xl font-display font-bold text-slate-900 tabular-nums">0</p>
              </div>
           </Card>
        </div>
      </div>
    </EliteGating>
  );
};

export default VendorScanner;
