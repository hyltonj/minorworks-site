"use client";

import { ReactNode, useState } from "react";
import { C, Empty, Insufficient, nf } from "./ui";

const pc = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : "–");

// ---- Journey -------------------------------------------------------------------------------------------------------

export type JStep = { label: string; sessions: number; base: number };

/**
 * Ordered session journey. Every number is exact. Three denominators are shown and named:
 * arrivals (all sessions), the step's own cohort (`base`, the step it can only follow), and the step before.
 * The loss column is the sessions that reached the step before and not this one.
 */
export function JourneyFlow({ steps, baseNames }: { steps: JStep[]; baseNames?: Record<number, string> }) {
  const arr = steps[0]?.sessions || 0;
  if (!arr) return <Empty text="No sessions in this range" />;
  return (
    <div className="text-[12px]">
      <div className="mb-1 grid grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_52px_52px_52px_58px] items-end gap-x-2 text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ color: C.mute }}>
        <span>Step</span><span>Sessions (bar = share of arrivals)</span><span className="text-right">of arrivals</span><span className="text-right" title="Share of the sessions that reached the cohort step named in the tooltip of each row">of cohort</span><span className="text-right">step to step</span><span className="text-right">lost here</span>
      </div>
      <ul>
        {steps.map((st, i) => {
          const prev = i ? steps[i - 1].sessions : 0;
          const baseN = steps[st.base]?.sessions ?? arr;
          const lost = i ? Math.max(0, prev - st.sessions) : 0;
          const cohortApplies = i > 0 && st.base > 0;
          const never = i === 1;
          return (
            <li key={st.label} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,2fr)_52px_52px_52px_58px] items-center gap-x-2 border-t py-[3px]" style={{ borderColor: C.line }}>
              <span className="truncate" style={{ color: C.ink }}>{st.label}</span>
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 flex-1 rounded-sm" style={{ background: C.track }}>
                  <div className="h-3.5 rounded-sm" style={{ width: `${Math.max(0.8, (st.sessions / arr) * 100)}%`, background: i === 0 ? C.navy2 : st.base > 0 && st.base >= 6 ? C.red : C.blue, opacity: i === 0 ? 1 : 0.92 }} />
                </div>
                <span className="w-9 shrink-0 text-right tabular-nums font-medium" style={{ color: C.ink }}>{nf(st.sessions)}</span>
              </div>
              <span className="text-right tabular-nums" style={{ color: C.mute }}>{i ? pc(st.sessions, arr) : "100%"}</span>
              <span className="text-right tabular-nums" title={cohortApplies ? `Of the ${nf(baseN)} sessions at “${baseNames?.[st.base] ?? steps[st.base].label}”` : ""} style={{ color: cohortApplies ? C.ink : C.line }}>{cohortApplies ? pc(st.sessions, baseN) : "·"}</span>
              <span className="text-right tabular-nums" style={{ color: i && prev && st.sessions / prev < 0.7 ? C.red : C.mute }}>{i ? pc(st.sessions, prev) : "·"}</span>
              <span className="text-right tabular-nums" style={{ color: never ? C.mute : lost ? C.red : C.line }} title={never ? "Arrived and did not answer a question: includes people who left at once or never started" : undefined}>{i ? (lost ? `−${nf(lost)}` : "0") : "·"}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-[10.5px] leading-snug" style={{ color: C.mute }}>
        <b>of arrivals</b>: all {nf(arr)} sessions. <b>of cohort</b>: sessions that reached the step this one can only follow (Q2 to the end: those who answered Q1; sharing: those who finished). <b>step to step</b>: the step directly above. Red marks a step that keeps under 70% of the one before.
      </p>
    </div>
  );
}

// ---- Cohort heatmap ------------------------------------------------------------------------------------------------

export type CohortCell = { first: string; k: number; people: number };

/** Rows are the day a person was first seen; columns are days later; a cell is the share of that cohort active that day. */
export function CohortHeat({ cells, minCohort = 20, histStart }: { cells: CohortCell[]; minCohort?: number; histStart: string }) {
  const firsts = [...new Set(cells.map((c) => c.first))].sort();
  if (!firsts.length) return <Empty text="No new people in this range" />;
  const size = new Map(cells.filter((c) => c.k === 0).map((c) => [c.first, c.people]));
  const maxK = Math.min(7, Math.max(...cells.map((c) => c.k)));
  const grid = new Map(cells.map((c) => [`${c.first}|${c.k}`, c.people]));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const daysBetween = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
  const shade = (p: number) => `rgba(61,123,232,${(0.12 + 0.88 * Math.min(1, p)).toFixed(2)})`;
  return (
    <div className="overflow-x-auto text-[11px]">
      <table className="w-full border-separate" style={{ borderSpacing: 2 }}>
        <thead>
          <tr style={{ color: C.mute }}>
            <th className="pr-2 text-left font-semibold">First seen</th><th className="px-1 text-right font-semibold">People</th>
            {Array.from({ length: maxK + 1 }, (_, k) => <th key={k} className="w-[9%] text-center font-semibold">{k === 0 ? "Day 0" : `+${k}`}</th>)}
          </tr>
        </thead>
        <tbody>
          {firsts.map((f) => {
            const n = size.get(f) || 0;
            const small = n < minCohort;
            return (
              <tr key={f}>
                <td className="whitespace-nowrap pr-2" style={{ color: C.ink }}>{f.slice(5)}{f === histStart && <span title="Everyone already active when PostHog history began is counted as first seen on this day" style={{ color: C.amber }}> *</span>}</td>
                <td className="px-1 text-right tabular-nums" style={{ color: small ? C.amber : C.mute }}>{nf(n)}</td>
                {Array.from({ length: maxK + 1 }, (_, k) => {
                  const observable = daysBetween(f, today) >= k && !(k === daysBetween(f, today) && false);
                  const v = grid.get(`${f}|${k}`) || 0;
                  const share = n ? v / n : 0;
                  if (!observable) return <td key={k} className="rounded text-center" style={{ border: `1px dashed ${C.line}`, color: C.line }}>·</td>;
                  return (
                    <td key={k} title={`${nf(v)} of ${nf(n)} people from ${f}${small ? " (small cohort)" : ""}`} className="rounded text-center tabular-nums"
                      style={{ background: k === 0 ? C.track : shade(share), color: share > 0.55 && k > 0 ? "#fff" : C.ink, opacity: small && k > 0 ? 0.55 : 1, padding: "3px 0" }}>
                      {k === 0 ? "100%" : n ? `${Math.round(share * 100)}%` : "–"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1.5 text-[10.5px] leading-snug" style={{ color: C.mute }}>
        Dashed cells have not happened yet. Faded rows have fewer than {minCohort} people, so a percentage there moves by several points per person. * PostHog history starts {histStart}; that row includes everyone already using the site.
      </p>
    </div>
  );
}

// ---- Share lifecycle -----------------------------------------------------------------------------------------------

export type LifeStage = { n: number; label: string; kind: string; status: string; note: string; needs?: string; names: string[]; events: number | null; people: number | null; of: number | null; breakdown?: { label: string; people: number }[] };

const PHASES: { kind: string; title: string; hint: string; bg: string; fg: string }[] = [
  { kind: "opportunity", title: "Opportunity", hint: "the chance to share was shown", bg: C.track, fg: C.mute },
  { kind: "intent", title: "Intent", hint: "someone signalled they might share; nothing is confirmed", bg: C.amberFaint, fg: "#6b4a0f" },
  { kind: "confirmed", title: "Confirmed browser action", hint: "the browser reported a copy or native share succeeding", bg: C.blueFaint, fg: C.navy2 },
  { kind: "attributable", title: "Attributable visit", hint: "someone opened a link that came from a share", bg: "#dff3e6", fg: "#14532d" },
  { kind: "engagement", title: "Recipient engagement", hint: "what people who arrived through a share then did", bg: "#e9e3f7", fg: "#3b2a73" },
];
const STATUS: Record<string, [string, string]> = { measured: ["Measured", C.green], partial: ["Partial", C.amber], not_observable: ["Not observable", C.red] };

/**
 * Lifecycle grouped by phase. Rows are data-driven: more stages, per-stage breakdowns (method, share type, device)
 * and notes appear as the instrumentation grows, with no layout change. Click a row for events, note and what is needed.
 */
export function ShareLifecycle({ stages, eventsHref }: { stages: LifeStage[]; eventsHref?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const max = Math.max(1, ...stages.map((s) => s.people ?? 0));
  const counts = { measured: 0, partial: 0, not_observable: 0 } as Record<string, number>;
  stages.forEach((s) => (counts[s.status] = (counts[s.status] || 0) + 1));
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px]" style={{ color: C.mute }}>
        {Object.entries(STATUS).map(([k, [l, c]]) => <span key={k}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: c }} />{counts[k] || 0} {l.toLowerCase()}</span>)}
        <span>People = distinct people at that stage. Stages are not a strict sequence.</span>
      </div>
      {PHASES.map((ph) => {
        const rows = stages.filter((s) => s.kind === ph.kind);
        if (!rows.length) return null;
        return (
          <div key={ph.kind} className="mb-2 last:mb-0">
            <p className="mb-0.5 flex items-baseline gap-2"><span className="rounded px-1.5 py-0.5 text-[10.5px] font-semibold" style={{ background: ph.bg, color: ph.fg }}>{ph.title}</span><span className="text-[11px]" style={{ color: C.mute }}>{ph.hint}</span></p>
            <ul>
              {rows.map((r) => {
                const isOpen = open === r.n;
                const [sl, sc] = STATUS[r.status] || [r.status, C.mute];
                return (
                  <li key={r.n} className="border-t" style={{ borderColor: C.line }}>
                    <button onClick={() => setOpen(isOpen ? null : r.n)} aria-expanded={isOpen} className="grid w-full grid-cols-[22px_minmax(0,1.6fr)_104px_minmax(0,1.4fr)_78px_60px] items-center gap-x-2 py-1 text-left text-[12px]">
                      <span className="tabular-nums" style={{ color: C.mute }}>{r.n}</span>
                      <span className="truncate font-medium" style={{ color: C.ink }}><span className="mr-1 inline-block text-[9px] transition-transform" style={{ transform: isOpen ? "rotate(90deg)" : "none", color: C.mute }}>▸</span>{r.label}</span>
                      <span className="whitespace-nowrap text-[11px] font-medium" style={{ color: sc }}>● {sl}</span>
                      <div className="h-2.5 rounded-sm" style={{ background: C.track }}>{r.people ? <div className="h-2.5 rounded-sm" style={{ width: `${Math.max(2, (r.people / max) * 100)}%`, background: ph.fg === C.mute ? C.blueSoft : ph.fg, opacity: 0.75 }} /> : null}</div>
                      <span className="text-right tabular-nums" style={{ color: r.people === null ? C.mute : C.ink }}>{r.people === null ? "–" : r.of !== null ? `${nf(r.people)} of ${nf(r.of)}` : `${nf(r.people)}`}</span>
                      <span className="text-right tabular-nums" style={{ color: C.mute }}>{r.events === null ? "" : `${nf(r.events)} ev`}</span>
                    </button>
                    {isOpen && (
                      <div className="mb-1.5 ml-[30px] rounded-lg px-3 py-2 text-[11.5px] leading-snug" style={{ background: C.bg, color: C.ink }}>
                        <p>{r.note}</p>
                        {r.breakdown && r.breakdown.length > 0 && (
                          <p className="mt-1" style={{ color: C.mute }}>{r.breakdown.map((b) => `${b.label} ${nf(b.people)}`).join(" · ")}</p>
                        )}
                        <p className="mt-1" style={{ color: C.mute }}>Events: {r.names.length ? r.names.map((e) => <code key={e} className="mr-1 text-[11px]">{e}</code>) : "none exist"}{eventsHref && r.names.length ? <> · <a href={eventsHref} target="_blank" rel="noopener noreferrer" style={{ color: C.blue }}>raw events ↗</a></> : null}</p>
                        {r.needs && r.status !== "measured" && <p className="mt-1"><b>Needed:</b> {r.needs}</p>}
                        {r.status === "not_observable" && !r.needs && <Insufficient text="No event exists for this stage" />}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export type { ReactNode };
