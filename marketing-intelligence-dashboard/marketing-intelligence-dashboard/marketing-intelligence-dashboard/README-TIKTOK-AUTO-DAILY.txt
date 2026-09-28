TIKTOK AUTO DAILY SYNC + HISTORICAL SNAPSHOT

Upload into the ACTIVE Vercel project folder:
marketing-intelligence-dashboard/marketing-intelligence-dashboard/

ADD:
- app/api/cron/tiktok-daily/route.ts
- lib/tiktok-history.ts
- vercel.json

REPLACE:
- lib/tiktok-sync.ts
- app/tiktok/page.tsx

NEW VERCEL ENVIRONMENT VARIABLE REQUIRED:
CRON_SECRET

Use a long random secret. Do NOT send it to ChatGPT and do NOT commit it to GitHub.

Cron schedule:
0 2 * * *

Vercel Cron expressions use UTC. 02:00 UTC is about 09:00 WIB.
On the Hobby plan, daily Cron Jobs have hourly precision, so it may run within the 09:00-09:59 WIB window rather than at an exact minute.

Daily job:
1. Refreshes the TikTok access token if needed.
2. Pulls current account profile/stats.
3. Upserts today's account snapshot in social_account_metrics.
4. Syncs all public videos page-by-page.
5. Upserts today's per-video snapshot in social_content_metrics.
6. Writes a success entry to social_sync_log.

Historical data:
- social_account_metrics = one row per account per day.
- social_content_metrics = one row per content per day.

Expected Source Control:
A  app/api/cron/tiktok-daily/route.ts
A  lib/tiktok-history.ts
A  vercel.json
M  lib/tiktok-sync.ts
M  app/tiktok/page.tsx

Commit message:
Add TikTok auto daily sync and history

After deployment:
1. Vercel should register a Cron Job for /api/cron/tiktok-daily.
2. Open the TikTok page. Historical Snapshot will show the snapshots currently available.
3. Tomorrow, after the Cron Job runs, a second daily snapshot should appear automatically.

Manual Sync All Videos is still available.
