import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  school_name: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, school_name, token }: InvitationRequest = await req.json();

    const invitationUrl = `${Deno.env.get("VITE_SUPABASE_URL")}/auth/accept-invite?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "EduSchedule <onboarding@resend.dev>",
      to: [email],
      subject: "Invitation - Administrateur d'Établissement",
      html: `
        <h1>Bienvenue sur EduSchedule!</h1>
        <p>Vous avez été invité à devenir administrateur de <strong>${school_name}</strong>.</p>
        <p>Cette invitation est valable pendant 72 heures.</p>
        <p>
          <a href="${invitationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accepter l'invitation
          </a>
        </p>
        <p>Ou copiez ce lien dans votre navigateur:</p>
        <p style="color: #666; font-size: 12px;">${invitationUrl}</p>
        <br>
        <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-admin-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
