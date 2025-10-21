import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const ALLOWED_ORIGIN = "https://schedule-flow-85.lovable.app"; // ou "*"
const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: cors });

  let schoolId: string | null = null;

  if (req.method === "GET") {
    const u = new URL(req.url);
    schoolId = u.searchParams.get("school_id");
  } else if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    schoolId = body?.school_id?.toString?.() ?? null;
  }

  if (!schoolId) {
    return new Response(JSON.stringify({ error: "school_id requis" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" }});
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return new Response(JSON.stringify({ error: "Missing env" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" }});

  const admin = createClient(url, key, { auth: { persistSession: false }});
  const { data, error } = await admin.from("subjects")
    .select("id,code,name,school_id").eq("school_id", schoolId).order("name");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" }});

  return new Response(JSON.stringify({ subjects: data ?? [] }), { status: 200, headers: { ...cors, "Content-Type": "application/json" }});
});
