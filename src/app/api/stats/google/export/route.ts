import { NextResponse } from "next/server";
import { gate, JSON_HEADERS } from "@/lib/stats/server";
import { googleReports } from "@/lib/stats/google";

export const dynamic = "force-dynamic";

/**
 * Downloadable, read-only annual aggregate snapshot.
 * This deliberately does NOT pretend to be a durable archive: the owner must
 * download and retain the result until a storage backend is selected.
 */
export async function POST(request: Request) {
  let input: {passphrase?: string} = {};
  try { input = await request.json(); } catch { /* gate handles missing passphrase */ }
  const denied = await gate(input.passphrase);
  if (denied) return denied;

  try {
    const report = await googleReports(365);
    if (!report.configured) return NextResponse.json(
      {error: "google_not_configured"}, {status:503,headers:JSON_HEADERS}
    );
    const generatedAt = new Date().toISOString();
    const rows = report.sites.flatMap(site => {
      const ga4 = site.ga4.status === "connected" ? (site.ga4.daily || []).map(d => ({
        source: "ga4" as const, property: site.ga4Property, site:site.id, date:d.date,
        users_daily:d.users, sessions:d.sessions, pageviews:d.views,
        clicks:null, impressions:null,
      })) : [];
      const gsc = site.gsc.status === "connected" ? (site.gsc.daily || []).map(d => ({
        source:"gsc" as const, property:site.gscProperty, site:site.id, date:d.date,
        users_daily:null, sessions:null, pageviews:null,
        clicks:d.clicks, impressions:d.impressions,
      })) : [];
      return [...ga4,...gsc];
    });
    const coverage=report.sites.flatMap(site=>[
      {site:site.id,source:"ga4",property:site.ga4Property,status:site.ga4.status,rows:site.ga4.daily?.length||0,
        earliest:site.ga4.daily?.[0]?.date||null,latest:site.ga4.daily?.at(-1)?.date||null},
      {site:site.id,source:"gsc",property:site.gscProperty,status:site.gsc.status,rows:site.gsc.daily?.length||0,
        earliest:site.gsc.daily?.[0]?.date||null,latest:site.gsc.daily?.at(-1)?.date||null},
    ]);
    const snapshot={
      schema_version:1,
      generated_at:generatedAt,
      reporting_time_zone:"America/New_York",
      window:"365 days ending yesterday (Boston local time)",
      sources:{
        ga4:"Google Analytics Data API: daily activeUsers, sessions, screenPageViews. Daily active users must NOT be summed into period-unique users.",
        gsc:"Search Console API: finalized daily search clicks/impressions. Omitted days indicate no returned row, NOT proven zero traffic; recent results may be delayed.",
      },
      privacy:"Aggregated daily counts only. No visitors, user IDs, events, query text, access tokens, or private keys.",
      storage_status:"manual export only; not stored in the Studio Stats backend",
      coverage,
      rows,
    };
    // No-store and attachment prevent browser caching or inline disclosure.
    return new Response(JSON.stringify(snapshot,null,2),{
      status:200,
      headers:{...Object.fromEntries(new Headers(JSON_HEADERS).entries()),
        "Content-Type":"application/json; charset=utf-8",
        "Cache-Control":"private, no-store",
        "Content-Disposition":`attachment; filename="minorworks-google-aggregate-${generatedAt.slice(0,10)}.json"`},
    });
  } catch {
    return NextResponse.json({error:"google_archive_export_unavailable"}, {status:502,headers:JSON_HEADERS});
  }
}
