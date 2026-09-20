/** Pure metadata: importing this module never loads or initializes the DOM runtime. */
export const docs = {
  slug: 'a11y-toast', name: 'A11y Toast', packageName: 'a11y-toast',
  description: 'Framework-free toast notifications with explicit announcement priority, bounded queues, safe timers and lifecycle events.',
  status: '0.1.0 — manual assistive-technology verification pending; not published by this delivery',
  install: { npm: 'npm install a11y-toast', pnpm: 'pnpm add a11y-toast', yarn: 'yarn add a11y-toast' },
  usage: `import { createToast } from 'a11y-toast';\nimport 'a11y-toast/styles.css';\nconst root = document.querySelector('[data-a11y-toast]');\nif (root instanceof HTMLElement) {\n  const toast = createToast(root);\n  toast.success('Your changes were saved.');\n}`,
  selectors: ['[data-a11y-toast]', '[data-a11y-toast-id]', '[data-a11y-toast-action]', '[data-a11y-toast-dismiss]'],
  keyboard: [
    { key: 'Tab / Shift+Tab', description: 'Reach the scrollable notification list and its native action/dismiss buttons. Focus pauses relevant timers.' },
    { key: 'Enter / Space', description: 'Activate a focused native button.' },
    { key: 'Arrow / Page Up / Page Down', description: 'Native scrolling while the notification list is focused. No custom global shortcuts.' },
  ],
  api: [
    { name: 'createToast(root, options)', type: '(HTMLElement, ToastOptions?) => A11yToast', description: 'Initialize a mounted, non-live host; duplicate initialization reuses the active manager.' },
    { name: 'initToastAll(options, scope)', type: '(ToastOptions?, ParentNode?) => A11yToast[]', description: 'Explicitly initialize matching descendants. Never runs on import.' },
    { name: 'show(input)', type: '(ToastInput) => string | null', description: 'Display or enqueue a toast. null means the bounded queue rejected it.' },
    { name: 'info / success / warning / error / loading', type: '(string, ToastShorthandOptions?) => string | null', description: 'Tone convenience methods. Error does not imply assertive priority.' },
    { name: 'update(id, patch)', type: '(string, ToastPatch) => boolean', description: 'Patch an existing visible/queued record. Content-only updates preserve remaining time.' },
    { name: 'dismiss(id, reason)', type: '(string, ToastDismissReason?) => boolean', description: 'Logically dismiss one record immediately; an optional inert visual exit may finish before its queue slot is released.' },
    { name: 'dismissAll(reason)', type: '(ToastDismissReason?) => number', description: 'Remove visible and queued records without showing intermediate queued items.' },
    { name: 'pause(id) / resume(id)', type: '(string) => boolean', description: 'Manage the caller-owned API pause without overriding keyboard/hover/visibility safeguards.' },
    { name: 'getToast(id) / getToasts()', type: 'Readonly snapshot accessors', description: 'Inspect state without receiving callbacks, origin nodes or mutable collections.' },
    { name: 'registerAddon / unregisterAddon / getAddon / getAddons', type: 'ToastAddon lifecycle', description: 'Explicit per-instance setup, selected observer hooks, subscriptions and cleanup.' },
    { name: 'destroy()', type: '() => void', description: 'Idempotent teardown; cancel timers, scheduled announcements and action signals; preserve authored DOM.' },
    { name: 'addToastEventListener(target, type, listener, options)', type: 'Typed DOM-event helper returning cleanup', description: 'Subscribe to TOAST_EVENTS. Events bubble, are not cancelable, and do not cross shadow boundaries.' },
  ],
  examples: [{ name: 'Playground', description: 'One page with content/timing/announcement-transport/animation/progress/dedupe controls, loading/update, actions, FIFO queue and a non-live event log.', path: 'examples/basic' }],
  addons: [
    { name: 'Progress', export: 'a11y-toast/addons/progress', stylesheet: 'a11y-toast/addons/progress.css', description: 'Visual-only timeout progress synchronized from core lifecycle snapshots; no live or progressbar semantics.' },
    { name: 'Promise orchestration', export: 'a11y-toast/addons/promise', description: 'Retains one toast ID across loading → success/error with caller-authored error copy and late-settlement guards.' },
    { name: 'Key deduplication', export: 'a11y-toast/addons/dedupe', description: 'Explicit exact-key update/drop/replace policies; no message-text or automatic core deduplication.' },
  ],
  adapters: [
    { name: 'DOM events', export: 'a11y-toast/adapters/dom-events', description: 'Maps external EventTarget lifecycles to correlated toast show/update/dismiss commands with explicit single-owner announcement policy.' },
    { name: 'A11y Menu Button async state', export: 'a11y-toast/adapters/menu-button-async-state', peer: 'a11y-menu-button@^1.0.1', description: 'Mirrors Menu Button loading/error/empty states visually with source-owned announcements and dismisses the mirror on ready.' },
  ],
  transports: [
    { name: 'Live regions', value: 'live-region', status: 'default', description: 'Stable polite/assertive DOM announcement transport.' },
    { name: 'ariaNotify', export: 'a11y-toast/transports/aria-notify', status: 'experimental', description: 'Uses Document.ariaNotify when available and falls back to the scheduled live region only when the API is absent.' },
  ],
  accessibility: {
    focusOnShow: false, priorityDefault: 'polite', announcementTransport: 'Live regions by default; experimental ariaNotify is explicit opt-in with unsupported-browser fallback.',
    toneLabel: 'Visible by default; showToneLabel:false visually hides the tone label while keeping the text available to assistive technology and generated live announcements.',
    motion: 'CSS motion is decorative, reduced-motion skips it, announcements do not wait for it, and timed lifetime begins after entrance settles.',
    limitations: 'An announce event records a transport commit attempt, not proof of speech. ariaNotify Permissions Policy suppression may be silent. Timed content must remain available elsewhere. No modal/top-layer portal or shared cross-manager announcer.',
  },
} as const;
