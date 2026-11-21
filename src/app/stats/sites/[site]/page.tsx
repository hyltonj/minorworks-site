"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DEFINITIONS, NATIVE_BOUNDARY, POSTHOG_HISTORY_START, siteById } from "@/lib/stats/model";
import { eventsUrl, funnelUrl, pathsUrl } from "@/lib/stats/links";
import {
  C, ColumnChart, DataTable, Donut, Empty, ExternalLink, FunnelBars, HBars, Heatmap, Insufficient, Kpi, LineChart, Login, Notice, Pair, Panel, Section, Shell,
  dur, etDay, flag, nf, pct, stampOf, useStats,
} from "@/components/stats/ui";

type Life = { n: number; label: string; kind: string; status: string; note: string; names: string[]; events: number | null; people: number | null; of: number | null };
type Data = {
  site: { id: string; name: string; host: string; kind: string; sdk: boolean; footer: boolean; note: string; hasProductEvents: boolean };
  days: number; device: string; includeInternal: boolean; generatedAt: string;
  boundary: { native: string; historyStart: string; covers: "full" | "partial" | "none"; nativeDays: number };
  totals: { people: Pair; views: Pair; started: Pair; finished: Pair; startedPeople: Pair; sharerPeople: Pair };
  native: { sessions: number; avgSessionSeconds: number | null; bounceRate: number | null; pagesPerSession: number | null };
  daily: { day: string; people: number; views: number; started: number; finished: number; shareTaps: number; sessions: number }[];
  hours: { dow: number; hour: number; n: number }[];
  entry: { path: string; sessions: number; bounced: number }[];
  pages: { path: string; views: number; people: number }[];
  engagement: { sessions: number; reach25: number; reach50: number; reach75: number; reach100: number; activeSecondsPerVisit: number | null; outboundPeople: number; footerSeen: number; footerClicked: number };
  acquisition: { referrers: { name: string; people: number }[]; classes: { name: string; people: number }[]; utm: { source: string; medium: string; campaign: string; people: number; views: number }[] };
  journey: { unit: string; steps: { label: string; sessions: number }[]; note: string };
  activity: { label: string; events: number; people: number; sessions: number }[];
  lifecycle: Life[];
  coverage: { sdk: boolean; since: string; mwViews: number; nativeViews: number; sdkSessions: number; sdkSessionsWithPageview: number; sessions: number; sessionsWithPageview: number };
  cohorts: { byDevice: { name: string; sessions: number; started: number; finished: number }[]; bySource: { name: string; sessions: number; started: number; finished: number }[] };
  sharing: { startedPeople: number; tapPeople: number; taps: number; donePeople: number; done: number; arrivedPeople: number; arrived: number; configured: boolean };
  conversions: { label: string; event: string; count: number; people: number }[];
  retention: { activeDays: { days: number; people: number }[]; cohort: { people: number; returned: number }; returning: { now: number; of: number } };
  devices: { name: string; people: number }[];
  countries: { code: string; people: number }[];
  inventory: { event: string; count: number; people: number; first: string; last: string; lib: string }[];
  external: null | { configured: false } | { configured: true; ok: false; error: string } | { configured: true; ok: true; data: Record<string, unknown> };
};

type SCRange = { kpis?: { visitors: number; visits: number; events: number; engaged: number; first_seen: string | null; last_seen: string | null }; events?: { event: string; n: number; visitors: number }[]; sources?: { source: string; visitors: number }[] };
type SC = SCRange & { history?: { smallcanon: SCRange | null; shelflife: SCRange | null } };

const DEVICES = [["", "All devices"], ["desktop", "Desktop"], ["mobile", "Mobile"], ["tablet", "Tablet"]] as const;
const KIND: Record<string, [string, string, string]> = {
  opportunity: ["Opportunity", C.track, C.mute],
  intent: ["Intent", C.amberFaint, "#6b4a0f"],
  confirmed: ["Confirmed action", C.blueFaint, C.navy2],
  attributable: ["Attributable visit", "#dff3e6", "#14532d"],
  engagement: ["Engagement", "#e9e3f7", "#3b2a73"],
};
const STATUS: Record<string, [string, string]> = { measured: ["Measured", C.green], partial: ["Partial", C.amber], not_observable: ["Not observable", C.red] };

const Badge = ({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) => (
  <span className="inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[10.5px] font-semibold" style={{ background: bg, color: fg }}>{children}</span>
);
const Sub = ({ children }: { children: React.ReactNode }) => <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: C.mute }}>{children}</p>;

/** One value per calendar day in range. Days with no PostHog history are null ("not collected"), never 0. */
function fill(days: number, rows: Data["daily"], pick: (d: Data["daily"][number]) => number, from: string) {
  const by = new Map(rows.map((r) => [r.day, r]));
  const labels: string[] = [], values: (number | null)[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = etDay(i);
    if (day < POSTHOG_HISTORY_START) continue;
    labels.push(day);
    values.push(day < from ? null : by.has(day) ? pick(by.get(day)!) : 0);
  }
  return { labels, values };
}
const nums = (v: (number | null)[]) => v.map((x) => x ?? 0);

function SmallCanon({ data, life }: { data: unknown; life: Life[] }) {
  const x = (data || {}) as SC;
  const k = x.kpis;
  if (!k) return <Empty text="The Small Canon function returned nothing for this range" />;
  const ev = new Map((x.events || []).map((e) => [e.event, e]));
  const hist = [["Shelf Life (from 18 Oct)", x.history?.shelflife?.kpis], ["Small Canon (from 3 Nov)", x.history?.smallcanon?.kpis]] as const;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi label="Visitors" value={nf(k.visitors)} sub="distinct visit ids" />
        <Kpi label="Visits" value={nf(k.visits)} sub="visit events" />
        <Kpi label="Took an action" value={nf(k.engaged)} sub={`${pct(k.engaged, k.visitors)} of visitors`} />
        <Kpi label="Last event" value={k.last_seen ? k.last_seen.slice(5, 10) : "–"} sub={k.first_seen ? `first ${k.first_seen.slice(0, 10)}` : undefined} />
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <Sub>Events in this range</Sub>
          <DataTable dense rows={x.events || []} initialSort="n" limit={10} empty="No events in this range" cols={[
            { key: "e", label: "Event", value: (r) => r.event, render: (r) => <code className="text-xs">{r.event}</code> },
            { key: "n", label: "Count", align: "right", value: (r) => r.n },
            { key: "v", label: "Visitors", align: "right", value: (r) => r.visitors },
          ]} />
        </div>
        <div>
          <Sub>Share lifecycle (Small Canon database events)</Sub>
          <DataTable dense rows={life} cols={[
            { key: "n", label: "#", value: (r) => r.n },
            { key: "l", label: "Stage", render: (r) => r.label },
            { key: "s", label: "Status", render: (r) => <span style={{ color: STATUS[r.status]?.[1] }}>{STATUS[r.status]?.[0] || r.status}</span> },
            { key: "v", label: "Visitors", align: "right", render: (r) => {
              const hit = r.names.map((nm) => ev.get(nm)).filter(Boolean) as { visitors: number }[];
              return r.names.length ? (hit.length ? nf(hit.reduce((a, b) => a + b.visitors, 0)) : <span style={{ color: C.mute }}>0 seen</span>) : <span style={{ color: C.mute }}>–</span>;
            } },
          ]} />
        </div>
      </div>
      <div>
        <Sub>History across both names</Sub>
        <DataTable dense rows={hist.map(([name, kk]) => ({ name, kk }))} empty="No history" cols={[
          { key: "n", label: "Period", render: (r) => r.name },
          { key: "v", label: "Visitors", align: "right", render: (r) => (r.kk ? nf(r.kk.visitors) : "–") },
          { key: "e", label: "Events", align: "right", render: (r) => (r.kk ? nf(r.kk.events) : "–") },
          { key: "f", label: "First", render: (r) => r.kk?.first_seen?.slice(0, 10) || "–" },
          { key: "l", label: "Last", render: (r) => r.kk?.last_seen?.slice(0, 10) || "–" },
        ]} />
      </div>
      <p className="text-[11px]" style={{ color: C.mute }}>Counted in the Small Canon database (distinct visit ids, not PostHog people), so not comparable with the PostHog numbers. Shelf Life and Small Canon are one product history; the measurement changed at the rename.</p>
    </div>
  );
}

export default function SitePage() {
  const { site } = useParams<{ site: string }>();
  const [days, setDays] = useState(30);
  const [mine, setMine] = useState(false);
  const [device, setDevice] = useState("");
  const { ready, data, error, loading, login } = useStats<Data>("/api/stats/site", { site, days, includeInternal: mine, device });

  if (!data) {
    if (!ready) return <main className="min-h-screen" style={{ background: C.navy }} />;
    if (error === "That page does not exist.") {
      return <main className="flex min-h-screen items-center justify-center" style={{ background: C.bg }}><p>That site is not on the list. <Link href="/stats/sites" className="underline">Back to sites</Link></p></main>;
    }
    return <Login onLogin={login} error={error} loading={loading} />;
  }

  const d = data, t = d.totals, b = d.boundary, nat = d.native, e = d.engagement, s = d.site, cov = d.coverage, ret = d.retention;
  const def = siteById(s.id);
  const noSessions = b.covers === "none";
  const silent = !t.people.now && !t.views.now && !d.inventory.length && !d.external;
  const game = s.hasProductEvents && s.kind === "game";
  const deviceSelect = (
    <select aria-label="Device" value={device} onChange={(ev) => setDevice(ev.target.value)} className="rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ background: C.track, color: C.navy }}>
      {DEVICES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  const ppl = fill(d.days, d.daily, (r) => r.people, POSTHOG_HISTORY_START);
  const views = fill(d.days, d.daily, (r) => r.views, POSTHOG_HISTORY_START);
  const sess = fill(d.days, d.daily, (r) => r.sessions, NATIVE_BOUNDARY);
  const started = fill(d.days, d.daily, (r) => r.started, POSTHOG_HISTORY_START);
  const finished = fill(d.days, d.daily, (r) => r.finished, POSTHOG_HISTORY_START);
  const taps = fill(d.days, d.daily, (r) => r.shareTaps, POSTHOG_HISTORY_START);
  const series = [
    { key: "people", label: "People", color: C.blue, values: ppl.values },
    { key: "views", label: "Page views", color: C.navy2, values: views.values },
    { key: "sessions", label: "Sessions", color: C.blueSoft, values: sess.values },
    ...(game ? [
      { key: "started", label: "Start events", color: C.red, values: started.values },
      { key: "finished", label: "Finish events", color: C.green, values: finished.values },
    ] : []),
  ];
  const marks = [
    ...(ppl.labels.includes(POSTHOG_HISTORY_START) ? [{ day: POSTHOG_HISTORY_START, label: "PostHog history starts" }] : []),
    ...(sess.labels.includes(NATIVE_BOUNDARY.slice(0, 10)) ? [{ day: NATIVE_BOUNDARY.slice(0, 10), label: "Native sessions begin" }] : []),
  ];
  const dailyRows = ppl.labels.map((day, i) => ({ day, people: ppl.values[i], views: views.values[i], sessions: sess.values[i], started: started.values[i], finished: finished.values[i], taps: taps.values[i] })).reverse();
  const cell = (v: number | null) => (v === null ? <span style={{ color: C.mute }}>n/a</span> : nf(v));

  const journey = d.journey.steps;
  const hasJourney = journey.length > 1 && journey[0].sessions > 0;
  const qSteps = journey.filter((st) => /^Question \d/.test(st.label));
  const drop = qSteps.map((st, i) => ({ label: `Q${i + 1}`, value: i ? Math.max(0, qSteps[i - 1].sessions - st.sessions) : Math.max(0, journey[0].sessions - st.sessions), tone: "red" as const }));
  const hasShare = d.lifecycle.length > 0;
  const sharedKpi = d.lifecycle.find((l) => l.n === 7);
  const smallCanonLife = (def?.product?.shareLifecycle || []).map((st) => ({ n: st.n, label: st.label, kind: st.kind, status: st.status, note: st.note, names: st.events || [], events: null, people: null, of: null })) as Life[];
  const lowSample = ret.cohort.people < 30;
  const shortHistory = ret.returning.of > 0 && b.historyStart > etDay(d.days);

  return (
    <Shell title={s.name} active="sites" days={days} onDays={setDays} mine={mine} onMine={() => setMine((m) => !m)} loading={loading} stamp={stampOf(d.generatedAt)} extra={deviceSelect}
      subtitle={<><Link href="/stats/sites" className="underline-offset-2 hover:underline" style={{ color: C.navy2 }}>← All sites</Link> · {s.host} · last {d.days} days{device ? `, ${device} only` : ""} · {mine ? "including" : "excluding"} your own visits</>}
      actions={<ExternalLink href={`https://${s.host}`}>Open site</ExternalLink>}>
      {s.note && <Notice tone="warn">{s.note}</Notice>}
      {silent && <Notice tone="warn">PostHog has received no events from this site. That is missing data, not zero visitors.</Notice>}
      {!silent && s.kind !== "external" && (
        <Notice>PostHog history starts {POSTHOG_HISTORY_START} (custom events) and native sessions, bounce and scroll start {NATIVE_BOUNDARY.slice(0, 10)}. Earlier days show “n/a”, never zero, and the previous-period change is partial.</Notice>
      )}

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="People" value={nf(t.people.now)} pair={t.people} spark={nums(ppl.values)} />
        <Kpi label="Page views" value={nf(t.views.now)} pair={t.views} spark={nums(views.values)} color={C.navy2} />
        <Kpi label="Sessions" value={noSessions ? "–" : nf(nat.sessions)} sub={noSessions ? "from 21 Nov" : `${nat.pagesPerSession ?? "–"} pages each`} spark={nums(sess.values)} color={C.blueSoft} />
        <Kpi label="Avg session" value={noSessions ? "–" : dur(nat.avgSessionSeconds)} sub={noSessions || nat.bounceRate === null ? undefined : `${nat.bounceRate}% bounce`} />
        {game ? <>
          <Kpi label="Start events" value={nf(t.started.now)} pair={t.started} sub={`${nf(t.startedPeople.now)} people`} spark={nums(started.values)} color={C.red} />
          <Kpi label="Finish events" value={nf(t.finished.now)} pair={t.finished} sub={`${pct(t.finished.now, t.started.now)} of start events`} spark={nums(finished.values)} color={C.green} />
        </> : <>
          <Kpi label="Footer seen" value={nf(e.footerSeen)} sub="people" />
          <Kpi label="Clicked out" value={nf(e.outboundPeople)} sub="people" />
        </>}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <Panel title="Daily activity" note="hover for values · chips toggle lines" className="xl:col-span-2">
          <LineChart labels={ppl.labels} series={series} marks={marks} height={160} />
        </Panel>
        <Panel title="When people visit" note="Boston time">
          <Heatmap cells={d.hours} />
        </Panel>
      </div>

      {game && hasJourney && (
        <Panel title="A. Sequential journey" note={<>sessions in order · <ExternalLink href={funnelUrl(s.id, def?.product?.journey || [], d.days)}>Funnel in PostHog</ExternalLink> · <ExternalLink href={pathsUrl(s.id, d.days)}>Paths</ExternalLink> · <ExternalLink href={eventsUrl(s.id)}>Events</ExternalLink></>}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <FunnelBars steps={journey.map((st) => ({ label: st.label, value: st.sessions }))} unit="sessions" />
              <p className="mt-2 text-[11px]" style={{ color: C.mute }}>Each session counts at a step only if it did that step after the one before. The percentage at the right is step to step. {d.journey.note}</p>
            </div>
            <div className="lg:col-span-2">
              <Sub>Sessions lost at each question</Sub>
              <ColumnChart items={drop} color={C.red} height={96} />
              <Sub>Completion by device (sessions that started)</Sub>
              <DataTable dense rows={d.cohorts.byDevice.filter((r) => r.started > 0)} empty="No starts" cols={[
                { key: "n", label: "Device", render: (r) => r.name },
                { key: "s", label: "Started", align: "right", value: (r) => r.started },
                { key: "f", label: "Finished", align: "right", value: (r) => r.finished, render: (r) => `${nf(r.finished)} · ${pct(r.finished, r.started)}` },
              ]} />
            </div>
          </div>
        </Panel>
      )}

      {game && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <Panel title="B. Independent activity" note="not a funnel · events, people and sessions are separate counts" className="xl:col-span-3">
            <DataTable dense rows={d.activity} empty="No activity events mapped" cols={[
              { key: "l", label: "Activity", render: (r) => r.label },
              { key: "e", label: "Events", align: "right", value: (r) => r.events },
              { key: "p", label: "People", align: "right", value: (r) => r.people },
              { key: "ss", label: "Sessions", align: "right", value: (r) => r.sessions },
              { key: "pp", label: "Per person", align: "right", value: (r) => (r.people ? r.events / r.people : 0), render: (r) => (r.people ? (r.events / r.people).toFixed(1) : "–") },
            ]} />
            <p className="mt-2 text-[11px]" style={{ color: C.mute }}>{DEFINITIONS.started} {DEFINITIONS.finished} A finish can come from a person who started on another day, so these rows are not ratios of each other.</p>
          </Panel>
          <Panel title="Acquisition vs completion" note="sessions" className="xl:col-span-2">
            <DataTable dense rows={d.cohorts.bySource} empty="No sessions" cols={[
              { key: "n", label: "Source", render: (r) => r.name },
              { key: "s", label: "Sessions", align: "right", value: (r) => r.sessions },
              { key: "st", label: "Started", align: "right", value: (r) => r.started, render: (r) => `${nf(r.started)} · ${pct(r.started, r.sessions)}` },
              { key: "f", label: "Finished", align: "right", value: (r) => r.finished, render: (r) => `${nf(r.finished)} · ${pct(r.finished, r.started)}` },
            ]} />
            <p className="mt-2 text-[11px]" style={{ color: C.mute }}>“Shared link” is any session that arrived through a share URL. Finished % is of sessions that started.</p>
          </Panel>
        </div>
      )}

      {hasShare && (
        <Panel title="Sharing lifecycle" note="intent is not a send · opening a share sheet is not a share">
          <DataTable dense rows={d.lifecycle} empty="No lifecycle defined" cols={[
            { key: "n", label: "#", value: (r) => r.n },
            { key: "l", label: "Stage", render: (r) => <span className="font-medium">{r.label}</span> },
            { key: "k", label: "Kind", render: (r) => <Badge bg={KIND[r.kind]?.[1] || C.track} fg={KIND[r.kind]?.[2] || C.mute}>{KIND[r.kind]?.[0] || r.kind}</Badge> },
            { key: "s", label: "Status", render: (r) => <span className="whitespace-nowrap text-[11.5px] font-medium" style={{ color: STATUS[r.status]?.[1] }}>● {STATUS[r.status]?.[0] || r.status}</span> },
            { key: "e", label: "Events", align: "right", value: (r) => r.events ?? -1, render: (r) => (r.events === null ? <span style={{ color: C.mute }}>–</span> : nf(r.events)) },
            { key: "p", label: "People", align: "right", value: (r) => r.people ?? -1, render: (r) => (r.people === null ? <span style={{ color: C.mute }}>–</span> : r.of !== null ? `${nf(r.people)} of ${nf(r.of)}` : nf(r.people)) },
            { key: "w", label: "Notes", hide: "sm", render: (r) => <span className="text-[11.5px]" style={{ color: C.mute }}>{r.note}</span> },
          ]} />
          <p className="mt-2 text-[11px]" style={{ color: C.mute }}>
            Stage 10 counts people who arrived through someone else’s link (not their own) and later pressed share themselves. Share links carry only the share type, not a per-share id, so a visit is attributable to “a share of this kind” and never to a person or a message. {sharedKpi?.status === "partial" ? "Stage 7 depends on the shared-link event reaching PostHog from the recipient’s browser." : ""}
          </p>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Acquisition" note="people">
          <Sub>Channel</Sub>
          <HBars color={C.navy2} rows={d.acquisition.classes.map((c) => ({ name: c.name, value: c.people }))} />
          <div className="mt-3"><Sub>Top referrers</Sub></div>
          <HBars rows={d.acquisition.referrers.slice(0, 6).map((r) => ({ name: r.name, value: r.people }))} label={(n) => (n === "$direct" ? "Direct" : n)} />
        </Panel>
        <Panel title="Entry and top pages" note={noSessions ? "entry pages from 21 Nov" : "sessions · views"}>
          {noSessions ? <Empty text="Entry pages come from sessions, which start 21 Nov 2026" /> : (
            <DataTable dense limit={5} initialSort="sessions" rows={d.entry} cols={[
              { key: "p", label: "Entry", render: (r) => <span className="break-all">{r.path}</span> },
              { key: "s", label: "Sess.", align: "right", value: (r) => r.sessions },
              { key: "b", label: "Bounce", align: "right", value: (r) => (r.sessions ? r.bounced / r.sessions : 0), render: (r) => pct(r.bounced, r.sessions) },
            ]} />
          )}
          <div className="mt-3" />
          <DataTable dense limit={5} initialSort="views" rows={d.pages} cols={[
            { key: "p", label: "Page", render: (r) => <span className="break-all">{r.path}</span> },
            { key: "v", label: "Views", align: "right", value: (r) => r.views },
            { key: "pp", label: "People", align: "right", value: (r) => r.people },
          ]} />
        </Panel>
        <Panel title="Audience" note="people">
          <div className="flex items-start gap-4">
            <div className="shrink-0"><Donut rows={d.devices.map((x) => ({ name: x.name, value: x.people }))} size={92} /></div>
            <div className="min-w-0 flex-1"><HBars color={C.red} rows={d.countries.slice(0, 5).map((c) => ({ name: c.code, value: c.people }))} label={(c) => `${flag(c)} ${c}`} /></div>
          </div>
          <div className="mt-3"><Sub>Reach (share of sessions)</Sub></div>
          {noSessions || !e.sessions ? <Insufficient text="Scroll data starts 21 Nov" /> : (
            <HBars suffix="%" rows={[
              { name: "Reached 50%", value: Math.round((e.reach50 / e.sessions) * 100) },
              { name: "Reached the end", value: Math.round((e.reach100 / e.sessions) * 100) },
            ]} />
          )}
          {!noSessions && e.activeSecondsPerVisit !== null && <p className="mt-1 text-[11px]" style={{ color: C.mute }}>Active time per visit {dur(e.activeSecondsPerVisit)}</p>}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Retention" note="Boston-time days">
          {ret.cohort.people || ret.activeDays.length ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Sub>Days active per person</Sub>
                <ColumnChart items={ret.activeDays.map((r) => ({ label: r.days >= 5 ? "5+" : String(r.days), value: r.people }))} height={70} />
              </div>
              <div className="space-y-2 text-[12px]">
                <div><Sub>New people who came back</Sub>{lowSample ? <Insufficient text={`Only ${ret.cohort.people} new people: too few`} /> : <span className="text-lg font-bold" style={{ color: C.navy }}>{pct(ret.cohort.returned, ret.cohort.people)}</span>}</div>
                <div><Sub>Returning</Sub>{shortHistory ? <Insufficient text="History shorter than range" /> : ret.returning.of ? <span className="text-lg font-bold" style={{ color: C.navy }}>{pct(ret.returning.now, ret.returning.of)}</span> : "–"}</div>
              </div>
            </div>
          ) : <Empty text="No people in this range" />}
          <p className="mt-2 text-[11px]" style={{ color: C.mute }}>{DEFINITIONS.returning} PostHog only holds data from {b.historyStart}, so “first seen before the range” cannot be told apart from “first seen after history began” until the history is longer than the range.</p>
        </Panel>

        <Panel title="Data quality" note="pageview coverage since this site’s tracking was last fixed">
          <DataTable dense rows={[
            { l: "Footer pageviews (mw_pageview)", v: nf(cov.mwViews), n: "Counted on every footer-equipped load." },
            { l: "Native pageviews ($pageview)", v: nf(cov.nativeViews), n: cov.mwViews && cov.nativeViews < cov.mwViews * 0.8 ? "Fewer than footer pageviews: cached game bundles or sessions not yet on the new SDK." : "Roughly in line." },
            { l: "Sessions with a pageview", v: `${nf(cov.sessionsWithPageview)} of ${nf(cov.sessions)}`, n: cov.sessions ? `${pct(cov.sessionsWithPageview, cov.sessions)}. Sessions without one are excluded from sessions, bounce and entry pages.` : "–" },
            ...(cov.sdk ? [{ l: "SDK sessions with a pageview", v: `${nf(cov.sdkSessionsWithPageview)} of ${nf(cov.sdkSessions)}`, n: "Sessions from the site’s own PostHog SDK." }] : []),
          ]} cols={[
            { key: "l", label: "Check", render: (r) => r.l },
            { key: "v", label: "Value", align: "right", render: (r) => r.v },
            { key: "n", label: "Reading", render: (r) => <span className="text-[11.5px]" style={{ color: C.mute }}>{r.n}</span> },
          ]} />
          <p className="mt-2 text-[11px]" style={{ color: C.mute }}>Window starts {stampOf(cov.since)} Boston time. GA4 loads only on sites with the footer’s GA switch and never on games, which is why it reports far fewer visitors than PostHog.</p>
        </Panel>
      </div>

      {d.conversions.length > 0 && (
        <Panel title="Conversions">
          <DataTable dense rows={d.conversions} cols={[
            { key: "l", label: "Goal", value: (r) => r.label },
            { key: "e", label: "Event", hide: "sm", render: (r) => <code className="text-xs">{r.event}</code> },
            { key: "p", label: "People", align: "right", value: (r) => r.people },
            { key: "c", label: "Count", align: "right", value: (r) => r.count },
            { key: "r", label: "Of visitors", align: "right", value: (r) => (t.people.now ? r.people / t.people.now : 0), render: (r) => pct(r.people, t.people.now) },
          ]} />
        </Panel>
      )}

      {d.external !== null && (
        <Panel title="Small Canon database (Supabase)" note="poster, shelf and share events · history from 18 Oct incl. Shelf Life">
          {!d.external.configured ? (
            <Notice tone="warn">Not connected yet. Set SMALLCANON_STATS_URL and SMALLCANON_STATS_PASSWORD on the server and this section will fill in. PostHog has no Small Canon product events today.</Notice>
          ) : !d.external.ok ? (
            <Notice tone="warn">Could not read the Small Canon stats function: {d.external.error}</Notice>
          ) : (
            <SmallCanon data={d.external.data} life={smallCanonLife} />
          )}
        </Panel>
      )}

      <Section title="Day by day" note="expand" open={false}>
        <DataTable dense rows={dailyRows} limit={14} cols={[
          { key: "day", label: "Day", value: (r) => r.day },
          { key: "people", label: "People", align: "right", value: (r) => r.people ?? -1, render: (r) => cell(r.people) },
          { key: "views", label: "Views", align: "right", value: (r) => r.views ?? -1, render: (r) => cell(r.views) },
          { key: "sessions", label: "Sessions", align: "right", value: (r) => r.sessions ?? -1, render: (r) => cell(r.sessions) },
          ...(game ? [
            { key: "started", label: "Starts", align: "right" as const, value: (r: typeof dailyRows[number]) => r.started ?? -1, render: (r: typeof dailyRows[number]) => cell(r.started) },
            { key: "finished", label: "Finishes", align: "right" as const, value: (r: typeof dailyRows[number]) => r.finished ?? -1, render: (r: typeof dailyRows[number]) => cell(r.finished) },
            { key: "taps", label: "Share taps", align: "right" as const, hide: "sm" as const, value: (r: typeof dailyRows[number]) => r.taps ?? -1, render: (r: typeof dailyRows[number]) => cell(r.taps) },
          ] : []),
        ]} />
      </Section>

      <Section title="Event inventory" note="last 90 days · what this site actually sends" open={false}>
        <DataTable dense rows={d.inventory} initialSort="count" empty="No events recorded" cols={[
          { key: "e", label: "Event", value: (r) => r.event, render: (r) => <code className="text-xs">{r.event}</code> },
          { key: "c", label: "Count", align: "right", value: (r) => r.count },
          { key: "p", label: "People", align: "right", value: (r) => r.people },
          { key: "f", label: "First", hide: "sm", value: (r) => r.first, render: (r) => r.first.slice(0, 10) },
          { key: "l", label: "Last", hide: "sm", value: (r) => r.last, render: (r) => r.last.slice(0, 10) },
          { key: "lib", label: "Source", hide: "sm", render: (r) => (r.lib === "web" ? "SDK" : r.lib === "mw-footer" ? "Footer" : r.lib || "–") },
        ]} />
      </Section>
    </Shell>
  );
}
