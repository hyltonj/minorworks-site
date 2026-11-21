"use client";

import { useMemo, useState } from "react";
import { POSTHOG_HISTORY_START, siteName } from "@/lib/stats/model";
import { trendsUrl } from "@/lib/stats/links";
import { C, ExternalLink, Insufficient, Panel, Seg, SERIF, Spark, etDay, nf } from "./ui";

export type Portfolio = { days: number; rows: [string, string, number][]; all: [string, number][] };

// Restrained categorical set: the blues first, then a small number of warm and cool accents. Eight is the most a reader can tell apart.
export const SERIES = ["#16305f", "#3d7be8", "#dc5b52", "#9ec0f5", "#b7791f", "#2f8f9d", "#7c6bb3", "#16a34a"];
const OTHER = "#d9d3c4";
type Compare = "none" | "prev" | "week" | "avg7";

const dow = (day: string) => new Date(day + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
const dayShift = (day: string, by: number) => new Date(Date.parse(day + "T12:00:00Z") + by * 86400000).toISOString().slice(0, 10);

/** The centerpiece: people per day, per project, selectable, with honest historical comparison. */
export function PortfolioChart({ data }: { data: Portfolio }) {
  const days = data.days;
  const hist = POSTHOG_HISTORY_START;
  const fullLabels = useMemo(() => Array.from({ length: days }, (_, i) => etDay(days - 1 - i)), [days]);
  // Days before PostHog history started have no data at all; leave them off the axis instead of drawing an empty block.
  const labels = useMemo(() => { const k = fullLabels.filter((d) => d >= hist); return k.length ? k : fullLabels; }, [fullLabels, hist]);

  const by = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const [d, s, v] of data.rows) { if (!m.has(s)) m.set(s, new Map()); m.get(s)!.set(d, v); }
    return m;
  }, [data.rows]);
  const allBy = useMemo(() => new Map(data.all), [data.all]);

  const totals = useMemo(() => [...by.entries()].map(([s, mm]) => ({ site: s, total: labels.reduce((a, d) => a + (mm.get(d) || 0), 0) })).filter((x) => x.total > 0).sort((a, b) => b.total - a.total), [by, labels]);
  const [sel, setSel] = useState<string[] | null>(null);
  const [mode, setMode] = useState<"stacked" | "lines">("stacked");
  const [cmp, setCmp] = useState<Compare>("prev");
  const [unique, setUnique] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const chosen = sel ?? totals.slice(0, 5).map((t) => t.site);
  const colorOf = (s: string) => SERIES[chosen.indexOf(s) % SERIES.length];

  const val = (site: string, d: string) => (d < hist ? null : by.get(site)?.get(d) || 0);
  const selTotal = (d: string) => (d < hist ? null : chosen.reduce((a, s) => a + (by.get(s)?.get(d) || 0), 0));
  const rest = (d: string) => (d < hist ? null : [...by.entries()].filter(([s]) => !chosen.includes(s)).reduce((a, [, mm]) => a + (mm.get(d) || 0), 0));

  // Comparison values aligned to the displayed days. null where PostHog has no history yet.
  const compareOf = (d: string): number | null => {
    if (cmp === "none") return null;
    if (cmp === "prev") return selTotal(etDay(days + (days - 1 - fullLabels.indexOf(d))));
    if (cmp === "week") return selTotal(dayShift(d, -7));
    const win = [0, 1, 2, 3, 4, 5, 6].map((k) => selTotal(dayShift(d, -k)));
    return win.some((v) => v === null) ? null : Math.round(win.reduce<number>((a, v) => a + (v as number), 0) / 7);
  };
  const cmpVals = labels.map((d) => compareOf(d));
  const cmpAvail = cmpVals.filter((v) => v !== null).length;
  const cmpLabel = { none: "", prev: `previous ${days} days`, week: "same day last week", avg7: "7-day average" }[cmp];

  const rows = labels.map((d) => ({ d, tot: selTotal(d), rest: rest(d), uniq: d < hist ? null : allBy.get(d) || 0 }));
  const have = rows.filter((r) => r.tot !== null);
  const sum = have.reduce((a, r) => a + (r.tot as number), 0);
  const prevSum = cmp === "prev" ? cmpVals.reduce<number>((a, v) => a + (v ?? 0), 0) : null;
  const peak = have.reduce((b, r) => ((r.tot as number) > (b?.tot ?? -1) ? r : b), null as (typeof have)[number] | null);

  const w = 1100, h = 250, padL = 36, padB = 20, padT = 10;
  const stackMax = Math.max(1, ...rows.map((r) => (r.tot ?? 0) + (r.rest ?? 0)), ...cmpVals.map((v) => v ?? 0));
  const lineMax = Math.max(1, ...labels.flatMap((d) => chosen.map((s) => val(s, d) ?? 0)), ...rows.map((r) => (unique ? r.uniq ?? 0 : 0)), ...cmpVals.map((v) => v ?? 0));
  const max = mode === "stacked" ? stackMax : lineMax;
  const x = (i: number) => padL + (i + 0.5) * ((w - padL - 6) / labels.length);
  const bw = (w - padL - 6) / labels.length;
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);
  const linePath = (vals: (number | null)[]) => { let d = "", pen = false; vals.forEach((v, i) => { if (v === null) { pen = false; return; } d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `; pen = true; }); return d; };
  const tick = Math.max(1, Math.ceil(labels.length / 8));

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * w;
    setHover(Math.max(0, Math.min(labels.length - 1, Math.floor((px - padL) / bw))));
  };
  const toggle = (s: string) => setSel(chosen.includes(s) ? chosen.filter((c) => c !== s) : [...chosen, s].slice(0, 8));
  const omitted = days - labels.length;
  const cmpNote = cmp === "none" ? null : cmpAvail === 0
    ? `No ${cmpLabel} data yet: PostHog history starts ${hist}.`
    : cmpAvail < labels.length ? `${cmpLabel} is available for ${cmpAvail} of ${labels.length} days (history starts ${hist}); the line has gaps rather than zeros.` : null;

  return (
    <Panel title="Traffic by project" note={<>people per day · Boston time · <ExternalLink href={trendsUrl(days)}>Trends in PostHog</ExternalLink></>}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]" role="group" aria-label="Choose projects">
          {totals.slice(0, 14).map((t) => {
            const on = chosen.includes(t.site);
            return (
              <button key={t.site} onClick={() => toggle(t.site)} aria-pressed={on} title={`${nf(t.total)} people-days in range`}
                className="rounded-full px-2 py-0.5 font-medium" style={{ border: `1px solid ${on ? colorOf(t.site) : C.line}`, background: on ? "#fff" : "transparent", color: on ? C.ink : C.mute }}>
                <i className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: on ? colorOf(t.site) : C.line }} />{siteName(t.site)}
              </button>
            );
          })}
          <button onClick={() => setSel(totals.slice(0, 5).map((t) => t.site))} className="px-1.5 text-[11px] underline-offset-2 hover:underline" style={{ color: C.blue }}>Top 5</button>
          <button onClick={() => setSel(totals.slice(0, 8).map((t) => t.site))} className="px-1 text-[11px] underline-offset-2 hover:underline" style={{ color: C.blue }}>Top 8</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Seg label="Chart type" value={mode} onChange={setMode} options={[["stacked", "Stacked"], ["lines", "Lines"]]} />
          <select aria-label="Compare with" value={cmp} onChange={(e) => setCmp(e.target.value as Compare)} className="rounded-lg px-2 py-1.5 text-xs font-medium" style={{ background: C.track, color: C.navy }}>
            <option value="none">No comparison</option>
            <option value="prev">vs previous {days} days</option>
            <option value="week">vs same day last week</option>
            <option value="avg7">vs 7-day average</option>
          </select>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Selected, total", nf(sum), "people-days"],
          ["Daily average", have.length ? nf(Math.round(sum / have.length)) : "–", `${have.length} days with data`],
          ["Peak day", peak ? nf(peak.tot as number) : "–", peak ? `${dow(peak.d)} ${peak.d.slice(5)}` : ""],
          [cmp === "prev" ? "vs previous period" : "Comparison", cmp === "prev" ? (prevSum && cmpAvail === labels.length ? `${sum >= prevSum ? "+" : "−"}${Math.round((Math.abs(sum - prevSum) / prevSum) * 100)}%` : "–") : cmp === "none" ? "–" : cmpLabel, cmp === "prev" ? (prevSum ? `${nf(prevSum)} before` : "history too short") : ""],
        ].map(([l, v, sub]) => (
          <div key={l} className="rounded-lg px-2.5 py-1.5" style={{ background: C.bg }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: C.mute }}>{l}</p>
            <p className="text-[19px] leading-tight tabular-nums" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{v}</p>
            <p className="truncate text-[10.5px]" style={{ color: C.mute }}>{sub}</p>
          </div>
        ))}
      </div>

      {!chosen.length ? <p className="py-10 text-center text-[13px]" style={{ color: C.mute }}>Pick at least one project above.</p> : (
        <div className="relative">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full touch-none select-none" role="img" aria-label={`People per day for ${chosen.map(siteName).join(", ")}`}
            onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
            {[0, 0.5, 1].map((t) => (
              <g key={t}><line x1={padL} x2={w - 6} y1={y(t * max)} y2={y(t * max)} stroke={C.line} /><text x={padL - 5} y={y(t * max) + 3} fontSize="10" fill={C.mute} textAnchor="end">{nf(Math.round(t * max))}</text></g>
            ))}
            {labels.map((d, i) => (i % tick === 0 || i === labels.length - 1 ? <text key={d} x={x(i)} y={h - 5} fontSize="10" fill={C.mute} textAnchor="middle">{d.slice(5)}</text> : null))}
            {mode === "stacked" && labels.map((d, i) => {
              if (d < hist) return null;
              let base = h - padB;
              const parts = [...chosen.map((s) => ({ s, v: by.get(s)?.get(d) || 0, c: colorOf(s) })), { s: "", v: rest(d) || 0, c: OTHER }];
              return <g key={d}>{parts.map((p, k) => { const hh = (p.v / max) * (h - padT - padB); base -= hh; return hh > 0 ? <rect key={k} x={x(i) - bw / 2 + 1.5} y={base} width={Math.max(1, bw - 3)} height={hh} fill={p.c} opacity={p.s === "" ? 0.85 : 1} /> : null; })}</g>;
            })}
            {mode === "lines" && chosen.map((s) => <path key={s} d={linePath(labels.map((d) => val(s, d)))} fill="none" stroke={colorOf(s)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
            {mode === "lines" && unique && <path d={linePath(rows.map((r) => r.uniq))} fill="none" stroke={C.ink} strokeWidth="1.4" strokeDasharray="4 3" />}
            {cmp !== "none" && <path d={linePath(cmpVals)} fill="none" stroke={C.ink} strokeWidth="1.8" strokeDasharray="1 3" strokeLinecap="round" />}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={h - padB} stroke={C.mute} strokeDasharray="3 3" />}
          </svg>
          {hover !== null && (() => {
            const d = labels[hover]; const r = rows[hover];
            const c = cmpVals[hover];
            return (
              <div className="pointer-events-none absolute top-1 min-w-[150px] rounded-md px-2.5 py-1.5 text-[11.5px] shadow-lg" style={{ left: `${Math.min(66, (x(hover) / w) * 100)}%`, background: C.navy, color: "#fff" }}>
                <b>{dow(d)} {d}</b>
                {r.tot === null ? <div style={{ color: "#c9d6f2" }}>No PostHog history for this day</div> : <>
                  {chosen.map((s) => <div key={s} className="flex justify-between gap-4"><span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: colorOf(s) }} />{siteName(s)}</span><span className="tabular-nums">{nf(by.get(s)?.get(d) || 0)}</span></div>)}
                  {mode === "stacked" && !!r.rest && <div className="flex justify-between gap-4" style={{ color: "#c9d6f2" }}><span>Other sites</span><span className="tabular-nums">{nf(r.rest)}</span></div>}
                  <div className="mt-0.5 flex justify-between gap-4 border-t pt-0.5" style={{ borderColor: "#34508a" }}><span>Selected</span><b className="tabular-nums">{nf(r.tot)}</b></div>
                  {mode === "lines" && unique && <div className="flex justify-between gap-4" style={{ color: "#c9d6f2" }}><span>All, unique people</span><span className="tabular-nums">{nf(r.uniq || 0)}</span></div>}
                  {cmp !== "none" && <div className="flex justify-between gap-4" style={{ color: "#c9d6f2" }}><span>{cmpLabel}</span><span className="tabular-nums">{c === null ? "no data" : `${nf(c)}${c ? ` (${r.tot >= c ? "+" : "−"}${Math.round((Math.abs(r.tot - c) / c) * 100)}%)` : ""}`}</span></div>}
                </>}
              </div>
            );
          })()}
        </div>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: C.mute }}>
        {cmp !== "none" && cmpAvail > 0 && <span><i className="mr-1 inline-block h-0 w-5 border-t-2 border-dotted align-middle" style={{ borderColor: C.ink }} />{cmpLabel}</span>}
        {mode === "stacked" && <span><i className="mr-1 inline-block h-2 w-2 rounded-sm" style={{ background: OTHER }} />Other sites</span>}
        {mode === "lines" && unique && <span><i className="mr-1 inline-block h-0 w-5 border-t border-dashed align-middle" style={{ borderColor: C.ink }} />All sites, unique people</span>}
        <label className={`inline-flex items-center gap-1 ${mode === "lines" ? "" : "hidden"}`}><input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />show unique total</label>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug" style={{ color: C.mute }}>
        Each bar adds up people per project, so someone who visits two projects the same day counts twice; the dashed “unique” line counts them once.
        {omitted > 0 && <> <Insufficient text={`Showing ${labels.length} of ${days} days: PostHog history starts ${hist}`} /></>}
        {cmpNote && <> <Insufficient text={cmpNote} /></>}
      </p>
    </Panel>
  );
}

/** One small chart per project on its own scale, so quiet projects are not flattened by the big ones. */
export function SmallMultiples({ data, limit = 8 }: { data: Portfolio; limit?: number }) {
  const labels = Array.from({ length: data.days }, (_, i) => etDay(data.days - 1 - i));
  const by = new Map<string, Map<string, number>>();
  for (const [d, s, v] of data.rows) { if (!by.has(s)) by.set(s, new Map()); by.get(s)!.set(d, v); }
  const prevLabels = Array.from({ length: data.days }, (_, i) => etDay(2 * data.days - 1 - i));
  const full = prevLabels[0] >= POSTHOG_HISTORY_START;
  const items = [...by.entries()].map(([s, mm]) => {
    const vals = labels.filter((d) => d >= POSTHOG_HISTORY_START).map((d) => mm.get(d) || 0);
    const prev = prevLabels.reduce((a, d) => a + (mm.get(d) || 0), 0);
    const now = vals.reduce((a, v) => a + v, 0);
    return { s, vals, now, prev, peak: Math.max(0, ...vals) };
  }).filter((x) => x.now > 0).sort((a, b) => b.now - a.now).slice(0, limit);
  return (
    <Panel title="Each project on its own scale" note={full ? "people per day · vs previous period" : "people per day · previous period starts before history"}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.s} className="rounded-lg px-2.5 pb-1 pt-2" style={{ background: C.bg }}>
            <div className="flex items-baseline justify-between gap-1">
              <span className="truncate text-[12px] font-medium" style={{ color: C.ink }}>{siteName(it.s)}</span>
              <span className="text-[10.5px] tabular-nums" style={{ color: C.mute }}>peak {nf(it.peak)}</span>
            </div>
            <p className="text-[16px] leading-tight tabular-nums" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>
              {nf(it.now)} <span className="text-[10.5px] font-normal" style={{ fontFamily: "inherit", color: it.prev ? (it.now >= it.prev ? C.green : C.red) : C.mute }}>
                {full && it.prev ? `${it.now >= it.prev ? "↑" : "↓"} ${Math.round((Math.abs(it.now - it.prev) / it.prev) * 100)}%` : ""}
              </span>
            </p>
            <Spark values={it.vals} color={C.blue} height={30} />
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-[11px]" style={{ color: C.mute }}>Totals are people-days (a person active on three days counts three times).</p>
    </Panel>
  );
}
