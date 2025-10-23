import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2 } from "lucide-react";

const DAYS_OF_WEEK = [
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
  { value: "0", label: "Dimanche" },
];

const PREFERENCES = [
  { value: "available", label: "Disponible" },
  { value: "preferred", label: "Préféré" },
  { value: "if_needed", label: "Si nécessaire" },
  { value: "unavailable", label: "Non disponible" },
];

export default function TeacherAvailability() {
  const [availabilities, setAvailabilities] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newAvailability, setNewAvailability] = useState<{
    day_of_week: string;
    start_time: string;
    end_time: string;
    preference: "available" | "preferred" | "if_needed" | "unavailable";
  }>({
    day_of_week: "",
    start_time: "",
    end_time: "",
    preference: "available",
  });

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacher } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (teacher) {
        setTeacherId(teacher.id);
        loadAvailabilities(teacher.id);
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailabilities = async (teacherId: string) => {
    const { data, error } = await supabase
      .from("teacher_availabilities")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les disponibilités",
        variant: "destructive",
      });
      return;
    }

    setAvailabilities(data || []);
  };

  const handleAdd = async () => {
    if (!newAvailability.day_of_week || !newAvailability.start_time || !newAvailability.end_time) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("teacher_availabilities")
      .insert([{
        teacher_id: teacherId,
        day_of_week: parseInt(newAvailability.day_of_week),
        start_time: newAvailability.start_time,
        end_time: newAvailability.end_time,
        preference: newAvailability.preference,
      }]);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Disponibilité ajoutée",
    });

    setNewAvailability({
      day_of_week: "",
      start_time: "",
      end_time: "",
      preference: "available",
    });

    loadAvailabilities(teacherId);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("teacher_availabilities")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "Disponibilité supprimée",
    });

    loadAvailabilities(teacherId);
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mes Disponibilités</h1>
        <p className="text-muted-foreground">
          Définissez vos horaires de disponibilité pour la génération des emplois du temps
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter une disponibilité
          </CardTitle>
          <CardDescription>
            Indiquez vos créneaux disponibles et vos préférences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Jour</Label>
              <Select
                value={newAvailability.day_of_week}
                onValueChange={(value) => setNewAvailability({ ...newAvailability, day_of_week: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Heure de début</Label>
              <input
                type="time"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newAvailability.start_time}
                onChange={(e) => setNewAvailability({ ...newAvailability, start_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Heure de fin</Label>
              <input
                type="time"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newAvailability.end_time}
                onChange={(e) => setNewAvailability({ ...newAvailability, end_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Préférence</Label>
              <Select
                value={newAvailability.preference}
                onValueChange={(value) => setNewAvailability({ ...newAvailability, preference: value as "available" | "preferred" | "if_needed" | "unavailable" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PREFERENCES.map((pref) => (
                    <SelectItem key={pref.value} value={pref.value}>
                      {pref.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAdd} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Disponibilités enregistrées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availabilities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune disponibilité enregistrée
            </p>
          ) : (
            <div className="space-y-2">
              {availabilities.map((avail) => (
                <div
                  key={avail.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {DAYS_OF_WEEK.find((d) => d.value === avail.day_of_week.toString())?.label}
                    </span>
                    <span className="text-muted-foreground">
                      {avail.start_time} - {avail.end_time}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      avail.preference === "preferred" ? "bg-green-100 text-green-700" :
                      avail.preference === "unavailable" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {PREFERENCES.find((p) => p.value === avail.preference)?.label}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(avail.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}