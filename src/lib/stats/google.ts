import "server-only";
import { createSign } from "node:crypto";

// Read-only Google reporting. Service account must be individually granted GA4 Viewer
// and Search Console Restricted access; a GCP IAM role alone does not grant either.
export type DayPoint = { date: string; users: number; sessions: number; views: number; clicks: number; impressions: number };
export type GoogleSite = {
  id: string; name: string; ga4Property: string | null; gscProperty: string | null;
  ga4: { status: "connected" | "missing" | "error"; message?: string; users?: number; sessions?: number; views?: number; daily?: DayPoint[] };
  gsc: { status: "connected" | "missing" | "error"; message?: string; clicks?: number; impressions?: number; ctr?: number; position?: number; daily?: DayPoint[]; queries?: { term: string; clicks: number; impressions: number; ctr: number; position: number }[]; pages?: { url: string; clicks: number; impressions: number }[] };
};
type Credential = { client_email: string; private_key: string; token_uri?: string };
type Token = { value: string; expiry: number };
let token: Token | null = null;
const reportCache = new Map<string, { at: number; sites: GoogleSite[] }>();
const DEFAULT_GA4: Record<string, string> = { minorworks: "562270044", ballpark: "526597669", venny: "526639251" };
const DEFAULT_GSC: Record<string, string> = { minorworks: "sc-domain:minorworks.co", ballpark: "sc-domain:playballpark.app", venny: "sc-domain:playvenny.app" };
const SITE_NAMES: Record<string, string> = { minorworks: "Minor Works", ballpark: "Ballpark", venny: "Venny" };

function mapping(key: string, defaults: Record<string, string>): Record<string, string> {
  const raw = process.env[key];
  if (!raw) return defaults;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw Error("not an object");
    return { ...defaults, ...Object.fromEntries(Object.entries(parsed).filter(([k,v]) => /^[a-z0-9_.-]+$/.test(k) && typeof v === "string").map(([k,v]) => [k, v as string])) };
  } catch { throw Error(`Invalid ${key} JSON`); }
}
function credentials(): Credential | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let c: Credential;
  try { c = JSON.parse(raw) as Credential; } catch { throw Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON"); }
  if (!c.client_email || !c.private_key) throw Error("Google credential is incomplete");
  return c;
}
function b64url(data: string): string { return Buffer.from(data).toString("base64url"); }
async function accessToken(c: Credential): Promise<string> {
  if (token && token.expiry > Date.now() + 60000) return token.value;
  const now = Math.floor(Date.now()/1000);
  const jwtHeader = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const jwtBody = b64url(JSON.stringify({
    iss: c.client_email, aud: c.token_uri || "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
    iat: now, exp: now + 3600,
  }));
  const unsigned = `${jwtHeader}.${jwtBody}`;
  const signer = createSign("RSA-SHA256"); signer.update(unsigned); signer.end();
  const assertion = `${unsigned}.${signer.sign(c.private_key).toString("base64url")}`;
  const res = await fetch(c.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }), cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw Error(`Google OAuth HTTP ${res.status}`);
  const j = await res.json() as { access_token?: string; expires_in?: number };
  if (!j.access_token) throw Error("Google OAuth returned no access token");
  token = { value: j.access_token, expiry: Date.now() + Math.min(3600,j.expires_in || 3600)*1000 };
  return token.value;
}
async function googlePost<T>(url: string, bearer: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST", headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
    body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    // Never put OAuth details or response bodies (which may contain identifiers) in client-visible errors.
    throw Error(`Google reporting HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
const val = (v?: string) => Number(v || 0) || 0;
type GaRow = { dimensionValues?: {value?: string}[]; metricValues?: {value?: string}[] };
type GaResp = { rows?: GaRow[] };
type ScRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
type ScResp = { rows?: ScRow[] };
const bostonDate = (d: Date) => {
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
  const get=(type:string)=>parts.find(p=>p.type===type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};
function dates(days: number) {
  const end = new Date(Date.now() - 86400000); // GA4 typically lags by a day
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  return { startDate: bostonDate(start), endDate: bostonDate(end) };
}
async function ga4(id: string, bearer: string, days: number): Promise<GoogleSite["ga4"]> {
  const period = dates(days);
  const endpoint=`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(id)}:runReport`;
  const metrics=[{name:"activeUsers"},{name:"sessions"},{name:"screenPageViews"}];
  // A separate undimensioned report is essential: summing daily active users
  // overcounts people who visited more than one day in the requested period.
  const [report,total] = await Promise.all([
    googlePost<GaResp>(endpoint,bearer,{
      dateRanges:[period],dimensions:[{name:"date"}],metrics,
      limit:"500",orderBys:[{dimension:{dimensionName:"date"}}],
    }),
    googlePost<GaResp>(endpoint,bearer,{dateRanges:[period],metrics}),
  ]);
  const daily = (report.rows || []).map(r => {
    const raw = r.dimensionValues?.[0]?.value || "";
    const date = raw.length===8 ? `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}` : raw;
    return { date, users:val(r.metricValues?.[0]?.value), sessions:val(r.metricValues?.[1]?.value), views:val(r.metricValues?.[2]?.value), clicks:0, impressions:0 };
  });
  return { status:"connected", users:val(total.rows?.[0]?.metricValues?.[0]?.value), sessions:val(total.rows?.[0]?.metricValues?.[1]?.value), views:val(total.rows?.[0]?.metricValues?.[2]?.value), daily };
}
async function searchConsole(property: string, bearer: string, days: number): Promise<GoogleSite["gsc"]> {
  const {startDate,endDate} = dates(days);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`;
  const [d,q,p] = await Promise.all([
    googlePost<ScResp>(url,bearer,{startDate,endDate,dimensions:["date"],rowLimit:500,dataState:"final"}),
    googlePost<ScResp>(url,bearer,{startDate,endDate,dimensions:["query"],rowLimit:30,dataState:"final"}),
    googlePost<ScResp>(url,bearer,{startDate,endDate,dimensions:["page"],rowLimit:25,dataState:"final"}),
  ]);
  const daily = (d.rows || []).map(r=>({date:r.keys?.[0]||"",clicks:r.clicks||0,impressions:r.impressions||0,users:0,sessions:0,views:0}));
  const clicks = daily.reduce((a,r)=>a+r.clicks,0), impressions=daily.reduce((a,r)=>a+r.impressions,0);
  const queries=(q.rows||[]).map(r=>({term:r.keys?.[0]||"",clicks:r.clicks||0,impressions:r.impressions||0,ctr:r.ctr||0,position:r.position||0}));
  const pages=(p.rows||[]).map(r=>({url:r.keys?.[0]||"",clicks:r.clicks||0,impressions:r.impressions||0}));
  const sumPositions=(d.rows||[]).reduce((a,r)=>a+(r.position||0)*(r.impressions||0),0);
  return {status:"connected", clicks, impressions, ctr:impressions?clicks/impressions:0, position:impressions?sumPositions/impressions:0, daily, queries, pages};
}
export async function googleReports(days: number): Promise<{ configured: boolean; generatedAt: string; sites: GoogleSite[]; message?: string }> {
  const c=credentials();
  if (!c) return {configured:false,generatedAt:new Date().toISOString(),sites:[],message:"Server-side Google credentials not configured"};
  const ga=mapping("GA4_PROPERTIES",DEFAULT_GA4), sc=mapping("GSC_SITES",DEFAULT_GSC);
  const cacheKey=JSON.stringify({days,ga,sc});
  const hit=reportCache.get(cacheKey);
  if(hit && Date.now()-hit.at<15*60000) return {configured:true,generatedAt:new Date(hit.at).toISOString(),sites:hit.sites};
  const bearer=await accessToken(c);
  const ids=[...new Set([...Object.keys(ga),...Object.keys(sc)])];
  const sites:GoogleSite[]=await Promise.all(ids.map(async id=>{
    const site:GoogleSite={id,name:SITE_NAMES[id]||id,ga4Property:ga[id]||null,gscProperty:sc[id]||null,ga4:{status:"missing"},gsc:{status:"missing"}};
    const [a,b]=await Promise.all([
      ga[id] ? ga4(ga[id],bearer,days).catch((e:Error)=>({status:"error" as const,message:e.message})) : Promise.resolve(site.ga4),
      sc[id] ? searchConsole(sc[id],bearer,days).catch((e:Error)=>({status:"error" as const,message:e.message})) : Promise.resolve(site.gsc),
    ]);
    site.ga4=a;site.gsc=b;return site;
  }));
  reportCache.set(cacheKey,{at:Date.now(),sites});
  return {configured:true,generatedAt:new Date().toISOString(),sites};
}
