# Changelog

## 0.1.0 — Unreleased implementation preview

- Added the TOAST-180 engine-neutral animation lifecycle: `css`, `none`, or an injected driver; typed start/end/error events; abort signals; reduced-motion and hidden-document safety.
- Added TOAST-185 CSS entrance/exit animation. Logical dismissal remains immediate, exiting DOM is inert/aria-hidden, queue promotion waits for exit completion, and timed lifetime begins after entrance settles.
- Added public motion CSS variables and CSS/None controls to the playground.
- Hardened animation re-entrancy, batch dismissal, hidden-document cancellation and independent exit ordering; stale completion now stops when animation observers destroy the manager.
- Added TOAST-200 visual timeout progress as an optional add-on with separate JS/CSS exports. It observes authoritative remaining-time snapshots, pauses/resumes with core lifecycle, avoids live/progressbar semantics, and hides under reduced motion.
- Added TOAST-210 promise/loading orchestration as a separate utility export. It retains one toast ID, requires caller-authored error copy, ignores late settlement after dismissal/destroy/stop, supports queued settlement, and does not cancel the underlying operation.
- Added TOAST-220 explicit key-based deduplication as a separate controller export. It supports update-existing/drop-new/replace-existing policies, serializes same-key work, waits for visual exit before replacement, preserves normal update timer/queue semantics, and never deduplicates by message text.

- Added `showToneLabel` and `data-a11y-toast-show-tone-label`; hardening now visually hides `.a11y-toast__tone` without removing its text from assistive technology or changing generated announcement wording.
- Added the tone-label option to the single-page playground and clarified that npm publication is planned rather than currently available.

- TypeScript/ESM core with frozen options, safe text rendering, explicit initialization and duplicate-instance reuse.
- Separate polite/assertive live-region scheduling and an off mode for shared announcement ownership.
- Bounded FIFO, safe updates, explicit overflow rejection and atomic clear behavior.
- Overlapping timer pauses, action cancellation/retry safety, focus recovery and idempotent teardown.
- Typed lifecycle events, readonly snapshots and optional add-on setup/hooks/cleanup.
- Scoped BEM CSS and a single real-build playground.
- Browser contract, demo checks, portable build and package/type smoke verification artifacts.

Manual assistive-technology checks and standard online npm-toolchain verification remain pending. No registry release history is claimed.
