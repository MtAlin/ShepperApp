import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MemberSidebar } from "@/components/MemberSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays, MapPin, Users, Search, Loader2,
  CheckCircle2, XCircle, ArrowRight, Clock,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Tab = "upcoming" | "past" | "joined";

const categoryColors: Record<string, string> = {
  SERVICE: "bg-primary/10 text-primary",
  SMALL_GROUP: "bg-secondary/30 text-secondary-foreground",
  PASTORAL_MEETING: "bg-amber-500/10 text-amber-500",
  REHEARSAL: "bg-purple-500/10 text-purple-500",
};
const categoryLabels: Record<string, string> = {
  SERVICE: "Service", SMALL_GROUP: "Small Group",
  PASTORAL_MEETING: "Pastoral Meeting", REHEARSAL: "Rehearsal",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function EventDetailModal({ event, userId, onClose, onRsvp, rsvpPending }: any) {
  const joined = event.attendees?.some((a: any) => (typeof a === "string" ? a : a._id) === userId);
  const isPast = new Date(event.date) < new Date();
  const catKey = event.category ?? "SERVICE";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryColors[catKey] ?? "bg-primary/10 text-primary"}`}>
              {categoryLabels[catKey] ?? catKey}
            </span>
            {joined && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-500/10 text-green-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> You're attending
              </span>
            )}
          </div>
          <div className="rounded-xl bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{formatDate(event.date)} at {formatTime(event.date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{event.attendees?.length ?? 0} attending</span>
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
                  <span key={typeof a === "string" ? a : a._id} className="text-xs bg-muted px-2.5 py-1 rounded-full">
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

function EventCard({ event, userId, onSelect, onRsvp, rsvpPending }: any) {
  const joined = event.attendees?.some((a: any) => (typeof a === "string" ? a : a._id) === userId);
  const isPast = new Date(event.date) < new Date();
  const catKey = event.category ?? "SERVICE";

  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${categoryColors[catKey] ?? "bg-primary/10 text-primary"}`}>
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display font-semibold text-foreground">{event.title}</p>
            <p className="text-xs text-muted-foreground">{formatDate(event.date)} · {formatTime(event.date)}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${categoryColors[catKey] ?? "bg-primary/10 text-primary"}`}>
          {categoryLabels[catKey] ?? catKey}
        </span>
      </div>

      {event.location && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {event.location}
        </p>
      )}
      {event.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" /> {event.attendees?.length ?? 0} attending
          {joined && <span className="ml-2 text-green-500 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" />You</span>}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-lg" onClick={() => onSelect(event)}>
            <ArrowRight className="w-3.5 h-3.5 mr-1" /> Details
          </Button>
          {!isPast && (
            <Button
              size="sm"
              className={`h-7 text-xs rounded-lg ${joined ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive" : ""}`}
              variant={joined ? "outline" : "default"}
              onClick={() => onRsvp(event._id, joined)}
              disabled={rsvpPending}
            >
              {rsvpPending ? <Loader2 className="w-3 h-3 animate-spin" /> : joined ? "Leave" : "Join"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const MemberEventsPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events-member"],
    queryFn: async () => (await api.get("/events")).data.data,
    refetchInterval: 30000,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ id, joined }: { id: string; joined: boolean }) =>
      joined ? api.delete(`/events/${id}/rsvp`) : api.post(`/events/${id}/rsvp`),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["events-member"] });
      toast.success(vars.joined ? "You have left the event." : "You joined the event!");
      setSelectedEvent(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Action failed"),
  });

  const userId = user?._id ?? "";
  const now = new Date();

  const allEvents = events as any[];
  const upcoming = allEvents.filter((e: any) => new Date(e.date) >= now);
  const past = allEvents.filter((e: any) => new Date(e.date) < now);
  const joined = allEvents.filter((e: any) =>
    e.attendees?.some((a: any) => (typeof a === "string" ? a : a._id) === userId)
  );

  const tabData: Record<Tab, any[]> = { upcoming, past, joined };
  const filtered = tabData[tab].filter((e: any) =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: upcoming.length },
    { key: "joined", label: "My Events", count: joined.length },
    { key: "past", label: "Past", count: past.length },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <MemberSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Events" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Browse Events</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {upcoming.length} upcoming · {joined.length} events you're attending
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-xl h-10"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-medium transition-all duration-150 ${
                      tab === t.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-md ${tab === t.key ? "bg-white/20" : "bg-background"}`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Events grid */}
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-16 text-center">
                  <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-display font-semibold text-foreground">
                    {search ? "No events match your search" : tab === "joined" ? "You haven't joined any events yet" : "No events in this category"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tab === "upcoming" ? "Check back soon for new events." : "Browse upcoming events to join one."}
                  </p>
                  {search && (
                    <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${tab === "past" ? "opacity-75" : ""}`}>
                  {filtered.map((event: any) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      userId={userId}
                      onSelect={setSelectedEvent}
                      onRsvp={(id: string, joined: boolean) => rsvpMutation.mutate({ id, joined })}
                      rsvpPending={rsvpMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          userId={userId}
          onClose={() => setSelectedEvent(null)}
          onRsvp={(joined: boolean) => rsvpMutation.mutate({ id: selectedEvent._id, joined })}
          rsvpPending={rsvpMutation.isPending}
        />
      )}
    </SidebarProvider>
  );
};

export default MemberEventsPage;
