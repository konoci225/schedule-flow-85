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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Loader2, Edit, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface AcademicYear {
  id: string;
  code: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
}

export default function AcademicYears() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    starts_on: "",
    ends_on: "",
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
        .from("academic_years")
        .select("*")
        .eq("school_id", roleData.school_id)
        .order("starts_on", { ascending: false });

      if (error) throw error;
      setYears(data || []);
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
      if (editingYear) {
        const { error } = await supabase
          .from("academic_years")
          .update(formData)
          .eq("id", editingYear.id);

        if (error) throw error;
        toast.success("Année scolaire modifiée");
      } else {
        const { error } = await supabase
          .from("academic_years")
          .insert([{ ...formData, school_id: schoolId }]);

        if (error) throw error;
        toast.success("Année scolaire créée");
      }

      setDialogOpen(false);
      setEditingYear(null);
      setFormData({ code: "", starts_on: "", ends_on: "" });
      fetchData();
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await supabase
        .from("academic_years")
        .update({ is_active: false })
        .eq("school_id", schoolId);

      const { error } = await supabase
        .from("academic_years")
        .update({ is_active: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Année scolaire activée");
      fetchData();
    } catch (error: any) {
      toast.error("Erreur lors de l'activation");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette année scolaire ?")) return;

    try {
      const { error } = await supabase
        .from("academic_years")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Année scolaire supprimée");
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
                <h1 className="text-3xl font-bold">Années scolaires</h1>
                <p className="text-muted-foreground">Gérez les années scolaires de votre établissement</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingYear(null); setFormData({ code: "", starts_on: "", ends_on: "" }); }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle année
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingYear ? "Modifier" : "Nouvelle"} année scolaire</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Code (ex: 2025-2026)</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de début</Label>
                      <Input
                        type="date"
                        value={formData.starts_on}
                        onChange={(e) => setFormData({ ...formData, starts_on: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de fin</Label>
                      <Input
                        type="date"
                        value={formData.ends_on}
                        onChange={(e) => setFormData({ ...formData, ends_on: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingYear ? "Modifier" : "Créer"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Liste des années scolaires</CardTitle>
                <CardDescription>Activez l'année scolaire en cours</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Début</TableHead>
                      <TableHead>Fin</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {years.map((year) => (
                      <TableRow key={year.id}>
                        <TableCell className="font-medium">{year.code}</TableCell>
                        <TableCell>{format(new Date(year.starts_on), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{format(new Date(year.ends_on), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          {year.is_active ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {!year.is_active && (
                            <Button size="sm" variant="outline" onClick={() => handleSetActive(year.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingYear(year);
                              setFormData({
                                code: year.code,
                                starts_on: year.starts_on,
                                ends_on: year.ends_on,
                              });
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(year.id)}>
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