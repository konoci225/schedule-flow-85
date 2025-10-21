import { supabase } from "./supabaseClient";

// Ecoles actives
export async function getPublicSchools() {
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Matières d'une école
export async function getPublicSubjectsBySchool(schoolId: string) {
  const { data, error } = await supabase
    .from("subjects")
    .select("id, code, name, school_id")
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}
