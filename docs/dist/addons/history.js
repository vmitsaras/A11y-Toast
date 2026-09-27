import { t as TOAST_EVENTS } from "../events-D6MCpthx.js";

//#region src/addons/history.ts
const TOAST_HISTORY_ADDON_NAME = "history";
const TOAST_HISTORY_DEFAULTS = Object.freeze({ maxEntries: 50 });
const TOAST_HISTORY_LIMITS = Object.freeze({
	minEntries: 1,
	maxEntries: 1e3
});
function resolveMaxEntries(value) {
	if (value === void 0) return TOAST_HISTORY_DEFAULTS.maxEntries;
	if (typeof value !== "number" || !Number.isInteger(value) || value < TOAST_HISTORY_LIMITS.minEntries || value > TOAST_HISTORY_LIMITS.maxEntries) throw new TypeError("Toast history maxEntries must be an integer from 1 to 1000.");
	return value;
}
function copySnapshot(toast) {
	return Object.freeze({
		id: toast.id,
		key: toast.key,
		title: toast.title,
		message: toast.message,
		tone: toast.tone,
		priority: toast.priority,
		announcement: toast.announcement,
		state: toast.state,
		animationPhase: toast.animationPhase,
		duration: toast.duration,
		persistent: toast.persistent,
		dismissible: toast.dismissible,
		remaining: toast.remaining,
		pauseReasons: Object.freeze([...toast.pauseReasons]),
		action: toast.action ? Object.freeze({
			label: toast.action.label,
			dismissOnSuccess: toast.action.dismissOnSuccess
		}) : null,
		actionLayout: toast.actionLayout,
		actionPending: toast.actionPending,
		actionError: toast.actionError
	});
}
/**
* Observe future show/update/dismiss events on one manager. No backfill, queue/drop
* logging, persistence, rendering, subscriptions, replay, or polling is introduced.
* One history controller per manager; destroy it before attaching a replacement.
*/
function createHistoryController(instance, options = {}) {
	if (!instance || typeof instance.registerAddon !== "function" || typeof instance.unregisterAddon !== "function" || typeof instance.getAddon !== "function") throw new TypeError("createHistoryController requires an A11y Toast instance.");
	if (instance.isDestroyed) throw new Error("Cannot attach toast history to a destroyed instance.");
	if (!options || typeof options !== "object") throw new TypeError("Toast history options must be an object.");
	const maxEntries = resolveMaxEntries(options.maxEntries);
	if (instance.getAddon(TOAST_HISTORY_ADDON_NAME)) throw new Error("Toast history is already registered. Destroy the existing history controller first.");
	const buffer = new Array(maxEntries);
	let head = 0;
	let count = 0;
	let sequence = 0;
	let destroyed = false;
	let owner = instance;
	const clear = () => {
		const removed = count;
		buffer.fill(void 0);
		head = 0;
		count = 0;
		return removed;
	};
	const release = () => {
		destroyed = true;
		owner = null;
		clear();
	};
	const append = (type, toast, timestamp, reason = null) => {
		if (destroyed || !owner || owner.isDestroyed) return;
		const entry = Object.freeze({
			sequence: ++sequence,
			type,
			timestamp,
			toast: copySnapshot(toast),
			reason
		});
		buffer[(head + count) % maxEntries] = entry;
		if (count === maxEntries) head = (head + 1) % maxEntries;
		else count++;
	};
	const setup = (context) => {
		if (context.signal.aborted || context.instance.isDestroyed) {
			release();
			return release;
		}
		context.signal.addEventListener("abort", release, { once: true });
		context.on(TOAST_EVENTS.show, ({ detail }) => append("show", detail.toast, detail.timestamp));
		context.on(TOAST_EVENTS.update, ({ detail }) => append("update", detail.toast, detail.timestamp));
		context.on(TOAST_EVENTS.dismiss, ({ detail }) => append("dismiss", detail.toast, detail.timestamp, detail.reason));
		context.on(TOAST_EVENTS.destroy, release);
		return () => {
			context.signal.removeEventListener("abort", release);
			release();
		};
	};
	const addon = Object.freeze({
		name: TOAST_HISTORY_ADDON_NAME,
		setup
	});
	try {
		instance.registerAddon(addon);
		if (destroyed || instance.isDestroyed || instance.getAddon(addon.name)?.setup !== setup) throw new Error("Toast history could not attach its lifecycle observer.");
	} catch (error) {
		if (instance.getAddon(addon.name)?.setup === setup) instance.unregisterAddon(addon.name);
		release();
		throw error;
	}
	return Object.freeze({
		maxEntries,
		get size() {
			return count;
		},
		get isDestroyed() {
			return destroyed;
		},
		getEntries() {
			const entries = [];
			for (let offset = 0; offset < count; offset++) {
				const entry = buffer[(head + offset) % maxEntries];
				if (entry) entries.push(entry);
			}
			return Object.freeze(entries);
		},
		clear,
		destroy() {
			if (destroyed) return;
			const current = owner;
			release();
			if (current?.getAddon(addon.name)?.setup === setup) current.unregisterAddon(addon.name);
		}
	});
}

//#endregion
export { TOAST_HISTORY_ADDON_NAME, TOAST_HISTORY_DEFAULTS, TOAST_HISTORY_LIMITS, createHistoryController };
//# sourceMappingURL=history.js.map