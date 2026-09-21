//#region src/events.ts
const TOAST_EVENTS = Object.freeze({
	init: "a11y-toast:init",
	ready: "a11y-toast:ready",
	show: "a11y-toast:show",
	queue: "a11y-toast:queue",
	update: "a11y-toast:update",
	announce: "a11y-toast:announce",
	announcementError: "a11y-toast:announcement-error",
	action: "a11y-toast:action",
	actionError: "a11y-toast:action-error",
	pause: "a11y-toast:pause",
	resume: "a11y-toast:resume",
	dismiss: "a11y-toast:dismiss",
	drop: "a11y-toast:drop",
	animationStart: "a11y-toast:animation-start",
	animationEnd: "a11y-toast:animation-end",
	animationError: "a11y-toast:animation-error",
	addonError: "a11y-toast:addon-error",
	destroy: "a11y-toast:destroy"
});
/** No global HTMLElementEventMap augmentation: each consumer opts into the typed helper. */
function addToastEventListener(target, type, listener, options) {
	const wrapped = (event) => listener(event);
	target.addEventListener(type, wrapped, options);
	return () => target.removeEventListener(type, wrapped, options);
}

//#endregion
export { addToastEventListener as n, TOAST_EVENTS as t };
//# sourceMappingURL=events-D6MCpthx.js.map