import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MemberSidebar } from "@/components/MemberSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock, CheckCircle2, XCircle, CalendarDays, Plus, Loader2,
  ClipboardList, RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ReqStatus = "ALL" | "PENDING" | "APPROVED" | "DECLINED";

const statusColors: Record<string, string> = {
  PENDING: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  APPROVED: "text-green-500 bg-green-500/10 border-green-500/20",
  DECLINED: "text-red-500 bg-red-500/10 border-red-500/20",
};
const statusIcons: Record<string, any> = {
  PENDING: Clock, APPROVED: CheckCircle2, DECLINED: XCircle,
};

function formatDate(isoStr: string) {
  try {
    return new Date(isoStr).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch { return isoStr; }
}
function timeAgo(isoStr: string) {
  const ms = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NewRequestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [topic, setTopic] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: any) => api.post("/meeting-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-meeting-requests-page"] });
      queryClient.invalidateQueries({ queryKey: ["my-meeting-requests-badge"] });
      toast.success("Meeting request sent to the pastor!");
      setTopic(""); setPreferredDate(""); setNotes("");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to send request"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> Request Meeting with Pastor
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4 mt-2" onSubmit={(e) => {
          e.preventDefault();
          if (!topic || !preferredDate) { toast.error("Topic and date are required"); return; }
          mutation.mutate({ topic, preferredDate, notes });
        }}>
          <div className="space-y-2">
            <Label htmlFor="req-topic">Topic <span className="text-destructive">*</span></Label>
            <Input id="req-topic" placeholder="e.g. Spiritual guidance, Family counselling…" value={topic} onChange={(e) => setTopic(e.target.value)} className="rounded-xl h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-date">Preferred Date <span className="text-destructive">*</span></Label>
            <Input id="req-date" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="rounded-xl h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="req-notes">Additional Notes</Label>
            <Textarea id="req-notes" placeholder="Any specific concerns or context…" value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl resize-none" rows={3} />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {mutation.isPending ? "Sending…" : "Send Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const MemberMeetingRequestsPage = () => {
  const [filter, setFilter] = useState<ReqStatus>("ALL");
  const [newOpen, setNewOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ["my-meeting-requests-page"],
    queryFn: async () => (await api.get("/meeting-requests")).data.data,
    refetchInterval: 20000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/meeting-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-meeting-requests-page"] });
      queryClient.invalidateQueries({ queryKey: ["my-meeting-requests-badge"] });
      toast.success("Request cancelled.");
    },
    onError: () => toast.error("Failed to cancel request"),
  });

  const all = requests as any[];
  const counts = {
    ALL: all.length,
    PENDING: all.filter((r) => r.status === "PENDING").length,
    APPROVED: all.filter((r) => r.status === "APPROVED").length,
    DECLINED: all.filter((r) => r.status === "DECLINED").length,
  };
  const filtered = filter === "ALL" ? all : all.filter((r) => r.status === filter);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <MemberSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Meeting Requests" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">My Meeting Requests</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track your meeting requests with the pastor
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                  </Button>
                  <Button size="sm" className="rounded-xl" onClick={() => setNewOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> New Request
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["ALL", "PENDING", "APPROVED", "DECLINED"] as ReqStatus[]).map((s) => {
                  const Icon = s !== "ALL" ? statusIcons[s] : ClipboardList;
                  return (
                    <button
                      key={s}
                      onClick={() => setFilter(s)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 text-left hover:shadow-md ${
                        filter === s ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        s === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                        s === "APPROVED" ? "bg-green-500/10 text-green-500" :
                        s === "DECLINED" ? "bg-red-500/10 text-red-500" :
                        "bg-primary/10 text-primary"
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</p>
                        <p className="font-display text-xl font-bold text-foreground">{counts[s]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Filter pills */}
              <div className="flex gap-2 flex-wrap">
                {(["ALL", "PENDING", "APPROVED", "DECLINED"] as ReqStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                    {s !== "ALL" && counts[s] > 0 && (
                      <span className="ml-1.5 bg-background/30 px-1 rounded-sm">{counts[s]}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* List */}
              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-16 text-center">
                  <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-display font-semibold text-foreground">
                    {filter !== "ALL" ? `No ${filter.toLowerCase()} requests` : "No meeting requests yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Request a meeting with the pastor to get started.
                  </p>
                  <Button className="mt-4 rounded-xl" onClick={() => setNewOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> New Request
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((r: any) => {
                    const StatusIcon = statusIcons[r.status] || Clock;
                    const isPending = r.status === "PENDING";
                    const isApproved = r.status === "APPROVED";

                    return (
                      <div
                        key={r._id}
                        className={`bg-card border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-all hover:shadow-md ${
                          isPending ? "border-amber-500/20" :
                          isApproved ? "border-green-500/20" : "border-red-500/20"
                        }`}
                      >
                        {/* Status indicator */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isPending ? "bg-amber-500/10 text-amber-500" :
                          isApproved ? "bg-green-500/10 text-green-500" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-display font-semibold text-foreground">{r.topic}</h3>
                            <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold border shrink-0 ${statusColors[r.status]}`}>
                              <StatusIcon className="w-2.5 h-2.5" /> {r.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CalendarDays className="w-3 h-3" /> Preferred:
                              <span className="font-medium text-foreground ml-1">{formatDate(r.preferredDate)}</span>
                            </div>
                            <div className="text-muted-foreground">
                              Submitted: <span className="text-foreground">{timeAgo(r.createdAt)}</span>
                            </div>
                          </div>

                          {r.notes && (
                            <p className="text-xs text-muted-foreground italic bg-muted/30 px-3 py-2 rounded-lg mb-3">
                              "{r.notes}"
                            </p>
                          )}

                          {isApproved && (
                            <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/20 rounded-xl px-3 py-2 text-xs text-green-600">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              Approved by pastor — visible on your calendar
                            </div>
                          )}

                          {r.status === "DECLINED" && (
                            <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-500">
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                              This request was not approved. You may submit a new request.
                            </div>
                          )}

                          {isPending && (
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-amber-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Awaiting pastor review
                              </span>
                              <button
                                onClick={() => cancelMutation.mutate(r._id)}
                                disabled={cancelMutation.isPending}
                                className="text-xs text-red-400 hover:text-red-600 underline transition-colors"
                              >
                                {cancelMutation.isPending ? "Cancelling…" : "Cancel request"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <NewRequestModal open={newOpen} onClose={() => setNewOpen(false)} />
    </SidebarProvider>
  );
};

export default MemberMeetingRequestsPage;
