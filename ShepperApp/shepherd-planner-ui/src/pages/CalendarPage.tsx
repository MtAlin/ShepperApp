import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const categoryColors: Record<string, string> = {
  service: "bg-primary text-primary-foreground",
  rehearsal: "bg-secondary text-secondary-foreground",
  group: "bg-secondary text-secondary-foreground",
  pastoral: "bg-accent text-accent-foreground",
  event: "bg-primary/20 text-primary",
  meeting_request: "bg-teal-500/20 text-teal-600",
};

const categoryDots: Record<string, string> = {
  service: "bg-primary",
  rehearsal: "bg-secondary",
  group: "bg-secondary",
  pastoral: "bg-accent",
  event: "bg-primary/60",
  meeting_request: "bg-teal-500",
};

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SERVICE");

  const { data: remoteEvents = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data.data;
    }
  });

  const { data: meetingRequests = [] } = useQuery({
    queryKey: ["meeting-requests-calendar"],
    queryFn: async () => {
      const res = await api.get("/meeting-requests");
      return res.data.data;
    }
  });

  // Approved meeting requests shown on the calendar
  const approvedRequests: any[] = (meetingRequests as any[]).filter(
    (r: any) => r.status === "APPROVED"
  );

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
    const dateTimeString = time ? `${date}T${time}:00` : `${date}T00:00:00`;
    const eventDate = new Date(dateTimeString);
    createMutation.mutate({
      title,
      description,
      date: eventDate.toISOString(),
      category
    });
  };

  const events = [
    ...remoteEvents.map((e: any) => {
      const d = new Date(e.date);
      return {
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        title: e.title,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: e.category.toLowerCase().replace('_', ''),
        isMeetingRequest: false,
        requester: null,
      };
    }),
    ...approvedRequests.map((r: any) => {
      const d = new Date(r.preferredDate);
      return {
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        title: `Meeting: ${r.topic}`,
        time: "Preferred date",
        category: "meeting_request",
        isMeetingRequest: true,
        requester: r.requester?.name || "Member",
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

  // Filter events for the currently shown month/year
  const monthEvents = events.filter((e: any) => e.month === month && e.year === year);

  const selectedEvents = selectedDay
    ? monthEvents.filter((e: any) => e.day === selectedDay)
    : [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Calendar" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {MONTHS[month]} {year}
                  </h2>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl">
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Event
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

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-6">
                {Object.entries({ service: "Services", rehearsal: "Rehearsals", group: "Small Groups", pastoral: "Pastoral", event: "Events", meeting_request: "Approved Meetings" }).map(
                  ([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${categoryDots[key]}`} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
                  <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
                    {DAYS.map((d) => (
                      <div key={d} className="bg-muted/50 p-3 text-xs font-medium text-muted-foreground text-center">
                        {d.slice(0, 3)}
                      </div>
                    ))}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`e-${i}`} className="bg-card p-3 min-h-[100px]" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayEvents = monthEvents.filter((e: any) => e.day === day);
                      const isToday =
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear();
                      const isSelected = selectedDay === day;

                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(day)}
                          className={`bg-card p-2 min-h-[100px] text-left hover:bg-muted/30 transition-colors ${
                            isSelected ? "ring-2 ring-primary ring-inset" : ""
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-medium ${
                              isToday
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {day}
                          </span>
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map((e) => (
                              <div
                                key={e.title}
                                className={`text-[10px] px-1.5 py-0.5 rounded-md truncate ${categoryColors[e.category] || categoryColors.event}`}
                              >
                                {e.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-[10px] text-muted-foreground px-1">
                                +{dayEvents.length - 2} more
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Detail */}
                <div className="lg:col-span-1">
                  <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
                    <h3 className="font-display font-semibold text-foreground mb-4">
                      {selectedDay
                        ? `${MONTHS[month]} ${selectedDay}`
                        : "Select a day"}
                    </h3>
                    {selectedEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedEvents.map((e, idx) => (
                          <div key={`${e.title}-${idx}`} className={`p-3 rounded-xl ${e.isMeetingRequest ? 'bg-teal-500/8 border border-teal-500/20' : 'bg-muted/50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${categoryDots[e.category] || categoryDots.event}`} />
                              <span className="text-sm font-medium text-foreground">{e.title}</span>
                            </div>
                            {e.isMeetingRequest && e.requester && (
                              <p className="text-xs text-teal-600 ml-4 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {e.requester}
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
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CalendarPage;
