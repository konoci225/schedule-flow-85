import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { School, LogOut } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { SuperAdminDashboard } from "@/components/dashboard/SuperAdminDashboard";
import { SchoolAdminDashboard } from "@/components/dashboard/SchoolAdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<any>(null);

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
        .select("role, school_id")
        .eq("user_id", authUser.id)
        .single();

      if (roleData) {
        setUserRole(roleData);
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar userRole={userRole?.role} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <School className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold">EduSchedule</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userRole?.role?.replace("_", " ")}
                  </p>
                </div>
                <Button variant="outline" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              {userRole?.role === "super_admin" && (
                <SuperAdminDashboard profile={profile} />
              )}
              
              {userRole?.role === "school_admin" && (
                <SchoolAdminDashboard profile={profile} userRole={userRole} />
              )}
              
              {userRole?.role === "teacher" && (
                <TeacherDashboard profile={profile} />
              )}

              {!userRole && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Aucun rôle assigné. Veuillez contacter l'administrateur.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
