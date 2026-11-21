# Neon-backed historical Google archive (#26)

Project: **minorworks-stats** (`silent-paper-17420277`), `production` branch, `neondb` database, US East.
All analytics data is daily aggregates; no individual visitor identifiers, event bodies, query strings, or Google credentials are written here.

## Verified database setup (2026-11-21)

The schema in `docs/sql/stats-google-archive.sql` was run and validated on a Neon temporary migration branch, then successfully applied to production:
- `studio_stats.google_daily`: per-day Google data, idempotent composite primary key `(source,property,report_date)`.
- `studio_stats.google_import_runs`: audit log for backfill attempts.
- Both tables are in a private `studio_stats` schema; schema/table PUBLIC privileges revoked.
- No test rows were copied into production. Initial production counts: zero data rows, zero import runs.

## Next app-side step (Netlify configuration)

For the **minorworks.co** Netlify site, add ONE secret environment variable in **Production / Functions**:

```text
STATS_ARCHIVE_DATABASE_URL = <Neon pooled PostgreSQL connection string for production/neondb>
```

Get the value from Neon → project `minorworks-stats` → `production` → **Connect**. Choose **Pooled connection**, database `neondb`, and copy the `postgresql://...` URI. Never put the URI into chat, GitHub, browser JavaScript or screenshots.

No extra Node package is needed: this implementation uses Neon's SQL-over-HTTPS protocol with built-in Node.js `fetch`, parameterized SQL, and a server-only `Neon-Connection-String` header. Validate the hosted Netlify build and round trip in a Deploy Preview before enabling writes. HTTP/TLS access is restricted to a `*.neon.tech` host.

**Keep imports off initially.** `STATS_ARCHIVE_ENABLED` defaults to false. After reviewing and deploying the PR with the database URI configured:
1. Authenticated POST `/api/stats/google/archive` JSON `{"action":"status","passphrase":"<your existing stats passphrase>"}` verifies the database connection, table access, and current row count without writing anything. Do this from a private client; never paste the passphrase publicly.
2. When status succeeds, approve the initial backfill and set `STATS_ARCHIVE_ENABLED=true` in Netlify Production Functions and redeploy.
3. Authenticated POST with `{"action":"import","passphrase":"<passphrase>","confirm":true}` requests 365 days of all configured Google properties and upserts existing daily rows. The response contains coverage, source statuses and rows written. Google API errors block the import; a property with no rows is flagged, not filled with fabricated zeroes.
4. Cross-check GA4 daily session/view totals and GSC date sums against live Google data; confirm 2nd run is idempotent (same row count).
5. Only after these validations, implement and approve a protected scheduled refresh with status monitoring. Schedule code is **not deployed** by this PR.

## Review notes

- Current annual GA4 active users are unique per range, but stored `daily_active_users` cannot be summed to reconstruct those unique users.
- Google reports end yesterday (Boston local day), and Search Console final data can lag. A daily job should re-import recent 7–14 days for corrections.
- Client-side PostHog session counts and GA4 sessions have different definitions; never add them.
- The SQL-over-HTTPS adapter is intentionally small and dependency-free. If later adopting the official `@neondatabase/serverless` driver, change and lock dependencies together, test without breaking Next.js 14 Netlify builds.
- Do not mark issue #26 complete until storage connection, one successful backfill and scheduled updates are tested.
