"use client";

import Link from "next/link";
import { useState } from "react";
import { SITES, siteName } from "@/lib/stats/model";
import { SiteLink } from "@/components/stats/SiteLink";
import { C, DataTable, Delta, Dot, DotStatus, Kpi, Login, Notice, Panel, SERIF, Seg, Shell, Spark, nf, pct, stampOf, useStats } from "@/components/stats/ui";

type Trend = { site: string; people: number; views: number; plays: number; finishes: number; spark: number[]; peopleBefore: number; viewsBefore: number };
type Health = { id: string; status: "ok" | "stale" | "no_data"; lastEvent: string | null; note: string };
type Data = { days: number; generatedAt: string; siteTrends: Trend[]; health: { sites: Health[]; unregistered: string[] }; boundary: { historyStart: string; periodStart: string } };

const rel = (iso: string | null) => {
  if (!iso) return "–";
  const h = Math.floor((Date.now() - Date.parse(iso.replace(" ", "T") + "Z")) / 3600000);
  return h < 1 ? "under 1h ago" : h < 48 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

export default function SitesIndex() {
  const [days, setDays] = useState(30);
  const [mine, setMine] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");
  const { ready, data, error, loading, login, retry } = useStats<Data>("/api/stats", { days, includeInternal: mine });
  if (!data) return ready ? <Login onLogin={login} error={error} loading={loading} retry={retry} /> : <main className="min-h-screen" style={{ background: C.navy }} />;

  const trend = new Map(data.siteTrends.map((t) => [t.site, t]));
  const health = new Map(data.health.sites.map((h) => [h.id, h]));
  const rows = SITES.map((def) => ({ def, t: trend.get(def.id), h: health.get(def.id) }));
  const sending = rows.filter((r) => r.h?.status === "ok").length;
  const people = data.siteTrends.reduce((a, t) => a + t.people, 0);
  const priorPartial = Date.parse(data.boundary.periodStart) - data.days * 86400000 < Date.parse(data.boundary.historyStart + "T00:00:00Z");

  return (
    <Shell title="Sites" subtitle={`Every active Minor Works site · last ${data.days} days vs the ${data.days} before`} active="sites" days={days} onDays={setDays}
      mine={mine} onMine={() => setMine((m) => !m)} loading={loading} stamp={stampOf(data.generatedAt)}
      actions={<Seg label="View" value={view} onChange={setView} options={[["table", "Table"], ["cards", "Cards"]]} />}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Kpi label="Sites listed" value={nf(SITES.length)} sub={`${sending} sending events`} />
        <Kpi label="With product events" value={nf(SITES.filter((s) => s.product && (s.product.started || s.product.conversion)).length)} sub="plays, finishes or goals mapped" />
        <Kpi label="Silent" value={nf(rows.filter((r) => r.h?.status === "no_data").length)} sub="no events in PostHog" color={C.red} />
        <Kpi label="People (sum of sites)" value={nf(people)} sub="a person on two sites counts twice" />
      </div>
      {priorPartial && <Notice tone="warn">PostHog history starts {data.boundary.historyStart}, so the ↑ ↓ changes compare against a partial period.</Notice>}

      {view === "table" ? (
        <Panel pad={false}>
          <div className="px-3.5 pb-3 pt-3.5">
            <DataTable dense initialSort="people" rows={rows} cols={[
              { key: "site", label: "Site", value: (r) => r.def.name, render: (r) => <span><SiteLink id={r.def.id} /><span className="ml-2 hidden text-[11px] lg:inline" style={{ color: C.mute }}>{r.def.host}</span></span> },
              { key: "status", label: "Status", value: (r) => r.h?.status || "", render: (r) => <Dot status={(r.h?.status || "no_data") as DotStatus} /> },
              { key: "people", label: "People", align: "right", value: (r) => r.t?.people ?? -1, render: (r) => (r.t ? <>{nf(r.t.people)} <span className="ml-1 text-[11px]"><Delta p={{ now: r.t.people, before: r.t.peopleBefore }} /></span></> : "–") },
              { key: "views", label: "Views", align: "right", value: (r) => r.t?.views ?? -1, render: (r) => (r.t ? nf(r.t.views) : "–") },
              { key: "starts", label: "Starts", align: "right", hide: "sm", value: (r) => r.t?.plays ?? -1, render: (r) => (r.t && r.def.product?.started ? nf(r.t.plays) : "–") },
              { key: "fin", label: "Finishes", align: "right", hide: "sm", value: (r) => r.t?.finishes ?? -1, render: (r) => (r.t && r.def.product?.started ? nf(r.t.finishes) : "–") },
              { key: "rate", label: "Finish rate", align: "right", hide: "sm", value: (r) => (r.t && r.t.plays ? r.t.finishes / r.t.plays : -1), render: (r) => (r.t && r.def.product?.started ? pct(r.t.finishes, r.t.plays) : "–") },
              { key: "last", label: "Last event", hide: "sm", value: (r) => r.h?.lastEvent || "", render: (r) => rel(r.h?.lastEvent ?? null) },
              { key: "spark", label: "14 days", hide: "sm", render: (r) => (r.t ? <div className="ml-auto w-24"><Spark values={r.t.spark} height={20} /></div> : <span style={{ color: C.mute }}>no data</span>) },
            ]} />
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {rows.sort((a, b) => (b.t?.people ?? -1) - (a.t?.people ?? -1)).map(({ def, t, h }) => (
            <Link key={def.id} href={`/stats/sites/${def.id}`} className="block rounded-xl p-3 transition-shadow hover:shadow-md" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[15px]" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{siteName(def.id)}</h2>
                <span className="text-[11px]">{h ? <Dot status={h.status} /> : null}</span>
              </div>
              {t ? (
                <>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[20px] tabular-nums" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{nf(t.people)}</span>
                    <span className="text-[11px]" style={{ color: C.mute }}>people</span>
                    <span className="text-[11px] font-medium"><Delta p={{ now: t.people, before: t.peopleBefore }} /></span>
                  </div>
                  <Spark values={t.spark} height={24} />
                  <p className="text-[11px] tabular-nums" style={{ color: C.mute }}>{nf(t.views)} views{def.product?.started ? ` · ${nf(t.plays)} starts · ${nf(t.finishes)} finishes` : ""}</p>
                </>
              ) : <p className="mt-2 text-[12px]" style={{ color: C.mute }}>{h?.note || "No events from this site in this range."}</p>}
            </Link>
          ))}
        </div>
      )}
      <p className="pb-2 text-[11px]" style={{ color: C.mute }}>“No data” means PostHog has received nothing from the site, not that nobody visited.</p>
    </Shell>
  );
}
