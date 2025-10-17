import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Teachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUserRole();
    fetchTeachers();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setUserRole(data.role);
      }
    }
  };

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from("teachers")
      .select(`
        *,
        schools (name),
        teacher_subjects (
          subjects (name, code)
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTeachers(data);
    }
    setLoading(false);
  };

  const handleApproval = async (teacherId: string, approve: boolean) => {
    const { error } = await supabase
      .from("teachers")
      .update({ is_approved: approve })
      .eq("id", teacherId);

    if (error) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: approve ? "Professeur approuvé" : "Professeur rejeté",
        description: `Le professeur a été ${approve ? "approuvé" : "rejeté"} avec succès`,
      });
      fetchTeachers();
    }
  };

  const statusLabels: Record<string, string> = {
    permanent: "Permanent",
    contract: "Contractuel",
    substitute: "Vacataire",
  };

  const genderLabels: Record<string, string> = {
    male: "Homme",
    female: "Femme",
    other: "Autre",
  };

  const pendingTeachers = teachers.filter(t => !t.is_approved);
  const approvedTeachers = teachers.filter(t => t.is_approved);

  const TeacherCard = ({ teacher }: { teacher: any }) => (
    <Card key={teacher.id} className="hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {teacher.first_name} {teacher.last_name}
            </CardTitle>
            <CardDescription>{teacher.schools?.name}</CardDescription>
          </div>
          <Badge variant={teacher.is_approved ? "default" : "secondary"}>
            {teacher.is_approved ? "Approuvé" : "En attente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Matricule:</span>
            <p className="font-medium">{teacher.matricule}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Statut:</span>
            <p className="font-medium">{statusLabels[teacher.status]}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Sexe:</span>
            <p className="font-medium">{genderLabels[teacher.gender]}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Téléphone:</span>
            <p className="font-medium">{teacher.phone}</p>
          </div>
        </div>

        {teacher.email && (
          <div className="text-sm">
            <span className="text-muted-foreground">Email:</span>
            <p className="font-medium">{teacher.email}</p>
          </div>
        )}

        {teacher.teacher_subjects && teacher.teacher_subjects.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">Matières:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {teacher.teacher_subjects.map((ts: any, idx: number) => (
                <Badge key={idx} variant="outline">
                  {ts.subjects?.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!teacher.is_approved && (userRole === "super_admin" || userRole === "school_admin") && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 gap-2"
              onClick={() => handleApproval(teacher.id, true)}
            >
              <UserCheck className="h-4 w-4" />
              Approuver
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 gap-2"
              onClick={() => handleApproval(teacher.id, false)}
            >
              <UserX className="h-4 w-4" />
              Rejeter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Gestion des Professeurs
        </h1>
        <p className="text-muted-foreground mt-2">
          Gérez les inscriptions et profils des professeurs
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">
              En attente ({pendingTeachers.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approuvés ({approvedTeachers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingTeachers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune inscription en attente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingTeachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {approvedTeachers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun professeur approuvé</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedTeachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
