import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  ShieldAlert, 
  Package, 
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  Smartphone,
  RefreshCw,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

import CoachClipboard from './modules/Clipboard';
import CoachFixtures from './modules/Fixtures';
import CoachInventory from './modules/Inventory';
import CoachStudents from './modules/Students';
import SportsManagement from './modules/SportsManagement';

const CoachDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({
    activePlayers: 0,
    upcomingMatches: 0,
    inventoryAlerts: 0,
    medicalFlags: 0
  });

  const [upcomingFixture, setUpcomingFixture] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, fixturesRes, assessmentsRes] = await Promise.all([
        api.get(`/coach/dashboard-stats/${user.schoolId}`),
        api.get(`/coach/fixtures/${user.schoolId}`),
        api.get(`/coach/analytics/recent-assessments/${user.schoolId}`)
      ]);

      const upcoming = fixturesRes.data.data?.find((f: any) => f.status === 'scheduled');
      setUpcomingFixture(upcoming);
      setStats(statsRes.data.data);
      setRecentActivities(assessmentsRes.data.data);

    } catch (error) {
      console.error(error);
      toast.error('Failed to sync dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
         <h3 className="text-xl font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Live Insights</h3>
         <Button 
           variant="ghost" 
           size="sm" 
           className="rounded-full text-indigo-600 font-bold hover:bg-indigo-50 px-4 h-10"
           onClick={fetchDashboardData}
         >
           <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
           Sync Dashboard
         </Button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative group transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <Users className="w-8 h-8 mb-4 text-indigo-200" />
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-100/70">Active Players</p>
            <h3 className="text-4xl font-display font-bold mt-1">{stats.activePlayers}</h3>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-indigo-200">
              <TrendingUp className="w-3 h-3" /> Real-time Sync Active
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-500 text-white overflow-hidden relative group transition-all hover:scale-[1.02]">
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

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-amber-500 text-white overflow-hidden relative group transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <Package className="w-8 h-8 mb-4 text-amber-200" />
            <p className="text-xs font-bold uppercase tracking-widest text-amber-100/70">Inventory Alerts</p>
            <h3 className="text-4xl font-display font-bold mt-1">{stats.inventoryAlerts}</h3>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-amber-200">
              Items below low stock alert
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-rose-500 text-white overflow-hidden relative group transition-all hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <ShieldAlert className="w-8 h-8 mb-4 text-rose-200" />
            <p className="text-xs font-bold uppercase tracking-widest text-rose-100/70">Medical Flags</p>
            <h3 className="text-4xl font-display font-bold mt-1">{stats.medicalFlags}</h3>
            <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-rose-200">
              Check Medical Vault for details
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Fixture Card */}
          {upcomingFixture ? (
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
          ) : (
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 flex flex-col items-center justify-center min-h-[300px] text-center border-2 border-dashed border-slate-100">
               <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                  <Calendar className="w-8 h-8" />
               </div>
               <h4 className="text-lg font-bold text-slate-900">No Upcoming Fixtures</h4>
               <p className="text-sm text-slate-400 max-w-[280px] mt-2">Check the Fixtures tab to schedule new matches for the school.</p>
            </Card>
          )}

          {/* Recent Activity / Skill Assessment Highlights */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-display font-bold">Recent Activities</CardTitle>
                  <p className="text-sm text-slate-500 font-medium">Latest assessments and performance logs</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl text-indigo-600 font-bold">Full Reports <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-8">
              <div className="space-y-6">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 border border-slate-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           {activity.sport?.name?.slice(0, 2).toUpperCase() || 'SP'}
                        </div>
                        <div>
                           <div className="font-bold text-slate-900">{activity.skill}</div>
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Athlete: {activity.student?.name}</div>
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-lg font-black text-indigo-600">{activity.score}/5</div>
                        <div className="text-[9px] text-slate-400 font-bold mt-1">{new Date(activity.createdAt).toLocaleDateString()}</div>
                     </div>
                  </div>
                ))}
                {recentActivities.length === 0 && (
                   <div className="text-center py-10 text-slate-300 italic font-medium">
                      No recent activities logged.
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Area */}
        <div className="space-y-8">
          {/* Coach Profile Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
             <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600" />
             <CardContent className="px-8 pb-8 -mt-12 flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl flex items-center justify-center mb-4 border-[6px] border-white overflow-hidden">
                   {user?.photoURL ? (
                     <img src={user.photoURL} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                        <Users className="w-10 h-10 text-slate-300" />
                     </div>
                   )}
                </div>
                <h4 className="text-xl font-bold text-slate-900">{user?.name}</h4>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">Head Sports Coach</p>
                
                <div className="mt-8 w-full space-y-4 border-t border-slate-50 pt-8">
                   <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">School ID</span>
                      <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{user?.schoolId?.slice(0, 8).toUpperCase()}</span>
                   </div>
                </div>
             </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
             <div className="relative z-10">
                <h5 className="text-lg font-bold mb-6 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-indigo-400" /> Health Snapshot
                </h5>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <span>Student Enrollment</span>
                         <span className="text-white">{stats.activePlayers} Active</span>
                      </div>
                      <Progress value={Math.min((stats.activePlayers / 100) * 100, 100)} className="h-1.5 bg-white/5" indicatorClassName="bg-indigo-500" />
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                         <span>Gear Maintenance</span>
                         <span className="text-rose-400">{stats.inventoryAlerts} Alerts</span>
                      </div>
                      <Progress value={100 - Math.min((stats.inventoryAlerts / 20) * 100, 100)} className="h-1.5 bg-white/5" indicatorClassName="bg-rose-500" />
                   </div>
                </div>
             </div>
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
             <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-200">
                <Trophy className="w-7 h-7" />
             </div>
             <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Coach Portal</h2>
          </div>
          <p className="text-slate-500 font-medium ml-1">Command center for institutional sports & athlete performance.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 text-indigo-700 rounded-[2rem] border border-indigo-50">
           <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Real-time Sync Active</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white p-1 rounded-[2.5rem] shadow-xl shadow-slate-200/20 border border-slate-50 mb-10 h-18 w-full max-w-4xl overflow-x-auto overflow-y-hidden">
          <TabsTrigger value="overview" className="flex-1 rounded-[2rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all text-sm uppercase tracking-widest">Overview</TabsTrigger>
          <TabsTrigger value="students" className="flex-1 rounded-[2rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all text-sm uppercase tracking-widest">Students</TabsTrigger>
          <TabsTrigger value="sports" className="flex-1 rounded-[2rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all text-sm uppercase tracking-widest">Sports</TabsTrigger>
          <TabsTrigger value="clipboard" className="flex-1 rounded-[2rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all text-sm uppercase tracking-widest">Clipboard</TabsTrigger>
          <TabsTrigger value="fixtures" className="flex-1 rounded-[2rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all text-sm uppercase tracking-widest">Fixtures</TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1 rounded-[2rem] font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white h-14 transition-all text-sm uppercase tracking-widest">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="students" className="mt-0">
          <CoachStudents />
        </TabsContent>
        <TabsContent value="sports" className="mt-0">
          <SportsManagement />
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
