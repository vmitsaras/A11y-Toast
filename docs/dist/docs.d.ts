//#region src/docs.d.ts
/** Pure metadata: importing this module never loads or initializes the DOM runtime. */
declare const docs: {
  readonly slug: "a11y-toast";
  readonly name: "A11y Toast";
  readonly packageName: "a11y-toast";
  readonly description: "Framework-free toast notifications with explicit announcement priority, bounded queues, safe timers and lifecycle events.";
  readonly status: "0.1.0 — manual assistive-technology verification pending; not published by this delivery";
  readonly install: {
    readonly npm: "npm install a11y-toast";
    readonly pnpm: "pnpm add a11y-toast";
    readonly yarn: "yarn add a11y-toast";
  };
  readonly usage: "import { createToast } from 'a11y-toast';\nimport 'a11y-toast/styles.css';\nconst root = document.querySelector('[data-a11y-toast]');\nif (root instanceof HTMLElement) {\n  const toast = createToast(root);\n  toast.success('Your changes were saved.');\n}";
  readonly selectors: readonly ["[data-a11y-toast]", "[data-a11y-toast-id]", "[data-a11y-toast-action]", "[data-a11y-toast-dismiss]"];
  readonly keyboard: readonly [{
    readonly key: "Tab / Shift+Tab";
    readonly description: "Reach the scrollable notification list and its native action/dismiss buttons. Focus pauses relevant timers.";
  }, {
    readonly key: "Enter / Space";
    readonly description: "Activate a focused native button.";
  }, {
    readonly key: "Arrow / Page Up / Page Down";
    readonly description: "Native scrolling while the notification list is focused. No custom global shortcuts.";
  }];
  readonly api: readonly [{
    readonly name: "createToast(root, options)";
    readonly type: "(HTMLElement, ToastOptions?) => A11yToast";
    readonly description: "Initialize a mounted, non-live host; duplicate initialization reuses the active manager.";
  }, {
    readonly name: "initToastAll(options, scope)";
    readonly type: "(ToastOptions?, ParentNode?) => A11yToast[]";
    readonly description: "Explicitly initialize matching descendants. Never runs on import.";
  }, {
    readonly name: "show(input)";
    readonly type: "(ToastInput) => string | null";
    readonly description: "Display or enqueue a toast. Optional icon accepts a trusted passive HTML/SVG element, cloned on ingestion; HTML strings are rejected. actionLayout selects stacked (default) or inline placement. null means the bounded queue rejected it.";
  }, {
    readonly name: "info / success / warning / error / loading";
    readonly type: "(string, ToastShorthandOptions?) => string | null";
    readonly description: "Tone convenience methods. Error does not imply assertive priority.";
  }, {
    readonly name: "update(id, patch)";
    readonly type: "(string, ToastPatch) => boolean";
    readonly description: "Patch an existing visible/queued record. Content-only updates preserve remaining time.";
  }, {
    readonly name: "dismiss(id, reason)";
    readonly type: "(string, ToastDismissReason?) => boolean";
    readonly description: "Logically dismiss one record immediately; an optional inert visual exit may finish before its queue slot is released.";
  }, {
    readonly name: "dismissAll(reason)";
    readonly type: "(ToastDismissReason?) => number";
    readonly description: "Remove visible and queued records without showing intermediate queued items.";
  }, {
    readonly name: "pause(id) / resume(id)";
    readonly type: "(string) => boolean";
    readonly description: "Manage the caller-owned API pause without overriding keyboard/hover/visibility safeguards.";
  }, {
    readonly name: "getToast(id) / getToasts()";
    readonly type: "Readonly snapshot accessors";
    readonly description: "Inspect state and actionLayout without receiving callbacks, origin/icon nodes or mutable collections. History also excludes icon DOM.";
  }, {
    readonly name: "registerAddon / unregisterAddon / getAddon / getAddons";
    readonly type: "ToastAddon lifecycle";
    readonly description: "Explicit per-instance setup, selected observer hooks, subscriptions and cleanup.";
  }, {
    readonly name: "destroy()";
    readonly type: "() => void";
    readonly description: "Idempotent teardown; cancel timers, scheduled announcements and action signals; preserve authored DOM.";
  }, {
    readonly name: "addToastEventListener(target, type, listener, options)";
    readonly type: "Typed DOM-event helper returning cleanup";
    readonly description: "Subscribe to TOAST_EVENTS. Events bubble, are not cancelable, and do not cross shadow boundaries.";
  }];
  readonly eventContract: {
    readonly target: "The instance root";
    readonly options: {
      readonly bubbles: true;
      readonly composed: false;
      readonly cancelable: false;
    };
    readonly baseDetail: readonly ["instance", "root", "instanceId", "timestamp", "visibleCount", "queuedCount"];
    readonly events: readonly [{
      readonly name: "a11y-toast:init";
      readonly trigger: "Core DOM is installed and the instance is registered, before configured add-ons are set up.";
      readonly detail: readonly [];
    }, {
      readonly name: "a11y-toast:ready";
      readonly trigger: "Configured add-on setup has finished; omitted if initialization is destroyed re-entrantly.";
      readonly detail: readonly [];
    }, {
      readonly name: "a11y-toast:show";
      readonly trigger: "A toast is committed to the visible list.";
      readonly detail: readonly ["toast"];
    }, {
      readonly name: "a11y-toast:queue";
      readonly trigger: "A toast is added to the bounded queue.";
      readonly detail: readonly ["toast"];
    }, {
      readonly name: "a11y-toast:update";
      readonly trigger: "An existing visible or queued toast is updated, including updates with no effective public change.";
      readonly detail: readonly ["toast"];
    }, {
      readonly name: "a11y-toast:announce";
      readonly trigger: "The selected announcement transport commits an attempt; this is not speech-delivery confirmation.";
      readonly detail: readonly ["toast", "message", "priority", "transport", "fallback"];
    }, {
      readonly name: "a11y-toast:announcement-error";
      readonly trigger: "The selected announcement transport throws synchronously.";
      readonly detail: readonly ["toast", "message", "priority", "transport", "error"];
    }, {
      readonly name: "a11y-toast:action";
      readonly trigger: "An action is invoked after pending state is set and before its callback runs.";
      readonly detail: readonly ["toast"];
    }, {
      readonly name: "a11y-toast:action-error";
      readonly trigger: "An action callback throws or its returned promise rejects.";
      readonly detail: readonly ["toast", "error"];
    }, {
      readonly name: "a11y-toast:pause";
      readonly trigger: "A toast transitions from running to paused.";
      readonly detail: readonly ["toast", "reason"];
    }, {
      readonly name: "a11y-toast:resume";
      readonly trigger: "A toast transitions from paused to running.";
      readonly detail: readonly ["toast", "reason"];
    }, {
      readonly name: "a11y-toast:dismiss";
      readonly trigger: "A toast is logically removed, before any exit animation finishes.";
      readonly detail: readonly ["toast", "reason"];
    }, {
      readonly name: "a11y-toast:drop";
      readonly trigger: "A show request is rejected because the queue is full or a clear operation is in progress.";
      readonly detail: readonly ["toast", "reason"];
    }, {
      readonly name: "a11y-toast:animation-start";
      readonly trigger: "An enter or exit animation starts.";
      readonly detail: readonly ["toast", "phase", "driver"];
    }, {
      readonly name: "a11y-toast:animation-end";
      readonly trigger: "An enter or exit animation completes, is cancelled, or fails.";
      readonly detail: readonly ["toast", "phase", "driver", "status"];
    }, {
      readonly name: "a11y-toast:animation-error";
      readonly trigger: "An animation driver throws or rejects; animation-end with failed status follows unless a listener destroys the instance.";
      readonly detail: readonly ["toast", "phase", "driver", "error"];
    }, {
      readonly name: "a11y-toast:addon-error";
      readonly trigger: "An add-on setup, observer, hook, or cleanup operation fails while the instance is active.";
      readonly detail: readonly ["addon", "phase", "error"];
    }, {
      readonly name: "a11y-toast:destroy";
      readonly trigger: "Core teardown has cleared generated DOM and state; active animation cancellations are emitted first.";
      readonly detail: readonly [];
    }];
    readonly sequencing: readonly ["show emits before animation-start; an announcement commit may happen later or not at all.", "queue emits when enqueued; show emits only when the item is promoted.", "dismissAll emits one dismiss event per removed toast and no aggregate completion event.", "pause and resume emit only when the effective running/paused boundary changes.", "action has no success event; completion is reflected by update or dismissal. Dismissal cancels pending work.", "destroy is terminal: teardown cleanup errors are isolated but do not emit events after it."];
  };
  readonly examples: readonly [{
    readonly name: "Playground";
    readonly description: "One page with content/timing/announcement-transport/animation/progress/dedupe controls, loading/update, actions, classic light/dark icon examples, a five-notification swipe-dismiss stack, FIFO queue and a non-live event log.";
    readonly path: "examples/basic";
  }];
  readonly addons: readonly [{
    readonly name: "Development diagnostics";
    readonly export: "a11y-toast/addons/diagnostics";
    readonly description: "Opt-in advisory reports for risky timing, assertive bursts, queue rejection and lifecycle failures. Content-free payloads; no default output or conformance claims.";
  }, {
    readonly name: "In-memory history";
    readonly export: "a11y-toast/addons/history";
    readonly description: "Bounded immutable show/update/dismiss entries with read/clear access and lifecycle cleanup. No persistence, announcement replay or action replay; no backfill.";
  }, {
    readonly name: "Swipe dismissal";
    readonly export: "a11y-toast/addons/swipe-dismiss";
    readonly stylesheet: "a11y-toast/addons/swipe-dismiss.css";
    readonly description: "Opt-in per-instance horizontal pointer drag to dismiss visible, dismissible notifications. Retains the native close button; use with none or built-in CSS animation.";
  }, {
    readonly name: "Progress";
    readonly export: "a11y-toast/addons/progress";
    readonly stylesheet: "a11y-toast/addons/progress.css";
    readonly description: "Visual-only timeout progress synchronized from core lifecycle snapshots; no live or progressbar semantics.";
  }, {
    readonly name: "Promise orchestration";
    readonly export: "a11y-toast/addons/promise";
    readonly description: "Retains one toast ID across loading → success/error with caller-authored error copy and late-settlement guards.";
  }, {
    readonly name: "Key deduplication";
    readonly export: "a11y-toast/addons/dedupe";
    readonly description: "Explicit exact-key update/drop/replace policies; no message-text or automatic core deduplication.";
  }];
  readonly adapters: readonly [{
    readonly name: "DOM events";
    readonly export: "a11y-toast/adapters/dom-events";
    readonly description: "Maps external EventTarget lifecycles to correlated toast show/update/dismiss commands with explicit single-owner announcement policy.";
  }, {
    readonly name: "A11y Menu Button async state";
    readonly export: "a11y-toast/adapters/menu-button-async-state";
    readonly peer: "a11y-menu-button@^1.0.1";
    readonly description: "Mirrors Menu Button loading/error/empty states visually with source-owned announcements and dismisses the mirror on ready.";
  }];
  readonly transports: readonly [{
    readonly name: "Live regions";
    readonly value: "live-region";
    readonly status: "default";
    readonly description: "Stable polite/assertive DOM announcement transport.";
  }, {
    readonly name: "ariaNotify";
    readonly export: "a11y-toast/transports/aria-notify";
    readonly status: "experimental";
    readonly description: "Uses Document.ariaNotify when available and falls back to the scheduled live region only when the API is absent.";
  }];
  readonly animations: readonly [{
    readonly name: "CSS";
    readonly value: "css";
    readonly status: "default";
    readonly description: "Built-in restrained enter/exit motion.";
  }, {
    readonly name: "GSAP";
    readonly export: "a11y-toast/animations/gsap";
    readonly peer: "gsap >=3.11 <4";
    readonly status: "optional";
    readonly description: "Caller-injected GSAP driver with exact inline-style restoration and shared TOAST-180 lifecycle semantics.";
  }, {
    readonly name: "GSAP Flip layout";
    readonly export: "a11y-toast/animations/gsap-flip";
    readonly peer: "gsap >=3.11 <4";
    readonly status: "optional";
    readonly description: "Add-on that animates only surviving toast stack reflow/queue promotion while enter/exit remains owned elsewhere.";
  }, {
    readonly name: "Element View Transition";
    readonly export: "a11y-toast/animations/view-transition";
    readonly stylesheet: "a11y-toast/animations/view-transition.css";
    readonly status: "experimental";
    readonly description: "Per-toast Element.startViewTransition() driver; unsupported browsers use no motion and document-scoped transitions are never used.";
  }];
  readonly accessibility: {
    readonly focusOnShow: false;
    readonly priorityDefault: "polite";
    readonly announcementTransport: "Live regions by default; experimental ariaNotify is explicit opt-in with unsupported-browser fallback.";
    readonly icon: "Decorative icons are cloned into an inert, aria-hidden wrapper. Only passive icon-font and SVG markup is accepted; active elements, handlers, inline styles, IDs and URL references are rejected. Icons never change announcements.";
    readonly toneLabel: "Visible by default; showToneLabel:false visually hides the tone label while keeping the text available to assistive technology and generated live announcements.";
    readonly motion: "CSS/GSAP/View Transition motion is decorative; reduced-motion skips animation drivers, announcements do not wait for motion, and timed lifetime begins after entrance settles.";
    readonly limitations: "An announce event records a transport commit attempt, not proof of speech. ariaNotify Permissions Policy suppression may be silent. Timed content must remain available elsewhere. No modal/top-layer portal or shared cross-manager announcer.";
  };
};
//#endregion
export { docs };
//# sourceMappingURL=docs.d.ts.map