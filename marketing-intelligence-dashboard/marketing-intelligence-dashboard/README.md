# Marketing Intelligence Dashboard — Personal Prototype V2

V2 adds a server-side Supabase connection test while keeping the existing private login.

## Required Vercel Environment Variables

- `DASHBOARD_EMAIL`
- `DASHBOARD_PASSWORD`
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

`SUPABASE_SECRET_KEY` must remain server-only. Never prefix it with `NEXT_PUBLIC_`.

## Connection Test

The dashboard reads the `social_accounts` table from Supabase and shows a connection status strip underneath the hero banner. A successful connection shows **Supabase Connected** and the number of rows in `social_accounts`.

The rest of the dashboard still uses demo data in this step. Real Instagram/Facebook/TikTok/YouTube metrics are connected in later steps.
