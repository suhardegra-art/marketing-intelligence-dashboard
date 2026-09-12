TIKTOK REAL-DATA DASHBOARD UPDATE

Upload into the ACTIVE project folder:
marketing-intelligence-dashboard/marketing-intelligence-dashboard/

ADD:
- app/tiktok/page.tsx
- lib/tiktok-dashboard.ts

REPLACE:
- components/Sidebar.tsx
- middleware.ts

Expected Source Control:
A  app/tiktok/page.tsx
A  lib/tiktok-dashboard.ts
M  components/Sidebar.tsx
M  middleware.ts

Commit message:
Add real TikTok performance dashboard

After Vercel = Ready:
1. Login.
2. Click TikTok in the sidebar.
3. The page should display real Supabase/TikTok data.
4. Do not expect Reach/Profile Views/Impressions because TikTok Display API does not provide them.
