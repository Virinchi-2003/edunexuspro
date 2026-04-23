import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const AIInsights: React.FC = () => {
  const insights = [
    {
      type: 'positive',
      title: 'Fee Collection Uptick',
      description: 'Predicted 15% increase in on-time fee payments for Q3 based on current auto-debit adoption.',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      type: 'warning',
      title: 'Retention Risk',
      description: '3 schools in "Starter" plan show declining login activity. Outreach recommended.',
      icon: AlertCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      type: 'success',
      title: 'Optimization Success',
      description: 'System resource usage down by 22% after implementing automated database pruning.',
      icon: CheckCircle2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24 text-primary animate-pulse" />
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-display">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Nexus Insights
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {insights.map((insight, idx) => (
          <div 
            key={idx} 
            className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex gap-4">
              <div className={`p-2 h-fit rounded-lg ${insight.bgColor} ${insight.color}`}>
                <insight.icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {insight.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Overall Platform Health</span>
            <span className="text-primary font-bold">98.4%</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[98.4%] rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsights;
