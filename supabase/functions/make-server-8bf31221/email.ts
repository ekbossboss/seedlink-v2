import nodemailer from "npm:nodemailer@6.9.10";

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

/** Reads SMTP settings — use the same values as Supabase Dashboard → Authentication → SMTP. */
const getSmtpConfig = () => {
  const host = Deno.env.get("SMTP_HOSTNAME") || Deno.env.get("SMTP_HOST");
  const port = Number(Deno.env.get("SMTP_PORT") || "587");
  const user = Deno.env.get("SMTP_USERNAME") || Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASSWORD") || Deno.env.get("SMTP_PASS");
  const from =
    Deno.env.get("SMTP_FROM") ||
    Deno.env.get("EMAIL_FROM") ||
    "SeedLink <noreply@seedlink.rw>";
  const secureFlag = Deno.env.get("SMTP_SECURE");
  const secure =
    secureFlag === "true" ? true : secureFlag === "false" ? false : port === 465;

  return { host, port, user, pass, from, secure };
};

const isSmtpConfigured = () => {
  const { host, user, pass } = getSmtpConfig();
  return Boolean(host && user && pass);
};

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;

const getTransport = () => {
  if (!isSmtpConfigured()) return null;
  if (!cachedTransport) {
    const { host, port, user, pass, secure } = getSmtpConfig();
    cachedTransport = nodemailer.createTransport({
      host: host!,
      port,
      secure,
      auth: {
        user: user!,
        pass: pass!,
      },
    });
  }
  return cachedTransport;
};

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

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!isSmtpConfigured()) {
    console.log(
      "[email] SMTP not configured (set SMTP_HOSTNAME, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM) — skipping:",
      params.subject,
      "→",
      params.to,
    );
    return { ok: false, skipped: true };
  }

  const transport = getTransport();
  const { from } = getSmtpConfig();
  if (!transport) {
    return { ok: false, skipped: true };
  }

  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log("[email] Sent via SMTP:", params.subject, "→", params.to);
    return { ok: true };
  } catch (error) {
    console.log("[email] SMTP send failed:", error);
    return { ok: false, error: String(error) };
  }
}

export async function sendProducerRequestReceivedEmail(
  request: AccessRequestEmailContext,
) {
  const name = request.ownerName || "there";
  const business = request.businessName || "your business";
  const submitted = request.submitted_at
    ? new Date(request.submitted_at).toLocaleDateString("en-RW", {
      dateStyle: "long",
    })
    : "today";

  const subject = "SeedLink — Producer application received";
  const text = `Hello ${name},

Thank you for applying to become a certified producer on SeedLink.

We have received your application for ${business} (reference: ${request.id}), submitted on ${submitted}.

Our team will review your documents and notify you by email once a decision has been made. This usually takes a few business days.

You can sign in to SeedLink anytime: ${appUrl()}/login

— SeedLink`;

  const html = emailLayout(
    subject,
    `
    <h2 style="margin: 0 0 16px; color: #111827;">Application received</h2>
    <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p>Thank you for applying to become a certified producer on SeedLink.</p>
    <p>We have received your application for <strong>${escapeHtml(business)}</strong>.</p>
    <ul style="color: #4b5563; padding-left: 20px;">
      <li>Reference: <code>${escapeHtml(request.id)}</code></li>
      <li>Submitted: ${escapeHtml(submitted)}</li>
      ${request.district ? `<li>District: ${escapeHtml(request.district)}</li>` : ""}
    </ul>
    <p>Our team will review your documents and email you when a decision is ready.</p>
    <p><a href="${appUrl()}/login" style="color: #16a34a;">Sign in to SeedLink</a></p>
    `,
  );

  return sendEmail({ to: request.user_email, subject, html, text });
}

export async function sendProducerRequestApprovedEmail(
  request: AccessRequestEmailContext,
) {
  const name = request.ownerName || "there";
  const business = request.businessName || "your business";

  const subject = "SeedLink — Producer application approved";
  const text = `Hello ${name},

Great news! Your producer application for ${business} has been approved.

You can now sign in, list potato seeds on the marketplace, and manage orders from your producer dashboard:

${appUrl()}/producer/dashboard

Welcome to SeedLink!

— SeedLink`;

  const html = emailLayout(
    subject,
    `
    <h2 style="margin: 0 0 16px; color: #16a34a;">Application approved</h2>
    <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p>Great news! Your producer application for <strong>${escapeHtml(business)}</strong> has been <strong>approved</strong>.</p>
    <p>You can now list certified potato seeds and manage quote requests from farmers.</p>
    <p style="margin: 24px 0;">
      <a href="${appUrl()}/producer/dashboard"
         style="display: inline-block; background: #16a34a; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Open producer dashboard
      </a>
    </p>
    <p>Welcome to SeedLink!</p>
    `,
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
  const text = `Hello ${name},

Thank you for your interest in joining SeedLink as a producer.

After reviewing your application for ${business}, we are unable to approve it at this time.

Reason: ${reasonText}

If you have questions or would like to submit updated documents, please contact support@seedlink.rw or apply again when ready.

— SeedLink`;

  const html = emailLayout(
    subject,
    `
    <h2 style="margin: 0 0 16px; color: #b91c1c;">Application not approved</h2>
    <p>Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p>Thank you for applying to sell seed on SeedLink as <strong>${escapeHtml(business)}</strong>.</p>
    <p>After review, we are unable to approve your application at this time.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0 0 4px; font-size: 12px; color: #991b1b; font-weight: 600;">Reason</p>
      <p style="margin: 0; color: #7f1d1d;">${reasonHtml}</p>
    </div>
    <p>If you have questions or wish to reapply with updated documents, contact
      <a href="mailto:support@seedlink.rw" style="color: #16a34a;">support@seedlink.rw</a>.</p>
    `,
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
