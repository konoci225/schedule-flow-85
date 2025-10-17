import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { School, Users, Calendar, LogOut, Plus, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [schools, setSchools] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/auth");
        return;
      }

      setUser(authUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      setProfile(profileData);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id)
        .single();

      if (roleData) {
        setUserRole(roleData.role);
        
        if (roleData.role === "super_admin") {
          const { data: schoolsData } = await supabase
            .from("schools")
            .select("*")
            .order("created_at", { ascending: false });
          
          setSchools(schoolsData || []);
        }
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Déconnexion",
      description: "À bientôt !",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <School className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">EduSchedule</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {userRole?.replace("_", " ")}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Bienvenue, {profile?.first_name} !
            </h1>
            <p className="text-muted-foreground">
              Gérez votre plateforme depuis ce tableau de bord
            </p>
          </div>

          {/* Stats Cards */}
          {userRole === "super_admin" && (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/schools")}>
                  <div className="flex items-center justify-between">
                    <School className="h-8 w-8 text-primary" />
                    <span className="text-3xl font-bold">{schools.length}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Établissements</p>
                </Card>

                <Card className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/admins")}>
                  <div className="flex items-center justify-between">
                    <Shield className="h-8 w-8 text-accent" />
                    <span className="text-3xl font-bold">Admins</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Administrateurs</p>
                </Card>

                <Card className="p-6 space-y-2 cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate("/teachers")}>
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-secondary" />
                    <span className="text-3xl font-bold">Professeurs</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Enseignants</p>
                </Card>
              </div>

              {/* Schools Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Établissements</h2>
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
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Créer un établissement
                    </Button>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schools.map((school) => (
                      <Card key={school.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{school.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {school.type.replace("_", " ")}
                            </p>
                          </div>
                          {school.is_active && (
                            <div className="h-2 w-2 rounded-full bg-success" />
                          )}
                        </div>
                        {school.address && (
                          <p className="text-sm text-muted-foreground">{school.address}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
