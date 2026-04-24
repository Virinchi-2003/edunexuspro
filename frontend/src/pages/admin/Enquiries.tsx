import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search,
  Building, 
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';

const EnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads');
      if (res.data.status === 'success') {
        setEnquiries(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch enquiries:', error);
      toast.error('Failed to load enquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      setIsReplying(true);
      const res = await api.post(`/leads/${selectedEnquiry.id}/reply`, { reply: replyText });
      if (res.status === 200) {
        if (res.data.mailSent) {
          toast.success(res.data.message);
        } else {
          toast.warning(res.data.message);
        }
        setSelectedEnquiry(null);
        setReplyText('');
        fetchEnquiries();
      }
    } catch (error) {
      toast.error('Failed to save reply.');
    } finally {
      setIsReplying(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await api.put(`/leads/${id}/status`, { status });
      const message = status === 'converted' 
        ? 'Lead converted! School and Admin account created.' 
        : `Status updated to ${status}`;
      
      toast.success(res.data.message || message);
      fetchEnquiries();
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  const filteredEnquiries = enquiries.filter(e => 
    e.schoolName.toLowerCase().includes(search.toLowerCase()) ||
    e.adminName.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Sales Enquiries</h2>
        <p className="text-slate-500">Manage incoming requests from potential schools and institutions.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="p-0 border-b border-slate-100">
          <div className="p-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search enquiries..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p>Loading enquiries...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100">
                  <TableHead>Institution</TableHead>
                  <TableHead>Contact & Plan</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnquiries.map((enquiry) => (
                  <TableRow key={enquiry.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" /> {enquiry.schoolName}
                        </span>
                        <span className="text-xs text-slate-400 font-normal">{enquiry.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Badge variant="outline" className="w-fit text-[10px] mb-1">{enquiry.plan || 'Not Selected'}</Badge>
                        <span className="text-sm font-medium">{enquiry.adminName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`
                          capitalize text-[10px]
                          ${enquiry.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}
                        `}
                      >
                        {enquiry.paymentStatus || 'Pending'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`
                          capitalize border-none
                          ${enquiry.status === 'new' ? 'bg-blue-100 text-blue-700' : 
                            enquiry.status === 'contacted' ? 'bg-amber-100 text-amber-700' : 
                            enquiry.status === 'converted' ? 'bg-green-100 text-green-700' : 
                            'bg-slate-100 text-slate-700'}
                        `}
                      >
                        {enquiry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:bg-primary/5"
                          onClick={() => setSelectedEnquiry(enquiry)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1.5" /> Reply
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hover:text-green-600"
                          onClick={() => updateStatus(enquiry.id, 'converted')}
                          title="Mark as Converted"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={!!selectedEnquiry} onOpenChange={(open) => !open && setSelectedEnquiry(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reply to Enquiry</DialogTitle>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm border border-slate-100">
                <p className="font-bold text-slate-900">{selectedEnquiry.schoolName}</p>
                <p className="text-slate-600 italic">"{selectedEnquiry.message || 'No message provided.'}"</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Your Response</label>
                <textarea 
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEnquiry(null)} disabled={isReplying}>Cancel</Button>
            <Button onClick={handleReply} disabled={isReplying || !replyText.trim()} className="gap-2">
              {isReplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnquiriesPage;
