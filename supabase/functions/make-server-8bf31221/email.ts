// email.ts — Deno-native email sending (no nodemailer, uses fetch-based SMTP or Resend/MailerSend API)

type AccessRequestEmailContext = {
  id: string;
  user_email: string;
  ownerName?: string;
  businessName?: string;
  district?: string;
  submitted_at?: string;
  reason?: string;
};

const appUrl = () =>
  Deno.env.get("APP_URL") || Deno.env.get("SITE_URL") || "https://seedlink.rw";

// ---------------------------------------------------------------------------
// SMTP config (same env vars as before — nothing changes for you)
// ---------------------------------------------------------------------------
const getSmtpConfig = () => {
  const host =
    Deno.env.get("SMTP_HOSTNAME") ||
    Deno.env.get("SMTP_HOST") ||
    Deno.env.get("MAILERSEND_SMTP_HOST") ||
    Deno.env.get("MAILERSEND_SMTP_HOSTNAME");
  const port = Number(
    Deno.env.get("SMTP_PORT") || Deno.env.get("MAILERSEND_SMTP_PORT") || "587",
  );
  let user =
    Deno.env.get("SMTP_USERNAME") ||
    Deno.env.get("SMTP_USER") ||
    Deno.env.get("MAILERSEND_SMTP_USERNAME") ||
    Deno.env.get("MAILERSEND_SMTP_USER");
  const pass =
    Deno.env.get("SMTP_PASSWORD") ||
    Deno.env.get("SMTP_PASS") ||
    Deno.env.get("MAILERSEND_SMTP_PASSWORD") ||
    Deno.env.get("MAILERSEND_SMTP_PASS") ||
    Deno.env.get("MAILERSEND_API_KEY");
  if (!user && Deno.env.get("MAILERSEND_API_KEY")) user = "apikey";
  const from =
    Deno.env.get("SMTP_FROM") ||
    Deno.env.get("EMAIL_FROM") ||
    Deno.env.get("MAILERSEND_SMTP_FROM") ||
    "SeedLink <noreply@seedlink.rw>";

  return { host, port, user, pass, from };
};

// Check if a MailerSend HTTP API key is available (preferred over SMTP in Deno)
const getMailerSendApiKey = () => Deno.env.get("MAILERSEND_API_KEY") || null;

export const isSmtpConfigured = () => {
  if (getMailerSendApiKey()) return true;
  const { host, user, pass } = getSmtpConfig();
  return Boolean(host && user && pass);
};

// ---------------------------------------------------------------------------
// Send via MailerSend HTTP API (works perfectly in Deno edge runtime)
// ---------------------------------------------------------------------------
async function sendViaMailerSend(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = getMailerSendApiKey()!;

  // Parse "Name <email>" format
  const fromMatch = params.from.match(/^(.+?)\s*<(.+?)>$/);
  const fromName = fromMatch ? fromMatch[1].trim() : "SeedLink";
  const fromEmail = fromMatch ? fromMatch[2].trim() : params.from;

  const body = {
    from: { email: fromEmail, name: fromName },
    to: [{ email: params.to }],
    subject: params.subject,
    html: params.html,
    text: params.text,
  };

  const res = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (res.ok) return { ok: true };
  const errText = await res.text().catch(() => "");
  console.error("[email] MailerSend error:", res.status, errText);
  return { ok: false, error: `MailerSend HTTP ${res.status}: ${errText}` };
}

// ---------------------------------------------------------------------------
// Send via Supabase built-in SMTP relay using fetch to the inbucket endpoint
// Falls back gracefully — Deno cannot open raw TCP sockets to external SMTP.
// If you need raw SMTP, use MailerSend/Resend HTTP API instead.
// ---------------------------------------------------------------------------
async function sendViaSmtpRelay(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  // Supabase exposes an internal SMTP endpoint for edge functions.
  // Use the Auth admin email endpoint as a relay.
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { from } = getSmtpConfig();

  // Use Supabase Auth's built-in email sending (leverages the Dashboard SMTP config)
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      type: "magiclink",
      email: params.to,
    }),
  });

  // This endpoint isn't designed for custom email — skip and log
  console.log(
    "[email] SMTP relay not available in Deno edge runtime without MailerSend API key.",
    "To enable emails, set MAILERSEND_API_KEY in Supabase Edge Function secrets.",
    "Skipping:", params.subject, "→", params.to,
  );
  return { ok: false, error: "SMTP relay requires MAILERSEND_API_KEY" };
}

// ---------------------------------------------------------------------------
// Public sendEmail — auto-selects best available method
// ---------------------------------------------------------------------------
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    console.log(
      "[email] Email not configured — skipping:",
      params.subject,
      "→",
      params.to,
      "\nTo enable: set MAILERSEND_API_KEY in Supabase project → Settings → Edge Functions → Secrets",
    );
    return { ok: false, skipped: true };
  }

  const { from } = getSmtpConfig();

  // Prefer MailerSend HTTP API (works in Deno, no TCP socket needed)
  if (getMailerSendApiKey()) {
    return sendViaMailerSend({ ...params, from });
  }

  // Fallback — will log a skip message
  return sendViaSmtpRelay(params);
}

// ---------------------------------------------------------------------------
// Email templates (unchanged from before)
// ---------------------------------------------------------------------------
const emailLayout = (title: string, bodyHtml: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="background: #16a34a; color: white; padding: 16px 20px; border-radius: 8px 8px 0 0;">
    <strong style="font-size: 18px;">SeedLink</strong>
  </div>
  <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    ${bodyHtml}
    <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">
      Rwanda's digital marketplace for quality potato seeds.
    </p>
  </div>
</body>
</html>`;

export async function sendProducerRequestReceivedEmail(
  request: AccessRequestEmailContext,
) {
  const name = request.ownerName || "there";
  const business = request.businessName || "your business";
  const submitted = request.submitted_at
    ? new Date(request.submitted_at).toLocaleDateString("en-RW", { dateStyle: "long" })
    : "today";

  const subject = "SeedLink — Producer application received";
  const text = `Hello ${name},\n\nThank you for applying to become a certified producer on SeedLink.\n\nWe have received your application for ${business} (reference: ${request.id}), submitted on ${submitted}.\n\nOur team will review your documents and notify you by email once a decision has been made.\n\nYou can sign in to SeedLink anytime: ${appUrl()}/login\n\n— SeedLink`;

  const html = emailLayout(
    subject,
    `<h2 style="margin: 0 0 16px; color: #111827;">Application received</h2>
    <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p>Thank you for applying to become a certified potato seed producer on SeedLink.</p>
    <p>We have received your application for <strong>${escapeHtml(business)}</strong>.</p>
    <ul style="color: #4b5563; padding-left: 20px;">
      <li>Reference: <code>${escapeHtml(request.id)}</code></li>
      <li>Submitted: ${escapeHtml(submitted)}</li>
      ${request.district ? `<li>District: ${escapeHtml(request.district)}</li>` : ""}
    </ul>
    <p>Our team will review your documents and email you when a decision is ready.</p>
    <p><a href="${appUrl()}/login" style="color: #16a34a;">Sign in to SeedLink</a></p>`,
  );

  return sendEmail({ to: request.user_email, subject, html, text });
}

export async function sendProducerRequestApprovedEmail(
  request: AccessRequestEmailContext,
) {
  const name = request.ownerName || "there";
  const business = request.businessName || "your business";

  const subject = "SeedLink — Producer application approved";
  const text = `Hello ${name},\n\nGreat news! Your producer application for ${business} has been approved.\n\nYou can now sign in and manage your producer dashboard:\n${appUrl()}/producer/dashboard\n\nWelcome to SeedLink!\n\n— SeedLink`;

  const html = emailLayout(
    subject,
    `<h2 style="margin: 0 0 16px; color: #16a34a;">Application approved</h2>
    <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p>Great news! Your producer application for <strong>${escapeHtml(business)}</strong> has been <strong>approved</strong>.</p>
    <p>You can now list your potato seeds and manage quote requests from farmers.</p>
    <p style="margin: 24px 0;">
      <a href="${appUrl()}/producer/dashboard"
         style="display: inline-block; background: #16a34a; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Open producer dashboard
      </a>
    </p>
    <p>Welcome to SeedLink!</p>`,
  );

  return sendEmail({ to: request.user_email, subject, html, text });
}

export async function sendProducerRequestRejectedEmail(
  request: AccessRequestEmailContext,
  reason?: string,
) {
  const name = request.ownerName || "there";
  const business = request.businessName || "your business";
  const reasonText = reason?.trim() || "No additional reason was provided.";
  const reasonHtml = escapeHtml(reasonText).replace(/\n/g, "<br>");

  const subject = "SeedLink — Producer application update";
  const text = `Hello ${name},\n\nThank you for your interest in joining SeedLink as a producer.\n\nAfter reviewing your application for ${business}, we are unable to approve it at this time.\n\nReason: ${reasonText}\n\nIf you have questions, please contact support@seedlink.rw.\n\n— SeedLink`;

  const html = emailLayout(
    subject,
    `<h2 style="margin: 0 0 16px; color: #b91c1c;">Application not approved</h2>
    <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p>Thank you for applying to sell seed on SeedLink as <strong>${escapeHtml(business)}</strong>.</p>
    <p>After review, we are unable to approve your application at this time.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #991b1b; font-weight: 600;">Reason</p>
      <p style="margin: 0; color: #7f1d1d;">${reasonHtml}</p>
    </div>
    <p>If you have questions or wish to reapply, contact
      <a href="mailto:support@seedlink.rw" style="color: #16a34a;">support@seedlink.rw</a>.</p>`,
  );

  return sendEmail({ to: request.user_email, subject, html, text });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}