import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { School, Users, Shield, Plus, TrendingUp, Building2, UserCheck } from "lucide-react";

interface DashboardStats {
  totalSchools: number;
  activeSchools: number;
  totalAdmins: number;
  totalTeachers: number;
  pendingTeachers: number;
}

export const SuperAdminDashboard = ({ profile }: { profile: any }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    activeSchools: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    pendingTeachers: 0,
  });
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load schools
      const { data: schoolsData } = await supabase
        .from("schools")
        .select("*")
        .order("created_at", { ascending: false });

      setSchools(schoolsData || []);

      // Load stats
      const { data: adminsData } = await supabase
        .from("user_roles")
        .select("id")
        .eq("role", "school_admin");

      const { data: teachersData } = await supabase
        .from("teachers")
        .select("id, is_approved");

      const activeSchools = schoolsData?.filter((s) => s.is_active).length || 0;
      const pendingTeachers = teachersData?.filter((t) => !t.is_approved).length || 0;

      setStats({
        totalSchools: schoolsData?.length || 0,
        activeSchools,
        totalAdmins: adminsData?.length || 0,
        totalTeachers: teachersData?.length || 0,
        pendingTeachers,
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
          Gérez votre plateforme depuis ce tableau de bord Super Admin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/schools")}
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <School className="h-6 w-6 text-primary" />
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.totalSchools}</p>
            <p className="text-sm text-muted-foreground">Établissements</p>
            <p className="text-xs text-success">
              {stats.activeSchools} actifs
            </p>
          </div>
        </Card>

        <Card
          className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/admins")}
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-accent" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">{stats.totalAdmins}</p>
            <p className="text-sm text-muted-foreground">Admin Écoles</p>
          </div>
        </Card>

        <Card
          className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => navigate("/teachers")}
        >
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-secondary" />
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

        <Card className="p-6 space-y-2 bg-gradient-primary text-white">
          <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold">100%</p>
            <p className="text-sm opacity-90">Disponibilité</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button
          className="h-auto p-6 flex-col items-start gap-2"
          variant="outline"
          onClick={() => navigate("/schools")}
        >
          <School className="h-6 w-6" />
          <div className="text-left">
            <p className="font-semibold">Gérer les établissements</p>
            <p className="text-xs text-muted-foreground">
              Créer et configurer les écoles
            </p>
          </div>
        </Button>

        <Button
          className="h-auto p-6 flex-col items-start gap-2"
          variant="outline"
          onClick={() => navigate("/admins")}
        >
          <Shield className="h-6 w-6" />
          <div className="text-left">
            <p className="font-semibold">Gérer les admins</p>
            <p className="text-xs text-muted-foreground">
              Inviter et gérer les administrateurs
            </p>
          </div>
        </Button>

        <Button
          className="h-auto p-6 flex-col items-start gap-2"
          variant="outline"
          onClick={() => navigate("/teachers")}
        >
          <UserCheck className="h-6 w-6" />
          <div className="text-left">
            <p className="font-semibold">Valider les professeurs</p>
            <p className="text-xs text-muted-foreground">
              {stats.pendingTeachers} inscriptions en attente
            </p>
          </div>
        </Button>
      </div>

      {/* Schools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Établissements récents</h2>
          <Button className="gap-2" onClick={() => navigate("/schools")}>
            <Plus className="h-4 w-4" />
            Nouvel établissement
          </Button>
        </div>

        {schools.length === 0 ? (
          <Card className="p-12 text-center">
            <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Aucun établissement
            </h3>
            <p className="text-muted-foreground mb-6">
              Commencez par créer votre premier établissement
            </p>
            <Button className="gap-2" onClick={() => navigate("/schools")}>
              <Plus className="h-4 w-4" />
              Créer un établissement
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.slice(0, 6).map((school) => (
              <Card
                key={school.id}
                className="p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/schools")}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg">{school.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {school.type.replace("_", " ")}
                    </p>
                  </div>
                  <div
                    className={`h-2 w-2 rounded-full ${
                      school.is_active ? "bg-success" : "bg-muted"
                    }`}
                  />
                </div>
                {school.address && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {school.address}
                  </p>
                )}
                {school.email && (
                  <p className="text-xs text-muted-foreground">{school.email}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
