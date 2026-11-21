"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DEFINITIONS, NATIVE_BOUNDARY, POSTHOG_HISTORY_START } from "@/lib/stats/model";
import {
  C, Card, DataTable, Donut, Empty, Heatmap, HBars, LineChart, Login, Notice, Pair, Section, Shell, Stat, dur, etDay, flag, nf, pct, stampOf, useStats,
} from "@/components/stats/ui";

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
  usage: { funnel: { label: string; people: number }[]; counters: { label: string; count: number; people: number }[] };
  sharing: { startedPeople: number; tapPeople: number; taps: number; donePeople: number; done: number; arrivedPeople: number; arrived: number; configured: boolean };
  conversions: { label: string; event: string; count: number; people: number }[];
  retention: { activeDays: { days: number; people: number }[]; cohort: { people: number; returned: number }; returning: { now: number; of: number } };
  devices: { name: string; people: number }[];
  countries: { code: string; people: number }[];
  inventory: { event: string; count: number; people: number; first: string; last: string; lib: string }[];
  external: null | { configured: false } | { configured: true; ok: false; error: string } | { configured: true; ok: true; data: Record<string, unknown> };
};

const DEVICES = [["", "All devices"], ["desktop", "Desktop"], ["mobile", "Mobile"], ["tablet", "Tablet"]] as const;

/** One value per calendar day in range. Days with no PostHog history are null ("not collected"), never 0. */
function fill(days: number, rows: Data["daily"], pick: (d: Data["daily"][number]) => number, from: string) {
  const by = new Map(rows.map((r) => [r.day, r]));
  const labels: string[] = [], values: (number | null)[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = etDay(i);
    if (day < POSTHOG_HISTORY_START) continue; // nothing exists before this day; do not draw an empty axis
    labels.push(day);
    values.push(day < from ? null : by.has(day) ? pick(by.get(day)!) : 0);
  }
  return { labels, values };
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

  const d = data, t = d.totals, b = d.boundary, nat = d.native, e = d.engagement;
  const s = d.site;
  const noSessions = b.covers === "none";
  const silent = !t.people.now && !t.views.now && !d.inventory.length && !d.external;
  const deviceSelect = (
    <select aria-label="Device" value={device} onChange={(ev) => setDevice(ev.target.value)} className="rounded-xl px-3 py-2 text-sm font-medium" style={{ background: C.navy2, color: "#c9d6f2" }}>
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
    ...(s.hasProductEvents ? [
      { key: "started", label: "Started", color: C.red, values: started.values },
      { key: "finished", label: "Finished", color: C.green, values: finished.values },
    ] : []),
  ];
  const dailyRows = ppl.labels.map((day, i) => ({ day, people: ppl.values[i], views: views.values[i], sessions: sess.values[i], started: started.values[i], finished: finished.values[i], taps: taps.values[i] })).reverse();
  const cell = (v: number | null) => (v === null ? <span style={{ color: C.mute }}>n/a</span> : nf(v));

  const stepRows = d.usage.funnel.map((st, i, arr) => ({ name: st.label, value: st.people, extra: i ? `${pct(st.people, arr[i - 1].people)} of previous` : undefined }));
  const hasSharing = d.sharing.configured;
  const ret = d.retention;
  const activeTotal = ret.activeDays.reduce((a, r) => a + r.people, 0);

  return (
    <Shell title={s.name} active="sites" days={days} onDays={setDays} mine={mine} onMine={() => setMine((m) => !m)} loading={loading} extra={deviceSelect}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs" style={{ color: C.mute }}>
        <p><Link href="/stats/sites" className="underline-offset-2 hover:underline" style={{ color: C.navy2 }}>← All sites</Link> · {s.host} · last {d.days} days{device ? `, ${device} only` : ""} · updated {stampOf(d.generatedAt)} Boston time · {mine ? "including" : "excluding"} your own visits</p>
        <p>Footer: {s.footer ? "installed" : "not installed"}{s.sdk ? " · SDK pageviews" : ""}</p>
      </div>

      {s.note && <Notice tone="warn">{s.note}</Notice>}
      {silent && <Notice tone="warn">PostHog has received no events from this site. That is missing data, not a count of zero visitors.</Notice>}
      {!silent && (b.covers !== "full" || d.days > 3) && (
        <Notice>
          PostHog history starts {POSTHOG_HISTORY_START}; sessions, bounce and scroll depth only exist from {NATIVE_BOUNDARY}. Days before are shown as “n/a” in the chart rather than zero, and comparisons with the previous period are partial.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="People" value={nf(t.people.now)} pair={t.people} />
        <Stat label="Page views" value={nf(t.views.now)} pair={t.views} />
        <Stat label="Sessions" value={noSessions ? "–" : nf(nat.sessions)} sub={noSessions ? "not collected in this range" : `${nat.pagesPerSession ?? "–"} pages each`} />
        <Stat label="Average session" value={noSessions ? "–" : dur(nat.avgSessionSeconds)} sub={noSessions || nat.bounceRate === null ? undefined : `${nat.bounceRate}% bounce`} />
        {s.hasProductEvents && s.kind === "game" && <>
          <Stat label="Started" value={nf(t.started.now)} pair={t.started} sub={`${nf(t.startedPeople.now)} people`} />
          <Stat label="Finished" value={nf(t.finished.now)} pair={t.finished} sub={`${pct(t.finished.now, t.started.now)} finish rate`} />
          <Stat label="Sharers" value={nf(t.sharerPeople.now)} pair={t.sharerPeople} sub={hasSharing ? `${pct(t.sharerPeople.now, t.startedPeople.now)} of players` : "no share events"} />
          <Stat label="Returning" value={ret.returning.of ? pct(ret.returning.now, ret.returning.of) : "–"} sub="first seen before range" />
        </>}
      </div>

      <Section title="Traffic" note="click a legend chip to hide a line · hover or touch the chart">
        <LineChart labels={ppl.labels} series={series} />
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>When people visit (Boston time)</p>
            <Heatmap cells={d.hours} />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Entry pages{noSessions ? "" : " (sessions)"}</p>
            {noSessions ? <Empty text="Entry pages come from sessions, which start 21 Nov 2026" /> : (
              <DataTable rows={d.entry} initialSort="sessions" limit={6} cols={[
                { key: "p", label: "Page", value: (r) => r.path, render: (r) => <span className="break-all">{r.path}</span> },
                { key: "s", label: "Sessions", align: "right", value: (r) => r.sessions },
                { key: "b", label: "Bounced", align: "right", value: (r) => (r.sessions ? r.bounced / r.sessions : 0), render: (r) => pct(r.bounced, r.sessions) },
              ]} />
            )}
          </div>
        </div>
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-medium" style={{ color: C.blue }}>Day-by-day table</summary>
          <div className="mt-3">
            <DataTable rows={dailyRows} cols={[
              { key: "day", label: "Day", value: (r) => r.day },
              { key: "people", label: "People", align: "right", value: (r) => r.people ?? -1, render: (r) => cell(r.people) },
              { key: "views", label: "Views", align: "right", value: (r) => r.views ?? -1, render: (r) => cell(r.views) },
              { key: "sessions", label: "Sessions", align: "right", value: (r) => r.sessions ?? -1, render: (r) => cell(r.sessions) },
              ...(s.hasProductEvents ? [
                { key: "started", label: "Started", align: "right" as const, value: (r: typeof dailyRows[number]) => r.started ?? -1, render: (r: typeof dailyRows[number]) => cell(r.started) },
                { key: "finished", label: "Finished", align: "right" as const, value: (r: typeof dailyRows[number]) => r.finished ?? -1, render: (r: typeof dailyRows[number]) => cell(r.finished) },
                { key: "taps", label: "Share taps", align: "right" as const, hide: "sm" as const, value: (r: typeof dailyRows[number]) => r.taps ?? -1, render: (r: typeof dailyRows[number]) => cell(r.taps) },
              ] : []),
            ]} limit={14} />
          </div>
        </details>
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Top pages</p>
          <DataTable rows={d.pages} initialSort="views" limit={8} cols={[
            { key: "p", label: "Page", value: (r) => r.path, render: (r) => <span className="break-all">{r.path}</span> },
            { key: "v", label: "Views", align: "right", value: (r) => r.views },
            { key: "pp", label: "People", align: "right", value: (r) => r.people },
          ]} />
        </div>
      </Section>

      {s.hasProductEvents && d.usage.funnel.length > 0 && (
        <Section title="Usage" note="people who reached each step">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <HBars color={C.navy2} rows={stepRows} />
            <DataTable rows={d.usage.counters} cols={[
              { key: "l", label: "Counter", value: (r) => r.label },
              { key: "c", label: "Count", align: "right", value: (r) => r.count },
              { key: "p", label: "People", align: "right", value: (r) => r.people },
              { key: "a", label: "Per person", align: "right", value: (r) => (r.people ? r.count / r.people : 0), render: (r) => (r.people ? (r.count / r.people).toFixed(1) : "–") },
            ]} empty="No counters defined" />
          </div>
          <p className="mt-3 text-xs" style={{ color: C.mute }}>{DEFINITIONS.started} {DEFINITIONS.finished} Steps count people who sent that event at least once, so a later step can exceed an earlier one if the earlier event is not sent on every path.</p>
        </Section>
      )}

      <Section title="Engagement" note={noSessions ? "scroll depth exists from 21 Nov 2026" : "share of sessions"}>
        {noSessions ? <Empty text="No sessions with scroll data in this range" /> : e.sessions ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <HBars suffix="%" rows={[
              { name: "Reached 25%", value: Math.round((e.reach25 / e.sessions) * 100) },
              { name: "Reached 50%", value: Math.round((e.reach50 / e.sessions) * 100) },
              { name: "Reached 75%", value: Math.round((e.reach75 / e.sessions) * 100) },
              { name: "Reached the end", value: Math.round((e.reach100 / e.sessions) * 100) },
            ]} />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Active time per visit" value={dur(e.activeSecondsPerVisit)} />
              <Stat label="Clicked out" value={nf(e.outboundPeople)} sub="people, to another site" />
              <Stat label="Saw the footer" value={nf(e.footerSeen)} sub="people" />
              <Stat label="Clicked a footer card" value={nf(e.footerClicked)} sub="people" />
            </div>
          </div>
        ) : <Empty text="No sessions with scroll data yet" />}
      </Section>

      <Section title="Acquisition" note="people">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div><p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Channel</p><HBars color={C.navy2} rows={d.acquisition.classes.map((c) => ({ name: c.name, value: c.people }))} /></div>
          <div><p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Referrers</p><HBars rows={d.acquisition.referrers.map((r) => ({ name: r.name, value: r.people }))} label={(n) => (n === "$direct" ? "Direct" : n)} /></div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Tagged links (UTM)</p>
            <DataTable rows={d.acquisition.utm} empty="No tagged links in this range" cols={[
              { key: "s", label: "Source / medium", render: (r) => <>{r.source || "–"} / {r.medium || "–"}</> },
              { key: "p", label: "People", align: "right", value: (r) => r.people },
            ]} limit={6} />
          </div>
        </div>
      </Section>

      {hasSharing && (
        <Section title="Sharing" note="people · taps are intent, not confirmed sends">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Tapped share" value={nf(d.sharing.tapPeople)} sub={`${pct(d.sharing.tapPeople, d.sharing.startedPeople)} of ${nf(d.sharing.startedPeople)} players · ${nf(d.sharing.taps)} taps`} />
            <Stat label="Share completed" value={nf(d.sharing.donePeople)} sub={d.sharing.done ? `${nf(d.sharing.done)} events` : "browsers rarely report this"} />
            <Stat label="Arrived via a share" value={nf(d.sharing.arrivedPeople)} sub={`${nf(d.sharing.arrived)} events`} />
            <Stat label="Arrivals per sharer" value={d.sharing.tapPeople ? (d.sharing.arrivedPeople / d.sharing.tapPeople).toFixed(2) : "–"} sub="rough viral loop" />
          </div>
        </Section>
      )}

      {d.conversions.length > 0 && (
        <Section title="Conversions">
          <DataTable rows={d.conversions} cols={[
            { key: "l", label: "Goal", value: (r) => r.label },
            { key: "e", label: "Event", hide: "sm", render: (r) => <code className="text-xs">{r.event}</code> },
            { key: "p", label: "People", align: "right", value: (r) => r.people },
            { key: "c", label: "Count", align: "right", value: (r) => r.count },
            { key: "r", label: "Of visitors", align: "right", value: (r) => (t.people.now ? r.people / t.people.now : 0), render: (r) => pct(r.people, t.people.now) },
          ]} />
        </Section>
      )}

      <Section title="Retention" note="Boston-time days">
        {ret.cohort.people || activeTotal ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Days each person was active</p>
              <HBars color={C.navy2} rows={ret.activeDays.map((r) => ({ name: r.days >= 5 ? "5+ days" : `${r.days} day${r.days === 1 ? "" : "s"}`, value: r.people }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="New people who came back" value={ret.cohort.people ? pct(ret.cohort.returned, ret.cohort.people) : "–"} sub={`${nf(ret.cohort.returned)} of ${nf(ret.cohort.people)} first seen in range, more than 1 day ago`} />
              <Stat label="Returning" value={ret.returning.of ? pct(ret.returning.now, ret.returning.of) : "–"} sub={`${nf(ret.returning.now)} of ${nf(ret.returning.of)} active people`} />
            </div>
          </div>
        ) : <Empty text="No people in this range" />}
        <p className="mt-3 text-xs" style={{ color: C.mute }}>{DEFINITIONS.returning} Retention on a 3-day-old dataset says little yet; treat it as a baseline to compare against later.</p>
      </Section>

      <Section title="Audience" note="people">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div><p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Devices</p><Donut rows={d.devices.map((x) => ({ name: x.name, value: x.people }))} /></div>
          <div><p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Countries</p><HBars color={C.red} rows={d.countries.map((c) => ({ name: c.code, value: c.people }))} label={(c) => `${flag(c)} ${c}`} /></div>
        </div>
      </Section>

      {d.external !== null && (
        <Section title="Product database (Supabase)" note="Small Canon poster, shelf and share events">
          {!d.external.configured ? (
            <Notice tone="warn">Not connected yet. Set SMALLCANON_STATS_URL and SMALLCANON_STATS_PASSWORD on the server and this section will fill in. PostHog has no Small Canon product events today.</Notice>
          ) : !d.external.ok ? (
            <Notice tone="warn">Could not read the Small Canon stats function: {d.external.error}</Notice>
          ) : (
            <pre className="overflow-x-auto rounded-lg p-3 text-xs" style={{ background: C.bg, color: C.ink }}>{JSON.stringify(d.external.data, null, 2).slice(0, 6000)}</pre>
          )}
        </Section>
      )}

      <Section title="Event inventory" note="last 90 days · what this site actually sends" open={false}>
        <DataTable rows={d.inventory} initialSort="count" cols={[
          { key: "e", label: "Event", value: (r) => r.event, render: (r) => <code className="text-xs">{r.event}</code> },
          { key: "c", label: "Count", align: "right", value: (r) => r.count },
          { key: "p", label: "People", align: "right", value: (r) => r.people },
          { key: "f", label: "First", hide: "sm", value: (r) => r.first, render: (r) => r.first.slice(0, 10) },
          { key: "l", label: "Last", hide: "sm", value: (r) => r.last, render: (r) => r.last.slice(0, 10) },
          { key: "lib", label: "Source", hide: "sm", render: (r) => (r.lib === "web" ? "SDK" : r.lib === "mw-footer" ? "Footer" : r.lib || "–") },
        ]} empty="No events recorded" />
      </Section>

      <p className="pb-6 text-center text-xs" style={{ color: C.mute }}>Private page · numbers come from PostHog{s.id === "smallcanon" ? " and the Small Canon database" : ""}.</p>
    </Shell>
  );
}
