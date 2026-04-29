import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  CreditCard,
  Users,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TeacherFees: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, classRes, studentsRes] = await Promise.all([
        api.get(`/staff/user/${user.uid}`),
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/students/school/${user.schoolId}`)
      ]);

      const profile = profileRes.data.data;
      const allClasses = classRes.data.data || [];
      const assignedStrings = profile.classes ? profile.classes.split(',').map((s: string) => s.trim().toLowerCase()) : [];

      const matchedClasses = allClasses.filter((c: any) => {
        const className = c.name.toLowerCase().trim();
        const sectionName = c.section.toLowerCase().trim();
        const cleanClassName = className.replace(/(\d+)(st|nd|rd|th)/i, '$1');
        const cleanC = `${cleanClassName}${sectionName}`.replace(/[\s-]/g, '');
        
        return assignedStrings.some((a: string) => {
          const lowerA = a.toLowerCase().trim();
          const cleanA = lowerA.replace(/(\d+)(st|nd|rd|th)/i, '$1').replace(/[\s-]/g, '').replace(/^class/i, '');
          return cleanA === cleanC || cleanA === cleanClassName || lowerA.includes(cleanC);
        });
      });

      setAssignedClasses(matchedClasses);
      const classIds = matchedClasses.map(c => c.id);

      // Filter students who belong to these assigned classes
      const filteredStudents = studentsRes.data.data.filter((s: any) => 
        classIds.includes(s.classId) || matchedClasses.some(c => c.name === s.grade)
      );
      
      setStudents(filteredStudents);
    } catch (error) {
      toast.error('Failed to load fee information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchData();
  }, [user]);

  const filteredStudentsList = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isPaid = s.status === 'active';
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'paid' && isPaid) || 
                         (statusFilter === 'pending' && !isPaid);
    
    const matchesClass = classFilter === 'all' || s.classId === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const getFeeStatus = (student: any) => {
    // Simulate fee logic for demonstration (in real app, this would come from a fee_payments table)
    const isPaid = student.status === 'active'; // Simple mockup logic
    if (isPaid) {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 font-bold">Full Paid</Badge>;
    }
    return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none px-3 py-1 font-bold">Pending</Badge>;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Student Fees</h2>
          <p className="text-slate-500 font-medium mt-1">Monitor fee payment status for your assigned class students.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <Input 
               placeholder="Find student by name..." 
               className="pl-10 w-64 rounded-xl border-slate-200 bg-white"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`rounded-xl gap-2 border-slate-200 bg-white shadow-sm ${statusFilter !== 'all' || classFilter !== 'all' ? 'border-indigo-500 text-indigo-600' : ''}`}>
                <Filter className="w-4 h-4" /> Filter
                {(statusFilter !== 'all' || classFilter !== 'all') && (
                  <Badge className="ml-1 px-1.5 h-4 bg-indigo-600 text-white border-none">!</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl p-2 shadow-2xl border-none bg-white/95 backdrop-blur-xl">
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 p-2">Payment Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <DropdownMenuRadioItem value="all" className="rounded-xl">All Payments</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="paid" className="rounded-xl">Full Paid</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending" className="rounded-xl">Pending Dues</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              
              <DropdownMenuSeparator className="bg-slate-50" />
              
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 p-2">Assigned Classes</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={classFilter} onValueChange={setClassFilter}>
                <DropdownMenuRadioItem value="all" className="rounded-xl">All Classes</DropdownMenuRadioItem>
                {assignedClasses.map(c => (
                  <DropdownMenuRadioItem key={c.id} value={c.id} className="rounded-xl">
                    {c.name}-{c.section}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              {(statusFilter !== 'all' || classFilter !== 'all') && (
                <>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl mt-1 h-9 text-xs font-bold"
                    onClick={() => {
                      setStatusFilter('all');
                      setClassFilter('all');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-xl bg-white rounded-[2rem] p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 opacity-50" />
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                 <div className="text-2xl font-display font-bold text-slate-900">
                   {students.filter(s => s.status === 'active').length}
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid Students</div>
              </div>
           </div>
        </Card>
        <Card className="border-none shadow-xl bg-white rounded-[2rem] p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 opacity-50" />
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                 <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                 <div className="text-2xl font-display font-bold text-slate-900">
                   {students.filter(s => s.status !== 'active').length}
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defaulters</div>
              </div>
           </div>
        </Card>
        <Card className="col-span-1 md:col-span-2 border-none shadow-xl bg-slate-900 text-white rounded-[2rem] p-6 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
           <div className="flex items-center justify-between relative z-10 h-full">
              <div>
                 <h3 className="text-lg font-display font-bold mb-1">Financial Overview</h3>
                 <p className="text-slate-400 text-xs font-medium">Class-wise collection status for Term-1</p>
              </div>
              <div className="text-right">
                 <div className="text-3xl font-display font-bold">84%</div>
                 <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Collected</div>
              </div>
           </div>
        </Card>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Fetching payment logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-6 text-left">Student Profile</th>
                    <th className="px-10 py-6 text-center">Class / Section</th>
                    <th className="px-10 py-6 text-center">Payment Status</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudentsList.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold group-hover:scale-105 transition-transform">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center font-bold text-slate-500">
                        {student.grade}-{student.section || 'A'}
                      </td>
                      <td className="px-10 py-6 text-center">
                        {getFeeStatus(student)}
                      </td>
                      <td className="px-10 py-6 text-right">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 gap-2"
                           onClick={() => {
                             setSelectedStudent(student);
                             setIsDetailsOpen(true);
                           }}
                         >
                           View Details <ArrowUpRight className="w-3 h-3" />
                         </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudentsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                         <AlertTriangle className="w-10 h-10 text-amber-300 mx-auto mb-4" />
                         <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No student payment records found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold text-slate-900">Fee Statement</DialogTitle>
                <DialogDescription className="text-slate-500 font-medium">{selectedStudent?.name} • ID: {selectedStudent?.studentId}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fee</div>
                  <div className="text-xl font-display font-bold text-slate-900">₹45,000</div>
               </div>
               <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Paid</div>
                  <div className="text-xl font-display font-bold text-emerald-700">
                    {selectedStudent?.status === 'active' ? '₹45,000' : '₹25,000'}
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><CheckCircle2 className="w-4 h-4" /></div>
                     <span className="font-bold text-slate-700">Term 1 Fees</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">Paid</Badge>
               </div>
               <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedStudent?.status === 'active' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                       {selectedStudent?.status === 'active' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                     </div>
                     <span className="font-bold text-slate-700">Term 2 Fees</span>
                  </div>
                  {selectedStudent?.status === 'active' ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold">Paid</Badge>
                  ) : (
                    <Badge className="bg-rose-100 text-rose-700 border-none font-bold">Pending</Badge>
                  )}
               </div>
               <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><TrendingUp className="w-4 h-4" /></div>
                     <span className="font-bold text-slate-700">Exam & Library Fees</span>
                  </div>
                  <Badge variant="outline" className="text-slate-400 border-slate-200">Upcoming</Badge>
               </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
               <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
               <p className="text-xs text-amber-800 font-medium leading-relaxed">
                 {selectedStudent?.status === 'active' 
                   ? "All academic dues for the current term have been cleared. No further action required."
                   : "Term 2 payment is currently overdue. Automated reminder has been sent to the parent portal."}
               </p>
            </div>
          </div>

          <div className="mt-8">
            <Button 
              className="w-full rounded-2xl h-14 bg-slate-900 text-white font-bold shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform"
              onClick={() => setIsDetailsOpen(false)}
            >
              Close Statement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherFees;
