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
import Login from './pages/Login';

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
  return <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          
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
                  <Route path="/students" element={<div>Students Management (Coming Soon)</div>} />
                  <Route path="/staff" element={<div>Staff Management (Coming Soon)</div>} />
                  <Route path="/fees" element={<div>Fees Management (Coming Soon)</div>} />
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
