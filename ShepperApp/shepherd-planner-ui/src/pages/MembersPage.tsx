import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, Mail, Edit2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const MembersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Create Member State
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("MEMBER");

  // Edit Member State
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("MEMBER");

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.data.map((u: any) => ({
        ...u,
        avatar: u.name ? u.name.substring(0, 2).toUpperCase() : "U",
      }));
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newUser: any) => await api.post("/users", newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member added successfully");
      setOpen(false);
      setNewName(""); setNewEmail(""); setNewRole("MEMBER");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => await api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member updated successfully");
      setEditOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update member");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete member");
    }
  });

  const handleAddMember = () => {
    if (!newName || !newEmail) return;
    createMutation.mutate({
      name: newName,
      email: newEmail,
      role: newRole,
      password: "password123", // Default password for new members
    });
  };

  const openEditModal = (member: any) => {
    setEditingId(member._id);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRole(member.role);
    setEditOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingId || !editName || !editEmail) return;
    updateMutation.mutate({
      id: editingId,
      data: { name: editName, email: editEmail, role: editRole }
    });
  };

  const handleDelete = (member: any) => {
    setMemberToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      deleteMutation.mutate(memberToDelete._id, {
        onSuccess: () => {
          setDeleteConfirmOpen(false);
          setMemberToDelete(null);
        }
      });
    }
  };

  const filtered = members.filter((m: any) => {
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           m.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Members" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Members
                  </h2>
                  <p className="text-sm text-muted-foreground">{members.length} community members</p>
                </div>
                
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Add New Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Full Name" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="email@church.org" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger className="rounded-xl h-11">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1 rounded-xl" onClick={handleAddMember} disabled={createMutation.isPending}>
                          {createMutation.isPending ? "Adding..." : "Add Member"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Modal placed here cleanly */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl">Edit Member Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Full Name" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} placeholder="email@church.org" className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={editRole} onValueChange={setEditRole}>
                          <SelectTrigger className="rounded-xl h-11">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setEditOpen(false)}>
                          Cancel
                        </Button>
                        <Button className="flex-1 rounded-xl" onClick={handleEditSubmit} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                  <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl text-destructive">Remove Member</DialogTitle>
                    </DialogHeader>
                    <div className="mt-2 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Are you sure you want to remove <span className="font-semibold text-foreground">{memberToDelete?.name}</span>? This action cannot be undone.
                      </p>
                      <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteConfirmOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1 rounded-xl"
                          onClick={confirmDelete}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Removing..." : "Yes, Remove"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 rounded-xl bg-muted/50 border-0 focus:bg-background focus:border-border"
                  />
                </div>
              </div>

              {/* Member List */}
              {isLoading ? (
                <div className="text-muted-foreground">Loading members...</div>
              ) : (
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_1fr_1fr_auto] gap-4 p-4 border-b border-border bg-muted/30">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Member</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:block">Email</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:block">System Role</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</span>
                  </div>
                  {filtered.map((member: any) => (
                    <div
                      key={member._id}
                      className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[1fr_1fr_1fr_auto] gap-4 p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">{member.avatar}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">Registered</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground hidden sm:block">{member.email}</span>
                      <span className="text-sm text-muted-foreground hidden sm:block">{member.role}</span>
                      <div className="flex gap-1 justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          title="Send Email"
                          onClick={() => window.location.href = `mailto:${member.email}`}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                          title="Edit Member"
                          onClick={() => openEditModal(member)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete Member"
                          onClick={() => handleDelete(member)}
                        >
                          <Trash2 className="w-4 h-4" />
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

export default MembersPage;
