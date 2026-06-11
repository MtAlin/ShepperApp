import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const categoryStyles: Record<string, string> = {
  SERVICE: "bg-primary/10 text-primary border-primary/20",
  SMALL_GROUP: "bg-secondary/30 text-secondary-foreground border-secondary/40",
  PASTORAL_MEETING: "bg-accent/10 text-accent border-accent/20",
  REHEARSAL: "bg-secondary/30 text-secondary-foreground border-secondary/40",
};

const EventsPage = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SERVICE");

  const { data: eventsList = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newEvent: any) => {
      return await api.post("/events", newEvent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully");
      setOpen(false);
      setTitle(""); setDate(""); setTime(""); setDescription("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create event");
    }
  });

  const handleCreateEvent = () => {
    if (!title || !date || !category) {
       toast.error("Title, date, and category are required");
       return;
    }
    
    // Combine date and time
    const dateTimeString = time ? `${date}T${time}:00` : `${date}T00:00:00`;
    const eventDate = new Date(dateTimeString);

    createMutation.mutate({
      title,
      description,
      date: eventDate.toISOString(),
      category
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Events" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">Events</h2>
                  <p className="text-sm text-muted-foreground">{eventsList.length} upcoming events</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Event Title</Label>
                        <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Sunday Worship Service" className="rounded-xl h-11" />
                      </div>
                      
                      <div className="space-y-2">
                         <Label>Category</Label>
                         <Select value={category} onValueChange={setCategory}>
                           <SelectTrigger className="w-full h-11 rounded-xl">
                             <SelectValue placeholder="Select a category" />
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
                          <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input type="time" value={time} onChange={e=>setTime(e.target.value)} className="rounded-xl h-11" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the event..." className="rounded-xl resize-none" rows={3} />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1 rounded-xl" onClick={handleCreateEvent} disabled={createMutation.isPending}>
                          {createMutation.isPending ? "Creating..." : "Create Event"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Event List */}
              {isLoading ? (
                <div className="text-muted-foreground">Loading events...</div>
              ) : eventsList.length === 0 ? (
                <div className="text-muted-foreground">No events found. Create one to get started!</div>
              ) : (
                <div className="space-y-4">
                  {eventsList.map((event: any, i: number) => (
                    <div
                      key={event._id}
                      onClick={() => navigate(`/admin/events/${event._id}`)}
                      className={`bg-card border rounded-2xl p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-fade-in-up ${categoryStyles[event.category] || categoryStyles.SERVICE}`}
                      style={{ animationDelay: `${i * 0.05}s` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="font-display text-lg font-semibold text-foreground">
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {format(parseISO(event.date), "MMMM d, yyyy")}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {format(parseISO(event.date), "h:mm a")}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium">
                              🏷️ {event.category.replace('_', ' ')}
                            </span>
                            {event.description && (
                                <span className="flex items-center gap-1.5 text-xs truncate max-w-xs">
                                    {event.description}
                                </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-xl shrink-0">
                          <ArrowRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default EventsPage;
