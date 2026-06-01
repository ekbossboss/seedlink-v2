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
supabase functions deploy server --no-verify-jwt
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

## Troubleshooting

| Error | Fix |
|-------|-----|
| `404 Not Found` | Edge Function not deployed — repeat Step 4 |
| `401 Unauthorized` | Check the anon key in `utils/supabase/info.tsx` |
| `500 Internal Server Error` | Check Supabase Edge Function logs in your dashboard |

To view live logs:
```bash
supabase functions logs server
```
