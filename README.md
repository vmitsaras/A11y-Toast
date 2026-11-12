# A11y Toast

Toast notifications for JavaScript and TypeScript. Let someone know a save finished, keep an upload's status in one place, or offer Undo after deleting a file.

Messages can include a title, an icon and an action button. They can disappear after a few seconds or stay until dismissed. Showing a toast leaves keyboard focus where it is, and timers pause while someone hovers over or focuses a notification.

A11y Toast uses native buttons and live regions for screen readers. It works with plain JavaScript or alongside a framework, with no runtime dependencies.

[Try the examples](https://vmitsaras.github.io/A11y-Toast/) · [Browse 15 designs](https://vmitsaras.github.io/A11y-Toast/designs/) · [Explore the advanced lab](https://vmitsaras.github.io/A11y-Toast/advanced/)

## What you can do

- Show success, error, warning, information, neutral and loading messages.
- Add an action such as Undo or Retry.
- Update a message when a task finishes, keeping the same notification on screen.
- Stack notifications in six positions, with a queue for messages waiting for space.
- Choose one of fifteen CSS skins or use your own colors, spacing and typography.
- Add swipe dismissal, a timeout progress bar, promise handling or in-memory history when you need them.

## Installation

**Version 1.0.0 is prepared but has not been published to npm.** For now, [run the examples from this repository](#run-the-examples-locally). Once published, install it with your preferred package manager:

```sh
npm install a11y-toast
# or
pnpm add a11y-toast
# or
yarn add a11y-toast
```

Import the JavaScript and base stylesheet in your application. The package uses ES modules.

## Usage

Add a host element to your page:

```html
<button id="notify" type="button">Show notification</button>
<div class="app-notifications" data-a11y-toast></div>
```

Create the toast manager and connect it to a button:

```ts
import { createToast } from 'a11y-toast';
import 'a11y-toast/styles.css';

const host = document.querySelector('[data-a11y-toast]');
if (!(host instanceof HTMLElement)) {
  throw new Error('Add a toast host before creating notifications.');
}

const toast = createToast(host);

document.querySelector('#notify')?.addEventListener('click', () => {
  toast.success('Your changes were saved.');
});
```

This button demonstrates the notification; in an application, show it after the save succeeds. Nothing initializes or displays automatically when you import the package.

Keep the host mounted and outside other live regions. Call `toast.destroy()` when its page or view is removed. Creating another manager on the same host returns the existing one.

## Show a message

```ts
toast.success('Changes saved.');
toast.error('The file could not be uploaded.');
toast.warning('Your session will expire soon.');
toast.info('A new version is available.');
```

For a title or a neutral message, use `show()`:

```ts
toast.show({
  title: 'Download ready',
  message: 'Your report is ready to open.',
  tone: 'neutral',
});
```

Messages are rendered as text. Use your own application-created HTML or SVG element for a decorative icon; HTML strings are not accepted. See [icons and inline actions](docs/REFERENCE.md#decorative-icons-and-inline-actions).

## Add an action

```ts
toast.show({
  message: 'File deleted.',
  tone: 'success',
  action: {
    label: 'Undo',
    onClick: () => restoreFile(),
    dismissOnSuccess: true,
  },
});
```

Here, `restoreFile()` is your application's restore operation. The message stays visible by default so someone has time to reach Undo. Activating Close dismisses the notification; only Undo runs the action.

Actions can return a promise. The button prevents repeated activation while it waits, and a failed action stays available to retry.

## Update a loading message

```ts
const id = toast.loading('Uploading your file…');

// When your upload succeeds:
if (id) {
  toast.update(id, {
    message: 'File uploaded.',
    tone: 'success',
  });
}
```

Loading messages stay visible until updated or dismissed. Switching to success starts the usual timeout unless you explicitly made the message persistent. The optional [promise helper](docs/REFERENCE.md#promiseloading-orchestration) handles loading, success and error text for an existing promise.

To leave any message visible until it is dismissed:

```ts
toast.info('You are offline. Your changes are still on this page.', {
  persistent: true,
});
```

## Timing and placement

Pass options when creating the manager:

```ts
const toast = createToast(host, {
  position: 'top-end',
  duration: 6000,
  maxVisible: 3,
});
```

| Setting | Default | Choices |
| --- | --- | --- |
| `position` | `bottom-end` | `top-start`, `top-center`, `top-end`, `bottom-start`, `bottom-center`, `bottom-end` |
| `duration` | `5000` ms | `0` to keep a message visible; positive durations are at least 1,000 ms |
| `maxVisible` | `3` | 1–8 visible notifications |
| `maxQueue` | `10` | 0–100 waiting notifications |
| `animation` | `css` | `css`, `none`, or an optional animation driver |
| `showToneLabel` | `true` | Show or visually hide the tone label |

Start/end placement follows the page's text direction. A waiting toast's timer starts when it becomes visible and its entrance finishes. Timers pause on hover, keyboard focus and hidden browser tabs. Updating the text keeps the remaining time; passing a new `duration` restarts it.

If the queue is full, `show()` returns `null`. Messages with actions, loading messages and assertive announcements stay visible by default. See [all options and timer rules](docs/REFERENCE.md#manager-options) for details.

## Toast skins

Load the base CSS followed by a skin:

```ts
import 'a11y-toast/styles.css';
import 'a11y-toast/skins/soft.css';
```

Add the matching class to your toast host:

```html
<div class="app-notifications a11y-toast-region--skin-soft" data-a11y-toast></div>
```

Available skins: `minimal`, `compact`, `rounded`, `classic-light`, `classic-dark`, `snackbar`, `soft`, `outline`, `solid`, `accent-rail`, `top-rule`, `split-panel`, `header-band`, `action-footer` and `monochrome`.

[The design gallery](https://vmitsaras.github.io/A11y-Toast/designs/) lets you try each skin with different tones and content, copy its setup, or download the CSS. Skins work with the same JavaScript API. For side-by-side actions, use `actionLayout: 'inline'` and a host at least 32rem wide; actions stack in narrower spaces.

You can also adjust the appearance with CSS properties:

```css
.app-notifications {
  --a11y-toast-width: 26rem;
  --a11y-toast-radius: 0.5rem;
  --a11y-toast-font: system-ui, sans-serif;
}
```

See the [CSS reference](docs/REFERENCE.md#css) for colors, spacing, focus styles and motion settings.

## Accessibility

New messages use polite live-region announcements by default. The message's tone and urgency are separate: an error does not automatically interrupt a screen reader. Use `priority: 'off'` when another part of your interface already announces the same result.

- Showing a toast leaves focus on the current control.
- Tab and Shift+Tab reach the notification list and its native action and Close buttons. Enter or Space activates a button.
- Focusing a notification or its scrollable list pauses its timer.
- Reduced-motion settings turn off entrance and exit animation. Styles include visible focus and system high-contrast support.
- Essential results and actions should also be available in the page. A toast should not be the only place to find a form error, confirmation or important instruction.

Test the integration with your target browsers and assistive technologies. Automated checks pass, but manual VoiceOver, current-layout browser zoom and native-touch checks are still pending. The [manual test matrix](docs/MANUAL_TESTS.md) records that coverage.

## Optional extras

Import only the extras you use:

| Extra | What it adds | Guide |
| --- | --- | --- |
| Progress | A visual timeout bar | [Setup](docs/REFERENCE.md#visual-timeout-progress-add-on) |
| Swipe dismissal | Drag a notification horizontally to close it | [Setup](docs/REFERENCE.md#swipe-dismissal) |
| Promise helper | Loading, success and error text for one task | [Setup](docs/REFERENCE.md#promiseloading-orchestration) |
| History | A bounded record of shown, updated and dismissed messages | [Guide](docs/HISTORY.md) |
| Deduplication | Update, ignore or replace messages with the same explicit key | [Setup](docs/REFERENCE.md#explicit-key-based-deduplication) |
| DOM-event adapters | Connect other components' events to notifications | [Setup](docs/REFERENCE.md#generic-dom-event-adapter) |
| Diagnostics | Development reports about timing, queues and errors | [Setup](docs/REFERENCE.md#development-diagnostics) |
| Animation | GSAP, GSAP Flip and experimental element-scoped View Transitions | [Guide](docs/REFERENCE.md#animation-drivers) |

## API reference

Use `createToast()` for one host, `initToastAll()` for matching hosts, or construct `A11yToast` directly.

| Method | Purpose |
| --- | --- |
| `show()` and tone helpers | Show a message and return its ID, or `null` if the queue is full |
| `update(id, patch)` | Change an existing message |
| `dismiss(id)` / `dismissAll()` | Close one message or clear the stack and queue |
| `pause(id)` / `resume(id)` | Pause or resume the timer from application code |
| `getToast(id)` / `getToasts()` | Read the current notification state |
| `destroy()` | Remove the manager's timers, listeners and generated elements |

The [full reference](docs/REFERENCE.md) includes options, events, data attributes, actions, add-ons and integration examples. For a prototype upgrade, see the [migration guide](docs/MIGRATION.md).

## Run the examples locally

Use Node.js 24, or Node.js 22.12 or later on the Node 22 line:

```sh
npm ci
npm run build
npm run demo
```

Open the [showcase](http://127.0.0.1:4173/examples/basic/), [advanced lab](http://127.0.0.1:4173/examples/advanced/) or [design gallery](http://127.0.0.1:4173/examples/designs/). The examples need an HTTP server; opening their files directly will not load the JavaScript modules.

To run the checks after building:

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run test:package
npm run pack:check
```

See [CI](https://github.com/vmitsaras/A11y-Toast/actions/workflows/verify.yml), the [verification record](docs/VERIFICATION.md) and [example guide](examples/basic/README.md) for more detail.

## License

[MIT](LICENSE)
