import { t as TOAST_EVENTS } from "./events-D6MCpthx.js";

//#region src/docs.ts
/** Pure metadata: importing this module never loads or initializes the DOM runtime. */
const docs = {
	slug: "a11y-toast",
	name: "A11y Toast",
	packageName: "a11y-toast",
	description: "Framework-free toast notifications with explicit announcement priority, bounded queues, safe timers and lifecycle events.",
	status: "1.0.0 — unpublished release candidate; showcase/lab/design gallery, reusable skins and lifecycle regressions verified locally; final-revision CI and manual assistive-technology acceptance pending",
	install: {
		npm: "npm install a11y-toast",
		pnpm: "pnpm add a11y-toast",
		yarn: "yarn add a11y-toast"
	},
	usage: `import { createToast } from 'a11y-toast';\nimport 'a11y-toast/styles.css';\nconst root = document.querySelector('[data-a11y-toast]');\nif (root instanceof HTMLElement) {\n  const toast = createToast(root);\n  toast.success('Your changes were saved.');\n}`,
	selectors: [
		"[data-a11y-toast]",
		"[data-a11y-toast-id]",
		"[data-a11y-toast-action]",
		"[data-a11y-toast-dismiss]"
	],
	keyboard: [
		{
			key: "Tab / Shift+Tab",
			description: "Reach the scrollable notification list and its native action/dismiss buttons. Focus pauses relevant timers."
		},
		{
			key: "Enter / Space",
			description: "Activate a focused native button."
		},
		{
			key: "Arrow / Page Up / Page Down",
			description: "Native scrolling while the notification list is focused. No custom global shortcuts."
		}
	],
	api: [
		{
			name: "new A11yToast(root, options)",
			type: "new (HTMLElement, ToastOptions?) => A11yToast",
			description: "Explicit class construction; shares the same mounted-host requirements and duplicate-instance reuse as createToast."
		},
		{
			name: "createToast(root, options)",
			type: "(HTMLElement, ToastOptions?) => A11yToast",
			description: "Initialize a mounted, non-live host; duplicate initialization reuses the active manager."
		},
		{
			name: "initToastAll(options, scope)",
			type: "(ToastOptions?, ParentNode?) => A11yToast[]",
			description: "Explicitly initialize matching descendants. Never runs on import."
		},
		{
			name: "show(input)",
			type: "(ToastInput) => string | null",
			description: "Display or enqueue a toast. Optional icon accepts a trusted passive HTML/SVG element, cloned on ingestion; HTML strings are rejected. actionLayout selects stacked (default) or inline placement. null means the bounded queue rejected it."
		},
		{
			name: "info / success / warning / error / loading",
			type: "(string, ToastShorthandOptions?) => string | null",
			description: "Tone convenience methods. Error does not imply assertive priority."
		},
		{
			name: "update(id, patch)",
			type: "(string, ToastPatch) => boolean",
			description: "Patch an existing visible/queued record. Content-only updates preserve remaining time."
		},
		{
			name: "dismiss(id, reason)",
			type: "(string, ToastDismissReason?) => boolean",
			description: "Logically dismiss one record immediately; an optional inert visual exit may finish before its queue slot is released."
		},
		{
			name: "dismissAll(reason)",
			type: "(ToastDismissReason?) => number",
			description: "Remove visible and queued records without showing intermediate queued items."
		},
		{
			name: "pause(id) / resume(id)",
			type: "(string) => boolean",
			description: "Manage the caller-owned API pause without overriding keyboard/hover/visibility safeguards."
		},
		{
			name: "getToast(id) / getToasts()",
			type: "Readonly snapshot accessors",
			description: "Inspect state and actionLayout without receiving callbacks, origin/icon nodes or mutable collections. History also excludes icon DOM."
		},
		{
			name: "registerAddon / unregisterAddon / getAddon / getAddons",
			type: "ToastAddon lifecycle",
			description: "Explicit per-instance setup, selected observer hooks, subscriptions and cleanup. Add-on context holdTimer(id) returns an owned, idempotent release for a gesture timer hold without clearing other pause reasons."
		},
		{
			name: "destroy()",
			type: "() => void",
			description: "Idempotent teardown; cancel timers, scheduled announcements and action signals; preserve authored DOM."
		},
		{
			name: "addToastEventListener(target, type, listener, options)",
			type: "Typed DOM-event helper returning cleanup",
			description: "Subscribe to TOAST_EVENTS. Events bubble, are not cancelable, and do not cross shadow boundaries."
		}
	],
	eventContract: {
		target: "The instance root",
		options: {
			bubbles: true,
			composed: false,
			cancelable: false
		},
		baseDetail: [
			"instance",
			"root",
			"instanceId",
			"timestamp",
			"visibleCount",
			"queuedCount"
		],
		events: [
			{
				name: TOAST_EVENTS.init,
				trigger: "Core DOM is installed and the instance is registered, before configured add-ons are set up.",
				detail: []
			},
			{
				name: TOAST_EVENTS.ready,
				trigger: "Configured add-on setup has finished; omitted if initialization is destroyed re-entrantly.",
				detail: []
			},
			{
				name: TOAST_EVENTS.show,
				trigger: "A toast is committed to the visible list.",
				detail: ["toast"]
			},
			{
				name: TOAST_EVENTS.queue,
				trigger: "A toast is added to the bounded queue.",
				detail: ["toast"]
			},
			{
				name: TOAST_EVENTS.update,
				trigger: "An existing visible or queued toast is updated, including updates with no effective public change.",
				detail: ["toast"]
			},
			{
				name: TOAST_EVENTS.announce,
				trigger: "The selected announcement transport commits an attempt; this is not speech-delivery confirmation.",
				detail: [
					"toast",
					"message",
					"priority",
					"transport",
					"fallback"
				]
			},
			{
				name: TOAST_EVENTS.announcementError,
				trigger: "The selected announcement transport throws synchronously.",
				detail: [
					"toast",
					"message",
					"priority",
					"transport",
					"error"
				]
			},
			{
				name: TOAST_EVENTS.action,
				trigger: "An action is invoked after pending state is set and before its callback runs.",
				detail: ["toast"]
			},
			{
				name: TOAST_EVENTS.actionError,
				trigger: "An action callback throws or its returned promise rejects.",
				detail: ["toast", "error"]
			},
			{
				name: TOAST_EVENTS.pause,
				trigger: "A toast transitions from running to paused.",
				detail: ["toast", "reason"]
			},
			{
				name: TOAST_EVENTS.resume,
				trigger: "A toast transitions from paused to running.",
				detail: ["toast", "reason"]
			},
			{
				name: TOAST_EVENTS.dismiss,
				trigger: "A toast is logically removed, before any exit animation finishes.",
				detail: ["toast", "reason"]
			},
			{
				name: TOAST_EVENTS.drop,
				trigger: "A show request is rejected because the queue is full or a clear operation is in progress.",
				detail: ["toast", "reason"]
			},
			{
				name: TOAST_EVENTS.animationStart,
				trigger: "An enter or exit animation starts.",
				detail: [
					"toast",
					"phase",
					"driver"
				]
			},
			{
				name: TOAST_EVENTS.animationEnd,
				trigger: "An enter or exit animation completes, is cancelled, or fails.",
				detail: [
					"toast",
					"phase",
					"driver",
					"status"
				]
			},
			{
				name: TOAST_EVENTS.animationError,
				trigger: "An animation driver throws or rejects; animation-end with failed status follows unless a listener destroys the instance.",
				detail: [
					"toast",
					"phase",
					"driver",
					"error"
				]
			},
			{
				name: TOAST_EVENTS.addonError,
				trigger: "An add-on setup, observer, hook, or cleanup operation fails while the instance is active.",
				detail: [
					"addon",
					"phase",
					"error"
				]
			},
			{
				name: TOAST_EVENTS.destroy,
				trigger: "Core teardown has cleared generated DOM and state; active animation cancellations are emitted first.",
				detail: []
			}
		],
		sequencing: [
			"show emits before animation-start; an announcement commit may happen later or not at all.",
			"queue emits when enqueued; show emits only when the item is promoted.",
			"dismissAll emits one dismiss event per removed toast and no aggregate completion event.",
			"pause and resume emit only when the effective running/paused boundary changes.",
			"action has no success event; completion is reflected by update or dismissal. Dismissal cancels pending work.",
			"destroy is terminal: teardown cleanup errors are isolated but do not emit events after it."
		]
	},
	examples: [
		{
			name: "Component showcase",
			description: "Explicit success, Undo, loading and error/retry triggers with retained non-live results, Reset examples and a minimal usage snippet. No automatic toast; imports core and the promise helper only.",
			path: "examples/basic"
		},
		{
			name: "Design gallery",
			description: "Fifteen static non-live previews and one explicitly activated persistent polite toast; matching copyable usage and CSS downloads. Import a11y-toast/styles.css plus a11y-toast/skins/{id}.css and use the matching a11y-toast-region--skin-{id} root class. No JavaScript skin option, external font or asset. Verified locally; manual AT/zoom/touch pending.",
			path: "examples/designs"
		},
		{
			name: "Advanced lab",
			description: "Settings, animations, announcement-ownership and note recipes, queue controls, and non-live history, diagnostics and event inspectors in the shared page shell.",
			path: "examples/advanced"
		}
	],
	addons: [
		{
			name: "Development diagnostics",
			export: "a11y-toast/addons/diagnostics",
			description: "Opt-in advisory reports for risky timing, assertive bursts, queue rejection and lifecycle failures. Content-free payloads; no default output or conformance claims."
		},
		{
			name: "In-memory history",
			export: "a11y-toast/addons/history",
			description: "Bounded immutable show/update/dismiss entries with read/clear access and lifecycle cleanup. No persistence, announcement replay or action replay; no backfill."
		},
		{
			name: "Swipe dismissal",
			export: "a11y-toast/addons/swipe-dismiss",
			stylesheet: "a11y-toast/addons/swipe-dismiss.css",
			description: "Opt-in per-instance horizontal pointer drag to dismiss visible, dismissible notifications. Retains the native close button; use with none or built-in CSS animation."
		},
		{
			name: "Progress",
			export: "a11y-toast/addons/progress",
			stylesheet: "a11y-toast/addons/progress.css",
			description: "Visual-only timeout progress synchronized from core lifecycle snapshots; no live or progressbar semantics."
		},
		{
			name: "Promise orchestration",
			export: "a11y-toast/addons/promise",
			description: "Retains one toast ID across loading → success/error with caller-authored error copy; subscribes only while the returned toast and manager remain active and ignores late settlement after dismissal, destroy or stop."
		},
		{
			name: "Key deduplication",
			export: "a11y-toast/addons/dedupe",
			description: "Explicit exact-key update/drop/replace policies; no message-text or automatic core deduplication."
		}
	],
	adapters: [{
		name: "DOM events",
		export: "a11y-toast/adapters/dom-events",
		description: "Maps external EventTarget lifecycles to correlated toast show/update/dismiss commands with explicit single-owner announcement policy. Synchronous same-key transactions accept at most 100 commands; overflow clears pending work and reports once through onError, while later events can recover."
	}, {
		name: "A11y Menu Button async state",
		export: "a11y-toast/adapters/menu-button-async-state",
		peer: "a11y-menu-button@^1.0.1",
		description: "Mirrors Menu Button loading/error/empty states visually with source-owned announcements and dismisses the mirror on ready."
	}],
	transports: [{
		name: "Live regions",
		value: "live-region",
		status: "default",
		description: "Stable polite/assertive DOM announcement transport."
	}, {
		name: "ariaNotify",
		export: "a11y-toast/transports/aria-notify",
		status: "experimental",
		description: "Uses Document.ariaNotify when available and falls back to the scheduled live region only when the API is absent."
	}],
	animations: [
		{
			name: "CSS",
			value: "css",
			status: "default",
			description: "Built-in restrained enter/exit motion."
		},
		{
			name: "GSAP",
			export: "a11y-toast/animations/gsap",
			peer: "gsap >=3.11 <4",
			status: "optional",
			description: "Caller-injected GSAP driver with exact inline-style restoration and shared TOAST-180 lifecycle semantics."
		},
		{
			name: "GSAP Flip layout",
			export: "a11y-toast/animations/gsap-flip",
			peer: "gsap >=3.11 <4",
			status: "optional",
			description: "Add-on that animates only surviving toast stack reflow/queue promotion while enter/exit remains owned elsewhere."
		},
		{
			name: "Element View Transition",
			export: "a11y-toast/animations/view-transition",
			stylesheet: "a11y-toast/animations/view-transition.css",
			status: "experimental",
			description: "Per-toast Element.startViewTransition() driver; unsupported browsers use no motion and document-scoped transitions are never used."
		}
	],
	accessibility: {
		focusOnShow: false,
		priorityDefault: "polite",
		announcementTransport: "Live regions by default; experimental ariaNotify is explicit opt-in with unsupported-browser fallback.",
		icon: "Decorative icons are cloned into an inert, aria-hidden wrapper. Only passive icon-font and SVG markup is accepted; active elements, handlers, inline styles, IDs and URL references are rejected. Icons never change announcements.",
		toneLabel: "Visible by default; showToneLabel:false visually hides the tone label while keeping the text available to assistive technology and generated live announcements.",
		motion: "CSS/GSAP/View Transition motion is decorative; reduced-motion skips animation drivers, announcements do not wait for motion, and timed lifetime begins after initial display and entrance settle, including synchronous display-hook updates.",
		limitations: "An announce event records a transport commit attempt, not proof of speech. ariaNotify Permissions Policy suppression may be silent. Timed content must remain available elsewhere. No modal/top-layer portal or shared cross-manager announcer."
	}
};

//#endregion
export { docs };
//# sourceMappingURL=docs.js.map