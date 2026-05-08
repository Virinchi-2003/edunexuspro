import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Loader2,
  ChevronLeft,
  IndianRupee,
  Receipt,
  AlertCircle,
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
  ShieldCheck,
  RefreshCw,
  Clock
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import autoTable from 'jspdf-autotable';

const FEE_TEMPLATES = [
  { label: 'Tuition Fee', value: 'Tuition Fee' },
  { label: 'Library Fee', value: 'Library Fee' },
  { label: 'Transport Fee', value: 'Transport Fee' },
  { label: 'Activity Fee', value: 'Activity Fee' },
  { label: 'Examination Fee', value: 'Examination Fee' },
];

const FeesPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ feeType: 'Tuition Fee', amount: '', transactionId: '', status: 'paid', dueDate: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'management' | 'structures' | 'verifications'>('management');
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [structureData, setStructureData] = useState({ 
    grade: '', 
    amount: '', 
    description: '',
    tuitionFees: '',
    transportFees: '',
    libraryFees: '',
    examFees: '',
    activityFees: '',
    otherFees: '',
    installments: [] as { amount: number, dueDate: string }[]
  });

  const CATEGORY_TO_FIELD_MAP: Record<string, string> = {
    'Tuition Fee': 'tuitionFees',
    'Library Fee': 'libraryFees',
    'Transport Fee': 'transportFees',
    'Activity Fee': 'activityFees',
    'Examination Fee': 'examFees',
    'Laboratory Fee': 'otherFees',
    'Uniform Fee': 'otherFees',
    'Miscellaneous': 'otherFees'
  };

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
      const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald 500

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
      const [feesRes, classesRes, structuresRes] = await Promise.all([
        api.get(`/fees/school/${user.schoolId}`),
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/fee-structures/school/${user.schoolId}`)
      ]);
      setFees(feesRes.data.data.fees || []);
      setTransactions(feesRes.data.data.transactions || []);
      setStudents(feesRes.data.data.students || []);
      setInstallments(feesRes.data.data.installments || []);
      setClasses(classesRes.data.data || []);
      setFeeStructures(structuresRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load fees data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStructure = async () => {
    try {
      setIsSaving(true);
      const payload = { 
        ...structureData, 
        schoolId: user.schoolId,
        installments: JSON.stringify(structureData.installments)
      };
      if (selectedStructure) {
        await api.put(`/fee-structures/${selectedStructure.id}`, payload);
        toast.success('Fee structure updated');
      } else {
        await api.post('/fees/structure', payload);
        toast.success('Fee structure created');
      }
      setIsStructureDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save fee structure');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignStructure = async (studentId: string, structureId: string) => {
    try {
      setIsSaving(true);
      await api.post('/fees/assign', {
        schoolId: user.schoolId,
        studentId,
        structureId
      });
      toast.success('Fee structure assigned and installments generated');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign structure');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyCash = async (installmentId: string) => {
    try {
      setIsSaving(true);
      await api.put(`/fees/verify-cash/${installmentId}`);
      toast.success('Cash payment verified and transaction recorded');
      fetchData();
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStructure = async (id: string) => {
    if (!window.confirm('Delete this fee structure?')) return;
    try {
      await api.delete(`/fee-structures/${id}`);
      toast.success('Fee structure removed');
      fetchData();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpdatePayment = async () => {
    if (!selectedStudent) return;
    
    // Find fee record
    const feeRecord = fees.find(f => f.studentId === selectedStudent.id && f.feeType === paymentData.feeType);
    
    // Find matching structure for breakdown
    const structure = feeStructures.find(s => s.grade === selectedStudent.grade);
    const breakdown = structure ? {
      tuition: structure.tuitionFees,
      transport: structure.transportFees,
      library: structure.libraryFees,
      exam: structure.examFees,
      activity: structure.activityFees,
      other: structure.otherFees
    } : null;

    try {
      setIsSaving(true);
      if (feeRecord) {
        await api.put(`/fees/${feeRecord.id}`, {
          status: paymentData.status,
          paidAmount: paymentData.status === 'paid' ? paymentData.amount : 0,
          transactionId: paymentData.transactionId,
          amount: paymentData.amount,
          breakdown: breakdown ? JSON.stringify(breakdown) : undefined,
          installments: selectedStudent.installments
        });
        toast.success('Fee record updated');
      } else {
        await api.post('/fees', {
          schoolId: user.schoolId,
          studentId: selectedStudent.id,
          amount: paymentData.amount,
          status: paymentData.status,
          paidAmount: paymentData.status === 'paid' ? paymentData.amount : 0,
          dueDate: paymentData.dueDate || new Date().toISOString(),
          feeType: paymentData.feeType,
          breakdown: breakdown ? JSON.stringify(breakdown) : undefined,
          installments: selectedStudent.installments
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
    
    // Find matching structure for breakdown
    const structure = feeStructures.find(s => s.grade === currentClassData.name);
    const breakdown = structure ? {
      tuition: structure.tuitionFees,
      transport: structure.transportFees,
      library: structure.libraryFees,
      exam: structure.examFees,
      activity: structure.activityFees,
      other: structure.otherFees
    } : null;

    try {
      setIsSaving(true);
      const studentIds = currentClassData.studentList.map((s: any) => s.id);
      await api.post('/fees/bulk', {
        schoolId: user.schoolId,
        studentIds,
        amount: paymentData.amount,
        dueDate: paymentData.dueDate || new Date().toISOString(),
        feeType: paymentData.feeType,
        breakdown: breakdown ? JSON.stringify(breakdown) : undefined
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

  // Revenue Calculations
  const totalTargetRevenue = fees.reduce((acc, f) => acc + (f.amount + (f.lateFee || 0)), 0);
  const totalCollectedRevenue = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalPendingRevenue = totalTargetRevenue - totalCollectedRevenue;

  // Group students by class
  const classGroups = classes.reduce((acc: any, cls: any) => {
    const normalize = (s: string) => s.replace(/[-\s]/g, '').toLowerCase();
    const clsName = normalize(`${cls.name}${cls.section || ''}`);
    
    const studentList = students.filter(s => {
      if (s.classId === cls.id) return true;
      const sName = normalize(`${s.grade}${s.section || ''}`);
      return sName === clsName;
    });

    const classFees = fees.filter(f => studentList.some(s => s.id === f.studentId));
    const classTxs = transactions.filter(t => studentList.some(s => s.id === t.studentId));
    
    const classTarget = classFees.reduce((acc, f) => acc + (f.amount + (f.lateFee || 0)), 0);
    const classCollected = classTxs.reduce((acc, t) => acc + (t.amount || 0), 0);

    acc[cls.id] = {
      ...cls,
      studentList,
      targetRevenue: classTarget,
      collectedRevenue: classCollected,
      totalPaid: studentList.filter(s => {
        const sFees = fees.filter(f => f.studentId === s.id);
        const sTxs = transactions.filter(t => t.studentId === s.id);
        const sPaid = sTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const sTarget = sFees.reduce((sum, f) => sum + (f.amount || 0), 0);
        return sPaid >= sTarget && sTarget > 0;
      }).length,
      totalUnpaid: studentList.filter(s => {
        const sFees = fees.filter(f => f.studentId === s.id);
        const sTxs = transactions.filter(t => t.studentId === s.id);
        const sPaid = sTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const sTarget = sFees.reduce((sum, f) => sum + (f.amount || 0), 0);
        return sPaid < sTarget || sTarget === 0;
      }).length
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
      const studentTxs = transactions.filter(t => t.studentId === s.id);
      const totalPaidAmount = studentTxs.reduce((acc, t) => acc + (t.amount || 0), 0);
      return { ...s, studentFees, studentTxs, totalPaidAmount };
    });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex border-b border-slate-100">
        <button 
          className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'management' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('management')}
        >
          Fee Management
        </button>
        <button 
          className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'structures' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('structures')}
        >
          Fee Structures
        </button>
        <button 
          className={`px-6 py-3 font-bold text-sm transition-all ${activeTab === 'verifications' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
          onClick={() => setActiveTab('verifications')}
        >
          Cash Verifications
          {installments.filter(i => i.status === 'pending_verification').length > 0 && (
            <Badge className="ml-2 bg-rose-500 text-white h-5 w-5 p-0 flex items-center justify-center rounded-full">
              {installments.filter(i => i.status === 'pending_verification').length}
            </Badge>
          )}
        </button>
      </div>

      {activeTab === 'management' ? (
        <>
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
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  {selectedClass ? `Fees: Class ${currentClassData?.name} - ${currentClassData?.section}` : 'Fees Overview'}
                </h2>
              </div>
              <p className="text-slate-500">
                {selectedClass 
                  ? `Tracking payments for ${currentClassData?.studentList?.length} students.` 
                  : 'Monitor revenue and fee collection across all classes.'}
              </p>
            </div>
             {!selectedClass ? (
              <div className="flex items-center gap-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-50">
                 <div className="flex items-center gap-4 pr-6 border-r border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                      <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Collected</div>
                      <div className="text-xl font-display font-bold text-slate-900 tracking-tight">
                        ₹{totalCollectedRevenue.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-medium text-emerald-500">
                        {fees.filter(f => f.status === 'paid').length} Paid Records
                      </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Pending</div>
                      <div className="text-xl font-display font-bold text-slate-900 tracking-tight">
                        ₹{totalPendingRevenue.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-medium text-rose-500">
                        {fees.filter(f => f.status !== 'paid').length} Outstanding
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
                                        <div className="text-[10px] font-mono text-slate-400">{s.studentId}</div>
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                           <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Total Paid: ₹{s.totalPaidAmount?.toLocaleString()}</span>
                                        </div>
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
                                      className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                      onClick={() => {
                                        setSelectedStudent(s);
                                        setIsHistoryOpen(true);
                                      }}
                                    >
                                      <History className="w-3.5 h-3.5" />
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
                                        <div className="text-[10px] font-mono text-slate-400">{s.studentId}</div>
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                           <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Total Paid: ₹{s.totalPaidAmount?.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                   <TableCell colSpan={3} className="text-slate-400 italic text-sm">
                                      {s.totalPaidAmount > 0 ? (
                                         <div className="flex items-center gap-3 not-italic">
                                            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-2">
                                               <History className="w-3.5 h-3.5 text-indigo-500" />
                                               <span className="text-xs font-bold text-indigo-700">Advance/Other Payment: ₹{s.totalPaidAmount.toLocaleString()}</span>
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-400 underline underline-offset-4 decoration-slate-200">Needs Bill Mapping</span>
                                         </div>
                                      ) : (
                                         "No fee records created yet for this student."
                                      )}
                                   </TableCell>
                                  <TableCell className="text-right pr-6">
                                     <div className="flex justify-end gap-2">
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                          onClick={() => {
                                            setSelectedStudent(s);
                                            setIsHistoryOpen(true);
                                          }}
                                        >
                                          <History className="w-3.5 h-3.5" />
                                        </Button>
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
                                     </div>
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
        </>
      ) : activeTab === 'structures' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Standard Fee Structures</h2>
              <p className="text-slate-500">Define the standard fee amount for each grade level.</p>
            </div>
            <Button className="gap-2" onClick={() => {
              setSelectedStructure(null);
              setStructureData({ 
                grade: '', 
                amount: '', 
                description: '',
                tuitionFees: '',
                transportFees: '',
                libraryFees: '',
                examFees: '',
                activityFees: '',
                otherFees: '',
                installments: []
              });
              setIsStructureDialogOpen(true);
            }}>
              <Plus className="w-4 h-4" /> Add Structure
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feeStructures.map((struct) => (
              <Card key={struct.id} className="border-none shadow-sm group">
                <CardHeader className="flex flex-row justify-between items-start pb-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                    {struct.grade}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                      title="Assign to Class"
                      onClick={() => {
                        const className = prompt('Enter Class Name to assign this structure to (e.g. 10):');
                        if (!className) return;
                        const classStudents = students.filter(s => s.grade === className);
                        if (classStudents.length === 0) return toast.error('No students found in this class');
                        if (window.confirm(`Assign this structure to ${classStudents.length} students in Class ${className}?`)) {
                          classStudents.forEach(s => handleAssignStructure(s.id, struct.id));
                        }
                      }}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setSelectedStructure(struct);
                      setStructureData({ 
                        ...struct,
                        amount: struct.amount.toString(), 
                        tuitionFees: struct.tuitionFees?.toString() || '',
                        transportFees: struct.transportFees?.toString() || '',
                        libraryFees: struct.libraryFees?.toString() || '',
                        examFees: struct.examFees?.toString() || '',
                        activityFees: struct.activityFees?.toString() || '',
                        otherFees: struct.otherFees?.toString() || '',
                        installments: struct.installments ? JSON.parse(struct.installments) : []
                      });
                      setIsStructureDialogOpen(true);
                    }}>
                      <Pencil className="w-4 h-4 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDeleteStructure(struct.id)}>
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900 mb-4">₹{struct.amount.toLocaleString()}</div>
                  
                  <div className="space-y-2 mb-4">
                    {[
                      { label: 'Tuition', val: struct.tuitionFees },
                      { label: 'Transport', val: struct.transportFees },
                      { label: 'Library', val: struct.libraryFees },
                      { label: 'Exams', val: struct.examFees },
                      { label: 'Activities', val: struct.activityFees },
                    ].map((item, idx) => (
                      item.val > 0 && (
                        <div key={idx} className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400">
                          <span>{item.label}</span>
                          <span className="text-slate-600">₹{item.val.toLocaleString()}</span>
                        </div>
                      )
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 border-t pt-3 border-slate-50 italic">
                    {struct.description || 'No additional notes provided'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Pending Verifications</h2>
              <p className="text-slate-500">Approve cash payments submitted by students.</p>
            </div>
          </div>

          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="pl-6">Student</TableHead>
                  <TableHead>Installment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.filter(i => i.status === 'pending_verification').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic">
                      No pending cash verifications.
                    </TableCell>
                  </TableRow>
                ) : (
                  installments.filter(i => i.status === 'pending_verification').map((inst: any) => (
                    <TableRow key={inst.id}>
                      <TableCell className="pl-6">
                        <div className="font-bold text-slate-900">{inst.student?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inst.student?.studentId}</div>
                      </TableCell>
                      <TableCell>Installment #{inst.installmentNumber}</TableCell>
                      <TableCell className="font-bold">₹{inst.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-500">{new Date(inst.updatedAt || inst.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                          onClick={() => handleVerifyCash(inst.id)}
                        >
                          <ShieldCheck className="w-4 h-4" /> Verify & Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
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
                  <Select 
                    value={paymentData.feeType}
                    onValueChange={(val) => {
                      let autoAmount = paymentData.amount;
                      
                      // Try to auto-fill amount from structure
                      const studentGrade = selectedStudent?.grade || '';
                      const structure = feeStructures.find(s => 
                        s.grade.toString().toLowerCase().replace('th', '') === studentGrade.toString().toLowerCase().replace('th', '')
                      );
                      
                      if (structure) {
                        const field = CATEGORY_TO_FIELD_MAP[val];
                        if (field && structure[field]) {
                          autoAmount = structure[field].toString();
                        }
                      }
                      
                      setPaymentData({ ...paymentData, feeType: val, amount: autoAmount });
                    }}
                  >
                    <SelectTrigger className="bg-slate-50 border-none h-11 rounded-xl">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      {FEE_TEMPLATES.map(t => (
                        <SelectItem key={t.value} value={t.value} className="rounded-lg">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            {/* Manual Installment Builder for Individual Record */}
            <div className="space-y-3 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100">
               <div className="flex items-center justify-between mb-2">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Manual Installments</h5>
                  <Button 
                     variant="ghost" 
                     size="sm" 
                     className="h-7 px-2 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50"
                     onClick={() => {
                        const currentInsts = selectedStudent?.installments || [];
                        const newInst = { amount: 0, dueDate: new Date().toISOString().split('T')[0], status: 'pending' };
                        setSelectedStudent({ ...selectedStudent, installments: [...currentInsts, newInst] });
                     }}
                  >
                     <Plus className="w-3 h-3 mr-1" /> Add Box
                  </Button>
               </div>
               <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedStudent?.installments?.map((inst: any, idx: number) => (
                     <div key={idx} className="flex items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-50 animate-in slide-in-from-right-2">
                        <Input 
                          type="number" 
                          placeholder="Amount" 
                          className="h-8 rounded-lg bg-slate-50 border-none text-[10px] font-bold w-20"
                          value={inst.amount}
                          onChange={(e) => {
                             const newInsts = [...selectedStudent.installments];
                             newInsts[idx].amount = parseInt(e.target.value) || 0;
                             setSelectedStudent({ ...selectedStudent, installments: newInsts });
                          }}
                        />
                        <Input 
                          type="date" 
                          className="h-8 rounded-lg bg-slate-50 border-none text-[10px] font-bold flex-1"
                          value={inst.dueDate?.split('T')[0]}
                          onChange={(e) => {
                             const newInsts = [...selectedStudent.installments];
                             newInsts[idx].dueDate = e.target.value;
                             setSelectedStudent({ ...selectedStudent, installments: newInsts });
                          }}
                        />
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 text-rose-400 hover:text-rose-600"
                           onClick={() => {
                              const newInsts = selectedStudent.installments.filter((_: any, i: number) => i !== idx);
                              setSelectedStudent({ ...selectedStudent, installments: newInsts });
                           }}
                        >
                           <X className="w-3.5 h-3.5" />
                        </Button>
                     </div>
                  ))}
                  {(!selectedStudent?.installments || selectedStudent.installments.length === 0) && (
                     <div className="text-center py-4 text-[10px] text-slate-400 italic">No manual installments defined.</div>
                  )}
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
                  <Select 
                    value={paymentData.feeType}
                    onValueChange={(val) => {
                      let autoAmount = paymentData.amount;
                      
                      // For bulk creation, we use the class's grade
                      const classGrade = currentClassData?.name || '';
                      const structure = feeStructures.find(s => 
                        s.grade.toString().toLowerCase().replace('th', '') === classGrade.toString().toLowerCase().replace('th', '')
                      );
                      
                      if (structure) {
                        const field = CATEGORY_TO_FIELD_MAP[val];
                        if (field && structure[field]) {
                          autoAmount = structure[field].toString();
                        }
                      }
                      
                      setPaymentData({ ...paymentData, feeType: val, amount: autoAmount });
                    }}
                  >
                    <SelectTrigger className="bg-slate-50 border-none h-11 rounded-xl">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                      {FEE_TEMPLATES.map(t => (
                        <SelectItem key={t.value} value={t.value} className="rounded-lg">{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      
      {/* Fee Structure Dialog */}
      <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-primary p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <Receipt className="w-6 h-6" /> {selectedStructure ? 'Edit Fee Structure' : 'Add Fee Structure'}
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Grade / Class</label>
                  <Input 
                    value={structureData.grade}
                    onChange={e => setStructureData({...structureData, grade: e.target.value})}
                    className="bg-slate-50 border-none h-11 rounded-xl font-bold"
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary">Total Amount (Auto)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary" />
                    <Input 
                      type="number"
                      value={structureData.amount}
                      readOnly
                      className="pl-9 bg-primary/5 border-primary/20 h-11 rounded-xl font-bold text-primary"
                    />
                  </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { id: 'tuitionFees', label: 'Tuition Fees' },
                  { id: 'transportFees', label: 'Transport Fees' },
                  { id: 'libraryFees', label: 'Library Fees' },
                  { id: 'examFees', label: 'Exam Fees' },
                  { id: 'activityFees', label: 'Activity Fees' },
                  { id: 'otherFees', label: 'Other Fees' },
                ].map((fee) => (
                  <div key={fee.id} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">{fee.label}</label>
                    <Input 
                      type="number"
                      value={(structureData as any)[fee.id]}
                      onChange={e => {
                        const newData = { ...structureData, [fee.id]: e.target.value };
                        // Calculate new total
                        const total = [
                          newData.tuitionFees,
                          newData.transportFees,
                          newData.libraryFees,
                          newData.examFees,
                          newData.activityFees,
                          newData.otherFees
                        ].reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
                        
                        setStructureData({ ...newData, amount: total.toString() });
                      }}
                      className="bg-slate-50 border-none h-10 rounded-xl text-sm"
                      placeholder="0"
                    />
                  </div>
                ))}
             </div>

             <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Structure Description</label>
                <Input 
                  value={structureData.description}
                  onChange={e => setStructureData({...structureData, description: e.target.value})}
                  className="bg-slate-50 border-none h-11 rounded-xl"
                  placeholder="e.g. Annual Academic Fee for Grade 10"
                />
             </div>

             <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-primary" />
                    Payment Installments
                  </h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => {
                      const insts = [...(structureData.installments || [])];
                      insts.push({ amount: 0, dueDate: new Date().toISOString().split('T')[0] });
                      setStructureData({ ...structureData, installments: insts });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Box
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(structureData.installments || []).map((inst, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group animate-in slide-in-from-right-2 duration-300">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Amount</label>
                        <div className="relative">
                           <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                           <Input 
                              type="number" 
                              value={inst.amount} 
                              className="h-9 pl-7 bg-white border-slate-200 rounded-xl text-sm font-bold focus:ring-primary/20"
                              onChange={(e) => {
                                const insts = [...structureData.installments];
                                insts[idx].amount = parseInt(e.target.value || '0');
                                setStructureData({ ...structureData, installments: insts });
                              }}
                           />
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Due Date</label>
                        <Input 
                          type="date" 
                          value={inst.dueDate} 
                          className="h-9 bg-white border-slate-200 rounded-xl text-sm"
                          onChange={(e) => {
                            const insts = [...structureData.installments];
                            insts[idx].dueDate = e.target.value;
                            setStructureData({ ...structureData, installments: insts });
                          }}
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const insts = structureData.installments.filter((_, i) => i !== idx);
                          setStructureData({ ...structureData, installments: insts });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {(structureData.installments || []).length > 0 && (
                     <div className="p-4 bg-primary/5 rounded-2xl flex justify-between items-center border border-primary/10">
                        <div>
                           <div className="text-[9px] font-bold text-primary uppercase tracking-widest">Installment Total</div>
                           <div className="text-sm font-bold text-slate-900">₹{structureData.installments.reduce((acc, i) => acc + (Number(i.amount) || 0), 0).toLocaleString()}</div>
                        </div>
                        {structureData.installments.reduce((acc, i) => acc + (Number(i.amount) || 0), 0) !== Number(structureData.amount) && (
                           <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Total Mismatch (Structure: ₹{Number(structureData.amount).toLocaleString()})</span>
                           </div>
                        )}
                     </div>
                  )}
                </div>
             </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50">
            <Button 
              className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 text-base font-bold" 
              onClick={handleSaveStructure}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white">
            <div className="flex items-center justify-between mb-4">
               <DialogTitle className="text-2xl font-display font-bold text-white flex items-center gap-3">
                 <History className="w-6 h-6 text-indigo-400" /> Payment History
               </DialogTitle>
               <div className="flex items-center gap-2">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-full"
                   onClick={fetchData}
                 >
                   <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                 </Button>
                 <Badge className="bg-indigo-500/20 text-indigo-300 border-none px-3 py-1 font-mono text-[10px]">
                   ID: {selectedStudent?.studentId}
                 </Badge>
               </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-xl text-indigo-300">
                {selectedStudent?.name?.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-lg">{selectedStudent?.name}</div>
                <div className="text-xs text-slate-400">Class {selectedStudent?.grade} - {selectedStudent?.section}</div>
              </div>
            </div>
          </div>
          
          <div className="p-0 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
            <Tabs defaultValue="history" className="w-full">
              <div className="px-8 pt-4 bg-white">
                <TabsList className="bg-slate-100 rounded-xl">
                  <TabsTrigger value="history" className="rounded-lg font-bold">Transaction History</TabsTrigger>
                  <TabsTrigger value="installments" className="rounded-lg font-bold">Installment Schedule</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="history" className="p-8 mt-0 outline-none">
                {selectedStudent?.studentTxs?.length === 0 ? (
                  <div className="py-20 text-center">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium italic">No transactions found for this student.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedStudent?.studentTxs?.map((tx: any, idx: number) => (
                      <div key={tx.id} className="relative pl-8 pb-4 last:pb-0">
                        {idx !== selectedStudent.studentTxs.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200" />
                        )}
                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center z-10">
                          <IndianRupee className="w-3 h-3 text-emerald-600" />
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-sm font-bold text-slate-900">₹{tx.amount?.toLocaleString()}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.feeType || 'General Payment'}</div>
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-bold">SUCCESS</Badge>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(tx.createdAt).toLocaleDateString()}
                            </div>
                            <div className="font-mono">{tx.transactionId || 'pay_manual'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="installments" className="p-8 mt-0 outline-none">
                <div className="space-y-3">
                   {installments.filter(i => i.studentId === selectedStudent?.id).length === 0 ? (
                      <div className="py-20 text-center text-slate-400 italic">No installments generated yet.</div>
                   ) : (
                      installments.filter(i => i.studentId === selectedStudent?.id).sort((a,b) => a.installmentNumber - b.installmentNumber).map((inst) => (
                        <div key={inst.id} className="p-4 rounded-2xl bg-white border border-slate-100 flex items-center justify-between">
                           <div>
                              <div className="text-sm font-bold text-slate-900">Installment #{inst.installmentNumber}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Due: {new Date(inst.dueDate).toLocaleDateString()}</div>
                           </div>
                           <div className="text-right">
                              <div className="text-sm font-bold text-indigo-600">₹{inst.amount.toLocaleString()}</div>
                              <Badge className={`text-[8px] h-4 mt-1 border-none ${inst.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {inst.status?.toUpperCase() || 'PENDING'}
                              </Badge>
                           </div>
                        </div>
                      ))
                   )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-8 bg-white border-t border-slate-100 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Summary of Financial Records</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Total Billed</div>
                <div className="text-lg font-display font-bold text-slate-900">₹{selectedStudent?.studentFees?.reduce((acc: number, f: any) => acc + (Number(f.amount) || 0), 0).toLocaleString()}</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter mb-1">Total Paid</div>
                <div className="text-lg font-display font-bold text-emerald-600">₹{Number(selectedStudent?.totalPaidAmount || 0).toLocaleString()}</div>
              </div>
            </div>
            <Button className="w-full mt-6 rounded-2xl h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold" onClick={() => setIsHistoryOpen(false)}>
              Close History
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesPage;
