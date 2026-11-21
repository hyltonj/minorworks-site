import { NextResponse } from "next/server";
import { DAY, JSON_HEADERS, classify, gate, hq, inList, n, pool, s, smallCanon, windowFor } from "@/lib/stats/server";
import { NATIVE_BOUNDARY, POSTHOG_HISTORY_START, siteById } from "@/lib/stats/model";

// One site's analytics for the Sites workspace (/stats/sites/<id>). Same passphrase gate and filters as /api/stats.

export const dynamic = "force-dynamic";

const none = ["__none__"];
const L = (names?: string[]) => inList(names && names.length ? names : none);
const DEVICES = ["desktop", "mobile", "tablet"];

type Body = { passphrase?: string; site?: string; days?: number; includeInternal?: boolean; device?: string };

async function build(siteId: string, days: number, includeInternal: boolean, device: string) {
  const def = siteById(siteId)!;
  const p = def.product || {};
  const extra = ` and properties.site = '${def.id}'` + (device ? ` and properties.$device_type = '${device}'` : "");
  const W = windowFor(days, includeInternal, extra);
  const { cur, prev, span, real } = W;
  const started = L(p.started), finished = L(p.finished), tap = L(p.shareTap), done = L(p.shareDone), from = L(p.fromShare);
  const allShareEvents = L([...(p.shareTap || []), ...(p.shareDone || [])]);
  const steps = p.funnel || [];
  const counters = p.counters || [];
  const conv = p.conversion || [];
  const sessionHaving = "having pv > 0";

  const T: Record<string, () => Promise<unknown[][]>> = {
    head: () => hq("site.head", `select
        uniqIf(person_id, ${cur}), uniqIf(person_id, ${prev}),
        countIf(event = 'mw_pageview' and ${cur}), countIf(event = 'mw_pageview' and ${prev}),
        countIf(event in ${started} and ${cur}), countIf(event in ${started} and ${prev}),
        countIf(event in ${finished} and ${cur}), countIf(event in ${finished} and ${prev}),
        uniqIf(person_id, event in ${started} and ${cur}), uniqIf(person_id, event in ${started} and ${prev}),
        uniqIf(person_id, event in ${allShareEvents} and ${cur}), uniqIf(person_id, event in ${allShareEvents} and ${prev})
      from events where ${span} and ${real}`),
    daily: () => hq("site.daily", `select ${DAY} d, uniq(person_id), countIf(event = 'mw_pageview'),
        countIf(event in ${started}), countIf(event in ${finished}), countIf(event in ${tap}),
        uniqIf(properties.$session_id, event = '$pageview' and timestamp >= ${W.nativeFrom})
      from events where ${cur} and ${real} group by d order by d`),
    hours: () => hq("site.hours", `select toDayOfWeek(toTimeZone(timestamp, 'America/New_York')) dow,
        toHour(toTimeZone(timestamp, 'America/New_York')) h, count()
      from events where event = 'mw_pageview' and ${cur} and ${real} group by dow, h`),
    native: () => hq("site.native", `select count(), avg(dur), countIf(pv <= 1 and dur < 10), avg(pv) from (
        select properties.$session_id sid, dateDiff('second', min(timestamp), max(timestamp)) dur, countIf(event = '$pageview') pv
        from events where timestamp >= ${W.nativeFrom} and ${real} and properties.$session_id is not null
        group by sid ${sessionHaving})`),
    entry: () => hq("site.entry", `select path, count(), countIf(pv <= 1 and dur < 10) from (
        select properties.$session_id sid, argMinIf(properties.$pathname, timestamp, event = '$pageview') path,
          dateDiff('second', min(timestamp), max(timestamp)) dur, countIf(event = '$pageview') pv
        from events where timestamp >= ${W.nativeFrom} and ${real} and properties.$session_id is not null
        group by sid ${sessionHaving}) group by path order by 2 desc limit 12`),
    pages: () => hq("site.pages", `select properties.$pathname pg, count(), uniq(person_id)
        from events where event = 'mw_pageview' and ${cur} and ${real} group by pg order by 2 desc limit 12`),
    reach: () => hq("site.reach", `select uniqIf(properties.$session_id, event = 'mw_pageview'),
        uniqIf(properties.$session_id, event = 'mw_scroll' and toString(properties.depth) = '25'),
        uniqIf(properties.$session_id, event = 'mw_scroll' and toString(properties.depth) = '50'),
        uniqIf(properties.$session_id, event = 'mw_scroll' and toString(properties.depth) = '75'),
        uniqIf(properties.$session_id, event = 'mw_scroll' and toString(properties.depth) = '100'),
        sumIf(toFloat(properties.engaged_seconds), event = 'mw_engaged'), uniqIf(properties.$session_id, event = 'mw_engaged'),
        uniqIf(person_id, event = 'mw_outbound'), uniqIf(person_id, event = 'footer_view'), uniqIf(person_id, event = 'footer_click')
      from events where ${cur} and ${real}`),
    refs: () => hq("site.refs", `select coalesce(properties.$referring_domain, '$direct') r, uniq(person_id)
        from events where event = 'mw_pageview' and ${cur} and ${real} group by r order by 2 desc limit 25`),
    utm: () => hq("site.utm", `select coalesce(properties.utm_source, '') a, coalesce(properties.utm_medium, '') b,
        coalesce(properties.utm_campaign, '') c, uniq(person_id), count()
      from events where event = 'mw_pageview' and ${cur} and ${real} and properties.utm_source is not null
      group by a, b, c order by 4 desc limit 15`),
    funnel: () => steps.length
      ? hq("site.funnel", `select ${steps.map((st) => `uniqIf(person_id, event in ${L(st.events)})`).join(", ")}
          from events where ${cur} and ${real}`)
      : Promise.resolve([]),
    counters: () => counters.length
      ? hq("site.counters", `select ${counters.map((c) => `countIf(event = '${c.event}'), uniqIf(person_id, event = '${c.event}')`).join(", ")}
          from events where ${cur} and ${real}`)
      : Promise.resolve([]),
    sharing: () => hq("site.sharing", `select uniqIf(person_id, event in ${started}), uniqIf(person_id, event in ${tap}), countIf(event in ${tap}),
        uniqIf(person_id, event in ${done}), countIf(event in ${done}), uniqIf(person_id, event in ${from}), countIf(event in ${from})
      from events where ${cur} and ${real}`),
    conv: () => conv.length
      ? hq("site.conv", `select ${conv.map((c) => `countIf(event = '${c.event}'), uniqIf(person_id, event = '${c.event}')`).join(", ")}
          from events where ${cur} and ${real}`)
      : Promise.resolve([]),
    activeDays: () => hq("site.activeDays", `select least(act, 5) b, count() from (
        select person_id, uniq(${DAY}) act from events where ${cur} and ${real} group by person_id) group by b order by b`),
    cohort: () => hq("site.cohort", `select count(), countIf(act >= 2) from (
        select person_id, min(timestamp) f, uniq(${DAY}) act from events where ${real} group by person_id
        having f >= now() - interval ${days} day and f < now() - interval 1 day)`),
    returning: () => hq("site.returning", `select countIf(f < now() - interval ${days} day), count() from (
        select person_id, min(timestamp) f, max(timestamp) l from events where ${real} group by person_id
        having l >= now() - interval ${days} day)`),
    devices: () => hq("site.devices", `select coalesce(properties.$device_type, 'unknown') t, uniq(person_id)
        from events where event = 'mw_pageview' and ${cur} and ${real} group by t order by 2 desc`),
    countries: () => hq("site.countries", `select properties.$geoip_country_code c, uniq(person_id)
        from events where ${cur} and ${real} and properties.$geoip_country_code is not null group by c order by 2 desc limit 10`),
    inventory: () => hq("site.inventory", `select event, count(), uniq(person_id), toString(min(timestamp)), toString(max(timestamp)),
        max(properties.$lib)
      from events where timestamp >= now() - interval 90 day and ${real} group by event order by 2 desc limit 60`),
  };
  const keys = Object.keys(T);
  const res = await pool(keys.map((k) => T[k]), 6);
  const R: Record<string, unknown[][]> = {};
  keys.forEach((k, i) => (R[k] = res[i]));

  const h = R.head[0] || [];
  const pair = (a: number, b: number) => ({ now: n(h[a]), before: n(h[b]) });
  const nat = R.native[0] || [];
  const rc = R.reach[0] || [];
  const sh = R.sharing[0] || [];
  const cohort = R.cohort[0] || [];
  const ret = R.returning[0] || [];
  const stepRow = R.funnel[0] || [];
  const cRow = R.counters[0] || [];
  const vRow = R.conv[0] || [];

  const classes = new Map<string, number>();
  for (const r of R.refs) classes.set(classify(s(r[0])), (classes.get(classify(s(r[0]))) || 0) + n(r[1]));

  const ext = def.external === "supabase-smallcanon" ? await smallCanon("site", days, includeInternal) : null;

  return {
    site: { id: def.id, name: def.name, host: def.host, kind: def.kind, sdk: !!def.sdk, footer: def.footer, note: def.note || "", hasProductEvents: !!(p.started || p.funnel || p.counters || p.conversion) },
    days, device, includeInternal, generatedAt: new Date().toISOString(),
    boundary: { native: NATIVE_BOUNDARY, historyStart: POSTHOG_HISTORY_START, covers: W.nativeCovers, nativeDays: Math.round(W.nativeDays * 10) / 10 },
    totals: {
      people: pair(0, 1), views: pair(2, 3), started: pair(4, 5), finished: pair(6, 7), startedPeople: pair(8, 9), sharerPeople: pair(10, 11),
    },
    native: {
      sessions: n(nat[0]), avgSessionSeconds: nat[1] === null || nat[1] === undefined ? null : Math.round(n(nat[1])),
      bounceRate: n(nat[0]) ? Math.round((n(nat[2]) / n(nat[0])) * 100) : null, pagesPerSession: nat[3] === null || nat[3] === undefined ? null : Math.round(n(nat[3]) * 10) / 10,
    },
    daily: R.daily.map((r) => ({ day: s(r[0]), people: n(r[1]), views: n(r[2]), started: n(r[3]), finished: n(r[4]), shareTaps: n(r[5]), sessions: n(r[6]) })),
    hours: R.hours.map((r) => ({ dow: n(r[0]), hour: n(r[1]), n: n(r[2]) })),
    entry: R.entry.map((r) => ({ path: s(r[0]), sessions: n(r[1]), bounced: n(r[2]) })),
    pages: R.pages.map((r) => ({ path: s(r[0]), views: n(r[1]), people: n(r[2]) })),
    engagement: {
      sessions: n(rc[0]), reach25: n(rc[1]), reach50: n(rc[2]), reach75: n(rc[3]), reach100: n(rc[4]),
      activeSecondsPerVisit: n(rc[6]) ? Math.round(n(rc[5]) / n(rc[6])) : null,
      outboundPeople: n(rc[7]), footerSeen: n(rc[8]), footerClicked: n(rc[9]),
    },
    acquisition: {
      referrers: R.refs.slice(0, 10).map((r) => ({ name: s(r[0]), people: n(r[1]) })),
      classes: [...classes.entries()].map(([name, people]) => ({ name, people })).sort((a, b) => b.people - a.people),
      utm: R.utm.map((r) => ({ source: s(r[0]), medium: s(r[1]), campaign: s(r[2]), people: n(r[3]), views: n(r[4]) })),
    },
    usage: {
      funnel: steps.map((st, i) => ({ label: st.label, people: n(stepRow[i]) })),
      counters: counters.map((c, i) => ({ label: c.label, count: n(cRow[i * 2]), people: n(cRow[i * 2 + 1]) })),
    },
    sharing: {
      startedPeople: n(sh[0]), tapPeople: n(sh[1]), taps: n(sh[2]), donePeople: n(sh[3]), done: n(sh[4]), arrivedPeople: n(sh[5]), arrived: n(sh[6]),
      configured: !!(p.shareTap || p.shareDone || p.fromShare),
    },
    conversions: conv.map((c, i) => ({ label: c.label, event: c.event, count: n(vRow[i * 2]), people: n(vRow[i * 2 + 1]) })),
    retention: {
      activeDays: R.activeDays.map((r) => ({ days: n(r[0]), people: n(r[1]) })),
      cohort: { people: n(cohort[0]), returned: n(cohort[1]) },
      returning: { now: n(ret[0]), of: n(ret[1]) },
    },
    devices: R.devices.map((r) => ({ name: s(r[0]), people: n(r[1]) })),
    countries: R.countries.map((r) => ({ code: s(r[0]), people: n(r[1]) })),
    inventory: R.inventory.map((r) => ({ event: s(r[0]), count: n(r[1]), people: n(r[2]), first: s(r[3]), last: s(r[4]), lib: s(r[5]) })),
    external: ext,
  };
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  const stop = await gate(body.passphrase);
  if (stop) return stop;
  const id = String(body.site || "");
  if (!/^[a-z0-9.]{2,40}$/.test(id) || !siteById(id)) {
    return NextResponse.json({ error: "unknown_site" }, { status: 404, headers: JSON_HEADERS });
  }
  const days = [7, 30, 90].includes(Number(body.days)) ? Number(body.days) : 30;
  const device = DEVICES.includes(String(body.device)) ? String(body.device) : "";
  try {
    return NextResponse.json(await build(id, days, body.includeInternal === true, device), { headers: JSON_HEADERS });
  } catch (e) {
    return NextResponse.json({ error: "upstream", detail: String((e as Error).message) }, { status: 502, headers: JSON_HEADERS });
  }
}
