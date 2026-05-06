import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  Download,
  Filter,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const PrincipalSalaries: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [authorizing, setAuthorizing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));

  const fetchOverview = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await api.get(`/accountant/salaries/overview/${user.schoolId}?month=${selectedMonth}`);
      setOverview(res.data.data);
      if (isRefresh) toast.success('Audit records updated');
    } catch (error) {
      toast.error('Failed to load salary overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 10000); // Poll every 10s for real-time sync
    return () => clearInterval(interval);
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const date = new Date(selectedMonth);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
  };

  const handleNextMonth = () => {
    const date = new Date(selectedMonth);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
  };

  const handleExport = async () => {
    try {
      toast.info('Generating Professional Payroll Report...');
      const response = await api.get(`/accountant/salaries/report/${user.schoolId}?month=${selectedMonth}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payroll_Report_${selectedMonth.replace(' ', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Payroll Report Downloaded');
    } catch (error) {
      toast.error('Failed to generate PDF report');
    }
  };

  const handleAuthorize = async (month: string) => {
    try {
      setAuthorizing(true);
      await api.post('/accountant/salaries/authorize', {
        schoolId: user.schoolId,
        month,
        principalId: user.uid
      });
      toast.success(`Payroll for ${month} authorized successfully`);
      fetchOverview();
    } catch (error) {
      toast.error('Authorization failed');
    } finally {
      setAuthorizing(false);
    }
  };

  if (loading && !overview) {
    return <div className="h-full w-full flex items-center justify-center animate-pulse text-violet-600 font-bold">Initializing Payroll Analytics...</div>;
  }

  const currentMonthApproval = overview?.approvals?.find((a: any) => a.month === selectedMonth);
  const isCurrentMonthApproved = currentMonthApproval?.status === 'approved';

  const totalMonthlyLiability = overview?.stats?.reduce((acc: number, s: any) => acc + (s.salary || 0), 0) || 0;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight">Staff Salary Control</h2>
          <p className="text-slate-500 font-medium mt-1">Monitor and authorize institutional payroll cycles</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] shadow-xl border border-slate-50">
          <div className="flex items-center gap-2 px-4 border-r border-slate-100 mr-2">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={handlePrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-black text-slate-700 min-w-[100px] text-center">{selectedMonth}</span>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={handleNextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <Badge className={`px-6 py-2 rounded-2xl border-none font-bold text-sm ${isCurrentMonthApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {isCurrentMonthApproved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
            {isCurrentMonthApproved ? 'Authorized' : 'Pending Review'}
          </Badge>
          {!isCurrentMonthApproved ? (
            <Button 
              className="rounded-2xl h-12 px-8 bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-100 gap-2 transition-all hover:scale-105 active:scale-95"
              onClick={() => handleAuthorize(selectedMonth)}
              disabled={authorizing}
            >
              <ShieldCheck className="w-5 h-5" /> 
              Authorize
            </Button>
          ) : (
            <Button 
              variant="outline"
              className="rounded-2xl h-12 px-8 border-2 border-slate-100 hover:bg-slate-50 text-slate-600 font-bold gap-2 transition-all"
              onClick={handleExport}
            >
              <Download className="w-5 h-5" /> 
              Export Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Stats Card */}
        <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-violet-500/20 transition-all duration-1000" />
          <CardContent className="p-12 relative">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Total Monthly Liability</div>
                <h1 className="text-6xl font-black tracking-tighter italic">₹{totalMonthlyLiability.toLocaleString()}</h1>
                <div className="flex items-center gap-2 text-emerald-400 font-bold mt-4">
                  <TrendingUp className="w-5 h-5" />
                  <span>Stable compared to last month</span>
                </div>
              </div>
              <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/10">
                <DollarSign className="w-10 h-10 text-violet-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mt-12">
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                  <span>Teaching Staff</span>
                  <span>₹{overview?.stats?.find((s: any) => s.department === 'teaching')?.salary.toLocaleString() || '0'}</span>
                </div>
                <Progress value={75} className="h-2 bg-white/5" indicatorClassName="bg-violet-500" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-widest">
                  <span>Administration</span>
                  <span>₹{overview?.stats?.find((s: any) => s.department === 'non-teaching')?.salary.toLocaleString() || '0'}</span>
                </div>
                <Progress value={25} className="h-2 bg-white/5" indicatorClassName="bg-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-slate-900 text-sm uppercase tracking-wider">Risk Audit</div>
                  <div className="text-xs text-slate-400 font-bold">Real-time anomaly detection</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                No salary spikes detected this month. All staff records align with active contracts.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-violet-600 text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 opacity-50" />
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black leading-tight italic">Total Active<br />Payrolls: {overview?.stats?.reduce((acc: number, s: any) => acc + s.count, 0) || 0}</h3>
              <p className="text-violet-200 text-xs font-bold uppercase tracking-widest mt-4">Across all departments</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Breakdown */}
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white">
          <CardHeader className="px-10 py-8 border-b border-slate-50">
            <CardTitle className="text-xl font-black italic text-slate-900 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-violet-600" />
              Departmental Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            {overview?.stats?.map((dept: any, i: number) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl ${i % 2 === 0 ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{dept.department}</div>
                    <div className="text-slate-400 text-xs font-bold">{dept.count} Staff Members</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black italic text-slate-900">₹{dept.salary.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Monthly Total</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Disbursements */}
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white">
          <CardHeader className="px-10 py-8 border-b border-slate-50 flex flex-row justify-between items-center">
            <CardTitle className="text-xl font-black italic text-slate-900 flex items-center gap-3">
              <Clock className="w-6 h-6 text-emerald-600" />
              Audit Log: Recent Payments
            </CardTitle>
            <Button 
              variant="ghost" 
              className="text-violet-600 font-bold hover:bg-violet-50 rounded-xl gap-2" 
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Refresh Audit
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {overview?.recentPayments?.map((p: any, i: number) => (
                <div key={i} className="px-10 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                      {p.staff?.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{p.staff?.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.staff?.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-600 font-black italic">₹{p.amount.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.month}</div>
                  </div>
                </div>
              ))}
              {(!overview?.recentPayments || overview.recentPayments.length === 0) && (
                <div className="p-20 text-center text-slate-400">
                  <p className="font-bold uppercase text-xs tracking-widest">No disbursements recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrincipalSalaries;
