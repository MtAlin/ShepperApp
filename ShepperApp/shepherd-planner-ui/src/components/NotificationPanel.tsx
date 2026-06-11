import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, Calendar, Users, MessageSquare } from "lucide-react";

const notifications = [
  {
    id: 1,
    icon: Calendar,
    title: "Pastoral Meeting Tomorrow",
    description: "Meeting with Deacon Johnson at 10:00 AM",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    icon: Users,
    title: "New Member Registration",
    description: "Sarah Williams joined the community",
    time: "5 hours ago",
    unread: true,
  },
  {
    id: 3,
    icon: MessageSquare,
    title: "Message from Youth Group",
    description: "Update on summer camp planning",
    time: "1 day ago",
    unread: false,
  },
  {
    id: 4,
    icon: Bell,
    title: "Event Reminder",
    description: "Sunday Service preparation meeting",
    time: "2 days ago",
    unread: false,
  },
];

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display">Notifications</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-4 p-4 rounded-xl transition-colors cursor-pointer hover:bg-muted ${
                n.unread ? "bg-primary/5" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                n.unread ? "bg-primary/10" : "bg-muted"
              }`}>
                <n.icon className={`w-5 h-5 ${n.unread ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
              </div>
              {n.unread && (
                <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
