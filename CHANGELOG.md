# Changelog

## 0.1.0 — Unreleased implementation preview

- Added the TOAST-180 engine-neutral animation lifecycle: `css`, `none`, or an injected driver; typed start/end/error events; abort signals; reduced-motion and hidden-document safety.
- Added TOAST-185 CSS entrance/exit animation. Logical dismissal remains immediate, exiting DOM is inert/aria-hidden, queue promotion waits for exit completion, and timed lifetime begins after entrance settles.
- Added public motion CSS variables and CSS/None controls to the playground.
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
- Added the tone-label option to the single-page playground and clarified that npm publication is planned rather than currently available.

- TypeScript/ESM core with frozen options, safe text rendering, explicit initialization and duplicate-instance reuse.
- Separate polite/assertive announcement scheduling with live regions as the default transport and an off mode for shared announcement ownership.
- Bounded FIFO, safe updates, explicit overflow rejection and atomic clear behavior.
- Overlapping timer pauses, action cancellation/retry safety, focus recovery and idempotent teardown.
- Typed lifecycle events, readonly snapshots and optional add-on setup/hooks/cleanup.
- Scoped BEM CSS and a single real-build playground.
- Browser contract, demo checks, portable build and package/type smoke verification artifacts.

Manual assistive-technology checks and standard online npm-toolchain verification remain pending. No registry release history is claimed.
