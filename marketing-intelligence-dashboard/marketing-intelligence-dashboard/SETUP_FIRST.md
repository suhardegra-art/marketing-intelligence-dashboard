# Annual Big Event Dashboard — Setup

This package adds a new **Annual Big Event** page to the existing Vercel dashboard.
It does **not** create a second sidebar. It reuses the current shared `Sidebar.tsx`
and only wires the existing "Annual Big Event" menu item to `/annual-big-event`.

## Current Google Sheet source

Spreadsheet: **Marketing Event Detail Report**  
Tab used: **Anual Big Event**

The parser supports the flexible structure already used in the sheet:
- one main row per event
- unlimited SPK model rows underneath
- unlimited budget-category rows underneath
- new motor models do not require new dashboard columns
- new budget categories do not require new dashboard columns

---

# 1. Upload this ZIP to the existing repo

Copy/overwrite the files preserving the folder structure.

Suggested commit:

`Add Annual Big Event Google Sheet dashboard`

---

# 2. Create the Google Apps Script API

Open the Google Sheet:

**Marketing Event Detail Report**

Then:

1. Extensions → Apps Script
2. Delete the default code
3. Paste the content of:
   `google-apps-script/Code.gs`
4. Apps Script → Project Settings → Script Properties
5. Add:

   Property:
   `API_SECRET`

   Value:
   create a long random secret, for example 40+ characters.

6. Deploy → New deployment
7. Type → Web app
8. Execute as → Me
9. Who has access → Anyone
10. Deploy
11. Copy the Web App URL ending in `/exec`

The data endpoint is protected by the secret, so knowing the web-app URL alone
is not enough to retrieve the sheet data.

---

# 3. Add Vercel Environment Variables

Vercel → Project → Settings → Environment Variables

Add:

`ANNUAL_EVENT_SHEET_API_URL`
= the Apps Script Web App `/exec` URL

`ANNUAL_EVENT_SHEET_API_SECRET`
= exactly the same value as Apps Script `API_SECRET`

Set both for Production.

Existing `GEMINI_API_KEY` is reused for AI Analysis.

No new Supabase table is required.

---

# 4. Redeploy

After env variables are saved, redeploy Production.

Open:

`/annual-big-event`

---

# Sync behavior

## Automatic
The dashboard reads the Google Sheet with `cache: no-store`.

- Opening the page always gets the latest sheet.
- While the page remains open, it checks the source every 60 seconds.
- When the Google Sheet `dataVersion` changes, the page automatically refreshes.

Expected practical delay while the dashboard is open:
**up to ~60 seconds** after editing the Google Sheet.

## Manual
Use:

`↻ Sync Now`

This immediately re-reads the Google Sheet and refreshes the page.

Because Google Sheet itself is the source of truth, there is no duplicated event
database to maintain.

---

# Dashboard menus

The Annual Big Event page has two separate internal menus:

## Event Data
- Total Events
- Total Budget
- Total SPK
- Total Test Ride
- Foot Traffic
- Search
- Year filter
- City filter
- Status filter
- Event table
- CSV export
- Event detail popup
- SPK breakdown
- Budget breakdown
- SPP / Quotation links
- automatic data-quality validation

## AI Analysis
- AI Executive Summary
- Conversion Funnel
- SPK by Model
- Budget Composition
- Event Performance: SPK vs Budget
- Top Performing Events
- Performance by City
- Portfolio efficiency
- AI Key Insights
- AI Recommendations
- Data Quality warnings

AI analysis refreshes automatically when the source sheet version changes and
can also be manually refreshed.

---

# Data Quality validation

The dashboard compares:

`Sum of SPK breakdown` vs `Total SPK`

and

`Sum of budget breakdown` vs `Total Budget`

If they do not match, the event table shows:

`⚠ Mismatch`

The AI analysis also receives these mismatch indicators.

---

# Important

The exact current tab name is:

`Anual Big Event`

If you rename that tab later, update this line inside Apps Script:

`const SHEET_NAME = "Anual Big Event";`
