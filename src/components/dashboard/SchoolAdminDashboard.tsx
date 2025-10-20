import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, BookOpen, DoorOpen, Calendar, Plus, UserCheck, ClipboardList } from "lucide-react";

interface SchoolStats {
  totalTeachers: number;
  pendingTeachers: number;
  totalSubjects: number;
  totalClasses: number;
  totalRooms: number;
}

export const SchoolAdminDashboard = ({ profile, userRole }: { profile: any; userRole: any }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SchoolStats>({
    totalTeachers: 0,
    pendingTeachers: 0,
    totalSubjects: 0,
    totalClasses: 0,
    totalRooms: 0,
  });
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get school_id from user_roles
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("school_id")
        .eq("user_id", profile?.id)
        .single();

      if (!roleData?.school_id) return;

      // Load school data
      const { data: schoolData } = await supabase
        .from("schools")
        .select("*")
        .eq("id", roleData.school_id)
        .single();

      setSchool(schoolData);

      // Load teachers
      const { data: teachersData } = await supabase
        .from("teachers")
        .select("id, is_approved")
        .eq("school_id", roleData.school_id);

      // Load subjects
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id")
        .eq("school_id", roleData.school_id);

      // Load classes
      const { data: classesData } = await supabase
        .from("classes")
        .select("id")
        .eq("school_id", roleData.school_id);

      // Load rooms
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("id")
        .eq("school_id", roleData.school_id);

      const pendingTeachers = teachersData?.filter((t) => !t.is_approved).length || 0;

      setStats({
        totalTeachers: teachersData?.length || 0,
        pendingTeachers,
        totalSubjects: subjectsData?.length || 0,
        totalClasses: classesData?.length || 0,
        totalRooms: roomsData?.length || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
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

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold mb-2">
          Bienvenue, {profile?.first_name} !
        </h1>
        <p className="text-muted-foreground">
          Gérez votre établissement : {school?.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/teachers")}
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.totalTeachers}</p>
            <p className="text-sm text-muted-foreground">Professeurs</p>
            {stats.pendingTeachers > 0 && (
              <p className="text-xs text-warning">
                {stats.pendingTeachers} en attente
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-accent" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.totalSubjects}</p>
            <p className="text-sm text-muted-foreground">Matières</p>
          </div>
        </Card>

        <Card
          className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/classes")}
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-secondary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.totalClasses}</p>
            <p className="text-sm text-muted-foreground">Classes</p>
          </div>
        </Card>

        <Card
          className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/rooms")}
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center">
              <DoorOpen className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.totalRooms}</p>
            <p className="text-sm text-muted-foreground">Salles</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button
          className="h-auto p-6 flex-col items-start gap-2"
          variant="outline"
          onClick={() => navigate("/teachers")}
        >
          <Users className="h-6 w-6" />
          <div className="text-left">
            <p className="font-semibold">Gérer les professeurs</p>
            <p className="text-xs text-muted-foreground">
              Valider et gérer les enseignants
            </p>
          </div>
        </Button>

        <Button
          className="h-auto p-6 flex-col items-start gap-2"
          variant="outline"
          disabled
        >
          <Calendar className="h-6 w-6" />
          <div className="text-left">
            <p className="font-semibold">Créer emploi du temps</p>
            <p className="text-xs text-muted-foreground">
              Disponible en Phase 3
            </p>
          </div>
        </Button>

        <Button
          className="h-auto p-6 flex-col items-start gap-2"
          variant="outline"
          disabled
        >
          <BookOpen className="h-6 w-6" />
          <div className="text-left">
            <p className="font-semibold">Gérer les matières</p>
            <p className="text-xs text-muted-foreground">
              Disponible en Phase 2
            </p>
          </div>
        </Button>
      </div>

      {/* School Info */}
      {school && (
        <Card className="p-6 space-y-4">
          <h2 className="text-2xl font-bold">Informations de l'établissement</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{school.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{school.type.replace("_", " ")}</p>
            </div>
            {school.address && (
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">{school.address}</p>
              </div>
            )}
            {school.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{school.email}</p>
              </div>
            )}
            {school.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{school.phone}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
