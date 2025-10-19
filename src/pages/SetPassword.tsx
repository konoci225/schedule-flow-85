import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Lock, School, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated from the invite link
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Le lien d'invitation est invalide ou a expiré. Veuillez contacter l'administrateur.",
          });
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        if (!session) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Le lien d'invitation est invalide ou a expiré. Veuillez contacter l'administrateur.",
          });
          setTimeout(() => navigate("/auth"), 3000);
          return;
        }

        // Sauvegarder l'email de l'utilisateur pour la mise à jour de l'invitation
        setUserEmail(session.user.email || null);
        setVerifying(false);
      } catch (error) {
        console.error('Error checking session:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur est survenue. Veuillez réessayer.",
        });
        setTimeout(() => navigate("/auth"), 3000);
      }
    };

    checkSession();
  }, [navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
      });
      return;
    }

    setLoading(true);

    try {
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Marquer l'invitation comme acceptée
      if (userEmail) {
        const { error: invitationError } = await supabase
          .from("invitations")
          .update({ accepted: true })
          .eq("email", userEmail)
          .eq("role", "school_admin");

        if (invitationError) {
          console.error("Erreur lors de la mise à jour de l'invitation:", invitationError);
          // Ne pas bloquer le flux si cette mise à jour échoue
        }
      }

      toast({
        title: "Mot de passe défini",
        description: "Votre compte a été activé avec succès. Redirection vers votre tableau de bord...",
      });

      // Attendre un moment avant de rediriger
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de définir le mot de passe",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4">
        <Card className="p-8 w-full max-w-md">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Vérification de votre invitation...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary mx-auto flex items-center justify-center">
            <School className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Bienvenue sur EduSchedule</h1>
          <p className="text-muted-foreground">
            Définissez votre mot de passe pour activer votre compte
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Minimum 6 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configuration en cours...
                </>
              ) : (
                "Définir le mot de passe"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SetPassword;
