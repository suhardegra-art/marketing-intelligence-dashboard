TIKTOK DATE RANGE FILTER

Upload into the ACTIVE project folder:
marketing-intelligence-dashboard/marketing-intelligence-dashboard/

REPLACE:
- app/tiktok/page.tsx
- lib/tiktok-dashboard.ts
- lib/tiktok-history.ts

Expected Source Control:
M  app/tiktok/page.tsx
M  lib/tiktok-dashboard.ts
M  lib/tiktok-history.ts

Commit message:
Add TikTok date range filter

After Vercel = Ready:
1. Open TikTok.
2. Choose From Date and To Date.
3. Click Apply Period.
4. KPIs, engagement, Top Content and table will filter to videos PUBLISHED in that period.
5. Reset returns to all publish dates.

IMPORTANT:
- Followers / Account Likes remain current account-level values.
- Video views/likes/comments/shares are latest cumulative values for videos published in the selected range.
- Historical account snapshot growth is filtered by the selected date range when snapshots exist.
- True "views gained between dates" becomes possible after enough daily snapshots accumulate.
