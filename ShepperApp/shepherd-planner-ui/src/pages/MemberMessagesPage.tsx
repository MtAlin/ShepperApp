import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Church, MessageSquare, Send, ArrowLeft, LogOut } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MemberMessagesPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeContact, setActiveContact] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // All users (directory - available to all members)
  const { data: directory = [] } = useQuery({
    queryKey: ["user-directory"],
    queryFn: async () => {
      const res = await api.get("/users/directory");
      return res.data.data;
    },
  });

  // My messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const res = await api.get("/messages");
      return res.data.data;
    },
    refetchInterval: 10000, // Poll every 10s for new messages
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when selecting a contact
  useEffect(() => {
    if (activeContact) {
       api.put(`/messages/read/${activeContact._id}`).then(() => {
          queryClient.invalidateQueries({ queryKey: ["messages-badge"] });
       }).catch(err => console.error("Failed to mark as read", err));
    }
  }, [activeContact, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!activeContact || !newMessage.trim()) return;
      return api.post("/messages", { receiver: activeContact._id, content: newMessage.trim() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setNewMessage("");
    },
    onError: () => toast.error("Failed to send message"),
  });

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMutation.mutate();
  };

  // Build a list of contacts who have conversation history, plus full directory
  const getConversationMessages = () => {
    if (!activeContact) return [];
    return messages
      .filter(
        (m: any) =>
          (m.sender?._id === user?._id && m.receiver?._id === activeContact._id) ||
          (m.sender?._id === activeContact._id && m.receiver?._id === user?._id)
      )
      .reverse();
  };

  const getLastMessage = (contactId: string) => {
    const conv = messages.filter(
      (m: any) =>
        (m.sender?._id === user?._id && m.receiver?._id === contactId) ||
        (m.sender?._id === contactId && m.receiver?._id === user?._id)
    );
    return conv[0] ?? null;
  };

  const filteredDirectory = directory.filter((u: any) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const chatMessages = getConversationMessages();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/member")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Church className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">Messages</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-120px)]">

          {/* Contact List */}
          <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border shrink-0">
              <h2 className="font-display font-semibold text-foreground mb-3">Contacts</h2>
              <Input
                placeholder="Search people..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl h-10 bg-muted/50 border-0"
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {filteredDirectory.length === 0 && (
                <p className="text-sm text-muted-foreground text-center p-6">No contacts found</p>
              )}
              {filteredDirectory.map((contact: any) => {
                const lastMsg = getLastMessage(contact._id);
                const isActive = activeContact?._id === contact._id;
                const unreadForContact = messages.filter(
                  (m: any) => m.sender?._id === contact._id && m.receiver?._id === user?._id && !m.read
                ).length;

                return (
                  <button
                    key={contact._id}
                    onClick={() => setActiveContact(contact)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left ${isActive ? "bg-muted/40 border-l-2 border-primary" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {contact.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{contact.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {contact.role === "ADMIN" ? "Admin" : "Member"}
                          </span>
                          {unreadForContact > 0 && (
                            <span className="w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in shrink-0">
                              {unreadForContact > 9 ? "9+" : unreadForContact}
                            </span>
                          )}
                        </div>
                      </div>
                      {lastMsg && (
                        <p className={`text-xs truncate mt-0.5 ${unreadForContact > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                          {lastMsg.sender?._id === user?._id ? "You: " : ""}{lastMsg.content}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
            {activeContact ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {activeContact.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activeContact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeContact.role === "ADMIN" ? "Church Admin" : "Community Member"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Send a message to start the conversation
                        </p>
                      </div>
                    </div>
                  )}
                  {chatMessages.map((m: any) => {
                    const isMine = m.sender?._id === user?._id;
                    return (
                      <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                        >
                          {m.content}
                          <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border flex gap-3 shrink-0">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={`Message ${activeContact.name}…`}
                    className="rounded-xl h-11 bg-muted/50 border-0 flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    size="icon"
                    className="rounded-xl h-11 w-11 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5">
                    <MessageSquare className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">Your Messages</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Select a contact from the left to start or continue a conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberMessagesPage;
