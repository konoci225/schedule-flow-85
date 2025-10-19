import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Shield, Mail, Phone, Building2, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Admins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    school_id: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAdminsAndInvitations(),
      fetchSchools()
    ]);
    setLoading(false);
  };

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setSchools(data);
    }
  };

  const fetchAdminsAndInvitations = async () => {
    console.log("🔍 Starting fetchAdminsAndInvitations...");
    
    // 1. Récupérer TOUS les admins avec leurs profils et emails
    const { data: userRolesData, error: userRolesError } = await supabase
      .from("user_roles")
      .select("*, schools (name, type)")
      .eq("role", "school_admin")
      .order("created_at", { ascending: false });

    if (userRolesError) {
      console.error("Error fetching user_roles:", userRolesError);
      return;
    }

    // 2. Récupérer les profils et emails des admins
    const adminsWithProfiles = await Promise.all(
      (userRolesData || []).map(async (userRole) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, phone, email")
          .eq("id", userRole.user_id)
          .single();

        // Récupérer aussi l'email depuis auth.users si pas dans profiles
        const { data: authData } = await supabase
          .from("auth.users")
          .select("email")
          .eq("id", userRole.user_id)
          .single();

        return {
          ...userRole,
          profiles: profile,
          email: profile?.email || authData?.email || null
        };
      })
    );

    console.log("📊 Admins with profiles:", adminsWithProfiles);

    // 3. Créer une liste des emails des admins existants
    const existingAdminEmails = adminsWithProfiles
      .map(admin => admin.email)
      .filter(email => email !== null);

    console.log("📧 Existing admin emails:", existingAdminEmails);

    // 4. Récupérer TOUTES les invitations
    const { data: invitationsData, error: invitationsError } = await supabase
      .from("invitations")
      .select(`
        *,
        schools (name, type)
      `)
      .eq("role", "school_admin")
      .order("created_at", { ascending: false });

    if (invitationsError) {
      console.error("Error fetching invitations:", invitationsError);
      setInvitations([]);
    } else {
      // 5. FILTRER les invitations pour exclure celles déjà acceptées
      const pendingInvitations = (invitationsData || []).filter(invitation => {
        // Garder seulement si :
        // - accepted = false ET
        // - l'email n'existe pas dans les admins existants ET
        // - l'invitation n'est pas expirée
        const isExpired = new Date(invitation.expires_at) < new Date();
        const emailExistsInAdmins = existingAdminEmails.includes(invitation.email.toLowerCase());
        
        console.log(`📋 Invitation ${invitation.email}:`, {
          accepted: invitation.accepted,
          expired: isExpired,
          existsInAdmins: emailExistsInAdmins
        });

        return !invitation.accepted && !emailExistsInAdmins && !isExpired;
      });

      console.log("✅ Filtered pending invitations:", pendingInvitations);
      setInvitations(pendingInvitations);

      // 6. Nettoyer automatiquement les invitations obsolètes (optionnel)
      const obsoleteInvitations = invitationsData?.filter(inv => 
        existingAdminEmails.includes(inv.email.toLowerCase()) && !inv.accepted
      );
      
      if (obsoleteInvitations && obsoleteInvitations.length > 0) {
        console.log("🧹 Found obsolete invitations to clean:", obsoleteInvitations);
        // Marquer comme acceptées les invitations obsolètes
        for (const inv of obsoleteInvitations) {
          await supabase
            .from("invitations")
            .update({ accepted: true })
            .eq("id", inv.id);
        }
      }
    }

    // 7. Debug info
    let debug = `=== DEBUG ADMINS ===\n`;
    debug += `Total admins: ${adminsWithProfiles.length}\n`;
    debug += `Pending invitations: ${invitations.length}\n\n`;
    
    adminsWithProfiles.forEach((admin, index) => {
      debug += `Admin ${index + 1}:\n`;
      debug += `  - user_id: ${admin.user_id}\n`;
      debug += `  - email: ${admin.email || '[No email]'}\n`;
      debug += `  - school: ${admin.schools?.name}\n`;
      debug += `  - name: ${admin.profiles?.first_name || '[?]'} ${admin.profiles?.last_name || '[?]'}\n\n`;
    });
    
    setDebugInfo(debug);
    console.log(debug);

    setAdmins(adminsWithProfiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      // Vérifier si l'email n'est pas déjà utilisé
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.email.toLowerCase())
        .single();

      if (existingProfile) {
        throw new Error("Cet email est déjà utilisé par un autre compte");
      }

      // Vérifier si une invitation existe déjà
      const { data: existingInvitation } = await supabase
        .from("invitations")
        .select("id, accepted, expires_at")
        .eq("email", formData.email.toLowerCase())
        .eq("school_id", formData.school_id)
        .single();

      if (existingInvitation && !existingInvitation.accepted && new Date(existingInvitation.expires_at) > new Date()) {
        throw new Error("Une invitation est déjà en attente pour cet email et cette école");
      }

      // Envoyer l'invitation
      const { error: inviteError } = await supabase.functions.invoke('invite-school-admin', {
        body: {
          email: formData.email,
          school_id: formData.school_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          redirect_to: `${window.location.origin}/set-password`,
        }
      });

      if (inviteError) {
        console.error('Invitation error:', inviteError);
        throw new Error("Erreur lors de l'envoi de l'invitation");
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);
      
      // Si une ancienne invitation existe, la mettre à jour, sinon créer une nouvelle
      if (existingInvitation) {
        await supabase
          .from("invitations")
          .update({
            token: crypto.randomUUID(),
            expires_at: expiresAt.toISOString(),
            accepted: false,
            created_by: user.id,
          })
          .eq("id", existingInvitation.id);
      } else {
        await supabase
          .from("invitations")
          .insert({
            email: formData.email.toLowerCase(),
            school_id: formData.school_id,
            role: "school_admin",
            token: crypto.randomUUID(),
            expires_at: expiresAt.toISOString(),
            created_by: user.id,
          });
      }

      toast({
        title: "Invitation envoyée",
        description: `Une invitation a été envoyée à ${formData.email}.`,
      });

      setDialogOpen(false);
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        school_id: "",
      });
      
      // Recharger les données
      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const typeLabels: Record<string, string> = {
    primary: "Primaire",
    middle_school: "Collège",
    high_school: "Lycée",
    university: "Université",
    vocational: "Formation Prof.",
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>
      </div>
      
      {/* Zone de debug - à retirer en production */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Debug Info</AlertTitle>
          <AlertDescription>
            <pre className="text-xs mt-2 overflow-auto max-h-48 whitespace-pre-wrap">
              {debugInfo}
            </pre>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Administrateurs d'Établissement
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les administrateurs des établissements
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Inviter un Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Inviter un administrateur d'établissement</DialogTitle>
              <DialogDescription>
                L'administrateur recevra un email d'invitation pour créer son compte
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="school_id">Établissement *</Label>
                <Select 
                  value={formData.school_id} 
                  onValueChange={(value) => setFormData({ ...formData, school_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Envoyer l'invitation
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              En attente ({invitations.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <Shield className="h-4 w-4" />
              Approuvés ({admins.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {invitations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucune invitation en attente</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {invitations.map((invitation) => (
                  <Card key={invitation.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        {invitation.email}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {invitation.schools?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Badge variant="secondary">En attente d'acceptation</Badge>
                      <Badge variant="outline">{typeLabels[invitation.schools?.type]}</Badge>
                      
                      <div className="text-xs text-muted-foreground">
                        Invité le {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expire le {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {admins.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun administrateur approuvé</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {admins.map((admin) => (
                  <Card key={admin.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {admin.profiles?.first_name || "[Pas de prénom]"} {admin.profiles?.last_name || "[Pas de nom]"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {admin.schools?.name || "[École inconnue]"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Badge variant="default">Actif</Badge>
                      {admin.schools?.type && (
                        <Badge variant="outline">{typeLabels[admin.schools.type]}</Badge>
                      )}
                      
                      {admin.profiles?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{admin.profiles.phone}</span>
                        </div>
                      )}

                      {admin.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs">{admin.email}</span>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Créé le {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
