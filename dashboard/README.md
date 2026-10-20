# WRS Growth Dashboard

Baseline-to-today dashboard for Weather Recovery Solutions, built with the DOUX.WORK design system. Separate Next.js app inside the WRS site repo; it does not touch the public site.

It answers one table: for each area (search visibility, website, leads, reputation, measurement, follow-up), what it looked like before DXW, what we changed, where it is now, and what that means for the business. Every number comes from a source; anything without a source shows `?` and says why.

## Run locally

```bash
cd dashboard
npm install
cp .env.example .env.local   # fill what you have
npm run dev                  # http://localhost:3100
```

`DASHBOARD_SAMPLE_DATA=1` fills the page with made-up numbers for layout review. A banner says so on every screen. Never enable it in production.

## Baseline

Edit `data/baseline.json`:

- `baselineStart`: first day of the earliest reliable period before DXW (`YYYY-MM-DD`). The baseline window has the same length as the selected window (30/60/90 days), so the comparison is like for like. Until it is set, the page uses the oldest period Search Console still keeps and shows a warning.
- `manual`: hand-entered figures for things no API can reach (data older than Google keeps, or review count before DXW). Leave `null` when unknown.
- `areas`: the "what we changed" and "business meaning" text, and optional `before`/`current` text.

## What runs on its own

| Source | Metrics | How | Setup |
| --- | --- | --- | --- |
| GA4 | users, sessions, form leads (`generate_lead`), phone clicks (`phone_click`), direction clicks (`map_click`), channels, landing pages | Live API, cached 6 h | Service account as Viewer on the property; `GA4_PROPERTY_ID` |
| Search Console | impressions, non-branded impressions, clicks, average position, pages with impressions, top non-branded queries | Live API, cached 6 h | Same service account as a user on the property; `GSC_SITE_URL`. Google keeps 16 months |
| Business Profile | calls, website clicks, direction requests, profile views | Live API, cached 6 h | Google must approve API access first (request form, takes days). Then OAuth once with a profile manager to get `GBP_REFRESH_TOKEN`. Google keeps ~18 months |
| Google reviews | review count, rating | Daily snapshot | Same Places key and place id as the site's `/api/reviews/refresh` |
| JobNimbus | leads, website leads, leads with a job, lead-to-job rate, by source, by status | Live API, cached 6 h | Same `JOBNIMBUS_API_KEY` as the site form |
| PageSpeed | mobile score, LCP, real-user LCP | Daily snapshot | `PAGESPEED_API_KEY` (keyless quota runs out) |
| Site crawl | broken sitemap URLs, GTM tag on every page, indexed pages (URL Inspection API), sitemap and robots.txt | Daily snapshot | `GTM_ID`; Search Console for indexing |

Snapshots: Vercel Cron calls `/api/cron/snapshot` daily (see `vercel.json`) and appends to `wrs-dashboard/snapshots.json` in Vercel Blob. Needs `BLOB_READ_WRITE_TOKEN` and `CRON_SECRET`. Growth for snapshot sources starts on the first run, so turn this on as early as possible.

What stays manual: anything before the APIs' retention windows, review count before DXW, and lead-to-appointment unless appointments are logged in JobNimbus.

## Deploy

Separate Vercel project with Root Directory `dashboard`. Set `DASHBOARD_PASSWORD`; without it the production site refuses to open. The page sends `noindex`.

## Checks

```bash
npm run lint && npm run typecheck && npm run build
```
