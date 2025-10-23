import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, CheckCircle, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TeacherAttendance() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { toast } = useToast();

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
        loadAttendances(teacher.id);
      }
    } catch (error) {
      console.error("Error loading teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendances = async (teacherId: string) => {
    const { data, error } = await supabase
      .from("attendances")
      .select("*")
      .eq("teacher_id", teacherId)
      .order("occurred_at", { ascending: false })
      .limit(20);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les pointages",
        variant: "destructive",
      });
      return;
    }

    setAttendances(data || []);
  };

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La géolocalisation n'est pas supportée par votre navigateur"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleMarkAttendance = async (status: "present" | "late" | "absent") => {
    setMarking(true);

    try {
      let locationData: { latitude: number; longitude: number; accuracy: number } | null = null;

      // Try to get location
      try {
        locationData = await getCurrentLocation();
        setLocation({ latitude: locationData.latitude, longitude: locationData.longitude });
        toast({
          title: "Position obtenue",
          description: `Latitude: ${locationData.latitude.toFixed(6)}, Longitude: ${locationData.longitude.toFixed(6)}`,
        });
      } catch (locationError: any) {
        toast({
          title: "Avertissement",
          description: "Impossible d'obtenir votre position. Le pointage sera enregistré sans géolocalisation.",
          variant: "destructive",
        });
      }

      const { error } = await supabase
        .from("attendances")
        .insert([{
          teacher_id: teacherId,
          status: status,
          occurred_at: new Date().toISOString(),
          latitude: locationData?.latitude || null,
          longitude: locationData?.longitude || null,
          accuracy_m: locationData?.accuracy || null,
          method: "manual",
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
        title: "Pointage enregistré",
        description: `Statut: ${status === "present" ? "Présent" : status === "late" ? "En retard" : "Absent"}`,
      });

      loadAttendances(teacherId);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pointage</h1>
        <p className="text-muted-foreground">
          Enregistrez votre présence avec géolocalisation
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Pointer maintenant
          </CardTitle>
          <CardDescription>
            Votre position sera automatiquement enregistrée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => handleMarkAttendance("present")}
              disabled={marking}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Présent
            </Button>
            <Button
              onClick={() => handleMarkAttendance("late")}
              disabled={marking}
              variant="secondary"
            >
              <Clock className="h-4 w-4 mr-2" />
              En retard
            </Button>
            <Button
              onClick={() => handleMarkAttendance("absent")}
              disabled={marking}
              variant="destructive"
            >
              Absent
            </Button>
          </div>

          {location && (
            <div className="mt-4 p-4 bg-muted rounded-lg flex items-start gap-2">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Position actuelle :</p>
                <p className="text-muted-foreground">
                  Latitude: {location.latitude.toFixed(6)}<br />
                  Longitude: {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique des pointages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun pointage enregistré
            </p>
          ) : (
            <div className="space-y-3">
              {attendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {new Date(attendance.occurred_at).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(attendance.occurred_at).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {attendance.latitude && attendance.longitude && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {attendance.latitude.toFixed(6)}, {attendance.longitude.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        attendance.status === "present" ? "default" :
                        attendance.status === "late" ? "secondary" :
                        "destructive"
                      }
                    >
                      {attendance.status === "present" ? "Présent" :
                       attendance.status === "late" ? "En retard" :
                       "Absent"}
                    </Badge>
                    {attendance.method === "geolocation" && (
                      <Badge variant="outline">
                        <MapPin className="h-3 w-3 mr-1" />
                        GPS
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}