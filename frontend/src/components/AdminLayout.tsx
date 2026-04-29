import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Bell,
  Search,
  MessageSquare,
  Calendar,
  GraduationCap,
  Trophy,
  FileText,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: School, label: 'Schools', path: '/admin/schools' },
    { icon: MessageSquare, label: 'Enquiries', path: '/admin/enquiries' },
    { icon: Users, label: 'Principals', path: '/admin/principals' },
    { icon: CreditCard, label: 'Subscriptions', path: '/admin/subscriptions' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  const principalNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/principal' },
    { icon: Users, label: 'Students', path: '/principal/students' },
    { icon: MessageSquare, label: 'Admissions', path: '/principal/admissions' },
    { icon: Users, label: 'Staff', path: '/principal/staff' },
    { icon: Calendar, label: 'Timetable', path: '/principal/timetable' },
    { icon: GraduationCap, label: 'Examinations', path: '/principal/exams' },
    { icon: Trophy, label: 'Gradebook', path: '/principal/gradebook' },
    { icon: CreditCard, label: 'Fees', path: '/principal/fees' },
    { icon: Calendar, label: 'Attendance', path: '/principal/attendance' },
    { icon: Settings, label: 'Settings', path: '/principal/settings' },
  ];

  const teacherNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher' },
    { icon: Users, label: 'Students', path: '/teacher/students' },
    { icon: Calendar, label: 'Timetable', path: '/teacher/timetable' },
    { icon: GraduationCap, label: 'Examinations', path: '/teacher/exams' },
    { icon: Trophy, label: 'Gradebook', path: '/teacher/gradebook' },
    { icon: Calendar, label: 'Attendance', path: '/teacher/attendance' },
    { icon: CreditCard, label: 'Fees', path: '/teacher/fees' },
    { icon: Settings, label: 'Settings', path: '/teacher/settings' },
  ];

  const studentNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
    { icon: Calendar, label: 'Attendance', path: '/student/attendance' },
    { icon: FileText, label: 'Leave Request', path: '/student/leave' },
    { icon: BookOpen, label: 'Homework', path: '/student/homework' },
    { icon: MessageSquare, label: 'Messages', path: '/student/messages' },
    { icon: Trophy, label: 'Performance', path: '/student/performance' },
    { icon: CreditCard, label: 'Fees', path: '/student/fees' },
    { icon: Settings, label: 'Settings', path: '/student/settings' },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin': return adminNavItems;
      case 'principal': return principalNavItems;
      case 'staff':
      case 'teacher': return teacherNavItems;
      case 'student': return studentNavItems;
      default: return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-body">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <NavLink to={user?.role === 'admin' ? '/admin' : user?.role === 'principal' ? '/principal' : (user?.role === 'staff' || user?.role === 'teacher') ? '/teacher' : '/student'}>
            <h1 className="text-2xl font-display font-bold text-primary flex items-center gap-2">
              <School className="w-8 h-8" />
              EduNexus <span className="text-slate-400">Pro</span>
            </h1>
          </NavLink>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-primary'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-600 hover:text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search schools, transactions..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-500">
              <Bell className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user?.displayName}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <Avatar>
                <AvatarImage src={user?.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user?.displayName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
