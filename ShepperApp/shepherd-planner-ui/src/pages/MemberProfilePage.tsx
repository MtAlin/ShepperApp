import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Church, ArrowLeft, LogOut, User, Mail, Shield, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";

const MemberProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    try {
      setSaving(true);
      await api.put(`/users/${user?._id}`, { name });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    try {
      setChangingPwd(true);
      // Currently the backend update route handles password via the User model
      await api.put(`/users/${user?._id}`, { password: newPassword });
      toast.success("Password changed! Please log in again.");
      setTimeout(() => logout(), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to change password");
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/member")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Church className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">My Profile</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Avatar / Info Header */}
        <div className="flex items-center gap-5 p-6 bg-card border border-border rounded-2xl animate-fade-in-up">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-primary">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </span>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{user?.name}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              <Shield className="w-3 h-3" />
              {user?.role === "ADMIN" ? "Administrator" : "Community Member"}
            </span>
          </div>
        </div>

        {/* Edit Name */}
        <form
          onSubmit={handleSaveName}
          className="p-6 bg-card border border-border rounded-2xl space-y-4 animate-fade-in-up"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display font-semibold text-foreground">Personal Information</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">Email Address</Label>
            <Input
              id="profile-email"
              value={user?.email ?? ""}
              disabled
              className="rounded-xl h-11 opacity-60"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed. Contact admin if needed.</p>
          </div>
          <Button type="submit" className="rounded-xl" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </form>

        {/* Change Password */}
        <form
          onSubmit={handleChangePassword}
          className="p-6 bg-card border border-border rounded-2xl space-y-4 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display font-semibold text-foreground">Change Password</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="rounded-xl h-11"
            />
          </div>
          <Button type="submit" variant="outline" className="rounded-xl" disabled={changingPwd}>
            {changingPwd ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Change Password
          </Button>
        </form>

        {/* Danger zone */}
        <div
          className="p-6 bg-card border border-destructive/20 rounded-2xl animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          <h2 className="font-display font-semibold text-destructive mb-2">Sign Out</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You will be logged out of your account and redirected to the login page.
          </p>
          <Button variant="destructive" className="rounded-xl" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" /> Log out
          </Button>
        </div>
      </main>
    </div>
  );
};

export default MemberProfilePage;
