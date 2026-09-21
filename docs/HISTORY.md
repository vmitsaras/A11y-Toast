# TOAST-270 — bounded in-memory notification history

Status: Implemented in the TOAST-270 patch; targeted verification passed. Full integrated CI and manual assistive-technology acceptance are separate gates. Baseline: `353b27ea7c4fcc313875d0f7e94ed3c12c40291a`.

## Use

```ts
import { createToast } from 'a11y-toast';
import { createHistoryController } from 'a11y-toast/addons/history';

const root = document.querySelector('[data-a11y-toast]');
if (!(root instanceof HTMLElement)) throw new Error('Mount the toast host first.');
const toast = createToast(root);
const history = createHistoryController(toast, { maxEntries: 50 });

const id = toast.success('Your changes were saved.');
if (id) toast.dismiss(id);
const entries = history.getEntries(); // readonly show + dismiss records

history.clear();   // clears history, not active notifications
history.destroy(); // clears and detaches history; toast still works
// toast.destroy() also automatically disposes an attached history controller.
```

History is a separate optional export. It does not add a manager option, data attribute, root export, storage backend or required runtime dependency. Attach it before producing the notifications you intend to record. One controller reserves the `history` add-on name on one manager; a second attachment fails without replacing the first. A caller can explicitly destroy/unregister the first and attach a fresh empty controller.

## API

| Member | Meaning |
| --- | --- |
| `createHistoryController(instance, { maxEntries? })` | Attach synchronous, instance-filtered lifecycle observers. Defaults to 50 entries. |
| `maxEntries` | Resolved capacity, readonly. Must be an integer from 1 through 1,000; invalid runtime values throw before attachment. |
| `size` | Current number of retained lifecycle entries. |
| `isDestroyed` | True after controller destruction, external unregistration or manager destruction. |
| `getEntries()` | Detached frozen array, oldest-observed first. Entries and nested snapshot metadata are frozen. No refresh, timer, DOM or announcement work occurs. |
| `clear()` | Clear the internal ring and return the removed entry count. Observer stays attached. Sequence numbers are not reused. |
| `destroy()` | Idempotently detach the owned observer and clear retained entries. Does not destroy/dismiss/pause the manager. |

The subpath also exports `ToastHistoryOptions`, `ToastHistoryController`, `ToastHistoryEntry`, `ToastHistoryEvent`, and frozen `TOAST_HISTORY_DEFAULTS` / `TOAST_HISTORY_LIMITS`, plus `TOAST_HISTORY_ADDON_NAME`.

## What is retained

An entry contains `sequence`, `type` (`show`, `update` or `dismiss`), the original lifecycle `timestamp` (Unix milliseconds), a plain-data `toast` snapshot and a dismissal `reason` (null otherwise).

The **capacity counts lifecycle entries, not unique notifications**. Showing, updating and dismissing one toast consumes three entries. A fixed-size ring overwrites the oldest entry in O(1) append/eviction time. Reads allocate at most `maxEntries` array references. There is no per-ID journal, polling, animation frame, persistence or growing identifier map. The bound is on entry count, not an absolute byte budget: callers still control message/title lengths.

Snapshots explicitly copy current public plain-data fields. Their action field contains only the original label and `dismissOnSuccess` metadata, never `onClick`. No instance, root, input, origin node, event object, AbortSignal or callback is retained in an entry. `announcement` is an inert string, not replay instructions.

| Lifecycle | History behavior |
| --- | --- |
| Existing notifications at attachment | Not backfilled; no synthetic show event or speech. |
| Real show, including queue promotion | Append a show entry containing the actual committed snapshot. |
| Update of a visible or queued toast | Append the update snapshot. A queued update remains explicitly `queued`; it does not imply display. |
| Dismissal, including a queued toast | Append the dismissal snapshot/reason; it does not imply the toast was displayed. |
| Queue/drop | Not recorded as separate history events. Rejected incoming notifications are not represented as successful deliveries. |
| Announcement/action/pause/resume/animation | Not independently logged. Existing snapshot metadata is only as current as its recorded show/update/dismiss event. |
| Clear history | Release internal entry references; active toasts, timers, queue positions and announcements are unchanged. |
| Destroy/unregister | Clear internal data and detach listeners, including when propagation of the manager's destroy event is stopped. |

A show event means the core committed display, **not animation completion or confirmed speech**. History never waits for motion or releases queue slots. Existing GSAP and experimental View Transition contracts stay unchanged.

## Observation order, not an audit trail

Sequence numbers reflect the order this observer receives events. Source timestamps can tie. A previously registered listener can synchronously cause nested lifecycle dispatch: a dismissal can reach history before the outer show listener resumes. Both original immutable payloads remain valid records of observed events; sorting them into a claimed universal operation order would invent evidence.

Consequently, this API is neither a current-state cache nor a delivery/action audit. Do not infer the manager's present state from the last retained entry. Use `toast.getToast(id)` / `getToasts()` for authoritative live state. Do not infer that every earlier lifecycle event exists after eviction or late attachment.

## Privacy and lifetime

Only memory owned by the controller is retained. No localStorage, sessionStorage, IndexedDB, network calls, service worker, cross-tab synchronization or reload recovery is added. Destroy history at logout or when changing users, even when a shared application shell keeps the manager alive.

“In memory” is not equivalent to “secret.” Message text may contain personal data and remains available to same-page code. Explicitly retained caller snapshots and application-rendered copies **cannot be revoked** by `clear()` or `destroy()`; the application must discard those too. Reload loses this history. Essential results, instructions and actions must remain available in durable application UI; this bounded observer is not that durable record.

## Rendering and accessibility

The package renders nothing. The playground includes an application-owned inspector in `examples/basic/history-demo.js`, styled separately, with native disclosure, Refresh history and Clear history controls. It uses textContent, static ordered-list entries, no live region/role=log, no replay controls and no automatic list replacement while reading. Reading the entries through normal screen-reader navigation is intentional; re-announcing old toasts through a live channel is not.

The inspector is deliberately explicit-refresh, not a notification center. A production renderer should preserve focused controls and reading position, use understandable timestamps/states, keep action labels as historical text, and keep essential actions in their proper application context. There is no automatic focus movement from history itself. The demo's core teardown removes the inspector and its displayed rows.

## Acceptance and next gate

The shared browser contract integrates H01–H25 through `test/browser/suite.js`; Vitest and the served-browser runner inject the optional factory. Four additional inspector DOM checks run in `scripts/verify-history-offline.py`. Exact evidence and manual steps: [TOAST-270 verification](./TOAST-270-VERIFICATION.md).

Do not add persistence, unread counters, action retry/replay, announcement replay, cross-tab history or a full notification-center UI to close this slice. Those are separate product decisions.
