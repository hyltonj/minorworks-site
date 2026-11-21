# Studio Stats 2.0 — review handoff (PR #19)

Preview (real data, passphrase required): https://deploy-preview-19--minorworks.netlify.app/stats · `/stats/sites` · `/stats/sites/ballpark`
Netlify built it from the PR branch; production is untouched. The preview uses the same server settings as production (checked: the API answers 401 "denied", not 503 "not configured"), so it reads live PostHog.

## 1. Metric definitions and query logic

Every number is **events**, **sessions** or **distinct people**. The UI now says which.

| Metric | Unit | Logic (PostHog HogQL unless noted) |
|---|---|---|
| People | distinct people | `uniq(person_id)` over **any** event from the site in the period. Anonymous browser id, not a human: two devices = two people. Includes people who only sent game events and no pageview. |
| Page views | events | `count()` of `mw_pageview` (footer, every load and route change). Native `$pageview` is **not** used for this. |
| Sessions, average session, bounce, pages per session, entry pages | sessions | Group events by `$session_id` (UUID v7) from `max(2026-11-21 00:00 Boston, period start)`. Session = distinct `$session_id` with at least one `$pageview`; duration = last minus first event; bounce = one pageview and under 10 s. |
| Starts | events (+ distinct people shown beneath) | `countIf(event in <site's started events>)`; Ballpark: `bp_set_started`. |
| Finishes | events | `countIf(event in <finished events>)`; Ballpark: `bp_set_completed`. |
| Finish rate (events) | ratio of events | finishes ÷ starts. |
| Funnel steps | distinct people | `uniqIf(person_id, event in step)` per step; "% of previous" is people ÷ people. Not strictly nested (see issues). |
| Share rate | distinct people | people who tapped share ÷ people who started. Taps are intent; browsers rarely confirm a send. |
| Returning | distinct people | people active in the period whose first-ever event is before the period start ÷ all active people. Capped by 18 Nov history start. |
| New people who came back | distinct people | first seen in range and more than 1 day ago, with events on 2+ Boston-time days. |
| Engagement | sessions / seconds | Scroll reach = sessions with `mw_scroll` depth 25/50/75/100 ÷ sessions with `mw_pageview`. Active time = sum `mw_engaged.engaged_seconds` ÷ sessions with `mw_engaged`. Outbound = people with `mw_outbound`. |
| Cross-project referrals | two measures | (a) Overview funnel "Arrived from another of our sites": people with a `$create_alias` event (the identity handoff when a footer link carries the id to another of our sites). (b) Acquisition class "Our other sites": people whose `$referring_domain` is one of our hosts. They overlap but are not the same. |
| Small Canon numbers | distinct visit ids | From Supabase, **not** PostHog people. Not comparable. |

### Boundaries and filters
- **Period**: rolling, `timestamp >= now() − N days`; the comparison period is the N days before. Daily charts bucket by Boston calendar day, so the first day is partial and daily sums do not equal period totals (people are distinct per day).
- **Real traffic only**: site property set; excludes hosts `*.netlify.app`, `*.vercel.app`, `localhost`, and `$set`, `$identify`, `mw_debug_probe`.
- **Internal filter**: excludes events with `is_internal = 'true'` unless "Include my visits" is on. Checked on Ballpark, last 30 days: **0 internal events and 0 people in test cohort 734933**, so the toggle changes nothing there today. The filter works on the event property only, not the cohort; we have not seen a case where they differ.
- **21 Nov cutoff**: sessions start at 05:00 UTC on 21 Nov (midnight Boston, EST). Ranges that include earlier days show a warning; a range entirely before shows "not collected". Chart days before 18 Nov are dropped and pre-21 Nov session days are `n/a`, never 0.
- **Bots**: not filtered in these queries. PostHog's own bot classification applies in its Web Analytics, not here.

### Ballpark reconciliation (30 days to 21 Nov 15:34 UTC, real PostHog)
| Measure | Value | Unit |
|---|---|---|
| "143" | 143 | distinct people, any event |
| "105 started" | 105 | distinct people who sent `bp_set_started` |
| matching start events | 278 | events (2.6 per starter) |
| "71 finished" | 71 | distinct people who sent `bp_set_completed` |
| matching finish events | 125 | events |
| Finish rate | 45% by events; 68% by people | |
| People with a pageview | 95 (`mw_pageview`) | the other 48 sent game events but no pageview |
| Internal events | 0 | |

The earlier Studio Stats counted events for "plays" and "finishes", and its event lists were wider (`puzzle_started`, `puzzle_solved`, `share_sent`, `daily_puzzle_shared`). In the last 30 days on Ballpark only `bp_set_started`, `bp_set_completed`, `bp_share_pressed`, `share_pressed`, `share_completed` and one `shared_link_opened` exist, so the narrower list changes nothing today. One difference: the old "shares" counted `share_sent`; the new mapping treats it as "share completed", not a tap. The 143/105/71 I quoted earlier were distinct people; the page's headline tiles show event counts with the people count underneath, which is what caused the confusion. Fixed in this PR.

## 2. Findings that need attention
1. **Ballpark native pageviews are thin.** Since 21 Nov only 5 `$pageview` events (3 SDK sessions) exist against 53 `mw_pageview`. PR #38 merged at 13:33 UTC; after 14:15 UTC 3 of 5 SDK sessions have a `$pageview`. Likely cached old bundles, not a bug, but unconfirmed. Until it turns over, Ballpark's sessions, bounce and entry pages are under-counted. Re-check tomorrow.
2. People who only send game events (48 of 143) never appear in session metrics.
3. Funnel steps are not nested: "Opened a session" (49) is below "Saw a question" (108), so `bp_session_started` is not sent on every path.
4. Comparison periods reach before 18 Nov history; all ↑ ↓ changes overstate growth for now (flagged in the UI).

## 3. Google integrations
- **Existing connections**: none usable. The Claude session has Google Drive only (no Analytics or Search Console scope). Nothing in the repo reads Google APIs. I did not read Netlify secret values.
- **GA4**: one property, `549056304` (account `403511601`), a single web stream titled "Chrome Web Store developer property web stream", but it also receives hits from the studio footer tag (page titles "Minor Works", Margin pages, a `smallcanon / footer` source). Tiny volume: 9 sessions and 4 users in 7 days. Measurement id `G-2Q8YM0S3EV` not verified against the stream page.
- **Search Console**: the signed-in Google account shows the welcome screen with no verified properties, so there is nothing to read until `minorworks.co` is added and verified.
- **Recommended, simplest secure read-only route**: one Google Cloud service account with only the Analytics Data API and Search Console API enabled; add its email as **Viewer** on the GA4 property and as a **Restricted** user on the Search Console property; store its JSON key as one Netlify environment variable (server-side only); the stats routes call the APIs and cache for an hour. Alternative with no Google Cloud project: a third-party connector (Windsor.ai, Supermetrics). Slower to control and adds a vendor; not recommended.
- **History**: GA4 Data API returns data from when the property started collecting (this property is small and recent; GA4 keeps 2 to 14 months of event-level detail, reports longer). Search Console API returns up to 16 months, retroactive once the site is verified.
- **Coverage**: GA4 covers only sites that carry the tag through the footer, split by hostname; Search Console covers verified properties (a Domain property on `minorworks.co` covers all subdomains; `playballpark.app` and `playvenny.app` would each need their own).
- **What I need from you (nothing pasted into chat)**: (1) approval to proceed; (2) you create the service account and add it in GA4 and Search Console (I will give click-by-click steps); (3) you add the key as a Netlify variable (`GOOGLE_SERVICE_ACCOUNT_JSON`, `GA4_PROPERTY_ID`, `GSC_SITES`); (4) verify `minorworks.co` in Search Console (DNS TXT record) if you want search data.

## 4. Small Canon (Supabase project shelf-life)
- Function `stats` v6: POST only; auth by password (SHA-256 compared in constant time, 8 failures per 10 minutes per IP best effort, 700 ms delay); the service-role key never leaves the function; it only calls three SQL functions.
- **Read-only**: `mw_overview`, `mw_site`, `shelf_stats` are `STABLE` SQL (`SELECT` only), not security definer, EXECUTE granted to `service_role` and `postgres` only. No insert, update or delete path.
- Caveats: `verify_jwt` is off (password is the only gate); CORS allows `*.netlify.app` and `*.chatgpt.site` origins, which only matters for browsers and still needs the password; call it from the server only (as the adapter does).
- **Metrics exposed** (`mode: site`): visitors, visits, events, engaged visitors, countries, first/last seen; daily visitors/visits/events; hourly visits; devices; countries; time zones; sources; campaigns; top 40 events with count and visitors; app versions. `mode: overview`: per-site visitors, previous visitors, visits, actions, top source, top country, 14-day sparkline.
- **Data today**: `smallcanon` since 3 Nov 2026 (180 visits, 131 visitors; `book_added` 18, `share` 6, `shelf_started` 5, `omnium_click` 5, `link_copy` 4, `poster_download` 1, `remix_open` 1); predecessor `shelflife` 18 Oct to 3 Nov (277 visits; `poster_preview` 34, `poster_download` 5, `share_link_copied` 8); `omnium` `reserve_click` 1. Poster creation and sharing volumes are small, and `poster_download` only has 1 real row since 3 Nov.
- **Architecture**: done. The site page calls it from the server using `SMALLCANON_STATS_URL` and `SMALLCANON_STATS_PASSWORD`; no value enters chat or code. You copy the existing `STATS_PASSWORD` from Supabase (project shelf-life, Edge Functions, Secrets) into Netlify (Site configuration, Environment variables) yourself. The section stays "not connected" until then.

## 5. Changed in this PR
New: `src/lib/stats/model.ts`, `src/lib/stats/server.ts`, `src/components/stats/ui.tsx`, `src/app/api/stats/site/route.ts`, `src/app/stats/sites/page.tsx`, `src/app/stats/sites/[site]/page.tsx`, `docs/stats-2.0-implementation-log.md`, this file. Rewritten: `src/app/api/stats/route.ts` (original keys preserved), `src/app/stats/page.tsx` (original cards kept). No tracking, footer or privacy changes.

## 6. Event mapping (Ballpark, the only full map)
started `bp_set_started` · finished `bp_set_completed` · share tap `bp_share_pressed`, `share_pressed` · share done `share_completed`, `share_sent` · arrived via share `shared_link_opened`, `daily_puzzle_started_from_share`, `started_from_share` · funnel `bp_session_started` → `bp_question_viewed` → `bp_guess_submitted` → `bp_set_started` → `bp_set_completed`. Venny `puzzle_started/solved`; other sites in `src/lib/stats/model.ts`.

## 7. Data-source coverage
| Source | Status | Covers | History |
|---|---|---|---|
| PostHog | Connected | all footer sites + Ballpark/Venny SDK | from 18 Nov 2026; sessions from 21 Nov |
| Supabase (Small Canon) | Built, needs 2 Netlify variables | smallcanon, shelflife, omnium | from 18 Oct 2026 |
| GA4 | Tag only | footer sites, one tiny property | property start |
| Search Console | Not connected, no verified property | none | up to 16 months after verification |

## 8. Unresolved
Ballpark native pageview confirmation; Per Capita and Outlier CSP blocks (no PostHog data); Winthrop Cipher has no footer; `/stats` passphrase still to change; Small Canon variables; Google service account and Search Console verification; `games-clean` Vercel build failing; Out of the Box is not in the footer manifest.

## 9. Recommended next phase (not started)
1. Merge after review; re-check Ballpark pageviews tomorrow.
2. Connect Small Canon (2 variables), then map its poster, share and book events into the site page, merging `shelflife` history.
3. Google service account for GA4, then Search Console after verification.
4. Map product events for Venny, Rank and File, Three Stars, Throughline, Unsaid.
5. Daily snapshot table so history no longer depends on rolling queries.
