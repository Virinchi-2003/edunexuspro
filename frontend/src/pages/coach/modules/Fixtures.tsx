import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  MapPin, 
  Plus, 
  Loader2, 
  Navigation,
  MoreVertical,
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  Activity,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const CoachFixtures: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [sports, setSports] = useState<any[]>([]);
  const [trophies, setTrophies] = useState<any[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isTrophyModalOpen, setIsTrophyModalOpen] = useState(false);
  const [isAddTrophyOpen, setIsAddTrophyOpen] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    sportId: '',
    opponentName: '',
    venue: '',
    dateTime: '',
    departureTime: ''
  });

  const [trophyFormData, setTrophyFormData] = useState({
    sportId: '',
    tournamentName: '',
    awardTitle: '',
    year: new Date().getFullYear().toString(),
    photoURL: '',
    description: ''
  });

  const [resultData, setResultData] = useState({
    score: '',
    result: 'win', // win, loss, draw
    status: 'completed'
  });

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

  const fetchSports = async () => {
    try {
      const res = await api.get(`/coach/sports/${user.schoolId}`);
      setSports(res.data.data);
    } catch (error) {
      console.error('Failed to load sports');
    }
  };

  const fetchTrophies = async () => {
    try {
      const res = await api.get(`/coach/trophies/${user.schoolId}`);
      setTrophies(res.data.data);
    } catch (error) {
      console.error('Failed to load trophies');
    }
  };

  useEffect(() => {
    fetchFixtures();
    fetchSports();
    fetchTrophies();
  }, []);

  const handleAddFixture = async () => {
    if (!formData.sportId || !formData.opponentName || !formData.dateTime) return toast.error('Please fill all required fields');
    try {
      setSaving(true);
      await api.post('/coach/fixtures', { ...formData, schoolId: user.schoolId });
      toast.success('Fixture scheduled successfully');
      setIsAddModalOpen(false);
      fetchFixtures();
    } catch (error) {
      toast.error('Failed to schedule fixture');
    } finally {
      setSaving(false);
    }
  };

  const handleLogResult = async () => {
    try {
      setSaving(true);
      await api.put(`/coach/fixtures/${selectedFixture.id}`, resultData);
      toast.success('Result logged successfully');
      setIsResultModalOpen(false);
      fetchFixtures();
    } catch (error) {
      toast.error('Failed to log result');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFixture = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fixture?')) return;
    try {
      await api.delete(`/coach/fixtures/${id}`);
      toast.success('Fixture deleted');
      fetchFixtures();
    } catch (error) {
      toast.error('Failed to delete fixture');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return toast.error('Image too large (max 2MB)');
      const reader = new FileReader();
      reader.onloadend = () => {
        setTrophyFormData({ ...trophyFormData, photoURL: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTrophy = async () => {
    if (!trophyFormData.tournamentName || !trophyFormData.awardTitle) return toast.error('Fill required fields');
    try {
      setSaving(true);
      await api.post('/coach/trophies', { ...trophyFormData, schoolId: user.schoolId });
      toast.success('Trophy added to gallery!');
      setIsAddTrophyOpen(false);
      fetchTrophies();
    } catch (error) {
      toast.error('Failed to add trophy');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrophy = async (id: string) => {
    if (!confirm('Remove this achievement?')) return;
    try {
      await api.delete(`/coach/trophies/${id}`);
      toast.success('Trophy removed');
      fetchTrophies();
    } catch (error) {
      toast.error('Failed to remove trophy');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-[0.1em]">Scheduled</Badge>;
      case 'ongoing': return <Badge className="bg-rose-50 text-rose-600 border-none px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-[0.1em] flex items-center gap-2 animate-pulse"><Activity className="w-3 h-3" /> Live Score</Badge>;
      case 'completed': return <Badge className="bg-slate-900 text-white border-none px-4 py-1.5 rounded-full font-bold uppercase text-[10px] tracking-[0.1em]">Finished</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
         <div>
            <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Tournament Engine</h2>
            <p className="text-slate-500 font-medium mt-1">Manage inter-school fixtures and result logs</p>
         </div>
         <Button 
           className="rounded-2xl h-14 bg-slate-900 text-white font-bold px-8 shadow-xl shadow-slate-200 gap-2 hover:scale-[1.02] transition-transform text-lg"
           onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-6 h-6" /> New Fixture
         </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading && fixtures.length === 0 ? (
           Array.from({ length: 4 }).map((_, i) => (
             <Card key={i} className="animate-pulse bg-slate-50 border-none h-64 rounded-[3rem]" />
           ))
        ) : fixtures.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-slate-100">
             <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-200">
               <Trophy className="w-12 h-12" />
             </div>
             <h3 className="text-xl font-bold text-slate-900">No Fixtures Scheduled</h3>
             <p className="text-slate-400 mt-2 font-medium">Schedule your first match to start tracking results</p>
          </div>
        ) : (
          fixtures.map((fixture) => (
            <Card key={fixture.id} className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
               <CardHeader className="p-10 pb-4">
                  <div className="flex justify-between items-center">
                     {getStatusBadge(fixture.status)}
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-300 hover:text-slate-900">
                             <MoreVertical className="w-5 h-5" />
                          </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2">
                         <DropdownMenuItem 
                           className="rounded-xl text-rose-500 font-bold focus:bg-rose-50 focus:text-rose-600 cursor-pointer"
                           onClick={() => handleDeleteFixture(fixture.id)}
                         >
                           <Trash2 className="w-4 h-4 mr-2" /> Delete Fixture
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               </CardHeader>
               <CardContent className="p-10 pt-0">
                  <div className="flex items-center justify-between gap-8 mb-10">
                     <div className="flex-1 text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                           <Trophy className="w-10 h-10 text-indigo-600" />
                        </div>
                        <div className="font-bold text-slate-900 text-base">EduNexus Pro</div>
                        <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{fixture.sport?.name || 'Home Team'}</div>
                     </div>
                     
                     <div className="flex flex-col items-center gap-2">
                        {fixture.score ? (
                          <div className="text-5xl font-display font-black text-slate-900 tracking-tighter bg-slate-50 px-6 py-2 rounded-2xl">{fixture.score}</div>
                        ) : (
                          <div className="text-3xl font-display font-black text-slate-200 italic tracking-widest">VS</div>
                        )}
                        <div className="flex flex-col items-center">
                           <div className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{new Date(fixture.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(fixture.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                     </div>
  
                     <div className="flex-1 text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-rose-50 flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-xl shadow-rose-100 group-hover:scale-110 transition-transform duration-500">
                           <Trophy className="w-10 h-10 text-rose-500" />
                        </div>
                        <div className="font-bold text-slate-900 text-base">{fixture.opponentName}</div>
                        <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Visiting Team</div>
                     </div>
                  </div>
  
                  <div className="space-y-6 pt-8 border-t border-slate-50">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                              <MapPin className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-slate-900">{fixture.venue}</div>
                              <div className="text-[10px] text-indigo-600 font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:text-indigo-700 transition-colors">
                                 Open Arena View <Navigation className="w-2.5 h-2.5" />
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departure</div>
                           <div className="text-sm font-bold text-slate-900 flex items-center gap-2 justify-end">
                              <Clock className="w-4 h-4 text-indigo-400" />
                              {fixture.departureTime || 'Direct'}
                           </div>
                        </div>
                     </div>
  
                     <div className="flex items-center gap-4 mt-6">
                        <Button 
                          className="w-full rounded-[1.5rem] h-14 bg-slate-900 text-white font-bold shadow-2xl shadow-slate-200 hover:scale-[1.02] transition-transform"
                          onClick={() => {
                            setSelectedFixture(fixture);
                            setResultData({
                              score: fixture.score || '',
                              result: fixture.result || 'win',
                              status: fixture.status || 'completed'
                            });
                            setIsResultModalOpen(true);
                          }}
                        >
                           {fixture.status === 'completed' ? 'Update Analysis' : 'Log Result'}
                        </Button>
                     </div>
                  </div>
               </CardContent>
            </Card>
          ))
        )}

        <Card className="border-none shadow-xl rounded-[3rem] bg-slate-900 text-white p-10 relative overflow-hidden flex flex-col justify-between group">
           <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full -mr-40 -mt-40 blur-[100px] group-hover:bg-emerald-500/30 transition-all duration-1000" />
           <div className="relative z-10">
              <div className="flex items-center gap-5 mb-10">
                 <div className="w-16 h-16 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                    <Navigation className="w-8 h-8" />
                 </div>
                 <div>
                    <h4 className="text-2xl font-display font-bold">Logistics Command</h4>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-1">Active Sports Trips</p>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                          <Navigation className="w-6 h-6 text-indigo-400" />
                       </div>
                       <div>
                          <div className="text-base font-bold text-white">Bus # Sports-01</div>
                          <div className="text-xs text-slate-400">En route to National Stadium</div>
                       </div>
                    </div>
                    <Badge className="bg-emerald-500 text-white border-none font-bold text-[10px] px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">ON TIME</Badge>
                 </div>
              </div>
           </div>
           
           <div className="mt-10 pt-10 border-t border-white/5 relative z-10 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Monitoring Active</p>
           </div>
        </Card>
      </div>

      <Card className="border-none shadow-2xl rounded-[3rem] bg-gradient-to-r from-amber-400 to-amber-600 text-white p-12 overflow-hidden relative group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full -mr-64 -mt-64 blur-[120px] group-hover:scale-110 transition-transform duration-1000" />
         <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
            <div className="flex items-center gap-8">
               <div className="w-24 h-24 rounded-[2.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center border-2 border-white/30 shadow-2xl shadow-amber-900/20">
                  <Trophy className="w-12 h-12" />
               </div>
               <div>
                  <h3 className="text-4xl font-display font-bold tracking-tight">Institutional Trophy Room</h3>
                  <p className="text-amber-50 font-medium mt-2 text-lg opacity-90">Tournament results automatically update the school dashboard.</p>
               </div>
            </div>
            <Button 
              className="rounded-[1.5rem] h-16 bg-white text-amber-600 font-bold px-12 shadow-2xl shadow-amber-900/20 text-xl hover:scale-[1.05] transition-all"
              onClick={() => setIsTrophyModalOpen(true)}
            >
               View Gallery
            </Button>
         </div>
      </Card>

      {/* Trophy Gallery Modal */}
      <Dialog open={isTrophyModalOpen} onOpenChange={setIsTrophyModalOpen}>
        <DialogContent className="sm:max-w-[900px] rounded-[3rem] p-12 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-4xl font-display font-bold text-slate-900">Institutional Trophy Room</DialogTitle>
              <DialogDescription className="font-medium text-slate-500 mt-2 text-lg">A legacy of excellence and institutional pride.</DialogDescription>
            </div>
            <Button 
              className="rounded-2xl h-12 bg-amber-500 text-white font-bold gap-2 px-6 shadow-xl shadow-amber-200"
              onClick={() => setIsAddTrophyOpen(true)}
            >
              <Plus className="w-5 h-5" /> Record Win
            </Button>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-10">
            {trophies.length === 0 ? (
               <div className="col-span-full py-20 text-center text-slate-400">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-xs">The trophy cabinet is waiting for its first victory</p>
               </div>
            ) : (
              trophies.map((t) => (
                <Card key={t.id} className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    {t.photoURL ? (
                      <img src={t.photoURL} alt={t.tournamentName} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600">
                        <Trophy className="w-16 h-16 text-white/50" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-black/20 text-white hover:bg-rose-500 transition-colors"
                        onClick={() => handleDeleteTrophy(t.id)}
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                    <Badge className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-md text-white border-none font-bold">
                       {t.year}
                    </Badge>
                  </div>
                  <CardContent className="p-8">
                    <h5 className="text-xl font-bold text-slate-900 line-clamp-1">{t.awardTitle}</h5>
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">{t.tournamentName}</p>
                    <div className="mt-6 flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                         <Activity className="w-4 h-4" />
                       </div>
                       <span className="text-xs font-bold text-slate-500">{t.sport?.name || 'General Sports'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Trophy Modal */}
      <Dialog open={isAddTrophyOpen} onOpenChange={setIsAddTrophyOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Record Achievement</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Log a new victory into the school's history books.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tournament Name</label>
              <Input 
                placeholder="e.g. Regional Inter-School Championship" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                value={trophyFormData.tournamentName}
                onChange={(e) => setTrophyFormData({...trophyFormData, tournamentName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Award Title</label>
              <Input 
                placeholder="e.g. Winner (Gold Medal)" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                value={trophyFormData.awardTitle}
                onChange={(e) => setTrophyFormData({...trophyFormData, awardTitle: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sport</label>
                <select 
                  className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none"
                  value={trophyFormData.sportId}
                  onChange={(e) => setTrophyFormData({...trophyFormData, sportId: e.target.value})}
                >
                  <option value="">Select sport...</option>
                  {sports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Year</label>
                <Input 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={trophyFormData.year}
                  onChange={(e) => setTrophyFormData({...trophyFormData, year: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Moment of Victory (Photo)</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  id="trophy-photo"
                  onChange={handleFileChange}
                />
                <label 
                  htmlFor="trophy-photo"
                  className="flex flex-col items-center justify-center w-full h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 cursor-pointer group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all overflow-hidden"
                >
                  {trophyFormData.photoURL ? (
                    <img src={trophyFormData.photoURL} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 mb-2 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-500">Upload Team Photo</span>
                    </>
                  )}
                </label>
                {trophyFormData.photoURL && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-rose-500"
                    onClick={() => setTrophyFormData({ ...trophyFormData, photoURL: '' })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-amber-500 hover:bg-amber-600 text-white font-bold text-xl shadow-2xl shadow-amber-200"
              onClick={handleAddTrophy}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trophy className="w-6 h-6 mr-3" />}
              Archive Achievement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Fixture Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Schedule Fixture</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Initialize a new inter-school match in the sports engine.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Sport</label>
              <select 
                className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-indigo-100"
                value={formData.sportId}
                onChange={(e) => setFormData({...formData, sportId: e.target.value})}
              >
                <option value="">Choose activity...</option>
                {sports.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Opponent Name</label>
              <Input 
                placeholder="e.g. St. Xavier's International" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold text-lg"
                value={formData.opponentName}
                onChange={(e) => setFormData({...formData, opponentName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Venue</label>
              <Input 
                placeholder="e.g. National Stadium / Home Ground" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date & Time</label>
                <Input 
                  type="datetime-local" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-4 font-bold"
                  value={formData.dateTime}
                  onChange={(e) => setFormData({...formData, dateTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Departure</label>
                <Input 
                  placeholder="e.g. 02:30 PM" 
                  className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-bold"
                  value={formData.departureTime}
                  onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xl shadow-2xl shadow-slate-200"
              onClick={handleAddFixture}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Calendar className="w-6 h-6 mr-3" />}
              Launch Match Engine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Result Modal */}
      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[3rem] p-12 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold text-slate-900">Match Result</DialogTitle>
            <DialogDescription className="font-medium text-slate-500 mt-2">Log final outcome vs {selectedFixture?.opponentName}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Score Line</label>
              <Input 
                placeholder="e.g. 3 - 1" 
                className="rounded-2xl h-16 bg-slate-50 border-none px-8 font-black text-3xl text-center tracking-tighter"
                value={resultData.score}
                onChange={(e) => setResultData({...resultData, score: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
               {['win', 'loss', 'draw'].map((res) => (
                 <Button
                   key={res}
                   variant={resultData.result === res ? 'default' : 'outline'}
                   className={`h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest border-2 transition-all ${
                     resultData.result === res 
                     ? (res === 'win' ? 'bg-emerald-500 border-emerald-500' : res === 'loss' ? 'bg-rose-500 border-rose-500' : 'bg-slate-900 border-slate-900')
                     : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'
                   }`}
                   onClick={() => setResultData({...resultData, result: res})}
                 >
                   {res}
                 </Button>
               ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
              <select 
                className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-900 appearance-none focus:ring-2 focus:ring-indigo-100"
                value={resultData.status}
                onChange={(e) => setResultData({...resultData, status: e.target.value})}
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Live / Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xl shadow-2xl shadow-indigo-100"
              onClick={handleLogResult}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6 mr-3" />}
              Archive Match Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CoachFixtures;
