import { m as ToastAnnouncementTransport } from "../types-CViYp0UD.js";

//#region src/transports/aria-notify.d.ts

/**
 * Experimental transport for Document.ariaNotify().
 * Feature detection happens at commit time. Unsupported browsers fall back to
 * the already-scheduled live-region channel. Permissions-Policy blocking can
 * fail silently by platform design and cannot be detected here.
 */
declare function createAriaNotifyTransport(): ToastAnnouncementTransport;
//#endregion
export { createAriaNotifyTransport };
//# sourceMappingURL=aria-notify.d.ts.map