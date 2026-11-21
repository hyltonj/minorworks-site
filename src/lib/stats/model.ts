// Studio Stats data model: one place for site ids, event mappings, metric definitions and the history boundary.
// Safe to import from the browser (no secrets here). Site ids match public/manifest.json (`site` on every event).

/** Midnight Boston on this date: PostHog `$pageview`/`$pageleave` and valid (UUID v7) session ids start here.
 *  Earlier events only have our own `mw_*` events and unreadable v4 session ids, so session metrics are NOT comparable before it. */
export const NATIVE_BOUNDARY = "2026-11-21";
/** The PostHog project holds nothing before this day (first event 2026-11-18 18:53 UTC). Earlier history lives in GA4 (not connected yet) and Supabase (Small Canon). */
export const POSTHOG_HISTORY_START = "2026-11-18";

export type SiteKind = "game" | "tool" | "product" | "studio";

/** Product events a site sends, so the dashboard never guesses. Event names are PostHog event names. */
/** `base` is the index of the step whose sessions are the valid denominator for this step's "of cohort" percentage (default 0, the arrival). */
export type JourneyStep = { label: string; events: string[]; where?: { prop: string; value: string }; base?: number };
export type ShareStage = {
  n: number;
  label: string;
  kind: "opportunity" | "intent" | "confirmed" | "attributable" | "engagement";
  /** measured: an event exists and is counted here. partial: an event exists but does not fully answer the stage. not_observable: nothing can be measured today. */
  status: "measured" | "partial" | "not_observable";
  events?: string[];
  where?: { prop: string; value: string };
  /** Ignore visits from a link this same browser shared (own_link = true). */
  excludeOwn?: boolean;
  note: string;
  /** Exactly what instrumentation would make this stage measurable (shown for partial and not observable stages). */
  needs?: string;
};

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
  /** Ordered, session-level journey. Only steps whose events are reliably ordered belong here. */
  journey?: JourneyStep[];
  journeyNote?: string;
  /** Share lifecycle, stage by stage. */
  shareLifecycle?: ShareStage[];
  /** Events that mark someone arriving through a shared link, and share presses, for the "shared a link after arriving" measure. */
  arrivalEvents?: string[];
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
  /** UTC time from which the SDK sends native pageviews (deploy of the fix). Used to judge native coverage. */
  nativeFixedAt?: string;
  /** Product data that lives outside PostHog. */
  external?: "supabase-smallcanon";
  product?: ProductEvents;
  /** Known issue to show in Instrumentation Health. */
  note?: string;
};

export const SITES: SiteDef[] = [
  {
    id: "ballpark", name: "Ballpark", host: "playballpark.app", kind: "game", footer: true, sdk: true, nativeFixedAt: "2026-11-21 14:00:00",
    product: {
      started: ["bp_set_started"],
      finished: ["bp_set_completed"],
      shareTap: ["bp_share_pressed", "share_pressed"],
      shareDone: ["share_completed", "share_sent"],
      fromShare: ["shared_link_opened", "daily_puzzle_started_from_share", "started_from_share"],
      conversion: [{ label: "Footer card clicks", event: "footer_click" }],
      journey: [
        { label: "Arrival (any event)", events: ["*"] },
        ...[1, 2, 3, 4, 5].map((i) => ({ label: `Question ${i} answered`, events: ["bp_guess_submitted"], where: { prop: "question_index", value: String(i) }, base: i === 1 ? 0 : 1 })),
        { label: "Game completed", events: ["bp_set_completed"], base: 1 },
        { label: "Share initiated", events: ["share_pressed", "bp_share_pressed"], base: 6 },
        { label: "Share confirmed", events: ["share_completed"], base: 6 },
      ],
      journeyNote: "Sessions are SDK sessions (the game’s own PostHog session). Steps are matched in order within a 6-hour window, the same way PostHog funnels do. Verified against an independent walk of the raw events. “Started a set” is not a step: in about a third of sessions the first guess is recorded before bp_set_started, so its timing cannot be trusted. Question-viewed events also fire out of order (a variant with questions_total 0), so guesses are used instead.",
      arrivalEvents: ["shared_link_opened", "started_from_share"],
      shareLifecycle: [
        { n: 1, label: "Share opportunity presented", kind: "opportunity", status: "measured", events: ["share_card_viewed"], note: "Fact-card preview opens and the post-set share button showing." },
        { n: 2, label: "Share button clicked", kind: "intent", status: "measured", events: ["share_pressed", "bp_share_pressed"], note: "Intent. bp_share_pressed is the older event that fires with share_pressed." },
        { n: 3, label: "Sharing interface opened", kind: "intent", status: "not_observable", note: "The browser does not report that the native sheet opened; no event exists.", needs: "Emit bp_share_sheet_opened when navigator.share() is called; the browser still cannot report that the sheet was shown." },
        { n: 4, label: "Share method selected", kind: "intent", status: "partial", events: ["share_pressed"], note: "share_pressed carries a method property, but it is the method requested, not proof of a send.", needs: "Send share_method_selected only when the user picks a target; today the method is the one requested." },
        { n: 5, label: "Link copied", kind: "confirmed", status: "measured", events: ["share_completed"], where: { prop: "method", value: "copy" }, note: "Confirmed: the clipboard write succeeded. Not proof anyone pasted it." },
        { n: 6, label: "Native share completed", kind: "confirmed", status: "partial", events: ["share_completed"], where: { prop: "method", value: "native" }, note: "Confirmed by the browser when it reports success. Dismissed shares are not observable.", needs: "Emit bp_share_dismissed when navigator.share() rejects with AbortError so dismissals are visible." },
        { n: 7, label: "Shared link opened", kind: "attributable", status: "measured", events: ["shared_link_opened"], excludeOwn: true, note: "Attributable to a share type (?s=round, challenge, fact, index), not to one sender. Own-browser opens excluded.", needs: "Add an opaque per-share id (sid) to the link and to shared_link_opened, so a visit ties to one share action rather than to a share type." },
        { n: 8, label: "Recipient engaged", kind: "engagement", status: "measured", events: ["started_from_share"], note: "Recipient made a first guess." },
        { n: 9, label: "Recipient completed a set", kind: "engagement", status: "measured", events: ["completed_from_share"], note: "Recipient finished a set." },
        { n: 10, label: "Recipient generated another share", kind: "engagement", status: "partial", note: "People who arrived through a share and later pressed share. Same browser only.", needs: "Carry the arriving sid onto the recipient’s own share events (parent_sid) so a chain of shares can be followed." },
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
    id: "venny", name: "Venny", host: "playvenny.app", kind: "game", footer: true, sdk: true, nativeFixedAt: "2026-11-21 14:00:00",
    product: {
      started: ["puzzle_started"], finished: ["puzzle_solved"],
      counters: [{ label: "Clues revealed", event: "clue_revealed" }, { label: "Puzzles abandoned", event: "puzzle_abandoned" }],
      journey: [
        { label: "Arrival (any event)", events: ["*"] },
        { label: "Puzzle started", events: ["puzzle_started"] },
        { label: "Puzzle solved", events: ["puzzle_solved"] },
        { label: "Share sent", events: ["share_sent"] },
      ],
      journeyNote: "Abandon and solve are alternatives, so abandonment is shown as a counter, not a step.",
      arrivalEvents: ["gift_venny_opened"],
      shareLifecycle: [
        { n: 1, label: "Share opportunity presented", kind: "opportunity", status: "not_observable", note: "No event when the share prompt shows." },
        { n: 2, label: "Share button clicked", kind: "intent", status: "not_observable", note: "Only share_sent exists, which fires after a send." },
        { n: 3, label: "Sharing interface opened", kind: "intent", status: "not_observable", note: "Not observable." },
        { n: 4, label: "Share method selected", kind: "intent", status: "partial", events: ["share_sent"], note: "share_channel and share_method properties exist on share_sent." },
        { n: 5, label: "Link copied / share sent", kind: "confirmed", status: "partial", events: ["share_sent"], note: "Instrumented in the app; zero events in PostHog so far." },
        { n: 6, label: "Native share completed", kind: "confirmed", status: "partial", events: ["share_sent"], note: "Same event; dismissals not observable." },
        { n: 7, label: "Shared link / gift opened", kind: "attributable", status: "partial", events: ["gift_venny_opened"], note: "Gift links carry share_id / gift_id properties in the app; zero events so far." },
        { n: 8, label: "Recipient engaged", kind: "engagement", status: "partial", events: ["puzzle_started"], where: { prop: "entry_source", value: "share_%" }, note: "entry_source begins with share_ for share arrivals." },
        { n: 9, label: "Recipient solved", kind: "engagement", status: "partial", events: ["gift_venny_solved"], note: "Gift puzzles only." },
        { n: 10, label: "Recipient generated another share", kind: "engagement", status: "not_observable", note: "Needs share_id on both the opened and the sent event." },
      ],
    },
    note: "Share events are instrumented in the app but none have reached PostHog yet.",
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
    product: {
      // Event names here are Supabase event names (shelf_events.event), counted by the external adapter, not PostHog.
      shareLifecycle: [
        { n: 1, label: "Share opportunity presented", kind: "opportunity", status: "measured", events: ["poster_preview"], note: "Poster preview opened (Shelf Life period; not sent by Small Canon yet)." },
        { n: 2, label: "Share button clicked", kind: "intent", status: "measured", events: ["share"], note: "Intent." },
        { n: 3, label: "Sharing interface opened", kind: "intent", status: "not_observable", note: "No event." },
        { n: 4, label: "Share method selected", kind: "intent", status: "not_observable", note: "The share event carries no method." },
        { n: 5, label: "Link copied", kind: "confirmed", status: "measured", events: ["link_copy", "share_link_copied"], note: "Confirmed clipboard write." },
        { n: 6, label: "Poster downloaded", kind: "confirmed", status: "partial", events: ["poster_download"], note: "A download is confirmed by the browser but is not a share." },
        { n: 7, label: "Shared poster opened", kind: "attributable", status: "not_observable", note: "Poster links carry no share marker, so a visit cannot be tied to a share. Needs ?s=<type> (and ideally an opaque id)." },
        { n: 8, label: "Recipient engaged", kind: "engagement", status: "not_observable", note: "visit and search events exist but carry no share marker, so they cannot be tied to a shared poster.", needs: "Poster links need a share marker (?s=poster and an opaque sid); the visit event then records it." },
        { n: 9, label: "Recipient created their own", kind: "engagement", status: "partial", events: ["shelf_started", "book_added"], note: "Counts all creators, not only those who arrived through a share." },
        { n: 10, label: "Recipient generated another share", kind: "engagement", status: "not_observable", note: "Needs an opaque share id on both the opened and the sent event." },
      ],
    },
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
