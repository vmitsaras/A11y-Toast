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
| Runtime lifecycle contract | **77 / 77 pass** | Confirmed again by GitHub Actions run #1 using the normal served-browser Playwright path. Earlier local synthetic-browser evidence was session-local and is not committed to Git. |
| Demo/UI/real-timer checks | **20 / 20 historical local pass** | Earlier local synthetic-document checks exercised actual demo markup/styles/runtime, but their generated JSON/screenshots are intentionally not committed. Manual zoom/AT evidence is still required. |
| Uncaught browser page errors | **0** | GitHub Actions served-browser lifecycle suite. |
| Package exports and DOM-free imports | Pass | `npm run test:package`. |
| Local server response | Pass | Local HTTP request returned 200 for the example and appropriate MIME/CSP headers; this is not browser navigation evidence. |
| Package dry-run | Pass | `npm run pack:check`. |
| Actual local npm archive | Pass | `npm pack --ignore-scripts --pack-destination /mnt/data`; archive entries inspected. |
| Separate consumer install | Pass | Installed the actual tarball using `npm install --offline --ignore-scripts --no-audit --no-fund`; runtime, metadata, package and CSS entries resolved. |
| Standard tsdown build | **Pass** | GitHub Actions run #1, tsdown 0.15.12. |
| Vitest/jsdom command | **Pass** | GitHub Actions run #1: Vitest 3.2.7, 1/1 test passed. |
| Normal served-browser Playwright command | **Pass** | GitHub Actions run #1: Chromium lifecycle suite 77/77, 0 uncaught page errors. |
| Lockfile generation / dependency security audit | **Partial** | Registry install and audit ran in GitHub Actions. No lockfile is committed. Audit reports two moderate dev-only Vitest/@vitest-mocker findings; the high-severity gate passes. |
| Modern Web Guidance CLI retrieval | **Blocked** | CLI search was attempted, but npm could not resolve the registry. W3C/MDN references were reviewed separately. |
| VoiceOver Safari / VoiceOver Chrome | **Pending** | No macOS screen-reader environment. A live-region DOM write is not speech verification. |
| Actual browser 200% / 400% zoom | **Pending** | Narrow-viewport and enlarged-root-text checks passed, but do not prove browser zoom behavior. |
| NVDA/JAWS / mobile screen readers | **Pending** | No corresponding environment used. |

## How browser execution worked

Earlier local evidence used a portable `tsc` build and synthetic-document browser transport because that environment blocked npm/localhost access. Those generated artifacts were not committed. GitHub Actions run #1 now supplies stronger evidence for the standard tsdown build and normal served localhost Playwright path.

The demo checks loaded the actual `examples/basic/index.html`, `demo.css`, `demo.js`, and `dist/styles.css`. External stylesheet/script references were supplied locally instead of through HTTP. This checks DOM behavior and presentation, but is not evidence for normal navigation, CSP enforcement, Safari behavior, assistive-technology speech, or deployment.

The shared lifecycle suite uses a deterministic clock for detailed timer/race coverage. The separate UI suite additionally runs a real one-second browser timeout. The tests are named in the JSON reports; the count does not imply coverage of every possible application integration.

## Behavior exercised

The 77 lifecycle scenarios include repeated and re-entrant initialization, root ownership, strict option normalization, visible/queued updates, immutable event snapshots, safe text rendering, full-queue rejection, FIFO ordering under re-entrant additions, clear without intermediate promotion, timer preservation/reset, overlapping pause reasons, hidden-document handling, announcement ordering/coalescing/cancellation, action retry/cancellation/stale-result guards, add-on setup/cleanup/error isolation, and destruction during observers.

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

## Open acceptance gates

Run `docs/MANUAL_TESTS.md`, beginning with macOS VoiceOver in Safari and Chrome and actual browser zoom. Fix confirmed announcement/focus findings before enabling an optional integration. TOAST-120 remains partial until VoiceOver and actual browser zoom evidence exists. TOAST-140 remains partial only for dependency reproducibility/cleanup: commit and review `package-lock.json`, switch CI to `npm ci`, and reassess the two moderate Vitest/@vitest-mocker findings.

No npm publication or Git tag was performed. Repository commits now include the implementation, verification workflow, and synchronized documentation.
