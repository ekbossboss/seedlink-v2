# SeedLink — Deploy the Edge Function

The error "Unexpected non-whitespace character after JSON" means the
Supabase Edge Function has not been deployed yet. Follow these steps.

---

## Step 1 — Install the Supabase CLI

```bash
npm install -g supabase
```

## Step 2 — Login to Supabase

```bash
supabase login
```

This opens your browser. Sign in with your Supabase account.

## Step 3 — Link your project

```bash
supabase link --project-ref aksuofawpsahoxivigmn
```

## Step 4 — Deploy the Edge Function

From the root of your SeedLink project folder:

```bash
supabase functions deploy make-server-8bf31221 --no-verify-jwt
```

> ⚠️ The `--no-verify-jwt` flag is needed because the
> `/init-super-admin` endpoint uses the anon key, not a user JWT.

## Step 5 — Verify it's working

Open this URL in your browser — you should see `{"status":"ok"}`:

```
https://aksuofawpsahoxivigmn.supabase.co/functions/v1/make-server-8bf31221/health
```

## Step 6 — Try the Super Admin page again

Go back to your app and fill in the Super Admin form. It should work now!

---

## Producer application emails (SMTP)

When a user applies to become a producer, SeedLink sends:

1. **Received** — right after they submit their application  
2. **Approved** or **Rejected** — after an admin reviews the request  

Emails are sent through your **SMTP server** (the same one you configure in Supabase for auth emails).

### 1. Configure SMTP in Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project  
2. Go to **Authentication** → **SMTP Settings**  
3. Enable **Custom SMTP** and enter your provider (host, port, username, password, sender email)  
4. Save — this covers sign-up / password-reset emails from Supabase Auth  

### 2. Add the same SMTP credentials to Edge Function secrets

Supabase does not pass Dashboard SMTP settings to Edge Functions automatically. Copy the same values into secrets (Project Settings → Edge Functions → Secrets, or CLI):

```bash
supabase secrets set SMTP_HOSTNAME=smtp.your-provider.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_SECURE=false
supabase secrets set SMTP_USERNAME=your_smtp_username
supabase secrets set SMTP_PASSWORD=your_smtp_password
supabase secrets set SMTP_FROM="SeedLink <noreply@yourdomain.com>"
supabase secrets set APP_URL=https://your-production-app-url.com
```

| Secret | Typical value |
|--------|----------------|
| `SMTP_HOSTNAME` | e.g. `smtp.gmail.com`, `live.smtp.mailtrap.io` |
| `SMTP_PORT` | `587` (TLS) or `465` (SSL — set `SMTP_SECURE=true`) |
| `SMTP_SECURE` | `false` for port 587, `true` for port 465 |
| `SMTP_USERNAME` | SMTP login / API user |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | Sender shown to users (must match what your provider allows) |
| `APP_URL` | Your app URL for links in emails |

Aliases also supported: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.

If SMTP secrets are missing, applications still work; emails are skipped and logged.

### 3. Redeploy

```bash
supabase functions deploy make-server-8bf31221 --no-verify-jwt
```

### SMTP troubleshooting

- Check Edge Function logs: `supabase functions logs make-server-8bf31221`  
- Some networks block outbound port 587; try port **465** with `SMTP_SECURE=true`, or your provider’s alternate port (e.g. 2525).  
- `SMTP_FROM` must be an address your SMTP provider authorizes (same as in Dashboard SMTP).

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `404 Not Found` | Edge Function not deployed — repeat Step 4 |
| `401 Unauthorized` | Check the anon key in `utils/supabase/info.tsx` |
| `500 Internal Server Error` | Check Supabase Edge Function logs in your dashboard |

To view live logs:
```bash
supabase functions logs make-server-8bf31221
```
