import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { NATIVE_BOUNDARY } from "./model";

// Server-only helpers for the stats API routes. The passphrase, the PostHog personal API key and the Small Canon
// stats password live in Netlify environment variables and never reach the browser.

export const JSON_HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

const POSTHOG_APP = process.env.POSTHOG_APP_HOST || "https://us.posthog.com";
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || "747271";

const sha = (s: string) => createHash("sha256").update(s).digest();
export function passphraseOk(given: string): boolean {
  const real = process.env.STATS_PASSPHRASE || "";
  if (!real || !given) return false;
  return timingSafeEqual(sha(given), sha(real));
}

// Wrong-passphrase limiter. In-memory, so it is per server instance and resets on a cold start: it slows guessing, it is
// not a hard guarantee. Per client address (5 wrong tries in 10 minutes) plus a global cap across all addresses.
const FAIL_WINDOW_MS = 10 * 60 * 1000;
const PER_CLIENT_MAX = 5;
const GLOBAL_MAX = 30;
const fails = new Map<string, number[]>();
const globalFails: number[] = [];
const recent = (a: number[], now: number) => { while (a.length && now - a[0] > FAIL_WINDOW_MS) a.shift(); return a; };
function clientId(): string {
  try {
    const h = headers();
    return h.get("x-nf-client-connection-ip") || (h.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  } catch { return "unknown"; }
}
function limited(id: string, now: number): boolean {
  return recent(fails.get(id) || [], now).length >= PER_CLIENT_MAX || recent(globalFails, now).length >= GLOBAL_MAX;
}
function recordFail(id: string, now: number) {
  const a = recent(fails.get(id) || [], now); a.push(now); fails.set(id, a);
  globalFails.push(now);
  if (fails.size > 500) for (const [k, v] of fails) if (!recent(v, now).length) fails.delete(k);
}

/** Returns a response when the caller must stop (not configured, locked out or wrong passphrase), otherwise null. */
export async function gate(passphrase: unknown): Promise<NextResponse | null> {
  const missing = ["STATS_PASSPHRASE", "POSTHOG_PERSONAL_API_KEY"].filter((k) => !process.env[k]);
  if (missing.length) return NextResponse.json({ error: "not_configured", missing }, { status: 503, headers: JSON_HEADERS });
  const id = clientId();
  const now = Date.now();
  // Locked out: do not even check the passphrase, so a locked-out client cannot keep guessing.
  if (limited(id, now)) return NextResponse.json({ error: "too_many_attempts" }, { status: 429, headers: { ...JSON_HEADERS, "Retry-After": "600" } });
  if (!passphraseOk(String(passphrase || ""))) {
    recordFail(id, now);
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.json({ error: "denied" }, { status: 401, headers: JSON_HEADERS });
  }
  return null;
}

/** Runs one HogQL query. `tag` is written into the query as a comment so tests can recognise it. */
export async function hq(tag: string, query: string): Promise<unknown[][]> {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) throw new Error("PostHog key not set");
  const res = await fetch(`${POSTHOG_APP}/api/projects/${PROJECT_ID}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: `/* q:${tag} */ ${query}` }, refresh: "blocking" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PostHog ${res.status} (${tag})`);
  const j = (await res.json()) as { results?: unknown[][] };
  return j.results || [];
}

/** Runs tasks with a small concurrency limit so PostHog is never hit with dozens of queries at once. */
export async function pool<T>(tasks: (() => Promise<T>)[], limit = 6): Promise<T[]> {
  const out: T[] = new Array(tasks.length);
  let i = 0;
  const worker = async () => {
    while (i < tasks.length) {
      const k = i++;
      out[k] = await tasks[k]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return out;
}

export const n = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
export const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

// Preview deploys, local builds and probes are not real visitors.
export const REAL =
  "properties.site is not null and properties.site != '' " +
  "and coalesce(properties.$host, '') not like '%netlify.app' " +
  "and coalesce(properties.$host, '') not like '%vercel.app' " +
  "and coalesce(properties.$host, '') not like 'localhost%' " +
  "and event not in ('$set', '$identify', 'mw_debug_probe')";
// The owner's own testing (owner mode) is left out unless asked for.
export const NOT_INTERNAL = " and coalesce(toString(properties.is_internal), '') != 'true'";

export const inList = (names: string[]) => `(${names.map((e) => `'${e.replace(/'/g, "")}'`).join(", ")})`;

const toSql = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");
export const boundaryMs = Date.parse(`${NATIVE_BOUNDARY}T05:00:00Z`); // midnight Boston (EST) on the boundary day

export type Window = {
  days: number;
  cur: string; // events in the period
  prev: string; // events in the period before
  span: string; // both
  real: string; // site and internal filters
  nativeFrom: string; // SQL datetime literal: later of period start and the native boundary
  nativeCovers: "full" | "partial" | "none"; // how much of the period is after the boundary
  nativeDays: number;
  sessionCur: string; // sessions-table filter for the native window
};

export function windowFor(days: number, includeInternal: boolean, extra = ""): Window {
  const now = Date.now();
  const startMs = now - days * 86400000;
  const from = Math.max(startMs, boundaryMs);
  const nativeDays = Math.max(0, (now - from) / 86400000);
  return {
    days,
    cur: `timestamp >= now() - interval ${days} day`,
    prev: `timestamp < now() - interval ${days} day`,
    span: `timestamp >= now() - interval ${days * 2} day`,
    real: (includeInternal ? REAL : REAL + NOT_INTERNAL) + extra,
    nativeFrom: `toDateTime('${toSql(from)}', 'UTC')`,
    nativeCovers: now < boundaryMs ? "none" : startMs >= boundaryMs ? "full" : "partial",
    nativeDays,
    sessionCur: `$start_timestamp >= toDateTime('${toSql(from)}', 'UTC') and $pageview_count > 0`,
  };
}

/** $device_type arrives as "Mobile" or "Desktop" from the SDK and "phone", "desktop" or "tablet" from the footer. One vocabulary. */
export const DEV = "multiIf(lower(toString(properties.$device_type)) in ('mobile', 'phone'), 'mobile', lower(toString(properties.$device_type)) = 'desktop', 'desktop', lower(toString(properties.$device_type)) = 'tablet', 'tablet', 'unknown')";

/** SQL for "event is one of these, optionally with a property value". "*" means any event. */
export function eventCond(events: string[], where?: { prop: string; value: string }, excludeOwn = false): string {
  const safe = (v: string) => v.replace(/[^A-Za-z0-9_.%\-]/g, "");
  const base = events.includes("*") ? "1 = 1" : `event in ${inList(events)}`;
  const w = where ? ` and toString(properties.${safe(where.prop)}) ${where.value.includes("%") ? "like" : "="} '${safe(where.value)}'` : "";
  return `(${base}${w}${excludeOwn ? " and coalesce(toString(properties.own_link), '') != 'true'" : ""})`;
}

export const DAY = "toDate(toTimeZone(timestamp, 'America/New_York'))";

// ---- Small Canon (Supabase) ---------------------------------------------------------------------------------------
// Its poster and shelf events live in the shelf-life Supabase project. We call its password-protected, read-only
// `stats` function from the server. Needs SMALLCANON_STATS_URL and SMALLCANON_STATS_PASSWORD (both server-side).
export type ExternalResult = { configured: false } | { configured: true; ok: boolean; data?: unknown; error?: string };

async function callSmallCanon(mode: "overview" | "site", site: string, days: number, includeInternal: boolean): Promise<unknown> {
  const res = await fetch(process.env.SMALLCANON_STATS_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.SMALLCANON_STATS_PASSWORD, mode, site, days, include_test: includeInternal }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Small Canon stats ${res.status}`);
  return res.json();
}

/** Small Canon (and its earlier incarnation, Shelf Life, from 18 Oct 2026) from the read-only Supabase function.
 *  `data` is this range for Small Canon; `history` is all time for both site names so the chart can show the full record. */
export async function smallCanon(mode: "overview" | "site", days: number, includeInternal: boolean): Promise<ExternalResult> {
  if (!process.env.SMALLCANON_STATS_URL || !process.env.SMALLCANON_STATS_PASSWORD) return { configured: false };
  try {
    const d = [1, 7, 30, 90].includes(days) ? days : 30;
    if (mode === "overview") return { configured: true, ok: true, data: await callSmallCanon("overview", "smallcanon", d, includeInternal) };
    const [now, hist, legacy] = await Promise.all([
      callSmallCanon("site", "smallcanon", d, includeInternal),
      callSmallCanon("site", "smallcanon", 0, includeInternal),
      callSmallCanon("site", "shelflife", 0, includeInternal).catch(() => null),
    ]);
    return { configured: true, ok: true, data: { ...(now as object), history: { smallcanon: hist, shelflife: legacy } } };
  } catch (e) {
    return { configured: true, ok: false, error: String((e as Error).message) };
  }
}

// ---- Referrer classes ----------------------------------------------------------------------------------------------
const SEARCH = ["google.", "bing.", "duckduckgo.", "yahoo.", "ecosia.", "brave.", "kagi.", "baidu.", "yandex.", "startpage."];
const SOCIAL = ["facebook.", "fb.com", "instagram.", "t.co", "twitter.", "x.com", "reddit.", "linkedin.", "lnkd.in", "threads.", "bsky.", "youtube.", "pinterest.", "tiktok.", "whatsapp.", "substack.", "news.ycombinator"];
const OWN = ["minorworks.co", "playballpark.app", "playvenny.app"];
export function classify(domain: string): "Direct" | "Our other sites" | "Search" | "Social" | "Other sites" {
  const d = domain.toLowerCase();
  if (!d || d === "$direct") return "Direct";
  if (OWN.some((o) => d === o || d.endsWith("." + o))) return "Our other sites";
  if (SEARCH.some((x) => d.includes(x))) return "Search";
  if (SOCIAL.some((x) => d.includes(x))) return "Social";
  return "Other sites";
}

