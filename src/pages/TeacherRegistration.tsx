// src/pages/TeacherRegistration.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type Gender = "male" | "female" | "other" | "";
type Status = "permanent" | "contract" | "substitute" | "";

interface School {
  id: string;
  name: string;
}
interface Subject {
  id: string;
  code: string;
  name: string;
  school_id: string;
}

export default function TeacherRegistration() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    gender: Gender;
    school_id: string;
    phone: string;
    matricule: string;
    status: Status;
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

  // Base URL des Functions
  const FUNCTION_BASE = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "")}/functions/v1`;

  useEffect(() => { fetchSchools(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (formData.school_id) fetchSubjects(formData.school_id);
    else { setSubjects([]); setSelectedSubjects([]); }
    // eslint-disable-next-line
  }, [formData.school_id]);

  // ====== GET SANS HEADERS/BODY (pas de préflight) ======
  const fetchSchools = async () => {
    try {
      const res = await fetch(`${FUNCTION_BASE}/public-schools`, { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
      const json = await res.json();
      const list: School[] = (json?.schools ?? []).map((s: any) => ({ id: String(s.id), name: s.name }));
      setSchools(list);
      if (list.length === 0) toast({ title: "Aucune école disponible", description: "Aucune école active trouvée." });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Erreur écoles", description: err?.message || "Failed to fetch" });
      setSchools([]);
    }
  };

  const fetchSubjects = async (schoolId: string) => {
    try {
      const url = new URL(`${FUNCTION_BASE}/public-subjects`);
      url.searchParams.set("school_id", schoolId); // GET query param
      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${await res.text()}`);
      const json = await res.json();
      const list: Subject[] = (json?.subjects ?? []).map((s: any) => ({
        id: String(s.id), code: s.code, name: s.name, school_id: String(s.school_id),
      }));
      setSubjects(list);
      if (list.length === 0) toast({ title: "Aucune matière configurée", description: "Rien pour cet établissement." });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Erreur matières", description: err?.message || "Failed to fetch" });
      setSubjects([]);
    }
  };

  // ------- Submit (idempotent)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.gender ||
        !formData.school_id || !formData.phone || !formData.matricule || !formData.status) {
      toast({ title: "Erreur", description: "Champs obligatoires manquants.", variant: "destructive" }); return;
    }
    if (!formData.email) { toast({ title: "Email requis", description: "L’email est obligatoire.", variant: "destructive" }); return; }
    if (!formData.password || formData.password !== formData.confirm_password) {
      toast({ title: "Mot de passe", description: "Les mots de passe ne correspondent pas.", variant: "destructive" }); return;
    }
    if (selectedSubjects.length === 0) {
      toast({ title: "Erreur", description: "Sélectionnez au moins une matière.", variant: "destructive" }); return;
    }

    setLoading(true);
    try {
      // 1) Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (signUpError) {
        const msg = (signUpError.message || "").toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || signUpError.status === 422) {
          toast({ variant: "destructive", title: "Email déjà utilisé",
            description: "Connectez-vous ou utilisez « Mot de passe oublié »." });
          setLoading(false); return;
        }
        throw signUpError;
      }
      const user = authData.user; if (!user) throw new Error("Création du compte échouée.");

      // 2) profiles (UPSERT)
      const { data: existingProfile, error: profSelectErr } = await supabase
        .from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (profSelectErr) throw profSelectErr;
      if (!existingProfile) {
        const { error } = await supabase.from("profiles").insert({
          id: user.id, first_name: formData.first_name, last_name: formData.last_name,
          phone: formData.phone, gender: formData.gender as any, school_id: formData.school_id,
          birth_date: formData.birth_date || null, birth_place: formData.birth_place || null,
          address: formData.address || null, matricule: formData.matricule || null,
        }); if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").update({
          first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone,
          gender: formData.gender as any, school_id: formData.school_id, birth_date: formData.birth_date || null,
          birth_place: formData.birth_place || null, address: formData.address || null, matricule: formData.matricule || null,
        }).eq("id", user.id); if (error) throw error;
      }

      // 3) user_roles (insert si manquant)
      const { data: existingRole, error: roleSelectErr } = await supabase
        .from("user_roles").select("user_id,role,school_id")
        .eq("user_id", user.id).eq("role", "teacher").eq("school_id", formData.school_id).maybeSingle();
      if (roleSelectErr) throw roleSelectErr;
      if (!existingRole) {
        const { error } = await supabase.from("user_roles").insert({
          user_id: user.id, role: "teacher", school_id: formData.school_id,
        }); if (error) throw error;
      }

      // 4) teachers (UPSERT by user_id)
      const { data: existingTeacher, error: tSelErr } = await supabase
        .from("teachers").select("id").eq("user_id", user.id).maybeSingle();
      if (tSelErr) throw tSelErr;

      let teacherId: string;
      if (!existingTeacher) {
        const { data: teacher, error } = await supabase.from("teachers").insert([{
          first_name: formData.first_name, last_name: formData.last_name,
          gender: formData.gender as any, school_id: formData.school_id, phone: formData.phone,
          matricule: formData.matricule, status: formData.status as any, email: formData.email,
          birth_date: formData.birth_date || null, birth_place: formData.birth_place || null,
          address: formData.address || null, diploma: formData.diploma || null,
          qualifications: formData.qualifications || null, user_id: user.id, is_approved: false,
        }]).select().single(); if (error) throw error; teacherId = teacher.id;
      } else {
        teacherId = existingTeacher.id as unknown as string;
        const { error } = await supabase.from("teachers").update({
          first_name: formData.first_name, last_name: formData.last_name,
          gender: formData.gender as any, school_id: formData.school_id, phone: formData.phone,
          matricule: formData.matricule, status: formData.status as any, email: formData.email,
          birth_date: formData.birth_date || null, birth_place: formData.birth_place || null,
          address: formData.address || null, diploma: formData.diploma || null,
          qualifications: formData.qualifications || null,
        }).eq("id", teacherId); if (error) throw error;

        await supabase.from("teacher_subjects").delete().eq("teacher_id", teacherId);
      }

      // 5) matières
      const rows = selectedSubjects.map((subjectId) => ({ teacher_id: teacherId, subject_id: subjectId }));
      if (rows.length > 0) {
        const { error } = await supabase.from("teacher_subjects").insert(rows);
        if (error) throw error;
      }

      toast({ title: "Inscription soumise",
        description: "Compte créé/mis à jour. Vérifiez l’email puis attendez la validation." });
      navigate("/auth");
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue.", variant: "destructive" });
    } finally { setLoading(false); }
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
                  onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}>
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
                <Select value={formData.school_id}
                  onValueChange={(value) => setFormData({ ...formData, school_id: value })}>
                  <SelectTrigger disabled={schools.length === 0}>
                    <SelectValue placeholder={schools.length ? "Sélectionner..." : "Aucune école disponible"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Matières */}
            {formData.school_id && (
              <div className="space-y-2">
                <Label>Discipline / Matières enseignées *</Label>
                {subjects.length > 0 ? (
                  <div className="border rounded-lg p-4 space-y-2 max-h-56 overflow-y-auto">
                    {subjects.map((subject) => {
                      const sid = subject.id;
                      const checked = selectedSubjects.includes(sid);
                      return (
                        <div key={sid} className="flex items-center space-x-2">
                          <Checkbox
                            id={sid}
                            checked={checked}
                            onCheckedChange={(isChecked) => {
                              if (isChecked) setSelectedSubjects((prev) => [...prev, sid]);
                              else setSelectedSubjects((prev) => prev.filter((v) => v !== sid));
                            }}
                          />
                          <label htmlFor={sid} className="text-sm cursor-pointer">
                            {subject.name} ({subject.code})
                          </label>
                        </div>
                      );
                    })}
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

            {/* Statut + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select value={formData.status}
                  onValueChange={(value: Status) => setFormData({ ...formData, status: value })}>
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
