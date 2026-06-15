export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...extra },
  });
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function code(len = 7): string {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[a[i] % ALPHABET.length];
  return s;
}

export function token(): string {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "trashmail.com", "yopmail.com", "sharklasers.com", "getnada.com",
]);

export async function validateEmail(email: string): Promise<{ ok: boolean; reason?: string }> {
  if (!EMAIL_RE.test(email)) return { ok: false, reason: "invalid_format" };
  const domain = email.split("@")[1].toLowerCase();
  if (DISPOSABLE.has(domain)) return { ok: false, reason: "disposable" };
  try {
    const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { accept: "application/dns-json" },
    });
    const data = await r.json();
    const hasMx = Array.isArray(data?.Answer) && data.Answer.some((a: { type: number }) => a.type === 15);
    if (!hasMx) {
      const ra = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, {
        headers: { accept: "application/dns-json" },
      });
      const da = await ra.json();
      if (!Array.isArray(da?.Answer) || da.Answer.length === 0) return { ok: false, reason: "no_mx" };
    }
  } catch (_) {
  }
  return { ok: true };
}

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FROM_EMAIL") || "Acuity <onboarding@resend.dev>";
  if (!key) {
    console.warn("RESEND_API_KEY not set — skipping email send");
    return false;
  }
  const body = JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body,
      });
      if (r.ok) return true;
      console.error("Resend error", r.status, await r.text());
    } catch (e) {
      console.error("Resend exception", e);
    }
  }
  return false;
}
/* email templates */
const BRAND = "#2C4FB2";
const SALMON = "#CE7C6A";

function shell(inner: string): string {
  return `<div style="font-family:Helvetica,Arial,sans-serif;background:#F1ECE2;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(40,30,25,.1);">
      <div style="padding:28px 32px 8px;text-align:center;">
        <div style="font-size:30px;font-weight:800;color:${BRAND};letter-spacing:-1px;">Acuity<span style="color:${SALMON}">.</span></div>
      </div>
      <div style="padding:8px 32px 32px;color:#3a352e;font-size:15px;line-height:1.6;">${inner}</div>
      <div style="padding:18px 32px;background:#FAF6EF;color:#a59c90;font-size:12px;text-align:center;">
        © 2026 Acuity · The science of staying focused.
      </div>
    </div>
  </div>`;
}

function shareBtn(shareLink: string): string {
  return `<div style="text-align:center;margin:26px 0;">
    <a href="${shareLink}" style="display:inline-block;background:${SALMON};color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:100px;">Share your link</a>
    <div style="margin-top:10px;font-size:12px;color:#8a8176;">${shareLink}</div>
  </div>`;
}

export function confirmationEmail(name: string, verifyUrl: string, shareLink: string): string {
  const NAVY = "#113692", CORAL = "#C75D60", BLUE = "#346BB6";
  return shell(`
    <h1 style="font-size:24px;font-weight:800;color:${NAVY};letter-spacing:-.5px;margin:10px 0 16px;">Hey ${escapeHtml(name)}, confirm your spot.</h1>
    <p style="color:${BLUE};font-size:15px;line-height:1.6;margin:0;">Thank you for joining the Acuity waitlist. Please confirm your email to lock in your place. It only takes one click.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:100px;">Confirm my email</a>
    </div>
    <p style="color:${BLUE};font-size:15px;line-height:1.6;margin:0;">Acuity launches sooner as more students join. Share your personal link to move up the list.</p>
    <div style="text-align:center;margin:24px 0 6px;">
      <a href="${shareLink}" style="display:inline-block;background:${CORAL};color:#fff;text-decoration:none;font-weight:700;padding:13px 28px;border-radius:100px;">Share your link</a>
      <div style="margin-top:12px;font-size:12px;color:#8a8176;">${shareLink}</div>
    </div>
  `);
}

/* intro nurture sequence */
export function sequenceEmail(stage: number, name: string, shareLink: string): { subject: string; html: string } | null {
  if (stage === 1) {
    return {
      subject: "Why we're building Acuity",
      html: shell(`
        <h1 style="font-size:21px;color:${BRAND};margin:10px 0 14px;">The problem we couldn't ignore</h1>
        <p>Hi ${escapeHtml(name)}, we're students too. We watched friends (and ourselves) burn out without noticing until it was too late.</p>
        <p>Acuity reads your cognitive state from passive signals — no wearables, no interruptions — so you know when to push and when to rest.</p>
        <p>Know someone who'd love this? Send them your link:</p>
        ${shareBtn(shareLink)}
      `),
    };
  }
  if (stage === 2) {
    return {
      subject: "A sneak peek at the Acuity demo",
      html: shell(`
        <h1 style="font-size:21px;color:${BRAND};margin:10px 0 14px;">Every session is a drive 🏁</h1>
        <p>${escapeHtml(name)}, the further you go, the deeper you focused. Our demo turns focus into a journey you can actually see.</p>
        <p>The more friends who join, the faster we launch. Keep sharing:</p>
        ${shareBtn(shareLink)}
      `),
    };
  }
  if (stage === 3) {
    return {
      subject: "We're almost there — last call to share",
      html: shell(`
        <h1 style="font-size:21px;color:${BRAND};margin:10px 0 14px;">Launch is around the corner</h1>
        <p>${escapeHtml(name)}, you're early — thank you. One more ask: share your link so more students can lock in with you on day one.</p>
        ${shareBtn(shareLink)}
      `),
    };
  }
  return null;
}

function escapeHtml(s: string): string {
  return (s || "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
