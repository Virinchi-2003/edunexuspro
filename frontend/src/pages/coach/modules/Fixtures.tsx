import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  Smartphone, 
  Plus, 
  Loader2, 
  Map, 
  Navigation,
  ChevronRight,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const CoachFixtures: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fixtures, setFixtures] = useState<any[]>([]);

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coach/fixtures/${user.schoolId}`);
      setFixtures(res.data.data);
    } catch (error) {
      toast.error('Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFixtures();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-indigo-50 text-indigo-600 border-none px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest">Scheduled</Badge>;
      case 'ongoing': return <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest animate-pulse">Live Score</Badge>;
      case 'completed': return <Badge className="bg-slate-100 text-slate-500 border-none px-3 py-1 rounded-full font-bold uppercase text-[9px] tracking-widest">Finished</Badge>;
      default: return null;
    }
  };

  if (loading && fixtures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Syncing Sports Calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">Tournament Engine</h2>
            <p className="text-sm text-slate-500 font-medium">Manage inter-school fixtures and result logs</p>
         </div>
         <Button className="rounded-2xl h-12 bg-slate-900 text-white font-bold px-6 shadow-xl shadow-slate-200 gap-2">
            <Plus className="w-4 h-4" /> New Fixture
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {fixtures.map((fixture) => (
          <Card key={fixture.id} className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
             <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-center">
                   {getStatusBadge(fixture.status)}
                   <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-400">
                      <MoreVertical className="w-4 h-4" />
                   </Button>
                </div>
             </CardHeader>
             <CardContent className="p-8 pt-0">
                <div className="flex items-center justify-between gap-6 mb-8">
                   <div className="flex-1 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3 border border-indigo-100">
                         <Trophy className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div className="font-bold text-slate-900 text-sm">EduNexus Pro</div>
                   </div>
                   
                   <div className="flex flex-col items-center gap-1">
                      {fixture.score ? (
                        <div className="text-3xl font-display font-black text-slate-900 tracking-tighter">{fixture.score}</div>
                      ) : (
                        <div className="text-xl font-display font-black text-slate-300 italic">VS</div>
                      )}
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fixture.dateTime.split('T')[1]?.slice(0, 5) || '15:30'}</div>
                   </div>

                   <div className="flex-1 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3 border border-rose-100">
                         <Trophy className="w-8 h-8 text-rose-500" />
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{fixture.opponentName}</div>
                   </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-50">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <MapPin className="w-4 h-4" />
                         </div>
                         <div>
                            <div className="text-xs font-bold text-slate-900">{fixture.venue}</div>
                            <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 cursor-pointer hover:underline">
                               Open in Maps <Navigation className="w-2 h-2" />
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departure</div>
                         <div className="text-xs font-bold text-slate-900">{fixture.departureTime || 'N/A'}</div>
                      </div>
                   </div>

                   <div className="flex items-center gap-2 mt-4 pt-4">
                      <Button className="flex-1 rounded-2xl h-12 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold shadow-none border-none">
                         <Smartphone className="w-4 h-4 mr-2" /> Parents Live Score
                      </Button>
                      <Button className="flex-1 rounded-2xl h-12 bg-slate-900 text-white font-bold shadow-xl shadow-slate-200">
                         {fixture.status === 'completed' ? 'View Analysis' : 'Log Result'}
                      </Button>
                   </div>
                </div>
             </CardContent>
          </Card>
        ))}

        {/* Transportation & Logistics */}
        <Card className="border-none shadow-xl rounded-[3rem] bg-slate-900 text-white p-8 relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Navigation className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-xl font-bold">Logistics Command</h4>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Active Sports Trips</p>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <Navigation className="w-5 h-5 text-indigo-400" />
                       </div>
                       <div>
                          <div className="text-sm font-bold">Bus # Sports-01</div>
                          <div className="text-[10px] text-slate-400">En route to National Stadium</div>
                       </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold text-[9px] px-3 py-1 rounded-full">On Time</Badge>
                 </div>
              </div>
           </div>
           
           <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
              <Button className="w-full rounded-2xl h-14 bg-white text-slate-900 font-bold text-base shadow-xl hover:bg-slate-50 transition-all">
                 <Map className="w-5 h-5 mr-2" /> Live Fleet Tracking
              </Button>
           </div>
        </Card>
      </div>

      {/* Trophy Section */}
      <Card className="border-none shadow-2xl rounded-[3rem] bg-gradient-to-r from-amber-400 to-amber-600 text-white p-10 overflow-hidden relative">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full -mr-48 -mt-48 blur-3xl" />
         <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Trophy className="w-10 h-10" />
               </div>
               <div>
                  <h3 className="text-3xl font-display font-bold">Institutional Trophy Room</h3>
                  <p className="text-amber-100 font-medium mt-1">Tournament results automatically update the school dashboard.</p>
               </div>
            </div>
            <Button className="rounded-2xl h-14 bg-white text-amber-600 font-bold px-10 shadow-xl shadow-amber-900/10 text-lg hover:bg-amber-50 transition-all">
               View Gallery
            </Button>
         </div>
      </Card>
    </div>
  );
};

export default CoachFixtures;
