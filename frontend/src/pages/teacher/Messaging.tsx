import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  MoreVertical, 
  CheckCheck,
  Loader2,
  Paperclip,
  UserPlus,
  File as FileIcon,
  Download,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const TeacherMessaging: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/portal/conversations/${user.uid}`);
      const data = res.data.data || [];
      
      if (JSON.stringify(data) !== JSON.stringify(conversations)) {
        setConversations(data);
        if (selectedConv) {
          const updatedSelected = data.find((c: any) => c.id === selectedConv.id);
          if (updatedSelected) setSelectedConv(updatedSelected);
        } else if (data.length > 0) {
          setSelectedConv(data[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/portal/students-list/${user.schoolId}`);
      setStudents(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await api.get(`/portal/messages/${convId}`);
      const data = res.data.data || [];
      if (JSON.stringify(data) !== JSON.stringify(messages)) {
        setMessages(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchConversations();
      fetchStudents();
      const convInterval = setInterval(() => fetchConversations(true), 4000);
      return () => clearInterval(convInterval);
    }
  }, [user]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => fetchMessages(selectedConv.id), 2000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [selectedConv?.id]);

  const handleSendMessage = async (fileData?: { url: string, type: string, name: string }) => {
    if (!newMessage.trim() && !fileData) return;
    const content = fileData ? `Shared a ${fileData.type}` : newMessage;
    if (!fileData) setNewMessage('');
    
    const tempMsg = {
      id: Date.now().toString(),
      conversationId: selectedConv.id,
      senderId: user.uid,
      content,
      fileUrl: fileData?.url,
      fileType: fileData?.type,
      createdAt: new Date().toISOString(),
      optimistic: true
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await api.post('/portal/messages/send', {
        conversationId: selectedConv.id,
        senderId: user.uid,
        content,
        fileUrl: fileData?.url,
        fileType: fileData?.type
      });
      fetchMessages(selectedConv.id);
      fetchConversations(true);
    } catch (error) {
      toast.error('Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/portal/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await handleSendMessage(res.data.data);
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startChat = async (studentUserId: string) => {
    if (!studentUserId) {
        toast.error("This student does not have a user account linked.");
        return;
    }
    try {
      const res = await api.post('/portal/conversations/start', {
        schoolId: user.schoolId,
        participant1: user.uid,
        participant2: studentUserId
      });
      setIsNewChatOpen(false);
      await fetchConversations();
      setSelectedConv(res.data.data);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const renderMessageContent = (m: any) => {
    if (!m.fileUrl) return <p className="text-sm font-medium leading-relaxed">{m.content}</p>;

    switch (m.fileType) {
      case 'image':
        return (
          <div className="space-y-2">
            <img src={m.fileUrl} alt="Shared" className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(m.fileUrl)} />
            <p className="text-[10px] opacity-70 italic">Image shared</p>
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            <div className="relative group">
              <video src={m.fileUrl} className="rounded-xl max-w-full max-h-64 object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors rounded-xl cursor-pointer" onClick={() => window.open(m.fileUrl)}>
                <Film className="w-10 h-10 text-white" />
              </div>
            </div>
            <p className="text-[10px] opacity-70 italic">Video shared</p>
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-2">
            <audio controls src={m.fileUrl} className="w-full h-8" />
            <p className="text-[10px] opacity-70 italic">Audio message</p>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => window.open(m.fileUrl)}>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FileIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">Document Attachment</p>
              <p className="text-[10px] opacity-70 uppercase tracking-widest">{m.fileType || 'File'}</p>
            </div>
            <Download className="w-4 h-4 opacity-70" />
          </div>
        );
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && conversations.length === 0) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Accessing Secure Messaging...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-180px)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Sidebar - Conversation List */}
      <Card className="w-96 border-none shadow-2xl rounded-[2.5rem] bg-white flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-display font-bold text-slate-900">Messages</h3>
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 text-primary">
                    <UserPlus className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2rem] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display font-bold text-xl">Message a Student</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="Search students..." className="pl-10 rounded-xl bg-slate-50 border-none h-11" />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {students.map(s => (
                        <div 
                          key={s.id} 
                          onClick={() => startChat(s.userId)}
                          className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <Avatar>
                            <AvatarImage src={s.photoURL} />
                            <AvatarFallback className="bg-primary/10 text-primary">{s.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Class {s.grade}-{s.section}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
           </div>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search conversations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl bg-slate-50 border-none h-11 shadow-inner" 
              />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
           {filteredConversations.length === 0 ? (
              <div className="text-center py-10">
                 <p className="text-slate-400 text-sm font-medium">No active conversations.</p>
              </div>
           ) : (
             filteredConversations.map((conv) => (
               <div 
                 key={conv.id} 
                 onClick={() => setSelectedConv(conv)}
                 className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all ${selectedConv?.id === conv.id ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'hover:bg-slate-50'}`}
               >
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                     <AvatarImage src={conv.otherParticipant?.photoURL} />
                     <AvatarFallback className={selectedConv?.id === conv.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}>
                        {conv.otherParticipant?.name?.[0] || 'S'}
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                     <div className="flex justify-between items-baseline">
                        <span className="font-bold text-sm truncate">{conv.otherParticipant?.name}</span>
                        <span className={`text-[10px] ${selectedConv?.id === conv.id ? 'text-white/60' : 'text-slate-400'}`}>
                          {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                     <p className={`text-xs truncate ${selectedConv?.id === conv.id ? 'text-white/80' : 'text-slate-500 font-medium'}`}>{conv.lastMessage || 'Start a conversation...'}</p>
                  </div>
               </div>
             ))
           )}
        </div>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 border-none shadow-2xl rounded-[3rem] bg-white flex flex-col overflow-hidden relative">
        {selectedConv ? (
          <>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
               <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-slate-50 shadow-sm">
                     <AvatarImage src={selectedConv.otherParticipant?.photoURL} />
                     <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold">
                       {selectedConv.otherParticipant?.name?.[0]}
                     </AvatarFallback>
                  </Avatar>
                  <div>
                     <h4 className="font-display font-bold text-slate-900">{selectedConv.otherParticipant?.name}</h4>
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl text-slate-400"><MoreVertical className="w-5 h-5" /></Button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 custom-scrollbar">
               {messages.map((m, idx) => {
                 const isMe = m.senderId === user.uid;
                 const showDate = idx === 0 || new Date(m.createdAt).toDateString() !== new Date(messages[idx-1].createdAt).toDateString();
                 
                 return (
                   <React.Fragment key={m.id}>
                     {showDate && (
                       <div className="flex justify-center my-4">
                         <span className="px-3 py-1 bg-white shadow-sm border border-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                         </span>
                       </div>
                     )}
                     <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[70%] p-4 rounded-[2rem] shadow-lg ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                           {renderMessageContent(m)}
                           <div className="flex items-center justify-end gap-1 mt-2">
                              <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                                 {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                m.optimistic ? <Loader2 className="w-3 h-3 animate-spin text-white/40" /> : <CheckCheck className="w-3 h-3 text-white/60" />
                              )}
                           </div>
                        </div>
                     </div>
                   </React.Fragment>
                 );
               })}
               <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-slate-50 bg-white">
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploading}
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-slate-400 hover:text-primary"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                  </Button>
                  <input 
                    type="text" 
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium px-2"
                  />
                  <Button onClick={() => handleSendMessage()} disabled={!newMessage.trim() && !uploading} className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex items-center justify-center p-0 transition-transform active:scale-95">
                     <Send className="w-5 h-5" />
                  </Button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
             <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-8 border-2 border-dashed border-slate-200">
                <MessageSquare className="w-12 h-12" />
             </div>
             <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Classroom Messaging</h3>
             <p className="text-slate-400 font-medium max-w-sm">Select a student or parent to start a secure communication thread.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeacherMessaging;
