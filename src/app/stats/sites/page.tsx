"use client";

import Link from "next/link";
import { useState } from "react";
import { SITES, siteName } from "@/lib/stats/model";
import { C, Card, Delta, Dot, Login, Notice, SERIF, Shell, Spark, nf, stampOf, useStats } from "@/components/stats/ui";

type Trend = { site: string; people: number; views: number; plays: number; finishes: number; spark: number[]; peopleBefore: number; viewsBefore: number };
type Health = { id: string; status: "ok" | "stale" | "no_data"; lastEvent: string | null; note: string; footer: boolean };
type Data = { days: number; generatedAt: string; siteTrends: Trend[]; health: { sites: Health[] }; boundary: { historyStart: string } };

export default function SitesIndex() {
  const [days, setDays] = useState(30);
  const [mine, setMine] = useState(false);
  const { ready, data, error, loading, login } = useStats<Data>("/api/stats", { days, includeInternal: mine });
  if (!data) return ready ? <Login onLogin={login} error={error} loading={loading} /> : <main className="min-h-screen" style={{ background: C.navy }} />;

  const trend = new Map(data.siteTrends.map((t) => [t.site, t]));
  const health = new Map(data.health.sites.map((h) => [h.id, h]));
  // Busiest first; silent sites last but still listed, because "no data" is information.
  const order = [...SITES].sort((a, b) => (trend.get(b.id)?.people ?? -1) - (trend.get(a.id)?.people ?? -1));

  return (
    <Shell title="Sites" active="sites" days={days} onDays={setDays} mine={mine} onMine={() => setMine((m) => !m)} loading={loading}>
      <p className="text-xs" style={{ color: C.mute }}>
        Every active Minor Works site. Last {data.days} days vs the {data.days} before · updated {stampOf(data.generatedAt)} Boston time. Open a site for traffic, engagement, acquisition, usage, sharing and retention.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {order.map((def) => {
          const t = trend.get(def.id);
          const h = health.get(def.id);
          return (
            <Link key={def.id} href={`/stats/sites/${def.id}`} className="block rounded-2xl bg-white p-4 transition-shadow hover:shadow-md" style={{ border: `1px solid ${C.line}` }}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{siteName(def.id)}</h2>
                <span className="text-xs">{h ? <Dot status={h.status} /> : null}</span>
              </div>
              <p className="text-xs" style={{ color: C.mute }}>{def.host}{def.external ? " · own database" : ""}</p>
              {t ? (
                <>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl tabular-nums" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{nf(t.people)}</span>
                    <span className="text-xs" style={{ color: C.mute }}>people</span>
                    <span className="text-xs font-medium"><Delta p={{ now: t.people, before: t.peopleBefore }} /></span>
                  </div>
                  <Spark values={t.spark} />
                  <p className="mt-1 text-xs tabular-nums" style={{ color: C.mute }}>
                    {nf(t.views)} views{def.product ? ` · ${nf(t.plays)} started · ${nf(t.finishes)} finished` : ""}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm" style={{ color: C.mute }}>{h?.note || (def.external ? "Product data is in its own database; open for details." : "No events from this site in this range.")}</p>
              )}
            </Link>
          );
        })}
      </div>
      {data.siteTrends.some((t) => !SITES.some((d) => d.id === t.site)) && (
        <Notice tone="warn">Some sites are sending data but are not in the site list yet. See Tracking health on the Overview.</Notice>
      )}
      <Card title="How to read this"><p className="text-sm" style={{ color: C.mute }}>
        “No data” means PostHog has received nothing from that site, not that nobody visited. Comparisons before {data.boundary.historyStart} are not possible because PostHog history starts that day.
      </p></Card>
    </Shell>
  );
}
