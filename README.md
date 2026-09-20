# A11y Toast

A framework-free, TypeScript-first toast manager with explicit announcement ownership, bounded queueing, predictable timers, and removable lifecycle integrations.

**Version 0.1.0 — implementation preview.** The repository contains source, tests, docs, and build configuration; generated `dist/` output is intentionally ignored. The standard npm/tsdown/Vitest/served-Chromium workflow now passes in GitHub Actions. Manual VoiceOver checks, actual browser zoom verification, and lockfile/dependency follow-up remain open; see `docs/VERIFICATION.md`.

## Try it immediately

Clone the repository, install development dependencies, build, and run the demo:

```sh
npm install
npm run build
npm run demo
```

Open `http://127.0.0.1:4173/examples/basic/`. Node.js 22 or later is the declared development baseline. The demo imports generated `dist/` output, so a build is required after a fresh clone. Do not open `index.html` using `file://`: it imports real ES modules.

The demo is one page: content/options form, visible/queued selection, loading/update controls, action retry, six logical positions, and a deliberately non-live event log. No CDN, framework, backend, account, or storage is used.

## npm publication

Publication to npm is planned alongside the author's other accessibility plugins. Until `a11y-toast` is actually published, use the repository for development and do not assume `npm install a11y-toast` resolves to this project.

## Usage

Provide a mounted, non-live host. The application must keep essential information or actions available outside timed notifications.

```html
<button id="save" type="button">Save</button>
<div data-a11y-toast></div>
```

```ts
import { createToast } from 'a11y-toast';
import 'a11y-toast/styles.css';

const root = document.querySelector('[data-a11y-toast]');
const button = document.querySelector('#save');
if (root instanceof HTMLElement && button instanceof HTMLButtonElement) {
  const toast = createToast(root);
  button.addEventListener('click', () => {
    // Notify only after the application's save really succeeds.
    toast.success('Your changes were saved.', { origin: button });
  });
  // Call toast.destroy() when the host's owning view is disposed.
}
```

This example connects feedback; it does not implement a save operation.

The runtime never auto-initializes on import. `A11yToast`, `createToast`, and `initToastAll` are exported. Duplicate creation on the same root returns the existing instance and ignores new options. Destroy the old instance before recreating it with different options.

## Manager options

| Option | Default | Behavior |
| --- | --- | --- |
| `duration` | `5000` | Default milliseconds; `0` means persistent. Positive values clamp to at least 1,000 ms. Maximum accepted value is 86,400,000 ms. |
| `maxVisible` | `3` | Integer from 1 to 8. |
| `maxQueue` | `10` | Integer from 0 to 100; 0 disables waiting. |
| `position` | `bottom-end` | `top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-center`, `bottom-end`. |
| `priority` | `polite` | `off`, `polite`, or `assertive`; independent of visual tone. |
| `showToneLabel` | `true` | Show the `.a11y-toast__tone` label visually. Set `false` to visually hide it while keeping the tone text available to assistive technology and generated live-region wording. |
| `labels` | English strings | Partial overrides for `region`, `dismiss`, `actionFailed`, `empty`, and `tones`. |
| `addons` | none | Explicit instance-local add-ons; no auto-discovery. |

HTML may supply `data-a11y-toast-duration`, `data-a11y-toast-max-visible`, `data-a11y-toast-max-queue`, `data-a11y-toast-position`, `data-a11y-toast-priority`, and `data-a11y-toast-show-tone-label`. Explicit JavaScript options take precedence. Invalid values fall back; strings such as `500ms`, negative counts, fractions, and empty numeric strings are not partially parsed.

Options, labels, and exposed snapshots are frozen. No configure/set-options API is included in this release.

## Toast input

`message` is a required non-empty string. Optional fields are `title`, `tone`, `priority`, `announcement`, `duration`, `persistent`, `dismissible`, `action`, `origin`, and `key`.

Tones: `neutral`, `info`, `success`, `warning`, `error`, `loading`.

Messages, labels, and titles are rendered as text. HTML strings are not interpreted. `key` is a caller correlation value, **not** automatic deduplication. All toasts have independently generated IDs; queue rejection returns `null`.

`announcement` can supply concise alternative wording. Null/blank restores generated wording. `priority: 'off'` suppresses the plugin's live-region writes; it does not hide the visible notification from assistive technology.

### Timing contract

Ordinary notifications inherit the manager duration. Loading is always persistent. Actions and assertive messages are persistent unless the caller explicitly supplies a positive per-toast duration or `persistent: false`. A manager's default duration alone does not opt actionable/urgent content into timing. `duration: 0` remains persistent.

Timers pause for hover, focus within the toast, focus on the scrollable notification list, a hidden document, a pending action, or the public API pause. Clearing one pause reason cannot clear another. `pause(id)` and `resume(id)` manage only the caller-owned `api` reason.

A content-only update preserves remaining time. An explicit `duration` patch restarts that duration, including when the number is unchanged. Changing between persistent and timed state restarts the effective duration. Loading-to-success naturally becomes timed unless the caller had explicitly set persistence. An explicitly persistent message stays persistent until changed.

Queued items have no running timeout and do not announce before becoming visible. FIFO is preserved. A full queue rejects the **incoming** toast, emits `drop`, and returns `null`; it never silently evicts an existing message.

### Public methods

| Method/property | Result |
| --- | --- |
| `show(input)` | Toast ID or `null` when rejected. |
| `info`, `success`, `warning`, `error`, `loading` | `(message, options?)`; same ID/null result. |
| `update(id, patch)` | Boolean; works for queued and visible items. |
| `dismiss(id, reason?)` | Boolean; synchronous removal, then FIFO drain. |
| `dismissAll(reason?)` | Number removed; clears visible and queued items without showing intermediate items. |
| `pause(id)`, `resume(id)` | Whether the API-owned pause changed. |
| `getToast(id)`, `getToasts()` | Frozen snapshots; no action callbacks, origin elements, or private collections. |
| `registerAddon(addon)` | Explicit registration; duplicate names are rejected. |
| `unregisterAddon(name)` | Boolean; signal/subscriptions/cleanup disposed. |
| `getAddon(name)`, `getAddons()` | Registered frozen definitions. |
| `destroy()` | Idempotent teardown; preserves authored DOM and attributes. |
| `root`, `instanceId`, `options`, `visibleCount`, `queuedCount`, `isDestroyed` | Read-only public properties. |

`initToastAll(options?, scope?)` initializes matching **descendants** of the supplied scope, using `document` only when called. It returns an empty array when called without a scope outside a DOM environment.

After destruction, `show`, `update`, and `registerAddon` throw clear lifecycle errors. Reads are empty; `dismiss`, `pause`, `resume`, and `unregisterAddon` return false; `dismissAll` returns 0. Calling `destroy` again is harmless. Missing IDs otherwise return false/undefined. Invalid message/action input throws before mutating the previous state.

## Actions

One native action button is supported. `onClick` is optional; an event-only action can be handled through the `action` lifecycle event. `dismissOnSuccess` defaults to false and only applies when a callback actually runs.

```ts
const id = toast.show({
  message: 'Demo change applied.',
  action: {
    label: 'Undo demo change',
    onClick: ({ instance, id }) => {
      // Perform the actual domain undo before changing the confirmation.
      instance.update(id, {
        message: 'Demo change undone.', tone: 'success', action: null,
        persistent: false, duration: 5000,
      });
    },
  },
});
```

A callback may return a promise. While pending, duplicate activation is blocked and the button uses `aria-disabled` without losing focus. The callback receives an `AbortSignal`, which is aborted on dismissal, action replacement, or destruction. Cooperating application code should honor it. A toast cannot cancel an external operation that ignores cancellation.

Rejected/thrown callbacks retain a visible, persistent retry message and emit `action-error`. They do not manufacture success or escalate politeness. Late results cannot revive a dismissed/destroyed toast. This is action lifecycle safety, **not** the deferred `toast.promise()` orchestration add-on.

## Lifecycle events

Exported `TOAST_EVENTS` includes:

`init`, `ready`, `show`, `queue`, `update`, `announce`, `action`, `actionError`, `pause`, `resume`, `dismiss`, `drop`, `addonError`, `destroy`.

Their DOM names use `a11y-toast:*` (for example, `a11y-toast:action-error`). Events bubble, are not cancelable, and use `composed: false`. There is no hidden global event bus or cross-shadow-root forwarding.

```ts
import { addToastEventListener, TOAST_EVENTS } from 'a11y-toast';
const stop = addToastEventListener(root, TOAST_EVENTS.dismiss, event => {
  console.log(event.detail.toast.id, event.detail.reason);
});
// stop() removes exactly this listener.
```

Details include `instance`, `root`, `instanceId`, `timestamp`, visible/queued counts, and an event-specific frozen `toast` snapshot where relevant. `pause`/`resume` report effective paused/running boundaries, not every internal reason-set edit.

**`announce` records a live-region DOM write, not evidence that a screen reader spoke or finished speaking.** Pending writes are serialized independently for polite/assertive channels, coalesced per toast, and canceled on dismissal/destruction. Already delivered speech cannot be recalled. Multiple independent managers do not share a document-global speech coordinator.

Removal is synchronous. CSS provides a subtle entry animation; an asynchronous exit-animation lifecycle is deliberately not included.

## Add-ons and ecosystem integration

```ts
const diagnostics = {
  name: 'diagnostics',
  setup(context) {
    return context.on(TOAST_EVENTS.show, event => {
      console.log(event.detail.toast.id);
    });
  },
};
toast.registerAddon(diagnostics);
```

`setup` must synchronously return a cleanup function or nothing. Its context provides the public instance, root, an abort signal, and auto-cleaned typed `on()` subscriptions. Selected observer hooks are `beforeShow`, `afterShow`, `beforeUpdate`, `afterUpdate`, `beforeDismiss`, `afterDismiss`. Snapshots are not writable middleware; return values cannot cancel operations. Hooks are not awaited. Accidental returned-promise failures are isolated instead of becoming unhandled rejections.

Unregister removes subscriptions and aborts the add-on signal; destroy cleans up in reverse registration order. Setup/hook/cleanup failures emit bounded `addon-error` diagnostics. One failed add-on does not stop core cleanup.

For interoperability, subscribe to the **source package's actual exported events**, map useful outcomes to `show`/`update`/`dismiss`, and retain toast IDs. Do not inspect another component's private collections. If the source already announces a result, use `priority: 'off'` on the toast. Only one component should own each announcement.

No source-plugin or framework adapter is shipped yet. The sampled Menu Button uses `menu-button:*` events; do not assume every existing package already has the same literal prefix.

## CSS

Import `a11y-toast/styles.css` explicitly. Behavior uses `data-*`; presentation uses BEM. There is no page reset, framework stylesheet, CSS-in-JS runtime, or imported font.

Public variables include:

- Surface/layout: `--a11y-toast-background`, `--a11y-toast-color`, `--a11y-toast-muted`, `--a11y-toast-border`, `--a11y-toast-radius`, `--a11y-toast-shadow`, `--a11y-toast-gap`, `--a11y-toast-offset`, `--a11y-toast-width`, `--a11y-toast-max-height`, `--a11y-toast-z-index`, `--a11y-toast-font`.
- Interaction: `--a11y-toast-focus`, `--a11y-toast-hover-background`.
- Tone accents: `--a11y-toast-neutral-accent`, `--a11y-toast-info-accent`, `--a11y-toast-success-accent`, `--a11y-toast-warning-accent`, `--a11y-toast-error-accent`, `--a11y-toast-loading-accent`.

Private `--_` variables are implementation details, not a supported customization API. Changing colors remains the integrator's contrast responsibility.

The visual viewport is a named section with an ordered notification list. Text-only status/alert regions are siblings outside the interactive viewport. Default controls have 44px-equivalent minimum target dimensions at the standard root text size. Tone has a visible text label, not just an accent color. Reduced motion removes entry animation; forced colors preserves borders/focus styling. Logical positions mirror with inherited direction.

## Accessibility and integration limitations

Showing a toast never focuses it. Focused dismiss/action removal tries an explicit origin, then the captured surviving focus target, then another notification control. If no target remains, a visible “No notifications” region is available until focus leaves. Content-only updates retain existing button nodes. Removing the entire host/view is still an application lifecycle operation: supply valid origins and coordinate focus when disposing surrounding UI.

Do not mount under another live region. Do not use a toast as a dialog, required confirmation, sole validation error, or the only timed way to access important information/actions. A five-second duration and hover pause alone do not establish WCAG conformance.

This release does not auto-move hosts into the top layer, out of inert content, across shadow roots, or between route scopes. Select an appropriate host inside the active interaction scope. High zoom, focused-page-content overlap, active dialogs, real mobile assistive technology, and app-specific focus restoration need integration testing. Detaching a root is **not** an implicit `destroy`; dispose it explicitly. No global MutationObserver is installed.

References used for these decisions:

- W3C, Understanding SC 2.2.1: https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable
- W3C APG, Alert Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
- MDN, ARIA live regions: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions

## Development and verification

```sh
npm install
npm run build
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run test:package
npm run pack:check
```

The standard build uses tsdown, and unit tests use Vitest/jsdom. GitHub Actions run #1 successfully executed dependency installation, the tsdown build, source and declaration-consumer typechecks, Vitest, served Chromium lifecycle tests, package export checks, pack inspection, and the configured high-severity audit gate.

The repository still has no committed `package-lock.json`. The current resolved development dependency graph reports two moderate vulnerabilities through Vitest/@vitest/mocker, so reproducibility and dependency cleanup remain explicit follow-up work. The portable `npm run build:portable` path remains available for restricted/offline environments.

`PORT` changes the demo port. `CHROMIUM_EXECUTABLE` selects a Chromium binary for `npm run test:browser`. These are development controls, not runtime requirements.

See `ROADMAP.md`, `IMPLEMENTATION_TASKS.md`, `docs/VERIFICATION.md`, and `docs/MANUAL_TESTS.md`. The documentation metadata is available without loading the runtime:

```ts
import { docs } from 'a11y-toast/docs';
```

## Package layout

`src/` contains the class, types, events, option normalization, private live-region scheduler, stylesheet, and pure docs metadata. `examples/basic/` is the single demo. `test/` contains the shared browser/Vitest contract and declaration-consumer fixture. `scripts/` contains build/serve/verification helpers. `dist/` is generated by the build and intentionally ignored by Git.

No npm publication or Git tag has been created. See `docs/MIGRATION.md` before replacing the earlier JavaScript prototype; this is not a drop-in alias layer.
