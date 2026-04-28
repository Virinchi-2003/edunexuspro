import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Calendar,
  Layout,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const StudentHomework: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const studentRes = await api.get(`/students/user/${user.id}`);
      const sData = studentRes.data.data;
      setStudent(sData);

      if (sData?.classId) {
        const res = await api.get(`/students/homework/${sData.classId}`);
        setHomeworks(res.data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const getStatusColor = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));

    if (days < 0) return 'text-rose-500 bg-rose-50';
    if (days <= 2) return 'text-amber-500 bg-amber-50';
    return 'text-emerald-500 bg-emerald-50';
  };

  const filteredHomework = homeworks.filter(h => 
    h.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Academic Homework</h2>
          <p className="text-slate-500 font-medium mt-1">Keep track of your assignments and submission deadlines.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                 placeholder="Search by subject or title..." 
                 className="pl-11 rounded-2xl h-12 border-slate-100 bg-white shadow-xl shadow-slate-100/50"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[40vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching Assignments...</p>
        </div>
      ) : filteredHomework.length === 0 ? (
        <Card className="border-none shadow-sm bg-slate-50/50 rounded-[3rem] py-20 flex flex-col items-center justify-center">
           <BookOpen className="w-16 h-16 text-slate-200 mb-6" />
           <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
           <p className="text-slate-400 mt-2 font-medium">No homework assignments found for your class.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {filteredHomework.map((homework) => (
             <Card key={homework.id} className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                <div className="p-8 flex-1">
                   <div className="flex justify-between items-start mb-6">
                      <Badge className={`${getStatusColor(homework.dueDate)} border-none px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider`}>
                        {homework.subject}
                      </Badge>
                      <div className="flex items-center gap-2 text-slate-400">
                         <Clock className="w-4 h-4" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Due {new Date(homework.dueDate).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <h3 className="text-2xl font-display font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors">{homework.title}</h3>
                   <p className="text-slate-500 font-medium leading-relaxed line-clamp-3 mb-6">
                     {homework.description || 'No detailed instructions provided.'}
                   </p>
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200" />
                      <span className="text-xs font-bold text-slate-400">Assigned by Faculty</span>
                   </div>
                   <Button className="rounded-xl gap-2 font-bold bg-slate-900 text-white shadow-lg">
                      <Download className="w-4 h-4" /> Resources
                   </Button>
                </div>
             </Card>
           ))}
        </div>
      )}
    </div>
  );
};

export default StudentHomework;
