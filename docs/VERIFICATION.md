# Verification — a11y-toast 0.1.0 preview

Date: 2026-09-20  
Overall status: **Partially verified — core/package automation passes online; manual accessibility and reproducible dependency-lock gates remain open.**

The TypeScript core, default CSS, single demo, typed event/add-on contracts, and package build configuration exist. GitHub Actions now verifies the standard npm-dependent toolchain. Actual assistive-technology output and a committed/reviewed dependency lock remain open gates.

## Environment

| Item | Observed environment |
| --- | --- |
| OS | Linux container |
| Node | 22.16.0 |
| npm | 10.9.2 |
| TypeScript | 5.8.3, preinstalled compiler |
| Browser | Chromium 144.0.7559.96, headless |
| Browser driver | Preinstalled Python Playwright |
| Network restriction | npm registry DNS requests failed (`EAI_AGAIN`). |
| Browser navigation restriction | The managed Chromium environment rejected localhost HTTP navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. |

Neither restriction was treated as evidence that the package itself failed. Neither was silently converted into a passing test.

## GitHub Actions online verification

Latest TOAST-260C element-View-Transition run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35529049640  
Commit: `e938ecf1758fc1b2117bc7446b41709b395243bc`  
Result: **success** — install/build/type/Vitest/served-browser/package/audit workflow completed with **158 / 158 browser scenarios and 0 uncaught page errors**. Vitest has **6 files / 23 tests passing**, including **4 dedicated element-scoped View Transition tests**. Scenarios 152–158 verify per-toast element scoping with no document fallback, exact temporary-state restoration, unsupported-browser no-motion behavior, aborted entrance→serialized exit, exit queue-slot retention, reduced-motion API bypass, and a real-browser native-or-clean-fallback probe. Iteration also exposed and fixed same-element phase overlap and browser transition finalization/style-residue issues; the final design uses temporary data attributes/CSS rather than inline motion styles.

Latest TOAST-260B GSAP-Flip run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35525369768  
Commit: `ee404019d1a3b58a7eb0aa92350ee86319463e7f`  
Result: **success** — install/build/type/Vitest/served-browser/package/audit workflow completed with **151 / 151 browser scenarios and 0 uncaught page errors**. Vitest has **5 files / 19 tests passing**, including **3 real GSAP Flip integration tests**. Scenarios 145–151 verify explicit plugin injection/no globals, capture-before-insert survivor targeting, sibling-only update reflow, exit/queue-promotion deferral, synchronous coalescing, reduced-motion measurement skip, and teardown cleanup. Verification found and fixed three integration issues: Flip's class-valued plugin shape, the npm default import shape, and Flip measurement/finalization side effects that could otherwise leave an empty inline-style attribute.

Latest TOAST-260A GSAP-driver run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35523136798  
Commit: `414e1f2db8bbb2d21f2608768b9d6cb92ccdf5df`  
Result: **success** — install/build/type/Vitest/served-browser/package/audit workflow completed with **144 / 144 browser scenarios and 0 uncaught page errors**. Vitest has **4 files / 16 tests passing**, including **5 real-GSAP integration tests** against GSAP 3.15.0. Scenarios 139–144 verify caller injection/no global lookup, logical direction/configuration, entrance abort→revert before exit, queue blocking until GSAP exit completion, onInterrupt→animation-error without lifecycle stranding, and core reduced-motion skip. The first integration run exposed an empty `style=""` residue after GSAP revert; the driver now restores the exact pre-animation style attribute and the final run passes.

Latest TOAST-250 experimental transport run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35518826673  
Commit: `bed4b5ebf9f59c351ea62446ad30c8aa0d0cc4df`  
Result: **success** — install/build/type/Vitest/served-browser/package/audit workflow completed with **138 / 138 browser scenarios and 0 uncaught page errors**. Vitest has **3 files / 11 tests passing**, including **4 dedicated ariaNotify transport tests**. Scenarios 133–138 verify custom transport routing without live-region double write, assertive priority preservation, transport-error isolation, scheduler coalescing, priority-off bypass, and a real-browser ariaNotify/native-or-fallback probe.

Latest TOAST-240 ecosystem-adapter run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35517848474  
Commit: `2c462d4c5cfdc931e439c045a781ef05429c4161`  
Result: **success** — install/build/type/Vitest/served-browser/package/audit workflow completed. The existing browser contract remains **132 / 132 with 0 uncaught page errors**; Vitest now has **2 files / 7 tests passing**, including **6 dedicated integration tests** against the installed `a11y-menu-button@1.0.1` event contract. Integration coverage verifies source-owned loading, retained-ID error/empty transitions, ready dismissal, source status-text mirroring, source-core destroy cleanup, toast destroy listener cleanup, and foreign-root event rejection.

Latest TOAST-230 DOM-event adapter run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35514748831  
Commit: `d904362e3b7d610a352a51430f9c07a5a161678c`  
Result: **success** — build/type/Vitest/served-browser/package/audit workflow completed with **132 / 132 browser scenarios and 0 uncaught page errors**. Scenarios 122–132 verify source-owned priority suppression, toast-owned announcement preservation, correlation update/dismiss tracking, duplicate correlated-show update behavior, unknown-correlation no-ops, mapper error isolation, adapter/toast teardown, queued correlation updates, and fail-before-listener invalid configuration.

Latest TOAST-220 dedupe run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35514207055  
Commit: `82b9d7df79afdfa6129429ff0d3ce74e12174f37`  
Result: **success** — build/type/Vitest/served-browser/package/audit workflow completed with **121 / 121 browser scenarios and 0 uncaught page errors**. Scenarios 111–121 verify update-existing ID/queue/timer preservation, drop-new silence, animated replace waiting, queued replacement ordering, exact trimmed/case-sensitive keys, strict policy validation, same-key serialization, controller stop behavior, queue rejection, and external same-key re-entry adoption.

Latest TOAST-210 promise run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35512717706  
Commit: `d3c1677a2aba475c622096db3266b4f83d58f5f1`  
Result: **success** — build/type/Vitest/served-browser/package/audit workflow completed with **110 / 110 browser scenarios and 0 uncaught page errors**. Scenarios 102–110 verify retained-ID loading→success, safe rejection copy, dismiss/destroy late-settlement guards, queued settlement, progress composition, explicit stop semantics, pre-show option validation, and full-queue null-ID pass-through.

Latest TOAST-200 progress run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35511533987  
Commit: `f857a9bbf13901801d19370ef21984e7beeeb97c`  
Result: **success** — build/type/Vitest/served-browser/package/audit workflow completed with **101 / 101 browser scenarios and 0 uncaught page errors**. Scenarios 95–101 verify timed-only/non-semantic rendering, queue promotion, pause/resume synchronization, timed↔persistent updates, loading→success, unregister cleanup, and adoption of an already-visible timed toast. Package checks also verify the separate progress JS/declaration/CSS exports.

Latest TOAST-190 hardening run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35510590024  
Commit: `2d614f5d3a5dc5f39e66f7fe7f8ba94bcc577a91`  
Result: **success** — build/type/Vitest/served-browser/package/audit workflow completed with **94 / 94 browser scenarios and 0 uncaught page errors**. Scenarios 87–94 verify re-entrant dismissal from animation-start, destroy from animation-error/end, existing-waiter priority during re-entrant show, atomic multi-exit `dismissAll()`, hidden-document entrance/exit cancellation, and one-slot-per-exit queue release.

Latest animation run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35509599017  
Commit: `fa8be967470b93570b1e7054dff651de6627b7e1`  
Result: **success** — build/type/Vitest/served-browser/package/audit workflow completed with **86 / 86 browser scenarios and 0 uncaught page errors**. New scenarios 80–86 verify default/invalid animation configuration, timer-after-enter semantics, logical-vs-visual dismissal, exit slot reservation, destroy cancellation, driver failure isolation, reduced-motion skip, and a real CSS entrance/exit path.

Latest hardening run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35508081717  
Commit: `67c0ab16f1f5de49e38f0397c17e110ce66e87b3`  
Result: **success** — install, tsdown build, source/public typechecks, Vitest, Playwright Chromium, served-browser lifecycle suite, package exports, pack check, and audit gate all completed. The suite passed **79 / 79 scenarios with 0 uncaught page errors**. Scenario 78 now verifies that `showToneLabel: false` keeps the tone out of visible layout while leaving the node out of neither the DOM nor accessibility tree contract; scenario 79 verifies invalid data tokens fall back safely and explicit options take precedence.

Previous feature run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35506878112  
Commit: `c46aec739d01c02e701d35247c99255476c47b82`  
Result: **success** — build/type/Vitest/served-browser/package/audit workflow completed, with **79 / 79 browser scenarios and 0 uncaught page errors**. Scenarios 78–79 cover default/hidden tone-label rendering, unchanged announcement wording, strict data-attribute parsing, and explicit-option precedence.

Run #1: https://github.com/vmitsaras/A11y-Toast/actions/runs/35505043448  
Commit: `793063f03002e6b490a989a07d6e9512373fc16f`  
Runner: Ubuntu 24.04 / Node 22.23.2 / npm 10.9.8.

The run completed successfully and executed: `npm install`, tsdown build, runtime-source typecheck, public declaration-consumer typecheck, Vitest, Playwright Chromium installation, the normal served-browser lifecycle suite, package export checks, `npm pack --dry-run`, and `npm audit --audit-level=high`.

Observed results:
- tsdown 0.15.12 built `dist/index.js` at 35.81 kB (8.91 kB gzip) plus declarations/maps/docs output;
- Vitest 3.2.7: 1 test file / 1 test passed;
- served-browser lifecycle suite: **77 / 77 passed, 0 uncaught page errors**;
- package export check passed;
- dry-run package: 13 files, 46.8 kB packed / 167.6 kB unpacked;
- audit gate passed at the configured high-severity threshold, but npm reported **2 moderate development dependency vulnerabilities** through Vitest/@vitest-mocker;
- there are no runtime dependencies;
- `npm install` created an ephemeral runner lockfile, but **no `package-lock.json` is committed**, so reproducible lockfile verification remains open.

## Evidence summary

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Portable ESM/declaration/source-map/CSS build | Pass | `npm run build:portable`, using the actual TypeScript compiler. |
| Strict runtime-source typecheck | Pass | `npm run typecheck`. |
| Public declaration-consumer typecheck | Pass | Strict `tsc` check of `test/consumer.ts`, including expected errors for invalid priority and snapshot mutation. |
| Runtime lifecycle contract | **158 / 158 pass** | Latest hardening run confirms the normal served-browser Playwright path, including visual suppression without removal from the accessibility-tree contract and strict option parsing. Earlier local synthetic-browser evidence was session-local and is not committed to Git. |
| Demo/UI/real-timer checks | **20 / 20 historical local pass** | Earlier local synthetic-document checks exercised actual demo markup/styles/runtime, but their generated JSON/screenshots are intentionally not committed. Manual zoom/AT evidence is still required. |
| Uncaught browser page errors | **0** | GitHub Actions served-browser lifecycle suite. |
| Package exports and DOM-free imports | Pass | `npm run test:package`. |
| Local server response | Pass | Local HTTP request returned 200 for the example and appropriate MIME/CSP headers; this is not browser navigation evidence. |
| Package dry-run | Pass | `npm run pack:check`. |
| Actual local npm archive | Pass | `npm pack --ignore-scripts --pack-destination /mnt/data`; archive entries inspected. |
| Separate consumer install | Pass | Installed the actual tarball using `npm install --offline --ignore-scripts --no-audit --no-fund`; runtime, metadata, package and CSS entries resolved. |
| Standard tsdown build | **Pass** | GitHub Actions run #1, tsdown 0.15.12. |
| Vitest/jsdom command | **Pass** | Latest TOAST-260C run: 6 test files / 23 tests passed, including 6 A11y Menu Button integration tests, 4 ariaNotify transport tests, 5 real-GSAP driver tests, 3 real-Flip layout tests, and 4 dedicated element-scoped View Transition tests. |
| Normal served-browser Playwright command | **Pass** | GitHub Actions run #1: Chromium lifecycle suite 77/77, 0 uncaught page errors. |
| Lockfile generation / dependency security audit | **Partial** | Registry install and audit ran in GitHub Actions. No lockfile is committed. Audit reports two moderate dev-only Vitest/@vitest-mocker findings; the high-severity gate passes. |
| Modern Web Guidance CLI retrieval | **Blocked** | CLI search was attempted, but npm could not resolve the registry. W3C/MDN references were reviewed separately. |
| VoiceOver Safari / VoiceOver Chrome | **Pending** | No macOS screen-reader environment. Neither a live-region write nor an ariaNotify call/event is speech verification. |
| Actual browser 200% / 400% zoom | **Pending** | Narrow-viewport and enlarged-root-text checks passed, but do not prove browser zoom behavior. |
| NVDA/JAWS / mobile screen readers | **Pending** | No corresponding environment used. |

## How browser execution worked

Earlier local evidence used a portable `tsc` build and synthetic-document browser transport because that environment blocked npm/localhost access. Those generated artifacts were not committed. GitHub Actions run #1 now supplies stronger evidence for the standard tsdown build and normal served localhost Playwright path.

The demo checks loaded the actual `examples/basic/index.html`, `demo.css`, `demo.js`, and `dist/styles.css`. External stylesheet/script references were supplied locally instead of through HTTP. This checks DOM behavior and presentation, but is not evidence for normal navigation, CSP enforcement, Safari behavior, assistive-technology speech, or deployment.

The shared lifecycle suite uses a deterministic clock for detailed timer/race coverage. The separate UI suite additionally runs a real one-second browser timeout. The tests are named in the JSON reports; the count does not imply coverage of every possible application integration.

## Behavior exercised

The 158 browser lifecycle scenarios include animation-driver, interruption, reduced-motion, CSS/GSAP/element-scoped View Transition exit behavior, GSAP Flip stack reflow, re-entrant observer, multi-exit batch, hidden-document cancellation, ordered queue-release, progress add-on, promise orchestration, key deduplication, generic DOM-event adapter, and announcement-transport coverage. A separate six-test Vitest integration suite now exercises the real A11y Menu Button async-state ecosystem adapter in addition to the earlier core cases. The original core scenarios include repeated and re-entrant initialization, root ownership, strict option normalization, visible/queued updates, immutable event snapshots, safe text rendering, full-queue rejection, FIFO ordering under re-entrant additions, clear without intermediate promotion, timer preservation/reset, overlapping pause reasons, hidden-document handling, announcement ordering/coalescing/cancellation, action retry/cancellation/stale-result guards, add-on setup/cleanup/error isolation, and destruction during observers.

Focus coverage includes preserving focus on show, retaining focused controls during content updates, removing/replacing a focused action, returning to a surviving origin, and showing a focusable empty notification region when no origin remains.

The 20 demo/UI checks include labeled form fields, a non-live event history, show/close, a three-visible/two-queued batch, loading-to-success update on the same ID, retry after an action error, logical placement and RTL mirroring, reduced-motion and forced-colors emulation, 320px page/toast width checks, an enlarged-root-font smoke test, and real-time expiry.

## Confirmed issues fixed during verification

- Lifecycle observers could destroy the manager during an intermediate callback. Follow-up action, timer, focus and abort paths now re-check ownership before proceeding.
- Removing the last focused toast after its origin disappeared needed a visible focus fallback. An empty named notification region now remains available until focus leaves.
- Action self-updates, replacement, dismissal and destruction must invalidate stale promise settlements without running callbacks twice or fabricating success.
- Add-on observer promises and malformed asynchronous setup failures needed isolation from the core lifecycle.
- Demo controls that become disabled after their own action now move focus deliberately to the next usable control.
- At narrow widths with enlarged root text, the demo had min-content grid/flex overflow. Scoped layout corrections were followed by a passing rerun.
- One initial test clicked a hidden optional action rather than the close button. The test selector was corrected; that fixture issue was not recorded as a runtime defect.
- Animation settlement could continue after an `animation-error` or `animation-end` observer synchronously destroyed the manager. Settlement now stops at the destroyed boundary; batch/visibility regressions confirm no stale queue promotion or completion work.

## Reproduce the ordinary workflow on an online development machine

```sh
npm install
npm run build
npm run typecheck
npx tsc --strict --noEmit --target ES2022 --module ESNext --moduleResolution Bundler test/consumer.ts
npm test
npx playwright install chromium
npm run test:browser
npm run test:package
npm run pack:check
```

Capture and review the resulting lockfile and dependency audit. Do not assume those steps passed because the portable build passed here.

## Reproduce the offline browser evidence

With a TypeScript compiler, Python Playwright and Chromium already installed:

```sh
npm run build:portable
npm run typecheck
python scripts/verify-offline-browser.py
python scripts/verify-offline-demo.py
npm run test:package
```

`CHROMIUM_EXECUTABLE` can select a browser. Both Python scripts exit non-zero on a failing scenario or uncaught page error. They write new JSON reports and demo screenshots into `test-results/`; they do not overwrite this delivery's evidence automatically. These helpers expect the modular portable build, not an arbitrary bundler output layout.

## Package inspection

The npm archive contains `dist`, README, changelog, license, and `package.json`. It has no runtime dependencies and contains no development dependency tree, credentials, demo fixtures, or publication action. The source ZIP additionally includes source, tests, the one-page example, scripts, roadmap, contract, migration notes and this evidence.

The standard `prepack` script invokes tsdown. For this restricted environment, the already-built portable distribution was packed explicitly with `--ignore-scripts`. The actual resulting archive was installed offline in a separate consumer and checked. This verifies that specific archive, not the unrun tsdown/prepack pipeline.

## User acceptance

The user reported the plugin tested, working, and verified on 2026-09-20. The exact manual browser/assistive-technology matrix was not specified, so this is recorded as functional acceptance and does not replace the named VoiceOver/zoom rows below.

## Open acceptance gates

Run `docs/MANUAL_TESTS.md`, beginning with macOS VoiceOver in Safari and Chrome and actual browser zoom. Fix confirmed announcement/focus findings before enabling an optional integration. TOAST-120 remains partial until VoiceOver and actual browser zoom evidence exists. TOAST-140 remains partial only for dependency reproducibility/cleanup: commit and review `package-lock.json`, switch CI to `npm ci`, and reassess the two moderate Vitest/@vitest-mocker findings.

No npm publication or Git tag was performed. Repository commits now include the implementation, verification workflow, and synchronized documentation.
