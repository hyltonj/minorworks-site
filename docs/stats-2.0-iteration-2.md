# Studio Stats 2.0 — iteration 2 (PR #19)

Scope: visual redesign, corrected journey definitions, sharing lifecycle, validation. No app changes outside `/stats` and its APIs.

## 1. Before / after

| Area | Before | After |
|---|---|---|
| Frame | Single column, top header | Navy sidebar (top tabs on phones), warm neutral ground, serif titles |
| Overview | Stacked full-width panels | KPI tiles with sparklines, stacked daily bars + donut, products-at-a-glance table, biggest movers, health strip |
| Sites | Card grid | Sortable dense table with 14-day sparklines and status dots; optional card view |
| Ballpark | Long list of full-width sections | 6 KPI tiles, daily activity + visit heatmap, sequential journey + drop-off by question, independent activity, acquisition vs completion, sharing lifecycle, 3-up acquisition/pages/audience, retention + data quality, collapsed detail |
| Health, Search | Absent | New pages (instrumentation health; Search Console readiness) |
| Palette | — | Kept: navy / blue / warm neutral / restrained red |

## 2. Metric corrections

- **A. Sequential journey** (sessions, ordered): Arrival → Q1…Q5 answered → Game completed → Share initiated → Share confirmed. A session counts at a step only if it reached it after the previous step. Step-to-step % is shown only here.
- **B. Independent activity**: events, distinct people, distinct sessions, events per person. Explicitly not a funnel; rows are not ratios of each other.
- "Game started" is not a funnel step: in about a third of sessions the first guess is recorded before `bp_set_started`, so its order cannot be trusted. Guess events (`question_index` 1–5) are used instead.
- Retention: "returning" shows "History shorter than range" when PostHog history (from 18 Nov) is shorter than the selected range; new-people return rate shows "too few" below 30 people. No misleading zeros: pre-history days are `n/a`.

> **Superseded by iteration 3** (`stats-2.0-iteration-3.md`): the journey numbers below counted first occurrences and footer session ids. Corrected figures are in that file.

## 3. Validation on real PostHog (30 days, internal traffic excluded, ballpark)

All new queries (journey, activity, lifecycle, reshare, coverage, byDevice, bySource, dailyBySite) run on the live project. Results at time of run:

- Journey (sessions): Arrival 324 → Q1 104 → Q2 94 → Q3 88 → Q4 84 → Q5 74 → Completed 73 → Share initiated 4 → Share confirmed 2.
- Independent: start events 280 / 107 people / 132 sessions; finish events 127 / 72 / 78; guesses 700 / 97 / 106.
- Completion by device (sessions): mobile 175 (70 started, 41 finished), desktop 148 (62, 37).
- Acquisition: sessions arriving from `www.google.com` start 76 of 100 and finish 58; `google.com` (no www) shows 72 sessions and 0 starts, which looks like crawler or prefetch traffic. **Open question** to check before treating it as human acquisition.
- Shared-link sessions: 2 (2 started, 1 finished). Reshare: 2 people arrived via a share, 0 shared afterwards. Too small to read.
- Pageview coverage since 21 Nov 14:00 UTC: 9 footer `mw_pageview` vs 5 native `$pageview`; 5 of 9 sessions have a pageview; 4 of 6 SDK sessions. The mismatch persists. Likely cached game bundles; re-check once bundles turn over.
- Boundaries: native-session metrics gated to 21 Nov 05:00 UTC, custom events from 18 Nov; internal filter excludes `is_internal = 'true'`, netlify/vercel/localhost hosts.

Screenshots in the PR conversation use **mock data** (local mock of the PostHog endpoint); the SQL above was validated separately on real data.

## 4. Sharing lifecycle (Ballpark, Small Canon, Venny)

Kinds: **intent** (button, sheet opened), **confirmed browser action** (copy succeeded, native share resolved), **attributable visit** (shared link opened), **engagement** (recipient played, created, re-shared). Opening a share sheet is never counted as a send.

| # | Stage | Ballpark | Small Canon | Venny |
|---|---|---|---|---|
| 1 | Opportunity presented | `share_card_viewed` (measured) | `poster_preview` (partial) | `share_card_viewed` equivalent (partial) |
| 2 | Button clicked | `share_pressed` / `bp_share_pressed` (measured) | `share` (measured) | `share_sent` (measured) |
| 3 | Interface opened | not observable | not observable | not observable |
| 4 | Method selected | `method` property on completion only (partial) | not observable | partial |
| 5 | Link copied | `share_completed` method=copy | `link_copy` | partial |
| 6 | Native share resolved | `share_completed` method=native (completed only; dismissal invisible) | n/a | partial |
| 7 | Shared link opened | `shared_link_opened` (type only, own-link excluded) | not observable (no marker) | partial (`share_id` exists in code) |
| 8 | Recipient engaged | `started_from_share` | `landing_view`, `remix_open` (not tied to a share) | partial |
| 9 | Recipient played/created/completed | `completed_from_share` | `shelf_started`, `book_added` (not tied) | `puzzle_completed` (not tied) |
| 10 | Recipient re-shared | same person arrived via share then pressed share (same browser) | not observable | not observable |

## 5. Instrumentation proposals (no app changes in this PR)

1. **Opaque share id** (all products): random `sid` generated client-side when a share is created, appended to the link as `?sid=`, emitted on the sender's press/completed events and on the recipient's arrival. Gives share → visit → engagement → re-share linkage without any recipient or message tracking. Not a person id; rotates per share.
2. **Ballpark**: emit `bp_share_sheet_opened`, `bp_share_dismissed` where the platform reports them; always send `bp_set_started` before the first guess; drop the `questions_total: 0` variant of `bp_question_viewed`.
3. **Small Canon**: add `?s=poster` plus `sid` to poster links; send `poster_viewed_from_share` and `shelf_started` with `from_share=true` so "do poster viewers create their own" is measurable. Send `poster_preview` to the Supabase events table.
4. **Venny**: wire the existing `share_id` / `gift_id` into the link and the recipient's first event.
5. **Journeys in PostHog**: dashboard "Explore" buttons deep link to a PostHog funnel (ordered, by session, 6 h window), user paths and raw events, so no second analytics engine is built. The deep-link format is untested until a signed-in PostHog click-through.

## 6. Small Canon history

The Small Canon stats function is read-only; history is merged from Shelf Life (from 18 Oct) and Small Canon (from 3 Nov). Needs `SMALLCANON_STATS_URL` and `SMALLCANON_STATS_PASSWORD` set in Netlify (Hyl sets). The rename is annotated as a measurement change.

## 7. GA4 and Search Console plan (not a blocker)

- GA4 reports fewer visitors than PostHog. Correction (iteration 3): Ballpark does load `gtag` from its own bundle, so “games do not load it” was wrong. Remaining candidates: consent/GPC/DNT gating, blockers, definitions. See `google-integration-setup.md`.
- Plan: one Google Cloud service account with read-only access, added as a Viewer on the GA4 property and as a user on each Search Console property (domain properties preferred); server-side only; credentials stored as Netlify env vars set by Hyl. Needs approval before any credential or permission is created. Check property coverage and history start per site first.

## 8. Remaining blockers and decisions

- Hyl: set Small Canon env vars; approve GA4/GSC service account; sign in to the deploy preview and check numbers.
- Investigate `google.com` (no www) sessions with zero starts.
- Ballpark/Venny native `$pageview` coverage after cached bundles turn over.
- Per Capita / Outlier CSP; Winthrop Cipher footer; passphrase change; `games-clean` Vercel failure.
- Decide whether to approve the opaque `sid` proposal (touches game apps).
