# Prototype reconciliation and migration

This is the historical reconciliation from 2026-09-20. The dispositions below describe the initial migration decisions; see `README.md` and `docs/CONTRACT.md` for currently implemented features and optional exports.

The existing `vmitsaras/a11y-toast-start` was inspected through the GitHub connector on 2026-09-20 at tree/commit `25a2708bcb747bb2644b41c4f2e7cfeab6cff3e3`. It contained JavaScript source, a README, a source demo and multiple `demos/*.html` pages, but no package/build/test foundation in that tree. The main prototype source and current Menu Button event definitions were sampled to verify conventions.

This delivery is a separate package. It does not overwrite or push to that repository. No remote changes were made.

| Prototype capability/convention | New disposition |
| --- | --- |
| JavaScript class-only entry | TypeScript class + specific factory + explicit batch helper + type exports. |
| `src/core/A11yToast.js` containing orchestration/animation policies | Smaller responsibility boundaries: class, normalization, types/events, private live scheduler. |
| Polite/assertive live regions | Kept, isolated from interactive visible content. |
| Queueing | Kept; explicitly bounded FIFO; reject incoming overflow. |
| Duplicate/content/key replacement | Deferred; `key` is correlation only. |
| `politeness` | `priority`, including `off`; not inferred from error tone. |
| `close(id)` / extra aliases | Use `dismiss(id)`; no compatibility alias layer. |
| `timeout`, `isLoading` | Use `duration`, and `tone: 'loading'`. |
| `bottom-right`, `top-left`, etc. | Logical `bottom-end`, `top-start`, etc.; inherit direction. |
| Multiple animation modes, window GSAP fallback | CSS entry only. No GSAP/window injection or View Transition orchestration. |
| Visual progress indicator | Deferred add-on. |
| General `promise()` helper | Deferred add-on; action callback safety remains in core. |
| Multiple demo/design pages | One built-package playground at `examples/basic`. |
| Modifier/skin catalogue | One restrained BEM default with public CSS properties. |
| Prototype custom events without bubbling flag | Typed, bubbling `a11y-toast:*` events; frozen snapshots; explicit reasons. |

The inspected `A11y-Menu-Button/src/events.ts` uses `menu-button:*` names, not `a11y-menu-button:*`. Do not rewrite other packages to force uniform literal strings. Future adapters must import/use the actual source constants. Structural compatibility (public API, event details, cleanup, metadata, exports) matters more than pretending all existing names already match.

No existing package is declared modified or verified by this package's tests.

## Current package equivalents

The table above preserves the initial reconciliation. In the current 1.0.0 candidate, these optional features are implemented:

- Exact-key deduplication through `a11y-toast/addons/dedupe`; core `key` remains correlation metadata, with no automatic message-text deduplication.
- Visual timeout progress and promise/loading orchestration through `a11y-toast/addons/progress` and `a11y-toast/addons/promise`. There is no core `toast.promise()` method.
- Built-in `css`/`none` motion, caller-injected GSAP and GSAP Flip exports, and experimental element-scoped View Transitions. There is no global GSAP discovery or document-wide transition fallback.
- Fifteen independently scoped CSS skins and three authored/generated routes: component showcase, advanced lab and design gallery.
- Generic DOM-event and A11y Menu Button async-state adapters. The Menu Button bridge consumes the source's real exported events and leaves announcement ownership with the source.

See [current usage and exports](../README.md) and the [behavior contract](./CONTRACT.md). Manual assistive-technology and final-revision remote CI remain separate acceptance gates.
