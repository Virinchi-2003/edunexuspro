import React, { useState, useEffect } from 'react';
import EliteGating from '@/components/EliteGating';
import { 
  Wallet, 
  ArrowUpRight, 
  RefreshCw, 
  TrendingUp, 
  ShoppingBag,
  Coffee,
  Book,
  QrCode,
  Download,
  Plus,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const StudentWallet: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [topupAmount, setTopupAmount] = useState('500');
  const [showTopup, setShowTopup] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.uid}`);
      const studentId = studentRes.data.data.id;
      
      const [walletRes, transRes] = await Promise.all([
        api.get(`/wallet/${studentId}`),
        api.get(`/wallet/transactions/${studentId}`)
      ]);
      
      setWallet(walletRes.data.data);
      setTransactions(transRes.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRazorpayTopup = async () => {
    const amount = Number(topupAmount);
    if (!amount || amount < 100) {
      return toast.error("Minimum top-up is ₹100");
    }

    try {
      const orderRes = await api.post('/wallet/razorpay/create-order', { amount });
      const order = orderRes.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_KIn9L9L9L9L9L9',
        amount: order.amount,
        currency: order.currency,
        name: "EduNexus Pro",
        description: "Campus Wallet Top-up",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await api.post('/wallet/razorpay/verify', {
              studentId: wallet.studentId,
              amount,
              ...response
            });
            toast.success(`₹${amount} added successfully!`);
            setShowTopup(false);
            fetchData();
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to initiate payment");
    }
  };

  const downloadQR = () => {
    const svg = document.querySelector(".qr-code-svg") as SVGElement;
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_${wallet?.studentId?.split('-')[0]}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
    toast.success("QR Code downloaded");
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'canteen': return <Coffee className="w-5 h-5" />;
      case 'stationery': return <Book className="w-5 h-5" />;
      case 'topup': return <ArrowUpRight className="w-5 h-5" />;
      default: return <ShoppingBag className="w-5 h-5" />;
    }
  };

  return (
    <EliteGating>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Campus Wallet</h2>
               <p className="text-slate-500 font-medium mt-1">Manage your campus expenses and digital payments.</p>
            </div>
            <div className="flex items-center gap-3">
               <Button variant="outline" onClick={fetchData} className="rounded-2xl h-12 w-12 p-0 border-slate-200">
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
               </Button>
               <Badge className={`px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-widest border-none ${
                  wallet?.status === 'active' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
               }`}>
                  {wallet?.status === 'active' ? 'Active' : 'Blocked'}
               </Badge>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Wallet Card */}
            <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative min-h-[320px] group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-3xl transition-transform group-hover:scale-110 duration-700" />
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full -ml-32 -mb-32 blur-3xl transition-transform group-hover:scale-110 duration-700" />
               
               <CardContent className="relative p-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Available Balance</p>
                        <h3 className="text-6xl font-display font-bold tabular-nums tracking-tighter">
                           ₹{wallet?.balance?.toLocaleString('en-IN') || '0.00'}
                        </h3>
                     </div>
                     <Dialog open={showTopup} onOpenChange={setShowTopup}>
                        <DialogTrigger asChild>
                           <Button className="w-16 h-16 rounded-3xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center border border-white/10 shadow-2xl transition-all hover:scale-105 active:scale-95">
                              <Plus className="w-8 h-8 text-white" />
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2.5rem] p-10 max-w-md border-none shadow-2xl">
                           <DialogHeader>
                              <DialogTitle className="text-3xl font-display font-bold mb-6">Top-up Wallet</DialogTitle>
                           </DialogHeader>
                           <div className="space-y-8">
                              <div className="grid grid-cols-3 gap-3">
                                 {['200', '500', '1000'].map(amt => (
                                   <Button 
                                     key={amt}
                                     variant={topupAmount === amt ? 'default' : 'outline'}
                                     onClick={() => setTopupAmount(amt)}
                                     className={`h-12 rounded-xl font-bold transition-all ${topupAmount === amt ? 'bg-indigo-600' : ''}`}
                                   >
                                     ₹{amt}
                                   </Button>
                                 ))}
                              </div>
                              <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                 <Input 
                                   type="number"
                                   value={topupAmount}
                                   onChange={(e) => setTopupAmount(e.target.value)}
                                   className="h-14 pl-10 rounded-xl border-2 border-slate-100 focus:border-indigo-600 font-bold text-lg"
                                 />
                              </div>
                              <Button 
                                onClick={handleRazorpayTopup}
                                className="w-full h-14 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-lg transition-all"
                              >
                                Pay with Razorpay
                              </Button>
                           </div>
                        </DialogContent>
                     </Dialog>
                  </div>

                  <div className="flex flex-wrap items-center gap-10 mt-12">
                     <div className="space-y-1">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Student ID</p>
                        <p className="font-mono font-bold text-lg">{wallet?.studentId?.split('-')[0].toUpperCase()}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Daily Limit</p>
                        <p className="font-bold text-lg text-emerald-400">₹{wallet?.limits?.dailyLimit || '500'}</p>
                     </div>
                     <div className="ml-auto">
                        <div className="flex -space-x-3">
                           <div className="w-10 h-10 rounded-full bg-indigo-500 border-2 border-slate-900 shadow-xl" />
                           <div className="w-10 h-10 rounded-full bg-violet-500 border-2 border-slate-900 shadow-xl" />
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* QR Code Card */}
            <Card className="border-none shadow-xl rounded-[3rem] bg-white p-8 flex flex-col items-center justify-center text-center">
               <div className="w-full aspect-square max-w-[200px] p-6 bg-slate-50 rounded-[2.5rem] mb-6 flex items-center justify-center border border-slate-100">
                  {wallet?.studentId ? (
                    <QRCodeSVG 
                      value={wallet.studentId} 
                      size={160} 
                      level="H" 
                      includeMargin={false}
                      className="rounded-lg qr-code-svg"
                    />
                  ) : (
                    <QrCode className="w-20 h-20 text-slate-200" />
                  )}
               </div>
               <h4 className="text-xl font-bold text-slate-900">Scan to Pay</h4>
               <p className="text-slate-400 text-sm font-medium mt-1 mb-6">Show this QR at the canteen or stationery shop</p>
               <Button 
                 onClick={downloadQR}
                 className="w-full rounded-2xl h-12 bg-slate-50 hover:bg-slate-100 text-slate-900 font-bold border-none transition-all gap-2"
               >
                  <Download className="w-4 h-4" /> Download QR
               </Button>
            </Card>
         </div>

         {/* Transactions */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
               <CardHeader className="px-8 pt-8">
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-2xl font-display font-bold text-slate-900">Recent Activity</CardTitle>
                     <Button variant="ghost" className="text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl px-4 transition-all flex items-center gap-2 group">
                        See All <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                     </Button>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                     {transactions.length === 0 ? (
                       <div className="py-20 text-center">
                          <ShoppingBag className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                          <p className="text-slate-400 font-medium">No transactions yet.</p>
                       </div>
                     ) : (
                       transactions.map((t) => (
                         <div key={t.id} className="flex items-center justify-between p-6 px-8 hover:bg-slate-50/50 transition-all group cursor-default">
                            <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                  t.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                               }`}>
                                  {getCategoryIcon(t.category)}
                               </div>
                               <div>
                                  <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors capitalize">{t.description || (t.type === 'credit' ? 'Top-up' : 'Purchase')}</h5>
                                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">{t.vendor || 'Campus Merchant'} • {new Date(t.timestamp).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className={`text-lg font-bold tabular-nums ${t.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                               {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                            </div>
                         </div>
                       ))
                     )}
                  </div>
               </CardContent>
            </Card>

            <div className="space-y-6">
               <Card className="border-none shadow-xl rounded-[3rem] bg-indigo-600 text-white p-8 overflow-hidden relative group">
                  <TrendingUp className="absolute top-4 right-4 w-32 h-32 opacity-10 -mr-8 -mt-8 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-700" />
                  <h4 className="text-xl font-bold mb-6">Spend Analysis</h4>
                  <div className="space-y-6">
                     <div>
                        <div className="flex justify-between text-sm font-bold uppercase tracking-widest mb-2 opacity-80">
                           <span>Weekly Spend</span>
                           <span>₹{transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0)} / ₹2,000</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                           <div className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: '45%' }} />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 shadow-inner">
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Avg Daily</p>
                           <p className="text-xl font-bold">₹125</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5 shadow-inner">
                           <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">This Week</p>
                           <p className="text-xl font-bold">{transactions.filter(t => t.type === 'debit').length}</p>
                        </div>
                     </div>
                  </div>
               </Card>
               
               <Card className="border-none shadow-xl rounded-[3rem] bg-white p-8 border-l-4 border-indigo-600 group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                     <h4 className="text-lg font-bold text-slate-900">Security Note</h4>
                     <Badge variant="outline" className="text-[8px] font-bold text-indigo-600 border-indigo-200">PRO</Badge>
                  </div>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed italic">
                     "Never share your wallet QR code screenshot. It's as secure as your physical wallet. Keep it private."
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-4 text-indigo-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                     View Security Guide <ArrowRight className="w-3 h-3" />
                  </Button>
               </Card>
            </div>
         </div>
      </div>
    </EliteGating>
  );
};

export default StudentWallet;
