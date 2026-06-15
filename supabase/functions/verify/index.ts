// marks the signup as verified and redirects to the success screen
// this function must be public (verify_jwt = false in config.toml) because the link is opened directly from the user's inbox
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = (Deno.env.get("SITE_URL") || "https://acuity.app").replace(/\/$/, "");

function redirect(url: string) {
  return new Response(null, { status: 302, headers: { Location: url } });
}

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const tokenParam = u.searchParams.get("token") || "";
  const email = (u.searchParams.get("email") || "").toLowerCase();

  if (!tokenParam || !email) return redirect(`${SITE_URL}/?verify=error`);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: row } = await supabase
    .from("waitlist_signups")
    .select("verify_token, verified, referral_code")
    .eq("email", email)
    .maybeSingle();

  if (!row || row.verify_token !== tokenParam) {
    return redirect(`${SITE_URL}/?verify=error`);
  }

  if (!row.verified) {
    await supabase
      .from("waitlist_signups")
      .update({ verified: true, verified_at: new Date().toISOString(), seq_stage: 0 })
      .eq("email", email);
    await supabase.from("analytics_events").insert({
      event: "email_confirmed_server",
      props: { referral_code: row.referral_code },
      referrer_code: row.referral_code,
      path: "/functions/verify",
    });
  }

  return redirect(`${SITE_URL}/success.html?ref=${row.referral_code}`);
});
