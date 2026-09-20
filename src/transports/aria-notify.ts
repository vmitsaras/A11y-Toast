import type {
  ToastAnnouncementTransport,
  ToastAnnouncementTransportContext,
  ToastAnnouncementTransportResult,
} from '../types.js';

interface AriaNotifyOptions {
  priority?: 'normal' | 'high';
}
type AriaNotifyDocument = Document & {
  ariaNotify?: (announcement: string, options?: AriaNotifyOptions) => void;
};

/**
 * Experimental transport for Document.ariaNotify().
 * Feature detection happens at commit time. Unsupported browsers fall back to
 * the already-scheduled live-region channel. Permissions-Policy blocking can
 * fail silently by platform design and cannot be detected here.
 */
export function createAriaNotifyTransport(): ToastAnnouncementTransport {
  return Object.freeze({
    name: 'aria-notify',
    announce({ message, priority, liveRegion }: ToastAnnouncementTransportContext): ToastAnnouncementTransportResult {
      const doc = liveRegion.ownerDocument as AriaNotifyDocument;
      if (typeof doc.ariaNotify === 'function') {
        doc.ariaNotify(message, { priority: priority === 'assertive' ? 'high' : 'normal' });
        return Object.freeze({ transport: 'aria-notify', fallback: false });
      }
      liveRegion.textContent = message;
      return Object.freeze({ transport: 'live-region', fallback: true });
    },
  });
}
