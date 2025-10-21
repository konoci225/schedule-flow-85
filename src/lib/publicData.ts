// ✅ Utilise le client Supabase unique généré par Lovable
import { supabase } from "@/integrations/supabase/client";

/**
 * Écoles actives (lecture publique via RLS)
 */
export async function getPublicSchools() {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[getPublicSchools] RLS/SQL error:", error);
    throw error;
  }
  console.log("[getPublicSchools] rows:", data?.length ?? 0);
  return data ?? [];
}

/**
 * Matières d'une école
 */
export async function getPublicSubjectsBySchool(schoolId: string) {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, code, name, school_id")
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
