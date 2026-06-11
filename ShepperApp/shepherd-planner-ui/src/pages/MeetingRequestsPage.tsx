import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  User,
  FileText,
  Filter,
  Loader2,
  CalendarCheck,
  CalendarX,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

type Status = "ALL" | "PENDING" | "APPROVED" | "DECLINED";

const statusConfig = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    badgeClass: "bg-green-500/10 text-green-500 border-green-500/20",
    dotClass: "bg-green-500",
  },
  DECLINED: {
    label: "Declined",
    icon: XCircle,
    badgeClass: "bg-red-500/10 text-red-500 border-red-500/20",
    dotClass: "bg-red-500",
  },
};

function formatDate(isoStr: string) {
  try {
    if (!isoStr) return "TBD";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return isoStr;
  }
}

function formatTimeAgo(isoStr: string) {
  try {
    const ms = Date.now() - new Date(isoStr).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return "";
  }
}

const MeetingRequestsPage = () => {
  const [filter, setFilter] = useState<Status>("ALL");
  const queryClient = useQueryClient();

  const { data: meetingRequests = [], isLoading, refetch } = useQuery({
    queryKey: ["meeting-requests-all"],
    queryFn: async () => (await api.get("/meeting-requests")).data.data,
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.put(`/meeting-requests/${id}`, { status }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["meeting-requests-all"] });
      queryClient.invalidateQueries({ queryKey: ["meeting-requests"] });
      toast.success(
        vars.status === "APPROVED"
          ? "Meeting request approved ✓"
          : "Meeting request declined"
      );
    },
    onError: () => toast.error("Failed to update meeting request"),
  });

  const allRequests: any[] = meetingRequests;
  const filtered =
    filter === "ALL" ? allRequests : allRequests.filter((r) => r.status === filter);

  const counts = {
    ALL: allRequests.length,
    PENDING: allRequests.filter((r) => r.status === "PENDING").length,
    APPROVED: allRequests.filter((r) => r.status === "APPROVED").length,
    DECLINED: allRequests.filter((r) => r.status === "DECLINED").length,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Meeting Requests" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">

              {/* Page Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    Meeting Requests
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Review, approve or decline member meeting requests
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl w-fit"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["ALL", "PENDING", "APPROVED", "DECLINED"] as Status[]).map((s) => {
                  const cfg = s !== "ALL" ? statusConfig[s] : null;
                  const Icon = cfg?.icon ?? FileText;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left hover:shadow-md ${
                        filter === s
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          s === "PENDING"
                            ? "bg-amber-500/10 text-amber-500"
                            : s === "APPROVED"
                            ? "bg-green-500/10 text-green-500"
                            : s === "DECLINED"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {s === "ALL" ? "All Requests" : s.toLowerCase()}
                        </p>
                        <p className="font-display text-xl font-bold text-foreground">
                          {counts[s]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {(["ALL", "PENDING", "APPROVED", "DECLINED"] as Status[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
                      filter === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                    {s !== "ALL" && counts[s] > 0 && (
                      <span className="ml-1.5 bg-background/30 px-1 rounded-sm">
                        {counts[s]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Request List */}
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-display font-semibold text-foreground">
                    No{filter !== "ALL" ? ` ${filter.toLowerCase()}` : ""} requests
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filter === "PENDING"
                      ? "All meeting requests have been reviewed."
                      : "No requests match this filter yet."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filtered.map((req: any) => {
                    const cfg = statusConfig[req.status as keyof typeof statusConfig];
                    const StatusIcon = cfg.icon;
                    const isPending = req.status === "PENDING";
                    const isApproved = req.status === "APPROVED";
                    const isDeclined = req.status === "DECLINED";

                    return (
                      <div
                        key={req._id}
                        className={`bg-card border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-md ${
                          isPending
                            ? "border-amber-500/20"
                            : isApproved
                            ? "border-green-500/20"
                            : "border-red-500/20 opacity-80"
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-semibold text-foreground text-base leading-tight truncate">
                              {req.topic}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Submitted {formatTimeAgo(req.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider shrink-0 ${cfg.badgeClass}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Member info */}
                        <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border/50">
                          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/10">
                            <span className="text-sm font-bold text-primary">
                              {(req.requester?.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              {req.requester?.name || "Unknown Member"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {req.requester?.email}
                            </p>
                          </div>
                          <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>

                        {/* Date + notes */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5" />
                              Preferred Date
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatDate(req.preferredDate)}
                            </span>
                          </div>
                          {req.notes && (
                            <div className="text-sm text-foreground bg-accent/5 px-3 py-2 rounded-lg border border-accent/10 italic text-muted-foreground">
                              "{req.notes}"
                            </div>
                          )}
                        </div>

                        {/* Approved info banner */}
                        {isApproved && (
                          <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-2">
                            <CalendarCheck className="w-4 h-4 text-green-500 shrink-0" />
                            <p className="text-xs text-green-600 font-medium">
                              This meeting has been approved and is visible on the calendar
                            </p>
                          </div>
                        )}

                        {isDeclined && (
                          <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2">
                            <CalendarX className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-xs text-red-500 font-medium">
                              This request was declined
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        {isPending && (
                          <div className="flex gap-2 pt-2 border-t border-border">
                            <Button
                              className="flex-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none rounded-xl"
                              onClick={() =>
                                updateMutation.mutate({ id: req._id, status: "APPROVED" })
                              }
                              disabled={updateMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl"
                              onClick={() =>
                                updateMutation.mutate({ id: req._id, status: "DECLINED" })
                              }
                              disabled={updateMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        )}

                        {/* Re-open actions for approved/declined */}
                        {!isPending && (
                          <div className="flex gap-2 pt-2 border-t border-border">
                            {isDeclined && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl text-green-600 border-green-500/20 hover:bg-green-500/10"
                                onClick={() =>
                                  updateMutation.mutate({ id: req._id, status: "APPROVED" })
                                }
                                disabled={updateMutation.isPending}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                Approve instead
                              </Button>
                            )}
                            {isApproved && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-xl text-amber-600 border-amber-500/20 hover:bg-amber-500/10"
                                onClick={() =>
                                  updateMutation.mutate({ id: req._id, status: "PENDING" })
                                }
                                disabled={updateMutation.isPending}
                              >
                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                Move back to Pending
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MeetingRequestsPage;
