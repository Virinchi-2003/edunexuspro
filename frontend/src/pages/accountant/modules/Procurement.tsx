import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Loader2,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  Archive
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const AccountantProcurement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/accountant/requisitions/${user.schoolId}`);
      setRequisitions(res.data.data);
    } catch (error) {
      toast.error('Failed to load requisitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setSaving(true);
      await api.put(`/accountant/requisitions/${id}`, { status });
      toast.success(`Request marked as ${status}`);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredReqs = requisitions.filter(r => {
    const matchesSearch = r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (r.reason || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-emerald-50 text-emerald-600';
      case 'rejected': return 'bg-rose-50 text-rose-600';
      case 'ordered': return 'bg-blue-50 text-blue-600';
      default: return 'bg-amber-50 text-amber-600';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Search requirements (kits, pens...)" 
            className="pl-12 h-14 rounded-2xl border-none shadow-xl bg-white focus-visible:ring-2 focus-visible:ring-indigo-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto overflow-x-auto no-scrollbar">
           {['all', 'pending', 'approved', 'ordered', 'rejected'].map((s) => (
              <Button
                key={s}
                variant={filterStatus === s ? 'default' : 'ghost'}
                onClick={() => setFilterStatus(s)}
                className={`rounded-full px-6 h-12 font-bold capitalize whitespace-nowrap ${
                  filterStatus === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white shadow-sm text-slate-500'
                }`}
              >
                {s}
              </Button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
           Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 rounded-[2.5rem] bg-white animate-pulse shadow-xl" />)
        ) : filteredReqs.map((req) => (
          <Card key={req.id} className="border-none shadow-xl rounded-[3rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 group">
             <CardContent className="p-10">
                <div className="flex justify-between items-start mb-8">
                   <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <ShoppingBag className="w-8 h-8" />
                   </div>
                   <div className="flex flex-col items-end gap-2">
                      <Badge className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none ${getStatusStyle(req.status)}`}>
                         {req.status}
                      </Badge>
                      {req.priority === 'high' && (
                         <div className="flex items-center gap-1 text-rose-500 font-black text-[9px] uppercase tracking-tighter">
                            <ShieldAlert className="w-3 h-3" /> Critical Need
                         </div>
                      )}
                   </div>
                </div>

                <div className="space-y-2 mb-8">
                   <h3 className="text-2xl font-bold text-slate-900 leading-tight">{req.itemName}</h3>
                   <p className="text-slate-500 font-medium line-clamp-1">Purpose: {req.reason || 'Not specified'}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 p-6 rounded-3xl bg-slate-50 mb-8">
                   <div className="text-center border-r border-slate-200">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</div>
                      <div className="text-xl font-bold text-slate-900">{req.quantity}</div>
                   </div>
                   <div className="text-center border-r border-slate-200">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</div>
                      <div className="text-lg font-bold text-slate-900 capitalize">{req.priority}</div>
                   </div>
                   <div className="text-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested</div>
                      <div className="text-sm font-bold text-slate-900">{new Date(req.createdAt).toLocaleDateString()}</div>
                   </div>
                </div>

                <div className="flex gap-3">
                   {req.status === 'pending' && (
                      <>
                        <Button 
                           variant="outline" 
                           className="flex-1 h-14 rounded-2xl font-bold border-rose-100 text-rose-500 hover:bg-rose-50"
                           onClick={() => handleUpdateStatus(req.id, 'rejected')}
                           disabled={saving}
                        >
                           Reject
                        </Button>
                        <Button 
                           className="flex-2 h-14 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex-[2]"
                           onClick={() => handleUpdateStatus(req.id, 'approved')}
                           disabled={saving}
                        >
                           Approve Procurement
                        </Button>
                      </>
                   )}
                   {req.status === 'approved' && (
                      <Button 
                        className="w-full h-14 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        onClick={() => handleUpdateStatus(req.id, 'ordered')}
                        disabled={saving}
                      >
                         <Truck className="w-5 h-5" /> Mark as Ordered
                      </Button>
                   )}
                   {req.status === 'ordered' && (
                      <div className="w-full h-14 flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 rounded-2xl">
                         <CheckCircle2 className="w-5 h-5" /> Procurement Complete
                      </div>
                   )}
                </div>
             </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccountantProcurement;
