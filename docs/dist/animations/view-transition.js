//#region src/animations/view-transition.ts
const PHASE_ATTRIBUTE = "data-a11y-toast-view-transition-phase";
const STATE_ATTRIBUTE = "data-a11y-toast-view-transition-state";
const DIRECTION_ATTRIBUTE = "data-a11y-toast-view-transition-direction";
function restoreAttribute(element, name, value) {
	if (value === null) element.removeAttribute(name);
	else element.setAttribute(name, value);
}
function animateNow(context) {
	const scope = context.element;
	const startViewTransition = scope.startViewTransition;
	if (typeof startViewTransition !== "function") return Promise.resolve();
	if (context.signal.aborted) return Promise.reject(new DOMException("View Transition animation aborted.", "AbortError"));
	const initialPhase = scope.getAttribute(PHASE_ATTRIBUTE);
	const initialState = scope.getAttribute(STATE_ATTRIBUTE);
	const initialDirection = scope.getAttribute(DIRECTION_ATTRIBUTE);
	const direction = context.instance.options.position.startsWith("top") ? "top" : "bottom";
	const restore = () => {
		restoreAttribute(scope, PHASE_ATTRIBUTE, initialPhase);
		restoreAttribute(scope, STATE_ATTRIBUTE, initialState);
		restoreAttribute(scope, DIRECTION_ATTRIBUTE, initialDirection);
	};
	const applyOffset = () => {
		scope.setAttribute(STATE_ATTRIBUTE, "offset");
		scope.setAttribute(DIRECTION_ATTRIBUTE, direction);
	};
	const clearOffset = () => {
		restoreAttribute(scope, STATE_ATTRIBUTE, initialState);
		restoreAttribute(scope, DIRECTION_ATTRIBUTE, initialDirection);
	};
	scope.setAttribute(PHASE_ATTRIBUTE, context.phase);
	if (context.phase === "enter") applyOffset();
	let transition;
	try {
		transition = startViewTransition.call(scope, () => {
			if (context.phase === "enter") clearOffset();
			else applyOffset();
		});
	} catch (error) {
		restore();
		return Promise.reject(error);
	}
	return new Promise((resolve, reject) => {
		let settled = false;
		let aborted = false;
		const removeAbort = () => context.signal.removeEventListener("abort", onAbort);
		const finish = (error) => {
			if (settled) return;
			settled = true;
			removeAbort();
			restore();
			const finalize = () => {
				restore();
				if (error !== void 0) reject(error);
				else resolve();
			};
			const queue = scope.ownerDocument.defaultView?.queueMicrotask?.bind(scope.ownerDocument.defaultView);
			if (queue) queue(finalize);
			else Promise.resolve().then(finalize);
		};
		const onAbort = () => {
			if (settled || aborted) return;
			aborted = true;
			try {
				transition.skipTransition();
			} catch {}
			Promise.resolve(transition.finished).then(() => finish(new DOMException(`View Transition ${context.phase} animation aborted.`, "AbortError")), () => finish(new DOMException(`View Transition ${context.phase} animation aborted.`, "AbortError")));
		};
		context.signal.addEventListener("abort", onAbort, { once: true });
		if (context.signal.aborted) {
			onAbort();
			return;
		}
		Promise.resolve(transition.finished).then(() => {
			if (aborted) return;
			finish();
		}, (error) => {
			if (aborted) return;
			finish(error);
		});
	});
}
/**
* Experimental TOAST-180 driver using Element.startViewTransition().
* Unsupported browsers settle immediately with no decorative motion.
* Document.startViewTransition() is never used as a fallback.
*
* Motion distance/timing are stylesheet concerns so this driver never writes
* inline styles. See a11y-toast/animations/view-transition.css.
*/
function createElementViewTransitionDriver() {
	const tails = /* @__PURE__ */ new WeakMap();
	const animate = (context) => {
		const previous = tails.get(context.element);
		const task = previous ? previous.catch(() => {}).then(() => animateNow(context)) : animateNow(context);
		const tail = task.then(() => void 0, () => void 0);
		tails.set(context.element, tail);
		tail.finally(() => {
			if (tails.get(context.element) === tail) tails.delete(context.element);
		});
		return task;
	};
	return Object.freeze({
		name: "view-transition",
		enter: animate,
		exit: animate
	});
}

//#endregion
export { createElementViewTransitionDriver };
//# sourceMappingURL=view-transition.js.map