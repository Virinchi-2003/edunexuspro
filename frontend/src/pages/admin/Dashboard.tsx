import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  School, 
  Users, 
  TrendingUp, 
  Activity,
  Plus,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Button } from '@/components/ui/button';
import AIInsights from '@/components/AIInsights';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/management/stats');
      if (res.data.status === 'success') {
        setStatsData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = [
    { title: 'Total Schools', value: statsData?.totalSchools || '0', icon: School, trend: '+12%', color: 'bg-blue-500' },
    { title: 'Active Students', value: statsData?.activeStudents || '0', icon: Users, trend: '+8%', color: 'bg-green-500' },
    { title: 'Monthly Revenue', value: statsData?.monthlyRevenue || '₹0', icon: TrendingUp, trend: '+15%', color: 'bg-purple-500' },
    { title: 'System Health', value: statsData?.systemHealth || '99.9%', icon: Activity, trend: 'Stable', color: 'bg-amber-500' },
  ];

  if (loading && !statsData) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-medium">Synchronizing system data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">System Overview</h2>
          <p className="text-slate-500">Welcome back, Super Admin. Here's what's happening today.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => navigate('/admin/schools')}>
          <Plus className="w-4 h-4" /> Manage Schools
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                  {stat.trend}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', value: 4000 },
                { name: 'Feb', value: 3000 },
                { name: 'Mar', value: 5000 },
                { name: 'Apr', value: 4500 },
                { name: 'May', value: 6000 },
                { name: 'Jun', value: 5500 },
              ]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Schools */}
        <div className="space-y-6">
          <AIInsights />
          <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">New Registrations</CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchStats} disabled={loading}>
              <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(statsData?.recentSchools || []).map((school: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {school.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{school.name}</p>
                    <p className="text-xs text-slate-500">{new Date(school.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-600 capitalize">
                    {school.subscriptionPlan}
                  </Badge>
                </div>
              ))}
              {(!statsData?.recentSchools || statsData.recentSchools.length === 0) && (
                <p className="text-center text-sm text-slate-400 py-4">No recent registrations</p>
              )}
            </div>
            <Button 
              variant="link" 
              className="w-full mt-6 text-primary gap-2" 
              onClick={() => navigate('/admin/schools')}
            >
              View all schools <ExternalLink className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
