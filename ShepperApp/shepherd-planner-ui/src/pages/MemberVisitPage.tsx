import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MemberSidebar } from "@/components/MemberSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  CheckCircle2,
  Clock,
  RotateCcw,
  CalendarDays,
  Bell,
  X,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; description: string }> = {
  PLANNED: {
    label: "Planned",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: CalendarDays,
    description: "Your pastor has scheduled a visit. Please confirm when you're available.",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20",
    icon: CheckCircle2,
    description: "You've confirmed this visit. See you soon!",
  },
  COMPLETED: {
    label: "Visit Completed",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    icon: CheckCircle2,
    description: "This pastoral visit has been completed. Thank you!",
  },
  RESCHEDULE_REQUESTED: {
    label: "Reschedule Requested",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: RotateCcw,
    description: "Your reschedule request has been submitted and is awaiting pastor review.",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
    icon: X,
    description: "This visit has been cancelled.",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const MemberVisitPage = () => {
  const queryClient = useQueryClient();
  const [rescheduleVisit, setRescheduleVisit] = useState<any>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["my-pastoral-visits"],
    queryFn: async () => (await api.get("/pastoral-visits")).data.data,
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      api.put(`/pastoral-visits/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pastoral-visits"] });
      toast.success("Response submitted!");
      setRescheduleVisit(null);
      setRescheduleReason("");
    },
    onError: () => toast.error("Failed to submit response"),
  });

  const handleConfirm = (id: string) => {
    updateMutation.mutate({ id, payload: { action: "CONFIRM" } });
  };

  const handleReschedule = () => {
    if (!rescheduleReason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }
    updateMutation.mutate({
      id: rescheduleVisit._id,
      payload: { action: "REQUEST_RESCHEDULE", rescheduleReason },
    });
  };

  const upcoming = (visits as any[]).filter((v: any) =>
    ["PLANNED", "CONFIRMED"].includes(v.status)
  );
  const past = (visits as any[]).filter((v: any) =>
    ["COMPLETED", "CANCELLED"].includes(v.status)
  );
  const rescheduled = (visits as any[]).filter((v: any) =>
    v.status === "RESCHEDULE_REQUESTED"
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <MemberSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Pastoral Visits" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-3xl mx-auto space-y-8">

              {/* ── Header ── */}
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                  <Home className="w-6 h-6 text-primary" /> My Pastoral Visits
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track scheduled pastoral home visits and respond to upcoming visits
                </p>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (visits as any[]).length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-16 text-center">
                  <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-display font-semibold text-foreground">No visits scheduled yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your pastor will schedule a home visit soon. Check back later.
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Upcoming / Action Required ── */}
                  {upcoming.length > 0 && (
                    <section>
                      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-primary" /> Upcoming Visits
                      </h2>
                      <div className="space-y-4">
                        {upcoming.map((v: any) => {
                          const cfg = STATUS_CONFIG[v.status];
                          const days = daysUntil(v.scheduledDate);
                          const canAct = v.status === "PLANNED";
                          return (
                            <div key={v._id} className={`border rounded-2xl p-6 ${cfg.bg}`}>
                              <div className="flex items-start justify-between gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                                    <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                                  </div>
                                  <div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                                    <p className="font-display font-semibold text-foreground text-base mt-0.5">
                                      Pastoral Home Visit
                                    </p>
                                  </div>
                                </div>
                                {days >= 0 && days <= 7 && (
                                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${days === 0 ? "bg-red-500 text-white" : "bg-amber-500 text-white"}`}>
                                    {days === 0 ? "TODAY" : days === 1 ? "TOMORROW" : `IN ${days} DAYS`}
                                  </span>
                                )}
                              </div>

                              <div className="bg-background/50 rounded-xl p-4 mb-4 flex items-center gap-3">
                                <CalendarDays className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Scheduled for</p>
                                  <p className="font-semibold text-foreground text-sm">{formatDate(v.scheduledDate)}</p>
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground mb-4">{cfg.description}</p>

                              {v.notes && (
                                <div className="bg-background/50 rounded-xl p-3 mb-4 text-sm text-foreground/80 italic border border-border/50">
                                  📝 {v.notes}
                                </div>
                              )}

                              {canAct && (
                                <div className="flex gap-3">
                                  <Button
                                    className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white shadow-none"
                                    onClick={() => handleConfirm(v._id)}
                                    disabled={updateMutation.isPending}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Visit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                                    onClick={() => { setRescheduleVisit(v); setRescheduleReason(""); }}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" /> Request Reschedule
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* ── Reschedule Requested ── */}
                  {rescheduled.length > 0 && (
                    <section>
                      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reschedule Requested
                      </h2>
                      <div className="space-y-3">
                        {rescheduled.map((v: any) => (
                          <div key={v._id} className="bg-card border border-amber-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                              <RotateCcw className="w-5 h-5 text-amber-500" />
                              <p className="font-semibold text-foreground">Pastoral Home Visit</p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">Originally:</span> {formatDate(v.scheduledDate)}
                            </p>
                            {v.rescheduleReason && (
                              <p className="text-sm text-muted-foreground italic">
                                Reason: "{v.rescheduleReason}"
                              </p>
                            )}
                            <p className="text-xs text-amber-600 mt-2 font-medium">
                              ⏳ Awaiting pastor review
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* ── Past Visits ── */}
                  {past.length > 0 && (
                    <section>
                      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Visit History
                      </h2>
                      <div className="space-y-3">
                        {past.map((v: any) => {
                          const cfg = STATUS_CONFIG[v.status];
                          return (
                            <div key={v._id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 opacity-80">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                                <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm">Pastoral Home Visit</p>
                                <p className="text-xs text-muted-foreground">{formatDate(v.scheduledDate)}</p>
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ── Reschedule Modal ── */}
      <Dialog open={!!rescheduleVisit} onOpenChange={open => !open && setRescheduleVisit(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" /> Request Reschedule
            </DialogTitle>
          </DialogHeader>
          {rescheduleVisit && (
            <div className="space-y-4 mt-2">
              <div className="bg-muted/50 rounded-xl p-3 text-sm">
                <p className="text-muted-foreground">Scheduled for</p>
                <p className="font-semibold text-foreground">{formatDate(rescheduleVisit.scheduledDate)}</p>
              </div>
              <div className="space-y-2">
                <Label>Reason for rescheduling</Label>
                <Textarea
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="Please explain why you need to reschedule..."
                  className="rounded-xl resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setRescheduleVisit(null)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleReschedule}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default MemberVisitPage;
