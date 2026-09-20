# Implementation tasks — synchronized 2026-09-20

Each task is implementation work plus matching evidence. “Implemented” does not mean assistive-technology or release verification is complete.

| ID | Objective / affected paths | Dependencies | Acceptance and current state |
| --- | --- | --- | --- |
| TOAST-001 | Inspect prototype; `docs/MIGRATION.md`, contract | None | Reconciliation recorded. No wholesale migration or remote edit. Done. |
| TOAST-010 | Package/TypeScript/tsdown/Vitest/Changesets configs, scripts | 001 | ESM entries, docs/CSS exports, no runtime dependencies. Implemented; standard install/tooling gate open. |
| TOAST-020 | `src/types.ts`, `events.ts`, `options.ts`, `index.ts` | 010 | Strict types, frozen constants, normalized options, readonly DTOs. Source/public consumer typechecks passed. |
| TOAST-030 | Class initialization and ownership | 020 | Mounted host, WeakMap, init/ready, removable listeners, repeat destroy. Browser tests passed. |
| TOAST-040 | `src/LiveAnnouncer.ts` and class coordination | 030 | Separate initially empty channels; serialization, coalescing, off mode and cancellation. DOM tests passed; actual speech pending. |
| TOAST-050 | Class show/update/dismiss/render | 040 | Stable nullable ID results, safe text, immutable snapshots, no focus on show. Browser tests passed. |
| TOAST-060 | Bounded queue and clear batch | 050 | FIFO, queued updates/dismissal, no hidden promotion during clear, reject incoming overflow. Browser tests passed. |
| TOAST-070 | Timer state and overlapping pause reasons | 050 | Remaining-time semantics, API isolation, hover/focus/visibility/pending action. Deterministic and real-time checks passed. |
| TOAST-080 | Native action, cancellation, retry, focus | 070 | Keep interactive states reachable; guard stale promise results and missing origins. Browser tests passed; manual AT pending. |
| TOAST-090 | Add-on setup/hooks/event subscriptions | 050 | Removable, isolated, reverse cleanup; accidental asynchronous failures caught. Browser tests passed. |
| TOAST-100 | `src/styles.css` | 050 | Scoped BEM, public/private properties, focus, motion, direction, forced colors. CSS/browser checks passed. |
| TOAST-110 | `examples/basic/*`, local server | 080,100 | One page uses real dist; options and state selection, loading/update/retry, non-live log. Local DOM/interaction checks passed; usual served browser route blocked here. |
| TOAST-120 | `docs/MANUAL_TESTS.md`, acceptance matrix | 110 | VoiceOver Safari/Chrome and actual zoom evidence required. Partial, not complete. |
| TOAST-130 | README, docs metadata, roadmap, migration | 120 partial | Documents current preview and open gates rather than claiming a release. Complete for preview. |
| TOAST-140 | Package build/import/type/pack checks | 130 | Portable compiler, Node exports, declaration consumer and pack checked. Standard tsdown/Vitest/dependency audit remain blocked. |

## Regression additions in this implementation

The shared browser contract has 77 named scenarios in `test/browser/suite.js`. It covers re-entrant construction, queue starvation prevention, clear-with-new-arrivals, every timeout/reset/pause path, pending announcement replacement, async action cancellation/rejection/self-update, setup/cleanup failures, nested manager event filtering, focused-control replacement and no-origin recovery.

Further hardening included guards after pause/resume/abort/focus observers destroy a manager; malformed async setup rejection; observer promise failures; and demo focus recovery when the just-used control becomes disabled. Narrow enlarged-text grids were corrected after a failing browser smoke test.

## Verification tasks still executable by a maintainer

**TOAST-120-A — macOS VoiceOver.** Run every applicable row in `docs/MANUAL_TESTS.md`; record OS/browser/screen-reader versions, actual speech, focus behavior and any repeat-announcement failures. Do not substitute the DOM event log for heard output.

**TOAST-120-B — actual browser zoom.** Test browser 200% and 400% zoom, focused content under the fixed toast region, and keyboard scrolling of long notifications. The automated root-text-size smoke test is not the same check.

**TOAST-140-A — online dependency setup.** Run `npm install`, capture a lockfile, review dependency/audit output, run tsdown build, Vitest, declaration consumer, normal browser suite and local packaging. Do not publish. Update `docs/VERIFICATION.md` with actual logs.

**TOAST-230 — first adapter (later).** Select a real source event, import its actual constants, retain toast IDs, define which component owns announcements, and verify disposal from both source and toast. Do not start this before core acceptance findings are resolved.
