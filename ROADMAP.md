# A11y Toast roadmap

Version: 0.1.0 implementation preview
Status: Core implemented; automated local checks passed; manual accessibility and standard npm-tooling gates open.

## Foundation

| Task | Implementation | Verification / remaining gate |
| --- | --- | --- |
| TOAST-001 Prototype reconciliation | Complete | Current prototype tree inspected; migration dispositions documented. |
| TOAST-010 Standard package foundation | Complete | Portable compiler/types/exports work; online install, tsdown, Vitest and lockfile not verified here. |
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
| TOAST-110 One-page playground | Complete | Real compiled runtime used; content/options/queue/loading/retry/log workflows checked. |

## Verification and release readiness

| Task | Status | Next action |
| --- | --- | --- |
| TOAST-120 Accessibility verification | Partial | Run `docs/MANUAL_TESTS.md` with VoiceOver + Safari and VoiceOver + Chrome; actual browser 200%/400% zoom. |
| TOAST-130 Documentation/metadata | Complete for this preview | Keep synchronized after manual fixes. |
| TOAST-140 Package verification | Partial | Portable build, strict source types, exported declaration consumer, Node imports and local pack passed. Install dependencies online, create/review lockfile, execute tsdown + Vitest + normal served-browser tests, audit dev dependencies. |

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

Manual macOS acceptance of TOAST-120 against the included build. Fix confirmed interaction/announcement findings before beginning an optional add-on. Standard online toolchain checks can run independently when npm access is available. Publication remains a separate explicit decision.
