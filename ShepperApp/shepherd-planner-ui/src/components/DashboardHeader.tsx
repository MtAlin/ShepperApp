import { Bell, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";
import { NotificationPanel } from "@/components/NotificationPanel";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface DashboardHeaderProps {
  subtitle?: string;
}

export function DashboardHeader({ subtitle }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();

  const username = user?.name ?? "User";

  const { data: messages = [] } = useQuery({
    queryKey: ["messages-badge"],
    queryFn: async () => {
      const res = await api.get("/messages");
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const unreadCount = messages.filter((m: any) => {
    const receiverId = typeof m.receiver === 'object' ? m.receiver?._id : m.receiver;
    return receiverId === user?._id && !m.read;
  }).length;

  return (
    <>
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">
              {subtitle || `Welcome back, ${username}`}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">Manage your church community</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 w-56 h-9 rounded-xl bg-muted/50 border-0 focus:bg-background focus:border-border"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl"
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Logout button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={logout}
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <NotificationPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
