import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Church, Palette, Shield, Bell } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    churchName: "",
    website: "",
    themeColor: "#5D9CEC",
    emailNotifications: true,
    meetingReminders: true,
    newMemberAlerts: true
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data.data;
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        churchName: settings.churchName || "",
        website: settings.website || "",
        themeColor: settings.themeColor || "#5D9CEC",
        emailNotifications: settings.emailNotifications ?? true,
        meetingReminders: settings.meetingReminders ?? true,
        newMemberAlerts: settings.newMemberAlerts ?? true,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return await api.put("/settings", updatedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save settings");
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading settings...</div>;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader subtitle="Settings" />
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="font-display text-2xl font-bold text-foreground">Settings</h2>

              {/* Church Branding */}
              <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Church className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Church Branding</h3>
                    <p className="text-sm text-muted-foreground">Customize your church identity</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Church Name</Label>
                    <Input 
                      value={formData.churchName}
                      onChange={e => updateField("churchName", e.target.value)}
                      className="rounded-xl h-11" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input 
                      value={formData.website}
                      onChange={e => updateField("website", e.target.value)}
                      className="rounded-xl h-11" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Church Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </section>

              {/* Theme */}
              <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary/30 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Appearance</h3>
                    <p className="text-sm text-muted-foreground">Customize colors and theme</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {["#5D9CEC", "#A8D5BA", "#D97706", "#E57373"].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateField("themeColor", color)}
                      className={`w-10 h-10 rounded-xl border-2 hover:border-foreground transition-colors ${formData.themeColor === color ? 'border-foreground shadow-md' : 'border-border'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </section>

              {/* Roles */}
              <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Roles & Permissions</h3>
                    <p className="text-sm text-muted-foreground">Manage access levels</p>
                  </div>
                </div>
                {["Admin", "Pastor", "Department Leader", "Member"].map((role) => (
                  <div key={role} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-foreground">{role}</span>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      Configure
                    </Button>
                  </div>
                ))}
              </section>

              {/* Notifications */}
              <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">Notifications</h3>
                    <p className="text-sm text-muted-foreground">Configure notification preferences</p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email notifications</p>
                    <p className="text-xs text-muted-foreground">Receive email for important updates</p>
                  </div>
                  <Switch checked={formData.emailNotifications} onCheckedChange={(val) => updateField("emailNotifications", val)} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Meeting reminders</p>
                    <p className="text-xs text-muted-foreground">Get reminded before scheduled meetings</p>
                  </div>
                  <Switch checked={formData.meetingReminders} onCheckedChange={(val) => updateField("meetingReminders", val)} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">New member alerts</p>
                    <p className="text-xs text-muted-foreground">Be notified when new members join</p>
                  </div>
                  <Switch checked={formData.newMemberAlerts} onCheckedChange={(val) => updateField("newMemberAlerts", val)} />
                </div>
              </section>

              <div className="flex justify-end pb-8">
                <Button size="lg" className="rounded-xl" onClick={handleSave} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SettingsPage;
