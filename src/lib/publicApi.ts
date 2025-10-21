/**
 * Appels aux Edge Functions Supabase (lecture via service role côté serveur)
 * On construit l'URL à partir de VITE_SUPABASE_URL pour éviter de hardcoder le project id.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

if (!SUPABASE_URL) {
  console.warn("[publicApi] VITE_SUPABASE_URL manquant.");
}

// utilitaire fetch JSON simple
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} on ${url}: ${text}`);
  }
  return (await res.json()) as T;
}

export type School = { id: string; name: string; is_active: boolean };
export type Subject = { id: string; code: string; name: string; school_id: string };

export async function fetchPublicSchools(): Promise<School[]> {
  const base = SUPABASE_URL?.replace(/\/+$/, "");
  const url = `${base}/functions/v1/public-schools`;
  const json = await getJSON<{ schools: School[] }>(url);
  return json.schools ?? [];
}

export async function fetchPublicSubjectsBySchool(schoolId: string): Promise<Subject[]> {
  const base = SUPABASE_URL?.replace(/\/+$/, "");
  const url = `${base}/functions/v1/public-subjects?school_id=${encodeURIComponent(schoolId)}`;
  const json = await getJSON<{ subjects: Subject[] }>(url);
  return json.subjects ?? [];
}
