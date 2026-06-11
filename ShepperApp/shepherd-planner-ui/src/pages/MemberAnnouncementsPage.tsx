import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MemberSidebar } from "@/components/MemberSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Megaphone,
  Pin,
  Clock,
  Search,
  Loader2,
  Bell,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const MemberAnnouncementsPage = () => {
  const [search, setSearch] = useState("");

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements-page"],
    queryFn: async () => (await api.get("/announcements")).data.data,
    refetchInterval: 30000,
  });

  const filtered = (announcements as any[]).filter((a: any) =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.content?.toLowerCase().includes(search.toLowerCase())
  );

  const pinned = filtered.filter((a: any) => a.pinned);
  const regular = filtered.filter((a: any) => !a.pinned);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <MemberSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Announcements" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-primary" /> Church Announcements
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Stay up to date with church news and updates
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search announcements…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-xl h-10"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-16 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-display font-semibold text-foreground">
                    {search ? "No announcements match your search" : "No announcements yet"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check back later for church updates.
                  </p>
                  {search && (
                    <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setSearch("")}>
                      Clear search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pinned */}
                  {pinned.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Pin className="w-3.5 h-3.5 text-amber-500" /> Pinned
                      </h2>
                      <div className="space-y-4">
                        {pinned.map((a: any) => (
                          <AnnouncementCard key={a._id} announcement={a} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular */}
                  {regular.length > 0 && (
                    <div>
                      {pinned.length > 0 && (
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          All Announcements
                        </h2>
                      )}
                      <div className="space-y-4">
                        {regular.map((a: any) => (
                          <AnnouncementCard key={a._id} announcement={a} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

function AnnouncementCard({ announcement: a }: { announcement: any }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = a.content?.length > 300;

  return (
    <div className={`bg-card border rounded-2xl p-6 transition-all duration-200 hover:shadow-md ${a.pinned ? "border-amber-500/30 bg-amber-500/2" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.pinned ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}>
            {a.pinned ? <Pin className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground text-base">{a.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {a.author?.name && (
                <span className="text-xs text-muted-foreground">by {a.author.name}</span>
              )}
              {a.pinned && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20">
                  PINNED
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="w-3 h-3" />
          {timeAgo(a.createdAt)}
        </div>
      </div>

      <p className={`text-sm text-foreground/80 leading-relaxed ${!expanded && isLong ? "line-clamp-4" : ""}`}>
        {a.content}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline mt-2 font-medium"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}

      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
        {formatDate(a.createdAt)}
      </p>
    </div>
  );
}

export default MemberAnnouncementsPage;
