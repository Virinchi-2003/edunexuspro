import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  LogOut,
  Camera,
  CheckCircle2,
  BookOpen,
  MapPin,
  Briefcase,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { useRef } from 'react';

const TeacherSettings: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/staff/user/${user.uid}`);
      setProfile(res.data.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) fetchProfile();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    try {
      setSaving(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        await api.put(`/auth/profile/${user.uid}`, {
          photoURL: base64String,
          name: profile?.name
        });
        
        updateUser({ photoURL: base64String });
        toast.success('Profile picture updated successfully');
        fetchProfile();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put(`/auth/profile/${user.uid}`, {
        name: profile?.name,
        phone: profile?.phoneNumber
      });
      updateUser({ name: profile?.name });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-4xl font-display font-bold text-slate-900 tracking-tight">Teacher Profile</h2>
        <p className="text-slate-500 font-medium mt-1">Manage your professional information and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Quick Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
            <div className="h-32 bg-gradient-to-br from-indigo-600 to-violet-700 relative">
               <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-[2rem] shadow-xl">
                  <Avatar className="w-24 h-24 rounded-[1.8rem] border-4 border-white">
                    <AvatarImage src={profile?.photoURL || user?.photoURL} />
                    <AvatarFallback className="bg-indigo-50 text-indigo-600 text-2xl font-bold">
                      {profile?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                  <button 
                    className="absolute bottom-1 right-1 bg-slate-900 text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
               </div>
            </div>
            <CardContent className="pt-16 pb-8 px-8">
              <div className="mb-6">
                <h3 className="text-2xl font-display font-bold text-slate-900">{profile?.name}</h3>
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{profile?.designation || 'Senior Faculty'}</p>
                <div className="flex items-center gap-2 mt-4">
                   <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] uppercase px-3 py-1">Identity Verified</Badge>
                   <Badge className="bg-indigo-50 text-indigo-600 border-none font-bold text-[10px] uppercase px-3 py-1">Active</Badge>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center gap-3 text-slate-500">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">{profile?.department?.charAt(0).toUpperCase() + profile?.department?.slice(1)} Department</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Assigned: {profile?.classes || 'None'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Main Campus, Hyderabad</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-8 rounded-2xl h-12 border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold gap-2"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" /> Log out of Portal
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Edit Profile */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-4">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <User className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-2xl font-display font-bold">Personal Information</CardTitle>
              </div>
              <CardDescription className="text-slate-500 font-medium">Update your public profile visible to the principal and staff.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Professional Name</label>
                    <Input 
                      defaultValue={profile?.name} 
                      className="h-12 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Contact Number</label>
                    <Input 
                      placeholder="+91 98765 43210" 
                      className="h-12 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      readOnly 
                      value={profile?.email} 
                      className="h-12 pl-12 rounded-xl bg-slate-100 border-none text-slate-500 font-medium cursor-not-allowed"
                    />
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="rounded-2xl h-14 px-8 bg-slate-900 text-white font-bold shadow-xl shadow-slate-200 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    Save Professional Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white p-4">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <Lock className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-2xl font-display font-bold">Security & Password</CardTitle>
              </div>
              <CardDescription className="text-slate-500 font-medium">Ensure your account is protected with a strong password.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Current Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">New Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 rounded-xl bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
               </div>
               <Button variant="outline" className="rounded-xl h-11 border-indigo-100 text-indigo-600 font-bold hover:bg-indigo-50">
                 Update Security Credentials
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherSettings;
