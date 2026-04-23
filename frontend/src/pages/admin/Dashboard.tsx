import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  School, 
  Users, 
  TrendingUp, 
  Activity,
  MoreVertical,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
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

const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
];

const AdminDashboard: React.FC = () => {
  const stats = [
    { title: 'Total Schools', value: '124', icon: School, trend: '+12%', color: 'bg-blue-500' },
    { title: 'Active Students', value: '45,230', icon: Users, trend: '+8%', color: 'bg-green-500' },
    { title: 'Monthly Revenue', value: '₹12,45,000', icon: TrendingUp, trend: '+15%', color: 'bg-purple-500' },
    { title: 'System Health', value: '99.9%', icon: Activity, trend: 'Stable', color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">System Overview</h2>
          <p className="text-slate-500">Welcome back, Super Admin. Here's what's happening today.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add New School
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-xl text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none">
                  {stat.trend}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
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
              <AreaChart data={revenueData}>
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
            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: 'St. Xavier High School', plan: 'Elite', time: '2 hours ago' },
                { name: 'Greenwood Academy', plan: 'Pro', time: '5 hours ago' },
                { name: 'Little Flowers Primary', plan: 'Starter', time: '1 day ago' },
                { name: 'Global International', plan: 'Growth', time: '2 days ago' },
              ].map((school, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                    {school.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{school.name}</p>
                    <p className="text-xs text-slate-500">{school.time}</p>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-slate-600">
                    {school.plan}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="link" className="w-full mt-6 text-primary">View all schools</Button>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
