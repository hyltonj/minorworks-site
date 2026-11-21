// Studio Stats data model: one place for site ids, event mappings, metric definitions and the history boundary.
// Safe to import from the browser (no secrets here). Site ids match public/manifest.json (`site` on every event).

/** Midnight Boston on this date: PostHog `$pageview`/`$pageleave` and valid (UUID v7) session ids start here.
 *  Earlier events only have our own `mw_*` events and unreadable v4 session ids, so session metrics are NOT comparable before it. */
export const NATIVE_BOUNDARY = "2026-11-21";
/** The PostHog project holds nothing before this day (first event 2026-11-18 18:53 UTC). Earlier history lives in GA4 (not connected yet) and Supabase (Small Canon). */
export const POSTHOG_HISTORY_START = "2026-11-18";

export type SiteKind = "game" | "tool" | "product" | "studio";

/** Product events a site sends, so the dashboard never guesses. Event names are PostHog event names. */
export type ProductEvents = {
  started?: string[]; // a play or a creation began
  finished?: string[]; // a play or creation completed
  shareTap?: string[]; // share button pressed (not a confirmed send)
  shareDone?: string[]; // share confirmed by the browser or OS
  fromShare?: string[]; // arrived through a shared link
  conversion?: { label: string; event: string }[];
  /** Ordered usage funnel; each step is people who sent any of the events. */
  funnel?: { label: string; events: string[] }[];
  /** Extra counters shown in the usage section. */
  counters?: { label: string; event: string }[];
};

export type SiteDef = {
  id: string; // `site` property on events
  name: string;
  host: string; // production hostname
  kind: SiteKind;
  /** The shared footer is installed (verified 21 Nov 2026). */
  footer: boolean;
  /** Runs posthog-js itself (pageviews come from the SDK, not the footer). */
  sdk?: boolean;
  /** Product data that lives outside PostHog. */
  external?: "supabase-smallcanon";
  product?: ProductEvents;
  /** Known issue to show in Instrumentation Health. */
  note?: string;
};

export const SITES: SiteDef[] = [
  {
    id: "ballpark", name: "Ballpark", host: "playballpark.app", kind: "game", footer: true, sdk: true,
    product: {
      started: ["bp_set_started"],
      finished: ["bp_set_completed"],
      shareTap: ["bp_share_pressed", "share_pressed"],
      shareDone: ["share_completed", "share_sent"],
      fromShare: ["shared_link_opened", "daily_puzzle_started_from_share", "started_from_share"],
      conversion: [{ label: "Footer card clicks", event: "footer_click" }],
      funnel: [
        { label: "Opened a session", events: ["bp_session_started"] },
        { label: "Saw a question", events: ["bp_question_viewed"] },
        { label: "Submitted a guess", events: ["bp_guess_submitted"] },
        { label: "Started a set", events: ["bp_set_started"] },
        { label: "Finished a set", events: ["bp_set_completed"] },
      ],
      counters: [
        { label: "Questions viewed", event: "bp_question_viewed" },
        { label: "Guesses submitted", event: "bp_guess_submitted" },
        { label: "Answers revealed", event: "bp_answer_revealed" },
        { label: "Order puzzles started", event: "bp_order_started" },
        { label: "Share cards viewed", event: "share_card_viewed" },
        { label: "Did-you-know cards shared", event: "did_you_know_share" },
      ],
    },
  },
  {
    id: "venny", name: "Venny", host: "playvenny.app", kind: "game", footer: true, sdk: true,
    product: {
      started: ["puzzle_started"], finished: ["puzzle_solved"],
      counters: [{ label: "Clues revealed", event: "clue_revealed" }, { label: "Puzzles abandoned", event: "puzzle_abandoned" }],
    },
    note: "No share events yet.",
  },
  { id: "rankandfile", name: "Rank and File", host: "rankandfile.minorworks.co", kind: "game", footer: true, note: "No product events yet (plays and finishes are not tracked)." },
  { id: "unitedstats", name: "United Stats of America", host: "unitedstats.minorworks.co", kind: "game", footer: true, note: "No product events yet." },
  { id: "threestars", name: "Three Stars", host: "threestars.minorworks.co", kind: "game", footer: true, note: "No product events yet." },
  { id: "throughline", name: "Throughline", host: "throughline.minorworks.co", kind: "game", footer: true, note: "No product events yet." },
  { id: "unsaid", name: "Unsaid", host: "unsaid.minorworks.co", kind: "game", footer: true, note: "No product events yet." },
  { id: "outlier", name: "Outlier", host: "outlier.minorworks.co", kind: "game", footer: true, note: "Content-Security-Policy blocks PostHog: no events reach PostHog." },
  { id: "percapita", name: "Per Capita", host: "percapita.minorworks.co", kind: "game", footer: true, note: "Content-Security-Policy blocks PostHog: no events reach PostHog." },
  {
    id: "smallcanon", name: "Small Canon", host: "smallcanon.minorworks.co", kind: "product", footer: true, external: "supabase-smallcanon",
    note: "Poster, shelf and share events live in its own Supabase database, not PostHog.",
  },
  { id: "omnium", name: "Ex Libris Omnium", host: "omnium.minorworks.co", kind: "product", footer: true, note: "Reservation events live in the Small Canon Supabase database (one test event so far)." },
  {
    id: "margin", name: "Margin", host: "margin.minorworks.co", kind: "tool", footer: true,
    product: { conversion: [{ label: "Chrome Web Store clicks", event: "margin_chrome_store_click" }] },
  },
  { id: "qrtipsheet", name: "QR Tipsheet", host: "qrtipsheet.minorworks.co", kind: "tool", footer: true },
  { id: "dappled", name: "Dappled", host: "dappled.minorworks.co", kind: "tool", footer: true },
  { id: "pocketalmanac", name: "Pocket Almanac", host: "almanac.minorworks.co", kind: "studio", footer: true },
  { id: "outofthebox", name: "Out of the Box", host: "outofthebox.minorworks.co", kind: "product", footer: true, note: "Not in the footer manifest yet." },
  { id: "minorworks.co", name: "Minor Works (main site)", host: "minorworks.co", kind: "studio", footer: true,
    product: { conversion: [{ label: "Contact clicks", event: "contact_click" }, { label: "Contact form submits", event: "contact_submit" }] } },
  { id: "winthropcipher", name: "Winthrop Cipher", host: "winthropcipher.minorworks.co", kind: "product", footer: false, note: "The footer is not installed." },
];

export const siteById = (id: string) => SITES.find((s) => s.id === id);
export const siteName = (id: string) => siteById(id)?.name || id;
export const isSiteId = (id: string) => /^[a-z0-9.]{2,40}$/.test(id) && !!siteById(id);

/** Plain-language metric definitions, shown in the dashboard so numbers are never ambiguous. */
export const DEFINITIONS: Record<string, string> = {
  people: "Distinct anonymous browser ids (mw_xxxx) seen in the period. One person on two devices counts twice; Safari clears ids after 7 days of no visit.",
  pageViews: "Events counted, not people: our own mw_pageview event, sent by the footer on every page load and route change (all dates). PostHog's native $pageview is used only for sessions, bounce and entry pages, and only from 21 Nov 2026.",
  sessions: "Visits as PostHog counts them: a UUID v7 session id from the footer or the game SDK, ending after 30 quiet minutes. Valid only from 21 Nov 2026.",
  bounce: "Sessions with one page view and under 10 seconds of activity (PostHog definition), native sessions only.",
  started: "Events counted: each time a play or creation began (see each site's event map). A person can start many times; the people count under it is distinct people.",
  finished: "Events counted: each completion. Finish rate (events) = finishes divided by starts. The usage funnel shows the people-based version (people who finished divided by people who started), which is higher.",
  shareTap: "People who pressed a share button. Browsers rarely report whether a share finished, so this is intent.",
  returning: "People first seen before the period who were active in it. Limited by the 18 Nov 2026 start of PostHog history.",
};

export type Pair = { now: number; before: number };
