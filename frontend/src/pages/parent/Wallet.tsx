import React, { useState, useEffect } from 'react';
import EliteGating from '@/components/EliteGating';
import { 
  Shield, 
  CreditCard, 
  History, 
  Settings2,
  Lock,
  Unlock,
  PlusCircle,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const ParentWallet: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [topupAmount, setTopupAmount] = useState('500');
  const [dailyLimit, setDailyLimit] = useState(500);

  const fetchData = async () => {
    try {
      setLoading(true);
      // For demo/dev purposes, we use a fixed student ID if one isn't found in user metadata
      // In production, parents would select from their list of children
      const studentId = user?.studentId || "fb3340cc-63f0-4812-b747-3c0c11f84871"; 
      const walletRes = await api.get(`/wallet/${studentId}`);
      setWallet(walletRes.data.data);
      setDailyLimit(walletRes.data.data.limits?.dailyLimit || 500);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTopup = async () => {
    try {
      await api.post('/wallet/topup', {
        studentId: wallet.studentId,
        amount: Number(topupAmount),
        transactionId: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        parentId: user.uid
      });
      toast.success(`₹${topupAmount} added successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Top-up failed');
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      const status = checked ? 'active' : 'blocked';
      await api.post('/wallet/toggle-status', {
        studentId: wallet.studentId,
        status
      });
      toast.success(`Wallet ${status} successfully`);
      setWallet({ ...wallet, status });
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleLimitUpdate = async () => {
    try {
      await api.post('/wallet/set-limits', {
        studentId: wallet.studentId,
        dailyLimit,
        weeklyLimit: dailyLimit * 5
      });
      toast.success('Spending limits updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update limits');
    }
  };

  if (loading && !wallet) {
    return <div className="flex items-center justify-center min-h-[400px]"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <EliteGating>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Student Wallet Control</h2>
          <p className="text-slate-500 font-medium mt-1">Manage balance and security for your child's campus wallet.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top-up Section */}
          <Card className="lg:col-span-2 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden border border-slate-100">
            <CardHeader className="p-10 pb-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                     <PlusCircle className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl font-display font-bold">Quick Top-up</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-10 space-y-8">
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['100', '500', '1000', '2000'].map((amt) => (
                    <Button 
                      key={amt}
                      variant={topupAmount === amt ? 'default' : 'outline'}
                      className={`h-16 rounded-2xl text-lg font-bold border-2 transition-all ${topupAmount === amt ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50'}`}
                      onClick={() => setTopupAmount(amt)}
                    >
                      ₹{amt}
                    </Button>
                  ))}
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₹</span>
                     <Input 
                       type="number" 
                       value={topupAmount} 
                       onChange={(e) => setTopupAmount(e.target.value)}
                       className="pl-12 h-16 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 text-xl font-bold transition-all"
                       placeholder="Enter amount"
                     />
                  </div>
                  <Button 
                    onClick={handleTopup}
                    disabled={!topupAmount || Number(topupAmount) < 100}
                    className="h-16 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95"
                  >
                    Add Money
                  </Button>
               </div>
            </CardContent>
          </Card>

          {/* Wallet Summary */}
          <Card className="border-none shadow-xl rounded-[3rem] bg-slate-50 p-8 flex flex-col justify-between border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 opacity-50" />
             <div className="relative z-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Current Balance</p>
                <h3 className="text-5xl font-display font-bold text-slate-900 tracking-tighter">₹{wallet?.balance?.toLocaleString('en-IN') || '0.00'}</h3>
             </div>
             
             <div className="space-y-4 mt-8 relative z-10">
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/50 shadow-sm">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${wallet?.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         {wallet?.status === 'active' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-slate-700">Wallet Status</span>
                   </div>
                   <Switch 
                     checked={wallet?.status === 'active'} 
                     onCheckedChange={handleToggle}
                     className="data-[state=checked]:bg-emerald-500"
                   />
                </div>
                <p className="text-xs text-slate-400 font-medium text-center px-4 leading-relaxed">
                  {wallet?.status === 'active' ? 'Student can use the wallet for campus purchases.' : 'Wallet is currently blocked. No transactions allowed.'}
                </p>
             </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Limits Section */}
          <Card className="border-none shadow-xl rounded-[3rem] bg-white p-10 border border-slate-100">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600">
                   <Shield className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-display font-bold text-slate-900">Spending Limits</h4>
             </div>
             
             <div className="space-y-12">
                <div className="space-y-6">
                   <div className="flex justify-between items-end">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Daily Limit</p>
                      <span className="text-3xl font-display font-bold text-indigo-600 tabular-nums">₹{dailyLimit}</span>
                   </div>
                   <Slider 
                     value={[dailyLimit]} 
                     min={100} 
                     max={5000} 
                     step={100}
                     onValueChange={(vals) => setDailyLimit(vals[0])}
                     className="py-4"
                   />
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <TrendingDown className="w-4 h-4 text-indigo-600" />
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weekly Max</p>
                      </div>
                      <p className="text-3xl font-display font-bold text-slate-400 tabular-nums">₹{dailyLimit * 5}</p>
                   </div>
                   <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-300">
                      <TrendingDown className="w-6 h-6" />
                   </div>
                </div>

                <Button 
                  onClick={handleLimitUpdate}
                  className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-indigo-600 text-white font-bold transition-all shadow-xl shadow-slate-100 active:scale-95"
                >
                  Save Limit Settings
                </Button>
             </div>
          </Card>

          {/* Tips/Info Card */}
          <Card className="lg:col-span-2 border-none shadow-xl rounded-[3rem] bg-indigo-600 text-white p-12 relative overflow-hidden group">
             <CreditCard className="absolute top-10 right-10 w-64 h-64 opacity-10 rotate-12 transition-transform group-hover:scale-110 duration-700" />
             <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="max-w-md">
                   <h4 className="text-4xl font-display font-bold mb-6 leading-tight tracking-tight">Peace of Mind for Parents</h4>
                   <p className="text-indigo-100 text-xl font-medium leading-relaxed opacity-90">
                     Control your child's daily expenses while ensuring they always have digital cash for school necessities. No more loose change, just smart spending.
                   </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-16">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shadow-lg">
                         <History className="w-7 h-7" />
                      </div>
                      <div>
                         <p className="font-bold text-lg">Real-time History</p>
                         <p className="text-sm text-indigo-200">Track every penny spent instantly.</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shadow-lg">
                         <Settings2 className="w-7 h-7" />
                      </div>
                      <div>
                         <p className="font-bold text-lg text-white">Instant Toggle</p>
                         <p className="text-sm text-indigo-200">Block wallet immediately if lost.</p>
                      </div>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </EliteGating>
  );
};

export default ParentWallet;
