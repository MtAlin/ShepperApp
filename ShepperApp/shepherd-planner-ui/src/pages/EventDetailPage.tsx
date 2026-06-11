import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Calendar, Clock, Tag, Edit2, Trash2, Users,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const categoryStyles: Record<string, { badge: string; bg: string; dot: string; label: string }> = {
  SERVICE:          { badge: "bg-primary/10 text-primary border-primary/20",          bg: "from-primary/20 to-primary/5",          dot: "bg-primary",          label: "Service" },
  SMALL_GROUP:      { badge: "bg-green-500/10 text-green-400 border-green-500/20",     bg: "from-green-500/20 to-green-500/5",      dot: "bg-green-400",        label: "Small Group" },
  PASTORAL_MEETING: { badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",     bg: "from-amber-500/20 to-amber-500/5",      dot: "bg-amber-400",        label: "Pastoral Meeting" },
  REHEARSAL:        { badge: "bg-secondary/30 text-secondary-foreground border-secondary/40", bg: "from-secondary/30 to-secondary/5", dot: "bg-secondary-foreground", label: "Rehearsal" },
};

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editCategory, setEditCategory] = useState("SERVICE");

  // Delete confirm state
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const res = await api.get(`/events/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => api.put(`/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event updated successfully");
      setEditOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to update event"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
      navigate("/admin/events");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete event"),
  });

  const openEdit = () => {
    if (!event) return;
    const d = new Date(event.date);
    setEditTitle(event.title);
    setEditDescription(event.description || "");
    setEditDate(d.toISOString().split("T")[0]);
    setEditTime(d.toTimeString().slice(0, 5));
    setEditCategory(event.category);
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editTitle || !editDate) return;
    const dateTimeString = editTime ? `${editDate}T${editTime}:00` : `${editDate}T00:00:00`;
    updateMutation.mutate({
      title: editTitle,
      description: editDescription,
      date: new Date(dateTimeString).toISOString(),
      category: editCategory,
    });
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Loading event...
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!event) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground">Event not found.</p>
            <Button onClick={() => navigate("/admin/events")} className="rounded-xl">Back to Events</Button>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  const style = categoryStyles[event.category] || categoryStyles.SERVICE;
  const eventDate = parseISO(event.date);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Event Details" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Back + Actions */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" className="rounded-xl gap-2" onClick={() => navigate("/admin/events")}>
                  <ArrowLeft className="w-4 h-4" />
                  Back to Events
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl gap-2" onClick={openEdit}>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" className="rounded-xl gap-2" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Hero Card */}
              <div className={`relative bg-gradient-to-br ${style.bg} border border-border rounded-3xl p-8 overflow-hidden`}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <Badge className={`${style.badge} border rounded-full px-3 py-1 text-xs font-medium mb-4`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot} mr-1.5 inline-block`} />
                    {style.label}
                  </Badge>
                  <h1 className="font-display text-3xl font-bold text-foreground mb-2">{event.title}</h1>
                  {event.description && (
                    <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Date</p>
                    <p className="font-semibold text-foreground">{format(eventDate, "MMMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Time</p>
                    <p className="font-semibold text-foreground">{format(eventDate, "h:mm a")}</p>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Category</p>
                    <p className="font-semibold text-foreground">{style.label}</p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Event Details
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Created</p>
                    <p className="text-foreground font-medium">
                      {event.createdAt ? format(parseISO(event.createdAt), "MMM d, yyyy 'at' h:mm a") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-foreground font-medium">
                      {event.updatedAt ? format(parseISO(event.updatedAt), "MMM d, yyyy 'at' h:mm a") : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Event ID</p>
                    <p className="text-foreground font-mono text-xs">{event._id}</p>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Event Title</Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="rounded-xl h-11" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="w-full h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="REHEARSAL">Rehearsal</SelectItem>
                  <SelectItem value="SMALL_GROUP">Small Group</SelectItem>
                  <SelectItem value="PASTORAL_MEETING">Pastoral Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="rounded-xl h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} className="rounded-xl resize-none" rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl" onClick={handleEditSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-destructive">Delete Event</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{event.title}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </SidebarProvider>
  );
};

export default EventDetailPage;
