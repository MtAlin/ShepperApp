import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { QuickActionCard } from "@/components/QuickActionCard";
import { MiniCalendar } from "@/components/MiniCalendar";
import { RecentActivity } from "@/components/RecentActivity";
import { CalendarPlus, CalendarDays, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { ScheduleMeetingModal } from "@/components/ScheduleMeetingModal";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { data: users = [] } = useQuery({
    queryKey: ["members"],
    queryFn: async () => (await api.get("/users")).data.data
  });
  
  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => (await api.get("/events")).data.data
  });

  const { data: meetingRequests = [] } = useQuery({
    queryKey: ["meeting-requests"],
    queryFn: async () => (await api.get("/meeting-requests")).data.data
  });

  const queryClient = useQueryClient();

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      return await api.put(`/meeting-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-requests"] });
      toast.success("Meeting request updated");
    },
    onError: () => toast.error("Failed to update meeting request")
  });

  const pendingRequests = meetingRequests.filter((r: any) => r.status === 'PENDING');
  const upcomingMeetings = meetingRequests.filter((r: any) => r.status === 'APPROVED');
  
  // Format Date for nice display
  const formatDate = (isoStr: string) => {
    try {
      if (!isoStr) return 'TBD';
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-GB", { weekday: 'short', day: "numeric", month: "short", year: "numeric" });
    } catch {
      return isoStr;
    }
  };
  
  const formatTimeAgo = (isoStr: string) => {
    try {
      const ms = Date.now() - new Date(isoStr).getTime();
      const minutes = Math.floor(ms / 60000);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return '';
    }
  };
  
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Quick Actions */}
              <section className="animate-fade-in-up">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <QuickActionCard
                    icon={CalendarPlus}
                    title="Schedule Meeting"
                    description="Set up a pastoral or team meeting"
                    color="primary"
                    onClick={() => setMeetingModalOpen(true)}
                  />
                  <QuickActionCard
                    icon={CalendarDays}
                    title="Create Event"
                    description="Plan a new church event or service"
                    color="secondary"
                    onClick={() => navigate('/admin/calendar')}
                  />
                  <QuickActionCard
                    icon={UserPlus}
                    title="Add Member"
                    description="Register a new community member"
                    color="accent"
                    onClick={() => navigate('/admin/members')}
                  />
                </div>
              </section>

              {/* Calendar + Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                  <MiniCalendar />
                </div>
                <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                  <RecentActivity />
                </div>
              </div>

              {/* Pending Meeting Requests */}
              <section className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Pending Meeting Requests
                </h2>
                {pendingRequests.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground text-sm">
                    No pending meeting requests.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {pendingRequests.map((req: any) => (
                      <div key={req._id} className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-display font-semibold text-foreground text-base leading-tight pr-4">{req.topic}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-500 flex items-center gap-1 shrink-0 uppercase tracking-widest">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-4 bg-muted/40 p-3 rounded-xl border border-border/50">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/10">
                              <span className="text-sm font-bold text-primary">
                                {(req.requester?.name || "?").charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-semibold text-foreground">{req.requester?.name || 'Unknown Member'}</p>
                               <p className="text-xs text-muted-foreground truncate">{req.requester?.email}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                             <div className="flex items-center justify-between text-sm">
                               <span className="text-muted-foreground">Requested For:</span>
                               <span className="font-semibold text-foreground flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-primary" /> {formatDate(req.preferredDate)}</span>
                             </div>
                             <div className="flex items-center justify-between text-xs text-muted-foreground">
                               <span>Submitted:</span>
                               <span>{formatTimeAgo(req.createdAt)}</span>
                             </div>
                          </div>
                          
                          {req.notes && (
                            <div className="mt-4 text-sm text-foreground bg-accent/5 p-3 rounded-lg border border-accent/10 italic">
                              "{req.notes}"
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-5 pt-4 border-t border-border">
                          <Button 
                            className="flex-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none" 
                            onClick={() => updateRequestMutation.mutate({ id: req._id, status: 'APPROVED' })}
                            disabled={updateRequestMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10"
                            onClick={() => updateRequestMutation.mutate({ id: req._id, status: 'DECLINED' })}
                            disabled={updateRequestMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Stats */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                {[
                  { label: "Total Members", value: users.length.toString(), change: "Active community" },
                  { label: "Upcoming Events", value: events.length.toString(), change: "Scheduled" },
                  { label: "Meetings This Week", value: events.filter((e:any) => e.category === 'PASTORAL_MEETING').length.toString(), change: "Pastoral meetings" },
                  { label: "Total Leaders", value: users.filter((u:any) => u.role === 'ADMIN').length.toString(), change: "Administrators" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-display text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                ))}
              </section>
            </div>
          </main>
        </div>
      </div>
      <ScheduleMeetingModal open={meetingModalOpen} onOpenChange={setMeetingModalOpen} />
    </SidebarProvider>
  );
};

export default AdminDashboard;
