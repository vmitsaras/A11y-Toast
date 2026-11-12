import { n as addToastEventListener, t as TOAST_EVENTS } from "../events-D6MCpthx.js";

//#region src/addons/promise.ts
function messageOf(state, label) {
	const message = typeof state === "string" ? state.trim() : typeof state?.message === "string" ? state.message.trim() : "";
	if (!message) throw new TypeError(`Toast promise ${label} state requires a non-empty message.`);
	return message;
}
function loadingInput(state) {
	if (typeof state === "string") return {
		message: state.trim(),
		tone: "loading"
	};
	return {
		...state,
		message: state.message.trim(),
		tone: "loading"
	};
}
function outcomePatch(state, tone) {
	if (typeof state === "string") return {
		message: state.trim(),
		tone
	};
	return {
		...state,
		message: state.message.trim(),
		tone: state.tone ?? tone
	};
}
function trackToastPromise(instance, operation, states) {
	if (!instance || typeof instance.show !== "function" || typeof instance.update !== "function") throw new TypeError("trackToastPromise requires an A11y Toast instance.");
	if (!states || typeof states !== "object") throw new TypeError("trackToastPromise requires loading, success, and error states.");
	messageOf(states.loading, "loading");
	messageOf(states.success, "success");
	messageOf(states.error, "error");
	const promise = Promise.resolve(operation);
	const id = instance.show(loadingInput(states.loading));
	let active = id !== null && !instance.isDestroyed && Boolean(instance.getToast(id));
	let removeDismiss = null;
	let removeDestroy = null;
	const stop = () => {
		if (!active) return false;
		active = false;
		removeDismiss?.();
		removeDestroy?.();
		removeDismiss = null;
		removeDestroy = null;
		return true;
	};
	if (active) {
		removeDismiss = addToastEventListener(instance.root, TOAST_EVENTS.dismiss, (event) => {
			if (event.detail.instance === instance && event.detail.toast.id === id) stop();
		});
		removeDestroy = addToastEventListener(instance.root, TOAST_EVENTS.destroy, (event) => {
			if (event.detail.instance === instance) stop();
		});
	}
	const settle = (state, tone) => {
		if (!active || id === null || instance.isDestroyed || !instance.getToast(id)) {
			stop();
			return;
		}
		try {
			if (!instance.update(id, outcomePatch(state, tone))) stop();
			else stop();
		} catch {
			stop();
		}
	};
	promise.then(() => settle(states.success, "success"), () => settle(states.error, "error"));
	return Object.freeze({
		id,
		promise,
		stop
	});
}

//#endregion
export { trackToastPromise };
//# sourceMappingURL=promise.js.map