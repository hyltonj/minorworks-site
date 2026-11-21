import "server-only";
import { googleReports } from "@/lib/stats/google";

type Row = {
  source: "ga4" | "gsc"; property:string; report_date:string; site:string; timezone:string;
  daily_active_users:number|null; sessions:number|null; pageviews:number|null;
  clicks:number|null; impressions:number|null; imported_at:string; schema_version:1;
};
type Coverage = {site:string;source:"ga4"|"gsc";property:string|null;status:string;rows:number};

function config() {
  const url=process.env.STATS_ARCHIVE_SUPABASE_URL?.replace(/\/$/,"");
  const key=process.env.STATS_ARCHIVE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
    throw new Error("Archive store is not configured with an approved HTTPS Supabase endpoint.");
  return {url,key};
}

/**
 * Server-only idempotent backfill. Deliberately not scheduled or automatically
 * invoked. Caller must explicitly enable archive writes and approve this run.
 */
export async function importGoogleYear() {
  if (process.env.STATS_ARCHIVE_ENABLED!=="true")
    throw new Error("Archive writes are disabled.");
  const {url,key}=config();
  const report=await googleReports(365);
  if (!report.configured) throw new Error("Google reporting is not configured.");
  const now=new Date().toISOString();
  const coverage:Coverage[]=[];
  const rows:Row[]=[];
  for (const site of report.sites) {
    coverage.push({site:site.id,source:"ga4",property:site.ga4Property,status:site.ga4.status,rows:site.ga4.daily?.length||0});
    coverage.push({site:site.id,source:"gsc",property:site.gscProperty,status:site.gsc.status,rows:site.gsc.daily?.length||0});
    if(site.ga4.status==="connected" && site.ga4Property){
      for(const day of site.ga4.daily||[]) rows.push({
        source:"ga4",property:site.ga4Property,site:site.id,report_date:day.date,timezone:"America/New_York",
        daily_active_users:day.users,sessions:day.sessions,pageviews:day.views,
        clicks:null,impressions:null,imported_at:now,schema_version:1,
      });
    }
    if(site.gsc.status==="connected" && site.gscProperty){
      for(const day of site.gsc.daily||[]) rows.push({
        source:"gsc",property:site.gscProperty,site:site.id,report_date:day.date,timezone:"America/New_York",
        daily_active_users:null,sessions:null,pageviews:null,
        clicks:day.clicks,impressions:day.impressions,imported_at:now,schema_version:1,
      });
    }
  }
  // Fail closed: refuse partial Google source errors, to avoid a misleading
  // successful archive run that silently excludes a property.
  if (coverage.some(c=>c.status==="error" || c.status==="missing"))
    return {ok:false,reason:"source_unavailable",coverage,rowsWritten:0};
  if (!rows.length) return {ok:false,reason:"no_aggregate_rows",coverage,rowsWritten:0};
  let written=0;
  for(let i=0;i<rows.length;i+=150) {
    const r=await fetch(`${url}/rest/v1/stats_google_daily?on_conflict=source,property,report_date`,{
      method:"POST",
      headers:{
        apikey:key,Authorization:`Bearer ${key}`,
        "Content-Type":"application/json",
        Prefer:"resolution=merge-duplicates,return=minimal",
      },
      body:JSON.stringify(rows.slice(i,i+150)),
      cache:"no-store",signal:AbortSignal.timeout(20000),
    });
    if(!r.ok) throw new Error(`Archive storage returned HTTP ${r.status} after ${written} rows; rerun is safe (upsert).`);
    written+=Math.min(150,rows.length-i);
  }
  return {ok:true,rowsWritten:written,coverage,importedAt:now,windowDays:365};
}
