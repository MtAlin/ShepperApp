import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

// Removed static conversations in favor of dynamic messages API
const MessagesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeUser, setActiveUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      // filter out self
      return res.data.data.filter((u: any) => u._id !== user?._id);
    }
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const res = await api.get("/messages");
      return res.data.data;
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when selecting a user
  useEffect(() => {
    if (activeUser) {
       api.put(`/messages/read/${activeUser._id}`).then(() => {
          queryClient.invalidateQueries({ queryKey: ["messages-badge"] });
       }).catch(err => console.error("Failed to mark as read", err));
    }
  }, [activeUser, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!activeUser || !newMessage.trim()) return;
      return await api.post("/messages", { receiver: activeUser._id, content: newMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setNewMessage("");
    }
  });

  const handleSend = () => {
    sendMutation.mutate();
  };

  const getChatMessages = () => {
    if (!activeUser) return [];
    return messages.filter(
      (m: any) =>
        (m.sender._id === user?._id && m.receiver._id === activeUser._id) ||
        (m.sender._id === activeUser._id && m.receiver._id === user?._id)
    ).reverse(); // Assuming API sorts by newest first, we reverse for UI
  };

  const activeMessages = getChatMessages();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Messages" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">Messages</h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Conversation List */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <Input placeholder="Search conversations..." className="rounded-xl h-10 bg-muted/50 border-0" />
                  </div>
                  <div className="divide-y divide-border">
                    {users.map((u: any) => {
                      const unreadFromUser = messages.filter(
                        (m: any) => m.sender._id === u._id && m.receiver._id === user?._id && !m.read
                      ).length;
                      
                      return (
                      <button
                        key={u._id}
                        onClick={() => setActiveUser(u)}
                        className={`w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left ${activeUser?._id === u._id ? 'bg-muted/30' : ''}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">{u.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                            {unreadFromUser > 0 && (
                                <span className="w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                                  {unreadFromUser > 9 ? "9+" : unreadFromUser}
                                </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )})}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl flex flex-col">
                  {activeUser ? (
                    <>
                      <div className="p-4 border-b border-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">{activeUser.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{activeUser.name}</p>
                          <p className="text-xs text-muted-foreground">Community Member</p>
                        </div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col gap-4 overflow-auto">
                        {activeMessages.map((m: any) => (
                          <div key={m._id} className={`flex ${m.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}>
                             <div className={`p-3 rounded-2xl max-w-[70%] ${m.sender._id === user?._id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                                {m.content}
                             </div>
                          </div>
                        ))}
                        <div ref={bottomRef} />
                      </div>
                      <div className="p-4 border-t border-border flex gap-3">
                        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="rounded-xl h-11 bg-muted/50 border-0 flex-1" />
                        <Button onClick={handleSend} size="icon" className="rounded-xl h-11 w-11">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 p-6 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Select a conversation to start messaging</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MessagesPage;
