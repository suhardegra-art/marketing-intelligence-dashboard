SYNC ALL TIKTOK VIDEOS UPDATE

Upload into the ACTIVE project folder:
marketing-intelligence-dashboard/marketing-intelligence-dashboard/

ADD:
- app/api/tiktok/sync/route.ts
- app/tiktok/SyncAllTikTokButton.tsx
- lib/tiktok-sync.ts

REPLACE:
- app/tiktok/page.tsx
- lib/tiktok-dashboard.ts

Expected Source Control:
A  app/api/tiktok/sync/route.ts
A  app/tiktok/SyncAllTikTokButton.tsx
A  lib/tiktok-sync.ts
M  app/tiktok/page.tsx
M  lib/tiktok-dashboard.ts

Commit message:
Add Sync All TikTok Videos

After Vercel deployment = Ready:
1. Login.
2. Open TikTok.
3. Click "Sync All Videos".
4. Keep the page open while progress advances page-by-page.
5. TikTok returns at most 20 videos per API page, so an account with 581 videos may take about 30 page requests.
6. When complete, the page reloads and "Videos Loaded" should approach the account's reported Total Videos.

The sync is idempotent: rerunning it updates the same content instead of creating duplicate videos.
The server automatically refreshes the TikTok access token shortly before it expires.
