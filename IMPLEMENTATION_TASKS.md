# Implementation tasks — synchronized 2026-09-20

Each task is implementation work plus matching evidence. “Implemented” does not mean assistive-technology or release verification is complete.

| ID | Objective / affected paths | Dependencies | Acceptance and current state |
| --- | --- | --- | --- |
| TOAST-001 | Inspect prototype; `docs/MIGRATION.md`, contract | None | Reconciliation recorded. No wholesale migration or remote edit. Done. |
| TOAST-010 | Package/TypeScript/tsdown/Vitest/Changesets configs, scripts | 001 | ESM entries, docs/CSS exports, no runtime dependencies. Online install/tsdown/Vitest now pass in GitHub Actions; lockfile still absent. |
| TOAST-020 | `src/types.ts`, `events.ts`, `options.ts`, `index.ts` | 010 | Strict types, frozen constants, normalized options, readonly DTOs. Source/public consumer typechecks passed. |
| TOAST-030 | Class initialization and ownership | 020 | Mounted host, WeakMap, init/ready, removable listeners, repeat destroy. Browser tests passed. |
| TOAST-040 | `src/LiveAnnouncer.ts` and class coordination | 030 | Separate initially empty channels; serialization, coalescing, off mode and cancellation. DOM tests passed; actual speech pending. |
| TOAST-050 | Class show/update/dismiss/render | 040 | Stable nullable ID results, safe text, immutable snapshots, no focus on show. Browser tests passed. |
| TOAST-060 | Bounded queue and clear batch | 050 | FIFO, queued updates/dismissal, no hidden promotion during clear, reject incoming overflow. Browser tests passed. |
| TOAST-070 | Timer state and overlapping pause reasons | 050 | Remaining-time semantics, API isolation, hover/focus/visibility/pending action. Deterministic and real-time checks passed. |
| TOAST-080 | Native action, cancellation, retry, focus | 070 | Keep interactive states reachable; guard stale promise results and missing origins. Browser tests passed; manual AT pending. |
| TOAST-090 | Add-on setup/hooks/event subscriptions | 050 | Removable, isolated, reverse cleanup; accidental asynchronous failures caught. Browser tests passed. |
| TOAST-100 | `src/styles.css` | 050 | Scoped BEM, public/private properties, focus, motion, direction, forced colors. CSS/browser checks passed. |
| TOAST-110 | `examples/basic/*`, local server | 080,100 | One page uses generated dist; options and state selection, loading/update/retry, non-live log. Local interaction checks and the normal GitHub Actions served-browser lifecycle suite pass. |
| TOAST-115 | Optional visual tone label | 100,110 | `showToneLabel` + `data-a11y-toast-show-tone-label`; default visible. Hardening keeps visually hidden tone text available to assistive technology, verifies invalid data tokens fall back safely, preserves generated announcement wording, and clarifies the playground constraint. |
| TOAST-180 | Engine-neutral animation lifecycle/driver contract | 115 | `css`, `none`, or injected driver; typed animation events/context, AbortSignal cancellation, animationPhase snapshots, timer-after-enter semantics, reduced-motion/hidden-document skip/cancel. Complete; browser regressions pass. |
| TOAST-185 | Built-in CSS entrance + exit | 180 | Scoped entering/exiting classes, public motion variables, inert/aria-hidden visual exit, slot reservation until completion, CSS/None playground selector. Complete; real-browser CSS exit regression passes. |
| TOAST-190 | Animation interruption/batch hardening | 185 | Complete. Re-entrant start/error/end observers cannot continue stale completion after destruction; multi-exit `dismissAll()` remains atomic; hidden documents cancel/finalize decorative motion safely; independently finishing exits release exactly one queued slot each. Browser scenarios 87–94 pass. |
| TOAST-200 | Optional visual timeout progress add-on | 070,090,190 | Complete. Separate `a11y-toast/addons/progress` + CSS exports; visible timed toasts only; no live/progressbar semantics; lifecycle-event synchronization with remaining time; queued/persistent/loading handling; unregister cleanup; reduced-motion CSS suppression. Browser scenarios 95–101 pass. |
| TOAST-210 | Promise/loading orchestration utility | 050,090,200 | Complete. Separate `a11y-toast/addons/promise` export; one loading toast ID updates to success/error; error copy must be caller-authored; raw rejection values are never rendered; dismissal/destroy/stop detach late settlement; queued settlement and progress composition verified. Browser scenarios 102–110 pass. |
| TOAST-220 | Explicit key-based deduplication controller | 050,060,190 | Complete. Separate `a11y-toast/addons/dedupe` export; exact trimmed/case-sensitive keys; update-existing/drop-new/replace-existing policies; same-key operation serialization; visual-exit waiting before replacement; queue position and timer semantics preserved; external same-key re-entry adopted rather than duplicated. Browser scenarios 111–121 pass. |
| TOAST-230 | Generic DOM-event adapter | 050,090,220 | Complete. Separate `a11y-toast/adapters/dom-events` export; explicit EventTarget/bindings and announcement owner; show/update/dismiss/ignore commands; retained correlation IDs; source-owned mappings force priority off; duplicate correlated shows update in place; mapper errors are isolated; source/toast teardown removes listeners. Browser scenarios 122–132 pass. |
| TOAST-240 | A11y Menu Button async-state ecosystem adapter | 230 | Complete. Separate `a11y-toast/adapters/menu-button-async-state` export using the real `MENU_BUTTON_EVENTS.asyncState`/`destroy` constants and typed details from `a11y-menu-button/core`. Menu Button owns announcements; toast priority is always off. Loading/error/empty update one visual mirror, ready dismisses it, and source/toast teardown removes both generic and wrapper listeners. Optional peer `a11y-menu-button@^1.0.1`; six integration tests pass. |
| TOAST-250 | Experimental ariaNotify announcement transport | 040 | Complete as experimental opt-in. Core announcement scheduling now accepts an explicit transport while retaining live regions as default. `a11y-toast/transports/aria-notify` uses Document.ariaNotify when available, maps polite→normal/assertive→high, falls back to the scheduled live region only when the API is absent, never dual-sends, reports transport/fallback on announce, and isolates synchronous transport errors. Browser scenarios 133–138 plus 4 dedicated transport tests pass; actual AT delivery and Permissions-Policy behavior remain manual/platform gates. |
| TOAST-120 | `docs/MANUAL_TESTS.md`, acceptance matrix | 110 | VoiceOver Safari/Chrome and actual zoom evidence required. Partial, not complete. |
| TOAST-130 | README, docs metadata, roadmap, migration | 120 partial | Reconciled with actual Git tree and CI evidence; generated dist/results are no longer described as committed repository files. Complete for preview. |
| TOAST-140 | Package build/import/type/pack checks | 130 | GitHub Actions run #1 passed npm install, tsdown, source/public typechecks, Vitest, served Chromium, package exports, pack check, and the configured high-severity audit gate. Partial only because no lockfile is committed and two moderate Vitest/@vitest-mocker findings remain. |

## Regression additions in this implementation

The shared browser contract has 138 named scenarios in `test/browser/suite.js`. It covers re-entrant construction, queue starvation prevention, clear-with-new-arrivals, every timeout/reset/pause path, pending announcement replacement, async action cancellation/rejection/self-update, setup/cleanup failures, nested manager event filtering, focused-control replacement and no-origin recovery.

Further hardening included guards after pause/resume/abort/focus observers destroy a manager; malformed async setup rejection; observer promise failures; and demo focus recovery when the just-used control becomes disabled. Narrow enlarged-text grids were corrected after a failing browser smoke test.

## Acceptance note

The user reported the current plugin tested, working, and verified on 2026-09-20. The exact browser/assistive-technology matrix was not specified, so this records functional acceptance without fabricating named VoiceOver or zoom evidence.

## Verification tasks still executable by a maintainer

**TOAST-120-A — macOS VoiceOver.** Run every applicable row in `docs/MANUAL_TESTS.md`; record OS/browser/screen-reader versions, actual speech, focus behavior and any repeat-announcement failures. Do not substitute the DOM event log for heard output.

**TOAST-120-B — actual browser zoom.** Test browser 200% and 400% zoom, focused content under the fixed toast region, and keyboard scrolling of long notifications. The automated root-text-size smoke test is not the same check.

**TOAST-140-A — online dependency setup.** Completed in GitHub Actions run #1 except lockfile capture. The run passed tsdown build, Vitest, declaration consumer, served browser suite, package checks, and the high-severity audit gate. Audit output reports two moderate development-only vulnerabilities through Vitest/@vitest-mocker.

**TOAST-140-B — reproducible dependency graph.** Generate and review `package-lock.json`, commit it, switch CI installation to `npm ci`, and update/reassess the current moderate audit findings. Do not use `npm audit fix --force` blindly; the suggested Vitest major update requires its own verified change.

**TOAST-260A — GSAP driver (later).** Inject a caller-supplied GSAP instance through the frozen animation-driver contract; no runtime dependency or global discovery. Verify abort/revert cleanup before considering Flip-based layout motion.
