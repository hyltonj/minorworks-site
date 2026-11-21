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
2. Minted when the share button is pressed, before the sheet opens, and reused if the same press retries.
3. Appended to the share URL as `?sid=<id>` next to the existing `?s=<type>`.
4. The recipient page reads `sid`, records it on the arrival event, stores it as a session-level property (`arrived_via_sid`) so every later event in that session can be segmented, then removes it from the address bar with `history.replaceState` so it does not leak into GA4 page URLs, referrers or screenshots.
5. The sender’s browser remembers the sids it minted (localStorage `mw:sids`, last 50) so it can mark `own_link = true` locally. No server lookup.
6. If the recipient later shares, their new share carries `parent_sid = arrived_via_sid`. That gives a chain of share actions, never a chain of people.

## 3. Event map

| Event | Properties | Stage |
|---|---|---|
| `share_opportunity` | `artifact_type`, `artifact_id`, `placement` | 1 Opportunity presented |
| `share_initiated` | `sid`, `artifact_type`, `artifact_id`, `share_type`, `parent_sid?` | 2 Button clicked |
| `share_sheet_opened` | `sid` | 3 Interface opened (native sheet: fired when `navigator.share()` is called; the browser cannot confirm it was shown) |
| `share_method_selected` | `sid`, `method` | 4 Method selected |
| `share_completed` | `sid`, `method` (`copy`, `native`, `download`) | 5 and 6 Confirmed action |
| `share_dismissed` | `sid` | native sheet rejected with AbortError |
| `shared_link_opened` | `sid`, `artifact_id`, `own_link` | 7 Attributable visit |
| `share_recipient_engaged` | `sid` (from the session property), `kind` (`first_guess`, `first_pick`, `first_shelf`) | 8 Recipient engaged |
| existing product events (`bp_set_completed`, `shelf_started`, `puzzle_solved`) | session property `arrived_via_sid` | 9 Recipient played, created or finished |

For Small Canon the same events go into `shelf_events` (new nullable columns `sid` and `artifact_id`, or inside `props`). No change to the read-only stats function except adding `sid` counts.

## 4. What this can and cannot say

Can: share → visits → engagement → completion → re-share, per share type, per product, per device; median recipients per share; share rate by placement.

Cannot, by design: who received the link, through which app, whether a message was read, or whether two visits are the same recipient. A visit is attributed to an *action*, not a person.

## 5. Privacy review

- The id is random and rotates per press; it identifies no one and no device.
- It is not set as a cookie and not sent to third parties: removed from the URL on arrival, and GA4 never sees it.
- Recipients’ events carry the sid only for the session, as a property.
- Retention: keep in line with the existing PostHog retention; nothing new to purge.
- No recipient or private-communication tracking is added. The change fits the existing privacy page wording (“anonymous, no cross-site tracking”); the privacy text should add one sentence about share links.

## 6. Implementation order

1. Ballpark: the largest share volume and richest existing events. Add `sid` plus the sheet/dismiss events.
2. Small Canon: poster links get `?s=poster&sid=` and the visit event records it.
3. Venny: wire the existing `share_id` / `gift_id` to the same `sid` and recipient session property.
4. Dashboard: no change needed beyond reading `sid` counts; lifecycle rows light up from the event names.

Each app is its own small PR, reviewed separately from the dashboard.

## 7. Decisions needed

- OK with 10-character random ids and the `replaceState` removal?
- Should the sender’s remembered sids live in localStorage (proposed) or be skipped, accepting that a sender opening their own link counts as a recipient?
- Wording for one added sentence on the privacy page.
