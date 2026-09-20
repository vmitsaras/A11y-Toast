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

## Verification and release readiness

| Task | Status | Next action |
| --- | --- | --- |
| TOAST-120 Accessibility verification | Partial | Run `docs/MANUAL_TESTS.md` with VoiceOver + Safari and VoiceOver + Chrome; actual browser 200%/400% zoom. |
| TOAST-130 Documentation/metadata | Complete for this preview | Reconciled with generated-artifact policy and GitHub Actions evidence; keep synchronized after later fixes. |
| TOAST-140 Package verification | Partial | GitHub Actions run #1 passed install, tsdown, typechecks, Vitest, Chromium lifecycle suite, package exports, pack check, and the high-severity audit gate. Remaining: commit/review a lockfile and address or explicitly accept the two moderate Vitest/@vitest-mocker findings. |

Windows NVDA/JAWS and mobile AT are not claimed verified. Record actual environment coverage rather than inferring it from Chromium DOM behavior.

## Optional enhancements — not started

TOAST-200: visual timeout progress add-on.
TOAST-210: promise/loading orchestration add-on.
TOAST-220: explicit key-based deduplication policy.
TOAST-230: generic DOM-event adapter with explicit announcement ownership.
TOAST-240: first real ecosystem adapter selected from an actual use case.
TOAST-250: experimental ariaNotify transport evaluation.
TOAST-260: optional View Transition / injected GSAP animation adapters.

A history/notification-center capability is also out of the initial scope. None of the above should be marked implemented because the old prototype had something similar.

## Next unblocked slice

TOAST-140-B: capture and commit a reviewed npm lockfile, then update/reassess the two moderate development-only Vitest/@vitest-mocker audit findings under `npm ci`. TOAST-120 macOS VoiceOver and actual browser zoom remain separate manual acceptance gates. Do not begin optional add-ons until confirmed core accessibility findings are resolved. Publication remains a separate explicit decision.
