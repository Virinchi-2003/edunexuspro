import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface EliteGatingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockedUI?: boolean;
}

const EliteGating: React.FC<EliteGatingProps> = ({ 
  children, 
  fallback = null, 
  showLockedUI = true 
}) => {
  const { user } = useAuth();
  const isElite = user?.subscriptionPlan?.toUpperCase() === 'ELITE';

  if (isElite) {
    return <>{children}</>;
  }

  if (!showLockedUI) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-200">
        <Lock className="w-10 h-10" />
      </div>
      <div className="flex items-center gap-2 mb-2">
         <Sparkles className="w-5 h-5 text-indigo-600" />
         <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Elite Feature Locked</h3>
      </div>
      <p className="text-slate-500 font-medium max-w-sm mx-auto mb-8">
        The Campus Wallet & FinTech module is exclusively available for schools on the <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Elite Plan</span>.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
         <Button className="rounded-2xl h-12 px-8 bg-slate-900 hover:bg-indigo-600 text-white font-bold transition-all">
            Upgrade to Elite
         </Button>
         <Button variant="ghost" className="rounded-2xl h-12 px-8 font-bold">
            Contact Support
         </Button>
      </div>
    </div>
  );
};

export default EliteGating;
