import { TOAST_EVENTS } from '../events.js';
import type {
  ToastAddon, ToastAddonContext, ToastDismissReason, ToastInstance, ToastSnapshot,
} from '../types.js';

export const TOAST_HISTORY_ADDON_NAME = 'history';
export const TOAST_HISTORY_DEFAULTS = Object.freeze({ maxEntries: 50 });
export const TOAST_HISTORY_LIMITS = Object.freeze({ minEntries: 1, maxEntries: 1000 });

export type ToastHistoryEvent = 'show' | 'update' | 'dismiss';
export interface ToastHistoryOptions {
  /** Maximum lifecycle entries, not distinct toast IDs. Integer from 1 to 1000; defaults to 50. */
  maxEntries?: number;
}
export interface ToastHistoryEntry {
  /** Controller-local observation order. Clear does not reuse sequence numbers. */
  readonly sequence: number;
  readonly type: ToastHistoryEvent;
  /** Original lifecycle timestamp (Unix milliseconds); not proof of speech or action delivery. */
  readonly timestamp: number;
  readonly toast: ToastSnapshot;
  readonly reason: ToastDismissReason | null;
}
export interface ToastHistoryController {
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

function resolveMaxEntries(value: unknown): number {
  if (value === undefined) return TOAST_HISTORY_DEFAULTS.maxEntries;
  if (typeof value !== 'number' || !Number.isInteger(value)
    || value < TOAST_HISTORY_LIMITS.minEntries || value > TOAST_HISTORY_LIMITS.maxEntries) {
    throw new TypeError('Toast history maxEntries must be an integer from 1 to 1000.');
  }
  return value;
}

// Deliberately enumerate plain data. Never retain an event detail (instance/root),
// input/action callback, origin, AbortSignal, or a future extra snapshot property.
function copySnapshot(toast: ToastSnapshot): ToastSnapshot {
  return Object.freeze({
    id: toast.id, key: toast.key, title: toast.title, message: toast.message,
    tone: toast.tone, priority: toast.priority, announcement: toast.announcement,
    state: toast.state, animationPhase: toast.animationPhase,
    duration: toast.duration, persistent: toast.persistent, dismissible: toast.dismissible,
    remaining: toast.remaining, pauseReasons: Object.freeze([...toast.pauseReasons]),
    action: toast.action ? Object.freeze({
      label: toast.action.label, dismissOnSuccess: toast.action.dismissOnSuccess,
    }) : null,
    actionLayout: toast.actionLayout, actionPending: toast.actionPending, actionError: toast.actionError,
  });
}

/**
 * Observe future show/update/dismiss events on one manager. No backfill, queue/drop
 * logging, persistence, rendering, subscriptions, replay, or polling is introduced.
 * One history controller per manager; destroy it before attaching a replacement.
 */
export function createHistoryController(
  instance: ToastInstance,
  options: ToastHistoryOptions = {},
): ToastHistoryController {
  if (!instance || typeof instance.registerAddon !== 'function'
    || typeof instance.unregisterAddon !== 'function' || typeof instance.getAddon !== 'function') {
    throw new TypeError('createHistoryController requires an A11y Toast instance.');
  }
  if (instance.isDestroyed) throw new Error('Cannot attach toast history to a destroyed instance.');
  if (!options || typeof options !== 'object') throw new TypeError('Toast history options must be an object.');
  const maxEntries = resolveMaxEntries(options.maxEntries);
  if (instance.getAddon(TOAST_HISTORY_ADDON_NAME)) {
    throw new Error('Toast history is already registered. Destroy the existing history controller first.');
  }

  // A ring makes each append/eviction O(1); no growing ID map or event journal.
  const buffer: (ToastHistoryEntry | undefined)[] = new Array(maxEntries);
  let head = 0;
  let count = 0;
  let sequence = 0;
  let destroyed = false;
  let owner: ToastInstance | null = instance;

  const clear = (): number => {
    const removed = count;
    buffer.fill(undefined);
    head = 0;
    count = 0;
    return removed;
  };
  const release = (): void => {
    destroyed = true;
    owner = null;
    clear();
  };
  const append = (type: ToastHistoryEvent, toast: ToastSnapshot, timestamp: number,
    reason: ToastDismissReason | null = null): void => {
    if (destroyed || !owner || owner.isDestroyed) return;
    const entry = Object.freeze({ sequence: ++sequence, type, timestamp, toast: copySnapshot(toast), reason });
    buffer[(head + count) % maxEntries] = entry;
    if (count === maxEntries) head = (head + 1) % maxEntries;
    else count++;
  };
  const setup = (context: ToastAddonContext): (() => void) => {
    if (context.signal.aborted || context.instance.isDestroyed) {
      release();
      return release;
    }
    // Abort is guaranteed by the core even when a consumer stops DOM event propagation.
    context.signal.addEventListener('abort', release, { once: true });
    context.on(TOAST_EVENTS.show, ({ detail }) => append('show', detail.toast, detail.timestamp));
    context.on(TOAST_EVENTS.update, ({ detail }) => append('update', detail.toast, detail.timestamp));
    context.on(TOAST_EVENTS.dismiss, ({ detail }) => append('dismiss', detail.toast, detail.timestamp, detail.reason));
    // Clear at the destroy event as well as the unconditional unregister/abort boundary.
    context.on(TOAST_EVENTS.destroy, release);
    return () => {
      context.signal.removeEventListener('abort', release);
      release();
    };
  };
  const addon: ToastAddon = Object.freeze({ name: TOAST_HISTORY_ADDON_NAME, setup });
  try {
    instance.registerAddon(addon);
    // Core isolates setup errors. Never return a deceptively active, unregistered controller.
    if (destroyed || instance.isDestroyed || instance.getAddon(addon.name)?.setup !== setup) {
      throw new Error('Toast history could not attach its lifecycle observer.');
    }
  } catch (error) {
    if (instance.getAddon(addon.name)?.setup === setup) instance.unregisterAddon(addon.name);
    release();
    throw error;
  }

  return Object.freeze({
    maxEntries,
    get size() { return count; },
    get isDestroyed() { return destroyed; },
    getEntries(): readonly ToastHistoryEntry[] {
      const entries: ToastHistoryEntry[] = [];
      for (let offset = 0; offset < count; offset++) {
        const entry = buffer[(head + offset) % maxEntries];
        if (entry) entries.push(entry);
      }
      return Object.freeze(entries);
    },
    clear,
    destroy(): void {
      if (destroyed) return;
      const current = owner;
      release();
      // Never remove a different add-on registered later under the same name.
      if (current?.getAddon(addon.name)?.setup === setup) current.unregisterAddon(addon.name);
    },
  });
}
