import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Filter,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const SchoolsPage: React.FC = () => {
  const [schools] = useState([
    { id: '1', name: 'St. Xavier High School', location: 'Mumbai, MH', plan: 'Elite', status: 'active', students: 1200 },
    { id: '2', name: 'Greenwood Academy', location: 'Bangalore, KA', plan: 'Pro', status: 'active', students: 850 },
    { id: '3', name: 'Little Flowers Primary', location: 'Delhi, DL', plan: 'Starter', status: 'pending', students: 340 },
    { id: '4', name: 'Global International', location: 'Hyderabad, TS', plan: 'Growth', status: 'suspended', students: 2100 },
    { id: '5', name: 'Oakridge School', location: 'Pune, MH', plan: 'Pro', status: 'active', students: 600 },
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900">Schools Management</h2>
          <p className="text-slate-500">Manage all registered institutions and their subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Add New School
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="p-0 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-center gap-4 p-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search by school name, location or ID..." 
                className="pl-10 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button variant="ghost" className="gap-2 text-slate-600">
                <Filter className="w-4 h-4" /> Filter
              </Button>
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              <p className="text-sm text-slate-500 whitespace-nowrap px-2">Total: {schools.length} Schools</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="w-[300px]">School Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((school) => (
                <TableRow key={school.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {school.name.substring(0, 2).toUpperCase()}
                      </div>
                      {school.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600">{school.location}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`
                        capitalize border-none
                        ${school.plan === 'Elite' ? 'bg-purple-100 text-purple-700' : 
                          school.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 
                          'bg-slate-100 text-slate-700'}
                      `}
                    >
                      {school.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{school.students.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        school.status === 'active' ? 'bg-green-500' : 
                        school.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm capitalize text-slate-700">{school.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolsPage;
