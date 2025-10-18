import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Calendar, BookOpen, Clock, CheckCircle, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TeacherData {
  teacher: any;
  subjects: any[];
  school: any;
}

export const TeacherDashboard = ({ profile }: { profile: any }) => {
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      // Load teacher data
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*, school:schools(*)")
        .eq("user_id", profile?.id)
        .single();

      if (!teacherData) return;

      // Load subjects
      const { data: subjectsData } = await supabase
        .from("teacher_subjects")
        .select("subject:subjects(*)")
        .eq("teacher_id", teacherData.id);

      setTeacherData({
        teacher: teacherData,
        subjects: subjectsData?.map((ts) => ts.subject) || [],
        school: teacherData.school,
      });
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!teacherData?.teacher) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Aucune donnée professeur trouvée. Veuillez contacter l'administration.
        </AlertDescription>
      </Alert>
    );
  }

  const { teacher, subjects, school } = teacherData;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Bienvenue, {profile?.first_name} !
        </h1>
        <p className="text-muted-foreground">
          {school?.name || "Établissement"}
        </p>
      </div>

      {/* Approval Status */}
      {!teacher.is_approved && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Votre compte est en attente de validation par l'administration.
            Vous recevrez une notification une fois votre compte approuvé.
          </AlertDescription>
        </Alert>
      )}

      {teacher.is_approved && (
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            Votre compte est validé. Vous pouvez accéder à toutes les fonctionnalités.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{subjects.length}</p>
            <p className="text-sm text-muted-foreground">Matières enseignées</p>
          </div>
        </Card>

        <Card className="p-6 space-y-2 opacity-50">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-accent" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Cours cette semaine</p>
            <p className="text-xs text-muted-foreground">À venir</p>
          </div>
        </Card>

        <Card className="p-6 space-y-2 opacity-50">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">0h</p>
            <p className="text-sm text-muted-foreground">Heures effectuées</p>
            <p className="text-xs text-muted-foreground">À venir</p>
          </div>
        </Card>
      </div>

      {/* Teacher Info */}
      <Card className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">Mes informations</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Matricule</p>
            <p className="font-medium">{teacher.matricule}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Statut</p>
            <p className="font-medium capitalize">{teacher.status}</p>
          </div>
          {teacher.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{teacher.email}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Téléphone</p>
            <p className="font-medium">{teacher.phone}</p>
          </div>
        </div>
      </Card>

      {/* Subjects */}
      {subjects.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Mes matières</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <p className="font-semibold">{subject.name}</p>
                </div>
                <p className="text-sm text-muted-foreground">{subject.code}</p>
                {subject.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Coming Soon Features */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">Fonctionnalités à venir</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Consultation de l'emploi du temps
          </li>
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Système de pointage
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Gestion des disponibilités
          </li>
        </ul>
      </Card>
    </div>
  );
};
