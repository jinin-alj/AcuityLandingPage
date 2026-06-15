// Schedule drives a short intro email sequence for verified users so they keep hearing about Acuity until launch.
// Schedule it in supabase/config.toml e.g. daily.
// stages: 1 → ~1 day, 2 → ~3 days, 3 → ~6 days
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, sendEmail, sequenceEmail } from "../_shared/email.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = (Deno.env.get("SITE_URL") || "https://acuity.app").replace(/\/$/, "");

const STAGE_DELAY_DAYS = [0, 1, 3, 6];

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const now = Date.now();

  const { data: users, error } = await supabase
    .from("waitlist_signups")
    .select("email, name, referral_code, seq_stage, verified_at")
    .eq("verified", true)
    .lt("seq_stage", 3)
    .limit(200);

  if (error) return json({ error: error.message }, 500);

  let sent = 0;
  for (const u of users ?? []) {
    const nextStage = (u.seq_stage ?? 0) + 1;
    const delayDays = STAGE_DELAY_DAYS[nextStage] ?? 99;
    const verifiedAt = u.verified_at ? new Date(u.verified_at).getTime() : now;
    const ageDays = (now - verifiedAt) / 86400000;
    if (ageDays < delayDays) continue;

    const shareLink = `${SITE_URL}/?ref=${u.referral_code}`;
    const tpl = sequenceEmail(nextStage, u.name || "there", shareLink);
    if (!tpl) continue;

    const ok = await sendEmail({ to: u.email, subject: tpl.subject, html: tpl.html });
    if (ok) {
      await supabase.from("waitlist_signups").update({ seq_stage: nextStage }).eq("email", u.email);
      sent++;
    }
  }

  return json({ ok: true, processed: users?.length ?? 0, sent });
});
