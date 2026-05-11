import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bus, 
  Clock, 
  Phone, 
  Navigation, 
  Loader2, 
  ShieldCheck,
  User
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const TeacherTransport = () => {
  const [transportData, setTransportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransportDetails();
  }, []);

  const fetchTransportDetails = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const staffId = user.id || user.uid;
      
      // Get the internal UUID for the staff record
      const staffRes = await api.get(`/staff/user/${staffId}`);
      const staff = staffRes.data.data;

      if (staff) {
        const res = await api.get(`/transport/user/${staff.id}`);
        setTransportData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching transport:", error);
      toast.error("Failed to load transport details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching Transport Route...</p>
    </div>
  );

  if (!transportData) return (
    <div className="p-8">
       <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200">
             <Bus className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">No Transport Assigned</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">You have not been assigned to a school transport route. If you require transport facilities, please update your profile or contact the administration.</p>
       </Card>
    </div>
  );

  const bus = transportData.route?.buses?.[0];

  return (
    <div className="p-8 space-y-8">
       <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Staff Transport</h2>
          <p className="text-slate-500 font-medium mt-1">Commute details and real-time route schedule.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                   <Navigation className="w-64 h-64" />
                </div>
                
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-12">
                      <div className="p-4 rounded-3xl bg-white/10 backdrop-blur-md">
                         <Bus className="w-8 h-8 text-indigo-400" />
                      </div>
                      <Badge className="bg-indigo-500 text-white border-none px-4 py-1 rounded-full font-bold">
                         STAFF COMMUTE
                      </Badge>
                   </div>

                   <div className="space-y-2 mb-12">
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Current Assignment</p>
                      <h3 className="text-5xl font-display font-bold">{transportData.route?.routeName}</h3>
                      <p className="text-slate-400 font-medium">{transportData.route?.area}</p>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-10 border-t border-white/10">
                      <div>
                         <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Assigned Point</p>
                         <p className="text-lg font-bold">{transportData.stop?.stopName}</p>
                      </div>
                      <div>
                         <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Pick-up Time</p>
                         <p className="text-lg font-bold text-indigo-400">{transportData.stop?.arrivalTime}</p>
                      </div>
                      <div className="hidden md:block">
                         <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Bus Number</p>
                         <p className="text-lg font-bold">{bus?.busNumber || 'N/A'}</p>
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10">
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-3 rounded-2xl bg-slate-50 text-slate-900">
                      <Clock className="w-6 h-6" />
                   </div>
                   <h4 className="text-2xl font-display font-bold text-slate-900">Route Stops</h4>
                </div>

                <div className="space-y-4">
                   {transportData.route?.stops?.map((stop: any, idx: number) => {
                      const isUserStop = stop.id === transportData.stopId;
                      return (
                         <div key={stop.id} className={`flex items-center gap-6 p-5 rounded-2xl border transition-all ${isUserStop ? 'bg-slate-50 border-slate-900' : 'border-slate-50'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${isUserStop ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                               {idx + 1}
                            </div>
                            <div className="flex-1 flex justify-between items-center">
                               <p className={`font-bold ${isUserStop ? 'text-slate-900' : 'text-slate-500'}`}>{stop.stopName}</p>
                               <span className="text-xs font-bold text-slate-400">{stop.arrivalTime}</span>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </Card>
          </div>

          <div className="space-y-8">
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <User className="w-6 h-6" />
                   </div>
                   <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Commute Team</h5>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-4">
                      {/* Driver info */}
                      <div className="p-5 rounded-3xl bg-slate-900 text-white group hover:bg-slate-800 transition-all shadow-xl shadow-slate-100">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                               <User className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div className="flex-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Lead Driver</p>
                               <p className="font-bold text-white">{bus?.driverName || 'N/A'}</p>
                            </div>
                            {bus?.driverPhone && (
                               <a href={`tel:${bus.driverPhone}`} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                                  <Phone className="w-4 h-4" />
                               </a>
                            )}
                         </div>
                         {bus?.driverPhone && <p className="text-[11px] font-bold text-indigo-400 mt-2 ml-16">{bus.driverPhone}</p>}
                      </div>

                      {/* Cleaner info */}
                      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-slate-100 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-600">
                               <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cleaner</p>
                               <p className="font-bold text-slate-900">{bus?.cleanerName || 'N/A'}</p>
                            </div>
                            {bus?.cleanerPhone && (
                               <a href={`tel:${bus.cleanerPhone}`} className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-300 transition-colors">
                                  <Phone className="w-4 h-4" />
                               </a>
                            )}
                         </div>
                         {bus?.cleanerPhone && <p className="text-[11px] font-bold text-slate-500 mt-2 ml-16">{bus.cleanerPhone}</p>}
                      </div>
                      
                      <div className="flex justify-between items-center px-4 pt-2">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehicle Type</span>
                         <span className="text-xs font-bold text-slate-900 uppercase">{bus?.vehicleType || 'Bus'}</span>
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                   <ShieldCheck className="w-6 h-6" />
                   <h5 className="text-sm font-bold uppercase tracking-widest">Staff Priority</h5>
                </div>
                <p className="text-xs font-medium text-indigo-100 leading-relaxed mb-6">
                   As staff members, you have priority boarding. Please ensure you are at the stop 5 minutes before scheduled arrival.
                </p>
                <div className="p-4 rounded-2xl bg-white/10 text-[10px] font-bold uppercase tracking-widest text-center border border-white/20">
                   Emergency Cell: 1800-TRANS-99
                </div>
             </Card>
          </div>
       </div>
    </div>
  );
};

export default TeacherTransport;
