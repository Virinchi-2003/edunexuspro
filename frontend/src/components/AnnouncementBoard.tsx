import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Calendar, 
  Megaphone, 
  FileText, 
  Trash2, 
  ExternalLink,
  PlusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'event' | 'holiday' | 'exam' | 'notice' | 'other';
  priority: 'low' | 'medium' | 'high';
  audience?: 'all' | 'staff' | 'student';
  attachmentUrl?: string;
  attachmentName?: string;
  authorName?: string;
  postedAt: string;
}

interface AnnouncementBoardProps {
  limit?: number;
  showPostButton?: boolean;
}

const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({ limit, showPostButton = false }) => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchAnnouncements = React.useCallback(async () => {
    if (!user?.schoolId) return;
    try {
      setLoading(true);
      const res = await api.get(`/announcements/${user.schoolId}`);
      setAnnouncements(res.data.data);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  React.useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'holiday': return <Megaphone className="w-4 h-4" />;
      case 'exam': return <FileText className="w-4 h-4" />;
      case 'notice': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const displayedAnnouncements = limit ? announcements.slice(0, limit) : announcements;

  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Megaphone className="w-4 h-4" />
          </div>
          <CardTitle className="text-lg font-bold">Notice Board</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white text-xs font-medium border-slate-200">
            {announcements.length} Notices
          </Badge>
          {showPostButton && (user?.role === 'principal' || user?.role === 'admin') && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary">
              <PlusCircle className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-sm text-slate-500">Syncing notices...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold">No active announcements</h3>
            <p className="text-slate-500 text-sm mt-1">Check back later for school updates.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {displayedAnnouncements.map((announcement) => (
              <div key={announcement.id} className="p-5 hover:bg-slate-50/50 transition-colors group">
                <div className="flex gap-4">
                  <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getPriorityColor(announcement.priority)} shadow-sm`}>
                    {getIcon(announcement.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {announcement.type}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-md border-none ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority}
                        </Badge>
                        {announcement.audience && announcement.audience !== 'all' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md border-none bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">
                            {announcement.audience === 'staff' ? 'Staff Only' : 'Students Only'}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 shrink-0">
                        {format(new Date(announcement.postedAt), 'MMM dd, p')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">
                      {announcement.title}
                    </h4>
                    <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {announcement.content}
                    </p>
                    
                    {announcement.attachmentUrl && (
                      <div className="mt-3">
                        <a 
                          href={announcement.attachmentUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {announcement.attachmentName || 'View Document'}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                          {announcement.authorName?.charAt(0) || 'A'}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                          Posted by {announcement.authorName || 'Principal'}
                        </span>
                      </div>
                      
                      {(user?.role === 'principal' || user?.role === 'admin') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(announcement.id)}
                          className="h-7 w-7 p-0 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {announcements.length > 0 && limit && announcements.length > limit && (
        <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
          <Button variant="link" size="sm" className="text-primary font-bold text-xs">
            View All Announcements
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AnnouncementBoard;
