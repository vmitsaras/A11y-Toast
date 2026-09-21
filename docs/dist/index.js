import { n as addToastEventListener, t as TOAST_EVENTS } from "./events-D6MCpthx.js";
import { n as waitForCssAnimation, t as prefersReducedMotion } from "./animation-DqMS0Z8l.js";

//#region src/LiveAnnouncer.ts
const LIVE_REGION_TRANSPORT = Object.freeze({
	name: "live-region",
	announce({ message, liveRegion }) {
		liveRegion.textContent = message;
		return Object.freeze({
			transport: "live-region",
			fallback: false
		});
	}
});
/** Schedules announcement transport commits, not speech. Browsers expose no speech-complete event. */
var LiveAnnouncer = class {
	channels;
	paused = false;
	destroyed = false;
	constructor(win, polite, assertive, transport = LIVE_REGION_TRANSPORT) {
		this.win = win;
		this.transport = transport;
		this.channels = {
			polite: {
				region: polite,
				pending: /* @__PURE__ */ new Map(),
				timer: null,
				stage: "idle"
			},
			assertive: {
				region: assertive,
				pending: /* @__PURE__ */ new Map(),
				timer: null,
				stage: "idle"
			}
		};
	}
	request(priority, entry) {
		if (this.destroyed) return;
		for (const p of ["polite", "assertive"]) if (p !== priority) this.cancelFrom(this.channels[p], entry.id);
		if (priority === "off") return;
		const channel = this.channels[priority];
		channel.pending.set(entry.id, entry);
		this.pump(channel);
	}
	cancel(id) {
		this.cancelFrom(this.channels.polite, id);
		this.cancelFrom(this.channels.assertive, id);
	}
	setPaused(paused) {
		if (this.destroyed || paused === this.paused) return;
		this.paused = paused;
		for (const channel of Object.values(this.channels)) if (paused) this.stop(channel);
		else this.pump(channel);
	}
	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		for (const channel of Object.values(this.channels)) {
			this.stop(channel);
			channel.pending.clear();
			channel.region.textContent = "";
		}
	}
	cancelFrom(channel, id) {
		channel.pending.delete(id);
		if (channel.pending.size === 0 && channel.stage === "write") this.stop(channel);
	}
	stop(channel) {
		if (channel.timer !== null) this.win.clearTimeout(channel.timer);
		channel.timer = null;
		channel.stage = "idle";
	}
	pump(channel) {
		if (this.destroyed || this.paused || channel.timer !== null || channel.pending.size === 0) return;
		channel.region.textContent = "";
		channel.stage = "write";
		channel.timer = this.win.setTimeout(() => {
			channel.timer = null;
			channel.stage = "idle";
			if (this.destroyed || this.paused) return;
			let entry;
			for (const [id, candidate] of channel.pending) {
				channel.pending.delete(id);
				if (candidate.valid()) {
					entry = candidate;
					break;
				}
			}
			if (!entry) return;
			let result;
			try {
				result = this.transport.announce({
					message: entry.message,
					priority: channel === this.channels.assertive ? "assertive" : "polite",
					liveRegion: channel.region
				}) ?? Object.freeze({
					transport: this.transport.name,
					fallback: false
				});
			} catch (error) {
				channel.stage = "gap";
				channel.timer = this.win.setTimeout(() => {
					channel.timer = null;
					channel.stage = "idle";
					this.pump(channel);
				}, 1e3);
				entry.failed(error, this.transport.name);
				return;
			}
			channel.stage = "gap";
			channel.timer = this.win.setTimeout(() => {
				channel.timer = null;
				channel.stage = "idle";
				this.pump(channel);
			}, 1e3);
			entry.committed(result);
		}, 100);
	}
};

//#endregion
//#region src/options.ts
const TONES = Object.freeze([
	"neutral",
	"info",
	"success",
	"warning",
	"error",
	"loading"
]);
const POSITIONS = Object.freeze([
	"top-start",
	"top-center",
	"top-end",
	"bottom-start",
	"bottom-center",
	"bottom-end"
]);
const PRIORITIES = Object.freeze([
	"off",
	"polite",
	"assertive"
]);
const ANIMATIONS = Object.freeze(["css", "none"]);
const DEFAULT_LABELS = Object.freeze({
	region: "Notifications",
	dismiss: "Close notification",
	actionFailed: "The action failed. Try again.",
	empty: "No notifications.",
	tones: Object.freeze({
		neutral: "Notification",
		info: "Information",
		success: "Success",
		warning: "Warning",
		error: "Error",
		loading: "In progress"
	})
});
const DEFAULT_OPTIONS = Object.freeze({
	duration: 5e3,
	maxVisible: 3,
	maxQueue: 10,
	position: "bottom-end",
	priority: "polite",
	animation: "css",
	announcementTransport: "live-region",
	showToneLabel: true,
	labels: DEFAULT_LABELS
});
function parseBoolean(value, fallback) {
	if (value === true || value === "true") return true;
	if (value === false || value === "false") return false;
	return fallback;
}
function parseInteger(value, fallback, min, max) {
	if (typeof value !== "number" && (typeof value !== "string" || !/^\d+$/.test(value.trim()))) return fallback;
	const number = typeof value === "number" ? value : Number(value.trim());
	return Number.isSafeInteger(number) && number >= min && number <= max ? number : fallback;
}
function duration(value, fallback) {
	const parsed = parseInteger(value, fallback, 0, 864e5);
	return parsed === 0 ? 0 : Math.max(1e3, parsed);
}
function member(value, allowed, fallback) {
	return typeof value === "string" && allowed.includes(value) ? value : fallback;
}
function text(value, fallback = "") {
	return typeof value === "string" ? value.trim() : fallback;
}
function label(value, fallback) {
	return text(value) || fallback;
}
function resolveAnnouncementTransport(value) {
	if (value === void 0 || value === "live-region") return "live-region";
	if (!value || typeof value !== "object") return "live-region";
	const transport = value;
	const name = text(transport.name);
	if (!name) throw new TypeError("Toast announcement transport requires a non-empty name.");
	if (typeof transport.announce !== "function") throw new TypeError("Toast announcement transport requires an announce function.");
	return Object.freeze({
		name,
		announce: transport.announce
	});
}
function resolveAnimation(value) {
	if (typeof value === "string") return member(value, ANIMATIONS, DEFAULT_OPTIONS.animation);
	if (!value || typeof value !== "object") return DEFAULT_OPTIONS.animation;
	const driver = value;
	const name = text(driver.name);
	if (!name) throw new TypeError("Toast animation driver requires a non-empty name.");
	if (driver.enter !== void 0 && typeof driver.enter !== "function") throw new TypeError("Toast animation driver enter must be a function.");
	if (driver.exit !== void 0 && typeof driver.exit !== "function") throw new TypeError("Toast animation driver exit must be a function.");
	if (!driver.enter && !driver.exit) throw new TypeError("Toast animation driver requires an enter or exit function.");
	return Object.freeze({
		name,
		enter: driver.enter,
		exit: driver.exit
	});
}
function resolveOptions(root, options) {
	const d = root.dataset;
	const labels = options.labels;
	const tones = Object.fromEntries(TONES.map((tone) => [tone, label(labels?.tones?.[tone], DEFAULT_LABELS.tones[tone])]));
	return Object.freeze({
		duration: duration(options.duration ?? d.a11yToastDuration, DEFAULT_OPTIONS.duration),
		maxVisible: parseInteger(options.maxVisible ?? d.a11yToastMaxVisible, DEFAULT_OPTIONS.maxVisible, 1, 8),
		maxQueue: parseInteger(options.maxQueue ?? d.a11yToastMaxQueue, DEFAULT_OPTIONS.maxQueue, 0, 100),
		position: member(options.position ?? d.a11yToastPosition, POSITIONS, DEFAULT_OPTIONS.position),
		priority: member(options.priority ?? d.a11yToastPriority, PRIORITIES, DEFAULT_OPTIONS.priority),
		animation: resolveAnimation(options.animation ?? d.a11yToastAnimation),
		announcementTransport: resolveAnnouncementTransport(options.announcementTransport),
		showToneLabel: parseBoolean(options.showToneLabel ?? d.a11yToastShowToneLabel, DEFAULT_OPTIONS.showToneLabel),
		labels: Object.freeze({
			region: label(labels?.region, DEFAULT_LABELS.region),
			dismiss: label(labels?.dismiss, DEFAULT_LABELS.dismiss),
			actionFailed: label(labels?.actionFailed, DEFAULT_LABELS.actionFailed),
			empty: label(labels?.empty, DEFAULT_LABELS.empty),
			tones: Object.freeze(tones)
		})
	});
}
function isHTMLElement(value, doc) {
	const ctor = doc.defaultView?.HTMLElement;
	return Boolean(ctor && value instanceof ctor);
}
function normalizeToast(input, options, doc) {
	const message = text(input.message);
	if (!message) throw new TypeError("A11yToast requires a non-empty message string.");
	const title = text(input.title);
	const tone = member(input.tone, TONES, "neutral");
	const priority = member(input.priority, PRIORITIES, options.priority);
	let action = null;
	if (input.action != null) {
		if (!text(input.action.label)) throw new TypeError("Toast action requires a non-empty label.");
		if (input.action.onClick != null && typeof input.action.onClick !== "function") throw new TypeError("Toast action.onClick must be a function.");
		action = Object.freeze({
			label: text(input.action.label),
			onClick: input.action.onClick,
			dismissOnSuccess: parseBoolean(input.action.dismissOnSuccess, false)
		});
	}
	const ms = duration(input.duration, options.duration);
	const hasExplicitDuration = typeof input.duration === "number" && Number.isSafeInteger(input.duration) && input.duration > 0 && input.duration <= 864e5;
	const persistent = tone === "loading" || ms === 0 || parseBoolean(input.persistent, !hasExplicitDuration && (action !== null || priority === "assertive"));
	const phrase = [
		title || (tone === "neutral" ? "" : options.labels.tones[tone]),
		message,
		action?.label
	].filter(Boolean).join(". ");
	return {
		message,
		title,
		tone,
		priority,
		announcement: text(input.announcement) || phrase,
		duration: ms,
		persistent,
		dismissible: parseBoolean(input.dismissible, true),
		action,
		origin: isHTMLElement(input.origin, doc) ? input.origin : null,
		key: text(input.key) || null
	};
}

//#endregion
//#region src/A11yToast.ts
const SELECTORS = Object.freeze({
	root: "[data-a11y-toast]",
	item: "[data-a11y-toast-id]",
	action: "[data-a11y-toast-action]",
	dismiss: "[data-a11y-toast-dismiss]",
	liveAncestor: "[role=\"alert\"], [role=\"status\"], [role=\"log\"], [aria-live=\"polite\"], [aria-live=\"assertive\"]"
});
const CLASSES = Object.freeze({
	host: "a11y-toast-region",
	viewport: "a11y-toast-region__viewport",
	list: "a11y-toast-region__list",
	empty: "a11y-toast-region__empty",
	live: "a11y-toast-region__announcer",
	item: "a11y-toast",
	content: "a11y-toast__content",
	tone: "a11y-toast__tone",
	toneVisuallyHidden: "a11y-toast__tone--visually-hidden",
	title: "a11y-toast__title",
	message: "a11y-toast__message",
	actions: "a11y-toast__actions",
	action: "a11y-toast__action",
	dismiss: "a11y-toast__dismiss",
	error: "a11y-toast__action-error",
	initialized: "is-initialized",
	visible: "is-visible",
	entering: "is-entering",
	exiting: "is-exiting",
	paused: "is-paused",
	pending: "is-action-pending"
});
const ATTR = Object.freeze({
	id: "data-a11y-toast-id",
	action: "data-a11y-toast-action",
	dismiss: "data-a11y-toast-dismiss",
	role: "role",
	label: "aria-label",
	describedby: "aria-describedby",
	disabled: "aria-disabled",
	atomic: "aria-atomic",
	tabindex: "tabindex",
	hidden: "aria-hidden"
});
var A11yToast = class A11yToast {
	static instances = /* @__PURE__ */ new WeakMap();
	root;
	instanceId;
	options;
	doc;
	win;
	viewport;
	list;
	empty;
	polite;
	assertive;
	announcer;
	records = /* @__PURE__ */ new Map();
	queue = [];
	addons = /* @__PURE__ */ new Map();
	activeAnimations = /* @__PURE__ */ new Map();
	exiting = /* @__PURE__ */ new Map();
	addedClasses = [];
	sequence = 0;
	destroyed = false;
	clearing = false;
	draining = false;
	reportingAddonError = false;
	handleClick;
	handlePointerOver;
	handlePointerOut;
	handleFocusIn;
	handleFocusOut;
	handleVisibility;
	constructor(root, options = {}) {
		if (!root?.ownerDocument || !isHTMLElement(root, root.ownerDocument)) throw new TypeError("A11yToast requires a root HTMLElement.");
		const existing = A11yToast.instances.get(root);
		if (existing) return existing;
		if (!root.isConnected) throw new Error("Mount the A11yToast root before initialization.");
		if (root.closest(SELECTORS.liveAncestor)) throw new Error("The toast root must not be inside another live region. Use a non-live host.");
		this.root = root;
		this.doc = root.ownerDocument;
		const win = this.doc.defaultView;
		if (!win) throw new Error("A11yToast requires a document with an active window.");
		this.win = win;
		this.options = resolveOptions(root, options);
		this.instanceId = `a11y-toast-${win.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
		this.viewport = this.element("section", CLASSES.viewport);
		this.viewport.classList.add(`${CLASSES.viewport}--${this.options.position}`);
		this.viewport.dataset.a11yToastAnimation = typeof this.options.animation === "string" ? this.options.animation : "custom";
		this.viewport.setAttribute(ATTR.label, this.options.labels.region);
		this.viewport.setAttribute(ATTR.tabindex, "-1");
		this.list = this.element("ol", CLASSES.list);
		this.empty = this.element("p", CLASSES.empty);
		this.empty.id = `${this.instanceId}-empty`;
		this.empty.textContent = this.options.labels.empty;
		this.empty.hidden = true;
		this.viewport.append(this.empty, this.list);
		this.polite = this.element("div", CLASSES.live);
		this.assertive = this.element("div", CLASSES.live);
		this.polite.setAttribute(ATTR.role, "status");
		this.assertive.setAttribute(ATTR.role, "alert");
		for (const region of [this.polite, this.assertive]) region.setAttribute(ATTR.atomic, "true");
		const announcementTransport = this.options.announcementTransport === "live-region" ? LIVE_REGION_TRANSPORT : this.options.announcementTransport;
		this.announcer = new LiveAnnouncer(win, this.polite, this.assertive, announcementTransport);
		this.announcer.setPaused(this.doc.hidden);
		for (const name of [CLASSES.host, CLASSES.initialized]) if (!root.classList.contains(name)) {
			root.classList.add(name);
			this.addedClasses.push(name);
		}
		root.append(this.viewport, this.polite, this.assertive);
		this.handleClick = this.onClick.bind(this);
		this.handlePointerOver = this.onPointerOver.bind(this);
		this.handlePointerOut = this.onPointerOut.bind(this);
		this.handleFocusIn = this.onFocusIn.bind(this);
		this.handleFocusOut = this.onFocusOut.bind(this);
		this.handleVisibility = this.onVisibility.bind(this);
		this.viewport.addEventListener("click", this.handleClick);
		this.viewport.addEventListener("pointerover", this.handlePointerOver);
		this.viewport.addEventListener("pointerout", this.handlePointerOut);
		this.viewport.addEventListener("focusin", this.handleFocusIn);
		this.viewport.addEventListener("focusout", this.handleFocusOut);
		this.doc.addEventListener("visibilitychange", this.handleVisibility);
		A11yToast.instances.set(root, this);
		this.emit(TOAST_EVENTS.init, {});
		if (this.destroyed) return;
		for (const addon of options.addons ?? []) {
			if (this.destroyed) return;
			try {
				this.registerAddon(addon);
			} catch (error) {
				this.addonError(addon?.name ?? "unnamed", "registration", error);
			}
		}
		if (!this.destroyed) this.emit(TOAST_EVENTS.ready, {});
	}
	get isDestroyed() {
		return this.destroyed;
	}
	get visibleCount() {
		let count = 0;
		for (const record of this.records.values()) if (record.state === "visible") count++;
		return count;
	}
	get queuedCount() {
		return this.queue.length;
	}
	get occupiedCount() {
		return this.visibleCount + this.exiting.size;
	}
	show(input) {
		this.assertActive();
		this.drain();
		const copied = this.copyInput(input);
		const data = normalizeToast(copied, this.options, this.doc);
		const record = {
			id: `${this.instanceId}-${++this.sequence}`,
			input: copied,
			data,
			state: "queued",
			remaining: data.duration,
			startedAt: null,
			timer: null,
			pauses: /* @__PURE__ */ new Set(),
			view: null,
			capturedFocus: isHTMLElement(this.doc.activeElement, this.doc) ? this.doc.activeElement : null,
			lastAnnouncement: null,
			actionController: null,
			actionPending: false,
			actionError: null,
			animationPhase: null,
			updating: false,
			dismissing: false
		};
		if (this.clearing || this.occupiedCount >= this.options.maxVisible && this.queue.length >= this.options.maxQueue) {
			record.state = "dropped";
			this.emit(TOAST_EVENTS.drop, {
				toast: this.snapshot(record),
				reason: this.clearing ? "clearing" : "queue-full"
			});
			return null;
		}
		this.records.set(record.id, record);
		if (this.occupiedCount < this.options.maxVisible && this.queue.length === 0) this.display(record);
		else {
			this.queue.push(record.id);
			this.emit(TOAST_EVENTS.queue, { toast: this.snapshot(record) });
			this.drain();
		}
		return record.id;
	}
	info(message, options = {}) {
		return this.show({
			...options,
			message,
			tone: "info"
		});
	}
	success(message, options = {}) {
		return this.show({
			...options,
			message,
			tone: "success"
		});
	}
	warning(message, options = {}) {
		return this.show({
			...options,
			message,
			tone: "warning"
		});
	}
	error(message, options = {}) {
		return this.show({
			...options,
			message,
			tone: "error"
		});
	}
	loading(message, options = {}) {
		return this.show({
			...options,
			message,
			tone: "loading"
		});
	}
	update(id, patch) {
		this.assertActive();
		const record = this.records.get(id);
		if (!record || record.updating || record.dismissing) return false;
		const nextInput = this.copyInput({
			...record.input,
			...patch
		});
		const next = normalizeToast(nextInput, this.options, this.doc);
		record.updating = true;
		try {
			this.runHooks("beforeUpdate", record);
			if (!this.owns(record) || record.dismissing) return false;
			this.stopTimer(record);
			const old = record.data;
			const timingChanged = patch.duration !== void 0 || next.duration !== old.duration || next.persistent !== old.persistent;
			if (patch.action !== void 0) this.cancelAction(record);
			if (!this.owns(record)) return false;
			record.data = next;
			record.input = nextInput;
			if (timingChanged) record.remaining = next.duration;
			if (record.view) this.render(record);
			if (!this.owns(record)) return false;
			if (record.animationPhase !== "enter") this.startTimer(record);
			this.emit(TOAST_EVENTS.update, { toast: this.snapshot(record) });
			this.runHooks("afterUpdate", record);
			if (this.owns(record) && record.state === "visible") this.requestAnnouncement(record);
			return true;
		} finally {
			record.updating = false;
		}
	}
	dismiss(id, reason = "api") {
		if (this.destroyed) return false;
		const record = this.records.get(id);
		if (!record || record.dismissing) return false;
		record.dismissing = true;
		this.runHooks("beforeDismiss", record);
		if (!this.owns(record)) return false;
		const view = record.view;
		const focused = view?.item.contains(this.doc.activeElement) ?? false;
		this.stopTimer(record);
		this.announcer.cancel(id);
		this.cancelAction(record);
		this.cancelAnimation(id, false);
		if (!this.owns(record)) return false;
		const willExit = Boolean(view && this.canAnimate(record, "exit"));
		if (willExit && view) this.exiting.set(id, view.item);
		record.state = "dismissed";
		this.records.delete(id);
		const index = this.queue.indexOf(id);
		if (index >= 0) this.queue.splice(index, 1);
		this.list.tabIndex = this.visibleCount > 0 ? 0 : -1;
		if (focused) this.recoverFocus(record);
		if (view && willExit) {
			view.item.inert = true;
			view.item.setAttribute(ATTR.hidden, "true");
		} else {
			view?.item.remove();
			record.view = null;
		}
		if (this.destroyed) return true;
		this.emit(TOAST_EVENTS.dismiss, {
			toast: this.snapshot(record),
			reason
		});
		this.runHooks("afterDismiss", record);
		if (this.destroyed) return true;
		if (view && willExit) {
			if (!this.beginAnimation(record, "exit", view.item, () => this.finishExit(record, view.item))) this.finishExit(record, view.item);
		} else this.drain();
		return true;
	}
	dismissAll(reason = "clear") {
		if (this.destroyed || this.clearing) return 0;
		this.clearing = true;
		let count = 0;
		try {
			for (const id of [...this.records.keys()]) if (this.dismiss(id, reason)) count++;
		} finally {
			this.clearing = false;
		}
		return count;
	}
	pause(id) {
		const record = this.records.get(id);
		if (this.destroyed || !record) return false;
		return this.setPause(record, "api", true);
	}
	resume(id) {
		const record = this.records.get(id);
		if (this.destroyed || !record) return false;
		return this.setPause(record, "api", false);
	}
	getToast(id) {
		const record = this.records.get(id);
		return record ? this.snapshot(record) : void 0;
	}
	getToasts() {
		return Object.freeze([...this.records.values()].map((record) => this.snapshot(record)));
	}
	registerAddon(addon) {
		this.assertActive();
		const name = typeof addon?.name === "string" ? addon.name.trim() : "";
		if (!name) throw new TypeError("Toast addon requires a non-empty name.");
		if (this.addons.has(name)) throw new Error(`Toast addon "${name}" is already registered.`);
		const controller = new this.win.AbortController();
		const removers = /* @__PURE__ */ new Set();
		const copy = Object.freeze({
			...addon,
			name
		});
		const context = Object.freeze({
			instance: this,
			root: this.root,
			signal: controller.signal,
			on: (type, listener) => {
				if (controller.signal.aborted) return () => {};
				const remove = addToastEventListener(this.root, type, (event) => {
					if (event.detail.instance !== this || controller.signal.aborted) return;
					this.observeAddon(name, type, () => listener(event));
				});
				let active = true;
				const cleanup = () => {
					if (active) {
						active = false;
						remove();
						removers.delete(cleanup);
					}
				};
				removers.add(cleanup);
				return cleanup;
			}
		});
		const entry = {
			addon: copy,
			context,
			controller,
			cleanup: null,
			removers
		};
		this.addons.set(name, entry);
		try {
			const cleanup = copy.setup?.(context);
			if (cleanup !== void 0 && typeof cleanup !== "function") {
				Promise.resolve(cleanup).catch(() => {});
				throw new TypeError("Toast addon setup must return a synchronous cleanup function or undefined.");
			}
			if (typeof cleanup === "function") if (this.addons.get(name) === entry) entry.cleanup = cleanup;
			else this.safeAddonCleanup(name, cleanup);
		} catch (error) {
			this.unregisterAddon(name);
			this.addonError(name, "setup", error);
		}
	}
	unregisterAddon(name) {
		const entry = this.addons.get(name);
		if (!entry) return false;
		this.addons.delete(name);
		entry.controller.abort();
		for (const remove of [...entry.removers]) remove();
		if (entry.cleanup) this.safeAddonCleanup(name, entry.cleanup);
		return true;
	}
	getAddon(name) {
		return this.addons.get(name)?.addon;
	}
	getAddons() {
		return Object.freeze([...this.addons.values()].map((entry) => entry.addon));
	}
	destroy() {
		if (this.destroyed) return;
		this.destroyed = true;
		const focused = [...this.records.values()].find((record) => record.view?.item.contains(this.doc.activeElement));
		this.announcer.destroy();
		for (const id of [...this.activeAnimations.keys()]) this.cancelAnimation(id, false);
		for (const record of this.records.values()) {
			this.stopTimer(record);
			this.cancelAction(record);
		}
		this.activeAnimations.clear();
		this.exiting.clear();
		this.records.clear();
		this.queue.length = 0;
		this.viewport.removeEventListener("click", this.handleClick);
		this.viewport.removeEventListener("pointerover", this.handlePointerOver);
		this.viewport.removeEventListener("pointerout", this.handlePointerOut);
		this.viewport.removeEventListener("focusin", this.handleFocusIn);
		this.viewport.removeEventListener("focusout", this.handleFocusOut);
		this.doc.removeEventListener("visibilitychange", this.handleVisibility);
		if (focused) this.recoverFocus(focused, true);
		this.viewport.remove();
		this.polite.remove();
		this.assertive.remove();
		for (const name of this.addedClasses) this.root.classList.remove(name);
		A11yToast.instances.delete(this.root);
		this.emit(TOAST_EVENTS.destroy, {});
		for (const name of [...this.addons.keys()].reverse()) this.unregisterAddon(name);
	}
	element(tag, className) {
		const element = this.doc.createElement(tag);
		element.className = className;
		return element;
	}
	copyInput(input) {
		if (!input || typeof input !== "object") throw new TypeError("Toast input must be an object.");
		return {
			...input,
			action: input.action ? { ...input.action } : input.action
		};
	}
	assertActive() {
		if (this.destroyed) throw new Error("A11yToast was destroyed. Create a new instance.");
		if (!this.root.isConnected) throw new Error("The toast root is disconnected. Mount it or destroy this instance.");
	}
	owns(record) {
		return !this.destroyed && this.records.get(record.id) === record;
	}
	now() {
		return this.win.performance.now();
	}
	remaining(record) {
		return Math.max(0, record.remaining - (record.startedAt === null ? 0 : this.now() - record.startedAt));
	}
	snapshot(record) {
		const data = record.data;
		return Object.freeze({
			id: record.id,
			key: data.key,
			title: data.title,
			message: data.message,
			tone: data.tone,
			priority: data.priority,
			announcement: data.announcement,
			state: record.state,
			animationPhase: record.animationPhase,
			duration: data.duration,
			persistent: data.persistent,
			dismissible: data.dismissible,
			remaining: data.persistent ? null : Math.ceil(this.remaining(record)),
			pauseReasons: Object.freeze([...record.pauses]),
			action: data.action ? Object.freeze({
				label: data.action.label,
				dismissOnSuccess: data.action.dismissOnSuccess
			}) : null,
			actionPending: record.actionPending,
			actionError: record.actionError
		});
	}
	display(record) {
		if (!this.owns(record)) return;
		record.state = "visible";
		this.runHooks("beforeShow", record);
		if (!this.owns(record) || record.state !== "visible") return;
		record.view = this.createView(record);
		this.render(record);
		this.empty.hidden = true;
		this.viewport.removeAttribute(ATTR.describedby);
		this.list.append(record.view.item);
		this.list.tabIndex = 0;
		if (this.doc.activeElement === this.list || this.doc.activeElement === this.viewport) record.pauses.add("focus");
		if (this.doc.hidden) record.pauses.add("document-hidden");
		this.emit(TOAST_EVENTS.show, { toast: this.snapshot(record) });
		this.runHooks("afterShow", record);
		if (!this.owns(record)) return;
		this.requestAnnouncement(record);
		if (!this.beginAnimation(record, "enter", record.view.item, () => {
			if (this.owns(record) && !record.dismissing) this.startTimer(record);
		})) this.startTimer(record);
	}
	drain() {
		if (this.destroyed || this.clearing || this.draining) return;
		this.draining = true;
		try {
			while (!this.destroyed && this.queue.length > 0 && this.occupiedCount < this.options.maxVisible) {
				const id = this.queue.shift();
				const record = id ? this.records.get(id) : void 0;
				if (record) this.display(record);
			}
		} finally {
			this.draining = false;
		}
	}
	createView(record) {
		const item = this.element("li", CLASSES.item);
		item.setAttribute(ATTR.id, record.id);
		const content = this.element("div", CLASSES.content);
		const tone = this.element("span", CLASSES.tone);
		const title = this.element("p", CLASSES.title);
		const message = this.element("p", CLASSES.message);
		message.id = `${record.id}-message`;
		const actions = this.element("div", CLASSES.actions);
		const action = this.element("button", CLASSES.action);
		const dismiss = this.element("button", CLASSES.dismiss);
		const error = this.element("p", CLASSES.error);
		error.id = `${record.id}-action-error`;
		action.type = "button";
		dismiss.type = "button";
		action.setAttribute(ATTR.action, "");
		dismiss.setAttribute(ATTR.dismiss, "");
		dismiss.textContent = "×";
		dismiss.setAttribute(ATTR.label, this.options.labels.dismiss);
		action.setAttribute(ATTR.describedby, message.id);
		dismiss.setAttribute(ATTR.describedby, message.id);
		actions.append(action);
		content.append(tone, title, message, actions, error);
		item.append(content, dismiss);
		return {
			item,
			tone,
			title,
			message,
			actions,
			action,
			dismiss,
			error
		};
	}
	render(record) {
		const v = record.view;
		if (!v) return;
		const active = this.doc.activeElement;
		const data = record.data;
		v.item.className = `${CLASSES.item} ${CLASSES.item}--${data.tone} ${CLASSES.visible}`;
		v.item.classList.toggle(CLASSES.entering, record.animationPhase === "enter");
		v.item.classList.toggle(CLASSES.exiting, record.animationPhase === "exit");
		v.item.classList.toggle(CLASSES.paused, record.pauses.size > 0);
		v.item.classList.toggle(CLASSES.pending, record.actionPending);
		v.tone.textContent = this.options.labels.tones[data.tone];
		v.tone.classList.toggle(CLASSES.toneVisuallyHidden, !this.options.showToneLabel);
		v.title.textContent = data.title;
		v.title.hidden = !data.title;
		v.message.textContent = data.message;
		v.action.textContent = data.action?.label ?? "";
		v.actions.hidden = !data.action;
		v.action.setAttribute(ATTR.disabled, String(record.actionPending));
		v.dismiss.hidden = !data.dismissible;
		v.error.hidden = !record.actionError;
		v.error.textContent = record.actionError ?? "";
		if (active === v.action && !data.action || active === v.dismiss && !data.dismissible) if (data.dismissible) this.focus(v.dismiss);
		else if (data.action) this.focus(v.action);
		else this.recoverFocus(record);
	}
	startTimer(record) {
		if (!this.owns(record) || record.state !== "visible" || record.animationPhase === "enter" || record.data.persistent || record.pauses.size || record.timer !== null) return;
		record.startedAt = this.now();
		record.timer = this.win.setTimeout(() => {
			record.timer = null;
			record.remaining = 0;
			record.startedAt = null;
			if (!this.owns(record)) return;
			if (this.doc.hidden) {
				record.remaining = Math.min(record.data.duration, 1e3);
				this.setPause(record, "document-hidden", true);
			} else if (record.view?.item.contains(this.doc.activeElement) || this.doc.activeElement === this.list || this.doc.activeElement === this.viewport) {
				record.remaining = Math.min(record.data.duration, 1e3);
				this.setPause(record, "focus", true);
			} else this.dismiss(record.id, "timeout");
		}, Math.ceil(record.remaining));
	}
	stopTimer(record) {
		record.remaining = this.remaining(record);
		record.startedAt = null;
		if (record.timer !== null) this.win.clearTimeout(record.timer);
		record.timer = null;
	}
	setPause(record, reason, paused) {
		if (!this.owns(record) || record.dismissing || record.pauses.has(reason) === paused) return false;
		const wasPaused = record.pauses.size > 0;
		if (paused) {
			this.stopTimer(record);
			record.pauses.add(reason);
		} else record.pauses.delete(reason);
		record.view?.item.classList.toggle(CLASSES.paused, record.pauses.size > 0);
		this.startTimer(record);
		if (!wasPaused && record.pauses.size > 0) this.emit(TOAST_EVENTS.pause, {
			toast: this.snapshot(record),
			reason
		});
		else if (wasPaused && record.pauses.size === 0) this.emit(TOAST_EVENTS.resume, {
			toast: this.snapshot(record),
			reason
		});
		return true;
	}
	requestAnnouncement(record) {
		if (!this.owns(record) || record.state !== "visible") return;
		const priority = record.data.priority;
		const message = [record.data.announcement, record.actionError].filter(Boolean).join(" ");
		const signature = `${priority}:${message}`;
		if (priority === "off" || signature === record.lastAnnouncement) {
			this.announcer.cancel(record.id);
			return;
		}
		this.announcer.request(priority, {
			id: record.id,
			message,
			valid: () => this.owns(record) && record.state === "visible" && this.root.isConnected && record.data.priority === priority,
			committed: (result) => {
				if (!this.owns(record)) return;
				record.lastAnnouncement = signature;
				this.emit(TOAST_EVENTS.announce, {
					toast: this.snapshot(record),
					message,
					priority,
					transport: result.transport,
					fallback: result.fallback
				});
			},
			failed: (error, transport) => {
				if (!this.owns(record)) return;
				this.emit(TOAST_EVENTS.announcementError, {
					toast: this.snapshot(record),
					message,
					priority,
					transport,
					error
				});
			}
		});
	}
	eventRecord(target) {
		if (!(target instanceof this.win.Element)) return void 0;
		const item = target.closest(SELECTORS.item);
		if (!item || item.parentElement !== this.list) return void 0;
		return this.records.get(item.getAttribute(ATTR.id) ?? "");
	}
	onPointerOver(event) {
		if (event.pointerType === "touch") return;
		const record = this.eventRecord(event.target);
		if (!record || event.relatedTarget instanceof this.win.Node && record.view?.item.contains(event.relatedTarget)) return;
		this.setPause(record, "hover", true);
	}
	onPointerOut(event) {
		if (event.pointerType === "touch") return;
		const record = this.eventRecord(event.target);
		if (!record || event.relatedTarget instanceof this.win.Node && record.view?.item.contains(event.relatedTarget)) return;
		this.setPause(record, "hover", false);
	}
	syncFocusPauses() {
		if (this.destroyed) return;
		const active = this.doc.activeElement;
		if (!this.viewport.contains(active)) {
			this.empty.hidden = true;
			this.viewport.removeAttribute(ATTR.describedby);
		}
		const areaFocused = active === this.list || active === this.viewport;
		for (const record of [...this.records.values()]) this.setPause(record, "focus", areaFocused || Boolean(record.view?.item.contains(active)));
	}
	onFocusIn(_event) {
		this.syncFocusPauses();
	}
	onFocusOut(_event) {
		this.win.queueMicrotask(() => this.syncFocusPauses());
	}
	onVisibility() {
		if (this.destroyed) return;
		this.announcer.setPaused(this.doc.hidden);
		for (const record of [...this.records.values()]) this.setPause(record, "document-hidden", this.doc.hidden);
		if (this.doc.hidden) for (const id of [...this.activeAnimations.keys()]) this.cancelAnimation(id, true);
	}
	onClick(event) {
		if (!(event.target instanceof this.win.Element)) return;
		const record = this.eventRecord(event.target);
		if (!record || record.dismissing) return;
		if (event.target.closest(SELECTORS.dismiss) && record.data.dismissible) this.dismiss(record.id, "close-button");
		else if (event.target.closest(SELECTORS.action)) this.invokeAction(record);
	}
	invokeAction(record) {
		const action = record.data.action;
		if (!action || record.actionPending || !this.owns(record)) return;
		const controller = new this.win.AbortController();
		record.actionController = controller;
		record.actionPending = true;
		record.actionError = null;
		this.setPause(record, "action", true);
		if (!this.owns(record)) return;
		this.render(record);
		if (!this.owns(record)) return;
		this.emit(TOAST_EVENTS.action, { toast: this.snapshot(record) });
		if (!this.owns(record) || record.actionController !== controller) return;
		const settle = (error, failed = false) => {
			if (!this.owns(record) || record.actionController !== controller || controller.signal.aborted) return;
			record.actionPending = false;
			record.actionController = null;
			if (failed) {
				record.actionError = this.options.labels.actionFailed;
				record.input = {
					...record.input,
					persistent: true
				};
				record.data = {
					...record.data,
					persistent: true
				};
			}
			this.setPause(record, "action", false);
			if (!this.owns(record)) return;
			this.render(record);
			if (!this.owns(record)) return;
			if (failed) {
				this.emit(TOAST_EVENTS.actionError, {
					toast: this.snapshot(record),
					error
				});
				this.requestAnnouncement(record);
			} else if (action.dismissOnSuccess && action.onClick) this.dismiss(record.id, "action");
		};
		try {
			const result = action.onClick?.(Object.freeze({
				instance: this,
				id: record.id,
				toast: this.snapshot(record),
				signal: controller.signal
			}));
			if (result && typeof result.then === "function") Promise.resolve(result).then(() => settle(), (error) => settle(error, true));
			else settle();
		} catch (error) {
			settle(error, true);
		}
	}
	animationDriverName() {
		return typeof this.options.animation === "string" ? this.options.animation : this.options.animation.name;
	}
	canAnimate(record, phase) {
		if (this.destroyed || this.doc.hidden || prefersReducedMotion(this.win)) return false;
		if (this.options.animation === "none") return false;
		if (this.options.animation === "css") return true;
		return typeof this.options.animation[phase] === "function";
	}
	beginAnimation(record, phase, element, complete) {
		if (!this.canAnimate(record, phase)) return false;
		this.cancelAnimation(record.id, false);
		const controller = new this.win.AbortController();
		const driver = this.animationDriverName();
		const active = {
			record,
			element,
			phase,
			driver,
			controller,
			complete
		};
		this.activeAnimations.set(record.id, active);
		record.animationPhase = phase;
		element.classList.toggle(CLASSES.entering, phase === "enter");
		element.classList.toggle(CLASSES.exiting, phase === "exit");
		this.emit(TOAST_EVENTS.animationStart, {
			toast: this.snapshot(record),
			phase,
			driver
		});
		if (this.activeAnimations.get(record.id) !== active || this.destroyed) return true;
		let task;
		try {
			if (this.options.animation === "css") task = waitForCssAnimation(this.win, element, phase, controller.signal);
			else if (typeof this.options.animation !== "string") {
				const callback = this.options.animation[phase];
				const context = Object.freeze({
					instance: this,
					root: this.root,
					element,
					toast: this.snapshot(record),
					phase,
					signal: controller.signal
				});
				task = callback?.(context);
			} else task = void 0;
		} catch (error) {
			this.settleAnimation(active, "failed", error);
			return true;
		}
		Promise.resolve(task).then(() => this.settleAnimation(active, "completed"), (error) => {
			if (controller.signal.aborted) return;
			this.settleAnimation(active, "failed", error);
		});
		return true;
	}
	settleAnimation(active, status, error) {
		if (this.activeAnimations.get(active.record.id) !== active) return;
		this.activeAnimations.delete(active.record.id);
		active.record.animationPhase = null;
		active.element.classList.remove(CLASSES.entering, CLASSES.exiting);
		if (status === "failed") {
			this.emit(TOAST_EVENTS.animationError, {
				toast: this.snapshot(active.record),
				phase: active.phase,
				driver: active.driver,
				error
			});
			if (this.destroyed) return;
		}
		this.emit(TOAST_EVENTS.animationEnd, {
			toast: this.snapshot(active.record),
			phase: active.phase,
			driver: active.driver,
			status
		});
		if (this.destroyed) return;
		active.complete();
	}
	cancelAnimation(id, finalize) {
		const active = this.activeAnimations.get(id);
		if (!active) return false;
		this.activeAnimations.delete(id);
		active.controller.abort();
		active.record.animationPhase = null;
		active.element.classList.remove(CLASSES.entering, CLASSES.exiting);
		this.emit(TOAST_EVENTS.animationEnd, {
			toast: this.snapshot(active.record),
			phase: active.phase,
			driver: active.driver,
			status: "cancelled"
		});
		if (finalize && !this.destroyed) active.complete();
		return true;
	}
	finishExit(record, element) {
		if (this.exiting.get(record.id) !== element) return;
		this.exiting.delete(record.id);
		element.remove();
		record.view = null;
		record.animationPhase = null;
		if (!this.destroyed) this.drain();
	}
	cancelAction(record) {
		const controller = record.actionController;
		record.actionController = null;
		record.actionPending = false;
		record.actionError = null;
		record.pauses.delete("action");
		controller?.abort();
	}
	focus(element) {
		if (!element || !element.isConnected || element.ownerDocument !== this.doc || element === this.doc.body || element === this.doc.documentElement) return false;
		if (element.closest("[hidden], [inert], [aria-hidden=\"true\"]") || element.matches(":disabled") || element.getClientRects().length === 0) return false;
		const style = this.win.getComputedStyle(element);
		if (style.visibility === "hidden" || style.display === "none") return false;
		element.focus({ preventScroll: true });
		return this.doc.activeElement === element;
	}
	recoverFocus(record, destroying = false) {
		for (const target of [record.data.origin, record.capturedFocus]) if (target && !record.view?.item.contains(target) && (!destroying || !this.viewport.contains(target)) && this.focus(target)) return;
		if (!destroying && !this.clearing) for (const candidate of this.records.values()) {
			if (candidate === record || !candidate.view) continue;
			if (candidate.data.action && this.focus(candidate.view.action)) return;
			if (candidate.data.dismissible && this.focus(candidate.view.dismiss)) return;
		}
		if (!destroying) {
			if (this.visibleCount === 0) {
				this.empty.hidden = false;
				this.viewport.setAttribute(ATTR.describedby, this.empty.id);
			}
			if (this.focus(this.viewport)) return;
		}
		if (this.root.isConnected) {
			const previous = this.root.getAttribute(ATTR.tabindex);
			this.root.setAttribute(ATTR.tabindex, "-1");
			this.focus(this.root);
			if (previous === null) this.root.removeAttribute(ATTR.tabindex);
			else this.root.setAttribute(ATTR.tabindex, previous);
		}
	}
	runHooks(hook, record) {
		for (const [name, entry] of [...this.addons]) {
			if (this.destroyed) return;
			if (this.addons.get(name) !== entry) continue;
			const callback = entry.addon[hook];
			if (!callback) continue;
			const context = Object.freeze({
				...entry.context,
				toast: this.snapshot(record)
			});
			this.observeAddon(name, hook, () => callback(context));
		}
	}
	safeAddonCleanup(name, cleanup) {
		this.observeAddon(name, "cleanup", cleanup);
	}
	observeAddon(name, phase, callback) {
		try {
			const result = callback();
			if (result && (typeof result === "object" || typeof result === "function") && "then" in result && typeof result.then === "function") Promise.resolve(result).catch((error) => {
				if (!this.destroyed) this.addonError(name, phase, error);
			});
		} catch (error) {
			this.addonError(name, phase, error);
		}
	}
	addonError(addon, phase, error) {
		if (this.reportingAddonError) return;
		this.reportingAddonError = true;
		try {
			this.emit(TOAST_EVENTS.addonError, {
				addon,
				phase,
				error
			});
		} finally {
			this.reportingAddonError = false;
		}
	}
	emit(type, extra) {
		const detail = Object.freeze({
			instance: this,
			root: this.root,
			instanceId: this.instanceId,
			timestamp: Date.now(),
			visibleCount: this.visibleCount,
			queuedCount: this.queuedCount,
			...extra
		});
		this.root.dispatchEvent(new this.win.CustomEvent(type, {
			bubbles: true,
			composed: false,
			cancelable: false,
			detail
		}));
	}
};
function createToast(root, options = {}) {
	return new A11yToast(root, options);
}
function initToastAll(options = {}, scope) {
	const parent = scope ?? (typeof document === "undefined" ? null : document);
	if (!parent) return [];
	return Array.from(parent.querySelectorAll(SELECTORS.root)).map((root) => createToast(root, options));
}

//#endregion
export { A11yToast, TOAST_EVENTS, addToastEventListener, createToast, initToastAll };
//# sourceMappingURL=index.js.map