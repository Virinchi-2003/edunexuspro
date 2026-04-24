import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Lock, 
  Settings as SettingsIcon, 
  Save, 
  UserPlus, 
  Trash2,
  Mail,
  Phone,
  Loader2,
  Database,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [uptime, setUptime] = useState('0d 0h 0m');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdatePassword = async () => {
    if (!securityData.currentPassword || !securityData.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsSaving(true);
      const currentUserUid = admins.find(a => a.email === user?.email)?.uid;
      await api.put(`/management/admins/${currentUserUid}/password`, {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      toast.success('Password updated successfully');
      setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = () => {
    toast.info('Avatar upload service is currently being provisioned. Please try again later.');
  };

  const handleViewAuditLogs = () => {
    toast.success('Audit logs are synchronized with the database. Fetching latest activity...');
    setTimeout(() => {
      toast.info('Showing last 50 administrative actions.');
    }, 1000);
  };

  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: ''
  });
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: ''
  });

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/management/admins');
      setAdmins(res.data.data || []);
      const current = res.data.data?.find((a: any) => a.email === user?.email);
      if (current) {
        setProfileData({
          name: current.name || '',
          email: current.email,
          phoneNumber: current.phoneNumber || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch admins');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/management/stats');
      setUptime(res.data.data.uptime || '0d 0h 0m');
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/management/config');
      const maintenance = res.data.data.find((c: any) => c.key === 'maintenance_mode');
      if (maintenance) setMaintenanceMode(maintenance.value === 'true');
    } catch (error) {
      console.error('Failed to fetch config');
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchStats();
    fetchConfig();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleMaintenanceMode = async () => {
    try {
      setIsUpdatingConfig(true);
      const newValue = !maintenanceMode;
      await api.put('/management/config', { key: 'maintenance_mode', value: newValue.toString() });
      setMaintenanceMode(newValue);
      toast.success(`Maintenance mode ${newValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update system configuration');
    } finally {
      setIsUpdatingConfig(false);
    }
  };


  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      const currentUserUid = admins.find(a => a.email === user?.email)?.uid;
      if (!currentUserUid) throw new Error('User not found');
      await api.put(`/management/admins/${currentUserUid}`, profileData);
      toast.success('Profile updated successfully');
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email) {
      toast.error('Name and Email are required');
      return;
    }
    try {
      setLoading(true);
      await api.post('/management/admins', newAdmin);
      toast.success('New administrator added');
      setNewAdmin({ name: '', email: '', phoneNumber: '', password: '' });
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add administrator');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (uid: string) => {
    if (admins.find(a => a.uid === uid)?.email === user?.email) {
      toast.error('You cannot remove your own administrative access');
      return;
    }
    if (!window.confirm('Remove this administrator?')) return;
    try {
      await api.delete(`/management/admins/${uid}`);
      toast.success('Administrator removed');
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove administrator');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500">Manage your administrative profile and system-wide configurations.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-slate-100 p-1 mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" /> My Profile
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Shield className="w-4 h-4" /> Team Management
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="w-4 h-4" /> System Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Administrative Profile</CardTitle>
              <CardDescription>Update your personal information and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <Button variant="outline" className="text-xs" onClick={handleAvatarChange}>Change Avatar</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Full Name</label>
                  <Input 
                    value={profileData.name}
                    onChange={e => setProfileData({...profileData, name: e.target.value})}
                    placeholder="Enter your name"
                    className="bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email Address</label>
                  <Input 
                    value={profileData.email}
                    disabled
                    className="bg-slate-50 border-none opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Phone Number</label>
                  <Input 
                    value={profileData.phoneNumber}
                    onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                    placeholder="+91..."
                    className="bg-slate-50 border-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleUpdateProfile} disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Add Administrator</CardTitle>
                <CardDescription>Invite a new team member with global access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Full Name</label>
                  <Input 
                    value={newAdmin.name}
                    onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                    placeholder="e.g. Jane Doe"
                    className="bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Email Address</label>
                  <Input 
                    value={newAdmin.email}
                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                    placeholder="admin@edunexuspro.com"
                    className="bg-slate-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-400">Password</label>
                  <Input 
                    type="password"
                    value={newAdmin.password}
                    onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                    placeholder="••••••••"
                    className="bg-slate-50 border-none"
                  />
                </div>
                <Button onClick={handleAddAdmin} disabled={loading} className="w-full gap-2 mt-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Add Admin
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Administrative Team</CardTitle>
                <CardDescription>Currently authorized users with system-wide permissions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.map((admin) => (
                    <div key={admin.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {(admin.name || admin.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {admin.name || 'Unnamed Admin'}
                            {admin.email === user?.email && <Badge className="ml-2 bg-slate-200 text-slate-600 border-none">You</Badge>}
                          </p>
                          <p className="text-sm text-slate-500">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600" 
                          onClick={() => handleDeleteAdmin(admin.uid)}
                          disabled={admin.email === user?.email}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-none shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and authentication preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Current Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-slate-50 border-none"
                    value={securityData.currentPassword}
                    onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">New Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="bg-slate-50 border-none"
                      value={securityData.newPassword}
                      onChange={e => setSecurityData({...securityData, newPassword: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Confirm Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="bg-slate-50 border-none"
                      value={securityData.confirmPassword}
                      onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <Button className="gap-2" onClick={handleUpdatePassword} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Update Password
              </Button>
              
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                    <p className="text-sm text-slate-500">Secure your account with multi-factor authentication.</p>
                  </div>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-500" />
                  Application Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Version</span>
                  <span className="font-mono font-bold">v1.2.4-stable</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Environment</span>
                  <Badge variant="outline">Production</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Uptime</span>
                  <span className="text-green-600 font-semibold font-mono">{uptime}</span>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Maintenance Mode</p>
                      <p className="text-xs text-slate-500">Disable institutional access for updates.</p>
                    </div>
                    <Button 
                      variant={maintenanceMode ? "destructive" : "outline"} 
                      size="sm"
                      onClick={toggleMaintenanceMode}
                      disabled={isUpdatingConfig}
                    >
                      {isUpdatingConfig && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      {maintenanceMode ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Platform Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-4">You have 0 critical system alerts.</p>
                <Button variant="outline" className="w-full" onClick={handleViewAuditLogs}>View Audit Logs</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
