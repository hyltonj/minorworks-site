# Minor Works analytics inventory

Last validated: Saturday 21 November 2026. Owner: Hylton (Hyl). PostHog US cloud, project 747271.

## 21 November 2026: native PostHog session reporting starts here

**Starting point for reliable native PostHog reporting.** Sessions and pageviews before this date are not comparable: they have no `$pageview`/`$pageleave` events and old (UUID v4) session IDs that PostHog cannot read.

**Root cause of an empty Web Analytics screen**
1. The shared footer sent only custom `mw_*` events (plain HTTP to PostHog, no SDK). It never sent `$pageview` or `$pageleave`.
2. Its `$session_id` was UUID v4. PostHog's session tables read the session start time from a UUID v7.
3. Ballpark and Venny run `posthog-js` with pageviews switched off, so they sent none either.

**What changed**

| Change | Where | Status |
|---|---|---|
| Footer 1.9.0 sends `$pageview` per page load and per new path in single-page apps, and `$pageleave` with duration and scroll. Session IDs are UUID v7. | `minorworks-site` PR #16 | Live |
| Footer native pageviews switched on for every site (`analytics.native: true`) | PR #17 | Live |
| Ballpark and Venny SDK pageviews on (`capture_pageview: 'history_change'`, `capture_pageleave: true`), site and owner flags registered before the first pageview | `games` PR #38 | Live (Vercel builds succeeded) |
| Footer 1.9.1: `$pageleave` reports the page being left; scroll depth matches PostHog's SDK convention; route-swap scroll clamping is not credited to the old page; `analytics.sdkSites` stops the footer double-counting on Ballpark and Venny | PR #18 | **Open: needs merge** |

**Unchanged on purpose:** every `mw_*` and gameplay event; no autocapture; IP discarded; no accounts; no identification by IP or location; GPC/DNT/`mw-optout` and EU/UK consent honoured; owner mode (`is_internal`, role properties) and the project's test-account filter.

## How the footer sends events

- Source: `public/footer.js` in `minorworks-site`, served at `https://minorworks.co/footer.js` (5 minute cache). Settings per site come from `https://minorworks.co/manifest.json`.
- Transport: `fetch` POST to `https://us.i.posthog.com/e/` (keepalive, no credentials). No PostHog SDK. `$lib` is `mw-footer`.
- Visitor ID: `mw_xxxxxxxxxxxx` per origin (localStorage). Session ID: UUID v7 in session storage, renewed after 30 quiet minutes or 24 hours.
- `$pageview` properties: `$current_url`, `$host`, `$pathname`, `$referrer`, `$referring_domain`, `$device_type`, `$raw_user_agent`, `$session_id`, `site`, `footer_version`, `utm_*`.
- `$pageleave` properties: the above plus `$prev_pageview_pathname`, `$prev_pageview_duration` (seconds), `$prev_pageview_max_scroll_percentage` and `$prev_pageview_last_scroll_percentage` (0 to 1, bottom of screen as a share of page height; a page that fits on screen counts as 1).
- Single-page apps: `history.pushState`/`replaceState` and `popstate` are hooked; a new pathname is a new page, a query or hash change is not.
- SDK sites: listed in `analytics.sdkSites` (currently `ballpark`, `venny`). The footer sends no `$pageview` and no session ID of its own there; the SDK owns both.

## Event inventory (footer)

`mw_pageview`, `footer_view`, `mw_engaged`, `mw_scroll` (25/50/75/100), `mw_outbound`, `contact_click`, `contact_submit`, `margin_chrome_store_click` (conversion), plus `$pageview` and `$pageleave` since 21 Nov. Game events (`bp_*`, Venny and others) come from the apps' own SDK code.

## Validation results (21 Nov 2026, live traffic tagged `utm_source=validation`)

**Web Analytics (today, filter on and off give identical numbers):** 16 visitors, 25 views, 18 sessions, average session 18 seconds, bounce rate 50%. Sessions table: 18 sessions with pageviews, every one with a v7 ID. Includes the validation traffic.

**UUID v7:** all `$pageview` and `$pageleave` session IDs checked from 13:40 UTC onward are version 7 (0 exceptions). Older `mw_pageview` events (before the change) are v4 (114 events in the prior 24 hours) and cannot be repaired.

**Duration and scroll:** real events matched the sessions table (a 35 second visit gave `$pageleave` 35 and session duration 35). A scripted multi-route session (3 pages) gave durations 5/3/1 seconds as scripted and one session ID throughout. On the live Next.js site (home, privacy, contact via client-side routing) durations were right. It exposed a scroll bug (privacy read 0.91 for a 50% scroll) and a pageleave URL bug; both are fixed in PR #18 and reproduced in a local simulation. Re-check on the live site after merge.

**Bots:** PostHog classifies bots at query time from `$raw_user_agent` (virtual property `$virt_is_bot`, functions `isLikelyBot`/`getTrafficType`). All 25 pageviews so far are not bots. No custom filter is needed; add "Is bot equals false" to insights when wanted.

**Duplicates:** Ballpark and Venny home pages sent two `$pageview` events per visit (footer and SDK, about 130 ms apart) with different session IDs, because the SDK loads after the footer. Fixed in PR #18 (`analytics.sdkSites`); re-verify after merge.

## Status by site

Footer version live: 1.9.0 everywhere (1.9.1 after PR #18).

| Site | Native `$pageview` verified | Sessions verified (v7) | Duplicate risk | Remaining issue |
|---|---|---|---|---|
| minorworks.co | Yes | Yes | None | Scroll/URL fixes ship in PR #18 |
| almanac (Pocket Almanac) | Yes | Yes | None | None |
| dappled | Yes | Yes | None | None |
| margin | Yes | Yes | None | None |
| rankandfile | Yes | Yes | None | None |
| unitedstats | Yes | Yes | None | None |
| unsaid | Yes | Yes | None | None |
| smallcanon | Yes | Yes | None | None |
| throughline | Yes | Yes | None | None |
| qrtipsheet | Yes | Yes | None | None |
| threestars | Yes | Yes | None | None |
| omnium | Yes | Yes | None | None |
| ballpark (playballpark.app) | Yes (footer and SDK) | Yes, but two sessions per visit until PR #18 | **Confirmed double count** until PR #18 | Merge PR #18, then re-check one `$pageview` per visit |
| venny (playvenny.app) | Yes (footer and SDK) | Yes, but two sessions per visit until PR #18 | **Confirmed double count** until PR #18 | Same as Ballpark |
| percapita | **No events at all** | No | n/a | Page's Content-Security-Policy `connect-src` does not allow `https://us.i.posthog.com`, so the browser blocks every PostHog event (including `mw_*`). Pre-existing. |
| outlier | **No events at all** | No | n/a | Same CSP block as Per Capita |
| winthropcipher | **No events at all** | No | n/a | Footer script is not installed on the site |

## Outstanding

1. Merge PR #18, then confirm Ballpark and Venny send one `$pageview` per visit and one session, and recheck scroll on the live Next.js site.
2. Per Capita and Outlier: add `https://us.i.posthog.com` to `connect-src` in their CSP headers (their code is not in the repositories reachable from this session; hand to whoever builds them).
3. Winthrop Cipher: install the footer (`<script src="https://minorworks.co/footer.js" data-site="winthropcipher" defer>`), once Hyl confirms he wants it there.
4. Activity list oddity: with "Filter out internal and test users" on, the Activity events list hid fresh footer events that Web Analytics counted with the same filter on. Events carry no `is_internal` value for ordinary visitors. Treat Web Analytics and insights as the source of truth; check the Activity list with the filter off.
5. Footer `mw_scroll` marks (25/50/75/100) still use the older measure and can be affected by the route-swap scroll clamp. Not used by native Web Analytics.
6. `$prev_pageview_last_scroll_percentage` currently equals the max (only the max is tracked).
7. Games repo: a separate Vercel project, `games-clean`, shows a failed build on the latest commit. Not investigated; probably unrelated.
8. The `/stats` and `/owner` passphrase was shared in chat earlier; changing it is still recommended.

## For Studio Stats 2.0

- Count pageviews with `$pageview` (it matches `mw_pageview` one for one on footer sites; do not add both).
- Use `$session_id` and the `sessions` table for session metrics; sessions before 21 Nov are not valid.
- Filter bots with `$virt_is_bot = false`; filter internal traffic with the project test-account filter (cohort 734933 plus `is_internal`).
- Use `site` for the site and `$host` for the domain. Ballpark and Venny pageviews come from `$lib = web`, all other sites from `$lib = mw-footer`.
