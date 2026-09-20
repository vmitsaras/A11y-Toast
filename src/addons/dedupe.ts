import { addToastEventListener, TOAST_EVENTS } from '../events.js';
import type { ToastId, ToastInput, ToastInstance, ToastSnapshot } from '../types.js';

export type ToastDedupePolicy = 'update-existing' | 'drop-new' | 'replace-existing';
export type ToastDedupeStatus = 'shown' | 'updated' | 'kept-existing' | 'replaced' | 'rejected' | 'stopped';

export interface ToastDedupeOptions {
  /** Default policy. Defaults to update-existing. */
  policy?: ToastDedupePolicy;
}

export interface ToastDedupeResult {
  readonly id: ToastId | null;
  readonly previousId: ToastId | null;
  readonly status: ToastDedupeStatus;
}

export interface ToastDedupeController {
  readonly instance: ToastInstance;
  readonly policy: ToastDedupePolicy;
  readonly isDestroyed: boolean;
  show(input: ToastInput, policy?: ToastDedupePolicy): Promise<ToastDedupeResult>;
  destroy(): void;
}

const POLICIES = Object.freeze(['update-existing', 'drop-new', 'replace-existing'] as const);

function resolvePolicy(value: unknown, fallback: ToastDedupePolicy): ToastDedupePolicy {
  if (value === undefined) return fallback;
  if (typeof value === 'string' && POLICIES.includes(value as ToastDedupePolicy)) return value as ToastDedupePolicy;
  throw new TypeError('Toast deduplication policy must be update-existing, drop-new, or replace-existing.');
}

function normalizeKey(input: ToastInput): string {
  const key = typeof input?.key === 'string' ? input.key.trim() : '';
  if (!key) throw new TypeError('Key-based toast deduplication requires a non-empty key.');
  return key;
}

function firstMatch(instance: ToastInstance, key: string): ToastSnapshot | undefined {
  return instance.getToasts().find(toast => toast.key === key);
}

function waitForExit(instance: ToastInstance, id: ToastId): { dismiss(): Promise<boolean> } {
  let started = false;
  let ended = false;
  let resolveEnd: (() => void) | null = null;
  const end = new Promise<void>(resolve => { resolveEnd = resolve; });

  const offStart = addToastEventListener(instance.root, TOAST_EVENTS.animationStart, event => {
    if (event.detail.instance !== instance || event.detail.toast.id !== id || event.detail.phase !== 'exit') return;
    started = true;
  });
  const offEnd = addToastEventListener(instance.root, TOAST_EVENTS.animationEnd, event => {
    if (event.detail.instance !== instance || event.detail.toast.id !== id || event.detail.phase !== 'exit') return;
    ended = true;
    resolveEnd?.();
  });
  const cleanup = (): void => {
    offStart();
    offEnd();
  };

  return {
    async dismiss(): Promise<boolean> {
      const dismissed = instance.dismiss(id);
      if (!dismissed) {
        cleanup();
        return false;
      }
      if (started && !ended) await end;
      cleanup();
      return true;
    },
  };
}

export function createDedupeController(
  instance: ToastInstance,
  options: ToastDedupeOptions = {},
): ToastDedupeController {
  if (!instance || typeof instance.show !== 'function' || typeof instance.getToasts !== 'function') {
    throw new TypeError('createDedupeController requires an A11y Toast instance.');
  }

  const defaultPolicy = resolvePolicy(options.policy, 'update-existing');
  const tails = new Map<string, Promise<void>>();
  let destroyed = false;

  const serialize = <T>(key: string, work: () => Promise<T>): Promise<T> => {
    const previous = tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const tail = previous.catch(() => {}).then(() => gate);
    tails.set(key, tail);

    return previous.catch(() => {}).then(work).finally(() => {
      release();
      if (tails.get(key) === tail) tails.delete(key);
    });
  };

  const controller: ToastDedupeController = {
    instance,
    policy: defaultPolicy,
    get isDestroyed() { return destroyed; },

    show(input: ToastInput, policy?: ToastDedupePolicy): Promise<ToastDedupeResult> {
      const key = normalizeKey(input);
      const selectedPolicy = resolvePolicy(policy, defaultPolicy);
      const normalizedInput = { ...input, key };

      return serialize(key, async () => {
        if (destroyed || instance.isDestroyed) {
          return Object.freeze({ id: null, previousId: null, status: 'stopped' as const });
        }

        const existing = firstMatch(instance, key);
        if (!existing) {
          const id = instance.show(normalizedInput);
          return Object.freeze({
            id,
            previousId: null,
            status: id === null ? 'rejected' as const : 'shown' as const,
          });
        }

        if (selectedPolicy === 'drop-new') {
          return Object.freeze({ id: existing.id, previousId: existing.id, status: 'kept-existing' as const });
        }

        if (selectedPolicy === 'update-existing') {
          const updated = instance.update(existing.id, normalizedInput);
          if (updated) return Object.freeze({ id: existing.id, previousId: existing.id, status: 'updated' as const });
          if (destroyed || instance.isDestroyed) {
            return Object.freeze({ id: null, previousId: existing.id, status: 'stopped' as const });
          }
          const id = instance.show(normalizedInput);
          return Object.freeze({
            id,
            previousId: existing.id,
            status: id === null ? 'rejected' as const : 'shown' as const,
          });
        }

        const exit = waitForExit(instance, existing.id);
        await exit.dismiss();

        if (destroyed || instance.isDestroyed) {
          return Object.freeze({ id: null, previousId: existing.id, status: 'stopped' as const });
        }

        // External dismissal observers may create the same key while the old visual exit
        // is settling. Adopt that record instead of introducing another duplicate.
        const concurrent = firstMatch(instance, key);
        if (concurrent) {
          const updated = instance.update(concurrent.id, normalizedInput);
          return Object.freeze({
            id: updated ? concurrent.id : null,
            previousId: existing.id,
            status: updated ? 'updated' as const : 'rejected' as const,
          });
        }

        const id = instance.show(normalizedInput);
        return Object.freeze({
          id,
          previousId: existing.id,
          status: id === null ? 'rejected' as const : 'replaced' as const,
        });
      });
    },

    destroy(): void {
      destroyed = true;
    },
  };

  return Object.freeze(controller);
}
