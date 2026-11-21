-- Run once in a dedicated/approved private Supabase Postgres project.
-- Studio Stats Google summary archive. No public/browser access.
create table if not exists public.stats_google_daily (
  source text not null check (source in ('ga4','gsc')),
  property text not null,
  report_date date not null,
  site text not null,
  timezone text not null default 'America/New_York',
  daily_active_users integer,
  sessions integer,
  pageviews integer,
  clicks integer,
  impressions integer,
  imported_at timestamptz not null default now(),
  schema_version integer not null default 1,
  primary key(source,property,report_date),
  constraint stats_google_daily_nonnegative check (
    (daily_active_users is null or daily_active_users>=0)
    and (sessions is null or sessions>=0)
    and (pageviews is null or pageviews>=0)
    and (clicks is null or clicks>=0)
    and (impressions is null or impressions>=0)
  )
);
create index if not exists stats_google_daily_site_date on public.stats_google_daily (site,report_date);
alter table public.stats_google_daily enable row level security;
-- No anon/authenticated policies. All writes through server-only service-role.
revoke all on public.stats_google_daily from anon, authenticated;
comment on table public.stats_google_daily is 'Private per-source aggregate Google history; no individual tracking or query strings.';
