import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Shield, Mail, Phone, Building2, ArrowLeft, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admins() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    school_id: "",
  });

  useEffect(() => {
    fetchAdmins();
    fetchInvitations();
    fetchSchools();
  }, []);

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

  const fetchAdmins = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        *,
        profiles!inner (first_name, last_name, phone),
        schools (name, type)
      `)
      .eq("role", "school_admin")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAdmins(data);
    }
    setLoading(false);
  };

  const fetchInvitations = async () => {
    const { data, error } = await supabase
      .from("invitations")
      .select(`
        *,
        schools (name, type)
      `)
      .eq("role", "school_admin")
      .eq("accepted", false)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setInvitations(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      // Use Supabase's native invitation system via edge function
      const { data, error: inviteError } = await supabase.functions.invoke('invite-school-admin', {
        body: {
          email: formData.email,
          school_id: formData.school_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
        }
      });

      if (inviteError) {
        console.error('Invitation error:', inviteError);
        throw new Error("Erreur lors de l'envoi de l'invitation");
      }

      // Create invitation record for tracking
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);
      
      const { error: recordError } = await supabase
        .from("invitations")
        .insert({
          email: formData.email,
          school_id: formData.school_id,
          role: "school_admin",
          token: crypto.randomUUID(),
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        });

      if (recordError) {
        console.error('Record error:', recordError);
        // Don't fail if we can't create the record, the invitation was sent
      }

      toast({
        title: "Invitation envoyée",
        description: `Une invitation a été envoyée à ${formData.email}. L'administrateur recevra un email pour créer son compte.`,
      });

      setDialogOpen(false);
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        school_id: "",
      });
      fetchAdmins();
      fetchInvitations();
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
                <Select value={formData.school_id} onValueChange={(value) => setFormData({ ...formData, school_id: value })}>
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
                        {admin.profiles?.first_name} {admin.profiles?.last_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {admin.schools?.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Badge variant="default">Actif</Badge>
                      <Badge variant="outline">{typeLabels[admin.schools?.type]}</Badge>
                      
                      {admin.profiles?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{admin.profiles.phone}</span>
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
