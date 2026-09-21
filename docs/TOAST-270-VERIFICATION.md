# TOAST-270 verification record

Date: 2026-09-20, updated 2026-09-21. Base commit: `353b27ea7c4fcc313875d0f7e94ed3c12c40291a` (successful Verify run 35534512515). The delivered TOAST-270 commit `1c6edc66ee18704b54215c86582501598b3b6e36` subsequently passed Verify run 35579571709. No tag or publication was performed.

## Executed evidence

| Check | Result / scope |
| --- | --- |
| Baseline identity | Reconstructed core module files and public index matched their Git blob SHA-1 values from the linked commit. |
| Strict TypeScript and portable declaration emit | Passed using TypeScript 5.8.3 with strict, noUncheckedIndexedAccess, isolatedModules, verbatimModuleSyntax and ES2022/DOM options. This is not a tsdown build. |
| Targeted public declaration consumer | Passed against emitted declarations, including readonly collections/nested snapshots, absent replay/callback surface and numeric capacity. |
| Targeted Node ESM import | Passed for the new public history subpath and unchanged core index without document/window initialization; history is not re-exported by core. This used a temporary minimal package export fixture, not the full repository package test. |
| H01–H25 real-code browser scenarios | **25/25 passed**, Chromium **144.0.7559.96**, Linux. Compiled ESM loaded using Blob URLs in a synthetic document; only relative import URL specifiers were rewritten. |
| Inspector DOM checks | **4/4 passed**: text-only/non-live/no replay UI, explicit refresh, focus preservation/clear independence, core teardown cleanup. |
| Uncaught page errors | **0** in the targeted 29-check run. |

The delivered evidence file is `evidence/history-offline.json` in the patch bundle. Reproduce locally after a build with `python scripts/verify-history-offline.py`. A complete checkout with its normal dependencies is required for the standard build and test scripts.

The targeted suite covers default/range validation, immutable entries, late attachment/no backfill, FIFO eviction, clear independence, queue promotion and overflow semantics, instance isolation, duplicate attachment, unregister/destroy/replacement, stopped destroy-event propagation, re-entrant callbacks, animated exits/slot ownership, timer expiry, 5,000 updates at bounded capacity, 100 attach/destroy cycles, late action settlement, and absence of storage/network/polling work.

## Integrated local verification

On 2026-09-21, the patch was applied to the declared baseline and the repository's normal local verification commands passed: tsdown build, strict typecheck, all 6 Vitest files and 23 tests, all 183 served-browser scenarios with 0 uncaught page errors, the package import checks, and `npm pack --dry-run`. The pack check used a temporary npm cache because the user's default npm cache was not writable. GitHub Actions run 35579571709 then passed installation, build, source and declaration-consumer typechecks, Vitest, Chromium installation, all 183 served-browser scenarios, package exports, package contents, and the configured audit gate for commit `1c6edc66ee18704b54215c86582501598b3b6e36`.

The updated full offline-browser loader is wired for the expanded ESM graph but was not executed against the complete repository in this environment. The older `verify-offline-demo.py` loader already assumes only the original core modules and is not evidence for the modern multi-add-on demo. This slice provides a separately tested targeted ESM inspector runner; full demo acceptance uses the standard served workflow.

VoiceOver, Safari, NVDA, actual browser zoom, touch/mobile assistive technology, heap/GC profiling and measured screen-reader speech were not tested. Automated focus/DOM checks do not substitute for them. No broader WCAG conformance claim is made.

## Maintainer integration gate

```sh
npm run build
npm run typecheck
npm test
npm run test:browser
npm run test:package
npm run pack:check
```

Also run the repository's declaration-consumer command from its workflow. Install dependencies with the tracked lockfile through `npm ci`. Do not publish as part of verification.

## Manual acceptance — pending

| ID | Action | Expected | State |
| --- | --- | --- | --- |
| H-M01 | Show a toast, open Notification history, select Refresh history with VoiceOver + Chrome and VoiceOver + Safari separately. | The disclosure and buttons are understandable. Historical rows are readable on demand, not replayed through a live region; focus stays on the invoked control. | Pending |
| H-M02 | Show → update → dismiss one toast; refresh history. | Three separately labeled lifecycle entries; dismissed toast remains readable as text. No replay/Undo button appears in history. | Pending |
| H-M03 | Keep a toast visible and activate Clear history. | The history list empties, empty state is discoverable, Clear retains keyboard focus, and the active toast is unchanged. | Pending |
| H-M04 | Inspect a queued update, queue overflow, and promotion. | Queued is not misrepresented as shown; rejected input does not become a show entry; promotion shows the latest real content. | Pending |
| H-M05 | Exceed 50 history events in the default demo, refresh, then reload or recreate the manager. | At most 50 entries; oldest observations are evicted; reload/recreation starts empty. | Pending |
| H-M06 | Navigate a long history at narrow widths and actual 200%/400% browser zoom. | Controls/text remain usable; no loss of essential content; no automatic reading-position reset. | Pending |

TOAST-270 is **implemented with targeted, integrated local, and remote CI automated evidence; named manual acceptance is still open**. TOAST-260A/B stay complete; TOAST-260C stays complete and experimental. No new optional feature number is invented. The next action is the six manual history cases alongside the already-open TOAST-120 gate and remote validation of the refreshed TOAST-140-B dependency workflow.
