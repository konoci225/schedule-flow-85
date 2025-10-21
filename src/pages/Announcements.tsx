import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Loader2, Edit, Trash2, Send } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  published_at: string | null;
  created_at: string;
}

export default function Announcements() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    audience: "all",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("school_id, role")
        .eq("user_id", user.id)
        .eq("role", "school_admin")
        .single();

      if (!roleData?.school_id) {
        toast.error("Accès non autorisé");
        navigate("/dashboard");
        return;
      }

      setUserRole(roleData.role);
      setSchoolId(roleData.school_id);

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("school_id", roleData.school_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from("announcements")
          .update(formData)
          .eq("id", editingAnnouncement.id);

        if (error) throw error;
        toast.success("Annonce modifiée");
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert([{ 
            ...formData, 
            school_id: schoolId,
            created_by: userId,
          }]);

        if (error) throw error;
        toast.success("Annonce créée");
      }

      setDialogOpen(false);
      setEditingAnnouncement(null);
      setFormData({ title: "", body: "", audience: "all" });
      fetchData();
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ published_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Annonce publiée");
      fetchData();
    } catch (error: any) {
      toast.error("Erreur lors de la publication");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Annonce supprimée");
      fetchData();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar userRole={userRole} />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRole={userRole} />
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Annonces</h1>
                <p className="text-muted-foreground">Communiquez avec votre équipe</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingAnnouncement(null); setFormData({ title: "", body: "", audience: "all" }); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle annonce
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingAnnouncement ? "Modifier" : "Nouvelle"} annonce</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Titre</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        rows={4}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Audience</Label>
                      <Select
                        value={formData.audience}
                        onValueChange={(value) => setFormData({ ...formData, audience: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="teachers">Enseignants</SelectItem>
                          <SelectItem value="admins">Administrateurs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingAnnouncement ? "Modifier" : "Créer"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{announcement.title}</CardTitle>
                        <CardDescription>
                          {announcement.published_at ? (
                            <>Publié le {format(new Date(announcement.published_at), "dd/MM/yyyy 'à' HH:mm")}</>
                          ) : (
                            <>Créé le {format(new Date(announcement.created_at), "dd/MM/yyyy 'à' HH:mm")}</>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {announcement.published_at ? (
                          <Badge>Publié</Badge>
                        ) : (
                          <Badge variant="outline">Brouillon</Badge>
                        )}
                        <Badge variant="secondary">{announcement.audience === "all" ? "Tous" : announcement.audience === "teachers" ? "Enseignants" : "Admins"}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{announcement.body}</p>
                    <div className="flex justify-end space-x-2">
                      {!announcement.published_at && (
                        <Button size="sm" onClick={() => handlePublish(announcement.id)}>
                          <Send className="mr-2 h-4 w-4" />
                          Publier
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingAnnouncement(announcement);
                          setFormData({
                            title: announcement.title,
                            body: announcement.body,
                            audience: announcement.audience,
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(announcement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}