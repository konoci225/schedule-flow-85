import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Loader2, Edit, Trash2 } from "lucide-react";

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string | null;
  is_active: boolean;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function TimeSlots() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: "",
    end_time: "",
    label: "",
    is_active: true,
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
        .from("time_slots")
        .select("*")
        .eq("school_id", roleData.school_id)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      setSlots(data || []);
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
      if (editingSlot) {
        const { error } = await supabase
          .from("time_slots")
          .update(formData)
          .eq("id", editingSlot.id);

        if (error) throw error;
        toast.success("Créneau modifié");
      } else {
        const { error } = await supabase
          .from("time_slots")
          .insert([{ ...formData, school_id: schoolId }]);

        if (error) throw error;
        toast.success("Créneau créé");
      }

      setDialogOpen(false);
      setEditingSlot(null);
      setFormData({ day_of_week: 1, start_time: "", end_time: "", label: "", is_active: true });
      fetchData();
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce créneau ?")) return;

    try {
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Créneau supprimé");
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
                <h1 className="text-3xl font-bold">Créneaux horaires</h1>
                <p className="text-muted-foreground">Définissez les créneaux horaires officiels</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingSlot(null); setFormData({ day_of_week: 1, start_time: "", end_time: "", label: "", is_active: true }); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau créneau
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSlot ? "Modifier" : "Nouveau"} créneau</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Jour</Label>
                      <Select
                        value={formData.day_of_week.toString()}
                        onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day, index) => (
                            <SelectItem key={index + 1} value={(index + 1).toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Heure de début</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Heure de fin</Label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Label (optionnel)</Label>
                      <Input
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        placeholder="Ex: Période 1"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>Actif</Label>
                    </div>
                    <Button type="submit" className="w-full">
                      {editingSlot ? "Modifier" : "Créer"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Liste des créneaux</CardTitle>
                <CardDescription>Créneaux horaires par jour</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jour</TableHead>
                      <TableHead>Heure</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">{DAYS[slot.day_of_week - 1]}</TableCell>
                        <TableCell>{slot.start_time} - {slot.end_time}</TableCell>
                        <TableCell>{slot.label || "-"}</TableCell>
                        <TableCell>
                          {slot.is_active ? (
                            <Badge>Actif</Badge>
                          ) : (
                            <Badge variant="outline">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingSlot(slot);
                              setFormData({
                                day_of_week: slot.day_of_week,
                                start_time: slot.start_time,
                                end_time: slot.end_time,
                                label: slot.label || "",
                                is_active: slot.is_active,
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(slot.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}