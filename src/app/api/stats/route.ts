import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Read-only studio stats for /stats. The passphrase and the PostHog key live in
// Netlify environment variables (STATS_PASSPHRASE, POSTHOG_PERSONAL_API_KEY).
// Nothing here is cached by the browser or by search engines.

export const dynamic = "force-dynamic";

const POSTHOG_APP = process.env.POSTHOG_APP_HOST || "https://us.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "747271";

const sha = (s: string) => createHash("sha256").update(s).digest();
function passphraseOk(given: string): boolean {
  const real = process.env.STATS_PASSPHRASE || "";
  if (!real || !given) return false;
  return timingSafeEqual(sha(given), sha(real));
}

// Preview deploys, local builds and probes are not real visitors.
const REAL =
  "properties.site is not null and properties.site != '' " +
  "and coalesce(properties.$host, '') not like '%netlify.app' " +
  "and coalesce(properties.$host, '') not like '%vercel.app' " +
  "and coalesce(properties.$host, '') not like 'localhost%' " +
  "and event not in ('$set', '$identify', 'mw_debug_probe')";

// The owner's own testing (owner mode) is left out unless asked for.
const NOT_INTERNAL = " and coalesce(toString(properties.is_internal), '') != 'true'";

const PLAYS = "('bp_set_started', 'puzzle_started')";
const FINISHES = "('bp_set_completed', 'puzzle_solved')";

async function hq(query: string): Promise<unknown[][]> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) throw new Error("PostHog key not set");
  const res = await fetch(`${POSTHOG_APP}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query }, refresh: "blocking" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PostHog ${res.status}`);
  const j = (await res.json()) as { results?: unknown[][] };
  return j.results || [];
}

const n = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

type Cache = { at: number; days: number; body: unknown };
let cache: (Cache & { internal: boolean }) | null = null;

async function build(days: number, includeInternal: boolean) {
  const REAL_ = includeInternal ? REAL : REAL + NOT_INTERNAL;
  const cur = `timestamp >= now() - interval ${days} day`;
  const prev = `timestamp < now() - interval ${days} day`;
  const span = `timestamp >= now() - interval ${days * 2} day`;
  const day = "toDate(toTimeZone(timestamp, 'America/New_York'))";

  const [head, daily, sites, refs, devices, funnel, pages, countries, engaged, returning] =
    await Promise.all([
      hq(`select
            uniqIf(person_id, ${cur}), uniqIf(person_id, ${prev}),
            countIf(event = 'mw_pageview' and ${cur}), countIf(event = 'mw_pageview' and ${prev}),
            countIf(event in ${PLAYS} and ${cur}), countIf(event in ${PLAYS} and ${prev}),
            countIf(event in ${FINISHES} and ${cur}), countIf(event in ${FINISHES} and ${prev}),
            countIf(event = '$create_alias' and ${cur}), countIf(event = '$create_alias' and ${prev})
          from events where ${span} and ${REAL_}`),
      hq(`select ${day} d, uniq(person_id), countIf(event = 'mw_pageview'),
                 countIf(event in ${PLAYS}), countIf(event in ${FINISHES})
          from events where ${cur} and ${REAL_} group by d order by d`),
      hq(`select properties.site s, uniq(person_id) p, countIf(event = 'mw_pageview') v,
                 countIf(event in ${PLAYS}) pl, countIf(event in ${FINISHES}) f
          from events where ${cur} and ${REAL_} group by s order by p desc limit 20`),
      hq(`select coalesce(properties.$referring_domain, '$direct') r, uniq(person_id) p
          from events where event = 'mw_pageview' and ${cur} and ${REAL_}
          group by r order by p desc limit 8`),
      hq(`select coalesce(properties.$device_type, 'unknown') t, uniq(person_id) p
          from events where event = 'mw_pageview' and ${cur} and ${REAL_} group by t order by p desc`),
      hq(`select uniqIf(person_id, event = 'mw_pageview'), uniqIf(person_id, event = 'footer_view'),
                 uniqIf(person_id, event = 'footer_click'), uniqIf(person_id, event = '$create_alias')
          from events where ${cur} and ${REAL_}`),
      hq(`select concat(properties.site, properties.$pathname) pg, count() c
          from events where event = 'mw_pageview' and ${cur} and ${REAL_} group by pg order by c desc limit 8`),
      hq(`select properties.$geoip_country_code c, uniq(person_id) p
          from events where ${cur} and ${REAL_} and properties.$geoip_country_code is not null
          group by c order by p desc limit 8`),
      hq(`select sumIf(toFloat(properties.engaged_seconds), event = 'mw_engaged'),
                 uniqIf(properties.$session_id, event = 'mw_engaged')
          from events where ${cur} and ${REAL_}`),
      hq(`select countIf(first_seen < now() - interval ${days} day), count() from (
            select person_id, min(timestamp) first_seen, max(timestamp) last_seen
            from events where ${REAL_} group by person_id
            having last_seen >= now() - interval ${days} day)`),
    ]);

  const h = head[0] || [];
  const pair = (a: number, b: number) => ({ now: n(h[a]), before: n(h[b]) });
  const eng = engaged[0] || [];
  const visits = n(eng[1]);
  const ret = returning[0] || [];

  return {
    days,
    generatedAt: new Date().toISOString(),
    totals: {
      people: pair(0, 1),
      pageViews: pair(2, 3),
      plays: pair(4, 5),
      finishes: pair(6, 7),
      hops: pair(8, 9),
      returning: { now: n(ret[0]), of: n(ret[1]) },
      activeSecondsPerVisit: visits ? Math.round(n(eng[0]) / visits) : null,
    },
    daily: daily.map((r) => ({ day: String(r[0]), people: n(r[1]), views: n(r[2]), plays: n(r[3]), finishes: n(r[4]) })),
    sites: sites.map((r) => ({ site: String(r[0]), people: n(r[1]), views: n(r[2]), plays: n(r[3]), finishes: n(r[4]) })),
    referrers: refs.map((r) => ({ name: String(r[0]), people: n(r[1]) })),
    devices: devices.map((r) => ({ name: String(r[0]), people: n(r[1]) })),
    funnel: {
      visited: n((funnel[0] || [])[0]),
      sawFooter: n((funnel[0] || [])[1]),
      clickedFooter: n((funnel[0] || [])[2]),
      crossedSites: n((funnel[0] || [])[3]),
    },
    pages: pages.map((r) => ({ page: String(r[0]), views: n(r[1]) })),
    countries: countries.map((r) => ({ code: String(r[0]), people: n(r[1]) })),
  };
}

export async function POST(req: Request) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  let body: { passphrase?: string; days?: number; includeInternal?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  const missing = ["STATS_PASSPHRASE", "POSTHOG_PERSONAL_API_KEY"].filter((k) => !process.env[k]);
  if (missing.length) {
    // Names only, never values: tells the owner which setting the server cannot see.
    return NextResponse.json({ error: "not_configured", missing }, { status: 503, headers });
  }
  if (!passphraseOk(String(body.passphrase || ""))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "denied" }, { status: 401, headers });
  }
  const days = [7, 30, 90].includes(Number(body.days)) ? Number(body.days) : 7;
  try {
    const includeInternal = body.includeInternal === true;
    if (cache && cache.days === days && cache.internal === includeInternal && Date.now() - cache.at < 60_000) {
      return NextResponse.json(cache.body, { headers });
    }
    const out = await build(days, includeInternal);
    cache = { at: Date.now(), days, body: out, internal: includeInternal };
    return NextResponse.json(out, { headers });
  } catch (e) {
    return NextResponse.json({ error: "upstream", detail: String((e as Error).message) }, { status: 502, headers });
  }
}
