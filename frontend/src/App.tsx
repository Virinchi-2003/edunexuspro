import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Schools from './pages/admin/Schools';
import Enquiries from './pages/admin/Enquiries';
import Principals from './pages/admin/Principals';
import Subscriptions from './pages/admin/Subscriptions';
import Settings from './pages/admin/Settings';
import PrincipalDashboard from './pages/principal/Dashboard';
import PrincipalStudents from './pages/principal/Students';
import PrincipalStaff from './pages/principal/Staff';
import PrincipalFees from './pages/principal/Fees';
import PrincipalAttendance from './pages/principal/Attendance';
import PrincipalSettings from './pages/principal/Settings';
import PrincipalAdmissions from './pages/principal/Admissions';
import PrincipalTimetable from './pages/principal/Timetable';
import PrincipalExams from './pages/principal/Exams';
import PrincipalGradebook from './pages/principal/Gradebook';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherStudents from './pages/teacher/Students';
import TeacherAttendance from './pages/teacher/Attendance';
import StudentDashboard from './pages/student/Dashboard';
import StudentAttendance from './pages/student/Attendance';
import StudentLeave from './pages/student/Leave';
import StudentHomework from './pages/student/Homework';
import StudentPerformance from './pages/student/Performance';
import StudentFees from './pages/student/Fees';
import StudentMessaging from './pages/student/Messaging';
import StudentSettings from './pages/student/Settings';
import TeacherExams from './pages/teacher/Exams';
import TeacherGradebook from './pages/teacher/Gradebook';
import TeacherFees from './pages/teacher/Fees';
import TeacherTimetable from './pages/teacher/Timetable';
import TeacherSettings from './pages/teacher/Settings';
import TeacherLeave from './pages/teacher/Leave';
import TeacherHomework from './pages/teacher/Homework';
import TeacherMessaging from './pages/teacher/Messaging';
import AdmissionForm from './pages/AdmissionForm';
import Login from './pages/Login';
import CoachDashboard from './pages/coach/Dashboard';
import CoachClipboard from './pages/coach/modules/Clipboard';

import { Toaster } from 'sonner';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-display text-primary animate-pulse text-2xl font-bold">EduNexus Pro</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'principal') return <Navigate to="/principal" />;
  if (user.role === 'accountant') return <Navigate to="/accountant" />;
  if (user.role === 'coach') return <Navigate to="/coach" />;
  if (user.role === 'staff' || user.role === 'teacher') return <Navigate to="/teacher" />;
  if (user.role === 'student') return <Navigate to="/student" />;
  return <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admission" element={<AdmissionForm />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute roles={['admin']}>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/schools" element={<Schools />} />
                  <Route path="/enquiries" element={<Enquiries />} />
                  <Route path="/principals" element={<Principals />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Principal Routes */}
          <Route path="/principal/*" element={
            <ProtectedRoute roles={['principal']}>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<PrincipalDashboard />} />
                  <Route path="/students" element={<PrincipalStudents />} />
                  <Route path="/staff" element={<PrincipalStaff />} />
                  <Route path="/fees" element={<PrincipalFees />} />
                  <Route path="/attendance" element={<PrincipalAttendance />} />
                  <Route path="/admissions" element={<PrincipalAdmissions />} />
                  <Route path="/timetable" element={<PrincipalTimetable />} />
                  <Route path="/exams" element={<PrincipalExams />} />
                  <Route path="/gradebook" element={<PrincipalGradebook />} />
                  <Route path="/settings" element={<PrincipalSettings />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Teacher Routes */}
          <Route path="/teacher/*" element={
            <ProtectedRoute roles={['staff', 'teacher']}>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<TeacherDashboard />} />
                  <Route path="/students" element={<TeacherStudents />} />
                  <Route path="/attendance" element={<TeacherAttendance />} />
                  <Route path="/timetable" element={<TeacherTimetable />} />
                  <Route path="/exams" element={<TeacherExams />} />
                  <Route path="/gradebook" element={<TeacherGradebook />} />
                  <Route path="/fees" element={<TeacherFees />} />
                  <Route path="/leave" element={<TeacherLeave />} />
                  <Route path="/homework" element={<TeacherHomework />} />
                  <Route path="/messages" element={<TeacherMessaging />} />
                  <Route path="/settings" element={<TeacherSettings />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Accountant Routes */}
          <Route path="/accountant/*" element={
            <ProtectedRoute roles={['accountant']}>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<div className="p-8 text-2xl font-bold">Accountant Dashboard - Coming Soon</div>} />
                  <Route path="/fees" element={<PrincipalFees />} />
                  <Route path="/settings" element={<TeacherSettings />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Coach Routes */}
          <Route path="/coach/*" element={
            <ProtectedRoute roles={['coach']}>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<CoachDashboard />} />
                  <Route path="/attendance" element={<CoachClipboard />} />
                  <Route path="/timetable" element={<TeacherTimetable />} />
                  <Route path="/settings" element={<TeacherSettings />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Student Routes */}
          <Route path="/student/*" element={
            <ProtectedRoute roles={['student']}>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<StudentDashboard />} />
                  <Route path="/attendance" element={<StudentAttendance />} />
                  <Route path="/leave" element={<StudentLeave />} />
                  <Route path="/homework" element={<StudentHomework />} />
                  <Route path="/performance" element={<StudentPerformance />} />
                  <Route path="/messages" element={<StudentMessaging />} />
                  <Route path="/fees" element={<StudentFees />} />
                  <Route path="/settings" element={<StudentSettings />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
