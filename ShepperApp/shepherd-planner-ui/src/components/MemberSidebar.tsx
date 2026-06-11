import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  MessageSquare,
  Megaphone,
  Church,
  LogOut,
  ClipboardList,
  User,
  Home,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  useSidebar,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const navItems = [
  { title: "Dashboard", url: "/member", icon: LayoutDashboard },
  { title: "Calendar", url: "/member/calendar", icon: Calendar },
  { title: "Events", url: "/member/events", icon: CalendarDays },
  { title: "Announcements", url: "/member/announcements", icon: Megaphone },
  { title: "Pastoral Visits", url: "/member/visits", icon: Home },
  { title: "Meeting Requests", url: "/member/meeting-requests", icon: ClipboardList },
  { title: "Messages", url: "/member/messages", icon: MessageSquare },
  { title: "Profile", url: "/member/profile", icon: User },
];

export function MemberSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const { data: messages = [] } = useQuery({
    queryKey: ["messages-badge-member"],
    queryFn: async () => {
      const res = await api.get("/messages");
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements-badge"],
    queryFn: async () => {
      const res = await api.get("/announcements");
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ["my-meeting-requests-badge"],
    queryFn: async () => {
      const res = await api.get("/meeting-requests");
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 20000,
  });

  const { data: myVisits = [] } = useQuery({
    queryKey: ["my-pastoral-visits-badge"],
    queryFn: async () => {
      const res = await api.get("/pastoral-visits");
      return res.data.data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadMessages = (messages as any[]).filter(
    (m: any) => m.receiver?._id === user?._id && !m.read
  ).length;

  const pendingRequests = (myRequests as any[]).filter(
    (r: any) => r.status === "PENDING"
  ).length;

  const announcementCount = (announcements as any[]).length;

  const upcomingVisits = (myVisits as any[]).filter(
    (v: any) => ["PLANNED", "CONFIRMED"].includes(v.status)
  ).length;

  const getBadge = (title: string) => {
    if (title === "Messages" && unreadMessages > 0)
      return { count: unreadMessages, color: "bg-accent text-accent-foreground" };
    if (title === "Meeting Requests" && pendingRequests > 0)
      return { count: pendingRequests, color: "bg-amber-500 text-white" };
    if (title === "Announcements" && announcementCount > 0)
      return { count: announcementCount, color: "bg-primary text-primary-foreground" };
    if (title === "Pastoral Visits" && upcomingVisits > 0)
      return { count: upcomingVisits, color: "bg-green-500 text-white" };
    return null;
  };

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
              {navItems.map((item) => {
                const badge = getBadge(item.title);
                return (
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
                        {badge && (
                          <span
                            className={`absolute right-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${badge.color} ${
                              collapsed ? "top-1 right-1 px-1" : ""
                            }`}
                          >
                            {badge.count > 9 ? "9+" : badge.count}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

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
