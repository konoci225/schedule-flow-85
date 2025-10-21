// supabase/functions/public-schools/index.ts
// Deno Edge Function — liste des écoles actives
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // ou mets ton domaine exact si tu veux restreindre
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // ✅ Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing env SUPABASE_URL / SERVICE_ROLE_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // client admin (service role)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data, error } = await admin
      .from("schools")
      .select("id,name")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    return new Response(JSON.stringify({ schools: data ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
