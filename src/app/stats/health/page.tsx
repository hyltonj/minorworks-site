"use client";

import { useState } from "react";
import { SiteLink } from "@/components/stats/SiteLink";
import { C, DataTable, Dot, DotStatus, Kpi, Login, Panel, Shell, nf, stampOf, useStats } from "@/components/stats/ui";

type Health = {
  id: string; name: string; host: string; footer: boolean; status: "ok" | "stale" | "no_data"; note: string;
  lastEvent: string | null; firstEvent: string | null; views7: number; nativeViews: number; v7Share: number | null; libs: string[]; productEvents30: number; footerVersion: string | null;
};
type Data = {
  generatedAt: string;
  health: { sites: Health[]; unregistered: string[] };
  integrations: { id: string; name: string; status: DotStatus; detail: string }[];
};

const rel = (iso: string | null) => {
  if (!iso) return "–";
  const h = Math.floor((Date.now() - Date.parse(iso.replace(" ", "T") + "Z")) / 3600000);
  return h < 1 ? "under 1h ago" : h < 48 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

export default function HealthPage() {
  const [mine, setMine] = useState(false);
  const { ready, data, error, loading, login } = useStats<Data>("/api/stats", { days: 7, includeInternal: mine });
  if (!data) return ready ? <Login onLogin={login} error={error} loading={loading} /> : <main className="min-h-screen" style={{ background: C.navy }} />;
  const sites = data.health.sites;
  const ok = sites.filter((s) => s.status === "ok").length;
  const silent = sites.filter((s) => s.status === "no_data");
  const stale = sites.filter((s) => s.status === "stale");
  const noFooter = sites.filter((s) => !s.footer);

  return (
    <Shell title="Instrumentation health" subtitle="Tracking status, data freshness and coverage across all sites" active="health" loading={loading} stamp={stampOf(data.generatedAt)}>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Kpi label="Sites sending events" value={<>{ok} <span className="text-[14px]" style={{ color: C.mute }}>of {sites.length}</span></>} color={C.green} />
        <Kpi label="Quiet for 3+ days" value={nf(stale.length)} sub={stale.map((s) => s.name).join(", ") || "none"} color={C.amber} />
        <Kpi label="No events received" value={nf(silent.length)} sub="missing data, not zero traffic" color={C.red} />
        <Kpi label="Footer not installed" value={nf(noFooter.length)} sub={noFooter.map((s) => s.name).join(", ") || "none"} />
      </div>
      <Panel title="Per-site status" note="installed · deployed · confirmed working" pad={false}>
        <div className="px-3.5 pb-3 pt-1">
          <DataTable dense rows={sites} cols={[
            { key: "site", label: "Site", value: (r) => r.name, render: (r) => <SiteLink id={r.id} /> },
            { key: "host", label: "Domain", hide: "sm", render: (r) => <span style={{ color: C.mute }}>{r.host}</span> },
            { key: "status", label: "PostHog", value: (r) => r.status, render: (r) => <Dot status={r.status as DotStatus} /> },
            { key: "last", label: "Last event", value: (r) => r.lastEvent || "", render: (r) => rel(r.lastEvent) },
            { key: "ver", label: "Footer", hide: "sm", render: (r) => (r.footer ? r.footerVersion || "not seen" : "none") },
            { key: "v7", label: "Page views 7d", align: "right", hide: "sm", value: (r) => r.views7 },
            { key: "nv", label: "Native views", align: "right", hide: "sm", value: (r) => r.nativeViews },
            { key: "ss", label: "Valid sessions", align: "right", hide: "sm", value: (r) => r.v7Share ?? -1, render: (r) => (r.v7Share === null ? "–" : `${r.v7Share}%`) },
            { key: "pe", label: "Product events 30d", align: "right", hide: "sm", value: (r) => r.productEvents30 },
            { key: "note", label: "Note", hide: "sm", render: (r) => <span style={{ color: C.mute }}>{r.note || (r.libs.includes("web") && r.libs.includes("mw-footer") ? "SDK + footer" : "")}</span> },
          ]} />
          {data.health.unregistered.length > 0 && <p className="mt-2 text-[11px]" style={{ color: C.red }}>Sending data but not in the site list: {data.health.unregistered.join(", ")}.</p>}
          <p className="mt-2 text-[11px]" style={{ color: C.mute }}>“Valid sessions” is the share of native page views carrying a UUID v7 session id (should be 100% after 21 Nov 2026). Ballpark and Venny send few native page views because their game SDK rarely sends one on load; their session counts use SDK sessions instead (see each site page).</p>
        </div>
      </Panel>
      <Panel title="Data sources" note="what this dashboard can and cannot read">
        <ul className="divide-y text-[12.5px]">
          {data.integrations.map((i) => (
            <li key={i.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-baseline sm:gap-4" style={{ borderColor: C.line }}>
              <span className="w-56 shrink-0 font-medium">{i.name}</span>
              <span className="w-32 shrink-0"><Dot status={i.status} /></span>
              <span style={{ color: C.mute }}>{i.detail}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </Shell>
  );
}
