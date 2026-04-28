import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Upload, 
  Eye,
  UserPlus,
  FileText,
  Mail,
  Phone,
  QrCode,
  Loader2,
  School
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AdmissionApplication {
  id: string;
  studentName: string;
  parentName: string;
  email: string;
  phone: string;
  grade: string;
  status: 'pending' | 'approved' | 'rejected';
  studentId?: string;
  appliedAt: string;
  aadhaarNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  documents?: string;
}

const PrincipalAdmissions: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isIDCardOpen, setIsIDCardOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admissions/school/${user?.schoolId}`);
      if (response.data.status === 'success') {
        setApplications(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setIsProcessing(true);
      const response = await api.put(`/admissions/${id}/status`, { status });
      if (response.data.status === 'success') {
        toast.success(`Application ${status} successfully`);
        fetchApplications();
        setIsPreviewOpen(false);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || `Failed to ${status} application`;
      toast.error(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApps = applications.filter(app => 
    app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-3">Approved</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none px-3">Rejected</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none px-3">Pending</Badge>;
    }
  };

  const handleDownloadIDCard = () => {
    if (!selectedApp) return;
    
    import('jspdf').then((jsPDFModule) => {
      const doc = new jsPDFModule.default({
        orientation: 'portrait',
        unit: 'mm',
        format: [85, 120] // Typical ID card size
      });

      // Background
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 85, 120, 'F');
      
      // Accent Circle
      doc.setFillColor(37, 99, 235, 0.1); // primary/10
      doc.circle(85, 0, 40, 'F');

      // Header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EduNexus Pro', 15, 15);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('DIGITAL CAMPUS PASS', 15, 20);

      // Status Badge
      doc.setFillColor(16, 185, 129, 0.2); // green/20
      doc.rect(60, 12, 15, 5, 'F');
      doc.setTextColor(16, 185, 129);
      doc.setFontSize(6);
      doc.text('ACTIVE', 64, 15.5);

      // Student Info
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedApp.studentName, 15, 45);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(200, 200, 200);
      doc.text(`Grade ${selectedApp.grade}`, 15, 52);
      
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`ID: ${selectedApp.studentId || selectedApp.id.substring(0, 8)}`, 15, 60);

      // Separator
      doc.setDrawColor(255, 255, 255, 0.1);
      doc.line(15, 75, 70, 75);

      // Dates
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.text('ISSUE DATE', 15, 85);
      doc.text('EXPIRY DATE', 45, 85);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(format(new Date(), 'MMM yyyy'), 15, 90);
      doc.text('MAY 2027', 45, 90);

      doc.save(`ID_Card_${selectedApp.studentName}.pdf`);
      toast.success('ID Card downloaded successfully');
    });
  };

  const handleBulkImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event: any) => {
        try {
          toast.loading('Processing data...', { id: 'import' });
          const data = event.target.result;
          import('xlsx').then(async (XLSX) => {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const students = XLSX.utils.sheet_to_json(sheet);

            const response = await api.post('/students/bulk', {
              schoolId: user?.schoolId,
              students
            });

            if (response.data.status === 'success') {
              toast.success(`Successfully imported ${response.data.data.length} students`, { id: 'import' });
              // Optionally refresh some state or navigate
            }
          });
        } catch (error) {
          toast.error('Failed to import data', { id: 'import' });
        }
      };
      reader.readAsBinaryString(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Admission Management</h1>
          <p className="text-slate-500">Track and process real-time student applications</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2" onClick={handleBulkImport}>
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <UserPlus className="w-4 h-4" /> New Registration
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Review</p>
                <h3 className="text-2xl font-bold">{applications.filter(a => a.status === 'pending').length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Approved This Month</p>
                <h3 className="text-2xl font-bold">{applications.filter(a => a.status === 'approved').length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-lg shadow-slate-200/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Applications</p>
                <h3 className="text-2xl font-bold">{applications.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-lg shadow-slate-200/50 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-50 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by student name or ID..." 
                className="pl-10 bg-slate-50 border-none focus-visible:ring-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400"><Filter className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="text-slate-400"><Download className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-bold">Application ID</TableHead>
                  <TableHead className="font-bold">Student Name</TableHead>
                  <TableHead className="font-bold">Parent Name</TableHead>
                  <TableHead className="font-bold">Grade</TableHead>
                  <TableHead className="font-bold">Applied Date</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" />
                    </TableCell>
                  </TableRow>
                ) : filteredApps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApps.map((app) => (
                    <TableRow key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="font-mono text-xs font-bold text-primary">{app.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{app.studentName}</span>
                          <span className="text-[10px] text-slate-400">{app.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium">{app.parentName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50">{app.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {format(new Date(app.appliedAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2" onClick={() => { setSelectedApp(app); setIsPreviewOpen(true); }}>
                              <Eye className="w-4 h-4" /> View Details
                            </DropdownMenuItem>
                            {app.status === 'approved' && (
                              <DropdownMenuItem className="gap-2" onClick={() => { setSelectedApp(app); setIsIDCardOpen(true); }}>
                                <QrCode className="w-4 h-4" /> Digital ID Card
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {app.status === 'pending' && (
                              <>
                                <DropdownMenuItem className="gap-2 text-green-600 focus:text-green-600" onClick={() => handleStatusChange(app.id, 'approved')}>
                                  <CheckCircle2 className="w-4 h-4" /> Approve Application
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => handleStatusChange(app.id, 'rejected')}>
                                  <XCircle className="w-4 h-4" /> Reject Application
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Application Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Application Details</DialogTitle>
            <DialogDescription>
              Submitted on {selectedApp && format(new Date(selectedApp.appliedAt), 'PPP p')}
            </DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Student Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">SN</div>
                        <div>
                          <p className="text-xs text-slate-400">Full Name</p>
                          <p className="text-sm font-bold">{selectedApp.studentName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Grade / Section</p>
                          <p className="text-sm font-bold">Grade {selectedApp.grade}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Aadhaar Number</p>
                          <p className="text-sm font-bold font-mono">{selectedApp.aadhaarNumber || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Parent & Contact</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">PN</div>
                        <div>
                          <p className="text-xs text-slate-400">Parent Name</p>
                          <p className="text-sm font-bold">{selectedApp.parentName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Email Address</p>
                          <p className="text-sm font-bold">{selectedApp.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-400">Phone Number</p>
                          <p className="text-sm font-bold">{selectedApp.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    let docs = [];
                    try {
                      docs = selectedApp.documents ? JSON.parse(selectedApp.documents as any) : [];
                    } catch (e) {
                      docs = [];
                    }
                    
                    if (docs.length === 0) return <p className="text-xs text-slate-400 italic col-span-full">No documents uploaded</p>;
                    
                    return docs.map((doc: string) => (
                      <div key={doc} className="p-3 border rounded-xl bg-slate-50 flex flex-col items-center gap-2 group cursor-pointer hover:border-primary transition-all">
                        <FileText className="w-8 h-8 text-slate-300 group-hover:text-primary transition-all" />
                        <span className="text-[10px] font-bold text-slate-500">{doc}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            {selectedApp?.status === 'pending' && (
              <>
                <Button variant="destructive" className="gap-2" onClick={() => handleStatusChange(selectedApp.id, 'rejected')} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
                </Button>
                <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(selectedApp.id, 'approved')} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Digital ID Card Dialog */}
      <Dialog open={isIDCardOpen} onOpenChange={setIsIDCardOpen}>
        <DialogContent className="sm:max-w-[450px] bg-slate-900 border-none text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
          
          <DialogHeader>
            <DialogTitle className="text-white font-display">Digital Identity Card</DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="relative z-10 py-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <School className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-primary">EduNexus Pro</h4>
                      <p className="text-[8px] text-white/50">DIGITAL CAMPUS PASS</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">ACTIVE</Badge>
                </div>

                <div className="flex gap-6 items-center mb-8">
                  <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                    <QrCode className="w-16 h-16 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedApp.studentName}</h3>
                    <p className="text-white/60 text-sm">Grade {selectedApp.grade}</p>
                    <p className="text-primary font-mono text-xs mt-2">ID: {selectedApp.studentId || selectedApp.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Issue Date</p>
                    <p className="text-sm font-medium">{format(new Date(), 'MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Expiry Date</p>
                    <p className="text-sm font-medium">May 2027</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <Button className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold gap-2" onClick={handleDownloadIDCard}>
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5 gap-2">
                  <Mail className="w-4 h-4" /> Send to Parent
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrincipalAdmissions;
