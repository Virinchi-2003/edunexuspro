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

const attendanceData = [
  { day: 'Mon', value: 92 },
  { day: 'Tue', value: 95 },
  { day: 'Wed', value: 94 },
  { day: 'Thu', value: 91 },
  { day: 'Fri', value: 88 },
];

const PrincipalDashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">School Dashboard</h2>
          <p className="text-slate-500">St. Xavier High School • Mumbai Campus</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" /> Academic Year 2026-27
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Students', value: '1,240', icon: Users, change: '+24', positive: true },
          { title: 'Today Attendance', value: '94.2%', icon: UserCheck, change: '-1.2%', positive: false },
          { title: 'Fees Collected', value: '₹4.5L', icon: CreditCard, change: '+18%', positive: true },
          { title: 'Active Staff', value: '84/86', icon: Users, change: 'Stable', positive: true },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
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
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
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
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
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

        {/* Notifications/Alerts */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Critical Alerts</CardTitle>
            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Low Attendance', desc: 'Class X-B below 80% for 3 days', type: 'error' },
                { title: 'Pending Fees', desc: '42 students overdue by 15+ days', type: 'warning' },
                { title: 'Staff Meeting', desc: 'Scheduled for 3:00 PM today', type: 'info' },
              ].map((alert, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.type === 'error' ? 'bg-red-500' : 
                      alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <h4 className="font-semibold text-sm text-slate-900">{alert.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 ml-4">{alert.desc}</p>
                </div>
              ))}
            </div>
            <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white">
              Manage All Alerts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
