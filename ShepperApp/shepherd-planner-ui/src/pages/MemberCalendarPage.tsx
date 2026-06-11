import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MemberSidebar } from "@/components/MemberSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Loader2,
  Calendar,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const categoryColors: Record<string, string> = {
  service: "bg-primary text-primary-foreground",
  rehearsal: "bg-secondary text-secondary-foreground",
  smallgroup: "bg-secondary text-secondary-foreground",
  pastoralmeeting: "bg-accent text-accent-foreground",
  event: "bg-primary/20 text-primary",
  meeting_request: "bg-teal-500/20 text-teal-600",
};

const categoryDots: Record<string, string> = {
  service: "bg-primary",
  rehearsal: "bg-secondary",
  smallgroup: "bg-secondary",
  pastoralmeeting: "bg-accent",
  event: "bg-primary/60",
  meeting_request: "bg-teal-500",
};

const statusColors: Record<string, string> = {
  PENDING: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  APPROVED: "text-green-500 bg-green-500/10 border-green-500/20",
  DECLINED: "text-red-500 bg-red-500/10 border-red-500/20",
};

const statusIcons: Record<string, typeof Clock> = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  DECLINED: XCircle,
};

function formatDate(isoStr: string) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  } catch { return isoStr; }
}

function formatTimeAgo(isoStr: string) {
  try {
    const ms = Date.now() - new Date(isoStr).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ""; }
}

/** New Meeting Request modal */
function NewRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [topic, setTopic] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => api.post("/meeting-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-requests-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["my-meeting-requests-badge"] });
      toast.success("Meeting request sent!");
      setTopic(""); setPreferredDate(""); setNotes("");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Request Meeting with Pastor
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); if (!topic || !preferredDate) { toast.error("Topic and date are required"); return; } mutation.mutate({ topic, preferredDate, notes }); }}>
          <div className="space-y-2">
            <Label htmlFor="mr-topic">Topic <span className="text-destructive">*</span></Label>
            <Input id="mr-topic" placeholder="e.g. Spiritual guidance…" value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mr-date">Preferred Date <span className="text-destructive">*</span></Label>
            <Input id="mr-date" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="rounded-xl h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mr-notes">Notes (optional)</Label>
            <Textarea id="mr-notes" placeholder="Any context you'd like to share…" value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl resize-none" rows={3} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {mutation.isPending ? "Sending…" : "Send Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const MemberCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: remoteEvents = [] } = useQuery({
    queryKey: ["events-member-cal"],
    queryFn: async () => (await api.get("/events")).data.data,
  });

  const { data: directMeetings = [] } = useQuery({
    queryKey: ["meetings-member-cal"],
    queryFn: async () => (await api.get("/meetings")).data.data,
  });

  const { data: myRequests = [], isLoading: reqLoading } = useQuery({
    queryKey: ["my-requests-calendar"],
    queryFn: async () => (await api.get("/meeting-requests")).data.data,
    refetchInterval: 15000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/meeting-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-requests-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["my-meeting-requests-badge"] });
      toast.success("Request cancelled.");
    },
    onError: () => toast.error("Failed to cancel request"),
  });

  const approvedRequests = (myRequests as any[]).filter((r: any) => r.status === "APPROVED");

  const events = [
    ...(remoteEvents as any[]).map((e: any) => {
      const d = new Date(e.date);
      return {
        day: d.getDate(), month: d.getMonth(), year: d.getFullYear(),
        title: e.title,
        time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        category: e.category.toLowerCase().replace(/_/g, ""),
        isMeetingRequest: false, requester: null,
      };
    }),
    ...approvedRequests.map((r: any) => {
      const d = new Date(r.preferredDate);
      return {
        day: d.getDate(), month: d.getMonth(), year: d.getFullYear(),
        title: `✓ Meeting: ${r.topic}`,
        time: "Approved",
        category: "meeting_request",
        isMeetingRequest: true, requester: null,
      };
    }),
    ...(directMeetings as any[]).map((m: any) => {
      const d = new Date(m.date);
      return {
        day: d.getDate(), month: d.getMonth(), year: d.getFullYear(),
        title: `✓ Meeting: ${m.title}`,
        time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        category: "meeting_request",
        isMeetingRequest: true, requester: null,
      };
    }),
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthEvents = events.filter((e) => e.month === month && e.year === year);
  const selectedEvents = selectedDay ? monthEvents.filter((e) => e.day === selectedDay) : [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <MemberSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="My Calendar" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-8">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {MONTHS[month]} {year}
                  </h2>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl"><ChevronLeft className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl"><ChevronRight className="w-5 h-5" /></Button>
                  </div>
                </div>
                <Button className="rounded-xl" onClick={() => setNewRequestOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Request Meeting
                </Button>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4">
                {Object.entries({ service: "Services", event: "Events", meeting_request: "Approved Meetings" }).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${categoryDots[key]}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid + Side Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
                  <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
                    {DAYS.map((d) => (
                      <div key={d} className="bg-muted/50 p-3 text-xs font-medium text-muted-foreground text-center">{d}</div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`e-${i}`} className="bg-card p-3 min-h-[90px]" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayEvents = monthEvents.filter((e) => e.day === day);
                      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                      const isSelected = selectedDay === day;
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`bg-card p-2 min-h-[90px] text-left hover:bg-muted/30 transition-colors ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
                        >
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-medium ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                            {day}
                          </span>
                          <div className="mt-1 space-y-0.5">
                            {dayEvents.slice(0, 2).map((e, idx) => (
                              <div key={idx} className={`text-[10px] px-1.5 py-0.5 rounded-md truncate ${categoryColors[e.category] || categoryColors.event}`}>
                                {e.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 2} more</div>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Detail */}
                <div className="lg:col-span-1">
                  <div className="bg-card border border-border rounded-2xl p-5 sticky top-24">
                    <h3 className="font-display font-semibold text-foreground mb-4">
                      {selectedDay ? `${MONTHS[month]} ${selectedDay}` : "Select a day"}
                    </h3>
                    {selectedEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedEvents.map((e, idx) => (
                          <div key={idx} className={`p-3 rounded-xl ${e.isMeetingRequest ? "bg-teal-500/8 border border-teal-500/20" : "bg-muted/50"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${categoryDots[e.category] || categoryDots.event}`} />
                              <span className="text-sm font-medium text-foreground">{e.title}</span>
                            </div>
                            {e.isMeetingRequest && (
                              <p className="text-xs text-teal-600 ml-4 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Approved by pastor
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground ml-4">{e.time}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {selectedDay ? "No events on this day" : "Click a day to see details"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Meeting Requests section below calendar */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold text-foreground">My Meeting Requests</h2>
                  <Button size="sm" className="rounded-xl" onClick={() => setNewRequestOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> New Request
                  </Button>
                </div>

                {reqLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (myRequests as any[]).length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-10 text-center">
                    <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-display font-semibold text-foreground">No meeting requests yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Request a meeting with the pastor to get started.</p>
                    <Button className="mt-4 rounded-xl" onClick={() => setNewRequestOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Request Meeting
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(myRequests as any[]).map((r: any) => {
                      const StatusIcon = statusIcons[r.status] || Clock;
                      return (
                        <div
                          key={r._id}
                          className={`bg-card border rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-md ${
                            r.status === "PENDING" ? "border-amber-500/20" :
                            r.status === "APPROVED" ? "border-green-500/20" : "border-red-500/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-semibold text-foreground text-sm leading-tight flex-1">{r.topic}</h3>
                            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${statusColors[r.status]}`}>
                              <StatusIcon className="w-2.5 h-2.5" />
                              {r.status}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Preferred</span>
                              <span className="font-medium text-foreground">{formatDate(r.preferredDate)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Submitted</span>
                              <span className="text-muted-foreground">{formatTimeAgo(r.createdAt)}</span>
                            </div>
                          </div>

                          {r.notes && (
                            <p className="text-xs text-muted-foreground italic bg-muted/30 px-3 py-2 rounded-lg">"{r.notes}"</p>
                          )}

                          {r.status === "APPROVED" && (
                            <div className="bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-2 text-xs text-green-600 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Visible on your calendar
                            </div>
                          )}

                          {r.status === "PENDING" && (
                            <button
                              onClick={() => cancelMutation.mutate(r._id)}
                              disabled={cancelMutation.isPending}
                              className="text-xs text-red-400 hover:text-red-600 underline text-left transition-colors mt-auto"
                            >
                              {cancelMutation.isPending ? "Cancelling…" : "Cancel request"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
      <NewRequestModal open={newRequestOpen} onClose={() => setNewRequestOpen(false)} />
    </SidebarProvider>
  );
};

export default MemberCalendarPage;
