import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  school_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  redirect_to?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email, school_id, first_name, last_name, phone, redirect_to }: InvitationRequest = await req.json();

    console.log('Inviting user:', { email, school_id });

    // Use Supabase's built-in invite function
    // This will:
    // 1. Create the user in auth.users
    // 2. Send an invitation email automatically
    // 3. Set user metadata
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        role: 'school_admin',
        school_id: school_id,
        first_name: first_name || '',
        last_name: last_name || '',
        phone: phone || '',
      },
      redirectTo: redirect_to || `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`,
    });

    if (inviteError) {
      console.error('Invite error:', inviteError);
      throw inviteError;
    }

    console.log('User invited successfully:', inviteData);

    // Create user_roles entry
    if (inviteData.user) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: inviteData.user.id,
          role: 'school_admin',
          school_id: school_id,
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        // Don't throw here, the user is created, we can fix roles later
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation envoyée avec succès',
        user: inviteData.user 
      }), 
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-school-admin function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Une erreur est survenue lors de l\'invitation',
        details: error 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
