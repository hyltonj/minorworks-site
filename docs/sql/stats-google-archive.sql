-- Applied to Neon project silent-paper-17420277 (production / neondb).
-- Separate private schema, with no visitor identifiers or query strings.
-- Safe to rerun; migration was tested on a Neon temporary branch.
CREATE SCHEMA IF NOT EXISTS studio_stats;
REVOKE ALL ON SCHEMA studio_stats FROM PUBLIC;

CREATE TABLE IF NOT EXISTS studio_stats.google_daily (
  source text NOT NULL CHECK (source IN ('ga4','gsc')),
  property text NOT NULL,
  report_date date NOT NULL,
  site text NOT NULL,
  reporting_timezone text NOT NULL DEFAULT 'America/New_York',
  daily_active_users integer,
  sessions integer,
  pageviews integer,
  clicks integer,
  impressions integer,
  imported_at timestamptz NOT NULL DEFAULT now(),
  schema_version integer NOT NULL DEFAULT 1,
  PRIMARY KEY (source, property, report_date),
  CONSTRAINT nonnegative_counts CHECK (
    (daily_active_users IS NULL OR daily_active_users >= 0)
    AND (sessions IS NULL OR sessions >= 0)
    AND (pageviews IS NULL OR pageviews >= 0)
    AND (clicks IS NULL OR clicks >= 0)
    AND (impressions IS NULL OR impressions >= 0)
  )
);
CREATE INDEX IF NOT EXISTS google_daily_site_date_idx
  ON studio_stats.google_daily (site, report_date DESC);

CREATE TABLE IF NOT EXISTS studio_stats.google_import_runs (
  run_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL CHECK (status IN ('started','success','partial','failed')),
  window_days integer NOT NULL,
  rows_upserted integer NOT NULL DEFAULT 0,
  coverage jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_code text
);

REVOKE ALL ON ALL TABLES IN SCHEMA studio_stats FROM PUBLIC;
COMMENT ON TABLE studio_stats.google_daily IS
  'Private daily Google GA4/GSC aggregates; never person-level records.';
