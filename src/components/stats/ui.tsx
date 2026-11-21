"use client";

// Shared pieces for the private /stats pages. Palette and typography follow the original Studio Stats look
// (navy, blue, restrained red, Georgia headings) on a warm neutral ground, composed like the analytics collage.

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type Pair = { now: number; before: number };

export const C = {
  navy: "#0b1f44",
  navy2: "#16305f",
  blue: "#3d7be8",
  blueSoft: "#9ec0f5",
  blueFaint: "#dbe8fb",
  red: "#dc5b52",
  green: "#16a34a",
  amber: "#b7791f",
  amberFaint: "#fbf0d6",
  ink: "#12203d",
  mute: "#6b7a99",
  line: "#e7e1d4",
  bg: "#f4f1ea",
  card: "#fffefb",
  track: "#e8edf6",
};

export const SERIF = "Georgia, 'Times New Roman', serif";
export const nf = (v: number) => v.toLocaleString("en-US");
export const KEY = "mw:stats:pass";
export const SITE_COLORS = [C.navy2, C.blue, C.blueSoft, C.red, "#7a8fb8", "#c9d3e6", "#e8a39d"];

export const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
export const dur = (sec: number | null | undefined) => {
  if (sec === null || sec === undefined) return "–";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
};
export const flag = (code: string) =>
  code.length === 2 ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : "";
export const etDay = (offset: number) => new Date(Date.now() - offset * 86400000).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
export const stampOf = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export const Label = ({ children }: { children: ReactNode }) => (
  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: C.mute }}>{children}</p>
);

export function Delta({ p }: { p: Pair }) {
  if (!p.before && !p.now) return <span style={{ color: C.mute }}>no data</span>;
  if (!p.before) return <span style={{ color: C.green }}>new</span>;
  const v = Math.round(((p.now - p.before) / p.before) * 100);
  const up = v >= 0;
  return (
    <span style={{ color: up ? C.green : C.red }}>
      {up ? "↑" : "↓"} {Math.abs(v)}%
    </span>
  );
}

export function Spark({ values, color = C.blue, height = 34 }: { values: number[]; color?: string; height?: number }) {
  const w = 160, h = height;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 3 - (v / max) * (h - 8)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} opacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Compact panel: the collage's card. */
export function Panel({ title, note, right, children, className = "", pad = true }: { title?: string; note?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`min-w-0 rounded-xl ${pad ? "p-3.5" : ""} ${className}`} style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 1px 2px rgba(11,31,68,.04)" }}>
      {(title || right) && (
        <div className={`mb-2.5 flex items-baseline justify-between gap-2 ${pad ? "" : "px-3.5 pt-3.5"}`}>
          {title && <h2 className="text-[13.5px] font-semibold" style={{ color: C.ink }}>{title}</h2>}
          <div className="flex items-baseline gap-2 text-[11px]" style={{ color: C.mute }}>{note}{right}</div>
        </div>
      )}
      {children}
    </section>
  );
}
export const Card = ({ title, children, className = "", note }: { title: string; children: ReactNode; className?: string; note?: string }) => (
  <Panel title={title} note={note} className={className}>{children}</Panel>
);

/** Expandable block for the long tail of detail. Native <details>: keyboard and screen-reader friendly. */
export function Section({ title, note, open = true, children }: { title: string; note?: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-xl" style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: "0 1px 2px rgba(11,31,68,.04)" }}>
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-2 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden">
        <h2 className="text-[13.5px] font-semibold" style={{ color: C.ink }}>
          <span className="mr-2 inline-block text-[10px] transition-transform group-open:rotate-90" style={{ color: C.mute }} aria-hidden>▸</span>
          {title}
        </h2>
        {note && <span className="text-right text-[11px]" style={{ color: C.mute }}>{note}</span>}
      </summary>
      <div className="border-t px-3.5 pb-3.5 pt-3" style={{ borderColor: C.line }}>{children}</div>
    </details>
  );
}

export function Empty({ text = "Nothing yet" }: { text?: string }) {
  return <p className="py-4 text-center text-[13px]" style={{ color: C.mute }}>{text}</p>;
}

/** Shown instead of a number or a zero when the data cannot support one. */
export function Insufficient({ text }: { text: string }) {
  return <span className="inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium" style={{ background: C.amberFaint, color: "#6b4a0f" }}>{text}</span>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  const warn = tone === "warn";
  return (
    <p className="rounded-lg px-3 py-2 text-[11.5px] leading-relaxed" role="note"
      style={{ background: warn ? C.amberFaint : C.blueFaint, color: warn ? "#6b4a0f" : C.navy2, border: `1px solid ${warn ? "#efdca6" : "#c7dbf7"}` }}>
      {children}
    </p>
  );
}

export function Seg<T extends string | number>({ options, value, onChange, label }: { options: [T, string][]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex rounded-lg p-0.5" role="group" aria-label={label} style={{ background: C.track }}>
      {options.map(([v, l]) => (
        <button key={String(v)} onClick={() => onChange(v)} aria-pressed={value === v}
          className="rounded-md px-2.5 py-1 text-xs font-medium" style={{ background: value === v ? "#fff" : "transparent", color: value === v ? C.navy : C.mute, boxShadow: value === v ? "0 1px 2px rgba(11,31,68,.1)" : undefined }}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Kpi({ label, value, pair, sub, spark, color = C.blue }: { label: string; value: ReactNode; pair?: Pair; sub?: ReactNode; spark?: number[]; color?: string }) {
  return (
    <div className="min-w-0 rounded-xl px-3 pb-1.5 pt-2.5" style={{ background: C.card, border: `1px solid ${C.line}` }}>
      <Label>{label}</Label>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-[24px] leading-tight tabular-nums" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{value}</span>
        {pair && <span className="text-[11px] font-medium"><Delta p={pair} /></span>}
      </div>
      {sub && <p className="truncate text-[11px]" style={{ color: C.mute }}>{sub}</p>}
      {spark && spark.length > 1 ? <div className="mt-0.5"><Spark values={spark} color={color} height={26} /></div> : <div className="h-[26px]" />}
    </div>
  );
}
export const Stat = ({ label, value, sub, pair }: { label: string; value: ReactNode; sub?: ReactNode; pair?: Pair }) => (
  <Kpi label={label} value={value} sub={sub} pair={pair} />
);

export function HBars({ rows, color = C.blue, label, suffix }: { rows: { name: string; value: number; extra?: string }[]; color?: string; label?: (n: string) => string; suffix?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <Empty />;
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.name} className="text-[12.5px]">
          <div className="mb-0.5 flex justify-between gap-3">
            <span className="truncate" style={{ color: C.ink }}>{label ? label(r.name) : r.name}</span>
            <span className="shrink-0 tabular-nums" style={{ color: C.mute }}>{nf(r.value)}{suffix}{r.extra ? ` · ${r.extra}` : ""}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: C.track }}>
            <div className="h-1.5 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Funnel as in the collage: label, bar scaled to the first step, count and % of first; step-to-step % at the right. */
export function FunnelBars({ steps, unit }: { steps: { label: string; value: number }[]; unit: string }) {
  const first = steps[0]?.value || 0;
  if (!first) return <Empty text={`No ${unit} in this range`} />;
  return (
    <ul className="space-y-1">
      {steps.map((st, i) => {
        const prev = i ? steps[i - 1].value : 0;
        return (
          <li key={st.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 text-[12px]">
            <div className="min-w-0">
              <div className="flex justify-between gap-2">
                <span className="truncate" style={{ color: C.ink }}>{st.label}</span>
                <span className="shrink-0 tabular-nums" style={{ color: C.mute }}>{nf(st.value)} · {Math.round((st.value / first) * 100)}%</span>
              </div>
              <div className="mt-0.5 h-2 rounded-sm" style={{ background: C.track }}>
                <div className="h-2 rounded-sm" style={{ width: `${Math.max(1.5, (st.value / first) * 100)}%`, background: i === 0 ? C.navy2 : i < 3 ? C.blue : C.blueSoft }} />
              </div>
            </div>
            <span className="w-12 text-right text-[11px] tabular-nums" style={{ color: i && prev ? (st.value / prev < 0.7 ? C.red : C.mute) : "transparent" }}>
              {i && prev ? `${Math.round((st.value / prev) * 100)}%` : "·"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Small column chart (drop-off by step, distributions). */
export function ColumnChart({ items, height = 90, color = C.blue, fmt = (v: number) => nf(v) }: { items: { label: string; value: number; tone?: "red" }[]; height?: number; color?: string; fmt?: (v: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <Empty />;
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {items.map((it) => (
          <div key={it.label} className="flex h-full flex-1 flex-col justify-end" title={`${it.label}: ${fmt(it.value)}`}>
            <span className="mb-0.5 text-center text-[10px] tabular-nums" style={{ color: C.mute }}>{fmt(it.value)}</span>
            <div className="w-full rounded-t" style={{ height: `${Math.max(2, (it.value / max) * (height - 16))}px`, background: it.tone === "red" ? C.red : color }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5">{items.map((it) => <span key={it.label} className="flex-1 truncate text-center text-[10px]" style={{ color: C.mute }}>{it.label}</span>)}</div>
    </div>
  );
}

export function Donut({ rows, size = 96 }: { rows: { name: string; value: number }[]; size?: number }) {
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!total) return <Empty />;
  const colors = [C.navy2, C.blue, C.blueSoft, C.red, "#7a8fb8"];
  let acc = 0;
  const R = 42, circ = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="shrink-0 -rotate-90" style={{ width: size, height: size }} aria-hidden>
        {rows.map((r, i) => {
          const len = (r.value / total) * circ;
          const el = <circle key={r.name} cx="50" cy="50" r={R} fill="none" stroke={colors[i % colors.length]} strokeWidth="14" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} />;
          acc += len;
          return el;
        })}
      </svg>
      <ul className="space-y-1 text-[12.5px]">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="capitalize" style={{ color: C.ink }}>{r.name}</span>
            <span className="tabular-nums" style={{ color: C.mute }}>{Math.round((r.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** People per day, stacked by site (top sites plus Other). */
export function StackedDaily({ keys, rows, nameOf = (k: string) => k, height = 150, ariaLabel = "People per day by site" }: { keys: string[]; rows: ({ day: string } & Record<string, number | string>)[]; nameOf?: (k: string) => string; height?: number; ariaLabel?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  if (!rows.length) return <Empty />;
  const w = 640, h = height, padL = 28;
  const totals = rows.map((r) => keys.reduce((a, k) => a + (Number(r[k]) || 0), 0));
  const max = Math.max(1, ...totals);
  const bw = (w - padL) / rows.length;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h + 16}`} className="w-full" role="img" aria-label={ariaLabel} onPointerLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((t) => (
            <g key={t}><line x1={padL} x2={w} y1={h - t * (h - 8)} y2={h - t * (h - 8)} stroke={C.line} /><text x={padL - 4} y={h - t * (h - 8) + 3} fontSize="9" fill={C.mute} textAnchor="end">{nf(Math.round(t * max))}</text></g>
          ))}
          {rows.map((r, i) => {
            let y = h;
            return (
              <g key={r.day} onPointerMove={() => setHover(i)}>
                <rect x={padL + i * bw} y={0} width={bw} height={h} fill="transparent" />
                {keys.map((k, ki) => {
                  const v = Number(r[k]) || 0;
                  const hh = (v / max) * (h - 8);
                  y -= hh;
                  return <rect key={k} x={padL + i * bw + 1} y={y} width={Math.max(1, bw - 2)} height={hh} fill={SITE_COLORS[ki % SITE_COLORS.length]} />;
                })}
              </g>
            );
          })}
          <text x={padL} y={h + 12} fontSize="9" fill={C.mute}>{rows[0].day.slice(5)}</text>
          <text x={w} y={h + 12} fontSize="9" fill={C.mute} textAnchor="end">{rows[rows.length - 1].day.slice(5)}</text>
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-0 rounded-md px-2 py-1 text-[11px] shadow" style={{ left: `${Math.min(65, (hover / rows.length) * 100)}%`, background: C.navy, color: "#fff" }}>
            <b>{rows[hover].day}</b>
            {keys.map((k, ki) => (Number(rows[hover][k]) ? <div key={k}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: SITE_COLORS[ki % SITE_COLORS.length] }} />{nameOf(k)} {nf(Number(rows[hover][k]))}</div> : null))}
          </div>
        )}
      </div>
      <ul className="space-y-1 pt-1 text-[11.5px]">
        {keys.map((k, ki) => <li key={k} className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: SITE_COLORS[ki % SITE_COLORS.length] }} /><span style={{ color: C.ink }}>{nameOf(k)}</span></li>)}
      </ul>
    </div>
  );
}

export type Series = { key: string; label: string; color: string; values: (number | null)[] };

/** Interactive line chart. `null` means "no data collected" and leaves a gap; 0 means "collected, nothing happened". `marks` draws labelled dates (history boundaries). */
export function LineChart({ labels, series, height = 170, marks = [] }: { labels: string[]; series: Series[]; height?: number; marks?: { day: string; label: string }[] }) {
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [hover, setHover] = useState<number | null>(null);
  const on = series.filter((s) => !off[s.key]);
  const w = 640, h = height, padL = 30, padB = 18, padT = 8;
  const max = Math.max(1, ...on.flatMap((s) => s.values.map((v) => v ?? 0)));
  const x = (i: number) => padL + (i / Math.max(1, labels.length - 1)) * (w - padL - 6);
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);
  const path = (s: Series) => {
    let d = "", pen = false;
    s.values.forEach((v, i) => {
      if (v === null) { pen = false; return; }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      pen = true;
    });
    return d;
  };
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * w;
    setHover(Math.max(0, Math.min(labels.length - 1, Math.round(((px - padL) / (w - padL - 6)) * (labels.length - 1)))));
  };
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap gap-1.5 text-[11px]">
        {series.map((s) => (
          <button key={s.key} onClick={() => setOff((o) => ({ ...o, [s.key]: !o[s.key] }))} aria-pressed={!off[s.key]}
            className="rounded-full px-2 py-0.5 font-medium" style={{ border: `1px solid ${off[s.key] ? C.line : s.color}`, color: off[s.key] ? C.mute : C.ink, background: off[s.key] ? "transparent" : "#fff" }}>
            <i className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: off[s.key] ? C.line : s.color }} />{s.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full touch-none select-none" role="img" aria-label="Daily trend" onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={padL} x2={w - 6} y1={y(t * max)} y2={y(t * max)} stroke={C.line} />
              <text x={padL - 4} y={y(t * max) + 3} fontSize="9" fill={C.mute} textAnchor="end">{nf(Math.round(t * max))}</text>
            </g>
          ))}
          {marks.map((m) => {
            const i = labels.indexOf(m.day);
            if (i < 0) return null;
            return (
              <g key={m.day}>
                <line x1={x(i)} x2={x(i)} y1={padT} y2={h - padB} stroke={C.amber} strokeDasharray="2 3" />
                <text x={x(i) + 3} y={padT + 8} fontSize="9" fill={C.amber}>{m.label}</text>
              </g>
            );
          })}
          <text x={padL} y={h - 4} fontSize="9" fill={C.mute}>{labels[0]?.slice(5)}</text>
          <text x={w - 6} y={h - 4} fontSize="9" fill={C.mute} textAnchor="end">{labels[labels.length - 1]?.slice(5)}</text>
          {on.map((s) => <path key={s.key} d={path(s)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
          {on.map((s) => s.values.map((v, i) => (v !== null && (s.values[i - 1] ?? null) === null && (s.values[i + 1] ?? null) === null ? <circle key={s.key + i} cx={x(i)} cy={y(v)} r="2.5" fill={s.color} /> : null)))}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={h - padB} stroke={C.mute} strokeDasharray="3 3" />
              {on.map((s) => (s.values[hover] === null ? null : <circle key={s.key} cx={x(hover)} cy={y(s.values[hover] as number)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />))}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-md px-2 py-1 text-[11px] shadow" style={{ left: `${Math.min(68, (x(hover) / w) * 100)}%`, background: C.navy, color: "#fff" }}>
            <b>{labels[hover]}</b>
            {on.map((s) => <div key={s.key}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}: {s.values[hover] === null ? "not collected" : nf(s.values[hover] as number)}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

export type Col<T> = { key: string; label: string; align?: "left" | "right"; value?: (r: T) => number | string; render?: (r: T) => ReactNode; hide?: "sm" };

/** Compact sortable table. Click a header to sort; click again to reverse. */
export function DataTable<T>({ rows, cols, empty = "Nothing yet", initialSort, limit, dense = false }: { rows: T[]; cols: Col<T>[]; empty?: string; initialSort?: string; limit?: number; dense?: boolean }) {
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 } | null>(initialSort ? { k: initialSort, dir: -1 } : null);
  const [all, setAll] = useState(false);
  const sorted = useMemo(() => {
    const col = cols.find((c) => c.key === sort?.k);
    if (!sort || !col || !col.value) return rows;
    const v = col.value;
    return [...rows].sort((a, b) => {
      const x = v(a), y = v(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [rows, cols, sort]);
  if (!rows.length) return <Empty text={empty} />;
  const shown = limit && !all ? sorted.slice(0, limit) : sorted;
  const py = dense ? "py-1" : "py-1.5";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-wide" style={{ color: C.mute }}>
            {cols.map((c) => (
              <th key={c.key} scope="col" className={`pb-1.5 font-semibold ${c.align === "right" ? "text-right" : "text-left"} ${c.hide ? "hidden sm:table-cell" : ""}`}
                aria-sort={sort?.k === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}>
                {c.value ? (
                  <button onClick={() => setSort((s) => (s?.k === c.key ? { k: c.key, dir: (s.dir * -1) as 1 | -1 } : { k: c.key, dir: -1 }))} className="uppercase tracking-wide">
                    {c.label}{sort?.k === c.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                  </button>
                ) : c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i} className="border-t" style={{ borderColor: C.line }}>
              {cols.map((c) => (
                <td key={c.key} className={`${py} ${c.align === "right" ? "text-right tabular-nums" : ""} ${c.hide ? "hidden sm:table-cell" : ""}`}>
                  {c.render ? c.render(r) : String(c.value ? c.value(r) : "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {limit && rows.length > limit && (
        <button onClick={() => setAll((a) => !a)} className="mt-1.5 text-[11px] font-medium" style={{ color: C.blue }}>
          {all ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

export type DotStatus = "ok" | "stale" | "no_data" | "connected" | "tag_only" | "not_connected" | "not_configured" | "error";
export function Dot({ status }: { status: DotStatus }) {
  const col = status === "ok" || status === "connected" ? C.green : status === "stale" || status === "tag_only" || status === "not_configured" ? C.amber : status === "error" ? C.red : C.mute;
  const text: Record<string, string> = { ok: "Working", stale: "Quiet 3+ days", no_data: "No data", connected: "Connected", tag_only: "Tag only", not_connected: "Not connected", not_configured: "Not set up", error: "Error" };
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <i className="inline-block h-2 w-2 rounded-full" style={{ background: col }} aria-hidden />
      <span>{text[status]}</span>
    </span>
  );
}

/** Day-of-week × hour grid (Boston time). */
export function Heatmap({ cells }: { cells: { dow: number; hour: number; n: number }[] }) {
  const max = Math.max(1, ...cells.map((c) => c.n));
  const map = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c.n]));
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (!cells.length) return <Empty text="No activity in this range" />;
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[280px]">
        {names.map((nm, d) => (
          <div key={nm} className="flex items-center gap-[2px] pb-[2px]">
            <span className="w-7 shrink-0 text-[9.5px]" style={{ color: C.mute }}>{nm}</span>
            {Array.from({ length: 24 }, (_, hr) => {
              const v = map.get(`${d}-${hr}`) || 0;
              return <i key={hr} title={`${nm} ${hr}:00 · ${v} views`} className="block h-3 flex-1 rounded-[2px]" style={{ background: v ? C.blue : C.track, opacity: v ? 0.25 + 0.75 * (v / max) : 0.6 }} />;
            })}
          </div>
        ))}
        <div className="ml-7 flex justify-between text-[9.5px]" style={{ color: C.mute }}><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div>
      </div>
    </div>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium underline-offset-2 hover:underline" style={{ color: C.blue }}>{children} ↗</a>;
}

// ---- Auth + data hook ----------------------------------------------------------------------------------------------

/** One passphrase for every /stats page (kept in sessionStorage for the tab). Reloads when `params` change. */
export function useStats<T>(url: string, params: Record<string, unknown>) {
  const [pass, setPass] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  // Start pending while restoring a passphrase from sessionStorage. Otherwise a
  // valid returning visitor briefly sees the login form on every route change.
  const [loading, setLoading] = useState(true);
  // A signed-in visitor whose request failed (server or upstream trouble) is not logged out: show a retry, not the login form.
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify(params);
  const seq = useRef(0);

  useEffect(() => {
    let stored = false;
    try { const p = sessionStorage.getItem(KEY); if (p) { setPass(p); stored = true; } } catch {}
    if (!stored) setLoading(false);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!pass) return;
    let stale = false;
    const mine = ++seq.current;
    (async () => {
      setLoading(true);
      setError("");
      setFailed(false);
      try {
        const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...JSON.parse(key), passphrase: pass }) });
        if (stale) return;
        if (r.status === 401) {
          try { sessionStorage.removeItem(KEY); } catch {}
          setData(null); setPass(null);
          setError("That passphrase did not work.");
          return;
        }
        if (r.status === 503) {
          let m = "";
          try { m = ((await r.json()) as { missing?: string[] }).missing?.join(" and ") || ""; } catch {}
          setError(m ? `Stats are not set up yet. The server cannot see: ${m}.` : "Stats are not set up yet. The passphrase or PostHog key is missing on the server.");
          setData(null); setPass(null);
          return;
        }
        if (r.status === 404) { setError("That page does not exist."); setData(null); return; }
        if (r.status === 429) {
          try { sessionStorage.removeItem(KEY); } catch {}
          setData(null); setPass(null);
          setError("Too many wrong passphrases. Wait a few minutes and try again.");
          return;
        }
        if (!r.ok) { setError("Could not load the stats just now (PostHog or the server did not answer)."); setFailed(true); return; }
        setData((await r.json()) as T);
        try { sessionStorage.setItem(KEY, pass); } catch {}
      } catch {
        if (!stale) { setError("Network trouble. Check your connection."); setFailed(true); }
      } finally {
        if (seq.current === mine) setLoading(false);
      }
    })();
    return () => { stale = true; };
  }, [pass, url, key, attempt]);

  return { pass, ready, data, error, loading, login: (p: string) => setPass(p), retry: failed ? () => setAttempt((n) => n + 1) : undefined };
}

export function Login({ onLogin, error, loading, retry }: { onLogin: (p: string) => void; error: string; loading: boolean; retry?: () => void }) {
  const [v, setV] = useState("");
  // A saved passphrase is being checked against the API. Do not flash an empty
  // login form while navigating between already-authorized /stats pages.
  if (loading && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ background: C.navy }} aria-busy="true">
        <p className="text-sm font-medium" role="status" style={{ color: "#d1def4" }}>Opening Studio Stats…</p>
      </main>
    );
  }
  if (retry && !loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ background: C.navy }}>
        <div className="w-full max-w-sm rounded-2xl p-7" style={{ background: C.card, boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.mute }}>Minor Works</p>
          <h1 className="mt-1 text-2xl" style={{ fontFamily: SERIF, color: C.navy, fontWeight: 700 }}>Stats did not load</h1>
          <p role="alert" className="mt-3 text-sm" style={{ color: C.ink }}>{error} You are still signed in.</p>
          <button type="button" onClick={retry} className="mt-5 w-full rounded-lg py-2.5 text-sm font-semibold text-white" style={{ background: C.blue }}>Try again</button>
        </div>
      </main>
    );
  }
  const submit = (e: FormEvent) => { e.preventDefault(); if (v) onLogin(v); };
  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ background: C.navy }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl p-7" style={{ background: C.card, boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.mute }}>Minor Works</p>
        <h1 className="mt-1 text-3xl" style={{ fontFamily: SERIF, color: C.navy, fontWeight: 700 }}>Studio stats</h1>
        <label htmlFor="pp" className="mt-6 block text-sm font-medium" style={{ color: C.ink }}>Passphrase</label>
        <input id="pp" type="password" autoComplete="current-password" autoFocus value={v} onChange={(e) => setV(e.target.value)}
          className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-base outline-none" style={{ border: `1px solid ${C.line}`, color: C.ink }} />
        {error && <p role="alert" className="mt-3 text-sm" style={{ color: C.red }}>{error}</p>}
        <button type="submit" disabled={loading || !v} className="mt-5 w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: C.blue }}>
          {loading ? "Checking…" : "View stats"}
        </button>
      </form>
    </main>
  );
}

// ---- Shell ---------------------------------------------------------------------------------------------------------

type NavKey = "overview" | "sites" | "health" | "search";
const NAV: { key: NavKey; href: string; label: string; icon: ReactNode }[] = [
  { key: "overview", href: "/stats", label: "Overview", icon: <path d="M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z" /> },
  { key: "sites", href: "/stats/sites", label: "Sites", icon: <path d="M10 2 2 6l8 4 8-4zM2 10l8 4 8-4M2 14l8 4 8-4" /> },
  { key: "health", href: "/stats/health", label: "Health", icon: <path d="M2 10h4l2-6 4 12 2-6h4" /> },
  { key: "search", href: "/stats/search", label: "Search", icon: <path d="M8.5 3a5.5 5.5 0 1 0 3.4 9.8l4 4 1.1-1.1-4-4A5.5 5.5 0 0 0 8.5 3z" /> },
];
const NavIcon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" aria-hidden>{children}</svg>
);

type ShellProps = {
  title: string;
  subtitle?: ReactNode;
  active: NavKey;
  days?: number;
  onDays?: (d: number) => void;
  mine?: boolean;
  onMine?: () => void;
  loading: boolean;
  stamp?: string;
  extra?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

/** Page frame: navy sidebar (top tabs on phones), serif title row with the range controls, then the modules. */
export function Shell({ title, subtitle, active, days, onDays, mine, onMine, loading, stamp, extra, actions, children }: ShellProps) {
  return (
    <div className="min-h-screen lg:flex" style={{ background: C.bg, color: C.ink }}>
      <aside className="hidden shrink-0 flex-col justify-between lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[196px]" style={{ background: C.navy }}>
        <div>
          <p className="px-5 pb-5 pt-5 text-[19px] text-white" style={{ fontFamily: SERIF, fontWeight: 700 }}>Minor Works</p>
          <nav className="space-y-0.5 px-2.5" aria-label="Stats sections">
            {NAV.map((n) => (
              <Link key={n.key} href={n.href} aria-current={active === n.key ? "page" : undefined}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium" style={{ background: active === n.key ? C.navy2 : "transparent", color: active === n.key ? "#fff" : "#b9c6e4" }}>
                <NavIcon>{n.icon}</NavIcon>{n.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="px-5 pb-4 text-[10.5px] leading-snug" style={{ color: "#8fa3cc" }}>{stamp ? <>Last updated<br />{stamp} Boston time</> : null}</p>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="lg:hidden" style={{ background: C.navy }}>
          <p className="px-4 pt-3 text-[17px] text-white" style={{ fontFamily: SERIF, fontWeight: 700 }}>Minor Works</p>
          <nav className="flex gap-1 overflow-x-auto px-3 pt-1" aria-label="Stats sections">
            {NAV.map((n) => (
              <Link key={n.key} href={n.href} aria-current={active === n.key ? "page" : undefined} className="shrink-0 rounded-t-lg px-3.5 py-2 text-[13px] font-medium" style={{ background: active === n.key ? C.bg : "transparent", color: active === n.key ? C.navy : "#c9d6f2" }}>
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mx-auto max-w-[1280px] px-4 pb-8 pt-4 sm:px-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h1 className="text-[26px] leading-tight sm:text-[30px]" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{title}</h1>
              {subtitle && <p className="text-[12.5px]" style={{ color: C.mute }}>{subtitle}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {actions}
              {extra}
              {days !== undefined && onDays && <Seg label="Time range" value={days} onChange={onDays} options={[[7, "7 days"], [30, "30 days"], [90, "90 days"]]} />}
              {onMine && (
                <button onClick={onMine} aria-pressed={!!mine} className="rounded-lg px-2.5 py-1.5 text-xs font-medium" style={{ background: mine ? C.navy : C.track, color: mine ? "#fff" : C.mute }}>
                  {mine ? "Including my visits" : "Include my visits"}
                </button>
              )}
            </div>
          </div>
          <main className="space-y-3" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>{children}</main>
        </div>
      </div>
    </div>
  );
}
