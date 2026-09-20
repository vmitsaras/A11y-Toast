# A11y Toast core contract

Status: Implemented; partially verified as a release candidate
Date: 2026-09-20

## Goal

Deliver small application feedback without unexpected focus movement, inaccessible action expiry, queue/timer races, or hard dependencies on another plugin.

## Approved scope

The previous planning conversation approved a TypeScript/ESM core, one demo, BEM CSS, stable lifecycle events, overlapping pauses, an extension contract, and no code migration wholesale from the prototype. Optional promise/progress/dedupe/history/animation/source adapters remain deferred.

## Resolved implementation decisions

1. The root must be mounted and outside another live region. Generated named viewport, ordered list, polite status region and assertive alert region are owned by the instance; author nodes remain untouched.
2. Queue policy is bounded FIFO, rejecting the incoming notification with a nullable result and `drop` event. `dismissAll` freezes its target set and prevents intermediate queue promotion. Re-entrant additions during clear are explicitly rejected.
3. Public timer pause/resume controls only the API-owned reason. Other reasons are hover, focus, hidden document and pending action. Snapshots expose the full reason set.
4. Ordinary content updates preserve remaining time. Explicit duration patches restart it. Loading always persists; actions/assertive notifications persist absent explicit timing overrides.
5. Semantic state is `queued → visible → dismissed`, or `dropped` on rejection. CSS entry is progressive enhancement; removal is synchronous. There is no asynchronous `dismissing` state or animation promise to leak during teardown.
6. `show` reports display commitment, not animation completion. `announce` reports a live-region write, not speech. Announcement channels serialize writes at a fixed 100ms write boundary with a 1,000ms inter-write gap. Updates coalesce per toast; separate toasts are not content-deduplicated. Hidden documents pause pending writes.
7. Snapshot getters supplement events for demos/adapters without exposing mutation rights. There is no configure/global singleton/alias collection.
8. The single action may be event-only or have a callback. Callback promises are caught and cancellation signals are supplied. This does not introduce the deferred general promise orchestration API.
9. Add-on setup/cleanup and six selected before/after observer hooks are supported. Hooks cannot cancel or mutate the supplied snapshot; they are not awaited. Errors are isolated.
10. When the final focused toast loses all valid return targets, an owned visible empty-state focus anchor is shown until focus leaves. Disposing an entire surrounding view still needs application focus coordination.
11. Optional runtime parameters from the initial brainstorm are intentionally narrowed: no custom API pause reason that could clear a keyboard safeguard; no global Escape; no automatic `error → assertive`; no automatic deduplication from `key`.

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
| AC-08 | Users can actually understand/hear the result with macOS VoiceOver. | Manual tests — pending. |
| AC-09 | Standard toolchain installs/builds/tests/packs reproducibly. | Partial: portable build/types/imports/pack checked; npm installation, tsdown, Vitest and lockfile pending. |

## Non-goals and limitations

No full WCAG conformance claim, publication, framework integration, persistent history, external notification API, live-region speech acknowledgment, global announcements coordinator, top-layer migration, automatic detached-host observer, rich HTML renderer or action rollback engine.

A blocking modal interaction, confirmation, required field error, or essential timed action should not be replaced with a toast. `priority: off` assumes the integrator has chosen another appropriate announcement owner.
