# Share attribution IDs: definitions and proposal

Status: proposal only. No app code changes. Separate from the Studio Stats dashboard PR (#19), which already shows share stages as measured, partial or not observable and will fill in as these events arrive.

## 1. Two different kinds of id

| | **Artifact id** | **Share-action id (`sid`)** |
|---|---|---|
| Identifies | A thing that exists before and after any sharing: a Ballpark daily set (`day_id` + `set_index`), a Venny puzzle, a Small Canon shelf (`shelves.code`), a gift | One act of sharing: one press of a share button that produced one link |
| Minted | By the product when the thing is created | By the browser at the moment of the share press |
| Lifetime | Permanent | Meaningful for the life of that link; rotates on every new press |
| Cardinality | One artifact, many share actions | One share action, many possible visits (a link pasted in a group) |
| Answers | Which puzzle or shelf is shared most? Which poster gets remixed? | Did this share bring anyone? Did they play, create, finish, share again? |
| Personal? | No | No. Random, not derived from any visitor, device or content |

Keep them separate in events: `artifact_id` and `artifact_type` describe *what* was shared; `sid` describes *which share*. A link carries both only when the artifact id is already public in the URL (it is for daily sets and shelf codes).

Small Canon already has artifact lineage: `shelves.parent` records which shelf a remix came from. That is **artifact ancestry**, not a share action. It stays as is and complements `sid`; it must not be reused as an attribution id because a remix can come from a link seen anywhere.

## 2. Share-action id rules

1. Format: 10 characters from a 32-character alphabet (50 bits), generated with `crypto.getRandomValues`. Not a hash of anything.
2. Minted when the share button is pressed, before the sheet opens, and reused if the same press retries. A sid describes a **share attempt/link**, not confirmed delivery; multiple opens of one sid are expected.
3. Appended to the share URL as `?sid=<id>` next to the existing `?s=<type>`.
4. On arrival, parse and validate `sid` **before any analytics SDK or GA4 pageview fires**, remove it from the address bar using `history.replaceState`, then record `shared_link_opened` with the validated sid only in the application's privacy-approved analytics. Add `arrived_via_sid` only to events in the **current session**; clear it at session expiry/new session. Test pre-init ordering, initial URLs, SPA routes, redirects and preview/OG requests. Removing a query parameter after SDK initialization is too late to guarantee it was not recorded.
5. **Do not persist a sender's historical share IDs in localStorage in v1.** To reduce accidental self-attribution, an in-memory/sessionStorage set for the current tab/session is optional. A sender opening their own link from a different browser or session can count as a recipient; document this known limitation. No server lookup or person matching.
6. If the recipient later shares **within the attributed session**, their new share carries `parent_sid = arrived_via_sid`. That gives a chain of share actions, never a chain of people. Do not follow a person across sessions or domains to reconstruct this chain.

## 3. Event map

| Event | Properties | Stage |
|---|---|---|
| `share_opportunity` | `artifact_type`, `artifact_id`, `placement` | 1 Opportunity presented |
| `share_initiated` | `sid`, `artifact_type`, `artifact_id`, `share_type`, `parent_sid?` | 2 Button clicked |
| `share_sheet_opened` | `sid` | 3 Interface opened (native sheet: fired when `navigator.share()` is called; the browser cannot confirm it was shown) |
| `share_method_selected` | `sid`, `method` | 4 Method selected |
| `share_completed` | `sid`, `method` (`copy`, `native`) | 5 and 6 Confirmed **browser action**, not delivery |\n| `share_export_completed` | `artifact_type`, `artifact_id`, `format` | Independent export/download (not a link send) |
| `share_dismissed` | `sid` | native sheet rejected with AbortError |
| `shared_link_opened` | `sid`, `artifact_id`, `own_link` | 7 Attributable visit |
| `share_recipient_engaged` | `sid` (from the session property), `kind` (`first_guess`, `first_pick`, `first_shelf`) | 8 Recipient engaged |
| existing product events (`bp_set_completed`, `shelf_started`, `puzzle_solved`) | session property `arrived_via_sid` | 9 Recipient played, created or finished |

For Small Canon the same events go into `shelf_events` (new nullable columns `sid` and `artifact_id`, or inside `props`). No change to the read-only stats function except adding `sid` counts.

## 4. What this can and cannot say

Can: share attempt/link → attributed visits → engagement → completion → re-share, per share type, per product, per device; visits per tracked share link; share rate by placement. **Do not label unique visits 'unique recipients'** unless the application can establish that within an explicitly scoped session model.

Cannot, by design: who received the link, through which app, whether a message was read, or whether two visits are the same recipient. A visit is attributed to an *action*, not a person.

## 5. Privacy review

- The id is random and rotates per press; it identifies no one and no device.
- It is not set as a cookie or sent to third-party analytics. The app must sanitize its initial URL **before** GA4/PostHog or other scripts can capture it. Verify this ordering in production; never claim that GA4 cannot see it purely because the app later removes it.
- Recipient events carry the sid only for the attributed session, as a property. No permanent identify/alias, long-lived super property, or cross-session visitor linkage.
- Retention: keep in line with the existing PostHog retention; nothing new to purge.
- No recipient or private-communication tracking is added. The change fits the existing privacy page wording (“anonymous, no cross-site tracking”); the privacy text should add one sentence about share links.

## 6. Implementation order

1. Ballpark: the largest share volume and richest existing events. Add `sid` plus the sheet/dismiss events.
2. Small Canon: poster links get `?s=poster&sid=` and the visit event records it.
3. Venny: wire the existing `share_id` / `gift_id` to the same `sid` and recipient session property.
4. Dashboard: no change needed beyond reading `sid` counts; lifecycle rows light up from the event names.

Each app is its own small PR, reviewed separately from the dashboard.

## 7. Decisions and acceptance criteria

**Provisional defaults for review:** 10-character cryptographically random ids and pre-analytics `replaceState` sanitization; no persistent sender-side sid history; privacy sentence above. Approve before modifying app code.

**Acceptance tests for the first application PR**

1. Initial page load of a share link emits no unsanitized sid in GA4 URLs, referrers or generic `$pageview` properties; the dedicated privacy-approved share event may include it.
2. Exactly one `share_initiated` event is emitted per actual press; retrying the same press reuses its sid. Consecutive presses create new sids.
3. A successful clipboard write or fulfilled native-share promise records a browser action, not a delivered/read message. Cancelled or unsupported native shares must not count as delivered.
4. Link opens, refreshes and forwards are classified consistently; count both total opens and distinct sessions, and do not imply distinct people from raw opens.
5. Share attribution is scoped to the landing session only and does not overwrite other attribution information. Subsequent sessions do not inherit `arrived_via_sid`.
6. Existing shared links, UTM parameters, `?s=` values, previews, direct loads and SPA navigation still work.
7. DNT, GPC, opt-out and consent paths do not capture share data when analytics is disallowed.
8. Provide before/after sample queries, a reversible flag or rollback plan, collision handling, and a privacy review before deployment.

**Rollout gate:** Finish the known SDK/footer native pageview/session validation before relying on session-level share conversion metrics.
