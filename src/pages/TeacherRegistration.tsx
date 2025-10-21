// src/pages/TeacherRegistration.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function TeacherRegistration() {
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    gender: "male" | "female" | "other" | "";
    school_id: string;
    phone: string;
    matricule: string;
    status: "permanent" | "contract" | "substitute" | "";
    email: string;
    password: string;
    confirm_password: string;
    birth_date: string;
    birth_place: string;
    address: string;
    diploma: string;
    qualifications: string;
  }>({
    first_name: "",
    last_name: "",
    gender: "",
    school_id: "",
    phone: "",
    matricule: "",
    status: "",
    email: "",
    password: "",
    confirm_password: "",
    birth_date: "",
    birth_place: "",
    address: "",
    diploma: "",
    qualifications: "",
  });

  useEffect(() => { fetchSchools(); }, []);
  useEffect(() => { if (formData.school_id) fetchSubjects(formData.school_id); }, [formData.school_id]);

  const fetchSchools = async () => {
    const { data, error } = await supabase
      .from("schools")
      .select("id,name,is_active")
      .eq("is_active", true)
      .order("name");
    if (error) {
      toast({ variant: "destructive", title: "Erreur écoles", description: error.message });
      setSchools([]);
      return;
    }
    setSchools(data ?? []);
    if ((data ?? []).length === 0) {
      toast({
        title: "Aucune école disponible",
        description: "Vérifiez les droits RLS: la lecture publique des écoles actives doit être autorisée.",
      });
    }
  };

  const fetchSubjects = async (schoolId: string) => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id,code,name,school_id")
      .eq("school_id", schoolId)
      .order("name");
    if (error) {
      toast({ variant: "destructive", title: "Erreur matières", description: error.message });
      setSubjects([]);
      return;
    }
    setSubjects(data ?? []);
    if ((data ?? []).length === 0) {
      toast({
        title: "Aucune matière configurée",
        description: "Aucune matière trouvée pour cet établissement (ou accès RLS non autorisé).",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.gender ||
        !formData.school_id || !formData.phone || !formData.matricule || !formData.status) {
      toast({ title: "Erreur", description: "Champs obligatoires manquants.", variant: "destructive" });
      return;
    }
    if (!formData.email) {
      toast({ title: "Email requis", description: "L’email professionnel est obligatoire.", variant: "destructive" });
      return;
    }
    if (!formData.password || formData.password !== formData.confirm_password) {
      toast({ title: "Mot de passe", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (selectedSubjects.length === 0) {
      toast({ title: "Erreur", description: "Sélectionnez au moins une matière.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1) Création du compte auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error("Création du compte échouée.");

      // 2) Profil
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        gender: formData.gender as any,
        school_id: formData.school_id,
        birth_date: formData.birth_date || null,
        birth_place: formData.birth_place || null,
        address: formData.address || null,
        matricule: formData.matricule || null,
      });
      if (profileError) throw profileError;

      // 3) Rôle
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "teacher",
        school_id: formData.school_id,
      });
      if (roleError) throw roleError;

      // 4) Teacher
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          gender: formData.gender as any,
          school_id: formData.school_id,
          phone: formData.phone,
          matricule: formData.matricule,
          status: formData.status as any,
          email: formData.email,
          birth_date: formData.birth_date || null,
          birth_place: formData.birth_place || null,
          address: formData.address || null,
          diploma: formData.diploma || null,
          qualifications: formData.qualifications || null,
          user_id: user.id,
          is_approved: false
        }])
        .select()
        .single();
      if (teacherError) throw teacherError;

      // 5) Matières
      const inserts = selectedSubjects.map((subjectId) => ({
        teacher_id: teacher.id,
        subject_id: subjectId,
      }));
      const { error: subjectsError } = await supabase.from("teacher_subjects").insert(inserts);
      if (subjectsError) throw subjectsError;

      toast({
        title: "Inscription soumise",
        description: "Votre compte a été créé. Confirmez l’email si requis et attendez la validation.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Inscription Professeur
          </CardTitle>
          <CardDescription>
            Remplissez le formulaire pour soumettre votre candidature. Votre inscription sera validée par l'administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identité */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input id="first_name" value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input id="last_name" value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Sexe *</Label>
                <Select value={formData.gender}
                  onValueChange={(value: "male" | "female" | "other") => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="school_id">Établissement *</Label>
                <Select
                  value={formData.school_id}
                  onValueChange={(value) => setFormData({ ...formData, school_id: value })}
                >
                  <SelectTrigger disabled={schools.length === 0}>
                    <SelectValue placeholder={schools.length ? "Sélectionner..." : "Aucune école disponible"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((s) => (
                      // ✅ forcer des strings pour éviter un mismatch valeur/Type
                      <SelectItem key={String(s.id)} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Matières */}
            {formData.school_id && (
              <div className="space-y-2">
                <Label>Discipline / Matières enseignées *</Label>
                {subjects.length > 0 ? (
                  <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                    {subjects.map((subject) => (
                      <div key={String(subject.id)} className="flex items-center space-x-2">
                        <Checkbox
                          id={String(subject.id)}
                          checked={selectedSubjects.includes(String(subject.id))}
                          onCheckedChange={(checked) => {
                            const sid = String(subject.id);
                            if (checked) setSelectedSubjects([...selectedSubjects, sid]);
                            else setSelectedSubjects(selectedSubjects.filter((id) => id !== sid));
                          }}
                        />
                        <label htmlFor={String(subject.id)} className="text-sm cursor-pointer">
                          {subject.name} ({subject.code})
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 text-center text-muted-foreground text-sm">
                    Aucune matière n'est encore configurée pour cet établissement.
                    <br />Veuillez contacter l'administration de l'établissement.
                  </div>
                )}
              </div>
            )}

            {/* Coordonnées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule *</Label>
                <Input id="matricule" value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input id="phone" type="tel" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
            </div>

            {/* Statut + Email + Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select value={formData.status}
                  onValueChange={(value: "permanent" | "contract" | "substitute") => setFormData({ ...formData, status: value })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contractuel</SelectItem>
                    <SelectItem value="substitute">Vacataire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel *</Label>
                <Input id="email" type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input id="password" type="password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmer le mot de passe *</Label>
                <Input id="confirm_password" type="password" value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })} required />
              </div>
            </div>

            {/* Infos complémentaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input id="birth_date" type="date" value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_place">Lieu de naissance</Label>
                <Input id="birth_place" value={formData.birth_place}
                  onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète</Label>
              <Textarea id="address" value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diploma">Diplômes</Label>
              <Input id="diploma" value={formData.diploma}
                onChange={(e) => setFormData({ ...formData, diploma: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Textarea id="qualifications" value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Envoi en cours..." : "Soumettre l'inscription"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/auth")}>
                Retour
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
