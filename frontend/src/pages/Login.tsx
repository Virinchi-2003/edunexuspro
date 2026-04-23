import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { School, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
    navigate('/admin');
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
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-lg gap-2 mt-6">
              Sign In <ArrowRight className="w-5 h-5" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Not a member yet? <a href="#" className="text-primary font-semibold hover:underline">Contact Sales</a>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="absolute bottom-8 text-slate-400 text-sm">
        © 2026 EduNexus Pro. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
