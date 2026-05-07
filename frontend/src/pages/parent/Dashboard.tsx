import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import AnnouncementBoard from '@/components/AnnouncementBoard';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.id}`);
      const sData = studentRes.data.data;
      setStudent(sData);

      if (sData?.id) {
        const [leavesRes] = await Promise.all([
          api.get(`/leaves/student/${sData.id}`),
          api.get(`/portal/dashboard/${sData.id}`),
          api.get(`/portal/notifications/${user.id}`),
          api.get(`/students/homework/${sData.classId}`),
          api.get(`/portal/fees/history/${sData.id}`),
          api.get(`/exams/performance/${sData.id}`)
        ]);
        setLeaves(leavesRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching parent portal data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading && !student) {
    return <div className="flex items-center justify-center min-h-[400px]"><Clock className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Parent Portal</h2>
          <p className="text-slate-500 font-medium mt-1">Managing: {student?.name} • Class {student?.grade}-{student?.section}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Profile Summary */}
          <Card className="border-none shadow-xl overflow-hidden rounded-[2.5rem] bg-white">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-700" />
            <CardContent className="pt-0 -mt-12 text-center p-8">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-lg">
                <User className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{student?.name}</h3>
              <p className="text-sm text-slate-500 font-mono mb-6">{student?.studentId}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge className="bg-indigo-50 text-indigo-700 border-none px-3 py-1">Grade {student?.grade}-{student?.section}</Badge>
                <Badge className="bg-rose-50 text-rose-700 border-none px-3 py-1">Blood: {student?.bloodGroup || 'N/A'}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Leave History Card */}
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
             <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-bold text-slate-900">Recent Leaves</h3>
                   <Badge className="bg-indigo-50 text-indigo-600 border-none">AI Monitored</Badge>
                </div>
                <div className="space-y-4">
                   {leaves.slice(0, 3).map(leave => (
                      <div key={leave.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-colors">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{leave.startDate}</span>
                            <Badge className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                               leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                               leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                               {leave.status}
                            </Badge>
                         </div>
                         <p className="text-xs font-bold text-slate-700 line-clamp-1 mb-1">{leave.reason}</p>
                         {leave.aiReason && (
                            <p className="text-[10px] text-indigo-600 font-medium italic opacity-70">AI: {leave.aiReason}</p>
                         )}
                      </div>
                   ))}
                   {leaves.length === 0 && (
                      <p className="text-center py-8 text-slate-400 text-sm font-medium italic">No leave history recorded.</p>
                   )}
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Attendance</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900">94.5%</h3>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 w-fit px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Excellent Presence
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fees Status</p>
                  <h3 className="text-3xl font-display font-bold text-slate-900">₹12,400</h3>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 w-fit px-3 py-1 rounded-full">
                Due in 5 days
              </div>
            </CardContent>
          </Card>

          <div className="sm:col-span-2">
            <AnnouncementBoard limit={3} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
