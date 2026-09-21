//#region src/transports/aria-notify.ts
/**
* Experimental transport for Document.ariaNotify().
* Feature detection happens at commit time. Unsupported browsers fall back to
* the already-scheduled live-region channel. Permissions-Policy blocking can
* fail silently by platform design and cannot be detected here.
*/
function createAriaNotifyTransport() {
	return Object.freeze({
		name: "aria-notify",
		announce({ message, priority, liveRegion }) {
			const doc = liveRegion.ownerDocument;
			if (typeof doc.ariaNotify === "function") {
				doc.ariaNotify(message, { priority: priority === "assertive" ? "high" : "normal" });
				return Object.freeze({
					transport: "aria-notify",
					fallback: false
				});
			}
			liveRegion.textContent = message;
			return Object.freeze({
				transport: "live-region",
				fallback: true
			});
		}
	});
}

//#endregion
export { createAriaNotifyTransport };
//# sourceMappingURL=aria-notify.js.map