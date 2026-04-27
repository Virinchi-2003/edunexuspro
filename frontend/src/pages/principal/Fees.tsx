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
  Phone,
  Loader2,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  ArrowUpRight,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Upload,
  Download,
  FileText,
  CreditCard,
  BellRing,
  History,
  ShieldCheck
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
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const FeesPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({ feeType: 'Tuition Fee', amount: '', transactionId: '', status: 'paid', dueDate: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const downloadTemplate = () => {
    const template = [
      { studentId: 'STU001', amount: 5000, feeType: 'Tuition Fee', status: 'unpaid', dueDate: '2026-05-30' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FeesTemplate");
    XLSX.writeFile(wb, "fees_import_template.xlsx");
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          toast.error('Excel sheet is empty');
          return;
        }

        setIsSaving(true);
        await api.post('/fees/bulk', { 
          schoolId: user.schoolId, 
          records: data 
        });
        
        toast.success(`Successfully imported ${data.length} fee records`);
        setIsBulkDialogOpen(false);
        fetchData();
      } catch (error) {
        toast.error('Failed to parse or upload Excel file');
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const generateReceiptPDF = (fee: any, student: any) => {
    try {
      const doc = new jsPDF();
      const primaryColor = [16, 185, 129]; // Emerald 500

      const amount = Number(fee.amount) || 0;
      const lateFee = Number(fee.lateFee) || 0;
      const total = amount + lateFee;

      // Header
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(22);
      doc.text("EduNexus Pro Invoicing", 105, 20, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`Challan #: ${fee.challanNumber || 'N/A'} | Date: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

      // School & Student Info
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text("BILL FROM", 20, 50);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.text("MHS Educational Institute", 20, 55);
      doc.text("GSTIN: 27AAECM1234F1Z5", 20, 60);

      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text("BILL TO", 140, 50);
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.text(`Student: ${student?.name || 'N/A'}`, 140, 55);
      doc.text(`ID: ${student?.studentId || 'N/A'}`, 140, 60);
      doc.text(`Grade: ${student?.grade || 'N/A'}`, 140, 65);

      // Table
      autoTable(doc, {
        startY: 80,
        head: [['Description', 'Amount', 'Late Fee', 'Total']],
        body: [
          [fee.feeType, `INR ${amount.toLocaleString()}`, `INR ${lateFee.toLocaleString()}`, `INR ${total.toLocaleString()}`]
        ],
        headStyles: { fillColor: primaryColor },
        theme: 'grid'
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`Total Payable: INR ${total.toLocaleString()}`, 140, finalY);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("This is a computer-generated receipt and does not require a physical signature.", 105, 280, { align: 'center' });

      doc.save(`Receipt_${fee.challanNumber || fee.id}.pdf`);
      toast.success('GST-compliant receipt generated successfully!');
    } catch (error) {
      console.error("PDF Gen Error:", error);
      toast.error("Failed to generate PDF receipt");
    }
  };

  const handleRazorpayPayment = async (fee: any) => {
    setIsSaving(true);
    // Simulate Razorpay Overlay
    toast.info("Connecting to Razorpay Secure Gateway...");
    
    setTimeout(async () => {
       const transactionId = `pay_${Math.random().toString(36).substr(2, 9)}`;
       try {
         await api.put(`/fees/${fee.id}`, {
           status: 'paid',
           paidAmount: fee.amount + (fee.lateFee || 0),
           transactionId,
           amount: fee.amount
         });
         toast.success(`Payment Successful! Transaction ID: ${transactionId}`);
         fetchData();
       } catch (error) {
         toast.error("Payment Gateway Error");
       } finally {
         setIsSaving(false);
       }
    }, 2000);
  };

  const sendReminders = async () => {
    try {
      setLoading(true);
      const res = await api.post('/fees/reminders', { schoolId: user.schoolId });
      toast.success(res.data.message);
    } catch (error) {
      toast.error("Failed to dispatch reminders");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user?.schoolId) return;
    try {
      setLoading(true);
      const [feesRes, classesRes] = await Promise.all([
        api.get(`/fees/school/${user.schoolId}`),
        api.get(`/classes/school/${user.schoolId}`)
      ]);
      setFees(feesRes.data.data.fees || []);
      setStudents(feesRes.data.data.students || []);
      setClasses(classesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load fees data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpdatePayment = async () => {
    if (!selectedStudent) return;
    
    // Find fee record
    const feeRecord = fees.find(f => f.studentId === selectedStudent.id && f.feeType === paymentData.feeType);
    
    try {
      setIsSaving(true);
      if (feeRecord) {
        await api.put(`/fees/${feeRecord.id}`, {
          status: paymentData.status,
          paidAmount: paymentData.status === 'paid' ? paymentData.amount : 0,
          transactionId: paymentData.transactionId,
          amount: paymentData.amount // Allow editing amount too
        });
        toast.success('Fee record updated');
      } else {
        await api.post('/fees', {
          schoolId: user.schoolId,
          studentId: selectedStudent.id,
          amount: paymentData.amount,
          dueDate: paymentData.dueDate || new Date().toISOString(),
          feeType: paymentData.feeType
        });
        toast.success('New fee record created');
      }
      setIsPayDialogOpen(false);
      setIsAddFeeDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!window.confirm('Delete this fee record permanently?')) return;
    try {
      await api.delete(`/fees/${id}`);
      toast.success('Fee record removed');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleBulkFeeCreate = async () => {
    if (!paymentData.amount || !currentClassData) return;
    
    try {
      setIsSaving(true);
      const studentIds = currentClassData.studentList.map((s: any) => s.id);
      await api.post('/fees/bulk', {
        schoolId: user.schoolId,
        studentIds,
        amount: paymentData.amount,
        dueDate: paymentData.dueDate || new Date().toISOString(),
        feeType: paymentData.feeType
      });
      toast.success(`Fee records created for all ${studentIds.length} students`);
      setIsAddFeeDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Bulk creation failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Group students by class
  const classGroups = classes.reduce((acc: any, cls: any) => {
    const studentList = students.filter(s => s.classId === cls.id || (s.grade === cls.name && s.section === cls.section));
    const classFees = fees.filter(f => studentList.some(s => s.id === f.studentId));
    
    acc[cls.id] = {
      ...cls,
      studentList,
      totalPaid: classFees.filter(f => f.status === 'paid').length,
      totalUnpaid: studentList.length - classFees.filter(f => f.status === 'paid').length
    };
    return acc;
  }, {});

  const sortedClasses = Object.values(classGroups).sort((a: any, b: any) => {
    const numA = parseInt(a.name);
    const numB = parseInt(b.name);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA - numB;
      return a.section.localeCompare(b.section);
    }
    return a.name.localeCompare(b.name);
  });

  const currentClassData = selectedClass ? classGroups[selectedClass] : null;
  const filteredStudents = (currentClassData?.studentList || [])
    .filter((s: any) => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
    )
    .map((s: any) => {
      const studentFees = fees.filter(f => f.studentId === s.id);
      return { ...s, studentFees };
    });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {selectedClass && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100"
                onClick={() => setSelectedClass(null)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <h2 className="text-3xl font-display font-bold text-slate-900">
              {selectedClass ? `Fees: Class ${currentClassData?.name} - ${currentClassData?.section}` : 'Fees Management'}
            </h2>
          </div>
          <p className="text-slate-500">
            {selectedClass 
              ? `Tracking payments for ${currentClassData?.studentList?.length} students.` 
              : 'Monitor revenue and fee collection across all classes.'}
          </p>
        </div>
        {!selectedClass ? (
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collected</div>
                  <div className="text-lg font-bold text-slate-900">
                    {fees.filter(f => f.status === 'paid').length} / {students.length}
                  </div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</div>
                  <div className="text-lg font-bold text-slate-900">
                    {students.length - fees.filter(f => f.status === 'paid').length}
                  </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              className="gap-2 border-slate-200 hover:bg-slate-50 text-indigo-600"
              onClick={sendReminders}
              disabled={loading}
            >
              <BellRing className="w-4 h-4" /> Reminders
            </Button>
            <Button 
              variant="outline"
              className="gap-2 border-slate-200 hover:bg-slate-50"
              onClick={() => setIsBulkDialogOpen(true)}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Bulk Import
            </Button>
            <Button 
              className="gap-2 shadow-lg shadow-primary/20"
              onClick={() => {
                setSelectedStudent(null);
                setPaymentData({ feeType: 'Tuition Fee', amount: '', transactionId: '', status: 'unpaid', dueDate: new Date().toISOString().split('T')[0] });
                setIsAddFeeDialogOpen(true);
              }}
            >
              <Receipt className="w-4 h-4" /> Global Fee Creation
            </Button>
          </div>
        )}
      </div>

      {!selectedClass ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
             Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse bg-slate-50 border-none h-48" />
            ))
          ) : sortedClasses.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-slate-500">No classes found. Set up your classes in the Students section first.</p>
            </div>
          ) : (
            sortedClasses.map((cls: any) => (
              <Card 
                key={cls.id} 
                className="group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer border-none shadow-sm overflow-hidden"
                onClick={() => setSelectedClass(cls.id)}
              >
                <div className="h-2 bg-slate-100 group-hover:bg-primary transition-colors" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-900 flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                      {cls.name}
                    </div>
                    <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-mono">
                      Sec {cls.section}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="text-2xl font-bold text-slate-900">{cls.studentList?.length || 0}</div>
                      <div className="text-xs text-slate-400 font-medium">Total Students</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Collection Status</span>
                        <span className="font-bold text-emerald-600">{Math.round((cls.totalPaid / (cls.studentList?.length || 1)) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${(cls.totalPaid / (cls.studentList?.length || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex-1 text-center py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs">
                        {cls.totalPaid} Paid
                      </div>
                      <div className="flex-1 text-center py-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs">
                        {cls.totalUnpaid} Due
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="p-0 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-4 p-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search student by name or ID..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 bg-slate-50 border-none h-12 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-6 py-4">Student Details</TableHead>
                  <TableHead>Fee Type & Amount</TableHead>
                  <TableHead>Payment Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                      No student records found in this section.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((s: any) => (
                    <React.Fragment key={s.id}>
                      {s.studentFees?.length > 0 ? (
                        s.studentFees.map((fee: any, idx: number) => (
                          <TableRow key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
                            {idx === 0 && (
                              <TableCell className="pl-6" rowSpan={s.studentFees.length}>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                    {s.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{s.name}</div>
                                    <div className="text-xs font-mono text-slate-400">{s.studentId}</div>
                                  </div>
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800">{fee.feeType}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-sm font-bold text-emerald-600">₹{fee.amount?.toLocaleString()}</span>
                                  {(fee.lateFee || 0) > 0 && (
                                    <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] h-4">
                                      +₹{fee.lateFee} Late
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono mt-1">{fee.challanNumber || 'GENERATING...'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {fee.paymentDate ? (
                                <div className="flex flex-col gap-0.5">
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Paid on {new Date(fee.paymentDate).toLocaleDateString()}
                                  </div>
                                  {fee.transactionId && <div className="text-[10px] text-slate-400 font-mono">ID: {fee.transactionId}</div>}
                                </div>
                              ) : (
                                <div className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                                  <History className="w-3 h-3" /> Due by {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={`rounded-lg ${
                                fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 
                                fee.status === 'partially_paid' ? 'bg-amber-50 text-amber-600' : 
                                'bg-slate-100 text-slate-500'
                              } border-none font-bold`}>
                                {fee.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                {fee.status !== 'paid' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 gap-1 rounded-lg"
                                    onClick={() => handleRazorpayPayment(fee)}
                                  >
                                    <CreditCard className="w-3.5 h-3.5" /> Pay
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 text-slate-400 hover:text-indigo-600 gap-1"
                                  onClick={() => generateReceiptPDF(fee, s)}
                                >
                                  <FileText className="w-3.5 h-3.5" /> Receipt
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-primary"
                                  onClick={() => {
                                    setSelectedStudent(s);
                                    setPaymentData({ 
                                      feeType: fee.feeType,
                                      amount: fee.amount?.toString() || '', 
                                      transactionId: fee.transactionId || '',
                                      status: fee.status,
                                      dueDate: fee.dueDate || ''
                                    });
                                    setIsPayDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                                  onClick={() => handleDeleteFee(fee.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow className="hover:bg-slate-50/50 transition-colors group">
                           <TableCell className="pl-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                    {s.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900">{s.name}</div>
                                    <div className="text-xs font-mono text-slate-400">{s.studentId}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell colSpan={3} className="text-slate-400 italic text-sm">
                                No fee records created yet for this student.
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="gap-2 h-8 rounded-lg"
                                  onClick={() => {
                                    setSelectedStudent(s);
                                    setPaymentData({ feeType: 'Tuition Fee', amount: '50000', transactionId: '', status: 'unpaid', dueDate: new Date().toISOString().split('T')[0] });
                                    setIsPayDialogOpen(true);
                                  }}
                                >
                                  <Plus className="w-3 h-3" /> Add Fee
                                </Button>
                              </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment Management Dialog */}
      <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <Receipt className="w-6 h-6" /> {paymentData.status === 'paid' ? 'Manage Fee Record' : 'Record Payment'}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                {selectedStudent?.name?.charAt(0)}
              </div>
              <div>
                <div className="font-bold">{selectedStudent?.name}</div>
                <div className="text-xs opacity-70">Class {selectedStudent?.grade} - {selectedStudent?.section}</div>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Fee Category</label>
                  <Input 
                    value={paymentData.feeType}
                    onChange={e => setPaymentData({...paymentData, feeType: e.target.value})}
                    className="bg-slate-50 border-none h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Total Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input 
                      type="number"
                      value={paymentData.amount}
                      onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                      className="pl-9 bg-slate-50 border-none h-11 rounded-xl"
                    />
                  </div>
                </div>
             </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Payment Status</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant={paymentData.status === 'paid' ? 'default' : 'outline'} 
                  className="rounded-xl h-11"
                  onClick={() => setPaymentData({...paymentData, status: 'paid'})}
                >
                  Mark as Paid
                </Button>
                <Button 
                  variant={paymentData.status === 'unpaid' ? 'default' : 'outline'} 
                  className="rounded-xl h-11"
                  onClick={() => setPaymentData({...paymentData, status: 'unpaid'})}
                >
                  Unpaid / Pending
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Due Date</label>
                  <Input 
                    type="date"
                    value={paymentData.dueDate}
                    onChange={e => setPaymentData({...paymentData, dueDate: e.target.value})}
                    className="bg-slate-50 border-none h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Transaction Ref</label>
                  <Input 
                    value={paymentData.transactionId}
                    onChange={e => setPaymentData({...paymentData, transactionId: e.target.value})}
                    className="bg-slate-50 border-none h-11 rounded-xl"
                    placeholder="UPI / Cheque No"
                  />
                </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50">
            <Button 
              className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 text-base font-bold" 
              onClick={handleUpdatePayment}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Fee Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Global Fee Creation Dialog */}
      <Dialog open={isAddFeeDialogOpen} onOpenChange={setIsAddFeeDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-emerald-600 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <Receipt className="w-6 h-6" /> Class-wide Fee Creation
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-sm">Apply a new fee requirement to all students in <strong>Class {currentClassData?.name} - {currentClassData?.section}</strong>.</p>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Fee Category</label>
                  <Input 
                    value={paymentData.feeType}
                    onChange={e => setPaymentData({...paymentData, feeType: e.target.value})}
                    className="bg-slate-50 border-none h-11 rounded-xl"
                    placeholder="e.g. Bus Fee"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Total Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input 
                      type="number"
                      value={paymentData.amount}
                      onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                      className="pl-9 bg-slate-50 border-none h-11 rounded-xl"
                    />
                  </div>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Due Date</label>
                <Input 
                  type="date"
                  value={paymentData.dueDate}
                  onChange={e => setPaymentData({...paymentData, dueDate: e.target.value})}
                  className="bg-slate-50 border-none h-11 rounded-xl"
                />
             </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50">
            <Button 
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 text-base font-bold" 
              onClick={handleBulkFeeCreate}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Records for {currentClassData?.studentList?.length} Students
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Bulk Import Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-emerald-600 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold text-white">Import Fee Data</DialogTitle>
            </DialogHeader>
            <p className="text-emerald-50 opacity-90 mt-2 text-sm">Upload an Excel file with your student fee records.</p>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="space-y-3">
               <h4 className="font-bold text-slate-800 flex items-center gap-2">
                 <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                 Excel Format Requirements
               </h4>
               <ul className="text-xs space-y-2 text-slate-500 list-disc pl-4">
                 <li>Column <strong>studentId</strong> or <strong>Roll Number</strong> (Required)</li>
                 <li>Column <strong>amount</strong> (Numeric, Required)</li>
                 <li>Column <strong>feeType</strong> (e.g. "Library", "Term 1")</li>
                 <li>Column <strong>status</strong> (Optional: "paid" or "unpaid")</li>
                 <li>Column <strong>dueDate</strong> (Format: YYYY-MM-DD)</li>
               </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                 <Upload className="w-8 h-8 text-slate-300 mb-2" />
                 <span className="text-sm font-bold text-slate-600">Click to Select File</span>
                 <span className="text-[10px] text-slate-400 mt-1">Supports .xlsx, .xls</span>
                 <input 
                   type="file" 
                   className="hidden" 
                   accept=".xlsx, .xls"
                   onChange={handleBulkUpload}
                   disabled={isSaving}
                 />
               </label>
            </div>

            <Button 
              variant="ghost" 
              className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-2 font-bold"
              onClick={downloadTemplate}
            >
              <Download className="w-4 h-4" /> Download Sample Template
            </Button>
          </div>

          {isSaving && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
              <p className="font-bold text-slate-900">Processing Import...</p>
              <p className="text-xs text-slate-500 mt-1">This may take a moment</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesPage;
