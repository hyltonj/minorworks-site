import { NextResponse } from "next/server";
import { DAY, DEV, JSON_HEADERS, boundaryMs, classify, eventCond, gate, hq, inList, n, pool, s, smallCanon, windowFor } from "@/lib/stats/server";
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
  const extra = ` and properties.site = '${def.id}'` + (device ? ` and ${DEV} = '${device}'` : "");
  const W = windowFor(days, includeInternal, extra);
  const { cur, prev, span, real } = W;
  const started = L(p.started), finished = L(p.finished), tap = L(p.shareTap), done = L(p.shareDone), from = L(p.fromShare);
  const allShareEvents = L([...(p.shareTap || []), ...(p.shareDone || [])]);
  const journey = p.journey || [];
  const lifecycle = def.external ? [] : (p.shareLifecycle || []).filter((st) => st.events && st.events.length);
  const activity = [
    ...(p.started ? [{ label: "Starts", events: p.started }] : []),
    ...(p.finished ? [{ label: "Finishes", events: p.finished }] : []),
    ...(p.counters || []).map((c) => ({ label: c.label, events: [c.event] })),
  ];
  const covMs = Math.max(Date.now() - days * 86400000, boundaryMs, def.nativeFixedAt ? Date.parse(def.nativeFixedAt.replace(" ", "T") + "Z") : 0);
  const covFrom = `toDateTime('${new Date(covMs).toISOString().slice(0, 19).replace("T", " ")}', 'UTC')`;
  const counters = p.counters || [];
  const conv = p.conversion || [];
  const sessionHaving = "having pv > 0";
  // Sites that run the PostHog SDK have two session ids per visit when the footer cannot see the SDK. Session analyses use the SDK's.
  const sdkOnly = def.sdk ? " and properties.$lib = 'web'" : "";
  // Ordered journey per session, same matching PostHog funnels use (windowFunnel). Step 0 "any event" is the cohort, not part of the chain.
  const chain = journey.slice(1);
  const journeySql = journey.length > 1 ? `select count(), ${chain.map((_, i) => `countIf(lvl >= ${i + 1})`).join(", ")} from (
      select properties.$session_id sid, windowFunnel(21600)(toDateTime(timestamp), ${chain.map((st) => eventCond(st.events, st.where)).join(", ")}) lvl
      from events where ${cur} and ${real}${sdkOnly} and properties.$session_id is not null group by sid)` : "";

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
        ${def.sdk ? "uniqIf(properties.$session_id, properties.$lib = 'web')" : `uniqIf(properties.$session_id, event = '$pageview' and timestamp >= ${W.nativeFrom})`}
      from events where ${cur} and ${real} group by d order by d`),
    hours: () => hq("site.hours", `select toDayOfWeek(toTimeZone(timestamp, 'America/New_York')) dow,
        toHour(toTimeZone(timestamp, 'America/New_York')) h, count()
      from events where event = 'mw_pageview' and ${cur} and ${real} group by dow, h`),
    native: () => hq("site.native", `select count(), avg(dur), countIf(pv <= 1 and dur < 10), avg(pv), countIf(pv > 0) from (
        select properties.$session_id sid, dateDiff('second', min(timestamp), max(timestamp)) dur, countIf(event = '$pageview') pv
        from events where ${def.sdk ? cur : `timestamp >= ${W.nativeFrom}`} and ${real}${sdkOnly} and properties.$session_id is not null
        group by sid ${def.sdk ? "" : sessionHaving})`),
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
    channelDaily: () => hq("site.channelDaily", `select d, src, count() from (select properties.$session_id sid, min(${DAY}) d,
            argMin(coalesce(properties.$referring_domain, '$direct'), timestamp) src
          from events where ${cur} and ${real}${sdkOnly} and properties.$session_id is not null group by sid) group by d, src order by d`),
    sessionLen: () => hq("site.sessionLen", `select multiIf(dur < 10, 0, dur < 30, 1, dur < 60, 2, dur < 180, 3, dur < 600, 4, 5) b, count() from (
          select properties.$session_id sid, dateDiff('second', min(timestamp), max(timestamp)) dur
          from events where ${cur} and ${real}${sdkOnly} and properties.$session_id is not null group by sid) group by b order by b`),
    cohortGrid: () => hq("site.cohortGrid", `select f, dateDiff('day', f, d) k, count() from (
          select person_id, ${DAY} d from events where ${real} and timestamp >= now() - interval 90 day group by person_id, d) a
          inner join (select person_id, min(${DAY}) f from events where ${real} group by person_id) b on a.person_id = b.person_id
          where f >= toDate(toTimeZone(now() - interval ${days} day, 'America/New_York')) group by f, k order by f, k`),
    sessionMix: () => hq("site.sessionMix", `select kind, count() from (select properties.$session_id sid,
            multiIf(countIf(properties.$lib = 'web') > 0, 'sdk', 'footer') kind
          from events where ${cur} and ${real} and properties.$session_id is not null group by sid) group by kind`),
    // Sessions that began after the pageview deploy (covFrom): the fair denominator for "how many SDK sessions send a pageview".
    sdkCoverage: () => def.sdk ? hq("site.sdkCoverage", `select count(), countIf(pv > 0) from (
        select properties.$session_id sid, countIf(event = '$pageview') pv, min(timestamp) first
        from events where timestamp >= ${covFrom} and ${real} and properties.$lib = 'web' and properties.$session_id is not null group by sid)`) : Promise.resolve([]),
    footerVersions: () => hq("site.footerVersions", `select toString(properties.$lib_version), uniq(properties.$session_id), toString(max(timestamp))
          from events where ${cur} and ${real} and properties.$lib = 'mw-footer' group by 1 order by 2 desc limit 6`),
    journey: () => journey.length ? hq("site.journey", journeySql) : Promise.resolve([]),
    activity: () => activity.length
      ? hq("site.activity", `select ${activity.map((a) => `countIf(${eventCond(a.events)}), uniqIf(person_id, ${eventCond(a.events)}), uniqIf(properties.$session_id, ${eventCond(a.events)})`).join(", ")}
          from events where ${cur} and ${real}`)
      : Promise.resolve([]),
    lifecycle: () => lifecycle.length
      ? hq("site.lifecycle", `select ${lifecycle.map((st) => `countIf(${eventCond(st.events!, st.where, st.excludeOwn)}), uniqIf(person_id, ${eventCond(st.events!, st.where, st.excludeOwn)})`).join(", ")}
          from events where ${cur} and ${real}`)
      : Promise.resolve([]),
    reshare: () => (p.arrivalEvents && p.shareTap)
      ? hq("site.reshare", `select count(), countIf(ts > ta) from (select person_id,
            toUnixTimestamp64Milli(minIf(timestamp, event in ${L(p.arrivalEvents)} and coalesce(toString(properties.own_link), '') != 'true')) ta,
            toUnixTimestamp64Milli(maxIf(timestamp, event in ${tap})) ts
          from events where ${cur} and ${real} group by person_id having ta > 0)`)
      : Promise.resolve([]),
    coverage: () => hq("site.coverage", `select countIf(event = 'mw_pageview' and timestamp >= ${covFrom}), countIf(event = '$pageview' and timestamp >= ${covFrom}),
          uniqIf(properties.$session_id, properties.$lib = 'web' and timestamp >= ${covFrom}),
          uniqIf(properties.$session_id, properties.$lib = 'web' and event = '$pageview' and timestamp >= ${covFrom}),
          uniqIf(properties.$session_id, timestamp >= ${covFrom}), uniqIf(properties.$session_id, event = '$pageview' and timestamp >= ${covFrom})
        from events where timestamp >= ${covFrom} and ${real}`),
    byDevice: () => p.started
      ? hq("site.byDevice", `select d, count(), countIf(st > 0), countIf(fin > 0) from (select properties.$session_id sid, any(${DEV}) d,
            countIf(event in ${started}) st, countIf(event in ${finished}) fin
          from events where ${cur} and ${real}${sdkOnly} and properties.$session_id is not null group by sid) group by d order by 2 desc`)
      : Promise.resolve([]),
    bySource: () => p.started
      ? hq("site.bySource", `select src, count(), countIf(st > 0), countIf(fin > 0) from (select properties.$session_id sid,
            if(countIf(event in ${from}) > 0, 'Shared link', argMin(coalesce(properties.$referring_domain, '$direct'), timestamp)) src,
            countIf(event in ${started}) st, countIf(event in ${finished}) fin
          from events where ${cur} and ${real}${sdkOnly} and properties.$session_id is not null group by sid) group by src order by 2 desc limit 40`)
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
    devices: () => hq("site.devices", `select ${DEV} t, uniq(person_id)
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
  const jRow = R.journey[0] || [];
  const aRow = R.activity[0] || [];
  const lRow = R.lifecycle[0] || [];
  const rsRow = R.reshare[0] || [];
  const cv = R.coverage[0] || [];
  const cRow = R.counters[0] || [];
  const vRow = R.conv[0] || [];

  const classes = new Map<string, number>();
  for (const r of R.refs) classes.set(classify(s(r[0])), (classes.get(classify(s(r[0]))) || 0) + n(r[1]));

  const ext = def.external === "supabase-smallcanon" ? await smallCanon("site", days, includeInternal) : null;

  return {
    site: { id: def.id, name: def.name, host: def.host, kind: def.kind, sdk: !!def.sdk, footer: def.footer, note: def.note || "", hasProductEvents: !!(p.started || p.journey || p.counters || p.conversion) },
    days, device, includeInternal, generatedAt: new Date().toISOString(),
    boundary: { native: NATIVE_BOUNDARY, historyStart: POSTHOG_HISTORY_START, covers: W.nativeCovers, nativeDays: Math.round(W.nativeDays * 10) / 10 },
    totals: {
      people: pair(0, 1), views: pair(2, 3), started: pair(4, 5), finished: pair(6, 7), startedPeople: pair(8, 9), sharerPeople: pair(10, 11),
    },
    native: {
      basis: def.sdk ? "sdk" : "pageview", withPageview: n(nat[4]),
      sessions: n(nat[0]), avgSessionSeconds: nat[1] === null || nat[1] === undefined ? null : Math.round(n(nat[1])),
      bounceRate: !def.sdk && n(nat[0]) ? Math.round((n(nat[2]) / n(nat[0])) * 100) : null, pagesPerSession: nat[3] === null || nat[3] === undefined ? null : Math.round(n(nat[3]) * 10) / 10,
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
    journey: {
      unit: "sessions",
      steps: journey.map((st, i) => ({ label: st.label, sessions: n(jRow[i]), base: st.base ?? 0 })),
      note: p.journeyNote || "",
    },
    activity: activity.map((a, i) => ({ label: a.label, events: n(aRow[i * 3]), people: n(aRow[i * 3 + 1]), sessions: n(aRow[i * 3 + 2]) })),
    lifecycle: (() => {
      let k = 0;
      return (p.shareLifecycle || []).map((st) => {
        const has = !def.external && st.events && st.events.length;
        const row = { n: st.n, label: st.label, kind: st.kind, status: st.status, note: st.note, names: st.events || [], needs: st.needs || "", where: st.where || null, events: null as number | null, people: null as number | null, of: null as number | null };
        if (has) { row.events = n(lRow[k * 2]); row.people = n(lRow[k * 2 + 1]); k++; }
        if (st.n === 10 && p.arrivalEvents) { row.people = n(rsRow[1]); row.of = n(rsRow[0]); row.status = n(rsRow[0]) ? "partial" : st.status; }
        return row;
      });
    })(),
    channelDaily: (() => {
      const m = new Map<string, Record<string, number>>();
      for (const r of R.channelDaily) {
        const d = s(r[0]); const k = classify(s(r[1]));
        const row = m.get(d) || {}; row[k] = (row[k] || 0) + n(r[2]); m.set(d, row);
      }
      return [...m.entries()].map(([day, v]) => ({ day, ...v }));
    })(),
    sessionLen: R.sessionLen.map((r) => ({ bucket: n(r[0]), sessions: n(r[1]) })),
    cohortGrid: R.cohortGrid.map((r) => ({ first: s(r[0]), k: n(r[1]), people: n(r[2]) })),
    sdkCoverage: { sessions: n(((R.sdkCoverage || [])[0] || [])[0]), withPageview: n(((R.sdkCoverage || [])[0] || [])[1]), since: new Date(covMs).toISOString() },
    sessionMix: { sdk: n((R.sessionMix.find((r) => s(r[0]) === "sdk") || [])[1]), footerOnly: n((R.sessionMix.find((r) => s(r[0]) === "footer") || [])[1]) },
    footerVersions: R.footerVersions.map((r) => ({ version: s(r[0]), sessions: n(r[1]), last: s(r[2]) })),
    coverage: {
      sdk: !!def.sdk, since: new Date(covMs).toISOString(), mwViews: n(cv[0]), nativeViews: n(cv[1]),
      sdkSessions: n(cv[2]), sdkSessionsWithPageview: n(cv[3]), sessions: n(cv[4]), sessionsWithPageview: n(cv[5]),
    },
    cohorts: {
      byDevice: R.byDevice.map((r) => ({ name: s(r[0]), sessions: n(r[1]), started: n(r[2]), finished: n(r[3]) })),
      bySource: (() => {
        const m = new Map<string, { sessions: number; started: number; finished: number }>();
        for (const r of R.bySource) {
          const k = s(r[0]) === "Shared link" ? "Shared link" : classify(s(r[0]));
          const c = m.get(k) || { sessions: 0, started: 0, finished: 0 };
          c.sessions += n(r[1]); c.started += n(r[2]); c.finished += n(r[3]);
          m.set(k, c);
        }
        return [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.sessions - a.sessions);
      })(),
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
