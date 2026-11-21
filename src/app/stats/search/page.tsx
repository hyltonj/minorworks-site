"use client";

import { useState } from "react";
import { C, Dot, DotStatus, Login, Notice, Panel, Shell, stampOf, useStats } from "@/components/stats/ui";

type Data = { generatedAt: string; integrations: { id: string; name: string; status: DotStatus; detail: string }[] };

export default function SearchPage() {
  const [mine, setMine] = useState(false);
  const { ready, data, error, loading, login } = useStats<Data>("/api/stats", { days: 7, includeInternal: mine });
  if (!data) return ready ? <Login onLogin={login} error={error} loading={loading} /> : <main className="min-h-screen" style={{ background: C.navy }} />;
  const gsc = data.integrations.find((i) => i.id === "gsc");
  const ga4 = data.integrations.find((i) => i.id === "ga4");
  return (
    <Shell title="Search performance" subtitle="Google Search Console and GA4 · not connected yet" active="search" loading={loading} stamp={stampOf(data.generatedAt)}>
      <Notice tone="warn">No search numbers are shown on purpose: nothing here reads Google yet, and an empty chart would look like zero clicks. This page is the placeholder for the Search Console view in the original design.</Notice>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Panel title="Search Console" note={gsc ? <Dot status={gsc.status} /> : undefined}>
          <p className="text-[12.5px]" style={{ color: C.mute }}>{gsc?.detail}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[12.5px]">
            <li>Verify <b>minorworks.co</b> as a Domain property (DNS TXT record). This covers every subdomain.</li>
            <li>Verify <b>playballpark.app</b> and <b>playvenny.app</b> separately (their own domains).</li>
            <li>Create a read-only service account and add it as a Restricted user on each property.</li>
            <li>Add its key as a server-side Netlify variable. Never in the page or in chat.</li>
          </ol>
          <p className="mt-2 text-[11.5px]" style={{ color: C.mute }}>Once verified, Search Console returns up to 16 months of history, including the weeks before PostHog started.</p>
        </Panel>
        <Panel title="Google Analytics 4" note={ga4 ? <Dot status={ga4.status} /> : undefined}>
          <p className="text-[12.5px]" style={{ color: C.mute }}>{ga4?.detail}</p>
          <p className="mt-2 text-[12.5px]"><b>Why GA4 shows far fewer visitors than PostHog:</b> the footer only loads GA4 on pages that ask for it, honours Do Not Track and Global Privacy Control, and waits for consent in Europe. The games (where most people are) do not load it at all. So GA4 mostly sees Margin and the main site. PostHog is the complete source; GA4 is a partial cross-check.</p>
          <p className="mt-2 text-[11.5px]" style={{ color: C.mute }}>Plan: the same service account gets Viewer on the GA4 property; history is whatever the property collected.</p>
        </Panel>
      </div>
    </Shell>
  );
}
