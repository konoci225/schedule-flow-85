import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

function buildCors(req: Request) {
  const origin = req.headers.get("Origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

Deno.serve(async (req) => {
  const cors = buildCors(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: cors });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // clé serveur
    const admin = createClient(url!, key!, { auth: { persistSession: false } });

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("school_id");
    if (!schoolId) {
      return new Response(
        JSON.stringify({ error: "Missing school_id" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await admin
      .from("subjects")
      .select("id, name, code, school_id")
      .eq("school_id", schoolId)
      .order("name");

    if (error) throw error;

    return new Response(
      JSON.stringify({ subjects: data ?? [] }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message ?? "Unexpected error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
