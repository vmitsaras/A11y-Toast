# A11y Toast core contract

Status: Implemented; partially verified as a release candidate
Date: 2026-09-20

## Goal

Deliver small application feedback without unexpected focus movement, inaccessible action expiry, queue/timer races, or hard dependencies on another plugin.

## Approved scope

The previous planning conversation approved a TypeScript/ESM core, one demo, BEM CSS, stable lifecycle events, overlapping pauses, an extension contract, and no code migration wholesale from the prototype. Progress, promise orchestration, explicit key deduplication, the generic DOM-event adapter, the first concrete A11y Menu Button async-state adapter, an experimental ariaNotify transport, optional GSAP enter/exit, optional GSAP Flip surviving-stack motion, and an experimental element-scoped View Transition driver are implemented as optional exports. Bounded in-memory history is now implemented as a separate optional export; additional ecosystem adapters and a durable notification center remain deferred.

## Resolved implementation decisions

1. The root must be mounted and outside another live region. Generated named viewport, ordered list, polite status region and assertive alert region are owned by the instance; author nodes remain untouched.
2. Queue policy is bounded FIFO, rejecting the incoming notification with a nullable result and `drop` event. `dismissAll` freezes its target set and prevents intermediate queue promotion. Re-entrant additions during clear are explicitly rejected.
3. Public timer pause/resume controls only the API-owned reason. Other reasons are hover, focus, hidden document and pending action. Snapshots expose the full reason set.
4. Ordinary content updates preserve remaining time. Explicit duration patches restart it. Loading always persists; actions/assertive notifications persist absent explicit timing overrides.
5. Semantic state remains `queued → visible → dismissed`, or `dropped` on rejection. Animation is orthogonal through `animationPhase` (`enter` / `exit` / null). `dismiss()` performs logical removal synchronously; an animated exit may keep generated DOM briefly rendered as inert + aria-hidden while its visual slot remains reserved. Destroy never waits for animation.
6. `show` reports display commitment, not animation completion. Announcements do not wait for decorative motion. Timed lifetime starts after entrance completes or is skipped. `announce` reports an announcement-transport commit attempt, not speech. Announcement channels serialize commits at a fixed 100ms boundary with a 1,000ms inter-commit gap. Updates coalesce per toast; separate toasts are not content-deduplicated. Hidden documents pause pending commits.
7. Snapshot getters supplement events for demos/adapters without exposing mutation rights. There is no configure/global singleton/alias collection.
8. The single action may be event-only or have a callback. Callback promises are caught and cancellation signals are supplied. This does not introduce the deferred general promise orchestration API.
9. Add-on setup/cleanup and six selected before/after observer hooks are supported. Hooks cannot cancel or mutate the supplied snapshot; they are not awaited. Errors are isolated.
10. When the final focused toast loses all valid return targets, an owned visible empty-state focus anchor is shown until focus leaves. Disposing an entire surrounding view still needs application focus coordination.
11. Animation accepts built-in `css`, `none`, or an injected engine-neutral driver. Drivers receive a frozen context and AbortSignal; start/end/error events are typed and separate from semantic show/dismiss events. Reduced-motion and hidden-document state skip/cancel decorative motion. CSS is the default shipped driver; optional GSAP and experimental element-scoped View Transition drivers implement the same contract. GSAP Flip remains a separate layout add-on.
12. Optional runtime parameters from the initial brainstorm are intentionally narrowed: no custom API pause reason that could clear a keyboard safeguard; no global Escape; no automatic `error → assertive`; no automatic deduplication from `key`. The separate dedupe controller is opt-in, exact-key based, and never compares message text.
13. Generic source integration is explicit: a DOM-event adapter receives a concrete EventTarget and synchronous event mappings, retains adapter-local correlation IDs, and requires one announcement owner. Source-owned mappings force toast priority to `off`; adapters do not infer ownership from event names or source markup.
14. The first concrete ecosystem adapter targets `a11y-menu-button@^1.0.1` async state through its public `MENU_BUTTON_EVENTS` constants/types. The source status region remains the sole announcement owner. Loading/error/empty are visual mirrors on one correlation; ready dismisses rather than fabricating success copy. The peer is optional so importing toast core does not require Menu Button.
15. Announcement delivery is transport-pluggable while live regions remain the default. The experimental ariaNotify transport maps polite→normal and assertive→high, never dual-sends with live regions, and falls back to the scheduled live-region channel only when the API is absent. A Permissions Policy may suppress ariaNotify silently; neither support detection nor announce events prove assistive-technology delivery.
16. The optional GSAP driver accepts a caller-supplied GSAP instance; core never discovers a global. It owns only opacity/vertical motion and reserved lifecycle callbacks. Completion/abort/interruption call GSAP revert and then restore the exact pre-animation style attribute. Core retains reduced-motion, queue, timer, focus and DOM-removal ownership; external GSAP interruption is isolated as animation-error rather than stranding dismissal.
17. Optional GSAP Flip layout motion is implemented as an add-on using existing before/after hooks, not as a second enter/exit driver. It captures only survivors, excludes the mutated/leaving/entering toast, coalesces synchronous changes, waits for exit completion before queue-promotion reflow, and skips all measurement under reduced motion. Temporary Flip IDs/styles are restored without overwriting application-authored inline changes.
18. The experimental View Transition driver uses only `Element.startViewTransition()` on the individual toast element. Unsupported browsers settle with no motion; there is no document-scoped fallback. Active same-element phases serialize through the platform transition's `finished` boundary, abort uses `skipTransition()`, and queue/timer/focus ownership stays in core. Motion is expressed through temporary data attributes plus the optional stylesheet rather than inline styles, and authored attribute state is restored after platform finalization.

19. The optional history controller observes future show/update/dismiss payloads from one manager. It retains at most the configured lifecycle entry count (default 50; integer 1–1,000), exposes frozen plain-data reads and history-only clear, and clears/detaches on destroy or unregister. It does not backfill, persist, replay announcements/actions, mutate core state or claim a delivery audit. Observation order can differ from operation order during nested synchronous events. Full details are in `docs/HISTORY.md`.

## Acceptance criteria

| ID | Observable contract | Primary evidence |
| --- | --- | --- |
| AC-01 | Factory/class duplicate initialization reuses the active manager; no import-side DOM work. | Browser 01–07; Node package test. |
| AC-02 | Visible/queued updates, bounded FIFO, rejection and clear are deterministic. | Browser 14–21. |
| AC-03 | Timers preserve/reset time as documented and respect overlapping pauses. | Browser 22–32; real timer UI check. |
| AC-04 | Polite/assertive/off channels are independent of tone; pending writes are ordered and cancelable. | Browser 11–13, 28–29, 33–39, 56, 71. |
| AC-05 | Showing never steals focus; actions/dismissal/update have safe ownership and recovery. | Browser 09, 40–48, 59–60, 65–75; demo checks. |
| AC-06 | Lifecycle snapshots, subscriptions, add-ons and cleanup are isolated and removable. | Browser 03, 10, 49–64, 72, 76–77. |
| AC-07 | BEM styling and one real-build demo support narrow layouts, motion preference and forced colors. | UI checks, screenshots, stylesheet. |
| AC-07A | Animation is interruptible and cannot change announcement semantics, consume timed lifetime during entrance, leave exiting controls interactive, promote the queue before exit completion, or continue stale settlement after a re-entrant destroy. Multi-exit and hidden-document cancellation preserve queue ordering. | Browser 80–94; CSS stylesheet/driver contract. |
| AC-07B | Optional timeout progress observes authoritative timer snapshots without becoming a second timer, live region, or progressbar; it appears only for visible timed notifications and cleans up independently. | Browser 95–101; progress add-on/CSS exports. |
| AC-07C | Promise orchestration retains one toast ID, never renders raw rejection values, can settle while queued, and performs no late update after dismiss/destroy/explicit stop. It does not cancel the underlying operation. | Browser 102–110; promise utility export. |
| AC-07D | Key deduplication is opt-in and exact-key based. Update preserves ID/queue/timer semantics; drop creates no new lifecycle/announcement; replace waits for visual exit before creating a new ID; same-key operations serialize. | Browser 111–121; dedupe controller export. |
| AC-07E | Generic DOM-event integration requires an explicit announcement owner, retains correlation IDs, isolates mapper errors, updates duplicate correlated shows instead of leaking records, and removes all source/toast listeners on disposal. Source ownership forces priority off. | Browser 122–132; DOM-event adapter export. |
| AC-07F | The A11y Menu Button async-state adapter uses real exported source events/types, keeps Menu Button as the only announcement owner, mirrors loading/error/empty on one visual toast, dismisses on ready, and cleans wrapper/generic listeners from either source or toast teardown. | 6 Vitest integration tests against `a11y-menu-button@1.0.1`; package/type checks. |
| AC-07G | Announcement transports share the same scheduler. Custom transports never receive priority off, preserve coalescing, isolate synchronous failures, and report actual transport/fallback. Experimental ariaNotify maps priorities and falls back only when unsupported. | Browser 133–138; 4 ariaNotify Vitest tests; package/type checks. |
| AC-07H | The optional GSAP driver is caller-injected, follows logical placement direction, preserves core reduced-motion/queue/timer semantics, restores exact pre-animation styles on every settlement path, and turns external GSAP interruption into isolated animation failure. | Browser 139–144; 5 real-GSAP Vitest integration tests against GSAP 3.15.0; package/type checks. |
| AC-07I | Optional GSAP Flip motion affects only surviving stack items, batches synchronous layout changes, waits through exit/queue-promotion boundaries, skips measurement under reduced motion, and leaves no Flip-owned ID/style residue after completion or teardown. | Browser 145–151; 3 real-Flip Vitest tests against GSAP 3.15.0; package/type checks. |
| AC-07J | Experimental View Transition motion is element-scoped only, never document-scoped; unsupported browsers degrade to no motion, reduced motion skips API calls, overlapping same-toast phases serialize, abort skips the active transition, exit retains its queue slot, and temporary attribute/CSS state is restored. | Browser 152–158; 4 dedicated View Transition Vitest tests; package/type checks. |
| AC-07K | Optional history is bounded, immutable, per-instance and removable; reads/clear add no announcements/actions/DOM work; queue and animation semantics remain core-owned. | H01–H25 targeted Chromium checks plus four inspector DOM checks and integrated GitHub Actions run 35579571709 pass; manual history acceptance pending. |
| AC-08 | Users can actually understand/hear the result with macOS VoiceOver. | Manual tests — pending. |
| AC-09 | Standard toolchain installs/builds/tests/packs reproducibly. | Partial: lockfile-based `npm ci`, tsdown, types, Vitest 5, browser, imports, pack, and moderate audit pass locally; refreshed dependency workflow still needs remote CI validation. |

## Non-goals and limitations

No full WCAG conformance claim, publication, framework integration, persistent history, external notification API, live-region speech acknowledgment, global announcements coordinator, top-layer migration, automatic detached-host observer, rich HTML renderer or action rollback engine.

A blocking modal interaction, confirmation, required field error, or essential timed action should not be replaced with a toast. `priority: off` assumes the integrator has chosen another appropriate announcement owner.
