import { n as addToastEventListener, t as TOAST_EVENTS } from "./events-D6MCpthx.js";

//#region src/adapters/dom-events.ts
const MAX_SYNC_COMMANDS = 100;
function normalizeCorrelationKey(value, required) {
	if (value == null && !required) return null;
	const key = typeof value === "string" ? value.trim() : "";
	if (!key) throw new TypeError("DOM event adapter correlationKey must be a non-empty string.");
	return key;
}
function validateOwner(value) {
	if (value === "toast" || value === "source") return value;
	throw new TypeError("DOM event adapter requires announcementOwner to be \"toast\" or \"source\".");
}
function applyShowOwnership(input, owner) {
	return owner === "source" ? {
		...input,
		priority: "off"
	} : { ...input };
}
function applyUpdateOwnership(patch, owner) {
	return owner === "source" ? {
		...patch,
		priority: "off"
	} : { ...patch };
}
function createDomEventAdapter(instance, options) {
	if (!instance || typeof instance.show !== "function" || typeof instance.update !== "function") throw new TypeError("createDomEventAdapter requires an A11y Toast instance.");
	const target = options?.target;
	if (!target || typeof target.addEventListener !== "function" || typeof target.removeEventListener !== "function") throw new TypeError("DOM event adapter requires an EventTarget.");
	const announcementOwner = validateOwner(options.announcementOwner);
	if (!Array.isArray(options.bindings) || options.bindings.length === 0) throw new TypeError("DOM event adapter requires at least one binding.");
	const bindings = options.bindings.map((binding) => {
		const event = typeof binding?.event === "string" ? binding.event.trim() : "";
		if (!event) throw new TypeError("DOM event adapter binding requires a non-empty event name.");
		if (typeof binding.map !== "function") throw new TypeError("DOM event adapter binding requires a map function.");
		return Object.freeze({
			event,
			map: binding.map,
			options: binding.options
		});
	});
	const correlations = /* @__PURE__ */ new Map();
	const pending = /* @__PURE__ */ new Map();
	const removers = [];
	let destroyed = false;
	const getToastId = (rawKey) => {
		const key = normalizeCorrelationKey(rawKey, true);
		if (destroyed) return void 0;
		const id = correlations.get(key);
		if (!id) return void 0;
		if (!instance.getToast(id)) {
			correlations.delete(key);
			return;
		}
		return id;
	};
	const context = Object.freeze({
		instance,
		announcementOwner,
		getToastId
	});
	const report = (error, event, eventType) => {
		try {
			options.onError?.(error, Object.freeze({
				event,
				eventType
			}));
		} catch {}
	};
	const untrackId = (id) => {
		for (const [key, trackedId] of correlations) if (trackedId === id) correlations.delete(key);
	};
	const execute = (command) => {
		if (destroyed || instance.isDestroyed || command.type === "ignore") return;
		if (command.type === "show") {
			const key$1 = normalizeCorrelationKey(command.correlationKey, false);
			const input = applyShowOwnership(command.input, announcementOwner);
			if (key$1) {
				const existingId = getToastId(key$1);
				if (existingId) {
					if (instance.update(existingId, input)) return;
					if (destroyed || instance.isDestroyed || instance.getToast(existingId)) return;
					correlations.delete(key$1);
				}
			}
			const id$1 = instance.show(input);
			if (key$1 && id$1 !== null) {
				if (destroyed) {
					if (options.dismissTrackedOnDestroy && !instance.isDestroyed) instance.dismiss(id$1);
				} else if (!instance.isDestroyed && instance.getToast(id$1)) correlations.set(key$1, id$1);
			}
			return;
		}
		const key = normalizeCorrelationKey(command.correlationKey, true);
		const id = getToastId(key);
		if (!id) return;
		if (command.type === "update") {
			if (!instance.update(id, applyUpdateOwnership(command.patch, announcementOwner)) && !instance.getToast(id)) {
				if (correlations.get(key) === id) correlations.delete(key);
			}
			return;
		}
		instance.dismiss(id, command.reason);
		if (correlations.get(key) === id) correlations.delete(key);
	};
	const dispatch = (command, event, eventType) => {
		const run = () => {
			try {
				execute(command);
			} catch (error) {
				report(error, event, eventType);
			}
		};
		const key = command.type === "ignore" ? null : normalizeCorrelationKey(command.correlationKey, command.type !== "show");
		if (!key) {
			run();
			return;
		}
		const current = pending.get(key);
		if (current) {
			if (current.blocked) return;
			if (current.remaining === 0) {
				current.blocked = true;
				current.jobs.length = 0;
				report(/* @__PURE__ */ new RangeError(`DOM event adapter exceeded ${MAX_SYNC_COMMANDS} same-key commands in one synchronous transaction.`), event, eventType);
				return;
			}
			current.remaining--;
			current.jobs.push(run);
			return;
		}
		const transaction = {
			jobs: [run],
			remaining: MAX_SYNC_COMMANDS - 1,
			blocked: false
		};
		pending.set(key, transaction);
		try {
			while (transaction.jobs.length && !destroyed && !instance.isDestroyed) transaction.jobs.shift()();
		} finally {
			pending.delete(key);
		}
	};
	for (const binding of bindings) {
		const listener = (event) => {
			if (destroyed || instance.isDestroyed) return;
			try {
				const command = binding.map(event, context);
				if (command == null) return;
				if (typeof command !== "object" || !("type" in command)) throw new TypeError("DOM event adapter mapper must return a valid command, null, or undefined.");
				if (![
					"show",
					"update",
					"dismiss",
					"ignore"
				].includes(command.type)) throw new TypeError("DOM event adapter mapper returned an unsupported command type.");
				dispatch(command, event, binding.event);
			} catch (error) {
				report(error, event, binding.event);
			}
		};
		target.addEventListener(binding.event, listener, binding.options);
		removers.push(() => target.removeEventListener(binding.event, listener, binding.options));
	}
	removers.push(addToastEventListener(instance.root, TOAST_EVENTS.dismiss, (event) => {
		if (event.detail.instance === instance) untrackId(event.detail.toast.id);
	}));
	const adapter = {
		instance,
		target,
		announcementOwner,
		get isDestroyed() {
			return destroyed;
		},
		getToastId,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			for (const transaction of pending.values()) transaction.jobs.length = 0;
			pending.clear();
			for (const remove of removers.splice(0)) remove();
			if (options.dismissTrackedOnDestroy && !instance.isDestroyed) for (const id of new Set(correlations.values())) instance.dismiss(id);
			correlations.clear();
		}
	};
	removers.push(addToastEventListener(instance.root, TOAST_EVENTS.destroy, (event) => {
		if (event.detail.instance === instance) adapter.destroy();
	}));
	return Object.freeze(adapter);
}

//#endregion
export { createDomEventAdapter as t };
//# sourceMappingURL=dom-events-DwuDnHT0.js.map