"use client";

import { useState } from "react";
import Link from "next/link";
import { siteName } from "@/lib/stats/model";
import { SiteLink } from "@/components/stats/SiteLink";
import { Portfolio, PortfolioChart, SmallMultiples } from "@/components/stats/PortfolioChart";
import {
  C, DataTable, Delta, Donut, Empty, FunnelBars, HBars, Insufficient, Kpi, Login, Notice, Pair, Panel, Section, Seg, Shell, Spark,   dur, flag, nf, pct, stampOf, useStats,
} from "@/components/stats/ui";

type Trend = { site: string; people: number; views: number; plays: number; finishes: number; spark: number[]; peopleBefore: number; viewsBefore: number };
type Health = { id: string; name: string; status: "ok" | "stale" | "no_data" };
type Data = {
  days: number;
  generatedAt: string;
  boundary: { native: string; historyStart: string; covers: "full" | "partial" | "none"; nativeDays: number; periodStart: string };
  totals: { people: Pair; pageViews: Pair; plays: Pair; finishes: Pair; hops: Pair; returning: { now: number; of: number }; activeSecondsPerVisit: number | null };
  native: { sessions: number; avgSessionSeconds: number | null; bounceRate: number | null; pageviews: number; visitors: number; pageleaves: number; avgPageSeconds: number | null };
  daily: { day: string; people: number; views: number; plays: number; finishes: number }[];
  portfolio: Portfolio;
  siteTrends: Trend[];
  referrers: { name: string; people: number }[];
  acquisition: { classes: { name: string; people: number }[]; utm: { source: string; medium: string; campaign: string; people: number }[] };
  devices: { name: string; people: number }[];
  funnel: { visited: number; sawFooter: number; clickedFooter: number; crossedSites: number };
  engagement: { sessions: number; reach25: number; reach50: number; reach75: number; reach100: number; outboundPeople: number };
  conversions: { site: string; event: string; count: number; people: number }[];
  pages: { page: string; views: number }[];
  countries: { code: string; people: number }[];
  sharing: { site: string; players: number; sharers: number; taps: number; arrived: number; siteSharers: number }[];
  health: { sites: Health[]; unregistered: string[] };
};

export default function StatsPage() {
  const [days, setDays] = useState(7);
  const [mine, setMine] = useState(false);
  const [movers, setMovers] = useState<"up" | "down">("up");
  const { ready, data, error, loading, login } = useStats<Data>("/api/stats", { days, includeInternal: mine });

  if (!data) {
    if (!ready) return <main className="min-h-screen" style={{ background: C.navy }} />;
    return <Login onLogin={login} error={error} loading={loading} />;
  }

  const t = data.totals;
  const b = data.boundary;
  const nat = data.native;
  const e = data.engagement;
  const spark = (k: "people" | "views" | "plays" | "finishes") => data.daily.map((d) => d[k]);
  const noSessions = b.covers === "none";
  const finishRate = t.plays.now ? Math.round((t.finishes.now / t.plays.now) * 100) : null;
  const historyDays = (Date.now() - Date.parse(b.historyStart + "T00:00:00Z")) / 86400000;
  const priorReachesBeforeHistory = Date.parse(b.periodStart) - data.days * 86400000 < Date.parse(b.historyStart + "T00:00:00Z");
  const returningOk = historyDays > data.days;
  const sending = data.health.sites.filter((s) => s.status === "ok").length;

  const ranked = data.siteTrends
    .map((s) => ({ ...s, diff: s.people - s.peopleBefore }))
    .filter((s) => s.people + s.peopleBefore >= 5 && (movers === "up" ? s.diff > 0 : s.diff < 0))
    .sort((a, c) => (movers === "up" ? c.diff - a.diff : a.diff - c.diff))
    .slice(0, 6);

  return (
    <Shell title="Portfolio overview" subtitle={`Audience and engagement across all Minor Works sites · last ${data.days} days vs the ${data.days} before`} active="overview"
      days={days} onDays={setDays} mine={mine} onMine={() => setMine((m) => !m)} loading={loading} stamp={stampOf(data.generatedAt)}>

      {(priorReachesBeforeHistory || b.covers !== "full") && (
        <Notice tone="warn">
          {priorReachesBeforeHistory && <>PostHog history starts {b.historyStart}, so the “before” period is incomplete and ↑ ↓ changes overstate growth. </>}
          {b.covers === "none" && <>Session numbers only exist from {b.native}, so none fall in this range. </>}
          {b.covers === "partial" && <>Session numbers only count from {b.native} ({b.nativeDays} days of this range); earlier days have no valid sessions and are not comparable. </>}
          Preview sites are excluded; {mine ? "your own owner-mode visits are included." : "your own owner-mode visits are left out."} Safari visitors may be undercounted.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="People" value={nf(t.people.now)} pair={t.people} spark={spark("people")} />
        <Kpi label="Page views" value={nf(t.pageViews.now)} pair={t.pageViews} spark={spark("views")} />
        <Kpi label="Sessions" value={noSessions ? "–" : nf(nat.sessions)} sub={noSessions ? "not collected here" : `${dur(nat.avgSessionSeconds)} avg · ${nat.bounceRate ?? "–"}% bounce · counts only sessions with a page view, so game sites are undercounted`} color={C.navy2} />
        <Kpi label="Starts (events)" value={nf(t.plays.now)} pair={t.plays} spark={spark("plays")} color={C.red} />
        <Kpi label="Finishes (events)" value={nf(t.finishes.now)} pair={t.finishes} sub={finishRate === null ? undefined : `${finishRate}% of starts`} spark={spark("finishes")} color={C.red} />
        <Kpi label="Tracking health" value={<>{sending} <span className="text-[14px]" style={{ color: C.mute }}>of {data.health.sites.length}</span></>} sub="sites sending events" color={C.green} />
      </div>

      <PortfolioChart data={data.portfolio} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-8"><SmallMultiples data={data.portfolio} /></div>
        <Panel title="Acquisition" note="people · all sites" className="lg:col-span-4">
          <Donut rows={data.acquisition.classes.map((c) => ({ name: c.name, value: c.people }))} />
          <div className="mt-2.5 border-t pt-2" style={{ borderColor: C.line }}>
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: C.mute }}>Tagged links</p>
            {data.acquisition.utm.length ? (
              <DataTable dense rows={data.acquisition.utm} limit={3} cols={[
                { key: "s", label: "Source / medium", render: (r) => <>{r.source || "–"} / {r.medium || "–"}</> },
                { key: "p", label: "People", align: "right", value: (r) => r.people },
              ]} />
            ) : <p className="text-[12px]" style={{ color: C.mute }}>None in this range.</p>}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Panel title="Sites at a glance" note="click a site for its page · click a header to sort" className="lg:col-span-8">
          <DataTable dense rows={data.siteTrends} initialSort="people" empty="No site activity in this range" cols={[
            { key: "site", label: "Site", value: (r) => siteName(r.site), render: (r) => <SiteLink id={r.site} /> },
            { key: "people", label: "People", align: "right", value: (r) => r.people, render: (r) => <>{nf(r.people)} <span className="ml-1 text-[11px]"><Delta p={{ now: r.people, before: r.peopleBefore }} /></span></> },
            { key: "views", label: "Views", align: "right", value: (r) => r.views, render: (r) => <>{nf(r.views)} <span className="ml-1 hidden text-[11px] sm:inline"><Delta p={{ now: r.views, before: r.viewsBefore }} /></span></> },
            { key: "plays", label: "Starts", align: "right", value: (r) => r.plays },
            { key: "finishes", label: "Finishes", align: "right", value: (r) => r.finishes },
            { key: "spark", label: "14 days", hide: "sm", render: (r) => <div className="ml-auto w-24"><Spark values={r.spark} height={20} /></div> },
          ]} />
        </Panel>
        <Panel title="Biggest movers" note="people vs previous period" right={<Seg label="Direction" value={movers} onChange={setMovers} options={[["up", "Top growth"], ["down", "Largest declines"]]} />} className="lg:col-span-4">
          {ranked.length ? (
            <ul className="space-y-2 text-[12.5px]">
              {ranked.map((m) => (
                <li key={m.site} className="flex items-baseline justify-between gap-2">
                  <SiteLink id={m.site} />
                  <span className="tabular-nums" style={{ color: m.diff > 0 ? C.green : C.red }}>
                    {m.diff > 0 ? "+" : "−"}{nf(Math.abs(m.diff))} <span style={{ color: C.mute }}>({nf(m.peopleBefore)} → {nf(m.people)})</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : <Empty text="Nothing moved enough to rank" />}
          <p className="mt-2 text-[11px]" style={{ color: C.mute }}>Needs 5+ people across both periods so small numbers do not look like trends.</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Panel title="From visit to cross-site hop" note="people">
          <FunnelBars unit="people" steps={[
            { label: "Visited a page", value: data.funnel.visited },
            { label: "Saw the footer", value: data.funnel.sawFooter },
            { label: "Clicked a footer card", value: data.funnel.clickedFooter },
            { label: "Arrived from another of our sites", value: data.funnel.crossedSites },
          ]} />
          <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 text-[12px]" style={{ borderColor: C.line }}>
            <div><p style={{ color: C.mute }}>Finish rate (events)</p><p className="text-[18px] font-semibold tabular-nums">{finishRate === null ? "–" : `${finishRate}%`}</p></div>
            <div><p style={{ color: C.mute }}>Returning</p>{returningOk && t.returning.of ? <p className="text-[18px] font-semibold tabular-nums">{pct(t.returning.now, t.returning.of)}</p> : <Insufficient text={`needs more than ${data.days} days of history`} />}</div>
          </div>
          <p className="mt-1.5 text-[10.5px]" style={{ color: C.mute }}>These four are independent counts that overlap, read as a funnel only loosely.</p>
        </Panel>
        <Panel title="Engagement" note={noSessions ? "sessions start 21 Nov" : "share of sessions that scrolled"}>
          {noSessions ? <Empty text="Scroll depth exists from 21 Nov 2026" /> : e.sessions ? (
            <>
              <HBars suffix="%" rows={[
                { name: "Reached 25%", value: Math.round((e.reach25 / e.sessions) * 100) },
                { name: "Reached 50%", value: Math.round((e.reach50 / e.sessions) * 100) },
                { name: "Reached 75%", value: Math.round((e.reach75 / e.sessions) * 100) },
                { name: "Reached the end", value: Math.round((e.reach100 / e.sessions) * 100) },
              ]} />
              <p className="mt-2 border-t pt-2 text-[11.5px]" style={{ borderColor: C.line, color: C.mute }}>
                {nf(e.sessions)} sessions with scroll data · {nf(e.outboundPeople)} people clicked out
                {t.activeSecondsPerVisit !== null && <> · active time per visit <b style={{ color: C.ink }}>{dur(t.activeSecondsPerVisit)}</b></>}
              </p>
            </>
          ) : <Empty text="No sessions with scroll data yet" />}
        </Panel>
        <Panel title="Device mix" note="people">
          <Donut rows={data.devices.map((d) => ({ name: d.name, value: d.people }))} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Panel title="Sharing" note="people who tapped share" className="lg:col-span-6">
          {data.sharing.length ? (
            <>
              <DataTable dense rows={data.sharing} cols={[
                { key: "site", label: "Site", value: (r) => siteName(r.site), render: (r) => <SiteLink id={r.site} /> },
                { key: "players", label: "Players", align: "right", value: (r) => r.players },
                { key: "sharers", label: "Sharers", align: "right", value: (r) => r.sharers },
                { key: "rate", label: "Rate", align: "right", value: (r) => (r.players ? r.sharers / r.players : 0), render: (r) => pct(r.sharers, r.players) },
                { key: "arr", label: "Via a share", align: "right", value: (r) => r.arrived },
              ]} />
              <p className="mt-2 text-[11px]" style={{ color: C.mute }}>Taps are intent, not confirmed sends. The full lifecycle is on each game’s site page.</p>
            </>
          ) : <Empty text="No share taps yet" />}
        </Panel>
        <Panel title="Conversions" note="people · count" className="lg:col-span-6">
          {data.conversions.length ? (
            <DataTable dense rows={data.conversions} initialSort="people" cols={[
              { key: "site", label: "Site", value: (r) => siteName(r.site), render: (r) => <SiteLink id={r.site} /> },
              { key: "event", label: "Event", hide: "sm", render: (r) => r.event.replace(/^mw_/, "").replace(/_/g, " ") },
              { key: "people", label: "People", align: "right", value: (r) => r.people },
              { key: "count", label: "Count", align: "right", value: (r) => r.count },
            ]} />
          ) : <Empty text="No contact, install or outbound events yet" />}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Panel title="Where visitors come from" note="people"><HBars rows={data.referrers.slice(0, 6).map((r) => ({ name: r.name, value: r.people }))} label={(n) => (n === "$direct" ? "Direct" : n)} /></Panel>
        <Panel title="Top pages" note="views"><HBars color={C.navy2} rows={data.pages.slice(0, 6).map((p) => ({ name: p.page, value: p.views }))} /></Panel>
        <Panel title="Countries" note="people"><HBars color={C.red} rows={data.countries.slice(0, 6).map((c) => ({ name: c.code, value: c.people }))} label={(c) => `${flag(c)} ${c}`} /></Panel>
      </div>

      <Section title="Tracking health at a glance" note={`${sending} of ${data.health.sites.length} sending`} open>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] sm:grid-cols-3 lg:grid-cols-6">
          {data.health.sites.map((h) => (
            <li key={h.id} className="flex items-center gap-1.5 truncate">
              <i className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: h.status === "ok" ? C.green : h.status === "stale" ? C.amber : C.mute }} aria-hidden />
              <SiteLink id={h.id} />
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px]"><Link href="/stats/health" className="font-medium" style={{ color: C.blue }}>Open the Health page →</Link></p>
      </Section>

      <p className="pb-2 text-center text-[11px]" style={{ color: C.mute }}>Private page · numbers come from PostHog · metric definitions in docs/stats-2.0-handoff.md</p>
    </Shell>
  );
}
