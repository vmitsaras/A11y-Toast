# A11y Toast roadmap

Version: 0.1.0 implementation preview
Status: Core implemented; user functional acceptance reported; local and GitHub Actions package checks pass. A reviewed lockfile, `npm ci`, and a zero-vulnerability Vitest 5 dependency graph are implemented locally; named VoiceOver/zoom coverage and remote validation of the refreshed dependency workflow remain open.

## Foundation

| Task | Implementation | Verification / remaining gate |
| --- | --- | --- |
| TOAST-001 Prototype reconciliation | Complete | Current prototype tree inspected; migration dispositions documented. |
| TOAST-010 Standard package foundation | Complete | Online install, tsdown build, Vitest, exports, and served-browser workflow pass in GitHub Actions. A lockfile is now tracked and CI uses `npm ci`; the refreshed dependency workflow still needs its first remote run. |
| TOAST-020 Public types/constants | Complete | Strict source and public declaration-consumer checks pass. |
| TOAST-030 Initialization/teardown | Complete | Automated browser checks pass, including duplicate/re-entrant construction and repeat destroy. |

## Core MVP

| Task | Implementation | Verification / remaining gate |
| --- | --- | --- |
| TOAST-040 Announcement infrastructure | Complete | DOM scheduling/coalescing/cancellation tested; actual VoiceOver speech pending. |
| TOAST-050 Show/update/dismiss | Complete | Visible/queued behavior and text safety tested. |
| TOAST-060 Queue policy | Complete | FIFO/rejection/clear/re-entrant arrival tests pass. |
| TOAST-070 Timer/pause lifecycle | Complete | Deterministic clock coverage plus real browser expiry check pass. |
| TOAST-080 Actions/focus recovery | Complete | Native controls, retry/cancellation, focused updates and fallback tested; AT interaction pending. |
| TOAST-090 Add-on lifecycle | Complete | Setup/subscriptions/hooks/cleanup/failure isolation tested. |
| TOAST-100 Default CSS | Complete | BEM/tokens, logical placement, reduced motion and forced-colors emulation checked. |
| TOAST-110 One-page playground | Complete | Real compiled runtime used; content/options/queue/loading/retry/log workflows checked, and the normal served-browser lifecycle suite passes in GitHub Actions. |
| TOAST-115 Optional visual tone label | Complete + hardened | `showToneLabel` defaults to true. False visually hides `.a11y-toast__tone` without removing it from the accessibility tree; invalid data tokens fall back safely, generated announcement wording is unchanged, and the playground explains the state constraint. Final CI: 79/79 browser scenarios, 0 uncaught page errors. |

## Animation foundation

| Task | Status | Verification |
| --- | --- | --- |
| TOAST-180 Animation lifecycle/driver contract | **Complete** | `css`, `none`, or injected driver; animation phase snapshot; typed start/end/error events; AbortSignal interruption; reduced-motion/hidden-document safety; timer starts after entrance. |
| TOAST-185 Built-in CSS entrance + exit | **Complete** | Logical dismissal remains immediate; exiting surfaces are inert + aria-hidden and reserve their slot until exit completion. Public duration/ease/distance CSS variables added. Browser contract passes 86/86. |
| TOAST-190 Animation interruption/batch hardening | **Complete** | Re-entrant animation observers, multi-exit `dismissAll()`, hidden-document enter/exit cancellation, destroy-during-settlement, and ordered queue-slot release are hardened. Browser contract passes 94/94. |

## Verification and release readiness

| Task | Status | Next action |
| --- | --- | --- |
| TOAST-120 Accessibility verification | Partial | Chrome 153 actual 200%/400% zoom passed on macOS 27.0. Run VoiceOver + Safari and VoiceOver + Chrome, finish Safari zoom, and complete the remaining manual rows. |
| TOAST-130 Documentation/metadata | Complete for this preview | Reconciled with generated-artifact policy and GitHub Actions evidence; keep synchronized after later fixes. |
| TOAST-140 Package verification | Partial | Lockfile generation/review, clean `npm ci`, and the moderate audit gate pass locally after upgrading the development-only Vitest dependency to 5.0.1; CI now uses `npm ci`. Remaining: validate this refreshed dependency workflow in GitHub Actions. |

Windows NVDA/JAWS and mobile AT are not claimed verified. Record actual environment coverage rather than inferring it from Chromium DOM behavior.

## Optional enhancements

TOAST-200: **Complete** — visual timeout progress add-on; separate JS/CSS exports, no polling loop, pause/resume/update/loading lifecycle synchronization, non-semantic visual output, reduced-motion suppression.
TOAST-210: **Complete** — promise/loading orchestration utility; one retained toast ID, caller-authored success/error copy, late settlement ignored after dismiss/destroy, queue-safe settlement, pass-through promise and explicit stop control.
TOAST-220: **Complete** — explicit key-based deduplication controller; opt-in exact-key matching with update-existing/drop-new/replace-existing policies, same-key serialization, animated-replacement waiting, queue/timer preservation, and no message-text dedupe.
TOAST-230: **Complete** — generic DOM-event adapter; explicit EventTarget/bindings, source-vs-toast announcement ownership, retained correlation IDs, show/update/dismiss commands, duplicate correlated-show update behavior, error isolation, and removable lifecycle cleanup.
TOAST-240: **Complete** — first concrete ecosystem adapter for `a11y-menu-button` async state. Uses the package's real exported event constants/types, mirrors loading/error/empty visually with source-owned announcements, dismisses on ready, and cleans up from both Menu Button and toast lifecycles. Optional peer: `a11y-menu-button@^1.0.1`.
TOAST-250: **Complete — experimental only** — engine-neutral announcement transport boundary plus `a11y-toast/transports/aria-notify`. Live regions remain the default; ariaNotify is explicit opt-in, maps polite→normal/assertive→high, falls back to live regions when unsupported, never dual-sends, and reports actual transport/fallback in lifecycle events. Permissions-Policy suppression remains platform-silent and manual AT verification is still required.
TOAST-260A: **Complete** — injected GSAP animation driver using the frozen TOAST-180 contract. No `window.gsap` discovery and no required runtime dependency; the caller supplies GSAP. Enter/exit use restrained opacity + logical vertical motion, core still owns reduced motion, and completion/abort/interruption restore the exact pre-animation style attribute.
TOAST-260B: **Complete** — optional GSAP Flip layout/reflow add-on. It captures surviving toast geometry before show/update/dismiss mutations, coalesces synchronous stack changes, waits through animated exit completion before queue-promotion reflow, excludes entering/leaving toasts, respects reduced motion, and restores temporary Flip/style attributes. Uses the existing optional GSAP peer; no additional runtime dependency.
TOAST-260C: **Complete — experimental only** — separate element-scoped View Transition driver and CSS export. Each toast element owns its own scoped transition; document-scoped transitions are never used. Unsupported browsers settle immediately with no motion, reduced motion skips the API, abort calls `skipTransition()`, overlapping enter→exit phases serialize per toast, queue slots remain reserved through exit, and motion uses temporary data attributes/CSS rather than inline styles.

TOAST-270: **Implemented — targeted, integrated local, and remote CI verification passed; manual acceptance pending** — separate in-memory history controller, 50 lifecycle entries by default (integer 1–1,000), immutable show/update/dismiss snapshots, read/clear access, bounded ring eviction and owned cleanup. No backfill, persistence, announcement replay or action replay. Non-live playground inspector and 25 shared history scenarios added; targeted history/inspector checks and the complete 183-scenario served-browser suite pass locally and in GitHub Actions run 35579571709. See `docs/TOAST-270-VERIFICATION.md`.

TOAST-280: **Implemented — local verification passed; remote CI not yet run** — opt-in development diagnostics add-on with a required caller reporter, frozen content-free payloads, bounded assertive-burst detection, state-transition throttling, error/drop observation, per-instance cleanup, no default output and no WCAG or speech-delivery claim. Build, type, Vitest, 190-scenario served-browser, package and pack checks pass locally.

A durable notification center remains out of scope. Unimplemented capabilities are not credited from the old prototype.

## Next unblocked slice

Validate TOAST-140-B's new lockfile-based `npm ci` workflow and Vitest 5 upgrade in GitHub Actions. Local clean install and `npm audit --audit-level=moderate` pass with zero vulnerabilities. TOAST-120 macOS VoiceOver remains a manual acceptance gate; Chrome M-14 browser zoom now passes, while Safari zoom and H-M06 long-history zoom remain open. Optional enhancements may continue without converting those manual gates into inferred passes. Publication remains a separate explicit decision.

## Next optional enhancement slice

TOAST-270 verification gate — the integrated local and remote build/type/Vitest/183-scenario served-browser/package/pack checks pass. Run the history manual cases. No VoiceOver/zoom pass is inferred from automated checks. TOAST-120 and remote validation of the refreshed TOAST-140-B dependency workflow remain open as above. No next optional feature is scheduled by this slice; persistence/replay/full notification-center work requires a separate scope decision.
