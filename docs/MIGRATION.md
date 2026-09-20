# Prototype reconciliation and migration

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

No existing package is declared modified or verified by this new package's tests. A real cross-package adapter remains a separate slice with its own acceptance criteria.
