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
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.id}`);
      const sData = studentRes.data.data;
      setStudent(sData);

      if (sData?.id) {
        await Promise.all([
          api.get(`/portal/dashboard/${sData.id}`),
          api.get(`/portal/notifications/${user.id}`),
          api.get(`/students/homework/${sData.classId}`),
          api.get(`/portal/fees/history/${sData.id}`),
          api.get(`/exams/performance/${sData.id}`),
          api.get(`/students/leave/${sData.id}`)
        ]);
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
        <div className="flex gap-3">
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary to-indigo-600" />
          <CardContent className="pt-0 -mt-12 text-center">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <User className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{student?.name}</h3>
            <p className="text-sm text-slate-500 font-mono">{student?.studentId}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">Grade {student?.grade}-{student?.section}</Badge>
              <Badge variant="secondary">Blood: {student?.bloodGroup || 'N/A'}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Attendance</p>
                  <h3 className="text-2xl font-bold text-slate-900">94.5%</h3>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Excellent Presence
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Fees Status</p>
                  <h3 className="text-2xl font-bold text-slate-900">₹12,400</h3>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-600 font-bold">
                Due in 5 days
              </div>
            </CardContent>
          </Card>

          <AnnouncementBoard limit={3} />
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
