import { C as ToastInstance, j as ToastSnapshot, y as ToastDismissReason } from "../types-CViYp0UD.js";

//#region src/addons/history.d.ts
declare const TOAST_HISTORY_ADDON_NAME = "history";
declare const TOAST_HISTORY_DEFAULTS: Readonly<{
  maxEntries: 50;
}>;
declare const TOAST_HISTORY_LIMITS: Readonly<{
  minEntries: 1;
  maxEntries: 1000;
}>;
type ToastHistoryEvent = 'show' | 'update' | 'dismiss';
interface ToastHistoryOptions {
  /** Maximum lifecycle entries, not distinct toast IDs. Integer from 1 to 1000; defaults to 50. */
  maxEntries?: number;
}
interface ToastHistoryEntry {
  /** Controller-local observation order. Clear does not reuse sequence numbers. */
  readonly sequence: number;
  readonly type: ToastHistoryEvent;
  /** Original lifecycle timestamp (Unix milliseconds); not proof of speech or action delivery. */
  readonly timestamp: number;
  readonly toast: ToastSnapshot;
  readonly reason: ToastDismissReason | null;
}
interface ToastHistoryController {
  readonly maxEntries: number;
  readonly size: number;
  readonly isDestroyed: boolean;
  /** Detached, deeply frozen entries in oldest-observed-first order. No announcement/action replay. */
  getEntries(): readonly ToastHistoryEntry[];
  /** Clears this history only, returning the number removed. Does not dismiss active toasts. */
  clear(): number;
  /** Unregisters the owned observer and clears its retained data. Idempotent. */
  destroy(): void;
}
/**
 * Observe future show/update/dismiss events on one manager. No backfill, queue/drop
 * logging, persistence, rendering, subscriptions, replay, or polling is introduced.
 * One history controller per manager; destroy it before attaching a replacement.
 */
declare function createHistoryController(instance: ToastInstance, options?: ToastHistoryOptions): ToastHistoryController;
//#endregion
export { TOAST_HISTORY_ADDON_NAME, TOAST_HISTORY_DEFAULTS, TOAST_HISTORY_LIMITS, ToastHistoryController, ToastHistoryEntry, ToastHistoryEvent, ToastHistoryOptions, createHistoryController };
//# sourceMappingURL=history.d.ts.map