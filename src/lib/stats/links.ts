// Deep links into PostHog so a journey can be explored there instead of rebuilding an analytics engine here.
// PostHog opens a new insight from a query in the URL hash. Needs a signed-in PostHog session.

import type { JourneyStep } from "./model";

const PH = "https://us.posthog.com/project/747271";

const siteFilter = (site: string) => ({ type: "AND", values: [{ type: "AND", values: [{ key: "site", value: [site], operator: "exact", type: "event" }] }] });

const open = (q: unknown) => `${PH}/insights/new#q=${encodeURIComponent(JSON.stringify(q))}`;

/** The same ordered steps as the dashboard, as a PostHog funnel counted by session. */
export function funnelUrl(site: string, steps: JourneyStep[], days: number): string {
  return open({
    kind: "InsightVizNode",
    source: {
      kind: "FunnelsQuery",
      series: steps.map((st) => ({
        kind: "EventsNode",
        event: st.events.includes("*") ? null : st.events[0],
        name: st.label,
        custom_name: st.label,
        ...(st.where ? { properties: [{ key: st.where.prop, value: [st.where.value], operator: "exact", type: "event" }] } : {}),
      })),
      funnelsFilter: { funnelVizType: "steps", funnelOrderType: "ordered", funnelWindowInterval: 6, funnelWindowIntervalUnit: "hour", funnelAggregateByHogQL: "properties.$session_id" },
      dateRange: { date_from: `-${days}d` },
      filterTestAccounts: true,
      properties: siteFilter(site),
    },
  });
}

/** User paths through the site's events, for finding where people go next or leave. */
export function pathsUrl(site: string, days: number): string {
  return open({
    kind: "InsightVizNode",
    source: {
      kind: "PathsQuery",
      pathsFilter: { includeEventTypes: ["custom_event"], stepLimit: 6 },
      dateRange: { date_from: `-${days}d` },
      filterTestAccounts: true,
      properties: siteFilter(site),
    },
  });
}

/** Raw events for the site, newest first. */
export const eventsUrl = (site: string) =>
  `${PH}/activity/explore#q=${encodeURIComponent(JSON.stringify({ kind: "DataTableNode", source: { kind: "EventsQuery", select: ["*", "event", "person", "timestamp"], properties: [{ key: "site", value: [site], operator: "exact", type: "event" }], after: "-24h", orderBy: ["timestamp DESC"] } }))}`;

/** Unique people per day, broken down by site, over the same range as the portfolio chart. */
export function trendsUrl(days: number): string {
  return open({
    kind: "InsightVizNode",
    source: {
      kind: "TrendsQuery",
      series: [{ kind: "EventsNode", event: null, name: "All events", math: "dau" }],
      breakdownFilter: { breakdown: "site", breakdown_type: "event" },
      interval: "day",
      dateRange: { date_from: `-${days}d` },
      filterTestAccounts: true,
    },
  });
}
