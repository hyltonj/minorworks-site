"use client";

// Shared pieces for the private /stats pages. Moved out of the original page.tsx unchanged where possible
// (palette, Delta, Spark, Card, Empty, HBars, Donut, DailyBars), plus the new building blocks for Studio Stats 2.0.

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
  amberFaint: "#fdf3dc",
  ink: "#12203d",
  mute: "#6b7a99",
  line: "#e6ebf3",
  bg: "#f3f6fb",
};

export const SERIF = "Georgia, 'Times New Roman', serif";
export const nf = (v: number) => v.toLocaleString("en-US");
export const KEY = "mw:stats:pass";

export const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");
export const dur = (sec: number | null | undefined) => {
  if (sec === null || sec === undefined) return "–";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
};
export const flag = (code: string) =>
  code.length === 2 ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : "";

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

export function Card({ title, children, className = "", note }: { title: string; children: ReactNode; className?: string; note?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-5 ${className}`} style={{ border: `1px solid ${C.line}`, boxShadow: "0 1px 2px rgba(11,31,68,.04)" }}>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold" style={{ color: C.ink }}>{title}</h2>
        {note && <span className="text-xs" style={{ color: C.mute }}>{note}</span>}
      </div>
      {children}
    </section>
  );
}

/** Expandable block for the denser workspace pages. Native <details>: keyboard and screen-reader friendly, no state. */
export function Section({ title, note, open = true, children }: { title: string; note?: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="group rounded-2xl bg-white" style={{ border: `1px solid ${C.line}`, boxShadow: "0 1px 2px rgba(11,31,68,.04)" }}>
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-2 px-5 py-3.5 [&::-webkit-details-marker]:hidden">
        <h2 className="text-[15px] font-semibold" style={{ color: C.ink }}>
          <span className="mr-2 inline-block text-xs transition-transform group-open:rotate-90" style={{ color: C.mute }} aria-hidden>▸</span>
          {title}
        </h2>
        {note && <span className="text-right text-xs" style={{ color: C.mute }}>{note}</span>}
      </summary>
      <div className="border-t px-5 pb-5 pt-4" style={{ borderColor: C.line }}>{children}</div>
    </details>
  );
}

export function Empty({ text = "Nothing yet" }: { text?: string }) {
  return <p className="py-6 text-center text-sm" style={{ color: C.mute }}>{text}</p>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: ReactNode }) {
  const warn = tone === "warn";
  return (
    <p className="rounded-xl px-3.5 py-2.5 text-xs leading-relaxed" role="note"
      style={{ background: warn ? C.amberFaint : C.blueFaint, color: warn ? "#6b4a0f" : C.navy2, border: `1px solid ${warn ? "#f0dca8" : "#c7dbf7"}` }}>
      {children}
    </p>
  );
}

export function HBars({ rows, color = C.blue, label, suffix }: { rows: { name: string; value: number; extra?: string }[]; color?: string; label?: (n: string) => string; suffix?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <Empty />;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.name} className="text-sm">
          <div className="mb-1 flex justify-between gap-3">
            <span className="truncate" style={{ color: C.ink }}>{label ? label(r.name) : r.name}</span>
            <span className="shrink-0 tabular-nums" style={{ color: C.mute }}>{nf(r.value)}{suffix}{r.extra ? ` · ${r.extra}` : ""}</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: C.blueFaint }}>
            <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Donut({ rows }: { rows: { name: string; value: number }[] }) {
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!total) return <Empty />;
  const colors = [C.navy2, C.blue, C.blueSoft, C.red];
  let acc = 0;
  const R = 42, circ = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90" aria-hidden>
        {rows.map((r, i) => {
          const len = (r.value / total) * circ;
          const el = (
            <circle key={r.name} cx="50" cy="50" r={R} fill="none" stroke={colors[i % colors.length]} strokeWidth="14"
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} />
          );
          acc += len;
          return el;
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
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

export type DailyRow = { day: string; views: number; plays: number };
export const etDay = (offset: number) => new Date(Date.now() - offset * 86400000).toLocaleDateString("en-CA", { timeZone: "America/New_York" });

export function DailyBars({ days, daily }: { days: number; daily: { day: string; views: number; plays: number }[] }) {
  // Fill quiet days so the axis is honest.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const list: DailyRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = etDay(i);
    const r = byDay.get(key);
    list.push({ day: key, views: r ? r.views : 0, plays: r ? r.plays : 0 });
  }
  const max = Math.max(1, ...list.map((d) => d.views + d.plays));
  const w = 600, h = 170, gap = days > 30 ? 1 : 3;
  const bw = (w - gap * (list.length - 1)) / list.length;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h + 18}`} className="w-full" role="img" aria-label="Daily activity">
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1="0" x2={w} y1={h - t * (h - 6)} y2={h - t * (h - 6)} stroke={C.line} strokeWidth="1" />
        ))}
        {list.map((d, i) => {
          const x = i * (bw + gap);
          const hv = (d.views / max) * (h - 6), hp = (d.plays / max) * (h - 6);
          return (
            <g key={d.day}>
              <title>{`${d.day}: ${d.views} page views, ${d.plays} game plays`}</title>
              <rect x={x} y={h - hv} width={bw} height={hv} fill={C.blue} rx="1.5" />
              <rect x={x} y={h - hv - hp} width={bw} height={hp} fill={C.red} rx="1.5" />
            </g>
          );
        })}
        <text x="0" y={h + 14} fontSize="10" fill={C.mute}>{list[0]?.day.slice(5)}</text>
        <text x={w} y={h + 14} fontSize="10" fill={C.mute} textAnchor="end">{list[list.length - 1]?.day.slice(5)}</text>
        <text x="0" y="10" fontSize="10" fill={C.mute}>{nf(max)}</text>
      </svg>
      <div className="mt-1 flex gap-4 text-xs" style={{ color: C.mute }}>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: C.blue }} />Page views</span>
        <span><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: C.red }} />Game plays</span>
      </div>
    </div>
  );
}

// ---- New in 2.0 ----------------------------------------------------------------------------------------------------

export type Series = { key: string; label: string; color: string; values: (number | null)[] };

/** Interactive line chart. `null` means "no data collected" and leaves a gap; 0 means "collected, nothing happened". */
export function LineChart({ labels, series, height = 200 }: { labels: string[]; series: Series[]; height?: number }) {
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [hover, setHover] = useState<number | null>(null);
  const on = series.filter((s) => !off[s.key]);
  const w = 640, h = height, padL = 34, padB = 20, padT = 8;
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
  const tick = (i: number) => labels[i]?.slice(5);
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2 text-xs">
        {series.map((s) => (
          <button key={s.key} onClick={() => setOff((o) => ({ ...o, [s.key]: !o[s.key] }))} aria-pressed={!off[s.key]}
            className="rounded-full px-2.5 py-1 font-medium" style={{ border: `1px solid ${off[s.key] ? C.line : s.color}`, color: off[s.key] ? C.mute : C.ink, background: off[s.key] ? "transparent" : "#fff" }}>
            <i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: off[s.key] ? C.line : s.color }} />{s.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full touch-none select-none" role="img" aria-label="Daily trend"
          onPointerMove={move} onPointerDown={move} onPointerLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={padL} x2={w - 6} y1={y(t * max)} y2={y(t * max)} stroke={C.line} />
              <text x={padL - 5} y={y(t * max) + 3} fontSize="10" fill={C.mute} textAnchor="end">{nf(Math.round(t * max))}</text>
            </g>
          ))}
          <text x={padL} y={h - 4} fontSize="10" fill={C.mute}>{tick(0)}</text>
          <text x={w - 6} y={h - 4} fontSize="10" fill={C.mute} textAnchor="end">{tick(labels.length - 1)}</text>
          {on.map((s) => <path key={s.key} d={path(s)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
          {on.map((s) => s.values.length === 1 || s.values.filter((v) => v !== null).length === 1
            ? s.values.map((v, i) => v === null ? null : <circle key={s.key + i} cx={x(i)} cy={y(v)} r="3" fill={s.color} />) : null)}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={h - padB} stroke={C.mute} strokeDasharray="3 3" />
              {on.map((s) => s.values[hover] === null ? null : <circle key={s.key} cx={x(hover)} cy={y(s.values[hover] as number)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />)}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-lg px-2.5 py-1.5 text-xs shadow" style={{ left: `${Math.min(70, (x(hover) / w) * 100)}%`, background: C.navy, color: "#fff" }}>
            <b>{labels[hover]}</b>
            {on.map((s) => <div key={s.key}><i className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}: {s.values[hover] === null ? "not collected" : nf(s.values[hover] as number)}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

export type Col<T> = { key: string; label: string; align?: "left" | "right"; value?: (r: T) => number | string; render?: (r: T) => ReactNode; hide?: "sm" };

/** Compact sortable table. Click a header to sort; click again to reverse. */
export function DataTable<T>({ rows, cols, empty = "Nothing yet", initialSort, limit }: { rows: T[]; cols: Col<T>[]; empty?: string; initialSort?: string; limit?: number }) {
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
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide" style={{ color: C.mute }}>
            {cols.map((c) => (
              <th key={c.key} scope="col" className={`pb-2 font-medium ${c.align === "right" ? "text-right" : "text-left"} ${c.hide ? "hidden sm:table-cell" : ""}`}
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
                <td key={c.key} className={`py-2 ${c.align === "right" ? "text-right tabular-nums" : ""} ${c.hide ? "hidden sm:table-cell" : ""}`}>
                  {c.render ? c.render(r) : String(c.value ? c.value(r) : "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {limit && rows.length > limit && (
        <button onClick={() => setAll((a) => !a)} className="mt-2 text-xs font-medium" style={{ color: C.blue }}>
          {all ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      )}
    </div>
  );
}

export function Dot({ status }: { status: "ok" | "stale" | "no_data" | "connected" | "tag_only" | "not_connected" | "not_configured" | "error" }) {
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
      <div className="min-w-[420px]">
        {names.map((nm, d) => (
          <div key={nm} className="flex items-center gap-[2px] pb-[2px]">
            <span className="w-8 shrink-0 text-[10px]" style={{ color: C.mute }}>{nm}</span>
            {Array.from({ length: 24 }, (_, hr) => {
              const v = map.get(`${d}-${hr}`) || 0;
              return <i key={hr} title={`${nm} ${hr}:00 · ${v} events`} className="block h-4 flex-1 rounded-[3px]" style={{ background: v ? C.blue : C.blueFaint, opacity: v ? 0.25 + 0.75 * (v / max) : 0.5 }} />;
            })}
          </div>
        ))}
        <div className="ml-8 flex justify-between text-[10px]" style={{ color: C.mute }}><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div>
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, pair }: { label: string; value: ReactNode; sub?: ReactNode; pair?: Pair }) {
  return (
    <div className="rounded-xl bg-white p-3.5" style={{ border: `1px solid ${C.line}` }}>
      <p className="text-xs" style={{ color: C.mute }}>{label}</p>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-2xl tabular-nums" style={{ fontFamily: SERIF, fontWeight: 700, color: C.navy }}>{value}</span>
        {pair && <span className="text-xs font-medium"><Delta p={pair} /></span>}
      </div>
      {sub && <p className="mt-0.5 text-[11px]" style={{ color: C.mute }}>{sub}</p>}
    </div>
  );
}

// ---- Auth + data hook ----------------------------------------------------------------------------------------------

/** One passphrase for every /stats page (kept in sessionStorage for the tab). Reloads when `params` change. */
export function useStats<T>(url: string, params: Record<string, unknown>) {
  const [pass, setPass] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(params);
  const seq = useRef(0);

  useEffect(() => {
    try { const p = sessionStorage.getItem(KEY); if (p) setPass(p); } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!pass) return;
    let stale = false;
    const mine = ++seq.current;
    (async () => {
      setLoading(true);
      setError("");
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
        if (!r.ok) { setError("Could not reach PostHog just now. Try again in a minute."); return; }
        setData((await r.json()) as T);
        try { sessionStorage.setItem(KEY, pass); } catch {}
      } catch {
        if (!stale) setError("Network trouble. Try again.");
      } finally {
        if (seq.current === mine) setLoading(false);
      }
    })();
    return () => { stale = true; };
  }, [pass, url, key]);

  return { pass, ready, data, error, loading, login: (p: string) => setPass(p) };
}

export function Login({ onLogin, error, loading }: { onLogin: (p: string) => void; error: string; loading: boolean }) {
  const [v, setV] = useState("");
  const submit = (e: FormEvent) => { e.preventDefault(); if (v) onLogin(v); };
  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ background: C.navy }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7" style={{ boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
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

type ShellProps = {
  title: string;
  active: "overview" | "sites";
  days: number;
  onDays: (d: number) => void;
  mine: boolean;
  onMine: () => void;
  loading: boolean;
  extra?: ReactNode;
  children: ReactNode;
};

/** Page frame: same navy header as before, plus a two-link nav (Overview, Sites). */
export function Shell({ title, active, days, onDays, mine, onMine, loading, extra, children }: ShellProps) {
  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      <header style={{ background: C.navy }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: C.blueSoft }}>Minor Works</p>
            <h1 className="text-2xl text-white sm:text-3xl" style={{ fontFamily: SERIF, fontWeight: 700 }}>{title}</h1>
          </div>
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: C.navy2 }} role="group" aria-label="Time range">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => onDays(d)} aria-pressed={days === d}
                className="rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: days === d ? "#fff" : "transparent", color: days === d ? C.navy : "#c9d6f2" }}>
                {d} days
              </button>
            ))}
          </div>
          {extra}
          <button onClick={onMine} aria-pressed={mine} className="rounded-xl px-3 py-2 text-sm font-medium" style={{ background: mine ? "#fff" : C.navy2, color: mine ? C.navy : "#c9d6f2" }}>
            {mine ? "Including my visits" : "Include my visits"}
          </button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4 pb-0 sm:px-6" aria-label="Stats sections">
          {([["overview", "/stats", "Overview"], ["sites", "/stats/sites", "Sites"]] as const).map(([k, href, label]) => (
            <Link key={k} href={href} aria-current={active === k ? "page" : undefined}
              className="rounded-t-lg px-4 py-2 text-sm font-medium" style={{ background: active === k ? C.bg : "transparent", color: active === k ? C.navy : "#c9d6f2" }}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>
        {children}
      </main>
    </div>
  );
}

export const stampOf = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
