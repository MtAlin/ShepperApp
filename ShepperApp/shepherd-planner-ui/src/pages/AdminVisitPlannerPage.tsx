import { useState, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Plus,
  CalendarDays,
  CheckCircle2,
  Clock,
  RotateCcw,
  Trash2,
  Bell,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PLANNED:              { label: "Planned",             color: "bg-blue-500/10 text-blue-500 border-blue-500/20",     icon: CalendarDays },
  CONFIRMED:            { label: "Confirmed",           color: "bg-green-500/10 text-green-500 border-green-500/20",   icon: CheckCircle2 },
  COMPLETED:            { label: "Completed",           color: "bg-primary/10 text-primary border-primary/20",         icon: CheckCircle2 },
  RESCHEDULE_REQUESTED: { label: "Reschedule Req.",     color: "bg-amber-500/10 text-amber-500 border-amber-500/20",   icon: RotateCcw },
  CANCELLED:            { label: "Cancelled",           color: "bg-red-500/10 text-red-500 border-red-500/20",         icon: X },
};

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const AdminVisitPlannerPage = () => {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [detailVisit, setDetailVisit] = useState<any>(null);

  // Form state
  const [formFamily, setFormFamily] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Detail edit state
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDate, setEditDate] = useState("");

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["pastoral-visits", year],
    queryFn: async () => (await api.get(`/pastoral-visits/year/${year}`)).data.data,
    refetchInterval: 30000,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ["pastoral-reminders"],
    queryFn: async () => (await api.get("/pastoral-visits/reminders")).data.data,
    refetchInterval: 60000,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: async () => (await api.get("/users")).data.data,
  });

  const familyMembers = (members as any[]).filter((m: any) => m.role === "MEMBER");

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/pastoral-visits", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastoral-visits"] });
      queryClient.invalidateQueries({ queryKey: ["pastoral-reminders"] });
      toast.success("Visit scheduled successfully!");
      setScheduleOpen(false);
      setFormFamily(""); setFormDate(""); setFormNotes("");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to schedule visit"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.put(`/pastoral-visits/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastoral-visits"] });
      queryClient.invalidateQueries({ queryKey: ["pastoral-reminders"] });
      toast.success("Visit updated!");
      setDetailVisit(null);
    },
    onError: () => toast.error("Failed to update visit"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pastoral-visits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastoral-visits"] });
      toast.success("Visit removed");
      setDetailVisit(null);
    },
    onError: () => toast.error("Failed to delete visit"),
  });

  const handleSchedule = () => {
    if (!formFamily || !formDate) {
      toast.error("Family and date are required");
      return;
    }
    createMutation.mutate({ family: formFamily, scheduledDate: formDate, notes: formNotes });
  };

  const openDetail = (v: any) => {
    setDetailVisit(v);
    setEditStatus(v.status);
    setEditNotes(v.notes || "");
    setEditDate(v.scheduledDate ? v.scheduledDate.slice(0, 10) : "");
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      id: detailVisit._id,
      payload: { status: editStatus, notes: editNotes, scheduledDate: editDate },
    });
  };

  // Group visits by month
  const visitsByMonth = useMemo(() => {
    const map: Record<number, any[]> = {};
    for (let m = 0; m < 12; m++) map[m] = [];
    (visits as any[]).forEach((v: any) => {
      const m = new Date(v.scheduledDate).getMonth();
      map[m].push(v);
    });
    return map;
  }, [visits]);

  const displayMonths = filterMonth !== null
    ? [filterMonth]
    : Array.from({ length: 12 }, (_, i) => i);

  const totalPlanned   = (visits as any[]).length;
  const totalCompleted = (visits as any[]).filter((v: any) => v.status === "COMPLETED").length;
  const totalPending   = (visits as any[]).filter((v: any) => ["PLANNED", "CONFIRMED"].includes(v.status)).length;
  const totalReschedule= (visits as any[]).filter((v: any) => v.status === "RESCHEDULE_REQUESTED").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Annual Visit Planner" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* ── Header ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                    <Home className="w-6 h-6 text-primary" /> Annual Visit Planner
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Plan and track pastoral home visits across the year
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Year Navigation */}
                  <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setYear(y => y - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-display font-bold text-foreground text-lg w-16 text-center">{year}</span>
                  <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setYear(y => y + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button className="rounded-xl ml-2" onClick={() => setScheduleOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Schedule Visit
                  </Button>
                </div>
              </div>

              {/* ── Stats Row ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Visits", value: totalPlanned,    color: "text-foreground",    icon: CalendarDays },
                  { label: "Completed",    value: totalCompleted,  color: "text-primary",       icon: CheckCircle2 },
                  { label: "Pending",      value: totalPending,    color: "text-blue-500",      icon: Clock },
                  { label: "Reschedule",   value: totalReschedule, color: "text-amber-500",     icon: AlertTriangle },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Reminders Banner ── */}
              {(reminders as any[]).length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-amber-600 text-sm">
                      Upcoming Reminders — {(reminders as any[]).length} visit{(reminders as any[]).length > 1 ? "s" : ""} in the next 7 days
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(reminders as any[]).map((v: any) => {
                      const days = daysUntil(v.scheduledDate);
                      return (
                        <div
                          key={v._id}
                          onClick={() => openDetail(v)}
                          className="cursor-pointer bg-card border border-amber-500/20 rounded-xl px-3 py-2 text-sm flex items-center gap-2 hover:border-amber-500/50 transition-colors"
                        >
                          <span className="font-semibold text-foreground">{v.family?.name}</span>
                          <span className="text-amber-600 font-medium text-xs">
                            {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `in ${days}d`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Month Filter ── */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-muted-foreground font-medium mr-1">Filter:</span>
                <button
                  onClick={() => setFilterMonth(null)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filterMonth === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  All Months
                </button>
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => setFilterMonth(filterMonth === i ? null : i)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${filterMonth === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    {m.slice(0, 3)}
                    {visitsByMonth[i]?.length > 0 && (
                      <span className="ml-1 bg-primary/20 text-primary rounded-full px-1">{visitsByMonth[i].length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* ── Year Grid ── */}
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className={`grid gap-4 ${filterMonth !== null ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                  {displayMonths.map((monthIdx) => {
                    const monthVisits = visitsByMonth[monthIdx] || [];
                    return (
                      <MonthCard
                        key={monthIdx}
                        month={MONTHS[monthIdx]}
                        visits={monthVisits}
                        onVisitClick={openDetail}
                        expanded={filterMonth === monthIdx}
                      />
                    );
                  })}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* ── Schedule Visit Modal ── */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Home className="w-5 h-5 text-primary" /> Schedule Pastoral Visit
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Family / Member</Label>
              <Select value={formFamily} onValueChange={setFormFamily}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select a family..." />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map((m: any) => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visit Date</Label>
              <Input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Any notes about this visit..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setScheduleOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleSchedule}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Scheduling..." : "Schedule Visit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Visit Detail / Edit Modal ── */}
      <Dialog open={!!detailVisit} onOpenChange={open => !open && setDetailVisit(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          {detailVisit && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <Home className="w-5 h-5 text-primary" /> Visit — {detailVisit.family?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">

                {/* Reschedule request notice */}
                {detailVisit.status === "RESCHEDULE_REQUESTED" && detailVisit.rescheduleReason && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-amber-600 mb-1">⚠ Reschedule Requested</p>
                    <p className="text-muted-foreground italic">"{detailVisit.rescheduleReason}"</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Visit Date</Label>
                  <Input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10"
                    onClick={() => deleteMutation.mutate(detailVisit._id)}
                    disabled={deleteMutation.isPending}
                    title="Delete visit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDetailVisit(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 rounded-xl"
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

// ── Month Card Component ────────────────────────────────────────────────────
function MonthCard({ month, visits, onVisitClick, expanded }: {
  month: string;
  visits: any[];
  onVisitClick: (v: any) => void;
  expanded: boolean;
}) {
  const completed = visits.filter(v => v.status === "COMPLETED").length;
  const isEmpty = visits.length === 0;

  return (
    <div className={`bg-card border border-border rounded-2xl p-5 transition-all duration-200 ${isEmpty ? "opacity-60" : ""} ${expanded ? "ring-2 ring-primary/30" : ""}`}>
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">{month}</h3>
        <div className="flex items-center gap-2">
          {visits.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {completed}/{visits.length} done
            </span>
          )}
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <span className={`text-sm font-bold ${isEmpty ? "text-muted-foreground" : "text-foreground"}`}>
              {visits.length}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {visits.length > 0 && (
        <div className="w-full h-1.5 bg-muted rounded-full mb-4">
          <div
            className="h-1.5 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(completed / visits.length) * 100}%` }}
          />
        </div>
      )}

      {/* Visit list */}
      {isEmpty ? (
        <p className="text-xs text-muted-foreground text-center py-4">No visits planned</p>
      ) : (
        <div className="space-y-2">
          {visits.map((v: any) => {
            const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.PLANNED;
            const days = daysUntil(v.scheduledDate);
            const isUpcoming = days >= 0 && days <= 7 && v.status !== "COMPLETED";
            return (
              <button
                key={v._id}
                onClick={() => onVisitClick(v)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 ${cfg.color}`}
              >
                <cfg.icon className="w-4 h-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{v.family?.name}</p>
                  <p className="text-xs opacity-70">{formatDate(v.scheduledDate)}</p>
                </div>
                {isUpcoming && (
                  <span className="shrink-0 text-[9px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5">
                    {days === 0 ? "TODAY" : `${days}d`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminVisitPlannerPage;
