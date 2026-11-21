# GA4 and Search Console: read-only setup

Goal: Studio Stats reads GA4 and Search Console numbers server-side, so they can sit beside PostHog and so the gap between them can be explained. Nothing here has been created yet. Every step below is yours to approve and perform; no secret ever goes into chat or the repo.

## What gets created (all read-only)

| Item | Where | Permission |
|---|---|---|
| One Google Cloud project (reuse an existing one if you prefer) | console.cloud.google.com | none beyond owner |
| Two APIs enabled: Google Analytics Data API and Google Search Console API | APIs & Services > Library | none |
| One service account `stats-reader` | IAM & Admin > Service accounts | **no IAM roles at all** |
| Access for that account's email on each GA4 property | GA4 Admin > Property access management | **Viewer** (lowest role that can run reports) |
| Access for that email on each Search Console property | Search Console > Settings > Users and permissions | **Restricted** (read-only) |

OAuth scopes the server will request: `https://www.googleapis.com/auth/analytics.readonly` and `https://www.googleapis.com/auth/webmasters.readonly`. Neither can change a property, a user list, a tag or a sitemap.

## Steps

1. **Project and APIs.** In Google Cloud pick or create a project. Open APIs & Services > Library and enable *Google Analytics Data API* and *Google Search Console API*.
2. **Service account.** IAM & Admin > Service accounts > Create. Name `stats-reader`. Skip the optional "grant access" and "grant users access" steps. Copy the account email (looks like `stats-reader@PROJECT.iam.gserviceaccount.com`).
3. **Key.** On the account open Keys > Add key > JSON. A file downloads. If the console refuses because of an organisation policy (`iam.disableServiceAccountKeyCreation`), stop and tell me; the alternative is a short-lived OAuth refresh token and I will write that variant instead.
4. **GA4 access.** For each property: Admin > Property access management > + > Add users. Paste the service-account email. Role **Viewer**. Untick "notify". Do this for every property that has one of our sites (see "Which properties" below).
5. **Search Console access.** For each property: Settings > Users and permissions > Add user. Paste the email. Permission **Restricted**. Prefer *domain* properties (`minorworks.co`, `playballpark.app`, `playvenny.app` and so on) because one domain property covers all subdomains and both http and https.
6. **Netlify variables** (Site configuration > Environment variables, scope: Functions and Runtime, also for Deploy Previews):
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: paste the *entire* JSON file contents. Mark it **Contains secret values**. This is the only place the key lives. Delete the downloaded file afterwards.
   - `GA4_PROPERTIES`: JSON mapping our site ids to numeric property ids, for example `{"ballpark":"123456789","minorworks.co":"987654321"}`. Property ids are not secret.
   - `GSC_SITES`: JSON mapping site ids to Search Console property names, for example `{"ballpark":"sc-domain:playballpark.app"}`.
7. **Tell me when done.** I then add the server adapter (JWT signed with Node crypto, no new dependencies, 15-minute cache, `runReport` and `searchanalytics.query` only), fill the Search page and add a GA4-vs-PostHog comparison per site and day.

## Which properties

I cannot see your GA4 account. Please send me, per site, the GA4 property id (Admin > Property settings) or tell me a site has none. Known so far: the footer loads GA4 only when a site sets `data-ga="load"`, and Ballpark’s own bundle also loads `gtag`. Property coverage and history start dates matter: GA4 only reports from the day a property was created.

## Why GA4 reports fewer visitors than PostHog (to test once connected)

- Consent and privacy gating: the footer respects Global Privacy Control, Do Not Track, opt-out and EU consent before loading GA4; PostHog events do not wait on those.
- Ad and tracker blockers block `googletagmanager.com` far more often than a first-party-proxied PostHog.
- Not every site loads GA4 at all (footer switch), and games can load it from their own bundle on a different schedule.
- Definitions differ: GA4 counts *active users* (engaged or first-visit sessions) and drops known bots; PostHog counts *people* with any event.
- Time zone: GA4 uses the property time zone; Stats uses Boston days.

The comparison will show both numbers per day with the ratio, so a stable ratio (blockers) is distinguishable from a broken tag (ratio collapsing on one day).

## Verification checklist

- Service account email appears under Viewer in GA4 and Restricted in Search Console, and nowhere else.
- No IAM roles on the service account.
- `GOOGLE_SERVICE_ACCOUNT_JSON` is marked secret and absent from the repo and from build logs.
- `/stats/search` shows connected status per site; a deliberately wrong property id shows an error and not zeros.

## Small Canon database connection

The `stats` Supabase function is read-only and protected. To light up the Small Canon section and its history:

1. Netlify variable `SMALLCANON_STATS_URL`: the function URL, `https://oxhnvrslhnzplagzbiee.supabase.co/functions/v1/stats`.
2. Netlify variable `SMALLCANON_STATS_PASSWORD`: the function’s existing password (Supabase > Edge Functions > Secrets, name `STATS_PASSWORD`). Mark it secret.
3. Redeploy. Until both are set the section says "Not connected yet".

History verified read-only in the database on 21 Nov 2026: Shelf Life 18 Oct to 3 Nov (528 real events, 170 visitors) and Small Canon from 3 Nov (208 real events, 130 visitors); test rows are flagged and excluded.
