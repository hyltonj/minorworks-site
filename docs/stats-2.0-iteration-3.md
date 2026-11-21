# Studio Stats 2.0 — iteration 3 (PR #19)

Design direction unchanged. This round adds the portfolio centerpiece, corrects two measurement problems found during verification, and adds a few analytically justified charts.

## What changed

- **Traffic by project (Overview).** Full-width chart: project chips (Top 5 / Top 8 shortcuts), stacked or line view, compare with previous period, same day last week or 7-day average. Comparisons switch themselves off with a stated reason when PostHog history (from 18 Nov) is too short. The stack adds per-project unique people, so the line view offers a de-duplicated “all sites” line. Days before history are cropped, not drawn as zero. “Trends in PostHog” opens the same breakdown there (link format untested until opened).
- **Each project on its own scale (small multiples).** One sparkline per project so quiet projects are not flattened.
- **Ballpark journey.** Exact counts with three named denominators: of arrivals, of cohort (Q2 onward: those who answered Q1; sharing: those who finished), step to step. Lost sessions per step, a “where sessions stop” chart, and the never-started share called out as not a drop inside the game.
- **New charts (Ballpark).** Sessions by channel per day (stacked), session-length distribution, first-seen cohort heatmap (dashed = not yet observable, faded = fewer than 20 people).
- **Sharing lifecycle.** Grouped by phase (opportunity, intent, confirmed, attributable visit, recipient engagement), each row expandable to events, note and exactly what instrumentation is needed. Data-driven: new stages, breakdowns and events appear without layout changes.
- **Small Canon lifecycle** now uses the events that really exist in its database (`poster_preview`, `share`, `link_copy`, `poster_download`, `shelf_started`, `book_added`); recipient engagement is marked not observable.

## Verification on real PostHog (21 Nov 2026, Ballpark, 30 days, internal traffic excluded)

1. **Sequential journey.** My first version matched steps on first occurrence and undercounted. Replaced with PostHog-style ordered matching (`windowFunnel`, 6-hour window). Checked against an independent walk of all 3,863 raw events in JavaScript: identical at every step (104, 95, 89, 85, 77, 76, 4, 2 after the first-answer step). The old method gave 94, 88, 84, 74, 73.
2. **Sessions were inflated.** 324 “sessions” were 178 SDK sessions plus 146 footer-only session ids. Older cached footer versions (1.8.0, 1.8.1, 1.8.2) use their own session id because Ballpark does not expose `window.posthog`, so the footer cannot share the game’s session. The same visit appeared twice. Session analyses now use SDK sessions only for SDK sites. This also explains the 72 `google.com` (no www) sessions with zero starts: they were the footer halves of `www.google.com` SDK sessions.
3. **Native pageview discrepancy.** The game’s PostHog init uses `capture_pageview: 'history_change'` and only 4 of 178 SDK sessions have any `$pageview`. So bounce, entry pages and pages per session are not valid for Ballpark and are shown as unavailable. Footer `mw_pageview` remains the reliable view count. Fix options (app/footer changes, not in this PR): expose `window.posthog` so the footer shares the session, or have the footer read the SDK session from storage; send an explicit `$pageview` on load.
4. **Health statuses.** The earlier screenshots used a local mock of PostHog, so any tracking-health status in them (“stale”, “unregistered”, sending counts) was fake. Real status comes from the live health query; see the Health page on the deployed preview.
5. **Portfolio chart with real data.** Every Overview query ran on live PostHog and returned rows (17 sites, 4 days of history). With history that short, previous-period, week-ago and 7-day comparisons correctly report no data.
6. **Real-data render.** Screenshots in this PR remain from the local mock harness unless stated; the deployed preview needs the passphrase to render live numbers.

## Still open

- Hyl: sign in to the preview and check; set Small Canon env vars; GA4/Search Console steps in `google-integration-setup.md`.
- App changes (separate PRs): session sharing between footer and SDK; `$pageview` on load; share ids per `share-attribution-ids.md` (PR #20).
- Cohort heatmap, returning rate and comparisons gain meaning as history lengthens beyond 7 days.
