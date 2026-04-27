import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Building, 
  User, 
  Shield, 
  Key, 
  Loader2,
  Save,
  LogOut,
  MapPin,
  School,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const PrincipalSettings: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<any>(null);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    if (user?.schoolId) {
      api.get(`/schools/${user.schoolId}`).then(res => {
        setSchool(res.data.data);
      });
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put(`/auth/profile/${user.uid}`, profileForm);
      updateUser({ name: profileForm.name, phoneNumber: profileForm.phone });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/change-password', {
        userId: user.uid,
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      });
      toast.success('Password changed successfully');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Portal Settings</h2>
        <p className="text-slate-500">Manage your school profile and account preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: School Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <div className="h-24 bg-gradient-to-r from-primary to-indigo-600" />
            <div className="px-6 pb-6 -mt-12">
              <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center text-primary mb-4 border-4 border-white overflow-hidden">
                <School className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{school?.name || 'Loading...'}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <Building className="w-3.5 h-3.5" /> ID: {school?.school_id || 'SCH-XXX'}
              </p>
              
              <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Address</div>
                    <div className="text-sm text-slate-600 leading-relaxed">{school?.address || 'Loading...'}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscription</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-emerald-50 text-emerald-600 border-none capitalize">{school?.subscriptionPlan || 'Starter'}</Badge>
                      <div className="text-xs text-slate-400">Active until Dec 2026</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full mt-8 rounded-xl gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" onClick={logout}>
                <LogOut className="w-4 h-4" /> Log out of Portal
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Principal Profile
              </CardTitle>
              <CardDescription>Update your personal information visible to the board.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <Input 
                      value={profileForm.name}
                      onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                      className="bg-slate-50 border-none h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Contact Number</label>
                    <Input 
                      value={profileForm.phone}
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                      className="bg-slate-50 border-none h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <Input 
                    disabled
                    value={profileForm.email}
                    className="bg-slate-100 border-none h-11 rounded-xl opacity-70"
                  />
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Identity Verified Account
                  </p>
                </div>
                <div className="flex justify-end pt-2">
                  <Button disabled={loading} className="rounded-xl px-8 shadow-lg shadow-primary/20 gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Form */}
          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" /> Security & Password
              </CardTitle>
              <CardDescription>Change your password to keep your portal secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Current Password</label>
                  <Input 
                    type="password"
                    value={passwordForm.current}
                    onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                    className="bg-slate-50 border-none h-11 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">New Password</label>
                    <Input 
                      type="password"
                      value={passwordForm.new}
                      onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                      className="bg-slate-50 border-none h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                    <Input 
                      type="password"
                      value={passwordForm.confirm}
                      onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                      className="bg-slate-50 border-none h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="outline" disabled={loading} className="rounded-xl px-8 gap-2">
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Update Security
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default PrincipalSettings;
