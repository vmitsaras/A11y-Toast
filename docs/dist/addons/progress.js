import { t as TOAST_EVENTS } from "../events-D6MCpthx.js";

//#region src/addons/progress.ts
const SELECTOR = "[data-a11y-toast-id]";
const TRACK_ATTRIBUTE = "data-a11y-toast-progress";
const BAR_ATTRIBUTE = "data-a11y-toast-progress-bar";
const ITEM_CLASS = "a11y-toast--has-progress";
const TRACK_CLASS = "a11y-toast__progress";
const BAR_CLASS = "a11y-toast__progress-bar";
function createProgressAddon(options = {}) {
	const name = typeof options.name === "string" && options.name.trim() ? options.name.trim() : "progress";
	return Object.freeze({
		name,
		setup(context) {
			const doc = context.root.ownerDocument;
			if (!doc.defaultView) return;
			const entries = /* @__PURE__ */ new Map();
			const remove = (id) => {
				const entry = entries.get(id);
				if (!entry) return;
				entries.delete(id);
				entry.track.remove();
				entry.item.classList.remove(ITEM_CLASS);
			};
			const findItem = (id) => {
				for (const candidate of context.root.querySelectorAll(SELECTOR)) if (candidate.getAttribute("data-a11y-toast-id") === id) return candidate;
				return null;
			};
			const ensure = (id) => {
				const existing = entries.get(id);
				if (existing?.item.isConnected) return existing;
				if (existing) remove(id);
				const item = findItem(id);
				if (!item) return null;
				const track = doc.createElement("span");
				const bar = doc.createElement("span");
				track.className = TRACK_CLASS;
				bar.className = BAR_CLASS;
				track.setAttribute(TRACK_ATTRIBUTE, "");
				bar.setAttribute(BAR_ATTRIBUTE, "");
				track.setAttribute("aria-hidden", "true");
				track.append(bar);
				item.append(track);
				item.classList.add(ITEM_CLASS);
				const entry = {
					item,
					track,
					bar
				};
				entries.set(id, entry);
				return entry;
			};
			const sync = (toast) => {
				if (context.signal.aborted || toast.state !== "visible" || toast.persistent || toast.remaining === null || toast.duration <= 0) {
					remove(toast.id);
					return;
				}
				const entry = ensure(toast.id);
				if (!entry) return;
				const remaining = Math.max(0, Math.min(toast.duration, toast.remaining));
				const fraction = toast.duration > 0 ? remaining / toast.duration : 0;
				const paused = toast.pauseReasons.length > 0 || toast.animationPhase === "enter" || doc.hidden;
				entry.track.dataset.a11yToastProgressState = paused ? "paused" : "running";
				entry.bar.style.transition = "none";
				entry.bar.style.transform = `scaleX(${fraction})`;
				if (paused || remaining <= 0) return;
				entry.bar.offsetWidth;
				entry.bar.style.transitionProperty = "transform";
				entry.bar.style.transitionDuration = `${Math.ceil(remaining)}ms`;
				entry.bar.style.transitionTimingFunction = "linear";
				entry.bar.style.transform = "scaleX(0)";
			};
			const syncCurrent = (id) => {
				const toast = context.instance.getToast(id);
				if (toast) sync(toast);
				else remove(id);
			};
			const cleanups = [
				context.on(TOAST_EVENTS.show, (event) => sync(event.detail.toast)),
				context.on(TOAST_EVENTS.update, (event) => sync(event.detail.toast)),
				context.on(TOAST_EVENTS.pause, (event) => sync(event.detail.toast)),
				context.on(TOAST_EVENTS.resume, (event) => sync(event.detail.toast)),
				context.on(TOAST_EVENTS.animationStart, (event) => syncCurrent(event.detail.toast.id)),
				context.on(TOAST_EVENTS.animationEnd, (event) => syncCurrent(event.detail.toast.id)),
				context.on(TOAST_EVENTS.dismiss, (event) => remove(event.detail.toast.id))
			];
			for (const toast of context.instance.getToasts()) sync(toast);
			return () => {
				for (const cleanup of cleanups) cleanup();
				for (const id of [...entries.keys()]) remove(id);
			};
		}
	});
}

//#endregion
export { createProgressAddon };
//# sourceMappingURL=progress.js.map