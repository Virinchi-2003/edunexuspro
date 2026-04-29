import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  ArrowLeft, 
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  History,
  ScanLine,
  ChevronRight,
  Save,
  AlertCircle,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Html5QrcodeScanner } from 'html5-qrcode';

type ViewMode = 'class-selection' | 'mark-attendance' | 'history';

const TeacherAttendance: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>('class-selection');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [markQueue, setMarkQueue] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [selfAttendance, setSelfAttendance] = useState<any>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  const fetchSelfAttendance = async (staffId: string) => {
    try {
      const res = await api.get(`/attendance/staff/${staffId}`);
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = res.data.data.find((r: any) => r.date === today);
      setSelfAttendance(todayRecord);
    } catch (error) {
      console.error(error);
    }
  };

  const markSelf = async (status: 'present' | 'absent' | 'late' | 'half-day') => {
    try {
      setSaving(true);
      await api.post('/attendance/mark', {
        schoolId: user.schoolId,
        records: [{
          staffId: teacherProfile.id,
          status,
          remarks: status === 'half-day' ? 'Half Day' : 'Self marked',
          date: new Date().toISOString().split('T')[0],
          academicYear: schoolInfo?.currentAcademicYear || '2026-27'
        }]
      });
      toast.success(`You are marked as ${status}`);
      fetchSelfAttendance(teacherProfile.id);
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  // 1. Fetch Teacher Profile & Assigned Classes
  const fetchTeacherData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const [profileRes, allClassesRes, schoolRes] = await Promise.all([
        api.get(`/staff/user/${user.uid}`),
        api.get(`/classes/school/${user.schoolId}`),
        api.get(`/schools/${user.schoolId}`)
      ]);
      
      const profile = profileRes.data.data;
      setTeacherProfile(profile);
      setSchoolInfo(schoolRes.data.data);
      fetchSelfAttendance(profile.id);
      
      const allClasses = allClassesRes.data.data || [];
      const assignedStrings = profile.classes ? profile.classes.split(',').map((s: string) => s.trim().toLowerCase()) : [];

      // Lenient matching logic (same as Students.tsx)
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
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Students for Selected Class
  const fetchClassStudents = async (classId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/students/school/${user.schoolId}`);
      const filtered = res.data.data.filter((s: any) => s.classId === classId);
      setStudents(filtered);
      
      // Also fetch existing records for today
      fetchExistingRecords(classId, selectedDate);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Existing Records
  const fetchExistingRecords = async (classId: string, date: string) => {
    try {
      const res = await api.get(`/attendance/class/${user.schoolId}/${classId}?date=${date}`);
      const records = res.data.data || [];
      setAttendanceRecords(records);
      
      // Pre-fill markQueue with existing records
      const initialQueue: Record<string, any> = {};
      records.forEach((r: any) => {
        initialQueue[r.studentId] = r.status;
      });
      setMarkQueue(initialQueue);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [user]);

  useEffect(() => {
    if (selectedClass && (view === 'mark-attendance' || view === 'history')) {
      fetchExistingRecords(selectedClass.id, selectedDate);
    }
  }, [selectedDate, selectedClass, view]);

  // Handle Manual Status Change
  const toggleStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setMarkQueue(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? undefined : status
    }));
  };

  // Save Attendance
  const saveAttendance = async () => {
    try {
      setSaving(true);
      const records = Object.entries(markQueue)
        .filter(([_, status]) => status !== undefined)
        .map(([studentId, status]) => ({
          studentId,
          classId: selectedClass.id,
          status,
          date: selectedDate,
          academicYear: schoolInfo?.currentAcademicYear || '2026-27'
        }));

      if (records.length === 0) {
        toast.error('No attendance changes to save');
        return;
      }

      await api.post('/attendance/mark', {
        schoolId: user.schoolId,
        records
      });

      toast.success('Attendance saved successfully');
      fetchExistingRecords(selectedClass.id, selectedDate);
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // QR Scanning Logic
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    let timeoutId: any = null;

    if (isQRModalOpen) {
      // Small delay to ensure Dialog content is fully rendered
      timeoutId = setTimeout(() => {
        const qrElement = document.getElementById("qr-reader");
        if (!qrElement) return;

        scanner = new Html5QrcodeScanner(
          "qr-reader", 
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          /* verbose= */ false
        );
        
        scanner.render(async (decodedText) => {
          setLastScanned(decodedText);
          
          // Match by ID or studentId
          const student = students.find(s => s.id === decodedText || s.studentId === decodedText);
          if (student) {
            try {
              await api.post('/attendance/qr', {
                schoolId: user.schoolId,
                studentId: student.id,
                classId: selectedClass.id,
                status: 'present',
                date: selectedDate
              });
              toast.success(`${student.name} marked Present`);
              fetchExistingRecords(selectedClass.id, selectedDate);
              setMarkQueue(prev => ({ ...prev, [student.id]: 'present' }));
            } catch (err) {
              toast.error('Failed to mark via QR');
            }
          } else {
            toast.error('Student not found in this class');
          }
        }, (_error) => {
          // ignore scan errors
        });
      }, 500); // 500ms delay for dialog animation
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [isQRModalOpen, students]);

  const downloadHistory = () => {
    if (attendanceRecords.length === 0) {
      toast.error('No records to download');
      return;
    }

    try {
      const data = attendanceRecords.map(r => ({
        'Student Name': r.student?.name || 'Unknown',
        'Student ID': r.student?.studentId || 'N/A',
        'Status': r.status.toUpperCase(),
        'Date': selectedDate,
        'Class': `${selectedClass.name}-${selectedClass.section}`,
        'Remarks': r.remarks || 'No remarks'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      XLSX.writeFile(workbook, `Attendance_${selectedClass.name}${selectedClass.section}_${selectedDate}.xlsx`);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const renderClassSelection = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {assignedClasses.map((cls) => (
        <Card 
          key={cls.id} 
          className="group hover:shadow-2xl transition-all cursor-pointer rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden relative"
          onClick={() => {
            setSelectedClass(cls);
            fetchClassStudents(cls.id);
            setView('mark-attendance');
          }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
          <CardContent className="p-8 relative z-10">
            <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-1">{cls.name}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Section {cls.section || 'A'}</p>
            <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
              <div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                Mark Today <ChevronRight className="w-3 h-3" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {assignedClasses.length === 0 && !loading && (
        <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">No assigned classes found.</p>
          <p className="text-slate-400 text-sm mt-1">Contact your principal to assign classes to your profile.</p>
        </div>
      )}
    </div>
  );

  const renderMarkAttendance = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl bg-slate-100" onClick={() => setView('class-selection')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">{selectedClass?.name}-{selectedClass?.section} Attendance</h2>
            <p className="text-sm text-slate-500 font-medium">Record daily presence manually or via QR</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 w-44 rounded-xl border-slate-200 shadow-sm"
            />
          </div>
          <Button 
            className="rounded-xl gap-2 bg-indigo-600 shadow-md"
            onClick={() => setIsQRModalOpen(true)}
          >
            <QrCode className="w-4 h-4" /> QR Scan
          </Button>
          <Button 
            variant="outline"
            className="rounded-xl gap-2 border-slate-200"
            onClick={() => setView('history')}
          >
            <History className="w-4 h-4" /> View History
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                <tr>
                  <th className="px-10 py-6 text-left">Student Profile</th>
                  <th className="px-10 py-6 text-center">Mark Status</th>
                  <th className="px-10 py-6 text-right">Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {students.map((student) => {
                  const currentStatus = markQueue[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold group-hover:scale-105 transition-transform">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{student.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            size="sm"
                            variant={currentStatus === 'present' ? 'default' : 'outline'}
                            className={`rounded-xl gap-1.5 h-10 px-4 ${currentStatus === 'present' ? 'bg-emerald-600 hover:bg-emerald-700 border-none' : 'border-slate-200 text-slate-600'}`}
                            onClick={() => toggleStatus(student.id, 'present')}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Present
                          </Button>
                          <Button 
                            size="sm"
                            variant={currentStatus === 'absent' ? 'default' : 'outline'}
                            className={`rounded-xl gap-1.5 h-10 px-4 ${currentStatus === 'absent' ? 'bg-rose-600 hover:bg-rose-700 border-none' : 'border-slate-200 text-slate-600'}`}
                            onClick={() => toggleStatus(student.id, 'absent')}
                          >
                            <XCircle className="w-4 h-4" /> Absent
                          </Button>
                          <Button 
                            size="sm"
                            variant={currentStatus === 'late' ? 'default' : 'outline'}
                            className={`rounded-xl gap-1.5 h-10 px-4 ${currentStatus === 'late' ? 'bg-amber-500 hover:bg-amber-600 border-none' : 'border-slate-200 text-slate-600'}`}
                            onClick={() => toggleStatus(student.id, 'late')}
                          >
                            <Clock className="w-4 h-4" /> Late
                          </Button>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        {attendanceRecords.find(r => r.studentId === student.id) ? (
                          <Badge className="bg-slate-100 text-slate-400 border-none font-bold text-[9px] uppercase tracking-wider">Already Saved</Badge>
                        ) : (
                          <span className="text-xs text-slate-300 italic">Not saved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
            <Button 
              className="rounded-[1.5rem] px-10 h-14 bg-indigo-600 shadow-xl shadow-indigo-100 gap-2 text-base font-bold"
              onClick={saveAttendance}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Attendance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 rounded-xl" onClick={() => setView('mark-attendance')}>
          <ArrowLeft className="w-4 h-4" /> Back to Marking
        </Button>
        <div className="flex items-center gap-3">
          <Button 
            className="rounded-xl gap-2 bg-emerald-600 shadow-md h-10 px-4"
            onClick={downloadHistory}
          >
            <Download className="w-4 h-4" /> Download Report
          </Button>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 w-44 rounded-xl border-slate-200"
            />
          </div>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-indigo-600 text-white p-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-display font-bold">Attendance History</CardTitle>
              <CardDescription className="text-indigo-100 font-medium">Viewing logs for {selectedClass?.name}-{selectedClass?.section} on {new Date(selectedDate).toLocaleDateString()}</CardDescription>
            </div>
            <div className="text-right">
               <div className="text-4xl font-display font-bold">
                 {attendanceRecords.filter(r => r.status === 'present').length}/{students.length}
               </div>
               <div className="text-xs font-bold uppercase tracking-widest text-indigo-200">Present Today</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-10 py-6 text-left">Student</th>
                  <th className="px-10 py-6 text-center">Status</th>
                  <th className="px-10 py-6 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-6 font-bold text-slate-900">
                      {record.student?.name || 'Unknown'}
                    </td>
                    <td className="px-10 py-6 text-center">
                      <Badge className={`px-4 py-1.5 rounded-full font-bold uppercase text-[10px] ${
                        record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 
                        record.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-10 py-6 text-right text-slate-500 italic">
                      {record.remarks || 'No remarks'}
                    </td>
                  </tr>
                ))}
                {attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-20 text-center">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">No records found for this date.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Smart Attendance</h2>
          <p className="text-slate-500 font-medium mt-1">Mark and monitor student presence in real-time.</p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 bg-white shadow-xl shadow-slate-200/50 text-indigo-700 rounded-[1.5rem] border border-indigo-50">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">Database Synced</span>
        </div>
      </div>

      {/* Self Marking Section */}
      <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-r from-indigo-600 to-violet-700 text-white overflow-hidden relative p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold">Daily Self-Marking</h3>
              <p className="text-indigo-100/80 font-medium">Mark your institutional presence for {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             {selfAttendance ? (
               <div className="flex items-center gap-4 animate-in fade-in zoom-in">
                 <Badge className="bg-emerald-500/20 backdrop-blur-md text-white border-emerald-400/50 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-sm">
                    {selfAttendance.status === 'half-day' ? 'HALF DAY RECORDED' : `RECORDED: ${selfAttendance.status.toUpperCase()}`}
                 </Badge>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg text-[10px] uppercase font-bold"
                   onClick={() => setSelfAttendance(null)}
                 >
                   Correction?
                 </Button>
               </div>
             ) : (
               <>
                 <Button 
                   onClick={() => markSelf('present')} 
                   disabled={saving}
                   className="rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-6 h-12 shadow-lg"
                 >
                   <CheckCircle2 className="w-4 h-4 mr-2" /> Present
                 </Button>
                 <Button 
                   onClick={() => markSelf('half-day')} 
                   disabled={saving}
                   className="rounded-xl bg-white/15 backdrop-blur-md text-white hover:bg-white/25 border border-white/20 font-bold px-6 h-12"
                 >
                   <Clock className="w-4 h-4 mr-2" /> Half Day
                 </Button>
                 <Button 
                   onClick={() => markSelf('absent')} 
                   disabled={saving}
                   className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 h-12 shadow-lg"
                 >
                   <XCircle className="w-4 h-4 mr-2" /> Absent
                 </Button>
               </>
             )}
          </div>
        </div>
      </Card>

      {loading && view === 'class-selection' ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Scanning assigned classes...</p>
        </div>
      ) : (
        <>
          {view === 'class-selection' && renderClassSelection()}
          {view === 'mark-attendance' && renderMarkAttendance()}
          {view === 'history' && renderHistory()}
        </>
      )}

      {/* QR Scanner Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={(open) => {
        setIsQRModalOpen(open);
        if (!open) setLastScanned(null);
      }}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">QR Attendance Scanner</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Point your camera at a student's QR code to mark them present instantly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 aspect-square overflow-hidden rounded-[2rem] bg-slate-100 relative border-4 border-indigo-50">
             <div id="qr-reader" className="w-full h-full" />
             <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20 z-10" />
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 animate-pulse z-20" />
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <Badge className="bg-indigo-600/90 backdrop-blur-md px-4 py-2 border-none font-bold uppercase tracking-widest flex items-center gap-2">
                  <ScanLine className="w-4 h-4" /> Ready to Scan
                </Badge>
             </div>
          </div>

          {lastScanned && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4 animate-in fade-in zoom-in duration-300">
               <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
               </div>
               <div>
                  <div className="text-emerald-800 font-bold">Successfully Marked!</div>
                  <div className="text-emerald-600 text-xs font-medium">Scanned ID: {lastScanned}</div>
               </div>
            </div>
          )}

          <DialogFooter className="mt-8">
            <Button 
              className="w-full rounded-2xl h-12 bg-slate-900 text-white font-bold"
              onClick={() => setIsQRModalOpen(false)}
            >
              Finish Scanning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherAttendance;
