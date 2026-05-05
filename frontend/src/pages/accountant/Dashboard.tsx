import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Package,
  RefreshCw,
  PieChart,
  Wallet,
  Users,
  MessageSquare,
  ShoppingBag,
  ArrowUpRight,
  ChevronRight,
  Scale
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

// Import sub-modules
import FeesManagement from './modules/Fees';
import SalaryManagement from './modules/Salaries';
import SupportManagement from './modules/Support';
import ProcurementManagement from './modules/Procurement';

import { useNavigate } from 'react-router-dom';

const AccountantDashboard: React.FC<{ defaultTab?: string }> = ({ defaultTab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTabState] = useState<'overview' | 'fees' | 'salaries' | 'support' | 'procurement'>((defaultTab as any) || 'overview');

  const handleTabChange = (tab: 'overview' | 'fees' | 'salaries' | 'support' | 'procurement') => {
    setActiveTabState(tab);
    if (tab === 'overview') {
      navigate('/accountant');
    } else {
      navigate(`/accountant/${tab}`);
    }
  };
  const [stats, setStats] = useState({
    fees: { total: 0, collected: 0, pending: 0 },
    salaries: { monthlyTotal: 0 },
    pendingRequisitions: 0,
    openTickets: 0
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/accountant/stats/${user.schoolId}`);
      setStats(res.data.data);
    } catch (error) {
      toast.error('Failed to load financial stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (defaultTab) {
      setActiveTabState(defaultTab as any);
    } else {
      setActiveTabState('overview');
    }
  }, [defaultTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'fees': return <FeesManagement />;
      case 'salaries': return <SalaryManagement />;
      case 'support': return <SupportManagement />;
      case 'procurement': return <ProcurementManagement />;
      default: return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white p-8 group hover:scale-[1.02] transition-all cursor-pointer" onClick={() => handleTabChange('fees')}>
           <DollarSign className="w-8 h-8 mb-4 text-indigo-200" />
           <p className="text-xs font-bold uppercase tracking-widest text-indigo-100/70">Fee Collection</p>
           <h3 className="text-3xl font-display font-bold mt-1">₹{(stats.fees.collected / 100000).toFixed(1)}L</h3>
           <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-indigo-200">
              <TrendingUp className="w-3 h-3" /> Collected of ₹{(stats.fees.total / 100000).toFixed(1)}L
           </div>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-violet-600 text-white p-8 group hover:scale-[1.02] transition-all cursor-pointer" onClick={() => handleTabChange('salaries')}>
           <Users className="w-8 h-8 mb-4 text-violet-200" />
           <p className="text-xs font-bold uppercase tracking-widest text-violet-100/70">Monthly Payroll</p>
           <h3 className="text-3xl font-display font-bold mt-1">₹{(stats.salaries.monthlyTotal / 100000).toFixed(1)}L</h3>
           <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-violet-200">
              Institutional staff liability
           </div>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-500 text-white p-8 group hover:scale-[1.02] transition-all cursor-pointer" onClick={() => handleTabChange('procurement')}>
           <Package className="w-8 h-8 mb-4 text-emerald-200" />
           <p className="text-xs font-bold uppercase tracking-widest text-emerald-100/70">Requirements</p>
           <h3 className="text-3xl font-display font-bold mt-1">{stats.pendingRequisitions}</h3>
           <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-200">
              Pending procurement requests
           </div>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-amber-500 text-white p-8 group hover:scale-[1.02] transition-all cursor-pointer" onClick={() => handleTabChange('support')}>
           <MessageSquare className="w-8 h-8 mb-4 text-amber-200" />
           <p className="text-xs font-bold uppercase tracking-widest text-amber-100/70">Student Support</p>
           <h3 className="text-3xl font-display font-bold mt-1">{stats.openTickets}</h3>
           <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-amber-200">
              Active queries/complaints
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
             <div>
                <CardTitle className="text-2xl font-display font-bold">Financial Health</CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">Real-time sync with Principal's financial portal.</CardDescription>
             </div>
             <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Scale className="w-8 h-8" />
             </div>
          </CardHeader>
          <CardContent className="p-10">
             <div className="space-y-10">
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <div>
                         <h5 className="font-bold text-slate-900">Fee Collection Progress</h5>
                         <p className="text-xs text-slate-400 font-medium mt-1">Target: ₹{stats.fees.total.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                         <span className="text-2xl font-black text-indigo-600">{stats.fees.total > 0 ? ((stats.fees.collected / stats.fees.total) * 100).toFixed(1) : 0}%</span>
                      </div>
                   </div>
                   <Progress value={stats.fees.total > 0 ? (stats.fees.collected / stats.fees.total) * 100 : 0} className="h-4 bg-slate-50" indicatorClassName="bg-indigo-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                   <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Collected</p>
                      <div className="text-xl font-bold text-emerald-600">₹{stats.fees.collected.toLocaleString()}</div>
                   </div>
                   <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Pending</p>
                      <div className="text-xl font-bold text-rose-500">₹{stats.fees.pending.toLocaleString()}</div>
                   </div>
                   <div className="p-6 rounded-[2rem] bg-slate-900 text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Institutional Cost</p>
                      <div className="text-xl font-bold">₹{stats.salaries.monthlyTotal.toLocaleString()}</div>
                   </div>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[3rem] bg-white p-10 flex flex-col justify-between">
           <div>
              <h4 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <PieChart className="w-6 h-6 text-indigo-600" /> Operational Budget
              </h4>
              <div className="space-y-8">
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                       <span>Staff Salaries</span>
                       <span>₹{stats.salaries.monthlyTotal.toLocaleString()}</span>
                    </div>
                    <Progress value={85} className="h-2 bg-slate-50" indicatorClassName="bg-violet-600" />
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                       <span>Procurement (Approved)</span>
                       <span>₹45,000</span>
                    </div>
                    <Progress value={25} className="h-2 bg-slate-50" indicatorClassName="bg-indigo-600" />
                 </div>
                 <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                       <span>Infrastructure/Utility</span>
                       <span>₹1,20,000</span>
                    </div>
                    <Progress value={60} className="h-2 bg-slate-50" indicatorClassName="bg-amber-600" />
                 </div>
              </div>
           </div>
           
           <div className="pt-10">
              <Button 
                className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100 group"
                onClick={() => handleTabChange('fees')}
              >
                 Manage Collections <ArrowUpRight className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
           </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center text-emerald-600 relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-600 translate-y-20 group-hover:translate-y-0 transition-transform duration-500" />
              <Wallet className="w-10 h-10 relative z-10 group-hover:text-white transition-colors duration-500" />
           </div>
           <div>
              <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">
                 Accountant <span className="text-emerald-600">Portal</span>
              </h2>
              <div className="flex items-center gap-2 mt-1">
                 <Badge variant="outline" className="rounded-lg bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-2 py-0">SYNC ACTIVE</Badge>
                 <p className="text-slate-500 font-medium text-sm">Managing {user?.schoolName || 'Institutional'} Financials</p>
              </div>
           </div>
        </div>
        <div className="flex gap-4">
           <Button 
              variant="outline" 
              className="rounded-2xl h-14 px-8 border-slate-200 font-bold bg-white shadow-sm hover:shadow-md transition-all gap-2"
              onClick={fetchStats}
           >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Data
           </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex gap-2 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] shadow-xl border border-white/50 w-full overflow-x-auto no-scrollbar">
         {[
            { id: 'overview', icon: TrendingUp, label: 'Financial Overview' },
            { id: 'fees', icon: DollarSign, label: 'Student Fees' },
            { id: 'salaries', icon: Users, label: 'Staff Salaries' },
            { id: 'procurement', icon: ShoppingBag, label: 'Procurement' },
            { id: 'support', icon: MessageSquare, label: 'Queries' }
         ].map((tab) => (
            <Button
               key={tab.id}
               variant={activeTab === tab.id ? 'default' : 'ghost'}
               onClick={() => handleTabChange(tab.id as any)}
               className={`rounded-[1.5rem] h-14 px-8 font-bold gap-3 flex-1 min-w-[180px] transition-all duration-500 ${
                  activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]' 
                  : 'text-slate-500 hover:bg-white hover:shadow-lg'
               }`}
            >
               <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-emerald-400' : 'text-slate-400'}`} />
               {tab.label}
            </Button>
         ))}
      </div>

      <div className="mt-8">
         {renderContent()}
      </div>
    </div>
  );
};

export default AccountantDashboard;
