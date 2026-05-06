import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { School, ArrowRight, Loader2, Phone, Mail, Building, CheckCircle2, CreditCard, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadForm, setLeadForm] = useState({
    schoolName: '',
    adminName: '',
    email: '',
    phone: '',
    message: '',
    plan: 'Starter'
  });
  const [leadId, setLeadId] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const plans = [
    { 
      name: 'Starter', 
      price: '₹4,999/mo', 
      capacity: 'Up to 500 students', 
      features: ['Core Admin', 'Parent App', 'Attendance', 'Fee Portal'],
      color: 'bg-slate-50 border-slate-200 text-slate-900'
    },
    { 
      name: 'Growth', 
      price: '₹9,999/mo', 
      capacity: 'Up to 2,000 students', 
      features: ['Starter features', 'GPS Transport', 'Library', 'AI Early Warning'],
      color: 'bg-blue-50 border-blue-200 text-blue-900'
    },
    { 
      name: 'Pro', 
      price: '₹18,999/mo', 
      capacity: 'Up to 5,000 students', 
      features: ['Growth features', 'Sports ECA', 'Multi-Curriculum', 'SEL Dashboard'],
      color: 'bg-purple-50 border-purple-200 text-purple-900'
    },
    { 
      name: 'Elite', 
      price: 'Custom', 
      capacity: 'Unlimited', 
      features: ['All Modules', 'Biometrics', 'Campus Wallet', 'White Labeling', 'Dedicated Support'],
      color: 'bg-amber-50 border-amber-200 text-amber-900'
    },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.post('/leads', leadForm);
      if (res.data.status === 'success') {
        setLeadId(res.data.data.id);
        setCurrentStep(2);
      }
    } catch (error) {
      toast.error('Failed to submit details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlan = (planName: string) => {
    setLeadForm(prev => ({ ...prev, plan: planName }));
    setCurrentStep(3);
  };

  const handlePayment = async () => {
    if (!leadId) return;
    try {
      setIsSubmitting(true);
      await api.put(`/leads/${leadId}/pay`, { paymentStatus: 'paid' });
      toast.success('Payment successful! Your credentials will be sent shortly.');
      setCurrentStep(4);
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetDialog = () => {
    setIsContactDialogOpen(false);
    setCurrentStep(1);
    setLeadId(null);
    setLeadForm({ schoolName: '', adminName: '', email: '', phone: '', message: '', plan: 'Starter' });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.post('/auth/forgot-password', { email: resetEmail });
      if (res.data.status === 'success') {
        toast.success('Reset code sent to your email.');
        setForgotPasswordStep(2);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.post('/auth/reset-password', { 
        email: resetEmail, 
        token: resetToken, 
        newPassword 
      });
      if (res.data.status === 'success') {
        toast.success('Password reset successfully!');
        setIsForgotPasswordOpen(false);
        setForgotPasswordStep(1);
        setResetEmail('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const user = await login(email, password, schoolId);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'principal') {
        navigate('/principal');
      } else if (user.role === 'staff' || user.role === 'teacher') {
        navigate('/teacher');
      } else if (user.role === 'student') {
        navigate('/parent');
      } else {
        navigate('/');
      }
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-body">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <School className="w-8 h-8 text-primary" />
        <span className="text-xl font-display font-bold text-slate-900">EduNexus Pro</span>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl shadow-primary/5">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-display font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">School ID (Optional for Staff/Parents)</label>
              <Input 
                type="text" 
                placeholder="e.g. SCH-001" 
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input 
                type="email" 
                placeholder="admin@edunexus.pro" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <button 
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(true);
                    setForgotPasswordStep(1);
                  }}
                  className="text-xs text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-lg gap-2 mt-6">
              Sign In <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-4">
            <p className="text-sm text-slate-500">
              Not a member yet? <button onClick={() => setIsContactDialogOpen(true)} className="text-primary font-semibold hover:underline">Contact Sales</button>
            </p>
            <div className="pt-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admission')} 
                className="w-full h-11 border-dashed border-primary/30 text-primary hover:bg-primary/5 gap-2"
              >
                <School className="w-4 h-4" /> 
                Looking for Admission? Apply Here
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Sales Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" /> 
                {currentStep === 1 && "Institutional Details"}
                {currentStep === 2 && "Choose Your Plan"}
                {currentStep === 3 && "Secure Payment"}
                {currentStep === 4 && "Request Confirmed"}
              </DialogTitle>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(s => (
                  <div key={s} className={`w-8 h-1.5 rounded-full ${s <= currentStep ? 'bg-primary' : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>
            <DialogDescription>
              {currentStep === 1 && "Start your journey with EduNexus Pro by sharing your school details."}
              {currentStep === 2 && "Select a plan that fits your institution's size and needs."}
              {currentStep === 3 && "Complete your subscription to receive instant access."}
              {currentStep === 4 && "Our team is processing your request."}
            </DialogDescription>
          </DialogHeader>

          {currentStep === 1 && (
            <form onSubmit={handleContactSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-400" /> School Name
                </label>
                <Input 
                  placeholder="e.g. Global High School" 
                  value={leadForm.schoolName}
                  onChange={e => setLeadForm({...leadForm, schoolName: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Administrator Name</label>
                  <Input 
                    placeholder="John Doe" 
                    value={leadForm.adminName}
                    onChange={e => setLeadForm({...leadForm, adminName: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" /> Phone
                  </label>
                  <Input 
                    placeholder="+91 9876543210" 
                    value={leadForm.phone}
                    onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Work Email</label>
                <Input 
                  type="email"
                  placeholder="admin@school.edu" 
                  value={leadForm.email}
                  onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Next: Select Plan
                </Button>
              </DialogFooter>
            </form>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {plans.map((plan) => (
                <div 
                  key={plan.name} 
                  className={`${plan.color} p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 group`}
                  onClick={() => handleSelectPlan(plan.name)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <span className="text-xs font-bold px-2 py-1 bg-white/50 rounded-full">{plan.price}</span>
                  </div>
                  <p className="text-xs mb-3 font-medium opacity-70">{plan.capacity}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map(f => (
                      <li key={f} className="text-[10px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-4 bg-white/50 border-none group-hover:bg-primary group-hover:text-white text-xs h-8">
                    Choose {plan.name}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 py-4 text-center">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-sm mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-slate-500">Plan Selected</span>
                  <Badge className="bg-primary">{leadForm.plan}</Badge>
                </div>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {plans.find(p => p.name === leadForm.plan)?.price}
                </p>
                <p className="text-xs text-slate-500 italic">Billed monthly. Cancel anytime.</p>
              </div>

              <div className="space-y-4 text-left px-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Card Information</label>
                  <Input placeholder="4242 4242 4242 4242" defaultValue="4242 4242 4242 4242" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="MM / YY" defaultValue="12 / 26" />
                  <Input placeholder="CVC" defaultValue="123" />
                </div>
              </div>

              <DialogFooter className="flex-col gap-3">
                <Button onClick={handlePayment} disabled={isSubmitting} className="w-full h-12 text-lg gap-2">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  Complete Payment
                </Button>
                <Button variant="ghost" onClick={() => setCurrentStep(2)} disabled={isSubmitting}>Back to Plans</Button>
              </DialogFooter>
            </div>
          )}

          {currentStep === 4 && (
            <div className="py-8 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">Registration Received!</h3>
                <p className="text-slate-500 px-8">
                  Thank you for joining EduNexus Pro. Your payment for the <strong>{leadForm.plan}</strong> plan was successful.
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">
                Our sales team will verify your payment and email your <strong>Administrator Credentials</strong> to <span className="font-semibold">{leadForm.email}</span> within 2 hours.
              </div>
              <Button onClick={resetDialog} className="w-full h-11">Back to Login</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              {forgotPasswordStep === 1 ? 'Forgot Password' : 'Reset Password'}
            </DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === 1 
                ? "Enter your email address and we'll send you a code to reset your password."
                : "Enter the code sent to your email and your new password."}
            </DialogDescription>
          </DialogHeader>

          {forgotPasswordStep === 1 ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input 
                  type="email"
                  placeholder="admin@edunexus.pro"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Reset Code
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reset Code</label>
                <Input 
                  placeholder="Enter 6-digit code"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input 
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input 
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <div className="absolute bottom-8 text-slate-400 text-sm">
        © 2026 EduNexus Pro. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
