import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Loader2, Pencil, Trash2, Plus, ArrowLeft, Calendar } from "lucide-react";

interface Timetable {
  id: string;
  school_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  room_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  academic_year: string | null;
  notes: string | null;
  classes?: { name: string };
  subjects?: { name: string };
  teachers?: { first_name: string; last_name: string };
  rooms?: { name: string };
}

interface Class {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

interface Room {
  id: string;
  name: string;
  code: string;
}

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 7, label: "Dimanche" },
];

const Timetables = () => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [formData, setFormData] = useState({
    class_id: "",
    subject_id: "",
    teacher_id: "",
    room_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    academic_year: "",
    notes: "",
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (schoolId) {
      loadData();
    }
  }, [schoolId]);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role, school_id")
        .eq("user_id", user.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
        setSchoolId(roleData.school_id);
      }
    } catch (error) {
      console.error("Error loading user role:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [timetablesRes, classesRes, subjectsRes, teachersRes, roomsRes] = await Promise.all([
        supabase
          .from("timetables")
          .select(`
            *,
            classes(name),
            subjects(name),
            teachers(first_name, last_name),
            rooms(name)
          `)
          .eq("school_id", schoolId!)
          .order("day_of_week")
          .order("start_time"),
        supabase.from("classes").select("id, name, code").eq("school_id", schoolId!).order("name"),
        supabase.from("subjects").select("id, name, code").eq("school_id", schoolId!).order("name"),
        supabase.from("teachers").select("id, first_name, last_name").eq("school_id", schoolId!).eq("is_approved", true).order("last_name"),
        supabase.from("rooms").select("id, name, code").eq("school_id", schoolId!).order("name"),
      ]);

      if (timetablesRes.error) throw timetablesRes.error;
      if (classesRes.error) throw classesRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      if (teachersRes.error) throw teachersRes.error;
      if (roomsRes.error) throw roomsRes.error;

      setTimetables(timetablesRes.data || []);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setRooms(roomsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.class_id || !formData.subject_id || !formData.day_of_week || !formData.start_time || !formData.end_time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        school_id: schoolId!,
        class_id: formData.class_id,
        subject_id: formData.subject_id,
        teacher_id: formData.teacher_id || null,
        room_id: formData.room_id || null,
        day_of_week: parseInt(formData.day_of_week),
        start_time: formData.start_time,
        end_time: formData.end_time,
        academic_year: formData.academic_year || null,
        notes: formData.notes || null,
      };

      if (editingTimetable) {
        const { error } = await supabase
          .from("timetables")
          .update(payload)
          .eq("id", editingTimetable.id);

        if (error) throw error;
        toast({ title: "Succès", description: "Emploi du temps modifié avec succès" });
      } else {
        const { error } = await supabase.from("timetables").insert(payload);
        if (error) throw error;
        toast({ title: "Succès", description: "Emploi du temps créé avec succès" });
      }

      handleDialogClose();
      loadData();
    } catch (error: any) {
      console.error("Error saving timetable:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'emploi du temps",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (timetable: Timetable) => {
    setEditingTimetable(timetable);
    setFormData({
      class_id: timetable.class_id,
      subject_id: timetable.subject_id,
      teacher_id: timetable.teacher_id || "",
      room_id: timetable.room_id || "",
      day_of_week: timetable.day_of_week.toString(),
      start_time: timetable.start_time,
      end_time: timetable.end_time,
      academic_year: timetable.academic_year || "",
      notes: timetable.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet emploi du temps ?")) return;

    try {
      const { error } = await supabase.from("timetables").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Succès", description: "Emploi du temps supprimé avec succès" });
      loadData();
    } catch (error: any) {
      console.error("Error deleting timetable:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'emploi du temps",
        variant: "destructive",
      });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTimetable(null);
    setFormData({
      class_id: "",
      subject_id: "",
      teacher_id: "",
      room_id: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      academic_year: "",
      notes: "",
    });
  };

  const getDayLabel = (day: number) => {
    return DAYS.find((d) => d.value === day)?.label || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRole={userRole} />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">Gestion des Emplois du Temps</h1>
                  <p className="text-muted-foreground">Créer et gérer les emplois du temps</p>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleDialogClose()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Cours
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTimetable ? "Modifier le cours" : "Nouveau cours"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingTimetable
                        ? "Modifiez les informations du cours"
                        : "Créez un nouveau cours dans l'emploi du temps"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="class_id">Classe *</Label>
                        <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une classe" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name} ({cls.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subject_id">Matière *</Label>
                        <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une matière" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name} ({subject.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="teacher_id">Enseignant</Label>
                        <Select value={formData.teacher_id} onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un enseignant" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id}>
                                {teacher.first_name} {teacher.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="room_id">Salle</Label>
                        <Select value={formData.room_id} onValueChange={(value) => setFormData({ ...formData, room_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une salle" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name} ({room.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="day_of_week">Jour *</Label>
                        <Select value={formData.day_of_week} onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Jour" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map((day) => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="start_time">Début *</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_time">Fin *</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="academic_year">Année Scolaire</Label>
                      <Input
                        id="academic_year"
                        value={formData.academic_year}
                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                        placeholder="Ex: 2024-2025"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Notes additionnelles"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingTimetable ? "Modifier" : "Créer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Liste des Cours</CardTitle>
                <CardDescription>
                  {timetables.length} cours enregistré{timetables.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timetables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun cours enregistré. Créez votre premier cours.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jour</TableHead>
                        <TableHead>Horaire</TableHead>
                        <TableHead>Classe</TableHead>
                        <TableHead>Matière</TableHead>
                        <TableHead>Enseignant</TableHead>
                        <TableHead>Salle</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timetables.map((timetable) => (
                        <TableRow key={timetable.id}>
                          <TableCell className="font-medium">{getDayLabel(timetable.day_of_week)}</TableCell>
                          <TableCell>
                            {timetable.start_time} - {timetable.end_time}
                          </TableCell>
                          <TableCell>{timetable.classes?.name || "-"}</TableCell>
                          <TableCell>{timetable.subjects?.name || "-"}</TableCell>
                          <TableCell>
                            {timetable.teachers
                              ? `${timetable.teachers.first_name} ${timetable.teachers.last_name}`
                              : "-"}
                          </TableCell>
                          <TableCell>{timetable.rooms?.name || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(timetable)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(timetable.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Timetables;
