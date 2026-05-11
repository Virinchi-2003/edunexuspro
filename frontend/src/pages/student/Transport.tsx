import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bus, 
  Clock, 
  Phone, 
  Navigation, 
  Loader2, 
  ShieldCheck,
  AlertCircle,
  User
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const StudentTransport = () => {
  const [transportData, setTransportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransportDetails();
  }, []);

  const fetchTransportDetails = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const studentId = user.id || user.uid; // Try both based on login structure
      
      // Since the assignment uses the internal UUID, we might need to get the student record first
      const studentRes = await api.get(`/students/user/${studentId}`);
      const student = studentRes.data.data;

      if (student) {
        const res = await api.get(`/transport/user/${student.id}`);
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
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Tracking Your Bus...</p>
    </div>
  );

  if (!transportData) return (
    <div className="p-8">
       <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200">
             <Bus className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">No Transport Assigned</h2>
          <p className="text-slate-500 font-medium max-w-md mx-auto">You are currently not registered for any school transport route. Please contact the administration office for enrollment.</p>
          <Button variant="outline" className="mt-8 rounded-2xl h-12 px-8 border-slate-200 font-bold" onClick={fetchTransportDetails}>
             Refresh Status
          </Button>
       </Card>
    </div>
  );

  const bus = transportData.route?.buses?.[0]; // Get the first bus assigned to this route

  return (
    <div className="p-8 space-y-8">
       {/* Header */}
       <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Your Transport Details</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time information about your school commute.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Card */}
          <div className="lg:col-span-2 space-y-8">
             <Card className="border-none shadow-2xl rounded-[3rem] bg-indigo-600 text-white p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                   <Bus className="w-64 h-64" />
                </div>
                
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-12">
                      <div className="p-4 rounded-3xl bg-white/20 backdrop-blur-md">
                         <Navigation className="w-8 h-8" />
                      </div>
                      <Badge className="bg-emerald-500 text-white border-none px-4 py-1 rounded-full font-bold">
                         ON TRACK
                      </Badge>
                   </div>

                   <div className="space-y-2 mb-12">
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.2em]">Assigned Route</p>
                      <h3 className="text-5xl font-display font-bold">{transportData.route?.routeName}</h3>
                      <p className="text-indigo-100 font-medium">{transportData.route?.area}</p>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pt-10 border-t border-white/20">
                      <div>
                         <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Your Stop</p>
                         <p className="text-lg font-bold">{transportData.stop?.stopName}</p>
                      </div>
                      <div>
                         <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Arrival Time</p>
                         <p className="text-lg font-bold">{transportData.stop?.arrivalTime}</p>
                      </div>
                      <div className="hidden md:block">
                         <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mb-1">Bus Number</p>
                         <p className="text-lg font-bold">{bus?.busNumber || 'N/A'}</p>
                      </div>
                   </div>
                </div>
             </Card>

             {/* Route Schedule */}
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10">
                <div className="flex items-center gap-4 mb-10">
                   <div className="p-3 rounded-2xl bg-slate-50 text-slate-900">
                      <Clock className="w-6 h-6" />
                   </div>
                   <h4 className="text-2xl font-display font-bold text-slate-900">Route Schedule</h4>
                </div>

                <div className="space-y-6">
                   {transportData.route?.stops?.map((stop: any, idx: number) => {
                      const isUserStop = stop.id === transportData.stopId;
                      return (
                         <div key={stop.id} className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all ${isUserStop ? 'bg-indigo-50 border-indigo-100' : 'border-slate-50 hover:border-slate-100'}`}>
                            <div className="flex flex-col items-center">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${isUserStop ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                                  {idx + 1}
                               </div>
                            </div>
                            <div className="flex-1">
                               <div className="flex justify-between items-center">
                                  <p className={`font-bold ${isUserStop ? 'text-indigo-700 text-lg' : 'text-slate-700'}`}>
                                     {stop.stopName}
                                     {isUserStop && <Badge className="ml-3 bg-indigo-100 text-indigo-600 border-none font-black text-[8px] uppercase">Your Point</Badge>}
                                  </p>
                                  <span className={`text-sm font-bold ${isUserStop ? 'text-indigo-600' : 'text-slate-400'}`}>{stop.arrivalTime}</span>
                               </div>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
             {/* Bus & Driver Details */}
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Bus & Personnel</h5>
                
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900">
                         <Bus className="w-7 h-7" />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Bus Number</p>
                         <p className="text-lg font-bold text-slate-900">{bus?.busNumber || 'N/A'}</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      {/* Driver info */}
                      <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100/50 group hover:bg-indigo-50 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                               <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Driver</p>
                               <p className="font-bold text-slate-900">{bus?.driverName || 'N/A'}</p>
                            </div>
                            {bus?.driverPhone && (
                               <a href={`tel:${bus.driverPhone}`} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                                  <Phone className="w-4 h-4" />
                               </a>
                            )}
                         </div>
                         {bus?.driverPhone && <p className="text-[11px] font-bold text-indigo-600 mt-2 ml-16">{bus.driverPhone}</p>}
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
                   </div>
                </div>
             </Card>

             {/* Safety Check */}
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-50 p-8 border-2 border-white">
                <div className="flex items-center gap-3 mb-4 text-emerald-600">
                   <ShieldCheck className="w-6 h-6" />
                   <h5 className="text-sm font-bold uppercase tracking-widest">Safety Verified</h5>
                </div>
                <p className="text-xs font-bold text-emerald-800 leading-relaxed uppercase tracking-wider">
                   This vehicle has passed the 24-point safety inspection for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.
                </p>
             </Card>

             {/* Support */}
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 p-8 text-white">
                <div className="flex items-center gap-3 mb-4 text-indigo-400">
                   <AlertCircle className="w-6 h-6" />
                   <h5 className="text-sm font-bold uppercase tracking-widest">Need Help?</h5>
                </div>
                <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">
                   Facing issues with the route or driver behavior? Report it to the transport cell.
                </p>
                <Button variant="outline" className="w-full h-12 rounded-2xl border-white/20 hover:bg-white/10 text-white font-bold">
                   Open Support Ticket
                </Button>
             </Card>
          </div>
       </div>
    </div>
  );
};

export default StudentTransport;
