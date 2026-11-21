"use client";

import { useState } from "react";
import { C, Login, Notice, Panel, Shell, stampOf, useStats } from "@/components/stats/ui";

type Day = { date:string; users:number; sessions:number; views:number; clicks:number; impressions:number };
type Source = { status:"connected"|"missing"|"error"; message?:string; users?:number; sessions?:number; views?:number; clicks?:number; impressions?:number; ctr?:number; position?:number; daily?:Day[]; queries?:{term:string;clicks:number;impressions:number;ctr:number;position:number}[]; pages?:{url:string;clicks:number;impressions:number}[] };
type Site = { id:string;name:string;ga4Property:string|null;gscProperty:string|null;ga4:Source;gsc:Source };
type Report = {configured:boolean;generatedAt:string;sites:Site[];message?:string};
const nf=(x?:number) => x===undefined ? "—" : Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(x);
const pct=(x?:number) => x===undefined ? "—" : (x*100).toFixed(1)+"%";
const stat=(s:Source)=>s.status==="connected"?"Connected":s.status==="error"?"Error":"Not configured";
function MiniBars({rows,field}:{rows:Day[];field:"clicks"|"impressions"|"sessions"|"views"}) {
  // Preserve daily granularity for short periods, but bucket 90/365-day
  // histories to fit the chart. A flex gap per day made annual bars invisible.
  const sorted=[...rows].sort((a,b)=>a.date.localeCompare(b.date));
  const count=sorted.length>90?52:sorted.length>45?30:sorted.length;
  const first=sorted[0]?.date;
  const last=sorted[sorted.length-1]?.date;
  const buckets=Array.from({length:count},(_,i)=>{
    const from=Math.floor(i*sorted.length/count);
    const to=Math.floor((i+1)*sorted.length/count);
    const group=sorted.slice(from,to);
    return {from:group[0]?.date||"",to:group[group.length-1]?.date||"",value:group.reduce((sum,r)=>sum+r[field],0)};
  });
  const max=Math.max(1,...buckets.map(r=>r.value));
  return <div>
    <div className="flex h-20 items-end gap-px" aria-label={field+" historical trend"}>
      {buckets.map((r,i)=><div key={i} className="group relative min-w-0 flex-1 rounded-t-[2px]" style={{height:`${Math.max(2,Math.round(r.value/max*100))}%`,background:field==="clicks"||field==="impressions"?C.red:C.blue}} title={`${r.from===r.to?r.from:r.from+" to "+r.to}: ${nf(r.value)} ${field}`} />)}
    </div>
    {first&&last&&<div className="mt-1 flex justify-between text-[10px]" style={{color:C.mute}}><span>{first}</span><span>{last}</span></div>}
  </div>;
}
function SourceCard({title,source,details,children}:{title:string;source:Source;details:string;children?:React.ReactNode}) {
  return <Panel title={title} note={stat(source)}>
    <div className="text-[11px]" style={{color:C.mute}}>{details}</div>
    {source.status==="error" && <p className="mt-2 rounded-md px-2 py-2 text-[12px]" style={{background:"#fff2de",color:"#8c501b"}}>{source.message || "Google did not return this report"}; check property access and ID.</p>}
    {source.status==="missing" && <p className="mt-2 text-[12px]" style={{color:C.mute}}>No property configured for this site.</p>}
    {source.status==="connected" && children}
  </Panel>;
}
export default function SearchPage(){
  const [days,setDays]=useState(30);
  const [selected,setSelected]=useState("ballpark");
  const [exporting,setExporting]=useState(false);
  const [exportError,setExportError]=useState("");
  const {pass,ready,data,error,loading,login}=useStats<Report>("/api/stats/google",{days});
  async function exportHistory() {
    if(!pass || exporting) return;
    setExporting(true);setExportError("");
    try {
      const response=await fetch("/api/stats/google/export",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({passphrase:pass}),
      });
      if(!response.ok) throw new Error("Export failed");
      const blob=await response.blob();
      const href=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=href;
      a.download=`minorworks-google-aggregate-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(href);
    } catch {setExportError("Export unavailable. Please try again later.");}
    finally {setExporting(false);}
  }
  if(!data) return ready ? <Login onLogin={login} error={error} loading={loading}/> : <main className="min-h-screen" style={{background:C.navy}}/>;
  const site=data.sites.find(x=>x.id===selected)||data.sites[0];
  return <Shell title="Search performance" subtitle="Historical discovery and traffic · Google Analytics 4 + Google Search Console" active="search" days={days} onDays={setDays} loading={loading} stamp={stampOf(data.generatedAt)} extra={<button className="rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{background:days===365?C.navy:C.track,color:days===365?"white":C.mute}} onClick={()=>setDays(365)}>1 year</button>}>
    {!data.configured ? <Notice tone="warn">Google read-only reporting is prepared, but the server credential has not been configured. Add GOOGLE_SERVICE_ACCOUNT_JSON to Netlify as a secret. No traffic or search figures are shown until the connection is verified.</Notice> : null}
    {error && <Notice tone="warn">{error}</Notice>}
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2" style={{borderColor:C.line,background:C.card}}>
      <span className="text-[11px]" style={{color:C.mute}}>Historical preservation · Download one year of aggregated Google daily metrics for all three sites. This is a manual snapshot, not automated archival storage.</span>
      <button onClick={exportHistory} disabled={exporting||!data.configured} className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50" style={{background:C.navy,color:"white"}}>{exporting?"Preparing export…":"Export historical data"}</button>
    </div>
    {exportError && <Notice tone="warn">{exportError}</Notice>}
    <div className="mb-3 flex flex-wrap gap-1.5">
      {data.sites.map(s=><button key={s.id} onClick={()=>setSelected(s.id)} className="rounded-lg border px-3 py-1.5 text-xs" style={{borderColor:C.line,background:selected===s.id?C.navy:C.card,color:selected===s.id?"white":C.ink}}>{s.name}</button>)}
    </div>
    {site ? <>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SourceCard title="Search Console" source={site.gsc} details={site.gscProperty || "No Search Console domain property"}>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[["Clicks",nf(site.gsc.clicks)],["Impressions",nf(site.gsc.impressions)],["CTR",pct(site.gsc.ctr)],["Avg position",site.gsc.position===undefined?"—":site.gsc.position.toFixed(1)]].map(([k,v])=><div key={k}><p className="text-[10px]" style={{color:C.mute}}>{k}</p><p className="text-[19px] font-semibold" style={{fontFamily:"Georgia,serif"}}>{v}</p></div>)}
          </div>
          {site.gsc.daily?.length ? <div className="mt-3"><MiniBars rows={site.gsc.daily} field="clicks"/><p className="mt-1 text-[10px]" style={{color:C.mute}}>Daily search clicks · excludes incomplete recent days</p></div> : <p className="mt-3 text-xs" style={{color:C.mute}}>No finalized daily search rows in this period.</p>}
        </SourceCard>
        <SourceCard title="Google Analytics 4" source={site.ga4} details={site.ga4Property ? `Property ${site.ga4Property}` : "No GA4 property"}>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[["Active users",nf(site.ga4.users)],["Sessions",nf(site.ga4.sessions)],["Page views",nf(site.ga4.views)]].map(([k,v])=><div key={k}><p className="text-[10px]" style={{color:C.mute}}>{k}</p><p className="text-[19px] font-semibold" style={{fontFamily:"Georgia,serif"}}>{v}</p></div>)}
          </div>
          {site.ga4.daily?.length ? <div className="mt-3"><MiniBars rows={site.ga4.daily} field="sessions"/><p className="mt-1 text-[10px]" style={{color:C.mute}}>GA4 sessions by day; active users are deduplicated over the selected date range.</p></div> : <p className="mt-3 text-xs" style={{color:C.mute}}>No GA4 daily rows in this period.</p>}
        </SourceCard>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Search terms" note="Search Console · top queries">
          {site.gsc.queries?.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr style={{color:C.mute}}><th className="py-2">Query</th><th className="text-right">Clicks</th><th className="text-right">Impressions</th><th className="text-right">Position</th></tr></thead><tbody>{site.gsc.queries.map((q,i)=><tr key={q.term+"-"+i} className="border-t" style={{borderColor:C.line}}><td className="py-2 pr-3">{q.term}</td><td className="text-right">{nf(q.clicks)}</td><td className="text-right">{nf(q.impressions)}</td><td className="text-right">{q.position.toFixed(1)}</td></tr>)}</tbody></table></div> : <p className="text-xs" style={{color:C.mute}}>Not available or no query rows for this period.</p>}
        </Panel>
        <Panel title="Pages found through search" note="Search Console · organic discovery">
          {site.gsc.pages?.length ? <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr style={{color:C.mute}}><th className="py-2">Page</th><th className="text-right">Clicks</th><th className="text-right">Impressions</th></tr></thead><tbody>{site.gsc.pages.map((p,i)=><tr key={p.url+"-"+i} className="border-t" style={{borderColor:C.line}}><td className="max-w-[360px] truncate py-2 pr-3" title={p.url}>{p.url.replace(/^https?:\/\//,"")}</td><td className="text-right">{nf(p.clicks)}</td><td className="text-right">{nf(p.impressions)}</td></tr>)}</tbody></table></div> : <p className="text-xs" style={{color:C.mute}}>Not available or no page rows for this period.</p>}
        </Panel>
      </div>
      <p className="mt-3 text-[11px]" style={{color:C.mute}}>Google reports and PostHog use different definitions and may differ due to consent, ad blocking, bot exclusion and reporting latency. They are never added together. Search Console may omit anonymized query data. Data is cached for up to 15 minutes.</p>
    </> : <Notice tone="warn">No Google properties configured.</Notice>}
  </Shell>;
}
