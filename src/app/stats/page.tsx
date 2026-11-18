"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useState } from "react";

type Pair = { now: number; before: number };
type Data = {
  days: number;
  generatedAt: string;
  totals: {
    people: Pair;
    pageViews: Pair;
    plays: Pair;
    finishes: Pair;
    hops: Pair;
    returning: { now: number; of: number };
    activeSecondsPerVisit: number | null;
  };
  daily: { day: string; people: number; views: number; plays: number; finishes: number }[];
  sites: { site: string; people: number; views: number; plays: number; finishes: number }[];
  referrers: { name: string; people: number }[];
  devices: { name: string; people: number }[];
  funnel: { visited: number; sawFooter: number; clickedFooter: number; crossedSites: number };
  pages: { page: string; views: number }[];
  countries: { code: string; people: number }[];
};

const C = {
  navy: "#0b1f44",
  navy2: "#16305f",
  blue: "#3d7be8",
  blueSoft: "#9ec0f5",
  blueFaint: "#dbe8fb",
  red: "#dc5b52",
  green: "#16a34a",
  ink: "#12203d",
  mute: "#6b7a99",
  line: "#e6ebf3",
  bg: "#f3f6fb",
};

const nf = (v: number) => v.toLocaleString("en-US");
const KEY = "mw:stats:pass";

function Delta({ p }: { p: Pair }) {
  if (!p.before && !p.now) return <span style={{ color: C.mute }}>no data</span>;
  if (!p.before) return <span style={{ color: C.green }}>new</span>;
  const pct = Math.round(((p.now - p.before) / p.before) * 100);
  const up = pct >= 0;
  return (
    <span style={{ color: up ? C.green : C.red }}>
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

function Spark({ values, color = C.blue }: { values: number[]; color?: string }) {
  const w = 160, h = 34;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 3 - (v / max) * (h - 8)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: 34 }} aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} opacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Card({ title, children, className = "", note }: { title: string; children: ReactNode; className?: string; note?: string }) {
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

function Empty({ text = "Nothing yet" }: { text?: string }) {
  return <p className="py-6 text-center text-sm" style={{ color: C.mute }}>{text}</p>;
}

function HBars({ rows, color = C.blue, label }: { rows: { name: string; value: number }[]; color?: string; label?: (n: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <Empty />;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.name} className="text-sm">
          <div className="mb-1 flex justify-between gap-3">
            <span className="truncate" style={{ color: C.ink }}>{label ? label(r.name) : r.name}</span>
            <span className="tabular-nums" style={{ color: C.mute }}>{nf(r.value)}</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: C.blueFaint }}>
            <div className="h-2 rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Donut({ rows }: { rows: { name: string; value: number }[] }) {
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

function DailyBars({ days, daily }: { days: number; daily: Data["daily"] }) {
  // Fill quiet days so the axis is honest.
  const fmt = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const list: { day: string; views: number; plays: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = fmt(new Date(Date.now() - i * 86400000));
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

const flag = (code: string) =>
  code.length === 2 ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0))) : "";

export default function StatsPage() {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: string, d: number) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passphrase: p, days: d }) });
      if (r.status === 401) {
        try { sessionStorage.removeItem(KEY); } catch {}
        setAuthed(null);
        setError("That passphrase did not work.");
        return;
      }
      if (r.status === 503) { setError("Stats are not set up yet. The passphrase or PostHog key is missing on the server."); return; }
      if (!r.ok) { setError("Could not reach PostHog just now. Try again in a minute."); return; }
      setData((await r.json()) as Data);
      setAuthed(p);
      try { sessionStorage.setItem(KEY, p); } catch {}
    } catch {
      setError("Network trouble. Try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const p = sessionStorage.getItem(KEY);
      if (p) load(p, 7);
    } catch {}
  }, [load]);

  const onSubmit = (e: FormEvent) => { e.preventDefault(); if (pass) load(pass, days); };
  const pick = (d: number) => { setDays(d); if (authed) load(authed, d); };

  if (!authed || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4" style={{ background: C.navy }}>
        <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-7" style={{ boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.mute }}>Minor Works</p>
          <h1 className="mt-1 text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", color: C.navy, fontWeight: 700 }}>Studio stats</h1>
          <label htmlFor="pp" className="mt-6 block text-sm font-medium" style={{ color: C.ink }}>Passphrase</label>
          <input id="pp" type="password" autoComplete="current-password" autoFocus value={pass} onChange={(e) => setPass(e.target.value)}
            className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-base outline-none" style={{ border: `1px solid ${C.line}`, color: C.ink }} />
          {error && <p role="alert" className="mt-3 text-sm" style={{ color: C.red }}>{error}</p>}
          <button type="submit" disabled={loading || !pass} className="mt-5 w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: C.blue }}>
            {loading ? "Checking…" : "View stats"}
          </button>
        </form>
      </main>
    );
  }

  const t = data.totals;
  const spark = (k: "people" | "views" | "plays" | "finishes") => data.daily.map((d) => d[k]);
  const kpis: { label: string; pair: Pair; key: "people" | "views" | "plays" | "finishes" }[] = [
    { label: "People", pair: t.people, key: "people" },
    { label: "Page views", pair: t.pageViews, key: "views" },
    { label: "Games started", pair: t.plays, key: "plays" },
    { label: "Games finished", pair: t.finishes, key: "finishes" },
  ];
  const f = data.funnel;
  const finishRate = t.plays.now ? Math.round((t.finishes.now / t.plays.now) * 100) : null;
  const stamp = new Date(data.generatedAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.ink }}>
      <header style={{ background: C.navy }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: C.blueSoft }}>Minor Works</p>
            <h1 className="text-2xl text-white sm:text-3xl" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700 }}>Studio stats</h1>
          </div>
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: C.navy2 }} role="group" aria-label="Time range">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => pick(d)} aria-pressed={days === d}
                className="rounded-lg px-3 py-1.5 text-sm font-medium" style={{ background: days === d ? "#fff" : "transparent", color: days === d ? C.navy : "#c9d6f2" }}>
                {d} days
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6" style={{ opacity: loading ? 0.6 : 1, transition: "opacity .2s" }}>
        <p className="text-xs" style={{ color: C.mute }}>
          Last {data.days} days vs the {data.days} before. Updated {stamp} Boston time. Preview sites excluded. Safari visitors may be undercounted.
        </p>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${C.line}` }}>
              <p className="text-sm" style={{ color: C.mute }}>{k.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl tabular-nums" style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: C.navy }}>{nf(k.pair.now)}</span>
                <span className="text-xs font-medium"><Delta p={k.pair} /></span>
              </div>
              <Spark values={spark(k.key)} color={k.key === "plays" || k.key === "finishes" ? C.red : C.blue} />
            </div>
          ))}
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
          <Card title="By site" className="lg:col-span-2" note={`last ${data.days} days`}>
            {data.sites.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide" style={{ color: C.mute }}>
                      <th className="pb-2 font-medium">Site</th>
                      <th className="pb-2 text-right font-medium">People</th>
                      <th className="pb-2 text-right font-medium">Views</th>
                      <th className="pb-2 text-right font-medium">Started</th>
                      <th className="pb-2 text-right font-medium">Finished</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sites.map((s) => (
                      <tr key={s.site} className="border-t" style={{ borderColor: C.line }}>
                        <td className="py-2 font-medium">{s.site}</td>
                        <td className="py-2 text-right tabular-nums">{nf(s.people)}</td>
                        <td className="py-2 text-right tabular-nums">{nf(s.views)}</td>
                        <td className="py-2 text-right tabular-nums">{nf(s.plays)}</td>
                        <td className="py-2 text-right tabular-nums">{nf(s.finishes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty />}
          </Card>
          <Card title="Devices" note="people">
            <Donut rows={data.devices.map((d) => ({ name: d.name, value: d.people }))} />
            {t.activeSecondsPerVisit !== null && (
              <p className="mt-4 border-t pt-3 text-sm" style={{ borderColor: C.line, color: C.mute }}>
                Active time per visit: <b style={{ color: C.ink }}>{Math.floor(t.activeSecondsPerVisit / 60)}m {t.activeSecondsPerVisit % 60}s</b>
              </p>
            )}
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

        <p className="pb-6 text-center text-xs" style={{ color: C.mute }}>
          Private page · numbers come from PostHog · full detail lives in the Minor Works: Studio Overview dashboard there.
        </p>
      </main>
    </div>
  );
}
