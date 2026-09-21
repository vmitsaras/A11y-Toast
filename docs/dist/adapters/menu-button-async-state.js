import { n as addToastEventListener, t as TOAST_EVENTS } from "../events-D6MCpthx.js";
import { t as createDomEventAdapter } from "../dom-events-DtCzMDJP.js";
import { MENU_BUTTON_EVENTS, addMenuButtonEventListener } from "a11y-menu-button/core";

//#region src/adapters/menu-button-async-state.ts
const CORRELATION_KEY = "a11y-menu-button:async-state";
function stateMessage(detail) {
	return (detail.stateElement.textContent ?? "").replace(/\s+/g, " ").trim();
}
function createMenuButtonAsyncStateToastAdapter(instance, sourceRoot) {
	if (!(sourceRoot instanceof HTMLElement)) throw new TypeError("Menu Button async-state toast adapter requires an HTMLElement source root.");
	let destroyed = false;
	let domAdapter;
	domAdapter = createDomEventAdapter(instance, {
		target: sourceRoot,
		announcementOwner: "source",
		dismissTrackedOnDestroy: true,
		bindings: [{
			event: MENU_BUTTON_EVENTS.asyncState,
			map(event) {
				const detail = event.detail;
				if (!detail || detail.root !== sourceRoot) return { type: "ignore" };
				if (detail.state === "ready") return {
					type: "dismiss",
					correlationKey: CORRELATION_KEY
				};
				const message = stateMessage(detail);
				if (!message) return {
					type: "dismiss",
					correlationKey: CORRELATION_KEY
				};
				if (detail.state === "loading") return {
					type: "show",
					correlationKey: CORRELATION_KEY,
					input: {
						message,
						tone: "loading",
						priority: "off",
						persistent: true
					}
				};
				return {
					type: "show",
					correlationKey: CORRELATION_KEY,
					input: {
						message,
						tone: detail.state === "error" ? "error" : "info",
						priority: "off",
						persistent: true
					}
				};
			}
		}]
	});
	let removeSourceDestroy = () => {};
	let removeToastDestroy = () => {};
	const destroy = () => {
		if (destroyed) return;
		destroyed = true;
		removeSourceDestroy();
		removeToastDestroy();
		domAdapter.destroy();
	};
	removeSourceDestroy = addMenuButtonEventListener(sourceRoot, MENU_BUTTON_EVENTS.destroy, destroy);
	removeToastDestroy = addToastEventListener(instance.root, TOAST_EVENTS.destroy, (event) => {
		if (event.detail.instance === instance) destroy();
	});
	const adapter = {
		instance,
		sourceRoot,
		announcementOwner: "source",
		get isDestroyed() {
			return destroyed || domAdapter.isDestroyed;
		},
		destroy
	};
	return Object.freeze(adapter);
}

//#endregion
export { createMenuButtonAsyncStateToastAdapter };
//# sourceMappingURL=menu-button-async-state.js.map