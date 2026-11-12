# Verification — a11y-toast 1.0.0 unpublished release candidate


## Local release-preparation review — 2026-11-12

Reviewed the cumulative 1.0.0 working-tree changes: package/lockfile and consumed changesets, core lifecycle fixes, DOM-event and promise helpers, showcase/advanced/gallery routes, fifteen optional skins, generated Pages artifacts, documentation synchronization and completed-plan cleanup. Independent runtime and demo/CSS reviews found one blocking same-key DOM-event feedback loop. Shared scenarios 125f–125g reproduced the defect before the fix; the adapter now accepts at most 100 commands per synchronous same-key transaction, clears pending work and reports once on overflow, blocks reporter re-entry, permits later-event recovery and preserves teardown ownership. Independent review of the guard found no remaining blocker.

Fresh local evidence for the reviewed preparation:

| Check | Result |
| --- | --- |
| Standard tsdown build and Pages generation | Pass; no portable fallback. |
| Source and both public declaration-consumer typechecks | Pass. |
| Vitest unit/integration tests | Pass: 6 files / 23 tests. |
| Served Chromium lifecycle, showcase, gallery and skins checks | Pass: 335/335, 0 uncaught page errors. |
| Package imports/exports and pack dry run | Pass: 1.0.0, 86 package files. |
| Current online moderate-threshold dependency audit | Pass: 0 vulnerabilities. |
| Package/lockfile/version/license consistency, bounded credential-pattern scan, local documentation links and whitespace | Pass. |

This records preparation for the user-authorized local commit. Manual VoiceOver, actual zoom for the current layouts, native touch/pinch zoom and final-revision remote CI remain open. No npm publication, Git tag or push was performed. Earlier records below retain their original versions, counts and no-commit status as historical evidence.



## Documentation synchronization — 2026-11-12

Compared the README, docs metadata, migration/history guides, example README and contract with current source, package exports, CSS and shared tests. Corrected stale claims about unshipped adapters and deferred promise orchestration, the removed basic history-inspector path, pending gallery automation and initial-display evidence. Added post-publication npm/pnpm/yarn commands, swipe JS/CSS setup, add-on timer-hold ownership, native keyboard behavior and generated styling hooks. The inferred docs metadata now includes explicit class construction and timer-hold context guidance; no new interface, runtime API, dependency or version change was introduced. Migration guidance separates the original reconciliation from currently implemented optional exports.

Verification: standard tsdown/Pages build, source typecheck, both public declaration consumers, Vitest **6 files / 23 tests**, Chromium **333/333 checks with 0 uncaught page errors**, package imports/exports and **86-file** pack dry run pass. Docs identity/install/export/example-path checks pass, as do all **14 relative Markdown links** and `git diff --check`. Independent API/accessibility and CSS/usage reviews found no remaining blocker in the documentation delta. The initial ad-hoc metadata check used an incorrect subpath lookup without the required `.` prefix; correcting the check passed without any package change. Audit, manual screen-reader/zoom/native-touch acceptance and final-revision remote CI were not run for this docs-only pass. Existing working-tree changes and previously recorded gates remain preserved; no commit, tag, push or publication occurred.



## Version target 1.0.0 — 2026-11-12

Updated the unpublished release target from 0.2.0 to **1.0.0** by explicit user request. Package metadata, both npm lockfile root version fields, current README/roadmap/task/contract references, changelog heading, source docs metadata, active plans, authored demo metadata/version labels and regenerated Pages/dist declarations and source maps agree on 1.0.0. Version/dependency assertions confirm that the dependency graph is unchanged. No new changeset was created; the two previously consumed changesets remain consumed.

Local checks rerun after the version update: standard tsdown/Pages build, source typecheck, both strict public declaration consumers, Vitest **6 files / 23 tests**, Chromium **333/333 checks with 0 uncaught page errors**, package imports/exports, pack dry run and `git diff --check` all pass. Pack metadata identifies `a11y-toast@1.0.0` with 86 files; no archive was created. The writable temporary npm cache was used for packing. Dependency audit was not rerun for this version-only change; earlier audit results remain dated evidence.

Historical verification records below retain the versions and task baselines they actually checked. Their older version/status wording is superseded by this version update for the current release target. Manual accessibility acceptance, final-revision remote CI and a clean release commit remain open. No commit, publication, tag or push was performed.


## Reusable skins and design gallery — 2026-11-12

**Implemented and locally verified; manual acceptance and final-revision remote CI remain open.** Fifteen optional CSS exports load independently after the base stylesheet and scope to their matching root class. The third authored/generated route shows fifteen static, readable samples and one explicitly activated persistent polite preview. Dedicated classic previews moved out of the advanced lab; existing composer presets remain. Instructions, download links and copied examples match the selected skin, tone and action setting.

Environment: Darwin arm64, Node 24.21.0, npm 12.2.0, Chromium 153.0.8010.12. Existing uncommitted work was preserved; no commit, push, tag or publication occurred. Core runtime files, public types, base stylesheet and package lock are byte-identical to the task baseline. Version remains 0.2.0; no runtime dependency or JavaScript API/default changed.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Standard build | Pass | `npm run build`: tsdown 0.15.12, declarations/assets and all three Pages routes. Final log: `/private/tmp/a11y-toast-designs-final-build.log`. No portable fallback. |
| Source/public types | Pass | `npm run typecheck`; strict ES2022/Bundler declaration consumers `test/consumer.ts` and `test/history-consumer.ts`. |
| Unit tests | Pass | `npm test`: six files / 23 tests. |
| Full served-browser suite | Pass | `node scripts/browser-test.mjs`: **333/333**, zero uncaught page errors. Retains the previous 257 core/lab/showcase checks, adds 28 authored/generated gallery checks and 48 isolated real-renderer skin checks. Generated report: `test-results/browser.json`; log: `/private/tmp/a11y-toast-designs-browser.log`. |
| Independent skin prerequisites and geometry | Pass | `scripts/skins-test.mjs` uses actual `createToast` with base CSS plus only the selected skin. Fifteen skins × six tones × all eight title/icon/action combinations × both action layouts × 288/576px containers = **2,880** geometry cases; **360** additional enlarged-text RTL cases include hidden tone labels. Native targets remain at least 44×44px; no horizontal toast/host overflow or out-of-bounds visible controls. |
| Contrast, focus and forced colors | Pass within scope | **180** complete real-renderer samples checked in normal colors and again under forced-color emulation. Text/control contrast is at least 4.5:1, decorative icon contrast at least 3:1; focused action/close outlines remain visible with at least 3:1 contrast. Forced system text/background/border/Highlight colors survive skin specificity. Custom host palette overrides need their own checks. |
| Root isolation | Pass | Default plus fifteen skinned managers coexist. Default/minimal computed styles remain unchanged when all skins load; each skin matches its isolated stylesheet presentation. |
| Gallery behavior and assets | Pass | Authored `/examples/designs/` and generated `/docs/designs/`: no initial manager/toast/announcement; selection alone leaves current toast unchanged; explicit Show/Try replaces it; same-ID action, action-removal/Close focus recovery, retained result, downloads and all three navigation paths pass. Local CSS/script/logo assets return 200. |
| Copied setup | Pass | All fifteen selected HTML/JavaScript recipes execute in isolated pages with base plus individual skin CSS, without gallery CSS. Matching host class, content, action and origin recovery work under the unchanged strict server CSP. The SVG helper is self-contained. No inline-style or data-module CSP exemption was added. |
| Clipboard and ownership | Pass within scope | Denied clipboard access leaves selected/focused code and explanatory feedback. Its empty live region remains rendered before the first update. A pending clipboard completion cannot write feedback after departure. Synthetic persisted/non-persisted pagehide retains or tears down the manager and handlers. This does not qualify real browser-history/BFCache behavior. |
| Responsive/visual review | Pass within scope | Both gallery routes at 1280/375/320px; two columns on desktop and one on narrow screens; open instructions, enlarged RTL root text, reduced motion and forced colors checked. Desktop/narrow/forced screenshots inspected, including the distinct preview treatments. Root-text resizing is not browser zoom. Artifacts: `test-results/designs-{authored,pages}-{1280,375,320}.png` and `test-results/designs-forced-{authored,pages}.png`. |
| Package/pack | Pass | Fifteen CSS exports resolve to readable distribution files; each has no external asset/stylesheet prerequisite. DOM-free ESM imports, declarations, optional entries and zero runtime dependencies pass. `pack:check`: **86 files**, 134.1kB packed / 527.5kB unpacked, using `/private/tmp/a11y-toast-designs-pack-cache`; no archive/publication. |
| Independent review | Pass after fix | Review found the empty copy status was hidden before its first update; reproduced, fixed and regression-covered. Scoped re-review found no outstanding actionable defect in the fix, matching snippets, durable skin tests or footer placement. Review report: `/private/tmp/a11y-toast-designs-review.md`. |
| Install/audit | Not rerun for this slice | No dependency graph changes. Lock SHA-256 remains `7ebd6c97886c0a3313a55730f12ffc966970677d8cb702d661377703eb765cfe`; the preceding fresh-install/zero-vulnerability audit below is dated evidence, not a new audit claim. |
| Manual/platform acceptance | Not run | G-M01–G-M06 remain manual: VoiceOver/Safari/Chrome speech and interaction, actual browser zoom, native touch and platform history behavior. No WCAG-conformance or speech-delivery claim is inferred from these checks. Exact-revision remote CI was not run; no push authorized. |

Regression evidence: the export/route checks initially failed because the collection did not exist. Browser checks then caught shared shell focus overriding a solid skin's outline (1.01:1 contrast); lowering shell specificity restored skin focus. Action-footer initially became a side action under a wide inline request; a real-renderer RED reproduced it, and the skin now deliberately retains its footer row. Review's empty copy-region failure was reproduced before the fix. Those checks pass against the delivered files.

A supplementary source-CSS probe also passed 11,520 static layout combinations; the maintained actual-renderer tests above are the regression path. All test reports/screenshots remain ignored generated artifacts. See `docs/CONTRACT.md` for maintained behavior and `docs/MANUAL_TESTS.md` for unverified acceptance.


## Showcase, advanced lab and lifecycle fixes — 2026-11-12

**Implemented and locally verified; final-revision remote CI and manual acceptance remain open.** The public route now contains four explicit success/Undo/loading/retry examples, retained non-live results, reset and a short usage snippet. The existing controls, note/ownership recipes, classic previews, animation effects, history and diagnostics live in the advanced lab. Both authored routes and generated Pages routes use one neutral shell. Package version, public API, core defaults and runtime dependencies are unchanged.

Environment: macOS/Darwin arm64, Node 24.21.0, npm 12.2.0, Chromium 153.0.8010.12. Existing working-tree edits were preserved; no commit, push, tag or publication was performed.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Test-first lifecycle repairs | Pass | Eight expected shared regressions failed before the core fixes; all passed after repair. Eleven scenarios were added: 81a–81i cover initial display/entrance eligibility, overlapping API pause and terminal callbacks; 105a–105b cover synchronous initial promise dismissal/destruction, zero residual subscriptions and ignored late settlement. |
| Standard build | Pass | `npm run build` uses tsdown 0.15.12, declaration/asset generation and the two-route Pages generator. The portable fallback was not used. |
| Source and public declarations | Pass | Source `npm run typecheck` and strict public consumers for `test/consumer.ts` and `test/history-consumer.ts`. |
| Unit tests | Pass | `npm test`: six files / 23 Vitest tests, including the expanded shared behavioral suite. |
| Served-browser integration | Pass | `npm run test:browser`: **257/257**, zero uncaught errors. Existing core/lab coverage is retained, with authored/generated showcase interaction, refusal feedback, result retention, reset, lifecycle cleanup and navigation checks. `test-results/browser.json` is generated evidence and ignored by Git. |
| Layout and visual checks | Pass within scope | Main routes checked at 1280/768/375/320px; both lab routes with every disclosure open at 1280/375/320px and 200% root text at 320px have no horizontal page overflow. Reduced-motion and forced-colors checks preserve focus/controls. Desktop/narrow screenshots were inspected. Root-text resizing is not browser zoom. |
| Page lifecycle | Pass within scope | Synthetic persisted/non-persisted `pagehide` checks preserve the cached manager or dispose owned work/listeners. These are event-contract checks, not actual browser-history/BFCache qualification. |
| Package and pack | Pass | DOM-free ESM imports, exports, declarations, optional entrypoints and zero runtime dependencies pass. Pack dry-run contains 71 intended files; a task-local npm cache avoids the pre-existing default-cache permissions issue. |
| Fresh installation | Pass | Isolated snapshot: `npm ci --no-fund --cache /private/tmp/a11y-toast-clean-install-cache-20261112` installed 219 packages and audited 220 with zero vulnerabilities. Standard build/types/unit/package checks passed there. Original and isolated lockfiles retain SHA-256 `7ebd6c97886c0a3313a55730f12ffc966970677d8cb702d661377703eb765cfe`. npm policy blocked the optional fsevents install script; checks passed without changing that policy. |
| Current dependency audit | Pass | Fresh `npm audit --audit-level=moderate --json` reports zero info/low/moderate/high/critical vulnerabilities. The initial sandbox DNS failure was environmental; the network-enabled retry succeeded. No dependency remediation was needed. |
| Modern Web Guidance | Retrieved and assessed | CLI search plus `retrieve persistent-toast-notifications` succeeded. Applied constraints: supplemental feedback, retained results, persistent actions, native close controls, focus recovery, overlapping focus pauses, reduced motion and reflow. The guide's generic Popover/ariaNotify defaults do not supersede this repository's explicit per-host DOM, default live-region transport and no-automatic-top-layer decisions. No browser-support claims are derived from the guide. |
| Independent review | Pass within scope | Read-only review found no important actionable defect in lifecycle guards, main async teardown, retained lab controls or generated-route transformations. The reviewer could not start its own sandboxed localhost check; the integrated browser/layout evidence above was run by the parent. |
| Final-revision remote CI | Not run | No push or remote workflow mutation was authorized. Earlier CI results below remain historical evidence. |
| Manual AT, actual zoom and touch | Not run | VoiceOver + Safari/Chrome, new-demo actual browser zoom, long-history zoom and native touch remain pending. No speech-delivery, WCAG conformance or universal support claim is made from DOM checks or screenshots. |

The legacy `scripts/verify-offline-demo.py` already had stale module/UI assumptions before this slice and is not evidence for this candidate. The standard served-browser suite is the maintained demo verification path. The targeted history helper now follows the relocated inspector source; its separate Python route was not rerun because Python Playwright is unavailable. Earlier four-inspector-UI results below remain historical evidence.


## Release version preparation — 2026-10-26

**0.2.0 is prepared locally and unpublished.** `npm run changeset -- status --output=...` initially planned a minor release from 0.1.0 to 0.2.0. `npm run version-packages` consumed `compact-dark-toast` (patch) and `toast-270-history` (minor), removing both files. Changesets did not update the npm lockfile version, so its top-level and root-package version fields were synchronized to 0.2.0 without changing the dependency graph.

The changelog consolidates the unpublished implementation preview into one `0.2.0 — Unreleased` section, retaining both changeset outcomes and adding the previously undocumented lifecycle, swipe and demo fixes. README, roadmap, contract, source docs metadata, authored demo JSON-LD and regenerated Pages output now describe 0.2.0. No registry release history is claimed.

Environment: local macOS/Darwin 27.0.0 arm64, Node 24.21.0, npm 12.2.0. The following checks were rerun after version preparation; the writable npm cache was `/private/tmp/a11y-toast-readiness-npm-cache`.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Version and changeset reconciliation | Pass | Package, both lockfile root version fields, changelog, built docs metadata, authored demo and generated Pages JSON-LD agree on 0.2.0. The installed `@changesets/get-release-plan` API returns empty `changesets` and `releases` arrays. |
| Clean install and current dependency audit | Pass | `npm ci --no-fund` and `npm audit --audit-level=moderate`: **0 vulnerabilities**. npm 12 policy skipped the optional fsevents install script; the checks below passed under that policy. |
| Standard build | Pass | `npm run build`: tsdown 0.15.12, declarations/assets and Pages generation; portable fallback was not used. |
| Source and public types | Pass | `npm run typecheck`, then strict declaration-consumer `tsc` for both `test/consumer.ts` and `test/history-consumer.ts` after the build completed. |
| Unit/integration tests | Pass | `npm test`: Vitest 5.0.5, **6 files / 23 tests**. |
| Served-browser checks | Pass | `npm run test:browser`: Chromium 153.0.8010.12, **228/228 scenarios, 0 uncaught page errors**, with approved localhost access. Local report: `test-results/browser.json` (untracked). |
| Package exports/imports | Pass | `npm run test:package`: ESM/DOM-free imports, optional exports, declarations, CSS and zero runtime dependencies. |
| Package dry run | Pass | `npm run pack:check` with the temporary cache: `a11y-toast@0.2.0`, 71 files, 125.8 kB packed / 472.7 kB unpacked. No archive was created or published. |
| Package credential-pattern scan | Pass | No private-key, npm/GitHub-token or AWS-access-key pattern matches in the 71 package files. This bounded scan cannot establish absence of every possible secret. |
| Whitespace review | Pass | `git diff --check`. |

After consumption, the Changesets `status` CLI reports changed packages without changesets because it compares the dirty, already-versioned tree with `main`. Its pending-release API confirms there is no unconsumed changeset or additional release plan. No dummy changeset was added to suppress that CLI result.

Independent metadata review found no release reconciliation blocker; wording that referred to the prior dependency-only pass was clarified. This version/changelog preparation supersedes that earlier phase's pending-version status below. Remote CI, VoiceOver, Safari and long-history zoom, native touch/pinch zoom and the remaining named manual acceptance were **not run** and remain open. The working tree includes the user's existing implementation/demo work; no clean release commit exists. No commit, publication, tag or push was performed.



## Dependency remediation before version preparation — 2026-10-26

**Local automated release checks pass; overall release readiness remains partial.** A fresh online audit of the unchanged starting lockfile reported **4 affected development packages (2 high, 2 moderate)**: Vitest, @vitest/mocker, Vite and source-map-js. The earlier 2026-10-08 count of 20 was a historical registry result, not the current baseline. Changesets-related findings were not reproduced by the current advisory service, so no forced Changesets major upgrade or override was introduced.

The development Vitest range is now `^5.0.5`; the lockfile resolves Vitest/mocker 5.0.5, Vite 8.3.5 and source-map-js 1.2.2 with their compatible transitive updates. Changesets remains 2.31.1. At the end of that dependency-only pass, package version was still 0.1.0 and the patch/minor changesets were pending; the subsequent 0.2.0 preparation is recorded above. There are no runtime dependencies or public API changes.

Environment: local macOS/Darwin 27.0.0 arm64, Node 24.21.0, npm 12.2.0. Commands used the writable temporary npm cache `/private/tmp/a11y-toast-readiness-npm-cache`.

| Check | Result | Evidence / scope |
| --- | --- | --- |
| Clean lockfile installation | Pass | `npm ci --no-fund`; npm 12 policy skipped the optional fsevents install script. Build and tests below passed with that policy in effect. |
| Current online dependency audit | Pass | `npm audit --audit-level=moderate`: **0 vulnerabilities** across the installed development graph. |
| Standard build | Pass | `npm run build`: tsdown 0.15.12, declarations/assets and generated Pages output. Portable fallback was not used. |
| Runtime source typecheck | Pass | `npm run typecheck`. |
| Public declaration consumers | Pass | `tsc --strict --noEmit --target ES2022 --module ESNext --moduleResolution Bundler test/consumer.ts test/history-consumer.ts`, run after build completion. |
| Unit/integration tests | Pass | `npm test`: Vitest 5.0.5, **6 files / 23 tests**. |
| Served-browser checks | Pass | `npm run test:browser` with Chromium 153.0.8010.12: **228/228 scenarios, 0 uncaught page errors**. Local report: `test-results/browser.json` (untracked). |
| Package imports/exports | Pass | `npm run test:package`: ESM/DOM-free imports, separate optional subpaths, declarations, CSS and zero runtime dependencies. |
| Package dry run | Pass | `npm run pack:check` with the temporary cache after README/changelog updates: 71 expected dist/README/changelog/license/metadata files, 125.3 kB packed / 471.3 kB unpacked. No archive was created or published. |
| Credential-pattern scan | Pass | No private-key, npm/GitHub-token or AWS-access-key pattern matches in the 71 package files. This is a bounded pattern scan, not proof that every possible secret is absent. |
| Whitespace review | Pass | `git diff --check`. |

The initial browser attempt was blocked by sandbox `listen EPERM`; the normal suite passed after approved localhost access. An initial declaration-consumer invocation overlapped the clean/build step and could not resolve generated declarations; rerunning after build completion passed without source changes.

Remote CI, VoiceOver/Safari/Chrome speech, Safari and long-history zoom, native touch/pinch zoom, and other named manual acceptance were **not run**. Earlier Chrome zoom evidence is unchanged. That dependency-only pass preserved the prior implementation/demo work and left version/changelog/changeset reconciliation pending. It performed no package-version bump, commit, publication, tag or push. The subsequent version preparation below supersedes that preparation status; a clean release commit is still needed.


**Plugin improvement pass (2026-09-30):** Independent core and add-on reviews reproduced terminal-state and synchronous re-entrancy defects. `show()` now rechecks lifecycle after promoting queued items, the announcement scheduler owns its gap timer before calling an injected transport, and the DOM-event adapter serializes nested same-key commands, retains correlations on refused live updates, and clears pending work on disposal. Seven initial regression scenarios failed before the fixes; all nine added shared scenarios (21a, 125a–125e, 136a–136c) now pass. `npm run build` (standard tsdown plus Pages generation), `npm run typecheck`, `npm test` (6 files / 23 tests), `npm run test:browser` (228/228 served Chromium scenarios, 0 uncaught page errors), `npm run test:package` and `npm run pack:check` passed locally. The pack dry run used a task-local writable npm cache. The final browser run first hit sandbox `listen EPERM` and then passed with approved localhost access. Independent validation also exercised the changed callback/error paths. Existing authored demo/Pages changes were preserved; Pages files matched their authored source before regeneration. No lint script exists. Remote CI, actual browser zoom, native touch and screen-reader speech were not run for this pass.

**First-use demo redesign (2026-09-29):** The authored example now leads with a sample-note save and keeps advanced examples under a native disclosure; generated Pages output was refreshed from it. The save keeps its note only in page memory, leaves focus on the button, retains an inline saved state after the toast closes, and uses a separate status only when a toast cannot appear. `npm run build`, `npm run pages:generate`, `npm run typecheck`, `npm test` (6 files / 23 tests), `npm run test:browser` (219/219 served Chromium scenarios, 0 uncaught page errors), `npm run test:package`, and `npm run pack:check` passed locally. Browser screenshots at 1280×800, 375×800, and 320×640 were inspected; those widths had no horizontal overflow, and the saved toast did not cover the focused Save button at 375×800 or 320×640. Forced-colors and reduced-motion emulation at 375×800, plus 200% root-text sizing at 375×800, retained the toast, inline status, focus and horizontal reflow. A combined 400% root-text size at a 320px CSS viewport overflowed horizontally; that synthetic extreme is not a browser-zoom result. Actual 200%/400% browser zoom, named screen-reader speech, and mobile assistive-technology acceptance for the redesigned first-use path remain unverified.

**TOAST-280 compact dark demo skin and progress styling (2026-09-27):** The compact dark treatment is an optional demo-only CSS skin; the package default remains light, and timeout progress uses the classic horizontal bar. Local `npm run build`, `npm run typecheck`, `npm test` (6 files / 23 tests), `npm run test:browser` (217/217 served Chromium 153.0.8010.12 scenarios, including the optional-skin demo check, 0 uncaught page errors), `npm run test:package`, and `npm run pack:check` passed. The default npm cache first returned `EPERM`; the pack dry run passed with a task-local cache. No remote CI, manual visual acceptance, VoiceOver/NVDA, or new browser-zoom result is claimed.

**TOAST-300 swipe dismissal (2026-09-26):** `npm run build`, `npm run typecheck`, `npm test` (6 files, 23 tests), `npm run test:browser` (213/213, no uncaught page errors), `npm run test:package`, and `npm run pack:check` passed locally. The first pack attempt hit the existing root-owned npm cache permissions issue; the passing dry run used `npm_config_cache=/tmp/a11y-toast-npm-cache`. Browser scenarios 176–183 cover dismissal/queue promotion, vertical intent and controls, independent gesture/API timer pauses, second-pointer cancellation, release-position threshold, re-entrant cleanup, and inline-style restoration. The demo-only D05 scenario and five-toast example have since been removed; these behavioral scenarios remain. Pointer events were synthetic; native touch scrolling, pinch zoom, screen reader gestures, and actual speech remain manual acceptance work. No remote CI result is claimed for this change.

**Transient toast scrollbar fix (2026-09-23):** At a height boundary, five short toasts settle exactly within a 520px scrollport, but slide-from-bottom entrance temporarily raised `scrollHeight` to 532px in Chromium and could show a scrollbar. The list now reserves scrollbar space and makes the bar transparent while an entrance or exit is active, keeping the stack width stable. Bounded scrolling remains available for genuinely long content after motion. Browser regression 175 reproduces the transient overflow and checks the motion/resting scrollbar styles and stack width. Local tsdown/Pages build, typecheck, 6 Vitest files / 23 tests, package imports, pack dry run, and **204/204 served Chromium checks with 0 uncaught page errors** pass. The independent diagnosis was source based; macOS Safari and manual assistive-technology behavior were not checked for this fix.

**Toast stack overflow fix (2026-09-23):** The package list now uses the available viewport height instead of a default 45dvh cap and suppresses horizontal scrolling. The playground sets `maxVisible: 5`, so “Show 5 toasts” displays five at once when space permits; the core default of three and its FIFO queue remain unchanged. Its animation gutters stay within the viewport, and the compact skin no longer adds a smaller height cap. Local tsdown/Pages build, typecheck, 6 Vitest files / 23 tests, package imports, pack dry run, and **203/203 served Chromium browser checks with 0 uncaught page errors** pass. New browser checks 174 and D04 cover five-toast fit, retained long-content scrolling, and the actual demo action. Targeted Chromium checks found no horizontal or vertical list overflow for five short toasts at 1280×800 and 375×800, and retained vertical scrolling at 320×480. Animation-frame checks for fade/slide from left/top at 320×568 found no transient overflow. No new manual assistive-technology or real browser zoom evidence is claimed.

**Demo accessibility audit (2026-09-23):** An independent source review identified focus loss during the async form's save state, error feedback without alert semantics, and a masthead focus outline below 3:1 contrast against its background. The basic demo now keeps the save button focusable with `aria-disabled` and a repeat-submit guard, exposes caught errors through `role="alert"`, and uses a lighter masthead focus outline. The generated Pages demo was rebuilt from the basic example. Local tsdown/Pages build, typecheck, 6 Vitest files / 23 tests, **201/201 served Chromium browser checks with 0 uncaught page errors**, package imports and pack dry run pass; the browser suite includes focused save, error-alert DOM, and computed focus-contrast checks. The pack check used a temporary npm cache after the default cache returned `EPERM`. These checks establish DOM and browser behavior, not actual VoiceOver or NVDA speech. Existing manual assistive-technology and Safari zoom gates remain open.

**TOAST-290 decorative icons and inline actions (2026-09-22):** Standard tsdown/Pages build, source and declaration-consumer typechecks, 6 Vitest files / 23 tests, **198/198 served-browser scenarios with 0 uncaught page errors**, package imports and pack dry run pass locally on Node 24.21.0 / npm 11.19.0. Browser scenarios 167–173 cover cloned icon ownership, snapshot/history exclusion, queued replacement/removal, passive-markup rejection and atomic updates, cross-document inputs, retained focus, icon exclusion from actual polite/assertive live-region commits, no icon-only repeat announcement, and wide/narrow action geometry. Independent Chromium 153.0.8010.12 demo checks pass at 1280/375/320px with no horizontal overflow or page errors and successful Undo/focus recovery. Desktop/narrow screenshots and forced-colors/reduced-motion emulation were inspected; a single-message inline alignment issue found during inspection was corrected before the final checks. README, contract, manual checklist, source index and generated Pages were updated. Pack dry run used a temporary npm cache. Localhost browser checks required execution outside the filesystem sandbox; the optional Playwright CLI retrieval failed with npm DNS `ENOTFOUND`, so checks used the already-installed Playwright library. No remote CI, real browser zoom or assistive-technology speech verification is claimed for this slice.

**Cross-engine playground effects (2026-09-22):** All classic effect choices now work with GSAP and experimental element-scoped View Transitions as well as CSS. None remains immediate; unsupported element View Transitions retain the existing no-motion fallback. The package drivers still own settlement/cancellation, with no package API changes for these examples. Local tsdown/Pages build, typecheck, 23 unit tests, 198/198 shared browser scenarios (0 uncaught page errors), package checks, and pack dry run pass. Independent targeted Chromium checks passed 127 GSAP assertions, 24 reduced-motion effect cases, and 94 native element View Transition assertions, including actual snapshot animation names/timing, bounce, resolved directional/zoom values, selector locking, style cleanup, interruption, and queue promotion. Another 64 geometry/focus checks passed for GSAP and native View Transitions at 1280px/375px widths and top-end/bottom-end placement (309 targeted checks total); forced unsupported View Transition fallback also passed. The clipping regression now covers both CSS and custom-driver scrollports. No new assistive-technology or browser-zoom verification is claimed.

**CSS example clipping fix (2026-09-21):** The scrollable toast list clipped directional effects at its resting bounds. Demo-only motion gutters now enlarge the scrollport without moving or resizing resting toasts; gutters are capped at browser edges and preserve bounded vertical scrolling. Shared browser regression 166 verifies all six placements, motion clearance, unchanged geometry, window bounds, and long-content scrolling. Local build, typecheck, 23 unit tests, 191/191 browser scenarios (0 page errors), package and pack checks pass. Separate Chromium geometry checks cover 1280px and 375px widths; a paused slide-left exit screenshot was visually inspected for clipping. No new assistive-technology or browser-zoom verification is claimed.

**Classic CSS playground effects (2026-09-21):** Added 12 selector options (existing default plus 11 demo-only effects), with no public API change. Local tsdown/Pages build, typecheck, 23 unit tests, 190/190 shared browser scenarios (0 uncaught page errors), package checks, and pack dry run pass. The pack check used a temporary npm cache because the default cache was not writable. A targeted Chromium matrix passed 296 assertions across all 12 effects at 1280px and 375px widths in top-end and bottom-end placement: animation presence/timing, leftward keyframes, zoom scale, selector locking through exit and re-enabling. Engine switching preserves selection and disables CSS effects for other engines; all 12 options suppress motion under reduced-motion emulation. Existing shared browser scenarios cover focus, interruption, and queue behavior. This is automated DOM/animation evidence, not manual visual, keyboard, zoom, VoiceOver, or NVDA acceptance. No remote CI result is claimed.

**TOAST-285 update:** The optional development diagnostics subpath is implemented and locally verified. The standard build, source and declaration-consumer typechecks, 6 Vitest files / 23 tests, **190 / 190 served-browser scenarios with 0 uncaught page errors**, package import checks, and pack dry run pass. Scenarios 159–165 cover opt-in behavior, validation, every diagnostic family, condition and burst throttling, Unicode length, immutable content-free payloads, callback failure isolation, nested/instance filtering, and unregister/destroy cleanup. No remote CI or new assistive-technology result is claimed for this slice.

**TOAST-270 update:** Implementation and verification are recorded in [TOAST-270-VERIFICATION.md](./TOAST-270-VERIFICATION.md). The new slice passed 25 history and four inspector DOM checks using real compiled ESM in Chromium 144.0.7559.96. After integration, the local tsdown build, strict typecheck, 6 Vitest files / 23 tests, 183 / 183 served-browser scenarios, package checks, and pack dry run passed. GitHub Actions run 35579571709 then passed the full workflow for the TOAST-270 commit. Named manual acceptance remains pending.

Date: 2026-09-20  
Overall status: **Partially verified — core/package automation passes online; the reproducible dependency graph passes locally and awaits its refreshed remote run; manual accessibility remains open.**

The TypeScript core, default CSS, single demo, typed event/add-on contracts, and package build configuration exist. GitHub Actions verifies the standard npm-dependent toolchain. A reviewed lockfile is tracked and CI uses `npm ci`. The 2026-10-26 development-tool remediation now passes clean install and a zero-vulnerability moderate audit locally; remote validation of this patched graph remains pending. Earlier dated audit results below are historical snapshots. Actual assistive-technology output remains an open gate.

On 2026-09-21, the TOAST-140-B refresh passed a clean `npm ci`, `npm audit --audit-level=moderate` with zero vulnerabilities, tsdown build, source and declaration-consumer typechecks, Vitest 5.0.1 (6 files / 23 tests), all 183 served-browser scenarios with 0 uncaught page errors, package export checks, and `npm pack --dry-run`. CI now enforces the same lockfile install and moderate audit threshold; that workflow change has not yet run remotely.

On 2026-09-21, real-browser continuation found and fixed a local-playground startup blocker: `examples/basic/demo.js` imports caller-injected GSAP modules, but `scripts/serve.mjs` rejected every `node_modules` request. The server now permits only JavaScript modules below the development-only `node_modules/gsap` subtree and continues to reject other `node_modules` paths. The served-browser command now waits for the playground to initialize and asserts that its boot notice is hidden and its history inspector exists before running the 183 shared scenarios. The updated suite passes 183/183 with 0 uncaught page errors.

M-14 actual browser zoom has partial manual evidence: Chrome 153.0.8010.50 on macOS 27.0 passed at 200% and 400% with long notification/action text, keyboard-scrolled action and close controls, and a focused page control not completely obscured. Safari zoom, VoiceOver, and H-M06 long-history zoom remain pending; see `docs/MANUAL_TESTS.md`.

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

Latest TOAST-270 history run: https://github.com/vmitsaras/A11y-Toast/actions/runs/35579571709

Commit: `1c6edc66ee18704b54215c86582501598b3b6e36`

Result: **success** — installation, tsdown build, source/public typechecks, 6 Vitest files / 23 tests, Chromium installation, **183 / 183 served-browser scenarios with 0 uncaught page errors**, package exports, package contents, and the configured audit gate all passed. This validates the history implementation and its integrated regression suite; it predates the lockfile/`npm ci`/Vitest 5 refresh described below.

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
| Runtime lifecycle contract | **183 / 183 pass** | TOAST-270 GitHub Actions run 35579571709 confirms the normal served-browser Playwright path, including the 25 bounded-history scenarios. Earlier local synthetic-browser evidence was session-local and is not committed to Git. |
| Demo/UI/real-timer checks | **20 / 20 historical local pass** | Earlier local synthetic-document checks exercised actual demo markup/styles/runtime, but their generated JSON/screenshots are intentionally not committed. Manual zoom/AT evidence is still required. |
| Uncaught browser page errors | **0** | GitHub Actions served-browser lifecycle suite. |
| Package exports and DOM-free imports | Pass | `npm run test:package`. |
| Local server response | Pass | Local HTTP request returned 200 for the example and appropriate MIME/CSP headers; this is not browser navigation evidence. |
| Package dry-run | Pass | `npm run pack:check`. |
| Actual local npm archive | Pass | `npm pack --ignore-scripts --pack-destination /mnt/data`; archive entries inspected. |
| Separate consumer install | Pass | Installed the actual tarball using `npm install --offline --ignore-scripts --no-audit --no-fund`; runtime, metadata, package and CSS entries resolved. |
| Standard tsdown build | **Pass** | GitHub Actions run #1, tsdown 0.15.12. |
| Vitest/jsdom command | **Pass** | Latest TOAST-260C run: 6 test files / 23 tests passed, including 6 A11y Menu Button integration tests, 4 ariaNotify transport tests, 5 real-GSAP driver tests, 3 real-Flip layout tests, and 4 dedicated element-scoped View Transition tests. |
| Normal served-browser Playwright command | **Pass** | TOAST-270 GitHub Actions run 35579571709: Chromium lifecycle suite 183/183, 0 uncaught page errors. |
| Lockfile generation / dependency security audit | **Partial** | 2026-10-26: clean `npm ci` and `npm audit --audit-level=moderate` report zero vulnerabilities after compatible Vitest/mocker 5.0.5, Vite 8.3.5 and source-map-js 1.2.2 updates. Remote validation of the patched lockfile remains open; earlier audit counts are historical. |
| Modern Web Guidance CLI retrieval | **Blocked** | CLI search was attempted, but npm could not resolve the registry. W3C/MDN references were reviewed separately. |
| VoiceOver Safari / VoiceOver Chrome | **Pending** | No macOS screen-reader environment. Neither a live-region write nor an ariaNotify call/event is speech verification. |
| Actual browser 200% / 400% zoom | **Partial** | Chrome 153 M-14 passed at 200% and 400% on macOS 27.0; Safari zoom and the H-M06 long-history zoom case remain pending. |
| NVDA/JAWS / mobile screen readers | **Pending** | No corresponding environment used. |

## How browser execution worked

Earlier local evidence used a portable `tsc` build and synthetic-document browser transport because that environment blocked npm/localhost access. Those generated artifacts were not committed. GitHub Actions run #1 now supplies stronger evidence for the standard tsdown build and normal served localhost Playwright path.

The demo checks loaded the actual `examples/basic/index.html`, `demo.css`, `demo.js`, and `dist/styles.css`. External stylesheet/script references were supplied locally instead of through HTTP. This checks DOM behavior and presentation, but is not evidence for normal navigation, CSP enforcement, Safari behavior, assistive-technology speech, or deployment.

The shared lifecycle suite uses a deterministic clock for detailed timer/race coverage. The separate UI suite additionally runs a real one-second browser timeout. The tests are named in the JSON reports; the count does not imply coverage of every possible application integration.

## Behavior exercised

The 190 browser lifecycle scenarios include opt-in development diagnostics and bounded history plus animation-driver, interruption, reduced-motion, CSS/GSAP/element-scoped View Transition exit behavior, GSAP Flip stack reflow, re-entrant observer, multi-exit batch, hidden-document cancellation, ordered queue-release, progress add-on, promise orchestration, key deduplication, generic DOM-event adapter, and announcement-transport coverage. A separate six-test Vitest integration suite exercises the real A11y Menu Button async-state ecosystem adapter in addition to the earlier core cases. The original core scenarios include repeated and re-entrant initialization, root ownership, strict option normalization, visible/queued updates, immutable event snapshots, safe text rendering, full-queue rejection, FIFO ordering under re-entrant additions, clear without intermediate promotion, timer preservation/reset, overlapping pause reasons, hidden-document handling, announcement ordering/coalescing/cancellation, action retry/cancellation/stale-result guards, add-on setup/cleanup/error isolation, and destruction during observers.

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
npm ci
npm run build
npm run typecheck
npx tsc --strict --noEmit --target ES2022 --module ESNext --moduleResolution Bundler test/consumer.ts
npm test
npx playwright install chromium
npm run test:browser
npm run test:package
npm run pack:check
```

Review the tracked lockfile and run `npm audit --audit-level=moderate`. Do not assume those steps passed because the portable build passed here.

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

Run `docs/MANUAL_TESTS.md`, beginning with macOS VoiceOver in Safari and Chrome, then finish Safari browser zoom and H-M06 long-history zoom. Fix confirmed announcement/focus findings before enabling an optional integration. TOAST-120 remains partial: Chrome M-14 zoom now passes, while VoiceOver and the remaining named manual rows stay open. TOAST-140 remains partial until GitHub Actions validates the 2026-10-26 patched lockfile, `npm ci`, Vitest 5.0.5 and the moderate audit gate. Remaining release gates include the named manual acceptance rows and final-revision remote CI; a local release-preparation commit does not establish either. The current unpublished release target is 1.0.0 by user request on 2026-11-12; both earlier changesets remain consumed. Historical version-specific results below are retained as recorded.

No npm publication or Git tag was performed. Repository commits now include the implementation, verification workflow, and synchronized documentation.

## Lifecycle event contract follow-up (2026-09-26)

| Check | Result | Evidence |
| --- | --- | --- |
| `npm run typecheck` | Pass | Source typecheck, including event-map keys computed from `TOAST_EVENTS`. |
| Public declaration consumer | Pass | `tsc --strict --noEmit --target ES2022 --module ESNext --moduleResolution Bundler test/consumer.ts`; event-name/map key equality assertions compile. |
| `npm test` | Pass | 6 Vitest files, 23 tests. |
| `npm run build` | Pass | tsdown package build and generated Pages output. |
| `npm run test:browser` | Pass | 216/216 shared lifecycle and demo scenarios; 0 uncaught page errors. The loopback server required local-listen permission in this environment. |
| `npm run test:package` | Pass | ESM exports, DOM-free imports, and runtime event metadata match `TOAST_EVENTS`. |
| `npm run pack:check` | Pass | npm dry-run pack completed; no publication. |
| `git diff --check` | Pass | No whitespace errors. |
| VoiceOver / other assistive technology | Not run | No speech-delivery or manual AT claim is inferred from DOM/browser checks. |

The new teardown regression confirms cleanup exceptions remain isolated and emit no event after terminal `destroy`; explicit unregister while active still emits `addon-error`.
