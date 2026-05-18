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
  AlertCircle
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
import { ChevronDown, Plus } from 'lucide-react';

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
                onClick={() => toast.success('Redirecting to secure merchant payment gateway...')}
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
    </div>
  );
};

export default PrincipalDashboard;
