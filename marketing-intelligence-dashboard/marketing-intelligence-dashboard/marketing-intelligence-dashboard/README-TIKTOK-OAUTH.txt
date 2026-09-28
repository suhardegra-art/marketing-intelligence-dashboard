TIKTOK OAUTH UPDATE — INSTALLATION

Upload these files into the ACTIVE Vercel project folder:
marketing-intelligence-dashboard/marketing-intelligence-dashboard/

MERGE/REPLACE:
- app/dashboard/page.tsx
- lib/tiktok.ts
- lib/supabase-admin.ts

ADD:
- app/api/tiktok/connect/route.ts
- app/api/tiktok/callback/route.ts

Vercel Environment Variables already required:
- TIKTOK_CLIENT_KEY
- TIKTOK_CLIENT_SECRET
- TIKTOK_REDIRECT_URI
- SUPABASE_URL
- SUPABASE_SECRET_KEY
- SESSION_SECRET

TikTok Sandbox Redirect URI:
https://marketing-intelligence-dashboard-nu.vercel.app/api/tiktok/callback

After upload:
1. Commit & Push to main.
2. Wait for Vercel deployment = Ready.
3. Log in to the dashboard.
4. Click "Connect TikTok".
5. Authorize the Sandbox target account.
6. You should return to /dashboard and see "TikTok Connected".
7. The initial connection stores the profile plus the latest 20 public videos in Supabase.

Do not expose or commit any client secrets into GitHub.
