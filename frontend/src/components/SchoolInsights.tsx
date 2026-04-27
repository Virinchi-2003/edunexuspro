import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, AlertCircle, Users, CheckCircle2 } from 'lucide-react';

const SchoolInsights: React.FC<{ stats: any }> = ({ stats }) => {
  const insights = [
    {
      title: 'Fee Progress',
      description: stats.totalFeesExpected > 0 
        ? `You have collected ${((stats.feesCollected / stats.totalFeesExpected) * 100).toFixed(1)}% of total expected fees. Keep it up!`
        : 'Initialize fee records to track collection progress.',
      icon: TrendingUp,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Attendance Trend',
      description: 'Daily attendance is averaging at 94.2%. Class 10-A shows a slight decline this week.',
      icon: AlertCircle,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Staffing Status',
      description: `Managing ${stats.students} students with ${stats.staff} active staff members. Ratio is 1:${(stats.students / (stats.staff || 1)).toFixed(0)}.`,
      icon: Users,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
  ];

  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative rounded-3xl h-full">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24 text-primary animate-pulse" />
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-display">
          <Sparkles className="w-5 h-5 text-primary" />
          Nexus AI Intelligence
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
            <span>Overall Campus Performance</span>
            <span className="text-primary font-bold">92.4%</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[92.4%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolInsights;
