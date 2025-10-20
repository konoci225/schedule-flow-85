import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, BookOpen, Users, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    level: "",
    capacity: "",
    academic_year: "",
    description: "",
  });

  useEffect(() => {
    checkUserRole();
    fetchClasses();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roles) {
      setUserRole(roles.role);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("*, schools(name)")
      .order("name");

    if (!error && data) {
      setClasses(data);
    } else if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les classes",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("role", "school_admin")
        .single();

      if (!userRoles?.school_id) {
        throw new Error("École non trouvée");
      }

      const classData = {
        school_id: userRoles.school_id,
        name: formData.name,
        code: formData.code,
        level: formData.level || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        academic_year: formData.academic_year || null,
        description: formData.description || null,
      };

      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update(classData)
          .eq("id", editingClass.id);

        if (error) throw error;
        toast({ title: "Classe modifiée avec succès" });
      } else {
        const { error } = await supabase
          .from("classes")
          .insert(classData);

        if (error) throw error;
        toast({ title: "Classe créée avec succès" });
      }

      setDialogOpen(false);
      setEditingClass(null);
      setFormData({
        name: "",
        code: "",
        level: "",
        capacity: "",
        academic_year: "",
        description: "",
      });
      fetchClasses();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (classItem: any) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      code: classItem.code,
      level: classItem.level || "",
      capacity: classItem.capacity?.toString() || "",
      academic_year: classItem.academic_year || "",
      description: classItem.description || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette classe ?")) return;

    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la classe",
        variant: "destructive",
      });
    } else {
      toast({ title: "Classe supprimée avec succès" });
      fetchClasses();
    }
  };

  const canManage = userRole === "super_admin" || userRole === "school_admin";

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gestion des Classes
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les classes de votre établissement
          </p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingClass(null);
              setFormData({
                name: "",
                code: "",
                level: "",
                capacity: "",
                academic_year: "",
                description: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle Classe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingClass ? "Modifier la classe" : "Nouvelle classe"}
                </DialogTitle>
                <DialogDescription>
                  Remplissez les informations de la classe
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la classe *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Ex: 6ème A"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    placeholder="Ex: 6A"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Niveau</Label>
                    <Input
                      id="level"
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      placeholder="Ex: 6ème"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacité</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      placeholder="Ex: 40"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year">Année scolaire</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="Ex: 2024-2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description optionnelle"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingClass ? "Modifier" : "Créer"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune classe créée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {classItem.name}
                </CardTitle>
                <CardDescription>
                  Code: {classItem.code}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {classItem.level && (
                  <Badge variant="secondary">{classItem.level}</Badge>
                )}
                {classItem.capacity && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Capacité: {classItem.capacity}</span>
                  </div>
                )}
                {classItem.academic_year && (
                  <Badge variant="outline">{classItem.academic_year}</Badge>
                )}
                {classItem.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {classItem.description}
                  </p>
                )}
                {canManage && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(classItem)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(classItem.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
