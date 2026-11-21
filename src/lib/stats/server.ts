import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
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

/** Returns a response when the caller must stop (not configured or wrong passphrase), otherwise null. */
export async function gate(passphrase: unknown): Promise<NextResponse | null> {
  const missing = ["STATS_PASSPHRASE", "POSTHOG_PERSONAL_API_KEY"].filter((k) => !process.env[k]);
  if (missing.length) return NextResponse.json({ error: "not_configured", missing }, { status: 503, headers: JSON_HEADERS });
  if (!passphraseOk(String(passphrase || ""))) {
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

export const DAY = "toDate(toTimeZone(timestamp, 'America/New_York'))";

// ---- Small Canon (Supabase) ---------------------------------------------------------------------------------------
// Its poster and shelf events live in the shelf-life Supabase project. We call its password-protected, read-only
// `stats` function from the server. Needs SMALLCANON_STATS_URL and SMALLCANON_STATS_PASSWORD (both server-side).
export type ExternalResult = { configured: false } | { configured: true; ok: boolean; data?: unknown; error?: string };

export async function smallCanon(mode: "overview" | "site", days: number, includeInternal: boolean): Promise<ExternalResult> {
  const url = process.env.SMALLCANON_STATS_URL;
  const password = process.env.SMALLCANON_STATS_PASSWORD;
  if (!url || !password) return { configured: false };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, mode, site: "smallcanon", days: [1, 7, 30, 90].includes(days) ? days : 30, include_test: includeInternal }),
      cache: "no-store",
    });
    if (!res.ok) return { configured: true, ok: false, error: `Small Canon stats ${res.status}` };
    return { configured: true, ok: true, data: await res.json() };
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

