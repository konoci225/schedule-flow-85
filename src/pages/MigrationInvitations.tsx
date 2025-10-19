import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Database, Loader2, CheckCircle } from "lucide-react";

export default function MigrationInvitations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const executeMigration = async () => {
    setLoading(true);
    setResult(null);

    try {
      // 1. Récupérer toutes les invitations non acceptées
      const { data: invitations, error: fetchError } = await supabase
        .from("invitations")
        .select("id, email, role, school_id")
        .eq("accepted", false);

      if (fetchError) throw fetchError;

      if (!invitations || invitations.length === 0) {
        toast({
          title: "Aucune migration nécessaire",
          description: "Toutes les invitations sont déjà à jour",
        });
        setLoading(false);
        return;
      }

      let updated = 0;
      const errors: string[] = [];

      // 2. Pour chaque invitation, vérifier si l'utilisateur existe
      for (const invitation of invitations) {
        try {
          // Chercher si un user_role existe pour cet email
          const { data: userRoles, error: roleError } = await supabase
            .from("user_roles")
            .select("user_id, role, school_id")
            .eq("role", invitation.role)
            .eq("school_id", invitation.school_id);

          if (roleError) {
            errors.push(`Erreur pour ${invitation.email}: ${roleError.message}`);
            continue;
          }

          if (!userRoles || userRoles.length === 0) {
            // Pas de user_role trouvé, l'invitation est vraiment en attente
            continue;
          }

          // Vérifier l'email de chaque user_role
          for (const userRole of userRoles) {
            const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(
              userRole.user_id
            );

            if (userError) {
              // Si on n'a pas accès à auth.admin, on peut essayer une autre approche
              console.warn("Impossible d'accéder à auth.admin:", userError);
              
              // Alternative : chercher via profiles
              const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("id", userRole.user_id)
                .single();

              if (profile) {
                // Le profil existe, donc l'utilisateur a accepté
                const { error: updateError } = await supabase
                  .from("invitations")
                  .update({ accepted: true })
                  .eq("id", invitation.id);

                if (updateError) {
                  errors.push(`Erreur mise à jour ${invitation.email}: ${updateError.message}`);
                } else {
                  updated++;
                }
                break;
              }
              continue;
            }

            if (user && user.email === invitation.email) {
              // L'utilisateur existe avec cet email, marquer comme accepté
              const { error: updateError } = await supabase
                .from("invitations")
                .update({ accepted: true })
                .eq("id", invitation.id);

              if (updateError) {
                errors.push(`Erreur mise à jour ${invitation.email}: ${updateError.message}`);
              } else {
                updated++;
              }
              break;
            }
          }
        } catch (error: any) {
          errors.push(`Erreur pour ${invitation.email}: ${error.message}`);
        }
      }

      setResult({ updated, errors });

      if (updated > 0) {
        toast({
          title: "Migration réussie",
          description: `${updated} invitation(s) mise(s) à jour`,
        });
      }

      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Erreurs détectées",
          description: `${errors.length} erreur(s) rencontrée(s)`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Migration des invitations
          </CardTitle>
          <CardDescription>
            Cette page permet de nettoyer les anciennes invitations en marquant comme "acceptées" 
            celles dont les utilisateurs ont déjà créé leur compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <p className="text-sm text-warning-foreground">
              <strong>Attention :</strong> Cette opération doit être exécutée une seule fois. 
              Elle va parcourir toutes les invitations non acceptées et les mettre à jour.
            </p>
          </div>

          <Button
            onClick={executeMigration}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migration en cours...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Lancer la migration
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-4">
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <p className="font-semibold text-success">Migration terminée</p>
                </div>
                <p className="text-sm">
                  <strong>{result.updated}</strong> invitation(s) mise(s) à jour
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="font-semibold text-destructive mb-2">
                    Erreurs ({result.errors.length})
                  </p>
                  <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <li key={idx} className="text-destructive/80">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => navigate("/admins")}
                className="w-full"
              >
                Voir les administrateurs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
