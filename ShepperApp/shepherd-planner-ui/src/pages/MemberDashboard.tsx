import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MiniCalendar } from "@/components/MiniCalendar";
import {
  Church,
  Calendar,
  Megaphone,
  CalendarDays,
  MessageSquare,
  Bell,
  ArrowRight,
  LogOut,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Pin,
  Clock,
  Loader2,
  X,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MemberSidebar } from "@/components/MemberSidebar";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const categoryColors: Record<string, string> = {
  service: "bg-primary/10 text-primary",
  small_group: "bg-secondary/30 text-secondary-foreground",
  pastoral_meeting: "bg-amber-500/10 text-amber-500",
  rehearsal: "bg-purple-500/10 text-purple-500",
};

const categoryLabel: Record<string, string> = {
  SERVICE: "Service",
  SMALL_GROUP: "Small Group",
  PASTORAL_MEETING: "Pastoral Meeting",
  REHEARSAL: "Rehearsal",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const statusColors: Record<string, string> = {
  PENDING: "text-amber-500 bg-amber-500/10",
  APPROVED: "text-green-500 bg-green-500/10",
  DECLINED: "text-red-500 bg-red-500/10",
};

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

/** ── Announcements Modal ── */
function AnnouncementsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await api.get("/announcements");
      return res.data.data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> Church Announcements
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && announcements.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No announcements yet.</p>
          )}
          {announcements.map((a: any) => (
            <div
              key={a._id}
              className="rounded-xl border border-border p-4 bg-card hover:bg-muted/30 transition-colors relative"
            >
              {a.pinned && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-amber-500">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
              <h3 className="font-semibold text-foreground text-sm mb-1 pr-12">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{a.content}</p>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {formatDate(a.createdAt)}
                {a.author?.name && <span className="ml-2">· by {a.author.name}</span>}
              </p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** ── Events Browser Modal ── */
function EventsBrowserModal({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: string }) {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data.data;
    },
    enabled: open,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ id, joined }: { id: string; joined: boolean }) => {
      if (joined) return api.delete(`/events/${id}/rsvp`);
      return api.post(`/events/${id}/rsvp`);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(vars.joined ? "You have left the event." : "You have joined the event!");
      // refresh selected event attendees
      setSelectedEvent((prev: any) => {
        if (!prev || prev._id !== vars.id) return prev;
        return null;
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Action failed");
    },
  });

  const isJoined = (event: any) =>
    event.attendees?.some((a: any) => (typeof a === "string" ? a : a._id) === userId);

  const upcoming = events.filter((e: any) => new Date(e.date) >= new Date());
  const past = events.filter((e: any) => new Date(e.date) < new Date());

  const EventCard = ({ event }: { event: any }) => {
    const joined = isJoined(event);
    const isPast = new Date(event.date) < new Date();
    const catKey = event.category?.toLowerCase() ?? "service";
    return (
      <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${categoryColors[catKey] ?? "bg-primary/10 text-primary"}`}>
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{event.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(event.date)} · {formatTime(event.date)}
              </p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[catKey] ?? "bg-primary/10 text-primary"}`}>
            {categoryLabel[event.category] ?? event.category}
          </span>
        </div>
        {event.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3" /> {event.location}
          </p>
        )}
        {event.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" /> {event.attendees?.length ?? 0} attending
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs rounded-lg"
              onClick={() => setSelectedEvent(event)}
            >
              Details
            </Button>
            {!isPast && (
              <Button
                size="sm"
                className={`h-7 text-xs rounded-lg ${joined ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive" : ""}`}
                variant={joined ? "outline" : "default"}
                onClick={() => rsvpMutation.mutate({ id: event._id, joined })}
                disabled={rsvpMutation.isPending}
              >
                {rsvpMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : joined ? "Leave" : "Join"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" /> Browse Events
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-6">
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            {!isLoading && upcoming.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {upcoming.map((e: any) => <EventCard key={e._id} event={e} />)}
                </div>
              </div>
            )}
            {!isLoading && past.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Events</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
                  {past.map((e: any) => <EventCard key={e._id} event={e} />)}
                </div>
              </div>
            )}
            {!isLoading && events.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No events have been added yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          userId={userId}
          onClose={() => setSelectedEvent(null)}
          onRsvp={(joined) => rsvpMutation.mutate({ id: selectedEvent._id, joined })}
          rsvpPending={rsvpMutation.isPending}
        />
      )}
    </>
  );
}

/** ── Event Detail Modal ── */
function EventDetailModal({
  event, userId, onClose, onRsvp, rsvpPending,
}: {
  event: any; userId: string; onClose: () => void; onRsvp: (joined: boolean) => void; rsvpPending: boolean;
}) {
  const joined = event.attendees?.some((a: any) => (typeof a === "string" ? a : a._id) === userId);
  const isPast = new Date(event.date) < new Date();
  const catKey = event.category?.toLowerCase() ?? "service";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColors[catKey] ?? "bg-primary/10 text-primary"}`}>
              {categoryLabel[event.category] ?? event.category}
            </span>
            {joined && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-500/10 text-green-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> You're attending
              </span>
            )}
          </div>

          <div className="rounded-xl bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{formatDate(event.date)} at {formatTime(event.date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{event.attendees?.length ?? 0} people attending</span>
            </div>
          </div>

          {event.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</p>
              <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
            </div>
          )}

          {event.attendees?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Attendees</p>
              <div className="flex flex-wrap gap-2">
                {event.attendees.map((a: any) => (
                  <span key={typeof a === "string" ? a : a._id} className="text-xs bg-muted px-2.5 py-1 rounded-full text-foreground">
                    {a.name ?? "Member"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isPast && (
            <Button
              className={`w-full rounded-xl ${joined ? "bg-muted text-foreground hover:bg-destructive/10 hover:text-destructive" : ""}`}
              variant={joined ? "outline" : "default"}
              onClick={() => onRsvp(joined)}
              disabled={rsvpPending}
            >
              {rsvpPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : joined ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {joined ? "Cancel Attendance" : "Join This Event"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** ── Meeting Request Modal ── */
function MeetingRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [topic, setTopic] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-meeting-requests"],
    queryFn: async () => {
      const res = await api.get("/meeting-requests");
      return res.data.data;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => api.post("/meeting-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-meeting-requests"] });
      toast.success("Meeting request sent to the pastor!");
      setTopic(""); setPreferredDate(""); setNotes("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to send request");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/meeting-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-meeting-requests"] });
      toast.success("Meeting request cancelled.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to cancel request");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !preferredDate) {
      toast.error("Please fill in the required fields");
      return;
    }
    mutation.mutate({ topic, preferredDate, notes });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Request Meeting with Pastor
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic <span className="text-destructive">*</span></Label>
            <Input
              id="topic"
              placeholder="e.g. Spiritual guidance, Family counselling…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferred-date">Preferred Date <span className="text-destructive">*</span></Label>
            <Input
              id="preferred-date"
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any specific concerns or context you'd like to share…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {mutation.isPending ? "Sending…" : "Send Request"}
          </Button>
        </form>

        {/* Past requests */}
        {myRequests.length > 0 && (
          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Previous Requests</p>
            <div className="space-y-3">
              {myRequests.map((r: any) => (
                <div key={r._id} className="rounded-xl bg-muted/30 p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{r.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Preferred: {r.preferredDate}</p>
                    {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{r.notes}"</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                    {r.status === "PENDING" && (
                      <button
                        onClick={() => cancelMutation.mutate(r._id)}
                        disabled={cancelMutation.isPending}
                        className="text-[10px] text-red-400 hover:text-red-600 underline transition-colors"
                      >
                        {cancelMutation.isPending ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Main Dashboard
// ──────────────────────────────────────────────
const MemberDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: eventsList = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data.data;
    },
  });

  const { data: directMeetingsList = [] } = useQuery({
    queryKey: ["dashboard-direct-meetings"],
    queryFn: async () => {
      const res = await api.get("/meetings");
      return res.data.data;
    },
  });

  const { data: messagesList = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const res = await api.get("/messages");
      return res.data.data;
    },
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await api.get("/announcements");
      return res.data.data;
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ id, joined }: { id: string; joined: boolean }) => {
      if (joined) return api.delete(`/events/${id}/rsvp`);
      return api.post(`/events/${id}/rsvp`);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(vars.joined ? "You have left the event." : "You have joined the event!");
      setSelectedEvent(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Action failed"),
  });

  const allUpcoming = [
    ...(eventsList as any[]).map(e => ({ ...e, isDirectMeeting: false })),
    ...(directMeetingsList as any[]).map(m => ({ ...m, category: 'PASTORAL_MEETING', isDirectMeeting: true }))
  ];

  const upcomingEvents = allUpcoming
    .filter((e: any) => new Date(e.date) >= new Date())
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const recentMessages = messagesList.slice(0, 3).map((m: any) => ({
    from: m.sender?.name || "Unknown",
    msg: m.content,
    time: new Date(m.createdAt).toLocaleDateString(),
    unread: !m.read && m.receiver?._id === user?._id,
  }));

  const actionCards = [
    {
      icon: Calendar,
      title: "Request Meeting with Pastor",
      description: "Schedule a one-on-one pastoral meeting",
      color: "bg-accent/10 text-accent",
      onClick: () => navigate("/member/meeting-requests"),
    },
    {
      icon: Megaphone,
      title: "View Announcements",
      description: `${announcements.length} announcement${announcements.length !== 1 ? "s" : ""}`,
      color: "bg-primary/10 text-primary",
      onClick: () => navigate("/member/announcements"),
    },
    {
      icon: CalendarDays,
      title: "Browse & Join Events",
      description: `${upcomingEvents.length} upcoming event${upcomingEvents.length !== 1 ? "s" : ""}`,
      color: "bg-secondary/30 text-secondary-foreground",
      onClick: () => navigate("/member/events"),
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MemberSidebar />
        <div className="flex-1 flex flex-col">

          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Welcome */}
              <div className="animate-fade-in-up">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  Welcome, {user?.name?.split(" ")[0]} 👋
                </h1>
                <p className="text-muted-foreground mt-1">Here's what's happening in your community</p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
                {actionCards.map((card) => (
                  <button
                    key={card.title}
                    onClick={card.onClick}
                    className="flex flex-col items-start p-6 rounded-2xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group"
                  >
                    <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <card.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground text-sm">{card.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  <MiniCalendar />
                </div>

                {/* Upcoming Events */}
                <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                  <div className="bg-card border border-border rounded-2xl p-6 h-full">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display font-semibold text-foreground">Upcoming Events</h3>
                      <Button variant="ghost" size="sm" className="text-xs h-7 rounded-lg text-primary" onClick={() => navigate("/member/events")}>
                        View all
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {upcomingEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground">No upcoming events</p>
                      )}
                      {upcomingEvents.map((event: any) => {
                        const catKey = event.category?.toLowerCase() ?? "service";
                        const joined = event.attendees?.some((a: any) => (typeof a === "string" ? a : a._id) === user?._id);
                        return (
                          <button
                            key={event._id}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer text-left"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[catKey] ?? "bg-primary/10 text-primary"}`}>
                              <CalendarDays className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(event.date)} · {formatTime(event.date)}</p>
                            </div>
                            {joined ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Messages */}
              <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-display font-semibold text-foreground">Recent Messages</h3>
                  <Button variant="ghost" size="sm" className="text-xs h-7 rounded-lg text-primary" onClick={() => navigate("/member/messages")}>
                    View all
                  </Button>
                </div>
                <div className="space-y-3">
                  {recentMessages.length === 0 && <p className="text-sm text-muted-foreground">No recent messages</p>}
                  {recentMessages.map((m: any, i: number) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer relative group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.unread ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${m.unread ? "text-foreground" : "text-foreground"}`}>{m.from}</p>
                          {m.unread && (
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <p className={`text-xs truncate ${m.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{m.msg}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{m.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MemberDashboard;
