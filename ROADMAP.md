# A11y Toast roadmap

Version: 0.1.0 implementation preview
Status: Core implemented; user functional acceptance reported; local and GitHub Actions package checks pass. Named VoiceOver/zoom coverage and dependency-lock follow-up remain open.

## Foundation

| Task | Implementation | Verification / remaining gate |
| --- | --- | --- |
| TOAST-001 Prototype reconciliation | Complete | Current prototype tree inspected; migration dispositions documented. |
| TOAST-010 Standard package foundation | Complete | Online install, tsdown build, Vitest, exports, and served-browser workflow pass in GitHub Actions run #1; no lockfile is committed yet. |
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
| TOAST-120 Accessibility verification | Partial | Run `docs/MANUAL_TESTS.md` with VoiceOver + Safari and VoiceOver + Chrome; actual browser 200%/400% zoom. |
| TOAST-130 Documentation/metadata | Complete for this preview | Reconciled with generated-artifact policy and GitHub Actions evidence; keep synchronized after later fixes. |
| TOAST-140 Package verification | Partial | GitHub Actions run #1 passed install, tsdown, typechecks, Vitest, Chromium lifecycle suite, package exports, pack check, and the high-severity audit gate. Remaining: commit/review a lockfile and address or explicitly accept the two moderate Vitest/@vitest-mocker findings. |

Windows NVDA/JAWS and mobile AT are not claimed verified. Record actual environment coverage rather than inferring it from Chromium DOM behavior.

## Optional enhancements

TOAST-200: **Complete** — visual timeout progress add-on; separate JS/CSS exports, no polling loop, pause/resume/update/loading lifecycle synchronization, non-semantic visual output, reduced-motion suppression.
TOAST-210: **Complete** — promise/loading orchestration utility; one retained toast ID, caller-authored success/error copy, late settlement ignored after dismiss/destroy, queue-safe settlement, pass-through promise and explicit stop control.
TOAST-220: **Complete** — explicit key-based deduplication controller; opt-in exact-key matching with update-existing/drop-new/replace-existing policies, same-key serialization, animated-replacement waiting, queue/timer preservation, and no message-text dedupe.
TOAST-230: **Complete** — generic DOM-event adapter; explicit EventTarget/bindings, source-vs-toast announcement ownership, retained correlation IDs, show/update/dismiss commands, duplicate correlated-show update behavior, error isolation, and removable lifecycle cleanup.
TOAST-240: first real ecosystem adapter selected from an actual use case.
TOAST-250: experimental ariaNotify transport evaluation.
TOAST-260: optional GSAP and experimental element-scoped View Transition drivers using the frozen TOAST-180 contract.

A history/notification-center capability is also out of the initial scope. Unimplemented items above are not credited from the old prototype.

## Next unblocked slice

TOAST-140-B: capture and commit a reviewed npm lockfile, then update/reassess the two moderate development-only Vitest/@vitest-mocker audit findings under `npm ci`. TOAST-120 macOS VoiceOver and actual browser zoom remain separate manual acceptance gates. Optional enhancements may continue without converting those manual gates into inferred passes. Publication remains a separate explicit decision.

## Next optional enhancement slice

TOAST-240 — first real ecosystem adapter. Select one existing source package with a clear lifecycle, import its actual exported event constants, build on the TOAST-230 adapter contract, retain correlation IDs, and verify teardown plus single-owner announcement behavior from both sides.
