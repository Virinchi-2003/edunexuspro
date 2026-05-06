import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  CreditCard, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
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

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const attendanceData = [
  { day: 'Mon', value: 92 },
  { day: 'Tue', value: 95 },
  { day: 'Wed', value: 94 },
  { day: 'Thu', value: 91 },
  { day: 'Fri', value: 88 },
];

const academicYears = ['2024-25', '2025-26', '2026-27', '2027-28'];

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

  React.useEffect(() => {
    const fetchData = async () => {
      if (!user?.schoolId) return;
      try {
        setLoading(true);
        const [schoolRes, statsRes] = await Promise.all([
          api.get(`/schools/${user.schoolId}`),
          api.get(`/management/school-stats/${user.schoolId}?academicYear=${academicYear}`)
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

      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, academicYear]);

  const handleYearChange = async (year: string) => {
    try {
      setAcademicYear(year);
      await api.put(`/schools/${user.schoolId}`, {
        ...school,
        currentAcademicYear: year
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
            <DropdownMenuContent align="end" className="w-[180px] rounded-xl p-1">
              {academicYears.map((year) => (
                <DropdownMenuItem 
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={`rounded-lg cursor-pointer ${academicYear === year ? 'bg-primary/5 text-primary font-bold' : ''}`}
                >
                  Academic Year {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
        {/* Placeholder for future real-time activity or calendar */}
        <Card className="border-none shadow-sm bg-slate-50/50 flex items-center justify-center p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold">School Calendar</h3>
            <p className="text-slate-500 text-sm mt-1">Upcoming academic events and schedule.</p>
            <Button variant="outline" className="mt-6 rounded-xl border-slate-200 bg-white">View Calendar</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
