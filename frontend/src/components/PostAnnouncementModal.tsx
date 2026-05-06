import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Megaphone, 
  Plus, 
  FileUp, 
  X, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

interface PostAnnouncementModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const PostAnnouncementModal: React.FC<PostAnnouncementModalProps> = ({ onSuccess, trigger }) => {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  
  const [formData, setFormData] = React.useState({
    title: '',
    content: '',
    type: 'notice' as any,
    priority: 'medium' as any,
    attachmentUrl: '',
    attachmentName: ''
  });

  const [file, setFile] = React.useState<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    setFile(selectedFile);
    
    // Auto-upload for simplicity, or we could wait for form submission
    try {
      setUploading(true);
      const data = new FormData();
      data.append('file', selectedFile);
      
      const res = await api.post('/portal/media/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormData(prev => ({
        ...prev,
        attachmentUrl: res.data.data.url,
        attachmentName: selectedFile.name
      }));
      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload document');
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFormData(prev => ({ ...prev, attachmentUrl: '', attachmentName: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/announcements', {
        ...formData,
        schoolId: user?.schoolId,
        postedBy: user?.uid
      });
      
      toast.success('Announcement posted successfully');
      setOpen(false);
      setFormData({
        title: '',
        content: '',
        type: 'notice',
        priority: 'medium',
        attachmentUrl: '',
        attachmentName: ''
      });
      setFile(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-xl font-bold">
            <Plus className="w-4 h-4" /> Post Notice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-primary p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <Megaphone className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold text-white">Create Announcement</DialogTitle>
            <p className="text-primary-foreground/80 text-sm">Post a new notice to the school community.</p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Notice Title</label>
            <Input 
              placeholder="e.g., Annual Sports Day 2026"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Type</label>
              <Select 
                value={formData.type} 
                onValueChange={v => setFormData({ ...formData, type: v as any })}
              >
                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="notice">General Notice</SelectItem>
                  <SelectItem value="event">School Event</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="exam">Examination</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Priority</label>
              <Select 
                value={formData.priority} 
                onValueChange={v => setFormData({ ...formData, priority: v as any })}
              >
                <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High / Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Message Details</label>
            <Textarea 
              placeholder="Write your announcement details here..."
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="rounded-xl border-slate-200 focus:border-primary focus:ring-primary bg-slate-50/50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Attachment (Optional)</label>
            {!file ? (
              <div className="relative">
                <input 
                  type="file" 
                  id="notice-file" 
                  className="hidden" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <label 
                  htmlFor="notice-file"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-primary/30 transition-all group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors mb-2" />
                    <p className="text-xs font-medium text-slate-500">
                      <span className="font-bold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, JPG or PNG (max. 10MB)</p>
                  </div>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                      {uploading ? 'Uploading...' : 'Ready to post'}
                    </p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={removeFile}
                  className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="rounded-xl font-bold text-slate-500"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploading}
              className="rounded-xl font-bold px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : 'Publish Notice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostAnnouncementModal;
