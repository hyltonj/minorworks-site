# Private Google history store — optional phase two of #26

This change adds an **off-by-default** one-year historical backfill, not a live scheduled job. It complements the existing owner-only manual JSON export from PR #31.

## Why off by default?
The Minor Works Studio Stats repository does not include an approved private persistent database connection. The game repo has a separate Supabase schema for Venny users; do **not** reuse that application database without explicit approval. No Google credential or Supabase key belongs in GitHub or public client code.

## Setup when an appropriate Supabase project is approved
1. Run `docs/sql/stats-google-archive.sql` in its SQL editor. The private table has RLS enabled and no anon/authenticated policies.
2. In the **Minor Works Netlify project, Functions scope, Production context only**, set:
   - `STATS_ARCHIVE_SUPABASE_URL` — project HTTPS URL, e.g. `https://YOURPROJECT.supabase.co`;
   - `STATS_ARCHIVE_SUPABASE_SERVICE_ROLE_KEY` — secret server-only key (never in screenshots/chat);
   - `STATS_ARCHIVE_ENABLED=true` only after review/approval.
3. Trigger a new production deployment to load the variables.
4. Invoke protected POST `/api/stats/google/archive` with `{"passphrase":"[existing Studio Stats passphrase]","confirm":true}` from an owner-controlled authenticated environment. Do not paste the passphrase in public issue comments.
5. Verify source coverage and upsert counts. Rerunning is idempotent by `(source, property, report_date)`.

This endpoint returns only counts/status and no private credentials. It fails closed on per-source errors. Zero-activity GA4 is not mistaken for a healthy tracking setup. `no_data` properties are captured in coverage but do not create imaginary daily zeros.

## Next required development
- Choose approved storage destination and validate first run.
- Add private server-side read endpoint and archive freshness display (avoid public Supabase access).
- Schedule nightly import **only after owner approval**; re-read the last 7–14 days on each run to capture reporting revisions. GA4 daily unique users cannot be summed to claim monthly unique users.
- Add audits for import failure, missing dates, runtime quota, GA4 property changes, data retention and GSC latency. Keep PostHog metrics separate.
- Extend backfill beyond 365 days using explicit bounded date windows after validation; this first phase is a rolling 365-day snapshot.

No cron/task was installed by this PR, and no database writes can happen without the three configuration variables and an explicit owner request.
