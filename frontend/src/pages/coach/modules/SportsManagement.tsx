import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

const SportsManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sports, setSports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchSports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/coach/sports/${user.schoolId}`);
      setSports(res.data.data);
    } catch (error) {
      toast.error('Failed to load sports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return toast.error('Sport name is required');
    try {
      setSaving(true);
      if (selectedSport) {
        await api.put(`/coach/sports/${selectedSport.id}`, formData);
        toast.success('Sport updated successfully');
      } else {
        await api.post('/coach/sports', {
          ...formData,
          schoolId: user.schoolId
        });
        toast.success('New sport added');
      }
      setIsModalOpen(false);
      fetchSports();
    } catch (error) {
      toast.error('Failed to save sport');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will remove the sport and related data.')) return;
    try {
      await api.delete(`/coach/sports/${id}`);
      toast.success('Sport deleted');
      fetchSports();
    } catch (error) {
      toast.error('Failed to delete sport');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setSelectedSport(null);
  };

  const filteredSports = sports.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Search sports..." 
            className="pl-12 h-14 rounded-2xl border-none shadow-xl bg-white focus-visible:ring-2 focus-visible:ring-indigo-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="rounded-2xl h-14 px-6 font-bold bg-white border-slate-100 text-slate-600 gap-2 flex-1 md:flex-none"
            onClick={fetchSports}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button 
            className="rounded-2xl h-14 px-8 font-bold bg-slate-900 text-white shadow-xl hover:bg-slate-800 gap-2 flex-1 md:flex-none"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-5 h-5" />
            Add Sport
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Updating Sports List...</p>
          </div>
        ) : filteredSports.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-400">
            No sports found. Add one to get started!
          </div>
        ) : (
          filteredSports.map((sport) => (
            <Card key={sport.id} className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      onClick={() => {
                        setSelectedSport(sport);
                        setFormData({ name: sport.name, description: sport.description || '' });
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => handleDelete(sport.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">{sport.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">{sport.description || 'No description provided'}</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-6">
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Program</span>
                  </div>
                  <Badge variant="outline" className="rounded-lg bg-slate-50 text-slate-600 border-slate-200">
                    Manual Entry
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-10 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">
              {selectedSport ? 'Edit Sport' : 'Add New Sport'}
            </DialogTitle>
            <DialogDescription>
              {selectedSport ? 'Update sports activity details' : 'Create a new sports program for the school'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Sport Name</label>
              <Input 
                placeholder="e.g., Cricket, Football" 
                className="rounded-2xl h-14 bg-slate-50 border-none px-6 text-lg font-bold"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Description</label>
              <textarea 
                className="w-full min-h-[120px] rounded-2xl bg-slate-50 border-none p-6 text-sm focus:ring-2 focus:ring-indigo-100"
                placeholder="Describe the activity, schedule or requirements..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5 mr-2" />}
              {selectedSport ? 'Update Program' : 'Launch Sport Program'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SportsManagement;
