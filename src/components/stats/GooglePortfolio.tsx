"use client";

import Link from "next/link";
import { C, Panel, useStats } from "@/components/stats/ui";

type Source = { status: "connected" | "no_data" | "missing" | "error"; message?: string; clicks?:number; impressions?:number; ctr?:number; users?:number; sessions?:number; views?:number };
type Site = { id:string; name:string; ga4:Source; gsc:Source };
type GoogleReport = { configured:boolean; sites:Site[] };
const fmt=(value?:number)=>value===undefined?"—":new Intl.NumberFormat("en-US").format(value);
const tone=(source:Source)=>source.status==="error"?"Unavailable":source.status==="missing"?"Not connected":source.status==="no_data"?"No reporting data":"Connected";

/** Supplemental Google panels: do not substitute GA4 sessions for PostHog sessions. */
export function GooglePortfolio({days}:{days:number}){
  const {data,error,loading}=useStats<GoogleReport>("/api/stats/google",{days});
  return <Panel title="Search discovery & historical traffic" note={<Link href="/stats/search" className="underline">Explore Google reports →</Link>}>
    <p className="mb-2.5 text-[11px]" style={{color:C.mute}}>Google Search Console and GA4 · {days}-day reporting window · separate from PostHog counts</p>
    {!data ? <p className="py-3 text-[12px]" style={{color:C.mute}}>{error?"Google reporting temporarily unavailable":loading?"Loading Google reports…":"Waiting for Google reporting"}</p> :
    !data.configured ? <p className="py-2 text-[12px]" style={{color:C.mute}}>Google server credentials not configured.</p> :
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      {data.sites.map(site=><div key={site.id} className="min-w-0 rounded-lg border p-2.5" style={{borderColor:C.line}}>
        <div className="mb-2 flex items-baseline justify-between gap-1">
          <strong className="text-[13px]">{site.name}</strong>
          <span className="text-[10px]" style={{color:C.mute}}>GSC: {tone(site.gsc)} · GA4: {tone(site.ga4)}</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div><p className="text-[10px]" style={{color:C.mute}}>Search clicks</p><p className="text-[19px] font-semibold tabular-nums">{site.gsc.status==="connected"?fmt(site.gsc.clicks):"—"}</p></div>
          <div><p className="text-[10px]" style={{color:C.mute}}>Impressions</p><p className="text-[19px] font-semibold tabular-nums">{site.gsc.status==="connected"?fmt(site.gsc.impressions):"—"}</p></div>
          <div><p className="text-[10px]" style={{color:C.mute}}>GA4 sessions</p><p className="text-[19px] font-semibold tabular-nums">{(site.ga4.status==="connected"||site.ga4.status==="no_data")?fmt(site.ga4.sessions):"—"}</p></div>
        </div>
        {site.ga4.status==="no_data" && <p className="mt-1.5 text-[10px]" style={{color:"#99571c"}}>GA4 has no activity in this period; verify instrumentation.</p>}
      </div>)}
    </div>}
    <p className="mt-2 text-[10px]" style={{color:C.mute}}>Google may report later than PostHog. Search Console clicks are not the same metric as GA4 sessions, and values must not be added together.</p>
  </Panel>;
}
