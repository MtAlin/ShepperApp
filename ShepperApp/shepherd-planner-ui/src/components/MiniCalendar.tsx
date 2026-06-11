import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  // Fetch events
  const { data: events = [] } = useQuery({
    queryKey: ["mini-calendar-events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data.data;
    },
  });

  // Fetch meeting requests (member -> admin)
  const { data: requests = [] } = useQuery({
    queryKey: ["mini-calendar-requests"],
    queryFn: async () => {
      const res = await api.get("/meeting-requests");
      return res.data.data;
    },
  });

  // Fetch admin-scheduled meetings (admin -> member)
  const { data: directMeetings = [] } = useQuery({
    queryKey: ["mini-calendar-direct-meetings"],
    queryFn: async () => {
      const res = await api.get("/meetings");
      return res.data.data;
    },
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Extract events and approved meetings for the current displayed month
  const monthEvents = (events as any[]).filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const monthMeetings = (requests as any[]).filter(r => {
    if (r.status !== "APPROVED") return false;
    const d = new Date(r.preferredDate);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const monthDirectMeetings = (directMeetings as any[]).filter(m => {
    const d = new Date(m.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    
    // Check if this specific day has events or meetings
    const dayEvents = monthEvents.filter(e => new Date(e.date).getDate() === day);
    const dayRequests = monthMeetings.filter(r => new Date(r.preferredDate).getDate() === day);
    const dayDirectMeetings = monthDirectMeetings.filter(m => new Date(m.date).getDate() === day);

    const hasRegularEvent = dayEvents.length > 0;
    const hasMeeting = dayRequests.length > 0 || dayDirectMeetings.length > 0;

    // Create a title string for hover
    let titleStr = "";
    if (hasRegularEvent) titleStr += dayEvents.map(e => e.title).join(", ") + "\n";
    if (dayRequests.length > 0) titleStr += dayRequests.map(r => `Meeting: ${r.topic}`).join(", ") + "\n";
    if (dayDirectMeetings.length > 0) titleStr += dayDirectMeetings.map(m => `Meeting: ${m.title}`).join(", ") + "\n";
    titleStr = titleStr.trim();

    days.push(
      <button
        key={day}
        title={titleStr}
        className={`relative h-10 w-10 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-muted
          ${isToday ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-foreground"}
        `}
      >
        {day}
        {(!isToday && (hasRegularEvent || hasMeeting)) && (
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
            {hasRegularEvent && (
              <span className="w-1 h-1 rounded-full bg-accent" />
            )}
            {hasMeeting && (
              <span className="w-1 h-1 rounded-full bg-teal-500" />
            )}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-foreground">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="h-10 flex items-center justify-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{days}</div>
      
      {/* Legend */}
      <div className="flex gap-3 mt-4 pt-4 border-t border-border justify-center">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Events
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Meetings
        </div>
      </div>
    </div>
  );
}
