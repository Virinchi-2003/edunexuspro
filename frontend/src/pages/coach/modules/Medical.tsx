import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  ShieldAlert, 
  Smartphone, 
  Loader2, 
  Scale, 
  Timer, 
  Zap, 
  Phone, 
  MoreVertical,
  CheckCircle2,
  Watch
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const CoachMedical: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSport, setActiveSport] = useState<any>(null);
  const [sportsList, setSportsList] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coach/sports/${user.schoolId}`);
      setSportsList(res.data.data);
      if (res.data.data.length > 0) setActiveSport(res.data.data[0]);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAthletes = async (sportId: string) => {
    try {
      const res = await api.get(`/coach/students/${sportId}`);
      const studentData = res.data.data.map((e: any) => e.student);
      
      // Fetch medical records for each student
      const medicalPromises = studentData.map((s: any) => api.get(`/coach/medical/${s.id}`));
      const medicalResponses = await Promise.all(medicalPromises);
      
      const fullData = studentData.map((s: any, idx: number) => ({
        ...s,
        medical: medicalResponses[idx].data.data
      }));
      
      setAthletes(fullData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeSport) fetchAthletes(activeSport.id);
  }, [activeSport]);

  if (loading && sportsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-rose-600" />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Accessing Medical Vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">Medical & Fitness Vault</h2>
            <p className="text-sm text-slate-500 font-medium">Critical health metrics and emergency protocols</p>
         </div>
         <div className="flex flex-wrap gap-2">
            {sportsList.map((sport) => (
              <Button
                key={sport.id}
                variant={activeSport?.id === sport.id ? 'default' : 'outline'}
                onClick={() => setActiveSport(sport)}
                className={`rounded-xl h-10 px-4 font-bold transition-all ${
                  activeSport?.id === sport.id 
                    ? 'bg-rose-500 text-white shadow-lg border-none' 
                    : 'bg-white border-slate-100 text-slate-500'
                }`}
              >
                {sport.name}
              </Button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
               <CardHeader className="p-8 pb-0">
                  <div className="flex justify-between items-center">
                     <CardTitle className="text-xl font-bold">Athlete Vitals</CardTitle>
                     <Badge className="bg-rose-50 text-rose-500 border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1 rounded-full">Secure HIPAA Compliant</Badge>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full">
                        <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                           <tr>
                              <th className="px-8 py-6 text-left">Athlete</th>
                              <th className="px-8 py-6 text-center">BMI</th>
                              <th className="px-8 py-6 text-center">Stamina</th>
                              <th className="px-8 py-6 text-center">Sprint (sec)</th>
                              <th className="px-8 py-6 text-right">Medical Flags</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {athletes.map((athlete) => (
                             <tr key={athlete.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                                         {athlete.name.charAt(0)}
                                      </div>
                                      <div>
                                         <div className="font-bold text-slate-900 text-sm">{athlete.name}</div>
                                         <div className="text-[10px] text-slate-400 font-medium">ID: {athlete.studentId}</div>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-6 text-center font-bold text-slate-600">{athlete.medical?.bmi || '21.4'}</td>
                                <td className="px-8 py-6 text-center">
                                   <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] px-2 py-0.5">{athlete.medical?.staminaScore || '85'}/100</Badge>
                                </td>
                                <td className="px-8 py-6 text-center font-mono text-sm text-slate-500">{athlete.medical?.sprintTime || '11.8'}s</td>
                                <td className="px-8 py-6 text-right">
                                   <div className="flex justify-end gap-1">
                                      {JSON.parse(athlete.medical?.medicalFlags || '[]').map((flag: string, i: number) => (
                                        <Badge key={i} className="bg-rose-500 text-white border-none text-[8px] px-1.5 py-0 rounded-sm font-bold">{flag}</Badge>
                                      ))}
                                      {JSON.parse(athlete.medical?.medicalFlags || '[]').length === 0 && (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      )}
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white p-8 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
               <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                     <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                           <Watch className="w-6 h-6" />
                        </div>
                        <div>
                           <h4 className="text-xl font-bold">Elite Integration</h4>
                           <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Garmin & Fitbit Sync</p>
                        </div>
                     </div>
                     <p className="text-sm text-slate-400 leading-relaxed mb-8">
                        Automated vitals tracking and sleep analysis available on Elite plan accounts. Hook into student wearable APIs for pro-level training load analysis.
                     </p>
                  </div>
                  <Button className="w-full rounded-2xl h-14 bg-white/10 backdrop-blur-md text-white font-bold border border-white/20 hover:bg-white/20 transition-all">
                     Configure Wearables
                  </Button>
               </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-rose-50 p-8 border border-rose-100">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
                     <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                     <h4 className="text-lg font-bold text-rose-900">Emergency Protocol</h4>
                     <p className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.15em]">One-Tap Fast Dial</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {athletes.filter(a => JSON.parse(a.medical?.medicalFlags || '[]').length > 0).slice(0, 3).map((a) => (
                    <div key={a.id} className="p-4 bg-white rounded-2xl border border-rose-100 flex items-center justify-between group hover:shadow-md transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <div>
                             <div className="text-xs font-bold text-slate-900">{a.name}</div>
                             <div className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter">
                                {JSON.parse(a.medical?.medicalFlags || '[]')[0]}
                             </div>
                          </div>
                       </div>
                       <Button size="icon" className="h-10 w-10 rounded-xl bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100">
                          <Phone className="w-4 h-4 text-white" />
                       </Button>
                    </div>
                  ))}
               </div>

               <Button variant="outline" className="w-full mt-8 rounded-2xl h-12 border-rose-200 text-rose-600 font-bold hover:bg-rose-100/50">
                  Print Medical Bag Checklist
               </Button>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default CoachMedical;
