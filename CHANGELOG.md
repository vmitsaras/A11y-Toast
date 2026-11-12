# Changelog

## 1.0.0 — Unreleased

Prepared as 1.0.0 on 2026-11-12, superseding the unpublished 0.2.0 candidate. This candidate consolidates the unpublished 0.1.0 implementation preview and the history (minor) and skin/progress (patch) changesets consumed during version preparation. It has not been published.

2026-11-12 reusable skins/gallery, showcase/lab cleanup and lifecycle fixes are locally verified:

- Added fifteen independent optional `a11y-toast/skins/{id}.css` files loaded after base CSS with matching root modifiers; all six tones and optional titles/icons/actions use the existing renderer, with no JavaScript API, defaults, runtime dependency or version changes.
- Added a third design-gallery route with fifteen static non-live previews, explicitly activated single persistent polite feedback, same-ID action completion, matching selectable/copyable setup and selected-skin/base CSS downloads. Moved dedicated classic lab previews into the gallery; retained existing composer presets. 335 integrated browser checks pass with zero uncaught errors; build/types/unit/package/pack pass. Manual VoiceOver/actual zoom/native touch acceptance remains pending.
- Split the public component showcase from the advanced lab with a shared neutral shell and generated Pages routes. The showcase demonstrates success, Undo, loading and error/retry, retains non-live results and provides Reset examples; the lab keeps settings, animations, note/ownership recipes, and inspectors; dedicated classic previews now live in the design gallery.
- Defer timers through initial display callbacks and entrance, and guard promise-helper subscriptions when synchronous show callbacks already dismissed the toast or destroyed its manager.
- Correct locked-toolchain Node guidance, use `npm ci` in development quickstarts, fix five-visible/sixth-queued manual instructions, add repository/bugs/homepage package links and ignore `test-results/`. Preserve the existing runtime API/dependency contract.

- Bound DOM-event adapter same-key feedback to 100 accepted commands per synchronous transaction. Overflow clears pending work and reports once through the existing error callback; later events remain usable and reporter re-entry cannot restart the loop.
- Hardened synchronous re-entrancy: destruction during queue promotion rejects new arrivals, announcement transports cannot bypass the owned gap timer, and same-key DOM-event commands serialize without losing live correlations or restoring tracking after disposal.
- Added optional swipe dismissal with a separate JS/CSS export, a gesture-owned timer hold, vertical-scroll and multi-pointer cancellation safeguards, and cleanup on cancellation, dismissal, unregister and destroy. Native close buttons remain available; injected animation drivers are outside its compatibility contract.
- Added a sample-note save recipe with persistent in-page feedback, retained button focus and a fallback status when the toast queue is full. This recipe is retained in the advanced lab.
- Kept five-toast stacks within the viewport, preserved bounded scrolling for long content, and prevented motion-only scrollbar flashes and directional clipping in the demo.

- Updated development-only Vitest/mocker to 5.0.5, Vite to 8.3.5 and source-map-js to 1.2.2 to resolve the current dependency audit findings. No runtime dependencies were added.

- Added optional per-toast decorative HTML/SVG element icons with owned clones, validation, update/removal support, and no icon DOM in snapshots or announcements. Added opt-in responsive inline actions and light success/dark information advanced-lab examples.
- Restored the light default notification skin; the compact dark treatment is available as an optional demo styling example using the public CSS properties.
- Restored the optional timeout progress treatment to its classic horizontal bar. Timer ownership, pause/resume behavior, reduced-motion suppression, and non-semantic accessibility behavior are unchanged.
- Added TOAST-285 as the separate `a11y-toast/addons/diagnostics` export. It reports frozen, content-free advisory signals for risky timing, assertive bursts, queue rejection and lifecycle failures through a required caller callback, with no default output or conformance claim.
- Added TOAST-270 as the separate `a11y-toast/addons/history` export: bounded frozen lifecycle entries, explicit read/clear access, owned teardown, and no persistence, announcement replay or action replay.
- Added an application-owned non-live history inspector, H01–H25 shared behavioral scenarios, declaration/package coverage, and a targeted offline ESM verification route. Targeted and integrated local automation plus the earlier history GitHub Actions run pass; named manual acceptance remains pending.

- Added the TOAST-180 engine-neutral animation lifecycle: `css`, `none`, or an injected driver; typed start/end/error events; abort signals; reduced-motion and hidden-document safety.
- Added TOAST-185 CSS entrance/exit animation. Logical dismissal remains immediate, exiting DOM is inert/aria-hidden, queue promotion waits for exit completion, and timed lifetime begins after entrance settles.
- Added public motion CSS variables and CSS/None controls to the advanced lab.
- Hardened animation re-entrancy, batch dismissal, hidden-document cancellation and independent exit ordering; stale completion now stops when animation observers destroy the manager.
- Added TOAST-200 visual timeout progress as an optional add-on with separate JS/CSS exports. It observes authoritative remaining-time snapshots, pauses/resumes with core lifecycle, avoids live/progressbar semantics, and hides under reduced motion.
- Added TOAST-210 promise/loading orchestration as a separate utility export. It retains one toast ID, requires caller-authored error copy, ignores late settlement after dismissal/destroy/stop, supports queued settlement, and does not cancel the underlying operation.
- Added TOAST-220 explicit key-based deduplication as a separate controller export. It supports update-existing/drop-new/replace-existing policies, serializes same-key work, waits for visual exit before replacement, preserves normal update timer/queue semantics, and never deduplicates by message text.
- Added TOAST-230 generic DOM-event adapter with explicit toast/source announcement ownership, correlated show/update/dismiss commands, duplicate correlated-show updates, mapper error isolation, and lifecycle-safe listener cleanup.
- Added TOAST-240 A11y Menu Button async-state adapter using the source package's real exported events/types. Menu Button remains the sole announcement owner; loading/error/empty are mirrored visually on one toast, ready dismisses it, and both source/toast lifecycle cleanup paths are covered. The ecosystem package is an optional peer dependency.
- Added TOAST-250 experimental announcement transports with live regions remaining the default. The ariaNotify subpath maps polite/assertive priorities, falls back only when unsupported, never dual-sends, reports actual transport/fallback, and isolates synchronous transport failures; actual AT delivery remains a manual gate.
- Added TOAST-260A injected GSAP animation driver as a separate optional export. It uses caller-supplied GSAP, logical opacity/vertical enter/exit motion, core-owned reduced-motion/queue semantics, interruption isolation, and exact pre-animation style restoration after GSAP revert.
- Added TOAST-260B optional GSAP Flip stack-reflow add-on. It animates only surviving toast layout changes, coalesces synchronous mutations, waits through exit/queue promotion, skips under reduced motion, and restores Flip measurement/animation side effects without leaking temporary IDs or inline styles.
- Added TOAST-260C experimental element-scoped View Transition driver and stylesheet. It never falls back to document-wide transitions, degrades to no motion when unsupported, serializes overlapping phases per toast, skips active transitions on abort, preserves queue/timer semantics, and uses temporary data attributes/CSS instead of inline motion styles.

- Added `showToneLabel` and `data-a11y-toast-show-tone-label`; hardening now visually hides `.a11y-toast__tone` without removing its text from assistive technology or changing generated announcement wording.
- Added the tone-label option to the advanced lab and clarified that npm publication is planned rather than currently available.

- TypeScript/ESM core with frozen options, safe text rendering, explicit initialization and duplicate-instance reuse.
- Separate polite/assertive announcement scheduling with live regions as the default transport and an off mode for shared announcement ownership.
- Bounded FIFO, safe updates, explicit overflow rejection and atomic clear behavior.
- Overlapping timer pauses, action cancellation/retry safety, focus recovery and idempotent teardown.
- Typed lifecycle events, readonly snapshots and optional add-on setup/hooks/cleanup.
- Scoped BEM CSS and real-build demo examples.
- Browser contract, demo checks, portable build and package/type smoke verification artifacts.

Dated local clean-install, standard-build, type/unit/browser/package/pack and dependency-audit results are recorded in `docs/VERIFICATION.md`. The 2026-11-12 cleanup passes local integration checks, including 257 browser scenarios with zero uncaught errors and a zero-vulnerability audit. Final-revision remote CI and named manual assistive-technology, zoom and native-touch acceptance remain pending. No registry release history is claimed.
