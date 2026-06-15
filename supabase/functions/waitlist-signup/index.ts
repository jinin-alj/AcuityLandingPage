// POST /functions/v1/waitlist-signup
// Body: { name, email, referrer_code?, tier?, ab_variant? }
// - validates input (server-side), upserts the signup, generates a referral
//   code + verify token, and sends a Resend confirmation email (with retry).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, json, code, token, validateEmail, sendEmail, confirmationEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = (Deno.env.get("SITE_URL") || "https://acuityfocus.com").replace(/\/$/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const name = String(payload.name ?? "").trim().slice(0, 120);
  const email = String(payload.email ?? "").trim().toLowerCase().slice(0, 254);
  const referrer = payload.referrer_code ? String(payload.referrer_code).trim().slice(0, 16) : null;
  const tier = payload.tier ? String(payload.tier).slice(0, 32) : null;
  const ab = payload.ab_variant ? String(payload.ab_variant).slice(0, 8) : null;

  if (name.length < 2) return json({ error: "Please enter your name." }, 422);
  const v = await validateEmail(email);
  if (!v.ok) return json({ error: "Please use a valid, reachable email address." }, 422);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Already signed up? Re-send confirmation if not yet verified, reuse code.
  const { data: existing } = await supabase
    .from("waitlist_signups")
    .select("referral_code, verified, verify_token, name")
    .eq("email", email)
    .maybeSingle();

  let referralCode: string;
  let verifyToken: string;
  let displayName = name;

  if (existing) {
    referralCode = existing.referral_code;
    verifyToken = existing.verify_token;
    displayName = existing.name || name;
    // keep their tier / ab fresh
    await supabase.from("waitlist_signups").update({ tier, ab_variant: ab }).eq("email", email);
  } else {
    referralCode = code();
    verifyToken = token();
    const { error } = await supabase.from("waitlist_signups").insert({
      name, email, referral_code: referralCode, referred_by: referrer,
      tier, ab_variant: ab, verify_token: verifyToken,
    });
    if (error) {
      // Unique race: fall back to fetching the existing row's code.
      const { data: row } = await supabase
        .from("waitlist_signups").select("referral_code, verify_token, name").eq("email", email).maybeSingle();
      if (!row) return json({ error: "Signup failed" }, 500);
      referralCode = row.referral_code; verifyToken = row.verify_token; displayName = row.name || name;
    }
    // analytics: signup recorded server-side too
    await supabase.from("analytics_events").insert({
      event: "waitlist_signup_server", props: { tier, has_referrer: !!referrer },
      ab_variant: ab, referrer_code: referrer, path: "/functions/waitlist-signup",
    });
  }

  const verifyUrl = `${SUPABASE_URL}/functions/v1/verify?token=${verifyToken}&email=${encodeURIComponent(email)}`;
  const shareLink = `${SITE_URL}/?ref=${referralCode}`;

  const sent = await sendEmail({
    to: email,
    subject: "Confirm your spot on the Acuity waitlist",
    html: confirmationEmail(displayName, verifyUrl, shareLink),
  });
  if (sent) await supabase.from("waitlist_signups").update({ confirmation_sent: true }).eq("email", email);

  return json({ ok: true, referral_code: referralCode, email_sent: sent });
});
