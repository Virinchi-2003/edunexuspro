import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video,
  Check,
  CheckCheck,
  Loader2,
  Paperclip
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const StudentMessaging: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/portal/conversations/${user.id}`);
      setConversations(res.data.data || []);
      if (res.data.data?.length > 0) setSelectedConv(res.data.data[0]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchConversations();
  }, [user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    try {
      const msg = {
        conversationId: selectedConv.id,
        senderId: user.id,
        content: newMessage
      };
      await api.post('/portal/messages/send', msg);
      setMessages([...messages, { ...msg, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Connecting Secure Chat...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-180px)] flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar - Conversation List */}
      <Card className="w-96 border-none shadow-2xl rounded-[2.5rem] bg-white flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50">
           <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">Messages</h3>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search teachers..." className="pl-10 rounded-xl bg-slate-50 border-none h-11" />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
           {conversations.length === 0 ? (
             <div className="text-center py-10">
                <p className="text-slate-400 text-sm font-medium">No active conversations.</p>
             </div>
           ) : (
             conversations.map((conv) => (
               <div 
                 key={conv.id} 
                 onClick={() => setSelectedConv(conv)}
                 className={`flex items-center gap-4 p-4 rounded-3xl cursor-pointer transition-all ${selectedConv?.id === conv.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'hover:bg-slate-50'}`}
               >
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                     <AvatarFallback className={selectedConv?.id === conv.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}>
                        T
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                     <div className="flex justify-between items-baseline">
                        <span className="font-bold text-sm truncate">Class Teacher</span>
                        <span className={`text-[10px] ${selectedConv?.id === conv.id ? 'text-white/60' : 'text-slate-400'}`}>10:45 AM</span>
                     </div>
                     <p className={`text-xs truncate ${selectedConv?.id === conv.id ? 'text-white/80' : 'text-slate-500'}`}>{conv.lastMessage || 'Start a conversation...'}</p>
                  </div>
               </div>
             ))
           )}
        </div>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 border-none shadow-2xl rounded-[3rem] bg-white flex flex-col overflow-hidden">
        {selectedConv ? (
          <>
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-slate-50 shadow-sm">
                     <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold">CT</AvatarFallback>
                  </Avatar>
                  <div>
                     <h4 className="font-display font-bold text-slate-900">Class Teacher</h4>
                     <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Now</span>
                     </div>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50"><Phone className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-primary hover:bg-slate-50"><Video className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl text-slate-400"><MoreVertical className="w-5 h-5" /></Button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
               <div className="flex flex-col items-center mb-8">
                  <div className="px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today</div>
               </div>
               
               {/* Messages */}
               <div className="flex justify-end">
                  <div className="max-w-[70%] bg-primary text-white p-4 rounded-[2rem] rounded-tr-none shadow-xl shadow-primary/10">
                     <p className="text-sm font-medium leading-relaxed">Hello Teacher, I wanted to ask about the science project deadline.</p>
                     <div className="flex items-center justify-end gap-1 mt-2">
                        <span className="text-[10px] text-white/60">10:45 AM</span>
                        <CheckCheck className="w-3 h-3 text-white/60" />
                     </div>
                  </div>
               </div>

               <div className="flex justify-start">
                  <div className="max-w-[70%] bg-white text-slate-700 p-4 rounded-[2rem] rounded-tl-none shadow-lg border border-slate-100">
                     <p className="text-sm font-medium leading-relaxed">Hi! The deadline has been extended to next Monday. Please check the homework portal for details.</p>
                     <div className="flex items-center gap-1 mt-2">
                        <span className="text-[10px] text-slate-400">10:48 AM</span>
                     </div>
                  </div>
               </div>
               
               {messages.map(m => (
                 <div key={m.id} className={`flex ${m.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-[2rem] shadow-lg ${m.senderId === user.id ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                       <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                       <div className="flex items-center justify-end gap-1 mt-2">
                          <span className={`text-[10px] ${m.senderId === user.id ? 'text-white/60' : 'text-slate-400'}`}>Just now</span>
                          {m.senderId === user.id && <Check className="w-3 h-3 text-white/60" />}
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="p-6 border-t border-slate-50 bg-white">
               <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 focus-within:border-primary transition-colors">
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary"><Paperclip className="w-5 h-5" /></Button>
                  <input 
                    type="text" 
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium px-2"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 flex items-center justify-center p-0 transition-transform active:scale-95">
                     <Send className="w-5 h-5" />
                  </Button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
             <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-8">
                <MessageSquare className="w-12 h-12" />
             </div>
             <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Your Conversations</h3>
             <p className="text-slate-400 font-medium max-w-sm">Select a teacher or administrative staff member to start a secure communication thread.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentMessaging;
