"use client";

import Link from "next/link";
import { useState } from "react";
import { isSiteId, siteName } from "@/lib/stats/model";
import {
  C, Card, DailyBars, DataTable, Delta, Donut, Dot, Empty, HBars, Login, Notice, Pair, SERIF, Section, Shell, Spark, Stat,
  dur, flag, nf, pct, stampOf, useStats,
} from "@/components/stats/ui";

type Trend = { site: string; people: number; views: number; plays: number; finishes: number; spark: number[]; peopleBefore: number; viewsBefore: number };
type Health = {
  id: string; name: string; host: string; footer: boolean; status: "ok" | "stale" | "no_data"; note: string;
  lastEvent: string | null; firstEvent: string | null; views7: number; nativeViews: number; v7Share: number | null; libs: string[]; productEvents30: number; footerVersion: string | null;
};
type Data = {
  days: number;
  generatedAt: string;
  boundary: { native: string; historyStart: string; covers: "full" | "partial" | "none"; nativeDays: number; periodStart: string };
  totals: {
    people: Pair; pageViews: Pair; plays: Pair; finishes: Pair; hops: Pair;
    returning: { now: number; of: number };
    activeSecondsPerVisit: number | null;
  };
  native: { sessions: number; avgSessionSeconds: number | null; bounceRate: number | null; pageviews: number; visitors: number; pageleaves: number; avgPageSeconds: number | null };
  daily: { day: string; people: number; views: number; plays: number; finishes: number }[];
  sites: { site: string; people: number; views: number; plays: number; finishes: number }[];
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
  integrations: { id: string; name: string; status: "connected" | "tag_only" | "not_connected" | "not_configured" | "error"; detail: string }[];
};

const SiteLink = ({ id }: { id: string }) =>
  isSiteId(id) ? <Link href={`/stats/sites/${id}`} className="font-medium underline-offset-2 hover:underline" style={{ color: C.navy2 }}>{siteName(id)}</Link> : <span className="font-medium">{id}</span>;

const rel = (iso: string | null) => {
  if (!iso) return "–";
  const ms = Date.now() - Date.parse(iso.replace(" ", "T") + "Z");
  const h = Math.floor(ms / 3600000);
  return h < 1 ? "under 1h ago" : h < 48 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

export default function StatsPage() {
  const [days, setDays] = useState(7);
  const [mine, setMine] = useState(false);
  const { ready, data, error, loading, login } = useStats<Data>("/api/stats", { days, includeInternal: mine });

  if (!data) {
    if (!ready) return <main className="min-h-screen" style={{ background: C.navy }} />;
    return <Login onLogin={login} error={error} loading={loading} />;
  }

  const t = data.totals;
  const b = data.boundary;
  const spark = (k: "people" | "views" | "plays" | "finishes") => data.daily.map((d) => d[k]);
  const kpis: { label: string; pair: Pair; key: "people" | "views" | "plays" | "finishes" }[] = [
    { label: "People", pair: t.people, key: "people" },
    { label: "Page views", pair: t.pageViews, key: "views" },
    { label: "Games started", pair: t.plays, key: "plays" },
    { label: "Games finished", pair: t.finishes, key: "finishes" },
  ];
  const f = data.funnel;
  const finishRate = t.plays.now ? Math.round((t.finishes.now / t.plays.now) * 100) : null;
  const periodStartMs = Date.parse(b.periodStart);
  const priorReachesBeforeHistory = periodStartMs - data.days * 86400000 < Date.parse(b.historyStart + "T00:00:00Z");
  const nat = data.native;
  const e = data.engagement;

  // Biggest movers: change in people vs the previous period. Tiny numbers are noise, so need at least 5 people in either period.
  const movers = data.siteTrends
    .map((s) => ({ ...s, diff: s.people - s.peopleBefore }))
    .filter((s) => s.people + s.peopleBefore >= 5 && s.diff !== 0)
    .sort((a, c) => Math.abs(c.diff) - Math.abs(a.diff))
    .slice(0, 5);

  const convBySite = data.conversions;

  return (
    <Shell title="Studio stats" active="overview" days={days} onDays={setDays} mine={mine} onMine={() => setMine((m) => !m)} loading={loading}>
      <p className="text-xs" style={{ color: C.mute }}>
        Last {data.days} days vs the {data.days} before. Updated {stampOf(data.generatedAt)} Boston time. Preview sites excluded. {mine ? "Your own owner-mode visits are included." : "Your own owner-mode visits are left out."} Safari visitors may be undercounted.
      </p>

      {(priorReachesBeforeHistory || b.covers !== "full") && (
        <Notice tone="warn">
          {priorReachesBeforeHistory && <>PostHog history starts {b.historyStart}, so the “before” period is incomplete and the ↑ ↓ changes overstate growth. </>}
          {b.covers === "none" && <>Session numbers (sessions, average session, bounce, scroll depth) only exist from {b.native}, so none fall in this range. </>}
          {b.covers === "partial" && <>Session numbers only count from {b.native} ({b.nativeDays} days of this range); earlier events have no valid sessions and are not comparable. Page views before then are our own events. </>}
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${C.line}` }}>
            <p className="text-sm" style={{ color: C.mute }}>{k.label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl tabular-nums" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{nf(k.pair.now)}</span>
              <span className="text-xs font-medium"><Delta p={k.pair} /></span>
            </div>
            <Spark values={spark(k.key)} color={k.key === "plays" || k.key === "finishes" ? C.red : C.blue} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Session metrics">
        <Stat label="Sessions" value={b.covers === "none" ? "–" : nf(nat.sessions)} sub={b.covers === "none" ? "not collected in this range" : "PostHog sessions"} />
        <Stat label="Average session" value={b.covers === "none" ? "–" : dur(nat.avgSessionSeconds)} sub="PostHog sessions" />
        <Stat label="Bounce rate" value={b.covers === "none" || nat.bounceRate === null ? "–" : `${nat.bounceRate}%`} sub="one page, under 10s" />
        <Stat label="Time on a page" value={b.covers === "none" ? "–" : dur(nat.avgPageSeconds)} sub={`${nf(nat.pageleaves)} page leaves`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Daily activity" className="lg:col-span-2"><DailyBars days={data.days} daily={data.daily} /></Card>
        <Card title="From visit to cross-site hop" note="people">
          <HBars color={C.navy2} rows={[
            { name: "Visited a page", value: f.visited },
            { name: "Saw the footer", value: f.sawFooter },
            { name: "Clicked a footer card", value: f.clickedFooter },
            { name: "Arrived from another of our sites", value: f.crossedSites },
          ]} />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm" style={{ borderColor: C.line }}>
            <div><p style={{ color: C.mute }}>Finish rate</p><p className="text-xl font-semibold tabular-nums">{finishRate === null ? "–" : `${finishRate}%`}</p></div>
            <div><p style={{ color: C.mute }}>Returning</p><p className="text-xl font-semibold tabular-nums">{t.returning.of ? `${Math.round((t.returning.now / t.returning.of) * 100)}%` : "–"}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="By site" className="lg:col-span-2" note={`last ${data.days} days · click a site for its page`}>
          <DataTable
            rows={data.siteTrends}
            initialSort="people"
            empty="No site activity in this range"
            cols={[
              { key: "site", label: "Site", value: (r) => siteName(r.site), render: (r) => <SiteLink id={r.site} /> },
              { key: "people", label: "People", align: "right", value: (r) => r.people, render: (r) => <>{nf(r.people)} <span className="ml-1 text-xs"><Delta p={{ now: r.people, before: r.peopleBefore }} /></span></> },
              { key: "views", label: "Views", align: "right", value: (r) => r.views, render: (r) => <>{nf(r.views)} <span className="ml-1 hidden text-xs sm:inline"><Delta p={{ now: r.views, before: r.viewsBefore }} /></span></> },
              { key: "plays", label: "Started", align: "right", value: (r) => r.plays },
              { key: "finishes", label: "Finished", align: "right", value: (r) => r.finishes },
              { key: "spark", label: "14 days", hide: "sm", render: (r) => <div className="ml-auto w-24"><Spark values={r.spark} height={22} /></div> },
            ]}
          />
        </Card>
        <Card title="Biggest movers" note="people vs previous period">
          {movers.length ? (
            <ul className="space-y-2.5 text-sm">
              {movers.map((m) => (
                <li key={m.site} className="flex items-baseline justify-between gap-2">
                  <SiteLink id={m.site} />
                  <span className="tabular-nums" style={{ color: m.diff > 0 ? C.green : C.red }}>
                    {m.diff > 0 ? "+" : "−"}{nf(Math.abs(m.diff))} <span style={{ color: C.mute }}>({nf(m.peopleBefore)} → {nf(m.people)})</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : <Empty text="No site changed enough to rank" />}
          <p className="mt-3 text-xs" style={{ color: C.mute }}>Needs at least 5 people across both periods, so small numbers do not look like trends.</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Acquisition" note="people · all sites">
          <HBars rows={data.acquisition.classes.map((c) => ({ name: c.name, value: c.people }))} color={C.navy2} />
          <div className="mt-4 border-t pt-3" style={{ borderColor: C.line }}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: C.mute }}>Tagged links (UTM)</p>
            {data.acquisition.utm.length ? (
              <DataTable rows={data.acquisition.utm} cols={[
                { key: "s", label: "Source / medium", render: (r) => <>{r.source || "–"} / {r.medium || "–"}</> },
                { key: "c", label: "Campaign", hide: "sm", render: (r) => r.campaign || "–" },
                { key: "p", label: "People", align: "right", value: (r) => r.people },
              ]} limit={5} />
            ) : <p className="text-sm" style={{ color: C.mute }}>No tagged links in this range.</p>}
          </div>
        </Card>
        <Card title="Engagement" note={b.covers === "none" ? "not collected in this range" : "share of sessions that scrolled"}>
          {b.covers === "none" ? <Empty text="Scroll depth exists from 21 Nov 2026" /> : e.sessions ? (
            <>
              <HBars color={C.blue} suffix="%" rows={[
                { name: "Reached 25%", value: Math.round((e.reach25 / e.sessions) * 100) },
                { name: "Reached 50%", value: Math.round((e.reach50 / e.sessions) * 100) },
                { name: "Reached 75%", value: Math.round((e.reach75 / e.sessions) * 100) },
                { name: "Reached the end", value: Math.round((e.reach100 / e.sessions) * 100) },
              ]} />
              <p className="mt-3 border-t pt-3 text-sm" style={{ borderColor: C.line, color: C.mute }}>
                Out of {nf(e.sessions)} sessions with scroll data · {nf(e.outboundPeople)} people clicked out to another site
                {t.activeSecondsPerVisit !== null && <> · active time per visit <b style={{ color: C.ink }}>{dur(t.activeSecondsPerVisit)}</b></>}
              </p>
            </>
          ) : <Empty text="No sessions with scroll data yet" />}
        </Card>
        <Card title="Conversions" note="people · count">
          {convBySite.length ? (
            <DataTable rows={convBySite} initialSort="people" cols={[
              { key: "site", label: "Site", value: (r) => siteName(r.site), render: (r) => <SiteLink id={r.site} /> },
              { key: "event", label: "Event", hide: "sm", render: (r) => r.event.replace(/^mw_/, "").replace(/_/g, " ") },
              { key: "people", label: "People", align: "right", value: (r) => r.people },
              { key: "count", label: "Count", align: "right", value: (r) => r.count },
            ]} />
          ) : <Empty text="No contact, install or outbound events yet" />}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Where visitors come from" note="people">
          <HBars rows={data.referrers.map((r) => ({ name: r.name, value: r.people }))} label={(n) => (n === "$direct" ? "Direct" : n)} />
        </Card>
        <Card title="Top pages" note="views">
          <HBars color={C.navy2} rows={data.pages.map((p) => ({ name: p.page, value: p.views }))} />
        </Card>
        <Card title="Countries" note="people">
          <HBars color={C.red} rows={data.countries.map((c) => ({ name: c.code, value: c.people }))} label={(c) => `${flag(c)} ${c}`} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Sharing" className="lg:col-span-2" note="people who tapped share">
          {data.sharing.length ? (
            <>
              <DataTable rows={data.sharing} cols={[
                { key: "site", label: "Site", value: (r) => siteName(r.site), render: (r) => <SiteLink id={r.site} /> },
                { key: "players", label: "Players", align: "right", value: (r) => r.players },
                { key: "sharers", label: "Sharers", align: "right", value: (r) => r.sharers },
                { key: "rate", label: "Share rate", align: "right", value: (r) => (r.players ? r.sharers / r.players : 0), render: (r) => pct(r.sharers, r.players) },
                { key: "taps", label: "Taps", align: "right", value: (r) => r.taps, hide: "sm" },
                { key: "arr", label: "Came via a share", align: "right", value: (r) => r.arrived, hide: "sm" },
              ]} />
              <p className="mt-3 text-xs" style={{ color: C.mute }}>
                Taps are presses of a share button, not confirmed sends. Share rate is sharers divided by people who started a puzzle. Games not listed send no share events yet. Small Canon sharing lives in its own database; see its site page.
              </p>
            </>
          ) : <Empty text="No share taps yet" />}
        </Card>
        <Card title="Devices" note="people">
          <Donut rows={data.devices.map((d) => ({ name: d.name, value: d.people }))} />
        </Card>
      </div>

      <Section title="Tracking health" note={`${data.health.sites.filter((s) => s.status === "ok").length} of ${data.health.sites.length} sites sending`}>
        <DataTable
          rows={data.health.sites}
          cols={[
            { key: "site", label: "Site", value: (r) => r.name, render: (r) => <SiteLink id={r.id} /> },
            { key: "status", label: "Status", value: (r) => r.status, render: (r) => <Dot status={r.status} /> },
            { key: "last", label: "Last event", value: (r) => r.lastEvent || "", render: (r) => rel(r.lastEvent) },
            { key: "v7", label: "Page views 7d", align: "right", value: (r) => r.views7, hide: "sm" },
            { key: "nv", label: "Native views", align: "right", value: (r) => r.nativeViews, hide: "sm" },
            { key: "v7s", label: "Valid sessions", align: "right", value: (r) => r.v7Share ?? -1, render: (r) => (r.v7Share === null ? "–" : `${r.v7Share}%`), hide: "sm" },
            { key: "ver", label: "Footer", hide: "sm", render: (r) => (r.footer ? r.footerVersion || "–" : "none") },
            { key: "note", label: "Note", hide: "sm", render: (r) => <span style={{ color: C.mute }}>{r.note || (r.libs.includes("web") && r.libs.includes("mw-footer") ? "SDK + footer" : "")}</span> },
          ]}
        />
        {data.health.unregistered.length > 0 && (
          <p className="mt-3 text-xs" style={{ color: C.red }}>Sending data but not in the site list: {data.health.unregistered.join(", ")}. Add them to src/lib/stats/model.ts.</p>
        )}
        <p className="mt-3 text-xs" style={{ color: C.mute }}>
          “No data” means PostHog has received nothing from the site, which is different from a quiet site. “Valid sessions” is the share of page views carrying a usable session id (should be 100% after 21 Nov).
        </p>
      </Section>

      <Section title="Data sources" note="what this dashboard can and cannot read" open={false}>
        <ul className="divide-y text-sm" style={{ borderColor: C.line }}>
          {data.integrations.map((i) => (
            <li key={i.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:gap-4" style={{ borderColor: C.line }}>
              <span className="w-56 shrink-0 font-medium">{i.name}</span>
              <span className="w-36 shrink-0"><Dot status={i.status} /></span>
              <span style={{ color: C.mute }}>{i.detail}</span>
            </li>
          ))}
        </ul>
      </Section>

      <p className="pb-6 text-center text-xs" style={{ color: C.mute }}>
        Private page · numbers come from PostHog · full detail lives in the Minor Works: Studio Overview dashboard there.
      </p>
    </Shell>
  );
}
