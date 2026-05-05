import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const AccountantSupport: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/accountant/tickets/${user.schoolId}`);
      setTickets(res.data.data);
    } catch (error) {
      toast.error('Failed to load support tickets');
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
      await api.put(`/accountant/tickets/${id}`, { status });
      toast.success(`Ticket marked as ${status}`);
      setIsDetailModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (t.student?.name || t.staff?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
          <Input 
            placeholder="Search queries or names..." 
            className="pl-12 h-14 rounded-2xl border-none shadow-xl bg-white focus-visible:ring-2 focus-visible:ring-amber-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {['all', 'fee_issue', 'scholarship', 'technical', 'complaint'].map((cat) => (
              <Button
                key={cat}
                variant={filterCategory === cat ? 'default' : 'ghost'}
                onClick={() => setFilterCategory(cat)}
                className={`rounded-full px-6 h-12 font-bold capitalize whitespace-nowrap ${
                  filterCategory === cat ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'text-slate-500 bg-white shadow-sm'
                }`}
              >
                {cat.replace('_', ' ')}
              </Button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
           Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="h-64 rounded-[2.5rem] bg-white animate-pulse shadow-xl" />
           ))
        ) : filteredTickets.map((ticket) => (
          <Card 
            key={ticket.id} 
            className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer group"
            onClick={() => {
              setSelectedTicket(ticket);
              setIsDetailModalOpen(true);
            }}
          >
            <CardHeader className="p-8 pb-4">
               <div className="flex justify-between items-start mb-6">
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${getPriorityColor(ticket.priority)} shadow-lg shadow-slate-100`}>
                     {ticket.priority} Priority
                  </div>
                  <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-400 border-slate-100 uppercase tracking-tighter text-[10px]">
                     #{ticket.id.slice(0,6)}
                  </Badge>
               </div>
               <CardTitle className="text-xl font-bold text-slate-900 line-clamp-2 leading-tight">
                  {ticket.subject}
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
               <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-medium">
                  {ticket.message}
               </p>
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white text-slate-400 flex items-center justify-center shadow-sm">
                     <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="text-sm font-bold text-slate-900 truncate">{ticket.student?.name || ticket.staff?.name}</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ticket.student ? 'Student' : 'Staff'}</div>
                  </div>
               </div>
               <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${ticket.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{ticket.status.replace('_', ' ')}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
               </div>
            </CardContent>
          </Card>
        ))}
        {filteredTickets.length === 0 && !loading && (
           <div className="col-span-full py-20 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20 text-slate-400" />
              <p className="font-bold text-slate-400 uppercase tracking-[0.2em] text-sm">Clear Workspace • No Pending Tickets</p>
           </div>
        )}
      </div>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] p-12 border-none shadow-2xl">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-4">
                   <Badge className="bg-amber-100 text-amber-600 border-none capitalize px-4 py-1 font-bold">
                      {selectedTicket.category.replace('_', ' ')}
                   </Badge>
                   <span className="text-slate-400">•</span>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                   </span>
                </div>
                <DialogTitle className="text-3xl font-display font-bold text-slate-900 leading-tight">
                   {selectedTicket.subject}
                </DialogTitle>
              </DialogHeader>

              <div className="py-8 space-y-8">
                 <div className="p-8 rounded-[2rem] bg-slate-50 text-slate-700 font-medium text-lg leading-relaxed shadow-inner">
                    "{selectedTicket.message}"
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Requester Info</h6>
                       <div className="space-y-3">
                          <div className="flex items-center gap-3 text-slate-600">
                             <User className="w-4 h-4 text-amber-500" />
                             <span className="text-sm font-bold">{selectedTicket.student?.name || selectedTicket.staff?.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600">
                             <Mail className="w-4 h-4 text-amber-500" />
                             <span className="text-sm font-medium">{selectedTicket.student?.email || selectedTicket.staff?.email || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600">
                             <Phone className="w-4 h-4 text-amber-500" />
                             <span className="text-sm font-medium">{selectedTicket.student?.phone || selectedTicket.staff?.phone || 'N/A'}</span>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Status</h6>
                       <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2">
                             <Badge className={`${getPriorityColor(selectedTicket.priority)} text-white border-none`}>
                                {selectedTicket.priority} Priority
                             </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className={`w-3 h-3 rounded-full ${selectedTicket.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                             <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{selectedTicket.status.replace('_', ' ')}</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <DialogFooter className="gap-4">
                <Button 
                  variant="outline"
                  className="flex-1 h-16 rounded-2xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                  disabled={saving || selectedTicket.status === 'in_progress'}
                >
                  Mark In Progress
                </Button>
                <Button 
                  className="flex-1 h-16 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                  disabled={saving || selectedTicket.status === 'resolved'}
                >
                  <ShieldCheck className="w-5 h-5 mr-2" /> Mark Resolved
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountantSupport;
