import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SchoolSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schoolId, setSchoolId] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    timezone: "UTC",
    week_start: 1,
    geofence_enabled: false,
    geofence_latitude: null as number | null,
    geofence_longitude: null as number | null,
    geofence_radius_m: 100,
    attendance_window_before_min: 15,
    attendance_window_after_min: 15,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
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
        .from("school_settings")
        .select("*")
        .eq("school_id", roleData.school_id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          timezone: data.timezone || "UTC",
          week_start: data.week_start || 1,
          geofence_enabled: data.geofence_enabled || false,
          geofence_latitude: data.geofence_latitude,
          geofence_longitude: data.geofence_longitude,
          geofence_radius_m: data.geofence_radius_m || 100,
          attendance_window_before_min: data.attendance_window_before_min || 15,
          attendance_window_after_min: data.attendance_window_after_min || 15,
        });
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement des paramètres");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schoolId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("school_settings")
        .upsert({
          school_id: schoolId,
          ...settings,
        });

      if (error) throw error;
      toast.success("Paramètres enregistrés avec succès");
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } finally {
      setSaving(false);
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
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Paramètres de l'établissement</h1>
              <p className="text-muted-foreground">Configurez les paramètres généraux de votre établissement</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Paramètres généraux</CardTitle>
                <CardDescription>Fuseau horaire et début de semaine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Africa/Douala">Afrique/Douala</SelectItem>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="America/New_York">Amérique/New York</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Début de semaine</Label>
                  <Select value={settings.week_start.toString()} onValueChange={(value) => setSettings({ ...settings, week_start: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Lundi</SelectItem>
                      <SelectItem value="7">Dimanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fenêtre de pointage</CardTitle>
                <CardDescription>Définir les délais avant et après les heures de cours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Minutes avant le cours</Label>
                  <Input
                    type="number"
                    value={settings.attendance_window_before_min}
                    onChange={(e) => setSettings({ ...settings, attendance_window_before_min: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minutes après le cours</Label>
                  <Input
                    type="number"
                    value={settings.attendance_window_after_min}
                    onChange={(e) => setSettings({ ...settings, attendance_window_after_min: parseInt(e.target.value) })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Géofencing</CardTitle>
                <CardDescription>Activer la vérification de la position géographique pour le pointage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.geofence_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, geofence_enabled: checked })}
                  />
                  <Label>Activer le géofencing</Label>
                </div>

                {settings.geofence_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Latitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={settings.geofence_latitude || ""}
                        onChange={(e) => setSettings({ ...settings, geofence_latitude: parseFloat(e.target.value) || null })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Longitude</Label>
                      <Input
                        type="number"
                        step="0.000001"
                        value={settings.geofence_longitude || ""}
                        onChange={(e) => setSettings({ ...settings, geofence_longitude: parseFloat(e.target.value) || null })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rayon (mètres)</Label>
                      <Input
                        type="number"
                        value={settings.geofence_radius_m}
                        onChange={(e) => setSettings({ ...settings, geofence_radius_m: parseInt(e.target.value) })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer les paramètres
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}