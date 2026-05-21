import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  CreditCard, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  AlertCircle,
  ChevronDown,
  Plus,
  ShieldCheck,
  ArrowRight,
  QrCode
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';

import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import SchoolInsights from '@/components/SchoolInsights';
import AnnouncementBoard from '@/components/AnnouncementBoard';
import PostAnnouncementModal from '@/components/PostAnnouncementModal';
import SchoolCalendar from '@/components/SchoolCalendar';

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

const attendanceData = [
  { day: 'Mon', value: 92 },
  { day: 'Tue', value: 95 },
  { day: 'Wed', value: 94 },
  { day: 'Thu', value: 91 },
  { day: 'Fri', value: 88 },
];

const PrincipalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [school, setSchool] = React.useState<any>(null);
  const [academicYear, setAcademicYear] = React.useState('2026-27');
  const [stats, setStats] = React.useState({
    students: 0,
    staff: 0,
    feesCollected: 0,
    totalExpected: 0
  });
  const [todayAttendance, setTodayAttendance] = React.useState('0.0');
  const [loading, setLoading] = React.useState(true);
  const [reminders, setReminders] = React.useState<any[]>([]);

  const [isAddYearOpen, setIsAddYearOpen] = React.useState(false);
  const [newYear, setNewYear] = React.useState('');

  // Payment Renewal Modal states
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [selectedReminder, setSelectedReminder] = React.useState<any>(null);
  const [cardDetails, setCardDetails] = React.useState({ number: '', expiry: '', cvv: '', name: '' });
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'razorpay' | 'card'>('razorpay');
  const [isMockPaymentOpen, setIsMockPaymentOpen] = React.useState(false);
  const [mockStep, setMockStep] = React.useState(1);
  const [mockMethod, setMockMethod] = React.useState<string | null>(null);
  const [mockPaymentData, setMockPaymentData] = React.useState<any>(null);
  const [successTxId, setSuccessTxId] = React.useState('');
  const [selectedSubMethod, setSelectedSubMethod] = React.useState<string>('upi');

  const availableYears = school?.academicYears 
    ? school.academicYears.split(',') 
    : ['2024-25', '2025-26', '2026-27', '2027-28'];

  const handleAddYear = async () => {
    const trimmed = newYear.trim();
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(trimmed)) {
      toast.error("Please enter a valid format (e.g., 2028-29)");
      return;
    }
    if (availableYears.includes(trimmed)) {
      toast.error("This academic year already exists!");
      return;
    }
    try {
      const updatedYears = [...availableYears, trimmed].join(',');
      await api.put(`/schools/${user.schoolId}`, {
        ...school,
        academicYears: updatedYears
      });
      toast.success(`Academic Year ${trimmed} successfully added!`);
      setSchool((prev: any) => ({
        ...prev,
        academicYears: updatedYears
      }));
      setNewYear('');
      setIsAddYearOpen(false);
    } catch (error) {
      toast.error("Failed to save custom academic year");
    }
  };

  const handleRazorpayPayment = async () => {
    if (!selectedReminder) return;
    setIsProcessing(true);
    try {
      let planName = 'elite';
      if (selectedReminder.message) {
        const lowerMsg = selectedReminder.message.toLowerCase();
        if (lowerMsg.includes('starter')) planName = 'starter';
        else if (lowerMsg.includes('growth')) planName = 'growth';
        else if (lowerMsg.includes('pro')) planName = 'pro';
        else if (lowerMsg.includes('elite')) planName = 'elite';
      }

      const orderRes = await api.post('/management/payments/renew/order', {
        reminderId: selectedReminder.id,
        plan: planName,
        amount: selectedReminder.amount
      });

      const order = orderRes.data.data;

      if (order.isMock || orderRes.data.isMock) {
        setMockPaymentData({
          order,
          reminderId: selectedReminder.id,
          plan: planName,
          amount: selectedReminder.amount
        });
        setMockMethod(selectedSubMethod);
        setMockStep(2);
        setIsPaymentOpen(false);
        setIsMockPaymentOpen(true);
        return;
      }

      // Real Razorpay Checkout flow
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "EduNexus Pro",
        description: `Subscription Renewal - ${planName.toUpperCase()} Plan`,
        order_id: order.id,
        handler: async (response: any) => {
          setIsProcessing(true);
          try {
            const verifyRes = await api.post('/management/payments/renew/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              reminderId: selectedReminder.id,
              plan: planName,
              amount: selectedReminder.amount
            });
            if (verifyRes.data.status === 'success') {
              setSuccessTxId(response.razorpay_payment_id);
              setIsSuccess(true);
              setIsPaymentOpen(true);
              toast.success('Payment verified and subscription updated!');
              setReminders(prev => prev.filter(r => r.id !== selectedReminder.id));
            } else {
              toast.error(verifyRes.data.message || 'Signature verification failed');
            }
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification endpoint error');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user?.name || 'Principal',
          email: user?.email || '',
        },
        theme: {
          color: "#6366f1",
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Razorpay Error:', error);
      toast.error('Failed to initiate Razorpay checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const completeMockPayment = async (paymentId: string) => {
    if (!mockPaymentData) return;
    setIsProcessing(true);
    try {
      const verifyRes = await api.post('/management/payments/renew/verify', {
        razorpay_order_id: mockPaymentData.order.id,
        razorpay_payment_id: paymentId,
        razorpay_signature: 'mock_signature',
        reminderId: mockPaymentData.reminderId,
        plan: mockPaymentData.plan,
        amount: mockPaymentData.amount
      });

      if (verifyRes.data.status === 'success') {
        setIsMockPaymentOpen(false);
        setSuccessTxId(paymentId);
        setIsSuccess(true);
        setSelectedReminder({
          id: mockPaymentData.reminderId,
          amount: mockPaymentData.amount,
          message: `Plan renewed via simulated ${mockMethod || 'Razorpay'}`
        });
        setIsPaymentOpen(true);
        toast.success('Simulated Payment Verified successfully!');
        setReminders(prev => prev.filter(r => r.id !== mockPaymentData.reminderId));
      } else {
        toast.error('Verification failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification endpoint error');
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId) return;
      try {
        setLoading(true);
        const [schoolRes, statsRes, remindersRes] = await Promise.all([
          api.get(`/schools/${user.schoolId}`),
          api.get(`/management/school-stats/${user.schoolId}?academicYear=${academicYear}`),
          api.get(`/management/payments/reminders/${user.schoolId}`)
        ]);

        const schoolData = schoolRes.data.data;
        setSchool(schoolData);
        // Only set the initial academic year if it's the first load
        if (schoolData.currentAcademicYear && schoolData.currentAcademicYear !== academicYear) {
          setAcademicYear(schoolData.currentAcademicYear);
        }
        
        const s = statsRes.data.data;

        setStats({
          students: s.students,
          staff: s.staff,
          feesCollected: s.feesCollected,
          totalExpected: s.totalFeesExpected
        });
        
        setTodayAttendance(s.todayAttendance);
        setReminders(remindersRes.data.data || []);

      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, academicYear]);

  const handleResolveReminder = async (reminderId: string) => {
    try {
      await api.post(`/management/payments/reminders/${reminderId}/resolve`);
      toast.success('Notice dismissed.');
      setReminders(prev => prev.filter(r => r.id !== reminderId));
    } catch (error) {
      toast.error('Failed to dismiss reminder.');
    }
  };

  const handleYearChange = async (year: string) => {
    try {
      setAcademicYear(year);
      await api.put(`/schools/${user.schoolId}`, {
        ...school,
        currentAcademicYear: year,
        academicYears: availableYears.join(',')
      });
      toast.success(`Academic Year updated to ${year}`);
    } catch (error) {
      toast.error('Failed to sync academic year');
    }
  };

  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Welcome, {user?.name || 'Principal'}</h2>
          <p className="text-slate-500">{school?.name || 'School Dashboard'} • {school?.address || 'Loading...'}</p>
        </div>
        <div className="flex gap-3">
          <PostAnnouncementModal onSuccess={() => setRefreshKey(prev => prev + 1)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
                <Calendar className="w-4 h-4 text-primary" /> 
                Academic Year {academicYear}
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[185px] rounded-xl p-1 shadow-md border border-slate-100 bg-white">
              {availableYears.map((year: string) => (
                <DropdownMenuItem 
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={`rounded-lg cursor-pointer text-slate-700 font-semibold text-xs py-2 px-3 ${academicYear === year ? 'bg-primary/5 text-primary font-bold' : 'hover:bg-slate-50'}`}
                >
                  Academic Year {year}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-slate-100 my-1" />
              <DropdownMenuItem 
                onSelect={() => setIsAddYearOpen(true)}
                className="rounded-lg cursor-pointer text-xs py-2 px-3 text-primary font-bold hover:bg-primary/5 gap-1.5 flex items-center justify-center border border-dashed border-primary/20 m-1 bg-primary/[0.02]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Custom Year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Premium Glassmorphic Add Academic Year Modal */}
          {isAddYearOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-[420px] rounded-3xl shadow-2xl border border-slate-200/50 p-6 relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col gap-5">
                {/* Background Decorator */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Calendar className="w-36 h-36 text-primary" />
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => {
                    setNewYear('');
                    setIsAddYearOpen(false);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>

                {/* Header */}
                <div className="space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Plus className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-slate-900">Add Academic Year</h3>
                  <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                    Enter a custom academic year to expand your school system's database tracking.
                  </p>
                </div>

                {/* Content Body */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Academic Year Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 2028-29"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-slate-50/50 p-3 text-sm outline-none transition-all"
                      autoFocus
                    />
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-300 animate-pulse" />
                      Must follow standard format YYYY-YY (e.g. 2028-29)
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 justify-end mt-2">
                  <button 
                    onClick={() => {
                      setNewYear('');
                      setIsAddYearOpen(false);
                    }}
                    className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-4 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddYear}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs py-2.5 px-5 transition-all shadow-md shadow-primary/20"
                  >
                    Save Year
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Repayment Reminders Banner */}
      {reminders.map((rem) => (
        <Card key={rem.id} className="border-none bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 text-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertCircle className="w-48 h-48 text-amber-500" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-500/15 text-amber-600 h-fit rounded-2xl animate-bounce">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  Subscription Renewal Reminder
                  {rem.dueDate && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none font-semibold text-[11px] py-0.5">
                      Due: {new Date(rem.dueDate).toLocaleDateString()}
                    </Badge>
                  )}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {rem.message}
                </p>
                {rem.amount && (
                  <p className="text-xs text-slate-500">
                    Amount Due: <span className="font-bold text-slate-800">₹{rem.amount.toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleResolveReminder(rem.id)}
                className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm"
              >
                Dismiss Notice
              </Button>
              <Button 
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-none font-bold shadow-lg shadow-amber-500/20"
                onClick={() => {
                  setSelectedReminder(rem);
                  setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
                  setIsSuccess(false);
                  setIsPaymentOpen(true);
                }}
              >
                Pay Now
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Students', value: stats.students.toLocaleString(), icon: Users, change: '+12%', positive: true },
          { title: 'Today Attendance', value: `${todayAttendance}%`, icon: UserCheck, change: '-1.2%', positive: false },
          { title: 'Fees Collected', value: `₹${(stats.feesCollected / 1000).toFixed(1)}k`, icon: CreditCard, change: `${((stats.feesCollected / (stats.totalExpected || 1)) * 100).toFixed(0)}%`, positive: true },
          { title: 'Active Staff', value: stats.staff.toString(), icon: Users, change: 'Stable', positive: true },
        ].map((stat, i) => (
          <Card key={i} className={`border-none shadow-sm ${loading ? 'animate-pulse' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{loading ? '...' : stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Weekly Attendance Trend</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-none">Target: 95%</Badge>
          </CardHeader>
          <CardContent className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fill="#3b82f610" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* School Insights / Alerts */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Finance Analytics</CardTitle>
                <MoreVertical className="w-4 h-4 opacity-60" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-indigo-100 text-sm">Revenue Realization</p>
                  <h2 className="text-3xl font-bold">₹{stats.feesCollected.toLocaleString()}</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Projected: ₹{stats.totalExpected.toLocaleString()}</span>
                    <span>{Math.round((stats.feesCollected / (stats.totalExpected || 1)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000" 
                      style={{ width: `${(stats.feesCollected / (stats.totalExpected || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none rounded-xl font-bold">
                  BigQuery Reports
                </Button>
              </div>
            </CardContent>
          </Card>
          <SchoolInsights stats={stats} />
        </div>
      </div>

      {/* Announcement Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnnouncementBoard key={refreshKey} limit={5} showPostButton />
        <SchoolCalendar />
      </div>

      {/* Premium Glassmorphic Payment Checkout Modal */}
      {isPaymentOpen && selectedReminder && (
        <Dialog open={isPaymentOpen} onOpenChange={(open) => {
          if (!open && !isProcessing) {
            setIsPaymentOpen(false);
            setSelectedReminder(null);
          }
        }}>
          <DialogContent className="sm:max-w-[500px] rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl p-6 overflow-hidden">
            {/* Background glowing gradients */}
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] pointer-events-none" />

            <DialogHeader className="border-b border-slate-800 pb-4">
              <DialogTitle className="flex items-center gap-2 text-xl font-display font-bold text-white">
                <CreditCard className="w-5 h-5 text-violet-400" />
                Secure Subscription Renewal
              </DialogTitle>
            </DialogHeader>

            {isSuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10 mb-2">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-100">Payment Successful!</h3>
                <p className="text-sm text-slate-400 max-w-[340px]">
                  Your subscription has been renewed and synchronized with the admin ledger.
                </p>
                <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl w-full text-left font-mono text-xs text-slate-400 space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="text-slate-200 font-bold">{successTxId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="text-emerald-400 font-bold">₹{selectedReminder.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-emerald-400 font-bold">Confirmed</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none rounded-xl text-white font-bold h-11 shadow-lg shadow-indigo-600/20 mt-6"
                  onClick={() => {
                    setIsPaymentOpen(false);
                    setSelectedReminder(null);
                    window.location.reload();
                  }}
                >
                  Return to Dashboard
                </Button>
              </div>
            ) : (
              <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* School & Plan Summary Banner */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                  <div>
                    <h5 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Institution</h5>
                    <p className="text-sm font-bold text-slate-200 truncate max-w-[200px]">{school?.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {school?.school_id}</p>
                  </div>
                  <div className="text-right">
                    <h5 className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Due Amount</h5>
                    <p className="text-lg font-bold text-amber-400">₹{selectedReminder.amount?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Payment Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'razorpay' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Razorpay Gateway
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'card' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Direct Card Form
                  </button>
                </div>

                {paymentMethod === 'razorpay' ? (
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-5 space-y-4 text-center">
                    <div className="w-14 h-14 bg-violet-600/10 text-violet-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-200">Razorpay Payment Gateway</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Pay securely using UPI, QR Code, Credit/Debit Cards, or NetBanking. You will be redirected to the secure gateway interface.
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/50">
                      {[
                        { id: 'upi', name: 'UPI / GPay', icon: '📱' },
                        { id: 'qr', name: 'QR Code', icon: '📷' },
                        { id: 'card', name: 'Cards', icon: '💳' },
                        { id: 'netbanking', name: 'NetBanking', icon: '🏦' }
                      ].map((item, idx) => {
                        const isSelected = selectedSubMethod === item.id;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSubMethod(item.id)}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                              isSelected 
                                ? 'bg-violet-600/20 border-violet-500 text-white shadow-md shadow-violet-500/10' 
                                : 'bg-slate-900/40 border-slate-800/30 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-[9px] font-bold">{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Simulated Visual Credit Card */}
                    <div className="relative h-44 w-full bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 border border-slate-800 rounded-2xl p-5 shadow-lg overflow-hidden flex flex-col justify-between select-none">
                      {/* Decorative card micro-chips */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12 pointer-events-none" />
                      
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[9px] uppercase tracking-widest text-indigo-300 font-bold">EduNexus Premium Card</p>
                          {/* Chip SVG */}
                          <svg className="w-9 h-7 text-amber-500/70" viewBox="0 0 100 80" fill="currentColor">
                            <rect x="10" y="10" width="80" height="60" rx="10" />
                            <line x1="10" y1="30" x2="90" y2="30" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                            <line x1="10" y1="50" x2="90" y2="50" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                            <line x1="36" y1="10" x2="36" y2="70" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                            <line x1="64" y1="10" x2="64" y2="70" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                          </svg>
                        </div>
                        {/* Visa/Mastercard style branding */}
                        <div className="h-6 flex items-center font-display italic font-black text-white/90 text-sm tracking-wider">
                          EDUNEXUS<span className="text-violet-400 font-normal font-sans text-xs ml-1">PAY</span>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">
                        {/* Card Number */}
                        <p className="font-mono text-base tracking-widest text-slate-100">
                          {cardDetails.number ? cardDetails.number.replace(/(\d{4})/g, '$1 ').trim().substring(0, 19) : '•••• •••• •••• ••••'}
                        </p>
                        
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[7px] uppercase tracking-wider text-slate-500 font-bold">Card Holder</p>
                            <p className="font-mono text-[11px] uppercase tracking-wide text-slate-200 truncate max-w-[180px]">
                              {cardDetails.name || 'Virinchi Principal'}
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <div>
                              <p className="text-[7px] uppercase tracking-wider text-slate-500 font-bold">Expires</p>
                              <p className="font-mono text-[11px] text-slate-200">{cardDetails.expiry || 'MM/YY'}</p>
                            </div>
                            <div>
                              <p className="text-[7px] uppercase tracking-wider text-slate-500 font-bold">CVV</p>
                              <p className="font-mono text-[11px] text-slate-200">{cardDetails.cvv ? '•••' : '•••'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Card Holder Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Virinchi Principal"
                          value={cardDetails.name}
                          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                          className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 px-3.5 text-sm outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Card Number</label>
                        <input 
                          type="text" 
                          placeholder="4111 2222 3333 4444"
                          maxLength={19}
                          value={cardDetails.number}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s?/g, '').replace(/[^0-9]/g, '');
                            let formatted = '';
                            for (let i = 0; i < value.length; i++) {
                              if (i > 0 && i % 4 === 0) formatted += ' ';
                              formatted += value[i];
                            }
                            setCardDetails({ ...cardDetails, number: formatted });
                          }}
                          className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 px-3.5 text-sm outline-none transition-all font-mono tracking-wider"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expiry Date</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardDetails.expiry}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s?/g, '').replace(/[^0-9]/g, '');
                              let formatted = '';
                              if (value.length > 2) {
                                formatted = value.substring(0, 2) + '/' + value.substring(2, 4);
                              } else {
                                formatted = value;
                              }
                              setCardDetails({ ...cardDetails, expiry: formatted });
                            }}
                            className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 px-3.5 text-sm outline-none transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">CVV / CVC</label>
                          <input 
                            type="password" 
                            placeholder="•••"
                            maxLength={3}
                            value={cardDetails.cvv}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              setCardDetails({ ...cardDetails, cvv: val });
                            }}
                            className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 px-3.5 text-sm outline-none transition-all font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Gateway security label */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>SSL Encrypted Connection</span>
                  </div>
                  <span>PCI-DSS Compliant</span>
                </div>

                {/* Actions */}
                <DialogFooter className="mt-4 flex flex-row justify-end gap-3 pt-4 border-t border-slate-800">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsPaymentOpen(false);
                      setSelectedReminder(null);
                    }}
                    disabled={isProcessing}
                    className="rounded-xl border border-slate-800 bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={paymentMethod === 'razorpay' ? handleRazorpayPayment : async () => {
                      if (!cardDetails.name || !cardDetails.number || cardDetails.number.replace(/\s/g, '').length < 16 || !cardDetails.expiry || cardDetails.cvv.length < 3) {
                        toast.error('Please enter valid credit card billing credentials');
                        return;
                      }

                      setIsProcessing(true);
                      try {
                        let planName = 'elite';
                        if (selectedReminder.message) {
                          const lowerMsg = selectedReminder.message.toLowerCase();
                          if (lowerMsg.includes('starter')) planName = 'starter';
                          else if (lowerMsg.includes('growth')) planName = 'growth';
                          else if (lowerMsg.includes('pro')) planName = 'pro';
                          else if (lowerMsg.includes('elite')) planName = 'elite';
                        }

                        const res = await api.post('/management/payments/renew', {
                          reminderId: selectedReminder.id,
                          plan: planName,
                          amount: selectedReminder.amount
                        });

                        if (res.data.status === 'success') {
                          setSuccessTxId(res.data.data?.transactionId || `TXN-${Math.floor(100000 + Math.random() * 900000)}`);
                          setIsSuccess(true);
                          toast.success('Payment successfully processed and synchronized!');
                        } else {
                          toast.error(res.data.message || 'Renewal transaction failed');
                        }
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Payment system gateway error');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-none text-white font-bold rounded-xl h-10 shadow-lg shadow-indigo-600/20"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Securing Gateway...
                      </span>
                    ) : (
                      paymentMethod === 'razorpay' ? 'Proceed to Gateway' : `Pay ₹${selectedReminder.amount?.toLocaleString()}`
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Mock Payment Gateway Dialog */}
      {isMockPaymentOpen && mockPaymentData && (
        <Dialog open={isMockPaymentOpen} onOpenChange={(open) => {
          if (!open && !isProcessing) {
            setIsMockPaymentOpen(false);
            setMockStep(1);
            setMockMethod(null);
            setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
          }
        }}>
          <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] bg-slate-900 border border-slate-800 text-white shadow-2xl p-0 overflow-hidden">
            <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="h-32 bg-gradient-to-r from-amber-500 to-amber-600 p-8 flex flex-col justify-center">
              <DialogTitle className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <ShieldCheck className="w-6 h-6" /> 
                {mockStep === 1 ? 'Mock Razorpay Gateway' : `Pay with ${mockMethod === 'card' ? 'Card' : mockMethod?.toUpperCase()}`}
              </DialogTitle>
              <p className="text-amber-100 font-medium text-xs mt-1.5">Simulating Payment Gateway (Development Mode)</p>
            </div>

            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payable Amount</div>
                  <div className="text-2xl font-display font-bold text-amber-400">₹{(mockPaymentData?.amount || 0).toLocaleString()}</div>
                </div>
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm border border-slate-800">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              
              {mockStep === 1 ? (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'card', name: 'Credit / Debit Card', icon: '💳', desc: 'Pay with simulated Visa/Mastercard' },
                    { id: 'upi', name: 'UPI (GPay, PhonePe, UPI ID)', icon: '📱', desc: 'Pay using instant UPI payment link' },
                    { id: 'qr', name: 'QR Code Scan', icon: '📷', desc: 'Scan and pay using any mobile app' },
                    { id: 'netbanking', name: 'NetBanking', icon: '🏦', desc: 'Select from popular Indian banks' }
                  ].map(method => (
                    <div 
                      key={method.id}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 hover:border-amber-500 hover:bg-amber-500/5 cursor-pointer transition-all flex items-center justify-between group"
                      onClick={() => {
                        setMockMethod(method.id);
                        setMockStep(2);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <span className="font-bold text-slate-200 group-hover:text-amber-500 block text-sm">{method.name}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{method.desc}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                  {mockMethod === 'card' ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Card Number</label>
                        <input 
                          placeholder="4444 4444 4444 4444" 
                          className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 px-3.5 text-sm outline-none font-mono"
                          value={cardDetails.number}
                          onChange={e => setCardDetails({...cardDetails, number: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Expiry</label>
                          <input 
                            placeholder="MM/YY" 
                            className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 px-3.5 text-sm outline-none font-mono"
                            value={cardDetails.expiry}
                            onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">CVV</label>
                          <input 
                            type="password" 
                            placeholder="•••" 
                            className="w-full h-11 rounded-xl border border-slate-800 bg-slate-950 text-white placeholder-slate-600 px-3.5 text-sm outline-none font-mono"
                            value={cardDetails.cvv}
                            onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  ) : mockMethod === 'qr' ? (
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
                      <div className="p-3 bg-white rounded-xl">
                        <QrCode className="w-36 h-36 text-slate-900" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-slate-300">Scan this QR using GPay, PhonePe, or BHIM</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: renew_qr_code_demo@razorpay</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-center">
                      <div className="text-sm font-medium text-slate-400">
                        Please wait while we redirect you to your simulated {mockMethod === 'upi' ? 'UPI Mobile App' : 'NetBanking Portal'}...
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-md mt-4 shadow-lg shadow-amber-500/10"
                    onClick={() => {
                      const randomPayId = `pay_mock_${Math.random().toString(36).substr(2, 9)}`;
                      completeMockPayment(randomPayId);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Verifying...' : (mockMethod === 'card' ? 'Pay Now' : 'Simulate Success')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full h-10 text-slate-500 font-bold hover:text-slate-300 hover:bg-transparent"
                    onClick={() => setMockStep(1)}
                    disabled={isProcessing}
                  >
                    Back to methods
                  </Button>
                </div>
              )}
              
              <Button 
                variant="ghost"
                className="w-full text-rose-500 font-bold hover:text-rose-400 hover:bg-rose-950/20 rounded-xl"
                onClick={() => {
                  toast.error('Payment Simulation Cancelled');
                  setIsMockPaymentOpen(false);
                }}
                disabled={isProcessing}
              >
                Cancel Simulation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PrincipalDashboard;
