import {
  LayoutDashboard,
  Calendar,
  Users,
  CalendarDays,
  MessageSquare,
  Settings,
  Church,
  LogOut,
  ClipboardList,
  Home,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useSidebar, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Calendar", url: "/admin/calendar", icon: Calendar },
  { title: "Members", url: "/admin/members", icon: Users },
  { title: "Events", url: "/admin/events", icon: CalendarDays },
  { title: "Visit Planner", url: "/admin/visit-planner", icon: Home },
  { title: "Meeting Requests", url: "/admin/meeting-requests", icon: ClipboardList },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Fetch messages to show a notification badge if there are any unread received messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages-badge"],
    queryFn: async () => {
      const res = await api.get("/messages");
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const unreadCount = messages.filter((m: any) => m.receiver?._id === user?._id && !m.read).length;

  // Pending meeting requests badge
  const { data: meetingRequestsData = [] } = useQuery({
    queryKey: ["meeting-requests-badge"],
    queryFn: async () => {
      const res = await api.get("/meeting-requests");
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });
  const pendingMeetingsCount = (meetingRequestsData as any[]).filter(
    (r: any) => r.status === "PENDING"
  ).length;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Church className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-display text-base font-bold text-foreground leading-tight">
                Shepherd
              </h2>
              <p className="text-xs text-muted-foreground">Planner</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="rounded-xl h-11 transition-all duration-200"
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted relative w-full flex items-center"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="w-5 h-5 mr-3 shrink-0" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {item.title === "Messages" && unreadCount > 0 && (
                         <span className={`absolute right-2 px-1.5 py-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full ${collapsed ? "top-1 right-1 px-1" : ""}`}>
                           {unreadCount > 9 ? "9+" : unreadCount}
                         </span>
                      )}
                      {item.title === "Meeting Requests" && pendingMeetingsCount > 0 && (
                         <span className={`absolute right-2 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full ${collapsed ? "top-1 right-1 px-1" : ""}`}>
                           {pendingMeetingsCount > 9 ? "9+" : pendingMeetingsCount}
                         </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user info + logout */}
      <SidebarFooter className="p-3 border-t border-border">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-2 py-1 mb-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {(user?.name || "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className={`w-full rounded-xl h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${
            collapsed ? "justify-center px-0" : "justify-start"
          }`}
          onClick={logout}
          title="Log out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="ml-3">Log out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
