import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  ClipboardCheck, 
  ShieldAlert, 
  Package, 
  ChevronRight,
  TrendingUp,
  Heart,
  Clock,
  MapPin,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

import CoachClipboard from './modules/Clipboard';
import CoachFixtures from './modules/Fixtures';
import CoachInventory from './modules/Inventory';

const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    activePlayers: 0,
    upcomingMatches: 0,
    inventoryAlerts: 0,
    medicalFlags: 0
  });

  const [upcomingFixture, setUpcomingFixture] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, we'd fetch these from our new endpoints
        const [, fixturesRes, inventoryRes] = await Promise.all([
          api.get(`/coach/sports/${user.schoolId}`),
          api.get(`/coach/fixtures/${user.schoolId}`),
          api.get(`/coach/inventory/${user.schoolId}`)
        ]);

        const upcoming = fixturesRes.data.data?.find((f: any) => f.status === 'scheduled');
        setUpcomingFixture(upcoming);

        setStats({
          activePlayers: 42, // Mock for now
          upcomingMatches: fixturesRes.data.data?.filter((f: any) => f.status === 'scheduled').length || 0,
          inventoryAlerts: inventoryRes.data.data?.filter((i: any) => i.availableQuantity < i.lowStockAlert).length || 0,
          medicalFlags: 3 // Mock for now
        });

      } catch (error) {
        console.error(error);
      }
    };
    fetchDashboardData();
  }, [user]);

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <Users className="w-8 h-8 mb-4 text-indigo-200" />
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-100/70">Active Players</p>
            <h3 className="text-4xl font-display font-bold mt-1">{stats.activePlayers}</h3>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-indigo-200">
              <TrendingUp className="w-3 h-3" /> +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-500 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <Calendar className="w-8 h-8 mb-4 text-emerald-200" />
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-100/70">Upcoming Matches</p>
            <h3 className="text-4xl font-display font-bold mt-1">{stats.upcomingMatches}</h3>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-200">
              Next: {upcomingFixture?.opponentName || 'None scheduled'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-amber-500 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <Package className="w-8 h-8 mb-4 text-amber-200" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-100/70">Inventory Alerts</p>
            <h3 className="text-4xl font-display font-bold mt-1">{stats.inventoryAlerts}</h3>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-amber-200">
              Low stock on Football Kits
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-rose-500 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <ShieldAlert className="w-8 h-8 mb-4 text-rose-200" />
            <p className="text-xs font-bold uppercase tracking-widest text-rose-100/70">Medical Flags</p>
            <h3 className="text-4xl font-display font-bold mt-1">{stats.medicalFlags}</h3>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-rose-200">
              2 critical alerts for today
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Fixture Card */}
          {upcomingFixture && (
            <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full -mr-48 -mt-48 blur-3xl" />
              <CardHeader className="p-10 pb-0">
                <div className="flex justify-between items-center relative z-10">
                  <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white border-none px-4 py-1 rounded-full font-bold uppercase tracking-widest text-[10px]">Upcoming Match</Badge>
                  <span className="text-slate-400 font-mono text-xs">{new Date(upcomingFixture.dateTime).toLocaleString()}</span>
                </div>
              </CardHeader>
              <CardContent className="p-10 relative z-10">
                <div className="flex items-center justify-between gap-8">
                  <div className="text-center flex-1">
                    <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <Trophy className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h4 className="text-xl font-display font-bold">EduNexus Stars</h4>
                    <p className="text-slate-500 text-xs mt-1">Home Team</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-4xl font-display font-black text-slate-700 italic">VS</div>
                  </div>

                  <div className="text-center flex-1">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                      <Trophy className="w-10 h-10 text-rose-400" />
                    </div>
                    <h4 className="text-xl font-display font-bold">{upcomingFixture.opponentName}</h4>
                    <p className="text-slate-500 text-xs mt-1">Away Team</p>
                  </div>
                </div>

                <div className="mt-10 flex flex-col md:flex-row gap-4 items-center justify-between pt-10 border-t border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <MapPin className="w-4 h-4 text-indigo-500" /> {upcomingFixture.venue}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Clock className="w-4 h-4 text-emerald-500" /> Departs {upcomingFixture.departureTime}
                    </div>
                  </div>
                  <Button className="rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 px-8 h-12 font-bold shadow-xl shadow-indigo-600/20">
                    <Smartphone className="w-4 h-4 mr-2" /> Live Updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skill Progression Chart Placeholder */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-display font-bold">Skill Progression</CardTitle>
                  <p className="text-sm text-slate-500 font-medium">Average performance across all sports</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl text-indigo-600 font-bold">View Reports <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-6">
              <div className="space-y-6">
                {[
                  { name: 'Endurance', score: 85, color: 'bg-emerald-500' },
                  { name: 'Technique', score: 72, color: 'bg-indigo-500' },
                  { name: 'Teamwork', score: 94, color: 'bg-amber-500' },
                  { name: 'Strategy', score: 68, color: 'bg-rose-500' }
                ].map((skill, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-600">{skill.name}</span>
                      <span className="text-slate-900">{skill.score}%</span>
                    </div>
                    <Progress value={skill.score} className="h-2 rounded-full bg-slate-100" indicatorClassName={skill.color} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Area */}
        <div className="space-y-8">
          {/* Coach Profile Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
             <div className="h-20 bg-indigo-600" />
             <CardContent className="px-8 pb-8 -mt-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center mb-4 border-4 border-white overflow-hidden">
                   {user?.photoURL ? (
                     <img src={user.photoURL} className="w-full h-full object-cover" />
                   ) : (
                     <Users className="w-10 h-10 text-indigo-600" />
                   )}
                </div>
                <h4 className="text-lg font-bold text-slate-900">{user?.name}</h4>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Head Sports Coach</p>
                <div className="mt-6 w-full space-y-4 border-t border-slate-50 pt-6">
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">School ID</span>
                      <span className="text-slate-900 font-bold">{user?.schoolId?.slice(0, 8).toUpperCase()}</span>
                   </div>
                   <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Plan Level</span>
                      <Badge className="bg-indigo-50 text-indigo-600 border-none px-2 py-0.5 rounded-md font-bold uppercase text-[9px] tracking-tighter">
                        {user?.subscriptionPlan || 'Pro'} Member
                      </Badge>
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-4">
             <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-4">Quick Clipboard</h5>
             <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border-slate-100 bg-white hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                   <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ClipboardCheck className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-bold text-slate-600">Mark Attendance</span>
                </Button>
                <Button variant="outline" className="h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border-slate-100 bg-white hover:bg-emerald-50 hover:border-emerald-100 transition-all group">
                   <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <TrendingUp className="w-5 h-5" />
                   </div>
                   <span className="text-[10px] font-bold text-slate-600">Skill Log</span>
                </Button>
             </div>
          </div>

          {/* Critical Alerts Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-rose-50 p-6 border border-rose-100">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
                   <Heart className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-rose-900">Medical Vault</h4>
                   <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Critical Flags</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-rose-100 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                   <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900">Rohit Sharma</div>
                      <div className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Asthma • Keep Inhaler Ready</div>
                   </div>
                   <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-50">
                      <Smartphone className="w-4 h-4" />
                   </Button>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-rose-100 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                   <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900">Aryan Khan</div>
                      <div className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Severe Peanut Allergy</div>
                   </div>
                   <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-50">
                      <Smartphone className="w-4 h-4" />
                   </Button>
                </div>
             </div>
             <Button className="w-full mt-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold h-12 shadow-xl shadow-rose-200">
                Full Medical Register
             </Button>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Trophy className="w-8 h-8 text-amber-500" />
             <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Coach Portal</h2>
          </div>
          <p className="text-slate-500 font-medium">Command center for institutional sports & athlete performance.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 text-indigo-700 rounded-[2rem] border border-indigo-50">
           <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-xs font-bold uppercase tracking-[0.2em]">Real-time Sync Active</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white p-1 rounded-[2rem] shadow-sm border border-slate-100 mb-10 h-16 w-full max-w-2xl">
          <TabsTrigger value="overview" className="flex-1 rounded-[1.5rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all">Overview</TabsTrigger>
          <TabsTrigger value="clipboard" className="flex-1 rounded-[1.5rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all">Clipboard</TabsTrigger>
          <TabsTrigger value="fixtures" className="flex-1 rounded-[1.5rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all">Fixtures</TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 rounded-[1.5rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="clipboard">
          <CoachClipboard />
        </TabsContent>

        <TabsContent value="fixtures">
          <CoachFixtures />
        </TabsContent>

        <TabsContent value="inventory">
          <CoachInventory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachDashboard;
