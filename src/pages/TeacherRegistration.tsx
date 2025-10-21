import { useEffect, useState } from "react";
import { getPublicSchools, getPublicSubjectsBySchool } from "@/lib/publicData";

type School = { id: string; name: string; is_active: boolean };
type Subject = { id: string; code: string; name: string; school_id: string };

export default function RegisterTeacher() {
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [loadingSchools, setLoadingSchools] = useState<boolean>(false);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // 1) Charger les écoles
  useEffect(() => {
    (async () => {
      setLoadingSchools(true);
      setErrorMsg("");
      try {
        const s = await getPublicSchools();
        setSchools(s);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Impossible de charger les établissements.");
      } finally {
        setLoadingSchools(false);
      }
    })();
  }, []);

  // 2) Charger les matières quand une école est choisie
  useEffect(() => {
    if (!selectedSchool) {
      setSubjects([]);
      return;
    }
    (async () => {
      setLoadingSubjects(true);
      setErrorMsg("");
      try {
        const subs = await getPublicSubjectsBySchool(selectedSchool);
        setSubjects(subs);
      } catch (e: any) {
        setErrorMsg(e?.message ?? "Impossible de charger les matières.");
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, [selectedSchool]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-1">Inscription Professeur</h1>
      <p className="text-muted-foreground mb-6">
        Remplissez le formulaire pour soumettre votre candidature. Votre inscription sera validée par l'administration.
      </p>

      {errorMsg ? (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
          {errorMsg}
        </div>
      ) : null}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Prénom */}
        <div>
          <label className="block text-sm mb-1">Prénom *</label>
          <input className="w-full border rounded p-2" placeholder="Votre prénom" />
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm mb-1">Nom *</label>
          <input className="w-full border rounded p-2" placeholder="Votre nom" />
        </div>

        {/* Établissement */}
        <div>
          <label className="block text-sm mb-1">Établissement *</label>
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="w-full border rounded p-2"
            disabled={loadingSchools}
          >
            <option value="">{loadingSchools ? "Chargement..." : "Sélectionner..."}</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Matière (facultatif selon ta logique) */}
        <div>
          <label className="block text-sm mb-1">Matière</label>
          <select className="w-full border rounded p-2" disabled={!selectedSchool || loadingSubjects}>
            <option value="">{loadingSubjects ? "Chargement..." : "Sélectionner..."}</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm mb-1">Téléphone *</label>
          <input className="w-full border rounded p-2" placeholder="+225 ..." />
        </div>

        {/* Email professionnel */}
        <div>
          <label className="block text-sm mb-1">Email professionnel *</label>
          <input className="w-full border rounded p-2" placeholder="exemple@ecole.edu" type="email" />
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-sm mb-1">Mot de passe *</label>
          <input className="w-full border rounded p-2" placeholder="••••••••" type="password" />
        </div>

        {/* Confirmer le mot de passe */}
        <div>
          <label className="block text-sm mb-1">Confirmer le mot de passe *</label>
          <input className="w-full border rounded p-2" placeholder="••••••••" type="password" />
        </div>

        {/* Bouton submit (à relier à ta logique existante) */}
        <div className="md:col-span-2">
          <button
            type="button"
            className="w-full md:w-auto px-4 py-2 rounded bg-black text-white"
            onClick={() => alert("TODO: connecter à ta logique d'inscription")}
          >
            Soumettre
          </button>
        </div>
      </form>
    </div>
  );
}
