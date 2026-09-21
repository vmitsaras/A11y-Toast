import { n as addToastEventListener, t as TOAST_EVENTS } from "../events-D6MCpthx.js";

//#region src/addons/dedupe.ts
const POLICIES = Object.freeze([
	"update-existing",
	"drop-new",
	"replace-existing"
]);
function resolvePolicy(value, fallback) {
	if (value === void 0) return fallback;
	if (typeof value === "string" && POLICIES.includes(value)) return value;
	throw new TypeError("Toast deduplication policy must be update-existing, drop-new, or replace-existing.");
}
function normalizeKey(input) {
	const key = typeof input?.key === "string" ? input.key.trim() : "";
	if (!key) throw new TypeError("Key-based toast deduplication requires a non-empty key.");
	return key;
}
function firstMatch(instance, key) {
	return instance.getToasts().find((toast) => toast.key === key);
}
function waitForExit(instance, id) {
	let started = false;
	let ended = false;
	let resolveEnd = null;
	const end = new Promise((resolve) => {
		resolveEnd = resolve;
	});
	const offStart = addToastEventListener(instance.root, TOAST_EVENTS.animationStart, (event) => {
		if (event.detail.instance !== instance || event.detail.toast.id !== id || event.detail.phase !== "exit") return;
		started = true;
	});
	const offEnd = addToastEventListener(instance.root, TOAST_EVENTS.animationEnd, (event) => {
		if (event.detail.instance !== instance || event.detail.toast.id !== id || event.detail.phase !== "exit") return;
		ended = true;
		resolveEnd?.();
	});
	const cleanup = () => {
		offStart();
		offEnd();
	};
	return { async dismiss() {
		if (!instance.dismiss(id)) {
			cleanup();
			return false;
		}
		if (started && !ended) await end;
		cleanup();
		return true;
	} };
}
function createDedupeController(instance, options = {}) {
	if (!instance || typeof instance.show !== "function" || typeof instance.getToasts !== "function") throw new TypeError("createDedupeController requires an A11y Toast instance.");
	const defaultPolicy = resolvePolicy(options.policy, "update-existing");
	const tails = /* @__PURE__ */ new Map();
	let destroyed = false;
	const serialize = (key, work) => {
		const previous = tails.get(key) ?? Promise.resolve();
		let release;
		const gate = new Promise((resolve) => {
			release = resolve;
		});
		const tail = previous.catch(() => {}).then(() => gate);
		tails.set(key, tail);
		return previous.catch(() => {}).then(work).finally(() => {
			release();
			if (tails.get(key) === tail) tails.delete(key);
		});
	};
	const controller = {
		instance,
		policy: defaultPolicy,
		get isDestroyed() {
			return destroyed;
		},
		show(input, policy) {
			const key = normalizeKey(input);
			const selectedPolicy = resolvePolicy(policy, defaultPolicy);
			const normalizedInput = {
				...input,
				key
			};
			return serialize(key, async () => {
				if (destroyed || instance.isDestroyed) return Object.freeze({
					id: null,
					previousId: null,
					status: "stopped"
				});
				const existing = firstMatch(instance, key);
				if (!existing) {
					const id$1 = instance.show(normalizedInput);
					return Object.freeze({
						id: id$1,
						previousId: null,
						status: id$1 === null ? "rejected" : "shown"
					});
				}
				if (selectedPolicy === "drop-new") return Object.freeze({
					id: existing.id,
					previousId: existing.id,
					status: "kept-existing"
				});
				if (selectedPolicy === "update-existing") {
					if (instance.update(existing.id, normalizedInput)) return Object.freeze({
						id: existing.id,
						previousId: existing.id,
						status: "updated"
					});
					if (destroyed || instance.isDestroyed) return Object.freeze({
						id: null,
						previousId: existing.id,
						status: "stopped"
					});
					const id$1 = instance.show(normalizedInput);
					return Object.freeze({
						id: id$1,
						previousId: existing.id,
						status: id$1 === null ? "rejected" : "shown"
					});
				}
				await waitForExit(instance, existing.id).dismiss();
				if (destroyed || instance.isDestroyed) return Object.freeze({
					id: null,
					previousId: existing.id,
					status: "stopped"
				});
				const concurrent = firstMatch(instance, key);
				if (concurrent) {
					const updated = instance.update(concurrent.id, normalizedInput);
					return Object.freeze({
						id: updated ? concurrent.id : null,
						previousId: existing.id,
						status: updated ? "updated" : "rejected"
					});
				}
				const id = instance.show(normalizedInput);
				return Object.freeze({
					id,
					previousId: existing.id,
					status: id === null ? "rejected" : "replaced"
				});
			});
		},
		destroy() {
			destroyed = true;
		}
	};
	return Object.freeze(controller);
}

//#endregion
export { createDedupeController };
//# sourceMappingURL=dedupe.js.map