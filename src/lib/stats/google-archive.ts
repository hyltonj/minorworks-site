import "server-only";
import { googleReports } from "@/lib/stats/google";

/**
 * Neon PostgreSQL's documented SQL-over-HTTPS protocol, using native fetch.
 * Next.js 14 + Netlify Node runtime; no client bundle or extra npm dependency.
 * This is deliberately server-only, parameterized, and restricted to a Neon host.
 */
type SqlResponse = { rows?: Record<string, unknown>[] };
function neonConnection() {
  const raw = process.env.STATS_ARCHIVE_DATABASE_URL || "";
  if (!raw) throw Error("archive_database_not_configured");
  let u: URL;
  try { u = new URL(raw); } catch { throw Error("archive_database_invalid_url"); }
  if (!["postgres:", "postgresql:"].includes(u.protocol)
      || !u.hostname.endsWith(".neon.tech")
      || !u.username || !u.password || !u.pathname || u.pathname === "/") {
    throw Error("archive_database_invalid_url");
  }
  return { connectionString: raw, endpoint: `https://${u.hostname}/sql` };
}
async function query<T extends Record<string, unknown>>(statement: string, params: unknown[] = []): Promise<T[]> {
  const {connectionString,endpoint} = neonConnection();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Neon-Connection-String": connectionString },
    body: JSON.stringify({query: statement, params}),
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  });
  // Do not expose Neon response bodies, credentials, or SQL containing private data.
  if (!response.ok) throw Error(`archive_database_http_${response.status}`);
  const data = await response.json() as SqlResponse;
  if (!Array.isArray(data.rows)) throw Error("archive_database_bad_response");
  return data.rows as T[];
}

type Row = {
  source:"ga4"|"gsc"; property:string; report_date:string; site:string;
  reporting_timezone:"America/New_York"; daily_active_users:number|null;
  sessions:number|null; pageviews:number|null; clicks:number|null;
  impressions:number|null; imported_at:string; schema_version:1;
};
type Coverage = {site:string;source:"ga4"|"gsc";property:string|null;status:string;rows:number};

/** Returns aggregate coverage only. No analytics identities or keys. */
export async function archiveStatus() {
  const results = await query<{ total:string; latest:string|null }>(
    "SELECT count(*)::text AS total, max(imported_at)::text AS latest FROM studio_stats.google_daily"
  );
  return { configured:true, rows:Number(results[0]?.total||0), lastImport:results[0]?.latest||null };
}

const UPSERT = `
INSERT INTO studio_stats.google_daily
(source, property, report_date, site, reporting_timezone, daily_active_users,
 sessions, pageviews, clicks, impressions, imported_at, schema_version)
SELECT source, property, report_date, site, reporting_timezone, daily_active_users,
       sessions, pageviews, clicks, impressions, imported_at, schema_version
FROM jsonb_to_recordset($1::jsonb) AS incoming(
  source text, property text, report_date date, site text, reporting_timezone text,
  daily_active_users integer, sessions integer, pageviews integer,
  clicks integer, impressions integer, imported_at timestamptz, schema_version integer
)
ON CONFLICT (source, property, report_date) DO UPDATE SET
  site=EXCLUDED.site, reporting_timezone=EXCLUDED.reporting_timezone,
  daily_active_users=EXCLUDED.daily_active_users, sessions=EXCLUDED.sessions,
  pageviews=EXCLUDED.pageviews, clicks=EXCLUDED.clicks,
  impressions=EXCLUDED.impressions, imported_at=EXCLUDED.imported_at,
  schema_version=EXCLUDED.schema_version
RETURNING report_date
`;

/** Manual, idempotent import. Cron is NOT enabled by this function. */
export async function importGoogleHistory(days:14|365=365) {
  if (process.env.STATS_ARCHIVE_ENABLED !== "true") throw Error("archive_disabled");
  neonConnection(); // fail before any Google requests if connection not configured
  const report = await googleReports(days);
  if (!report.configured) throw Error("google_reporting_not_configured");
  const coverage:Coverage[] = [];
  const rows:Row[] = [];
  const now = new Date().toISOString();
  for (const site of report.sites) {
    coverage.push({site:site.id,source:"ga4",property:site.ga4Property,status:site.ga4.status,rows:site.ga4.daily?.length||0});
    coverage.push({site:site.id,source:"gsc",property:site.gscProperty,status:site.gsc.status,rows:site.gsc.daily?.length||0});
    if (site.ga4.status==="connected" && site.ga4Property) for (const day of site.ga4.daily||[]) {
      rows.push({
        source:"ga4",property:site.ga4Property,report_date:day.date,site:site.id,
        reporting_timezone:"America/New_York",daily_active_users:day.users,
        sessions:day.sessions,pageviews:day.views,clicks:null,impressions:null,
        imported_at:now,schema_version:1,
      });
    }
    if (site.gsc.status==="connected" && site.gscProperty) for (const day of site.gsc.daily||[]) {
      rows.push({
        source:"gsc",property:site.gscProperty,report_date:day.date,site:site.id,
        reporting_timezone:"America/New_York",daily_active_users:null,
        sessions:null,pageviews:null,clicks:day.clicks,impressions:day.impressions,
        imported_at:now,schema_version:1,
      });
    }
  }
  // A 'no_data' GA4 property (such as Venny prior to fixing its tag) is a documented
  // gap, not a fake zero. But actual API errors/missing properties fail closed.
  if (coverage.some(c=>c.status==="error" || c.status==="missing"))
    return {ok:false,reason:"source_unavailable",coverage,rowsWritten:0};
  if (!rows.length) return {ok:false,reason:"no_aggregate_rows",coverage,rowsWritten:0};
  const [record] = await query<{run_id:string}>(
    "INSERT INTO studio_stats.google_import_runs(status, window_days, coverage) VALUES ('started',$1,$2::jsonb) RETURNING run_id",
    [days,JSON.stringify(coverage)]
  );
  if (!record?.run_id) throw Error("archive_run_not_created");
  let written=0;
  try {
    for (let i=0;i<rows.length;i+=150) {
      const result=await query(UPSERT,[JSON.stringify(rows.slice(i,i+150))]);
      written+=result.length;
    }
    await query(
      "UPDATE studio_stats.google_import_runs SET status='success', finished_at=now(), rows_upserted=$2 WHERE run_id=$1",
      [record.run_id,written]
    );
  } catch {
    // If the storage write failed partway, the next import is safe to retry.
    try {
      await query(
        "UPDATE studio_stats.google_import_runs SET status='partial', finished_at=now(), rows_upserted=$2, error_code='write_failed' WHERE run_id=$1",
        [record.run_id,written]
      );
    } catch { /* surface the original failure; don't log credentials */ }
    throw Error("archive_write_failed");
  }
  return {ok:true,rowsWritten:written,coverage,importedAt:now,windowDays:days};
}
