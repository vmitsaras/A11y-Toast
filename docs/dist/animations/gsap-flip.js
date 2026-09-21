import { t as TOAST_EVENTS } from "../events-D6MCpthx.js";
import { t as prefersReducedMotion } from "../animation-DqMS0Z8l.js";

//#region src/animations/gsap-flip.ts
const ITEM_SELECTOR = "[data-a11y-toast-id]";
const ID_ATTRIBUTE = "data-a11y-toast-id";
const FLIP_ID_ATTRIBUTE = "data-flip-id";
function finiteNumber(value, fallback, label) {
	if (value === void 0) return fallback;
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be a finite number greater than or equal to 0.`);
	return value;
}
function nonEmpty(value, fallback, label) {
	if (value === void 0) return fallback;
	if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be a non-empty string.`);
	return value.trim();
}
function validateGsap(value) {
	if (!value || typeof value !== "object" || typeof value.registerPlugin !== "function") throw new TypeError("createGsapFlipLayoutAddon requires a GSAP instance with registerPlugin().");
}
function validateFlip(value) {
	if (!value || typeof value !== "object" && typeof value !== "function") throw new TypeError("createGsapFlipLayoutAddon requires the GSAP Flip plugin.");
	const candidate = value;
	if (typeof candidate.getState !== "function" || typeof candidate.from !== "function" || typeof candidate.killFlipsOf !== "function") throw new TypeError("GSAP Flip plugin must provide getState(), from(), and killFlipsOf().");
}
function restoreAttribute(elements, attribute) {
	for (const [element, value] of elements) if (value === null) element.removeAttribute(attribute);
	else element.setAttribute(attribute, value);
}
function currentItems(root, excludeId) {
	return [...root.querySelectorAll(ITEM_SELECTOR)].filter((element) => element.getAttribute(ID_ATTRIBUTE) !== excludeId && element.getAttribute("aria-hidden") !== "true" && !element.classList.contains("is-exiting"));
}
function findItem(root, id) {
	for (const element of root.querySelectorAll(ITEM_SELECTOR)) if (element.getAttribute(ID_ATTRIBUTE) === id) return element;
	return null;
}
/**
* Animate only surviving toast layout movement. Enter/exit remains owned by the
* manager's normal animation driver (CSS/GSAP/etc).
*/
function createGsapFlipLayoutAddon(gsap, Flip, options = {}) {
	validateGsap(gsap);
	validateFlip(Flip);
	const duration = finiteNumber(options.duration, .2, "GSAP Flip duration");
	const ease = nonEmpty(options.ease, "power1.inOut", "GSAP Flip ease");
	if (options.onError !== void 0 && typeof options.onError !== "function") throw new TypeError("GSAP Flip onError must be a function.");
	gsap.registerPlugin(Flip);
	const states = /* @__PURE__ */ new WeakMap();
	const report = (error) => {
		try {
			options.onError?.(error);
		} catch {}
	};
	const setupState = (context) => {
		const win = context.root.ownerDocument.defaultView;
		if (!win) throw new Error("GSAP Flip layout add-on requires an active window.");
		const canMove = () => !context.signal.aborted && duration > 0 && !context.root.ownerDocument.hidden && !prefersReducedMotion(win);
		const resolvedStyles = (pending, elements) => new Map(elements.map((element) => {
			const current = element.getAttribute("style");
			const measured = pending.measuredStyles.get(element) ?? null;
			const initial = pending.initialStyles.get(element) ?? null;
			return [element, current === measured ? initial : current];
		}));
		const restorePending = (pending) => {
			if (!pending) return;
			restoreAttribute(resolvedStyles(pending, pending.elements), "style");
			restoreAttribute(pending.flipIds, FLIP_ID_ATTRIBUTE);
		};
		const settleActive = (active) => {
			if (!active) return;
			restoreAttribute(active.finalStyles, "style");
			restoreAttribute(active.flipIds, FLIP_ID_ATTRIBUTE);
			if (state.active === active) state.active = null;
		};
		const stopActive = () => {
			const active = state.active;
			if (!active) return;
			try {
				Flip.killFlipsOf([...active.targets], true);
			} catch (error) {
				report(error);
			} finally {
				settleActive(active);
			}
		};
		const flush = () => {
			state.scheduled = false;
			if (state.waitingExits.size > 0) return;
			const pending = state.pending;
			state.pending = null;
			if (!pending) return;
			if (!canMove()) {
				restorePending(pending);
				return;
			}
			const targets = pending.elements.filter((element) => element.isConnected && element.getAttribute("aria-hidden") !== "true" && !element.classList.contains("is-exiting"));
			if (targets.length === 0) {
				restorePending(pending);
				return;
			}
			const active = {
				targets,
				finalStyles: resolvedStyles(pending, targets),
				flipIds: pending.flipIds,
				settling: false
			};
			state.active = active;
			const settle = () => {
				if (active.settling) return;
				active.settling = true;
				win.queueMicrotask(() => settleActive(active));
			};
			try {
				Flip.from(pending.state, {
					targets,
					duration,
					ease,
					simple: true,
					prune: true,
					onComplete: settle,
					onInterrupt: settle
				});
			} catch (error) {
				settleActive(active);
				report(error);
			}
		};
		const schedule = () => {
			if (!state.pending || state.waitingExits.size > 0 || state.scheduled) return;
			state.scheduled = true;
			win.queueMicrotask(flush);
		};
		const state = {
			context,
			pending: null,
			active: null,
			waitingExits: /* @__PURE__ */ new Set(),
			scheduled: false,
			capture(excludeId) {
				if (!canMove() || state.pending) return;
				stopActive();
				const elements = currentItems(context.root, excludeId);
				if (elements.length === 0) return;
				const flipIds = new Map(elements.map((element) => [element, element.getAttribute(FLIP_ID_ATTRIBUTE)]));
				const initialStyles = new Map(elements.map((element) => [element, element.getAttribute("style")]));
				try {
					const captured = Flip.getState(elements, { simple: true });
					const measuredStyles = new Map(elements.map((element) => [element, element.getAttribute("style")]));
					state.pending = Object.freeze({
						state: captured,
						elements: Object.freeze([...elements]),
						flipIds,
						initialStyles,
						measuredStyles
					});
				} catch (error) {
					restoreAttribute(initialStyles, "style");
					restoreAttribute(flipIds, FLIP_ID_ATTRIBUTE);
					report(error);
				}
			},
			afterMutation() {
				schedule();
			},
			afterDismiss(id) {
				if (!state.pending) return;
				if (findItem(context.root, id)?.isConnected) state.waitingExits.add(id);
				else schedule();
			},
			cleanup() {
				state.scheduled = false;
				state.waitingExits.clear();
				restorePending(state.pending);
				state.pending = null;
				stopActive();
			}
		};
		const removeAnimationEnd = context.on(TOAST_EVENTS.animationEnd, (event) => {
			if (event.detail.phase !== "exit") return;
			if (!state.waitingExits.delete(event.detail.toast.id)) return;
			schedule();
		});
		const baseCleanup = state.cleanup.bind(state);
		state.cleanup = () => {
			removeAnimationEnd();
			baseCleanup();
		};
		return state;
	};
	return Object.freeze({
		name: "gsap-flip-layout",
		setup(context) {
			const state = setupState(context);
			states.set(context.instance, state);
			return () => {
				states.delete(context.instance);
				state.cleanup();
			};
		},
		beforeShow(context) {
			states.get(context.instance)?.capture();
		},
		afterShow(context) {
			states.get(context.instance)?.afterMutation();
		},
		beforeUpdate(context) {
			states.get(context.instance)?.capture(context.toast.id);
		},
		afterUpdate(context) {
			states.get(context.instance)?.afterMutation();
		},
		beforeDismiss(context) {
			states.get(context.instance)?.capture(context.toast.id);
		},
		afterDismiss(context) {
			states.get(context.instance)?.afterDismiss(context.toast.id);
		}
	});
}

//#endregion
export { createGsapFlipLayoutAddon };
//# sourceMappingURL=gsap-flip.js.map