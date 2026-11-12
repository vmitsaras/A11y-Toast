# API and integration reference

For an introduction and common examples, start with the [README](../README.md). This page covers the full API, optional integrations and styling details for A11y Toast 1.0.0.

## Manager options

| Option | Default | Behavior |
| --- | --- | --- |
| `duration` | `5000` | Default milliseconds; `0` means persistent. Positive values clamp to at least 1,000 ms. Maximum accepted value is 86,400,000 ms. |
| `maxVisible` | `3` | Integer from 1 to 8. |
| `maxQueue` | `10` | Integer from 0 to 100; 0 disables waiting. |
| `position` | `bottom-end` | `top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-center`, `bottom-end`. |
| `priority` | `polite` | `off`, `polite`, or `assertive`; independent of visual tone. |
| `animation` | `css` | `css`, `none`, or an injected `ToastAnimationDriver`. Motion is decorative and reduced-motion skips it. |
| `announcementTransport` | `live-region` | Default live-region transport or an explicitly injected transport driver. The experimental ariaNotify driver is a separate opt-in subpath. |
| `showToneLabel` | `true` | Show the `.a11y-toast__tone` label visually. Set `false` to visually hide it while keeping the tone text available to assistive technology and generated announcement wording. |
| `labels` | English strings | Partial overrides for `region`, `dismiss`, `actionFailed`, `empty`, and `tones`. |
| `addons` | none | Explicit instance-local add-ons; no auto-discovery. |

HTML may supply `data-a11y-toast-duration`, `data-a11y-toast-max-visible`, `data-a11y-toast-max-queue`, `data-a11y-toast-position`, `data-a11y-toast-priority`, `data-a11y-toast-animation` (`css` or `none`), and `data-a11y-toast-show-tone-label`. Announcement transports are JavaScript-only so experimental delivery behavior cannot be enabled accidentally through markup. Explicit JavaScript options take precedence. Invalid values fall back; strings such as `500ms`, negative counts, fractions, and empty numeric strings are not partially parsed.

Options, labels, and exposed snapshots are frozen. No configure/set-options API is included in this release.

## Toast input

`message` is a required non-empty string. Optional fields are `title`, `tone`, `priority`, `announcement`, `duration`, `persistent`, `dismissible`, `action`, `actionLayout`, `icon`, `origin`, and `key`.

Tones: `neutral`, `info`, `success`, `warning`, `error`, `loading`.

Messages, labels, and titles are rendered as text. HTML strings are not interpreted. In core, `key` remains caller correlation metadata and does **not** automatically deduplicate. The optional dedupe controller can apply explicit key-based policies. All direct core toasts otherwise receive independently generated IDs; queue rejection returns `null`.

`announcement` can supply concise alternative wording. Null/blank restores generated wording. `priority: 'off'` suppresses the plugin's live-region writes; it does not hide the visible notification from assistive technology.

### Decorative icons and inline actions

Pass a trusted, application-created HTML or SVG element as `icon`. Icon-font classes and inline SVG paths are supported; the package supplies no icon font or icon library. HTML strings are not accepted, and this option is not a rich-content renderer or a sanitizer for untrusted markup.

Supported HTML elements are `span`, `i`, `b`, and `em`. Supported SVG elements are `svg`, `g`, `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon`, `title`, and `desc`. Use classes, presentation attributes and `currentColor`. Unsupported markup throws `TypeError` before a toast is shown or updated: this includes `use`, images, links, controls, custom elements, scripts, event-handler attributes, IDs, inline `style`, focus/editability attributes, `role`, live-region attributes, resource references (`href`, `src`, `url(...)`), and reserved `data-a11y-toast*` attributes. SVG `focusable="false"` is accepted. Existing event listeners are not copied.

```ts
const icon = document.createElement('i');
icon.className = 'fa-solid fa-check'; // Load your icon font's CSS separately.

const toast = createToast(root, { showToneLabel: false });
const id = toast.show({
  message: '2 messages were deleted.',
  tone: 'success',
  icon,
  actionLayout: 'inline',
  action: { label: 'Undo', onClick: undoDeletion },
});

if (id) toast.update(id, { icon: null }); // Remove the decoration.
```

The icon is cloned when supplied to `show` or `update`; the original stays with the caller. Later changes to the original do not change an existing or queued toast. Pass it again in an update to replace the icon. Icons remain outside announcements, snapshots and history, inside an owned, noninteractive `.a11y-toast__icon` wrapper hidden from assistive technology. Message and tone text must convey the meaning independently.

`actionLayout` is a per-toast option: `stacked` (default) or `inline`. Inline layout places the action beside the text when space permits and wraps it below on narrow surfaces. Updates preserve the existing action and close buttons and their focus. The design gallery includes Classic light and Classic dark previews using these options and optional package CSS skins.

The shipped CSS uses inline placement at viewport container widths of at least `32rem`; the default `23rem` toast width keeps actions stacked. Set `--a11y-toast-width: 52rem` on your host for a wider classic toast. Browsers without container queries retain the stacked layout.

### Timer behavior

Ordinary notifications inherit the manager duration. Loading is always persistent. Actions and assertive messages are persistent unless the caller explicitly supplies a positive per-toast duration or `persistent: false`. A manager's default duration alone does not opt actionable/urgent content into timing. `duration: 0` remains persistent.

A timed toast begins consuming its lifetime after initial display setup has finished and entrance animation completes or is skipped. Synchronous updates from `beforeShow`, `show`, or `afterShow` cannot start its timer early. Announcements do not wait for decorative motion.

Timers pause for hover, focus within the toast, focus on the scrollable notification list, a hidden document, a pending action, or the public API pause. Clearing one pause reason cannot clear another. `pause(id)` and `resume(id)` manage only the caller-owned `api` reason.

A content-only update preserves remaining time. An explicit `duration` patch restarts that duration, including when the number is unchanged. Changing between persistent and timed state restarts the effective duration. Loading-to-success naturally becomes timed unless the caller had explicitly set persistence. An explicitly persistent message stays persistent until changed.

Queued items have no running timeout and do not announce before becoming visible. FIFO is preserved. A full queue rejects the **incoming** toast, emits `drop`, and returns `null`; it never silently evicts an existing message.

### Public methods

| Method/property | Result |
| --- | --- |
| `show(input)` | Toast ID or `null` when rejected. |
| `info`, `success`, `warning`, `error`, `loading` | `(message, options?)`; same ID/null result. |
| `update(id, patch)` | Boolean; works for queued and visible items. |
| `dismiss(id, reason?)` | Boolean; logical dismissal is immediate. An animated exit may keep an inert, aria-hidden surface briefly rendered before FIFO drain. |
| `dismissAll(reason?)` | Number logically removed; clears visible and queued records without showing intermediate queued items. Any active visual exits finish independently. |
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

Rejected/thrown callbacks retain a visible, persistent retry message and emit `action-error`. They do not manufacture success or escalate politeness. Late results cannot revive a dismissed/destroyed toast. This is core action lifecycle safety. Promise/loading orchestration is available separately through `trackToastPromise` from `a11y-toast/addons/promise`; there is no core `toast.promise()` method.

## Lifecycle events

Exported `TOAST_EVENTS` includes:

`init`, `ready`, `show`, `queue`, `update`, `announce`, `announcementError`, `action`, `actionError`, `pause`, `resume`, `dismiss`, `drop`, `animationStart`, `animationEnd`, `animationError`, `addonError`, `destroy`.

Their DOM names use `a11y-toast:*` (for example, `a11y-toast:action-error`). Events bubble, are not cancelable, and use `composed: false`. There is no hidden global event bus or cross-shadow-root forwarding.

```ts
import { addToastEventListener, TOAST_EVENTS } from 'a11y-toast';
const stop = addToastEventListener(root, TOAST_EVENTS.dismiss, event => {
  console.log(event.detail.toast.id, event.detail.reason);
});
// stop() removes exactly this listener.
```

Details include `instance`, `root`, `instanceId`, `timestamp`, visible/queued counts, and an event-specific frozen `toast` snapshot where relevant. `pause`/`resume` report effective paused/running boundaries, not every internal reason-set edit.

Every event is dispatched on the instance root with `{ bubbles: true, composed: false, cancelable: false }`. The detail object is frozen; any `toast` value is a frozen dispatch-time snapshot. `error` values retain the original thrown/rejected value and are typed `unknown`.

| Event | Trigger and event-specific detail | Ordering and limits |
| --- | --- | --- |
| `init` | Core DOM is installed and the instance is registered; base detail only. | Synchronous and before configured add-ons are set up. A re-entrant destroy can prevent `ready`. |
| `ready` | Configured add-on setup has finished; base detail only. | Synchronous initialization boundary. |
| `show` | Toast is committed to the visible list; `toast`. | Before `animation-start`; means display commitment, not animation or announcement completion. |
| `queue` | Toast is added to the bounded queue; `toast`. | `show` is emitted later if the item is promoted. |
| `update` | An existing visible or queued toast is updated; `toast`. | Emitted even when the resulting public state is unchanged. |
| `announce` | Announcement transport commits an attempt; `toast`, `message`, `priority`, `transport`, `fallback`. | May happen asynchronously after `show`/`update`, or not at all. Never confirms speech delivery. |
| `announcement-error` | The transport throws synchronously; `toast`, `message`, `priority`, `transport`, `error`. | Async transport rejections are outside this synchronous error event contract. |
| `action` | Action is invoked after pending state is set; `toast`. | Before its callback runs. Event-only actions also emit this event. |
| `action-error` | Action callback throws or its promise rejects; `toast`, `error`. | There is no action-success event; completion is reflected through update or dismissal. |
| `pause` / `resume` | Effective running/paused state changes; `toast`, `reason`. | Only the outer pause/resume boundary emits; snapshot `pauseReasons` contains the full current set. |
| `dismiss` | Toast is logically removed; `toast`, `reason`. | Before exit animation completion. `dismissAll()` emits one event per removed toast and no aggregate event. |
| `drop` | Show request is rejected because the queue is full or clearing is in progress; `toast`, `reason`. | Reasons are `queue-full` or `clearing`; the dropped record is not retained. |
| `animation-start` | Enter or exit motion starts; `toast`, `phase`, `driver`. | Decorative lifecycle, independent of semantic show/dismiss. |
| `animation-error` | Animation driver throws or rejects; `toast`, `phase`, `driver`, `error`. | Normally followed by `animation-end` with `status: 'failed'`; destroying from the error listener suppresses that follow-up. |
| `animation-end` | Motion completes, is cancelled, or fails; `toast`, `phase`, `driver`, `status`. | Destroy cancels active motion and emits its cancelled end before `destroy`. |
| `addon-error` | Add-on setup, observer, hook, or cleanup fails while the instance is active; `addon`, `phase`, `error`. | Recursive reporting is suppressed. Cleanup failures during destruction are isolated without dispatching after the terminal event. |
| `destroy` | Core state and generated DOM have been cleared; base detail only. | Terminal event. Add-on cleanup follows; cleanup errors cannot emit later events. |

`dismissAll()` and other batch work have item-level events only. Nested synchronous listeners can cause re-entrant event sequences; no ordering is promised between independent asynchronous operations. Typed event names/details are keyed directly from `TOAST_EVENTS` in the public source map. Structured event metadata is also available from `a11y-toast/docs`.

**`announce` records an announcement-transport commit attempt, not evidence that a screen reader spoke or finished speaking.** Pending commits are serialized independently for polite/assertive channels, coalesced per toast, and canceled on dismissal/destruction. Already delivered speech cannot be recalled. Multiple independent managers do not share a document-global speech coordinator.

Animation is orthogonal to semantic toast state. `show` still reports display commitment immediately. `dismiss` reports logical removal immediately; if an exit animation is active, the generated item becomes inert and `aria-hidden` until the visual exit finishes. The slot is released only then. `animation-start`, `animation-end`, and `animation-error` report decorative motion; animation failures cannot strand the toast lifecycle.

## Experimental ariaNotify transport

The stable default remains the package's separate polite/assertive live regions. An experimental transport is available from a dedicated subpath:

```ts
import { createToast } from 'a11y-toast';
import { createAriaNotifyTransport } from 'a11y-toast/transports/aria-notify';

const toast = createToast(root, {
  announcementTransport: createAriaNotifyTransport(),
});
```

This transport is intentionally opt-in because `Document.ariaNotify()` is not yet Baseline across widely used browsers.

Behavior:

- polite toast priority maps to ariaNotify `normal`;
- assertive maps to `high`;
- `off` bypasses announcement transports entirely;
- when `Document.ariaNotify` is unavailable, the already-scheduled matching live region is used as fallback;
- when ariaNotify is available, the live-region channel is cleared but not written, so one toast announcement is never sent through both mechanisms;
- the same scheduler still owns coalescing, cancellation, hidden-document pausing and channel spacing.

`a11y-toast:announce` reports the actual committed transport plus a `fallback` boolean. It still does **not** prove that a screen reader spoke or finished speaking the message. `a11y-toast:announcement-error` reports only synchronous transport failures.

Important platform limitation: the `aria-notify` Permissions Policy can block `ariaNotify()` silently. Web content cannot detect that suppression or determine whether assistive technology consumed the announcement. API support therefore does not equal delivery proof.

The experimental transport should be tested with each supported browser/screen-reader combination before product use. Keep the default live-region transport when that verification is unavailable.

## Animation drivers

The built-in default is `animation: 'css'`; use `'none'` for no decorative motion. A custom engine can be injected as a `ToastAnimationDriver` with a non-empty `name` and optional `enter(context)` / `exit(context)` functions. Driver callbacks receive the generated toast element, a frozen toast snapshot, phase, instance/root references, and an `AbortSignal`.

Drivers are not add-ons: they participate in generated DOM lifetime. They must treat abort as cleanup, must not own announcement priority, and should leave the element reusable after interruption. Core skips animation for `prefers-reduced-motion: reduce` and when the document is hidden. Destroy aborts active drivers synchronously.

The package now ships optional GSAP enter/exit, GSAP Flip stack-reflow, and an experimental element-scoped View Transition driver. All use the same TOAST-180 lifecycle contract; View Transition remains progressive enhancement rather than a default.

## Optional GSAP animation driver

The optional GSAP driver plugs into the same TOAST-180 lifecycle as the built-in CSS driver.

```ts
import { gsap } from 'gsap';
import { createToast } from 'a11y-toast';
import { createGsapAnimationDriver } from 'a11y-toast/animations/gsap';

const toast = createToast(root, {
  animation: createGsapAnimationDriver(gsap, {
    enterDuration: 0.15,
    exitDuration: 0.12,
    enterEase: 'power1.out',
    exitEase: 'power1.in',
    distance: 4,
  }),
});
```

The application supplies the GSAP instance explicitly. A11y Toast never reads `window.gsap` and the core package does not import GSAP. GSAP is declared as an optional peer for this subpath; the repository verifies the driver against GSAP 3.15.0.

Driver behavior:

- entrance animates opacity plus a small logical vertical offset toward the settled position;
- exit reverses that treatment;
- top placements use negative vertical travel and bottom placements use positive travel;
- core skips the driver entirely when `prefers-reduced-motion: reduce` is active or the document is hidden;
- timer/queue/focus semantics remain owned by core;
- abort or destroy reverts the active tween immediately;
- external GSAP interruption/overwrite rejects the driver promise, producing `animation-error`, but core still completes the toast lifecycle;
- every completion, abort, or interruption restores the exact pre-animation `style` attribute after GSAP `revert()`, so animation-owned inline opacity/transform state cannot leak into later styling.

The driver intentionally exposes only duration/ease/distance rather than arbitrary GSAP vars, preventing application configuration from replacing the lifecycle callbacks that core depends on.

GSAP Flip is **not** required by this driver. Layout/reflow animation remains a separate optional TOAST-260B concern.

## Optional GSAP Flip stack reflow

GSAP Flip is a separate layout add-on rather than part of the basic GSAP enter/exit driver:

```ts
import gsap from 'gsap';
import Flip from 'gsap/Flip';
import { createToast } from 'a11y-toast';
import { createGsapAnimationDriver } from 'a11y-toast/animations/gsap';
import { createGsapFlipLayoutAddon } from 'a11y-toast/animations/gsap-flip';

const toast = createToast(root, {
  animation: createGsapAnimationDriver(gsap),
  addons: [
    createGsapFlipLayoutAddon(gsap, Flip, {
      duration: 0.2,
      ease: 'power1.inOut',
    }),
  ],
});
```

The factory registers the caller-supplied Flip plugin with the caller-supplied GSAP instance. Re-registering a GSAP plugin is harmless, and explicit registration helps avoid bundler/tree-shaking problems.

Scope is deliberately narrow:

- existing surviving notifications are measured before show/update/dismiss mutations;
- entering and leaving toast elements are **not** animated by Flip, so CSS/GSAP enter/exit keeps sole ownership;
- updating a toast excludes that toast itself and moves only siblings displaced by the reflow;
- an animated dismissal waits until its exit completes and queued promotion has happened before survivors Flip to their final positions;
- synchronous stack changes are coalesced into one Flip pass;
- `prefers-reduced-motion: reduce` skips `Flip.getState()` and `Flip.from()` entirely;
- unregister/destroy cleans pending and active Flip state without changing toast lifecycle.

The add-on preserves authored DOM state despite Flip's own measurement/animation side effects. It snapshots `data-flip-id` and inline styles before measurement, distinguishes Flip-created style changes from application-authored changes, and restores the correct final authored state after Flip finalization.

No `onEnter`/`onLeave` Flip animation is used. Queue promotion still gets its normal toast entrance animation, and dismissed items keep their normal exit animation.

## Experimental element-scoped View Transition driver

The experimental View Transition driver uses the element-scoped API on each toast element:

```ts
import { createToast } from 'a11y-toast';
import { createElementViewTransitionDriver } from 'a11y-toast/animations/view-transition';
import 'a11y-toast/styles.css';
import 'a11y-toast/animations/view-transition.css';

const toast = createToast(root, {
  animation: createElementViewTransitionDriver(),
});
```

This is intentionally **element-scoped only**. The driver never calls `document.startViewTransition()` as a fallback.

Why that boundary matters:

- each toast owns its own transition scope;
- unrelated page interaction is not deliberately wrapped in a document-wide transition;
- multiple toast elements can use independent scoped transitions where the browser supports them;
- unsupported browsers settle the driver immediately with no decorative motion and no toast lifecycle error.

The driver keeps TOAST-180 semantics intact:

- `show()` still commits the toast immediately;
- announcements do not wait for motion;
- the timer starts after entrance settles or is skipped;
- an exiting toast remains inert/aria-hidden and retains its visual slot until the scoped transition finishes;
- `prefers-reduced-motion: reduce` causes core to skip the driver before `startViewTransition()` is called;
- abort/destroy calls `skipTransition()` when a scoped transition is active.

Overlapping phases on the **same toast element** are serialized. If an entrance is aborted because the toast is dismissed, the skipped entrance's `finished` promise settles before the exit transition starts. Different toast elements remain independent.

Motion state is expressed with temporary data attributes and the optional stylesheet rather than inline opacity/translate writes. The driver restores any authored values after browser transition finalization:

- `data-a11y-toast-view-transition-phase`
- `data-a11y-toast-view-transition-state`
- `data-a11y-toast-view-transition-direction`

Public CSS variables:

- `--a11y-toast-view-transition-distance`
- `--a11y-toast-view-transition-enter-duration`
- `--a11y-toast-view-transition-exit-duration`
- `--a11y-toast-view-transition-enter-ease`
- `--a11y-toast-view-transition-exit-ease`

Element-scoped View Transitions are still an experimental/limited-availability web-platform feature, so this subpath should be treated as progressive enhancement and tested in the actual supported browser matrix.

## Visual timeout progress add-on

The optional progress add-on adds a decorative horizontal remaining-time bar to visible timed notifications without creating another timer or accessibility announcement.

```ts
import { createToast } from 'a11y-toast';
import { createProgressAddon } from 'a11y-toast/addons/progress';
import 'a11y-toast/styles.css';
import 'a11y-toast/addons/progress.css';

const toast = createToast(root, {
  addons: [createProgressAddon()],
});
```

It appears only for visible timed notifications. Persistent, loading, queued, and default actionable/urgent notifications do not get a progress indicator until their state actually becomes timed and visible.

The add-on reads the core's authoritative `duration`, `remaining`, pause reasons, and animation phase. It uses lifecycle-boundary CSS transform transitions rather than a repeating JavaScript timer or animation-frame loop. Focus/hover/API/action/document pauses freeze the indicator, and updates resynchronize it from the toast snapshot.

The progress DOM is `aria-hidden`, has no `progressbar` role, and is never a live region. It communicates no required information. Under `prefers-reduced-motion: reduce`, the optional progress surface is hidden.

Public styling variables:

- `--a11y-toast-progress-height`
- `--a11y-toast-progress-track`
- `--a11y-toast-progress-color`

Unregistering the add-on removes its generated DOM without changing the toast timer or lifecycle.

## Promise/loading orchestration

The optional promise utility keeps asynchronous feedback on one toast ID instead of creating separate loading/success/error notifications.

```ts
import { trackToastPromise } from 'a11y-toast/addons/promise';

const handle = trackToastPromise(toast, saveChanges(), {
  loading: 'Saving changes…',
  success: { message: 'Changes saved.', duration: 5000 },
  error: { message: 'Changes could not be saved. Try again.', persistent: true },
});

await handle.promise;
```

The loading state always uses the loading tone and therefore remains persistent while work is pending. Success defaults to the success tone and error defaults to the error tone unless the supplied outcome state explicitly chooses another tone.

The error state is required application-authored copy. Rejection objects, exception messages, stack traces, HTTP bodies, and other raw failure values are never rendered automatically.

The utility:

- retains one toast ID across loading → success/error;
- installs its lifecycle listeners only if the returned toast and manager are still active after synchronous show callbacks;
- can settle while the toast is queued; the latest state is shown when promoted;
- stops updating if the toast is dismissed or the manager is destroyed;
- returns the underlying normalized promise unchanged in meaning;
- exposes `stop()` to detach toast orchestration without dismissing the toast or cancelling the underlying operation;
- returns `id: null` if the loading toast is rejected by queue capacity while still passing the promise through.

`trackToastPromise` does not cancel the operation. If the operation itself needs cancellation, own that separately with the application's normal AbortController/domain API.

## Explicit key-based deduplication

Core never deduplicates automatically. The optional controller provides explicit exact-key behavior without comparing message text.

```ts
import { createDedupeController } from 'a11y-toast/addons/dedupe';

const dedupe = createDedupeController(toast, {
  policy: 'update-existing',
});

await dedupe.show({
  key: 'network-status',
  message: 'Connection restored.',
  tone: 'success',
  duration: 5000,
});
```

Keys are trimmed, case-sensitive, and required for this controller.

Policies:

- `update-existing` — default. Reuses the first active matching toast ID and normal `update()` semantics. Visible/queued position is preserved and content-only updates do not implicitly restart the timer.
- `drop-new` — keeps the existing keyed toast unchanged. No new toast, update, or announcement is created.
- `replace-existing` — logically dismisses the existing toast, waits for any visual exit, then creates a new ID. A queued replacement therefore receives a new queue position.

Operations for the same key are serialized by the controller. If external dismissal code creates the same key while a replacement is waiting for exit completion, that active toast is adopted/updated instead of creating another duplicate.

Different keys do not block each other. Direct `toast.show({ key })` calls remain unaffected and can still create duplicates by design.

The controller reports `shown`, `updated`, `kept-existing`, `replaced`, `rejected`, or `stopped`, together with the resulting ID and previous ID where relevant. `destroy()` stops future controller work without changing existing toast state.

## Generic DOM-event adapter

The optional DOM-event adapter bridges an external `EventTarget` to toast commands without inspecting the source component's private state.

```ts
import { createDomEventAdapter } from 'a11y-toast/adapters/dom-events';

const adapter = createDomEventAdapter(toast, {
  target: uploader,
  announcementOwner: 'source',
  bindings: [{
    event: 'upload:status',
    map(event) {
      if (!(event instanceof CustomEvent)) return { type: 'ignore' };

      if (event.detail.phase === 'done') {
        return {
          type: 'update',
          correlationKey: event.detail.id,
          patch: { message: 'Upload complete.', tone: 'success', duration: 5000 },
        };
      }

      return {
        type: 'show',
        correlationKey: event.detail.id,
        input: { message: 'Uploading…', tone: 'loading' },
      };
    },
  }],
});
```

Announcement ownership is mandatory:

- `announcementOwner: 'toast'` — mapped toast priority is preserved and A11y Toast owns the announcement.
- `announcementOwner: 'source'` — the adapter forces mapped show/update priority to `off`, so a source component that already announces does not create duplicate toast speech.

Bindings map source events synchronously to `show`, `update`, `dismiss`, or `ignore` commands. A `correlationKey` retains the toast ID across source lifecycle events. Repeated `show` commands for the same active correlation update the retained toast instead of creating another record. Nested commands for the same key run in order after the current command commits its tracking; other keys remain independent. A synchronous same-key transaction accepts at most 100 commands, including its initial command. Overflow discards pending commands for that key and reports one `RangeError` through `onError`, using the rejected source event context. Further same-key commands are ignored until that transaction unwinds; later source events can resume normal work. A core update refused while that toast is already updating preserves its correlation.

Unknown update/dismiss correlations are safe no-ops. External toast dismissal clears adapter tracking. Mapper/command failures are isolated through optional `onError`; they do not break source event dispatch.

`destroy()` removes every source/toast listener and clears pending nested commands. `dismissTrackedOnDestroy: true` can additionally dismiss active adapter-tracked toasts when the adapter itself is disposed, including a correlated toast whose show observer disposes the adapter before its ID is returned. Destroying the toast manager automatically disposes the adapter.

Correlation keys are adapter-local lifecycle identifiers; they are independent from the optional key-deduplication controller.

## A11y Menu Button async-state adapter

The first concrete ecosystem adapter mirrors the published `a11y-menu-button` async-state add-on into A11y Toast.

It is a separate subpath with an optional peer dependency on `a11y-menu-button@^1.0.1`; the A11y Toast core keeps zero runtime dependencies.

```ts
import { createToast } from 'a11y-toast';
import { createMenuButtonAsyncStateToastAdapter } from 'a11y-toast/adapters/menu-button-async-state';
import {
  createMenuButton,
} from 'a11y-menu-button/core';
import {
  enhanceAsyncMenuState,
} from 'a11y-menu-button/addons/async-menu-state';

const menu = createMenuButton(menuRoot);
const asyncState = enhanceAsyncMenuState(menuRoot);
const toast = createToast(toastRoot);

const bridge = createMenuButtonAsyncStateToastAdapter(toast, menuRoot);
```

The adapter imports the source package's actual `MENU_BUTTON_EVENTS.asyncState` and `MENU_BUTTON_EVENTS.destroy` constants and typed event detail rather than repeating event-name strings.

Announcement ownership is fixed to **source** because A11y Menu Button's async-state add-on already maintains a polite `role="status"` live region. The mirrored toast therefore always uses `priority: 'off'`.

State mapping:

- `loading` → persistent loading-tone visual toast;
- `error` → same retained toast ID, error tone, persistent;
- `empty` → same retained toast ID, info tone, persistent;
- `ready` → dismiss the mirrored toast.

The visible toast message comes from the source event's `stateElement.textContent`, so the adapter mirrors the source-owned user-facing status rather than reading private implementation fields or fabricating a second message. No synthetic “loaded successfully” toast is invented for `ready`.

Destroying the Menu Button core disposes the bridge and dismisses its mirrored toast. Destroying A11y Toast removes both the generic adapter listeners and the wrapper's Menu Button destroy listener. If an application destroys only the async-state add-on while keeping the Menu Button core alive, destroy this bridge alongside that add-on because the async-state add-on itself has no destroy lifecycle event.

## Add-ons and ecosystem integration

```ts
const logger = {
  name: 'application-logger',
  setup(context) {
    return context.on(TOAST_EVENTS.show, event => {
      console.log(event.detail.toast.id);
    });
  },
};
toast.registerAddon(logger);
```

`setup` must synchronously return a cleanup function or nothing. Its context provides the public instance, root, an abort signal, auto-cleaned typed `on()` subscriptions, and `holdTimer(id)`. A hold pauses a visible toast using the separate `gesture` reason and returns an idempotent release function. Overlapping holds are counted; releasing one cannot clear an API, focus, hover or visibility pause, and unregister/destroy releases owned holds. Selected observer hooks are `beforeShow`, `afterShow`, `beforeUpdate`, `afterUpdate`, `beforeDismiss`, `afterDismiss`. Snapshots are not writable middleware; return values cannot cancel operations. Hooks are not awaited. Accidental returned-promise failures are isolated instead of becoming unhandled rejections.

Unregister removes subscriptions and aborts the add-on signal; destroy cleans up in reverse registration order. Setup/hook/cleanup failures while the instance is active emit bounded `addon-error` diagnostics. Failures during destruction are isolated without dispatching after the terminal `destroy` event. One failed add-on does not stop core cleanup.

For interoperability, subscribe to the **source package's actual exported events**, map useful outcomes to `show`/`update`/`dismiss`, and retain toast IDs. Do not inspect another component's private collections. If the source already announces a result, use `priority: 'off'` on the toast. Only one component should own each announcement.

The package ships the generic DOM-event adapter and the A11y Menu Button async-state adapter described above; no framework adapter is included. Menu Button uses its exported `menu-button:*` events; do not assume every package has the same literal prefix.

## Swipe dismissal

The swipe add-on lets pointer users drag a visible, dismissible notification horizontally to dismiss it. It is registered per manager, does not run on import, and leaves the labeled close button available for keyboard and assistive-technology users.

```ts
import { createSwipeDismissAddon } from 'a11y-toast/addons/swipe-dismiss';
import 'a11y-toast/addons/swipe-dismiss.css';

// The manager uses animation: 'css' (default) or 'none'.
toast.registerAddon(createSwipeDismissAddon());
```

Use the add-on with `animation: 'none'` or the built-in CSS animation driver. The drag is supplementary: keep `dismissible: true` for notifications that should be swipeable, and keep essential information or actions available elsewhere. Touch users can scroll the stack vertically. Reduced-motion preferences and target screen readers still need direct testing in the host application.

## Notification history

```ts
import { createHistoryController } from 'a11y-toast/addons/history';
const history = createHistoryController(toast, { maxEntries: 50 });
const entries = history.getEntries(); // frozen show/update/dismiss entries
history.clear();   // clears history only, not active notifications
history.destroy(); // clears and unregisters the owned observer
```

Attach before producing notifications: existing toasts are not backfilled. Capacity counts lifecycle entries, not distinct toast IDs; the default is 50, with an accepted integer range of 1–1,000. Entries are oldest-observed first and contain no callbacks, DOM nodes or action replay surface. No storage, announcement replay, action replay, polling or core options are added. Core destruction or external history unregistration clears internal data. Previously retained caller copies cannot be revoked.

The advanced lab includes an application-owned, non-live inspector with explicit Refresh and Clear controls. This is a bounded event history, not a current-state cache or durable notification center. [History contract](HISTORY.md) · [TOAST-270 evidence and remaining gates](TOAST-270-VERIFICATION.md). Earlier history checks do not verify the current demo cleanup.

## Development diagnostics

```ts
import { createDiagnosticsAddon } from 'a11y-toast/addons/diagnostics';

toast.registerAddon(createDiagnosticsAddon({
  report(diagnostic) {
    // The application decides where development reports go.
    developmentReports.push(diagnostic);
  },
  // Optional and off by default; counts Unicode code points.
  longMessageLength: 500,
}));
```

The diagnostics add-on observes one manager and reports advisory signals for timed actions, timed assertive messages, queue rejection, repeated assertive commits, announcement/animation/action/add-on errors, and—when configured—exceptionally long visible messages. Assertive bursts default to three committed assertive announcements in a rolling 10-second window. State-based advice reports only on a false-to-true transition.

`report` is required and synchronous. Nothing is written to the console, DOM, telemetry, storage, or network by default. Frozen reports contain only a code, severity, timestamp, instance/toast IDs, and relevant non-content metadata; message text, announcement text, labels, thrown values, DOM nodes, and manager references are excluded. Reporter failures are isolated through the normal add-on error lifecycle.

These heuristics are development aids. They may need application-specific interpretation, do not establish a WCAG failure or conformance, and cannot determine whether a screen reader spoke or completed an announcement. Importing the subpath has no effect until the returned add-on is registered; it is intentionally absent from the core root export.

## CSS

Import `a11y-toast/styles.css` explicitly. Behavior uses `data-*`; presentation uses BEM. Core adds `.a11y-toast-region` to the host, creates `.a11y-toast-region__viewport` and `.a11y-toast-region__list`, and renders each notification as `.a11y-toast`. Managed item state classes are `.is-entering`, `.is-exiting`, `.is-paused` and `.is-action-pending`; observe them for styling rather than toggling them manually. There is no page reset, framework stylesheet, CSS-in-JS runtime, or imported font.

Public variables include:

- Surface/layout: `--a11y-toast-background`, `--a11y-toast-color`, `--a11y-toast-muted`, `--a11y-toast-border`, `--a11y-toast-radius`, `--a11y-toast-shadow`, `--a11y-toast-gap`, `--a11y-toast-offset`, `--a11y-toast-width`, `--a11y-toast-max-height`, `--a11y-toast-z-index`, `--a11y-toast-font`.
- Interaction: `--a11y-toast-focus`, `--a11y-toast-hover-background`.
- Icons/actions: `--a11y-toast-icon-size`, `--a11y-toast-icon-glyph-size`, `--a11y-toast-icon-radius`, `--a11y-toast-icon-background`, `--a11y-toast-icon-color`, `--a11y-toast-action-gap`.
- Motion: `--a11y-toast-enter-duration`, `--a11y-toast-exit-duration`, `--a11y-toast-enter-ease`, `--a11y-toast-exit-ease`, `--a11y-toast-motion-distance`.
- Tone accents: `--a11y-toast-neutral-accent`, `--a11y-toast-info-accent`, `--a11y-toast-success-accent`, `--a11y-toast-warning-accent`, `--a11y-toast-error-accent`, `--a11y-toast-loading-accent`.

Private `--_` variables are implementation details, not a supported customization API. Changing colors remains the integrator's contrast responsibility.

The notification list grows to fit its visible toasts up to the available viewport height (minus the configured offset). It scrolls vertically only when the stack or a long message needs more space. `--a11y-toast-max-height` can set a smaller host-specific limit. The package default remains three visible toasts; the advanced lab opts into five for its batch example.

The visual viewport is a named section with an ordered notification list. Text-only status/alert regions are siblings outside the interactive viewport. Default controls have 44px-equivalent minimum target dimensions at the standard root text size. Tone has a visible text label by default, not just an accent color. With `showToneLabel: false`, that label is visually hidden rather than removed, so assistive-technology users can still encounter the tone when revisiting the notification; generated announcement wording is unchanged. Do not rely on the accent color alone to communicate essential meaning. Reduced motion removes entrance and exit animation; forced colors preserves borders/focus styling. Logical positions mirror with inherited direction.

## Accessibility and integration limitations

Use Tab and Shift+Tab to reach the scrollable notification list and its native action/close buttons. Enter or Space activates a focused button; Arrow and Page Up/Page Down keys scroll natively while the list is focused. Focus pauses the relevant timers. There is no global Escape handler or custom arrow-key navigation.

Showing a toast never focuses it. Focused dismiss/action removal tries an explicit origin, then the captured surviving focus target, then another notification control. If no target remains, a visible “No notifications” region is available until focus leaves. Content-only updates retain existing button nodes. Removing the entire host/view is still an application lifecycle operation: supply valid origins and coordinate focus when disposing surrounding UI.

Do not mount under another live region. Do not use a toast as a dialog, required confirmation, sole validation error, or the only timed way to access important information/actions. A five-second duration and hover pause alone do not establish WCAG conformance.

This release does not auto-move hosts into the top layer, out of inert content, across shadow roots, or between route scopes. Select an appropriate host inside the active interaction scope. High zoom, focused-page-content overlap, active dialogs, real mobile assistive technology, and app-specific focus restoration need integration testing. Detaching a root is **not** an implicit `destroy`; dispose it explicitly. No global MutationObserver is installed.

References used for these decisions:

- W3C, Understanding SC 2.2.1: https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable
- W3C APG, Alert Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/alert/
- MDN, ARIA live regions: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions

## Building the demo site

The committed `docs/` folder is the static GitHub Pages source. The generated showcase is served at the Pages root, the lab at `/advanced/` and the gallery at `/designs/`; existing Markdown documentation remains alongside them. Refresh the package and all three Pages routes together with:

```sh
npm run pages:build
```

For the repository's one-time Pages configuration, choose **Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/docs`**. The regular verification workflow does not deploy the site. `npm run build:dist` builds only package artifacts, while `npm run pages:generate` refreshes Pages files from an existing `dist/` build.

## Documentation metadata

The package provides structured metadata for documentation tools:

```ts
import { docs } from 'a11y-toast/docs';
```

For implementation decisions and verification scope, see the [behavior contract](CONTRACT.md), [verification record](VERIFICATION.md) and [manual test matrix](MANUAL_TESTS.md).
