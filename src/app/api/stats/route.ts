import { NextResponse } from "next/server";
import { DAY, DEV, JSON_HEADERS, boundaryMs, classify, gate, hq, inList, n, pool, s, smallCanon, windowFor } from "@/lib/stats/server";
import { NATIVE_BOUNDARY, POSTHOG_HISTORY_START, SITES } from "@/lib/stats/model";

// Read-only studio stats for /stats. The passphrase, the PostHog key and the Small Canon password live in Netlify
// environment variables (STATS_PASSPHRASE, POSTHOG_PERSONAL_API_KEY, SMALLCANON_STATS_URL, SMALLCANON_STATS_PASSWORD).
// Nothing here is cached by the browser or by search engines.

export const dynamic = "force-dynamic";

const PLAYS = "('bp_set_started', 'puzzle_started')";
// Things people share from a game. Taps, not confirmed sends: browsers rarely say if a share finished.
// did_you_know_share is left out on purpose: Ballpark sends it when a card preview opens, not on a share.
const SHARES = "('bp_share_pressed', 'share_pressed', 'share_sent', 'daily_puzzle_shared')";
const FROM_SHARE = "('daily_puzzle_started_from_share', 'started_from_share', 'shared_link_opened')";
const FINISHES = "('bp_set_completed', 'puzzle_solved')";
// Footer and tracking plumbing: everything else a site sends is product activity.
const INFRA = inList([
  "mw_pageview", "mw_scroll", "mw_engaged", "footer_view", "footer_click", "mw_outbound", "$pageview", "$pageleave",
  "$create_alias", "$set", "$identify", "mw_debug_probe", "contact_click", "contact_submit",
]);
const CONVERSIONS = ["margin_chrome_store_click", "contact_click", "contact_submit", "footer_click", "mw_outbound"];

type Cache = { at: number; days: number; internal: boolean; body: unknown };
let cache: Cache | null = null;

async function build(days: number, includeInternal: boolean) {
  const W = windowFor(days, includeInternal);
  const { cur, prev, span, real: REAL_ } = W;
  const realAll = windowFor(days, true).real; // health ignores the internal-traffic switch

  const T: Record<string, () => Promise<unknown[][]>> = {
    head: () => hq("head", `select
            uniqIf(person_id, ${cur}), uniqIf(person_id, ${prev}),
            countIf(event = 'mw_pageview' and ${cur}), countIf(event = 'mw_pageview' and ${prev}),
            countIf(event in ${PLAYS} and ${cur}), countIf(event in ${PLAYS} and ${prev}),
            countIf(event in ${FINISHES} and ${cur}), countIf(event in ${FINISHES} and ${prev}),
            countIf(event = '$create_alias' and ${cur}), countIf(event = '$create_alias' and ${prev})
          from events where ${span} and ${REAL_}`),
    daily: () => hq("daily", `select ${DAY} d, uniq(person_id), countIf(event = 'mw_pageview'),
                 countIf(event in ${PLAYS}), countIf(event in ${FINISHES})
          from events where ${cur} and ${REAL_} group by d order by d`),
    sites: () => hq("sites", `select properties.site s, uniq(person_id) p, countIf(event = 'mw_pageview') v,
                 countIf(event in ${PLAYS}) pl, countIf(event in ${FINISHES}) f
          from events where ${cur} and ${REAL_} group by s order by p desc limit 25`),
    refs: () => hq("refs", `select coalesce(properties.$referring_domain, '$direct') r, uniq(person_id) p
          from events where event = 'mw_pageview' and ${cur} and ${REAL_}
          group by r order by p desc limit 40`),
    devices: () => hq("devices", `select ${DEV} t, uniq(person_id) p
          from events where event = 'mw_pageview' and ${cur} and ${REAL_} group by t order by p desc`),
    funnel: () => hq("funnel", `select uniqIf(person_id, event = 'mw_pageview'), uniqIf(person_id, event = 'footer_view'),
                 uniqIf(person_id, event = 'footer_click'), uniqIf(person_id, event = '$create_alias')
          from events where ${cur} and ${REAL_}`),
    pages: () => hq("pages", `select concat(properties.site, properties.$pathname) pg, count() c
          from events where event = 'mw_pageview' and ${cur} and ${REAL_} group by pg order by c desc limit 10`),
    countries: () => hq("countries", `select properties.$geoip_country_code c, uniq(person_id) p
          from events where ${cur} and ${REAL_} and properties.$geoip_country_code is not null
          group by c order by p desc limit 10`),
    engaged: () => hq("engaged", `select sumIf(toFloat(properties.engaged_seconds), event = 'mw_engaged'),
                 uniqIf(properties.$session_id, event = 'mw_engaged')
          from events where ${cur} and ${REAL_}`),
    returning: () => hq("returning", `select countIf(first_seen < now() - interval ${days} day), count() from (
            select person_id, min(timestamp) first_seen, max(timestamp) last_seen
            from events where ${REAL_} group by person_id
            having last_seen >= now() - interval ${days} day)`),
    sharing: () => hq("sharing", `select properties.site s, uniqIf(person_id, event in ${PLAYS}) players,
                 uniqIf(person_id, event in ${SHARES}) sharers, countIf(event in ${SHARES}) taps,
                 uniqIf(person_id, event in ${FROM_SHARE}) arrived,
                 uniqIf(person_id, event = 'footer_share') site_sharers
          from events where ${cur} and ${REAL_} group by s
          having sharers > 0 or arrived > 0 or site_sharers > 0 order by sharers desc limit 20`),
    // ---- Studio Stats 2.0 additions ----
    dailyBySite: () => hq("dailyBySite", `select ${DAY} d, properties.site s, uniq(person_id)
          from events where ${span} and ${REAL_} group by d, s order by d`),
    dailyAll: () => hq("dailyAll", `select ${DAY} d, uniq(person_id) from events where ${span} and ${REAL_} group by d order by d`),
    trend: () => hq("trend", `select properties.site s, ${DAY} d, uniq(person_id)
          from events where event = 'mw_pageview' and timestamp >= now() - interval 14 day and ${REAL_}
          group by s, d order by s, d`),
    native: () => hq("native", `select count(), avg(dur), countIf(pv <= 1 and dur < 10) from (
            select properties.$session_id sid, dateDiff('second', min(timestamp), max(timestamp)) dur, countIf(event = '$pageview') pv
            from events where timestamp >= ${W.nativeFrom} and ${REAL_} and properties.$session_id is not null
            group by sid having pv > 0)`),
    nativeViews: () => hq("nativeViews", `select countIf(event = '$pageview'), uniqIf(person_id, event = '$pageview'),
                 countIf(event = '$pageleave'), avgIf(toFloat(properties.$prev_pageview_duration), event = '$pageleave')
          from events where timestamp >= ${W.nativeFrom} and ${REAL_}`),
    utm: () => hq("utm", `select coalesce(properties.utm_source, '') src, coalesce(properties.utm_medium, '') med,
                 coalesce(properties.utm_campaign, '') camp, uniq(person_id) p
          from events where event = 'mw_pageview' and ${cur} and ${REAL_} and properties.utm_source is not null
          group by src, med, camp order by p desc limit 12`),
    reach: () => hq("reach", `select uniqIf(properties.$session_id, event = 'mw_pageview'),
                 uniqIf(properties.$session_id, event = 'mw_scroll' and toString(properties.depth) = '25'),
                 uniqIf(properties.$session_id, event = 'mw_scroll' and toString(properties.depth) = '50'),
                 uniqIf(properties.$session_id, event = 'mw_scroll' and toString(properties.depth) = '75'),
                 uniqIf(properties.$session_id, event = 'mw_scroll' and toString(properties.depth) = '100'),
                 uniqIf(person_id, event = 'mw_outbound')
          from events where ${cur} and ${REAL_}`),
    conversions: () => hq("conversions", `select properties.site s, event e, count(), uniq(person_id)
          from events where ${cur} and ${REAL_} and event in ${inList(CONVERSIONS)}
          group by s, e order by 3 desc limit 40`),
    health: () => hq("health", `select properties.site s, toString(max(timestamp)), toString(min(timestamp)),
                 countIf(event = 'mw_pageview' and timestamp >= now() - interval 7 day),
                 countIf(event = '$pageview' and timestamp >= toDateTime('2026-11-21 05:00:00', 'UTC')),
                 countIf(event = '$pageview' and timestamp >= toDateTime('2026-11-21 05:00:00', 'UTC') and substring(properties.$session_id, 15, 1) = '7'),
                 groupUniqArray(properties.$lib),
                 countIf(event not in ${INFRA} and timestamp >= now() - interval 30 day),
                 max(properties.footer_version)
          from events where ${realAll} group by s order by s`),
  };
  const keys = Object.keys(T);
  const results = await pool(keys.map((k) => T[k]), 6);
  const R: Record<string, unknown[][]> = {};
  keys.forEach((k, i) => (R[k] = results[i]));

  const h = R.head[0] || [];
  const pair = (a: number, b: number) => ({ now: n(h[a]), before: n(h[b]) });
  const eng = R.engaged[0] || [];
  const visits = n(eng[1]);
  const ret = R.returning[0] || [];
  const nat = R.native[0] || [];
  const natV = R.nativeViews[0] || [];
  const reach = R.reach[0] || [];

  // Per-site trend: this period vs the one before, plus a 14-day sparkline.
  const spark = new Map<string, Map<string, number>>();
  for (const r of R.trend) {
    const k = s(r[0]);
    if (!spark.has(k)) spark.set(k, new Map());
    spark.get(k)!.set(s(r[1]), n(r[2]));
  }
  const siteTrends = R.sites.map((r) => ({
    site: s(r[0]), people: n(r[1]), views: n(r[2]), plays: n(r[3]), finishes: n(r[4]),
    spark: Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.now() - (13 - i) * 86400000).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
      return spark.get(s(r[0]))?.get(d) ?? 0;
    }),
  }));

  const prevBy = await hq("sitesPrev", `select properties.site s, uniq(person_id) p, countIf(event = 'mw_pageview') v
      from events where ${prev} and ${span} and ${REAL_} group by s`);
  const before = new Map(prevBy.map((r) => [s(r[0]), { people: n(r[1]), views: n(r[2]) }]));
  const trends = siteTrends.map((t) => ({ ...t, peopleBefore: before.get(t.site)?.people ?? 0, viewsBefore: before.get(t.site)?.views ?? 0 }));

  // Acquisition: referrer classes (all history) and tagged links.
  const classes = new Map<string, number>();
  for (const r of R.refs) classes.set(classify(s(r[0])), (classes.get(classify(s(r[0]))) || 0) + n(r[1]));
  const acquisition = {
    classes: [...classes.entries()].map(([name, people]) => ({ name, people })).sort((a, b) => b.people - a.people),
    utm: R.utm.map((r) => ({ source: s(r[0]), medium: s(r[1]), campaign: s(r[2]), people: n(r[3]) })),
  };

  // Tracking health per site: missing data is not the same as zero activity.
  const seen = new Map(R.health.map((r) => [s(r[0]), r]));
  const now = Date.now();
  const health = SITES.map((def) => {
    const r = seen.get(def.id);
    if (!r) {
      return { id: def.id, name: def.name, host: def.host, status: "no_data" as const, note: def.note || "No events received from this site yet.",
        footer: def.footer, lastEvent: null, firstEvent: null, views7: 0, nativeViews: 0, v7Share: null, libs: [] as string[], productEvents30: 0, footerVersion: null };
    }
    const last = Date.parse(s(r[1]).replace(" ", "T") + "Z");
    const nativeViews = n(r[4]);
    const v7 = n(r[5]);
    const stale = now - last > 3 * 86400000;
    return {
      id: def.id, name: def.name, host: def.host, footer: def.footer,
      status: (stale ? "stale" : "ok") as "stale" | "ok",
      note: def.note || "",
      lastEvent: s(r[1]), firstEvent: s(r[2]),
      views7: n(r[3]), nativeViews, v7Share: nativeViews ? Math.round((v7 / nativeViews) * 100) : null,
      libs: ((r[6] as unknown[]) || []).map(s), productEvents30: n(r[7]), footerVersion: r[8] ? s(r[8]) : null,
    };
  });
  // Sites that report but are not in the registry (a new site went live without being added).
  const unregistered = [...seen.keys()].filter((k) => !SITES.some((d) => d.id === k));

  const sc = await smallCanon("overview", days, includeInternal);

  return {
    days,
    generatedAt: new Date().toISOString(),
    boundary: {
      native: NATIVE_BOUNDARY, historyStart: POSTHOG_HISTORY_START, covers: W.nativeCovers, nativeDays: Math.round(W.nativeDays * 10) / 10,
      periodStart: new Date(now - days * 86400000).toISOString(), boundaryAt: new Date(boundaryMs).toISOString(),
    },
    totals: {
      people: pair(0, 1),
      pageViews: pair(2, 3),
      plays: pair(4, 5),
      finishes: pair(6, 7),
      hops: pair(8, 9),
      returning: { now: n(ret[0]), of: n(ret[1]) },
      activeSecondsPerVisit: visits ? Math.round(n(eng[0]) / visits) : null,
    },
    native: {
      sessions: n(nat[0]),
      avgSessionSeconds: nat[1] === null || nat[1] === undefined ? null : Math.round(n(nat[1])),
      bounceRate: n(nat[0]) ? Math.round((n(nat[2]) / n(nat[0])) * 100) : null,
      pageviews: n(natV[0]), visitors: n(natV[1]), pageleaves: n(natV[2]),
      avgPageSeconds: natV[3] === null || natV[3] === undefined ? null : Math.round(n(natV[3])),
    },
    // Two periods of per-site daily people (current and previous) so the chart can compare. Sum across sites counts a person once per site; `all` is de-duplicated.
    portfolio: {
      days,
      rows: R.dailyBySite.map((r) => [s(r[0]), s(r[1]), n(r[2])] as [string, string, number]),
      all: R.dailyAll.map((r) => [s(r[0]), n(r[1])] as [string, number]),
    },
    daily: R.daily.map((r) => ({ day: s(r[0]), people: n(r[1]), views: n(r[2]), plays: n(r[3]), finishes: n(r[4]) })),
    sites: R.sites.map((r) => ({ site: s(r[0]), people: n(r[1]), views: n(r[2]), plays: n(r[3]), finishes: n(r[4]) })),
    siteTrends: trends,
    referrers: R.refs.slice(0, 8).map((r) => ({ name: s(r[0]), people: n(r[1]) })),
    acquisition,
    devices: R.devices.map((r) => ({ name: s(r[0]), people: n(r[1]) })),
    funnel: {
      visited: n((R.funnel[0] || [])[0]),
      sawFooter: n((R.funnel[0] || [])[1]),
      clickedFooter: n((R.funnel[0] || [])[2]),
      crossedSites: n((R.funnel[0] || [])[3]),
    },
    engagement: {
      sessions: n(reach[0]), reach25: n(reach[1]), reach50: n(reach[2]), reach75: n(reach[3]), reach100: n(reach[4]), outboundPeople: n(reach[5]),
    },
    conversions: R.conversions.map((r) => ({ site: s(r[0]), event: s(r[1]), count: n(r[2]), people: n(r[3]) })),
    pages: R.pages.slice(0, 8).map((r) => ({ page: s(r[0]), views: n(r[1]) })),
    sharing: R.sharing.map((r) => ({
      site: s(r[0]), players: n(r[1]), sharers: n(r[2]), taps: n(r[3]), arrived: n(r[4]), siteSharers: n(r[5]),
    })),
    countries: R.countries.slice(0, 8).map((r) => ({ code: s(r[0]), people: n(r[1]) })),
    health: { sites: health, unregistered },
    integrations: [
      { id: "posthog", name: "PostHog", status: "connected", detail: `Project 747271. History starts ${POSTHOG_HISTORY_START}.` },
      { id: "ga4", name: "Google Analytics 4", status: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "connected" : "tag_only", detail: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "Google reporting adapter configured; check Search Performance for per-property access and errors." : "GA4 properties identified; awaiting server-side read-only credentials." },
      { id: "gsc", name: "Google Search Console", status: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "connected" : "not_configured", detail: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? "Google reporting adapter configured; check Search Performance for per-property access and errors." : "Domain properties authorized; awaiting server-side read-only credentials." },
      sc.configured
        ? { id: "smallcanon", name: "Small Canon database (Supabase)", status: sc.ok ? "connected" : "error", detail: sc.ok ? "Read-only stats function, called from the server." : sc.error || "Could not read it." }
        : { id: "smallcanon", name: "Small Canon database (Supabase)", status: "not_configured", detail: "Poster, shelf and share events live here. Set SMALLCANON_STATS_URL and SMALLCANON_STATS_PASSWORD on the server to read them." },
    ],
  };
}

export async function POST(req: Request) {
  let body: { passphrase?: string; days?: number; includeInternal?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  const stop = await gate(body.passphrase);
  if (stop) return stop;
  const days = [7, 30, 90].includes(Number(body.days)) ? Number(body.days) : 7;
  try {
    const includeInternal = body.includeInternal === true;
    if (cache && cache.days === days && cache.internal === includeInternal && Date.now() - cache.at < 60_000) {
      return NextResponse.json(cache.body, { headers: JSON_HEADERS });
    }
    const out = await build(days, includeInternal);
    cache = { at: Date.now(), days, body: out, internal: includeInternal };
    return NextResponse.json(out, { headers: JSON_HEADERS });
  } catch (e) {
    return NextResponse.json({ error: "upstream", detail: String((e as Error).message) }, { status: 502, headers: JSON_HEADERS });
  }
}
