# Repository engineering rules

## Scope

This is a standalone accessible TypeScript plugin, not an application framework. Read `README.md`, `docs/CONTRACT.md`, `docs/VERIFICATION.md`, and current source/tests before changing behavior. The repository describes implementation reality; documentation does not prove completion.

## Architecture

- Keep the package framework-agnostic, ESM-only and without runtime dependencies.
- Do not auto-initialize, mutate global browser state, or read DOM globals on import.
- Keep the explicit `A11yToast` / `createToast` / `initToastAll` contract.
- Reuse duplicate root instances via WeakMap; lifecycle callbacks must be safe under re-entrancy.
- Keep records instance-local; expose only frozen snapshots. No global notification singleton.
- DOM interaction uses native elements and text rendering, never untrusted HTML.
- Freeze defaults/selectors/classes/attributes/event names. Strictly normalize data attributes.
- Use removable handlers and explicit ownership for every timer, listener, generated node and action signal.
- Do not introduce a shared package or plugin bus merely to reduce a few repeated utility lines.

## Accessibility and interaction

- Separate visible interactive content from polite/assertive live regions.
- Tone does not imply urgency. One component owns each announcement.
- Do not steal focus on show; preserve focused nodes during update.
- Timer pause reasons overlap. API resume cannot clear focus/hover/visibility protection.
- Treat an announcement event as a DOM mutation, never speech-delivery acknowledgment.
- No global Escape handler. No automatic top-layer portals or dialog orchestration.
- Preserve meaningful authored fallback content and document host lifecycle limitations.
- Use BEM classes, public `--a11y-toast-*` variables, scoped private `--_*` variables, visible focus, reduced motion, and forced-color-safe styling.

## Extension rules

- Add-ons are optional per-instance observers. Setup is synchronous and cleanup is owned.
- Failures cannot block core teardown or create recursive error-event storms.
- Adapters consume actual source event constants, retain toast IDs, and define announcement ownership.
- No framework/GSAP/promise/history/deduplication adapter may slip into core as an incidental change.

## Verification

- Use `test/browser/suite.js` for shared behavioral regressions. Add targeted tests for each confirmed bug.
- Browser tests, package import checks, typecheck, declaration-consumer checks and manual assistive-technology checks are separate evidence.
- Run build, typecheck, unit tests, browser tests, package tests and pack check where tooling is available.
- `build:portable` is a documented fallback, not evidence of tsdown success.
- Never mark VoiceOver/NVDA/browser zoom verified from DOM tests or a screenshot.
- Update the contract, manual test matrix and verification record only to match actual evidence.
- No npm publish, changeset publish, git push or git tag without a new explicit user request.

## Source adoption

This package deliberately adopts the project's Plugin Package Standard, accessibility/CSS rules, and incremental verification model. Prototype capabilities are classified in `docs/MIGRATION.md`; do not reintroduce them silently. Modern Web Guidance CLI search and toast-guide retrieval succeeded on 2026-11-12. The repository's explicit per-host DOM, default live-region transport and no-automatic-top-layer decisions take precedence over generic guide suggestions; see `docs/VERIFICATION.md` for the applied constraints.
