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
    birth_date: "",
    birth_place: "",
    address: "",
    diploma: "",
    qualifications: "",
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (formData.school_id) {
      fetchSubjects(formData.school_id);
    }
  }, [formData.school_id]);

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

  const fetchSubjects = async (schoolId: string) => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id", schoolId)
      .order("name");

    if (!error && data) {
      setSubjects(data);
    } else {
      setSubjects([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.gender || 
        !formData.school_id || !formData.phone || !formData.matricule || 
        !formData.status) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (selectedSubjects.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une matière",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Insert teacher with type assertions
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .insert([{
          ...formData,
          gender: formData.gender as "male" | "female" | "other",
          status: formData.status as "permanent" | "contract" | "substitute"
        }])
        .select()
        .single();

      if (teacherError) throw teacherError;

      // Insert teacher subjects
      const subjectInserts = selectedSubjects.map(subjectId => ({
        teacher_id: teacher.id,
        subject_id: subjectId,
      }));

      const { error: subjectsError } = await supabase
        .from("teacher_subjects")
        .insert(subjectInserts);

      if (subjectsError) throw subjectsError;

      toast({
        title: "Inscription réussie",
        description: "Votre demande d'inscription a été envoyée. Elle sera examinée par l'administration de l'établissement.",
      });

      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Sexe *</Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value: "male" | "female" | "other") => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Homme</SelectItem>
                    <SelectItem value="female">Femme</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="school_id">Établissement *</Label>
                <Select value={formData.school_id} onValueChange={(value) => setFormData({ ...formData, school_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
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
            </div>

            {formData.school_id && (
              <div className="space-y-2">
                <Label>Discipline / Matières enseignées *</Label>
                {subjects.length > 0 ? (
                  <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={subject.id}
                          checked={selectedSubjects.includes(subject.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubjects([...selectedSubjects, subject.id]);
                            } else {
                              setSelectedSubjects(selectedSubjects.filter(id => id !== subject.id));
                            }
                          }}
                        />
                        <label htmlFor={subject.id} className="text-sm cursor-pointer">
                          {subject.name} ({subject.code})
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 text-center text-muted-foreground text-sm">
                    Aucune matière n'est encore configurée pour cet établissement.
                    <br />
                    Veuillez contacter l'administration de l'établissement.
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matricule">Matricule *</Label>
                <Input
                  id="matricule"
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: "permanent" | "contract" | "substitute") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contractuel</SelectItem>
                    <SelectItem value="substitute">Vacataire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email professionnel</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_place">Lieu de naissance</Label>
                <Input
                  id="birth_place"
                  value={formData.birth_place}
                  onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diploma">Diplômes</Label>
              <Input
                id="diploma"
                value={formData.diploma}
                onChange={(e) => setFormData({ ...formData, diploma: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualifications">Qualifications</Label>
              <Textarea
                id="qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
              />
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
