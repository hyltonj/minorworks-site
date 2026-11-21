# Studio Stats 2.0 — implementation log

Started 21 Nov 2026. Incremental on the existing `/stats`; palette, typography and passphrase gate unchanged.

## Discovery (what existed)
- `/stats` queried **PostHog only** (HogQL, server-side key). GA4 tag `G-2Q8YM0S3EV` collects but nothing reads it. Search Console: no code, not connected.
- Small Canon product events (poster, shelf, share) live in Supabase (`shelf_events`), behind the `stats` edge function, not in PostHog.
- PostHog history starts 18 Nov 2026; native `$pageview`/sessions are valid from 21 Nov 2026 (see `analytics-inventory.md`).

## Added
| Area | Where |
|---|---|
| Data model: site registry, event maps, definitions, boundary dates | `src/lib/stats/model.ts` |
| Server helpers: gate, HogQL runner, internal/bot filters, window maths, Small Canon adapter, channel classes | `src/lib/stats/server.ts` |
| Overview API (old keys kept, new: native sessions, site trends, acquisition, engagement, conversions, health, integrations) | `src/app/api/stats/route.ts` |
| Per-site API (traffic, sessions, hours, entry pages, engagement, acquisition, usage funnel, sharing, conversions, retention, audience, event inventory, external) | `src/app/api/stats/site/route.ts` |
| Shared UI (old components moved unchanged + Section, DataTable, LineChart, Heatmap, Dot, Stat, auth hook) | `src/components/stats/ui.tsx` |
| Pages: Overview, Sites index, Site workspace | `src/app/stats/page.tsx`, `sites/page.tsx`, `sites/[site]/page.tsx` |

## Data-source mapping
- People, views, plays, funnels, sharing, scroll, conversions, retention, health: PostHog events (`site` property = manifest id). Internal/test filter: person not in cohort 734933 and `is_internal` not true; "Include my visits" lifts it.
- Sessions, average session, bounce, pages per session: PostHog `$pageview`/`$session_id`, **from 21 Nov only**. Before that the UI shows "n/a" / "not collected", never 0.
- Small Canon product data: Supabase `stats` function, read from the server; shows "not connected" until `SMALLCANON_STATS_URL` and `SMALLCANON_STATS_PASSWORD` are set in Netlify.
- GA4, Search Console: not connected (listed under Data sources).

## Validated
- Every new HogQL query run against real PostHog (project 747271) and returned sane values (e.g. Ballpark 30d: 143 people, 105 started, 71 finished, 4 share-tappers, 1 arrived).
- Wrong passphrase 401; unknown site 404; unset env 503; device filter; responsive at 1280 and 390 px; `tsc` and `next build` clean.
- Local UI tested with a mock PostHog (numbers in screenshots are fake; the queries themselves were verified live).

## Known limits
- Day-over-day history is 3 days deep, so "vs previous period" is partial and flagged in the UI.
- Small Canon section prints the raw function payload until its shape is mapped into charts.
- Only Ballpark has a full product event map; other games show traffic until their events are mapped.

## Decisions for review
1. **Small Canon**: read Supabase via the existing function (done, needs 2 env vars) vs add PostHog events. Recommend the adapter now, PostHog events later for poster creation and sharing.
2. **GA4/Search Console**: needs a read-only Google service account (GA4 property id, key as env var, added to each GSC property). Only route to history before 18 Nov. Recommend yes.
3. Change the `/stats` passphrase (still outstanding).
