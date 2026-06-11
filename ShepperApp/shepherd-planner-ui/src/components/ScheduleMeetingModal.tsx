import { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

interface ScheduleMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleMeetingModal({ open, onOpenChange }: ScheduleMeetingModalProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.data;
    },
    enabled: open,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.post("/meetings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting scheduled successfully");
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to schedule meeting");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setDescription("");
    setSelectedUsers([]);
    setSearchQuery("");
  };

  const handleToggleUser = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }, [setSelectedUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const nameStr = (u.name || "").toLowerCase();
      const emailStr = (u.email || "").toLowerCase();
      const query = (searchQuery || "").toLowerCase();
      return nameStr.includes(query) || emailStr.includes(query);
    });
  }, [users, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) {
      toast.error("Please fill in title, date and time");
      return;
    }

    const dateTimeString = `${date}T${time}:00`;
    const meetingDate = new Date(dateTimeString);
    
    if (isNaN(meetingDate.getTime())) {
      toast.error("Invalid date or time selected");
      return;
    }
    
    createMeetingMutation.mutate({
      title,
      description,
      date: meetingDate.toISOString(),
      participants: selectedUsers,
      location,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Schedule Direct Meeting
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Create a private meeting with specific members or groups.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 space-y-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Topic / Title <span className="text-destructive">*</span></Label>
            <Input
              id="meeting-title"
              placeholder="e.g. Pastoral Counseling, Leadership Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-date">Date <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="meeting-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl h-11 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-time">Time <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="meeting-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl h-11 pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-location">Location / Link</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="meeting-location"
                placeholder="Office, Zoom link, etc."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl h-11 pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Participants (Members)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl h-10 pl-10 bg-muted/30 border-0"
              />
            </div>
            <div className="border border-border rounded-xl">
              <ScrollArea className="h-[150px] p-2">
                {usersLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
                ) : (
                  <div className="space-y-1">
                    {filteredUsers.map((u: any) => (
                      <div
                        key={u._id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedUsers.includes(u._id)}
                          onCheckedChange={() => handleToggleUser(u._id)}
                          id={`user-${u._id}`}
                          className="cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`user-${u._id}`}
                            className="text-sm font-medium leading-none cursor-pointer block"
                          >
                            {u.name}
                          </Label>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {selectedUsers.length} participant(s) selected
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-notes">Notes / Agenda</Label>
            <Textarea
              id="meeting-notes"
              placeholder="What will this meeting be about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>
        </form>

        <DialogFooter className="p-6 pt-2 border-t border-border bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createMeetingMutation.isPending}
            className="rounded-xl min-w-[120px]"
          >
            {createMeetingMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              "Schedule Meeting"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
