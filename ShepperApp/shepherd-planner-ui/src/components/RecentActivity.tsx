import { Calendar, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const { data: users = [] } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.data;
    }
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data.data;
    }
  });

  const loadedActivities: any[] = [];

  users.forEach((u: any) => {
    if (u.createdAt) {
      loadedActivities.push({
        type: 'user',
        icon: Users,
        title: "New member added",
        description: `${u.name || 'Member'} registered to the church`,
        time: formatDistanceToNow(new Date(u.createdAt), { addSuffix: true }),
        sortTime: new Date(u.createdAt).getTime(),
        color: "bg-secondary/30 text-secondary-foreground",
      });
    }
  });

  events.forEach((e: any) => {
    if (e.createdAt) {
      // safely parsing the event date
      let dateString = '';
      try {
        dateString = new Date(e.date).toLocaleDateString();
      } catch (err) {
        dateString = e.date;
      }
      
      loadedActivities.push({
        type: 'event',
        icon: Calendar,
        title: "Event scheduled",
        description: `${e.title} scheduled for ${dateString}`,
        time: formatDistanceToNow(new Date(e.createdAt), { addSuffix: true }),
        sortTime: new Date(e.createdAt).getTime(),
        color: "bg-primary/10 text-primary",
      });
    }
  });

  // Sort by newest first
  const sortedActivities = loadedActivities.sort((a, b) => b.sortTime - a.sortTime).slice(0, 5);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display font-semibold text-foreground mb-5">Recent Activity</h3>
      <div className="space-y-4">
        {sortedActivities.length > 0 ? sortedActivities.map((a, i) => (
          <div
            key={i}
            className="flex gap-4 items-start animate-fade-in-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
              <a.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
          </div>
        )) : (
          <div className="text-sm text-muted-foreground py-4">No recent activity detected yet.</div>
        )}
      </div>
    </div>
  );
}
