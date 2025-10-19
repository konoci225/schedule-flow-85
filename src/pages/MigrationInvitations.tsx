import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Database, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface DiagnosticResult {
  email: string;
  invitation_id: string;
  accepted: boolean;
  has_user_role: boolean;
  user_id: string | null;
  should_update: boolean;
}

export default function MigrationInvitations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [result, setResult] = useState<{ updated: number; errors: string[] } | null>(null);
  const { toast } = useToast();

  const runDiagnostic = async () => {
    setDiagnosing(true);
    setDiagnosticResults([]);

    try {
      // Récupérer toutes les invitations
      const { data: invitations, error: fetchError } = await supabase
        .from("invitations")
        .select("id, email, accepted, role, school_id")
        .eq("role", "school_admin");

      if (fetchError) throw fetchError;

      const results: DiagnosticResult[] = [];

      for (const invitation of invitations || []) {
        // Vérifier si un user_role existe
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", invitation.role)
          .eq("school_id", invitation.school_id);

        const hasUserRole = userRoles && userRoles.length > 0;
        const userId = hasUserRole ? userRoles[0].user_id : null;
        const shouldUpdate = !invitation.accepted && hasUserRole;

        results.push({
          email: invitation.email,
          invitation_id: invitation.id,
          accepted: invitation.accepted,
          has_user_role: hasUserRole,
          user_id: userId,
          should_update: shouldUpdate,
        });
      }

      setDiagnosticResults(results);

      toast({
        title: "Diagnostic terminé",
        description: `${results.length} invitation(s) analysée(s)`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setDiagnosing(false);
    }
  };

  const executeMigration = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Récupérer toutes les invitations non acceptées
      const { data: invitations, error: fetchError } = await supabase
        .from("invitations")
        .select("id, email, role, school_id")
        .eq("accepted", false)
        .eq("role", "school_admin");

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

      // Pour chaque invitation, vérifier si l'utilisateur existe
      for (const invitation of invitations) {
        try {
          // Chercher si un user_role existe pour cette école et ce rôle
          const { data: userRoles, error: roleError } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", invitation.role)
            .eq("school_id", invitation.school_id);

          if (roleError) {
            errors.push(`Erreur pour ${invitation.email}: ${roleError.message}`);
            continue;
          }

          // Si un user_role existe, l'admin a créé son compte
          if (userRoles && userRoles.length > 0) {
            // Mettre à jour l'invitation
            const { error: updateError } = await supabase
              .from("invitations")
              .update({ accepted: true })
              .eq("id", invitation.id);

            if (updateError) {
              errors.push(`Erreur mise à jour ${invitation.email}: ${updateError.message}`);
            } else {
              updated++;
              console.log(`✅ Invitation mise à jour pour ${invitation.email}`);
            }
          } else {
            console.log(`⏳ ${invitation.email} n'a pas encore créé son compte`);
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
      } else {
        toast({
          title: "Aucune mise à jour",
          description: "Les admins n'ont pas encore créé leurs comptes",
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

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Migration des invitations (avec diagnostic)
          </CardTitle>
          <CardDescription>
            Cette page permet de nettoyer les invitations et de diagnostiquer les problèmes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <p className="text-sm text-warning-foreground">
              <strong>Étape 1 :</strong> Lancez d'abord le diagnostic pour voir l'état actuel
            </p>
          </div>

          {/* Bouton de diagnostic */}
          <Button
            onClick={runDiagnostic}
            disabled={diagnosing}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {diagnosing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Diagnostic en cours...
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                1. Lancer le diagnostic
              </>
            )}
          </Button>

          {/* Résultats du diagnostic */}
          {diagnosticResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Résultats du diagnostic :</h3>
              <div className="space-y-2">
                {diagnosticResults.map((result) => (
                  <Card key={result.invitation_id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{result.email}</span>
                        {result.should_update ? (
                          <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded">
                            À METTRE À JOUR
                          </span>
                        ) : result.accepted ? (
                          <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                            ✓ DÉJÀ ACCEPTÉ
                          </span>
                        ) : (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            EN ATTENTE
                          </span>
                        )}
                      </div>
                      <div className="text-xs space-y-1 text-muted-foreground">
                        <div>• Accepted dans BDD: {result.accepted ? "✓ Oui" : "✗ Non"}</div>
                        <div>• Compte créé (user_role existe): {result.has_user_role ? "✓ Oui" : "✗ Non"}</div>
                        {result.user_id && <div>• User ID: {result.user_id}</div>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Bouton de migration */}
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm">
                <strong>Étape 2 :</strong> Une fois le diagnostic vérifié, lancez la migration
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
                  2. Lancer la migration
                </>
              )}
            </Button>
          </div>

          {/* Résultats de la migration */}
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
