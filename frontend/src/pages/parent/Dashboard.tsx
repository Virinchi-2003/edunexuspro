import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  BookOpen, 
  Calendar,
  CreditCard,
  Bell,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        // Parents log in with student role in this system
        // Let's find the student record associated with this user
        const res = await api.get(`/students/user/${user.id}`);
        setStudent(res.data.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Welcome, {user?.name}</h2>
          <p className="text-slate-500">Parent Portal • Ward: {student?.name || 'Loading...'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> ID Card
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700">
            <CreditCard className="w-4 h-4" /> Pay Fees
          </Button>
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
                <AlertCircle className="w-3 h-3" /> Due in 5 days
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" /> Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm text-slate-700 font-medium">Math Assignment Submitted</span>
                  </div>
                  <span className="text-xs text-slate-400">2h ago</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-slate-700 font-medium">Marked Present for today</span>
                  </div>
                  <span className="text-xs text-slate-400">4h ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
