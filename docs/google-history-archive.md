# Google historical daily aggregates: export and durable-archive contract

Tracking issue: #26. This PR implements an **authenticated manual export**, not automatic durable storage. Do not call #26 closed after merging this phase.

## Current capability

- `/stats/search` exposes **Export historical data**, calling `POST /api/stats/google/export` with the same passphrase gate as Studio Stats.
- The endpoint performs the existing read-only GA4 and Search Console calls for 365 days (all currently mapped properties). It never exports Google credentials or visitor-level records.
- It returns versioned JSON with site, source, property, date, requested metrics, time zone and generation time; an accompanying coverage manifest contains statuses and date bounds.
- Access requires the private Studio Stats passphrase. Response uses attachment and no-store headers.
- This export does **not** write to storage or run automatically. The owner must retain the downloaded file.

## Daily row semantics

The natural deduplication key is `(source, property, date)`. Proposed future table:

```sql
create table google_daily_metrics (
  source text not null check (source in ('ga4','gsc')),
  property text not null,
  site text not null,
  report_date date not null,
  timezone text not null default 'America/New_York',
  users_daily integer,
  sessions integer,
  pageviews integer,
  clicks integer,
  impressions integer,
  imported_at timestamptz not null default now(),
  schema_version integer not null default 1,
  primary key (source, property, report_date)
);
```

**No missing-date zero fill.** A missing row can reflect an API omission, no traffic, incomplete reporting, or no historic coverage; distinguish these before charting. GA4 daily active users cannot be summed to get period-unique users. GSC query/page summaries are not fully additive because privacy truncation and anonymization can apply. GSC clicks need not equal GA4 sessions.

## Proposed next phase after selecting a store

1. Choose an existing secure approved database where feasible (do not invent one). Restrict write rights to a server-side task credential; no public read/write exposure.
2. Backfill in monthly or <=365-day windows with explicit earliest dates, stable deduplication, and count reconciliation. Do not infer missing dates are zeros.
3. Nightly scheduled refresh with re-import of the preceding 7–14 days for late adjustments; alert on authentication failure, missing rows and sudden source gaps. Monitor cost and Google API quotas.
4. Add data-freshness and coverage modules to /stats and use stored aggregates for historical charts, leaving real-time PostHog and GA4 comparisons source-labelled.
5. Confirm storage, retention policy, access logs and rollback; test an idempotent rerun before enabling scheduling.

The current API's reporting window ends yesterday in America/New_York. Search Console finalized rows often lag 2–3 days. Source-level `connected` does not prove that a particular site is properly instrumented (see Venny #28).
