# Changelog

## 0.1.0 — Unreleased implementation preview

- Added `showToneLabel` and `data-a11y-toast-show-tone-label` to hide the visible `.a11y-toast__tone` line without changing generated announcement wording.
- Added the tone-label option to the single-page playground and clarified that npm publication is planned rather than currently available.

- TypeScript/ESM core with frozen options, safe text rendering, explicit initialization and duplicate-instance reuse.
- Separate polite/assertive live-region scheduling and an off mode for shared announcement ownership.
- Bounded FIFO, safe updates, explicit overflow rejection and atomic clear behavior.
- Overlapping timer pauses, action cancellation/retry safety, focus recovery and idempotent teardown.
- Typed lifecycle events, readonly snapshots and optional add-on setup/hooks/cleanup.
- Scoped BEM CSS and a single real-build playground.
- Browser contract, demo checks, portable build and package/type smoke verification artifacts.

Manual assistive-technology checks and standard online npm-toolchain verification remain pending. No registry release history is claimed.
