import { addToastEventListener, TOAST_EVENTS } from '../events.js';
import type { ToastDismissReason, ToastId, ToastInput, ToastInstance, ToastPatch } from '../types.js';

export type ToastAnnouncementOwner = 'toast' | 'source';

export type DomToastCommand =
  | { readonly type: 'show'; readonly input: ToastInput; readonly correlationKey?: string | null }
  | { readonly type: 'update'; readonly correlationKey: string; readonly patch: ToastPatch }
  | { readonly type: 'dismiss'; readonly correlationKey: string; readonly reason?: ToastDismissReason }
  | { readonly type: 'ignore' };

export interface DomEventAdapterContext {
  readonly instance: ToastInstance;
  readonly announcementOwner: ToastAnnouncementOwner;
  getToastId(correlationKey: string): ToastId | undefined;
}

export interface DomEventBinding {
  readonly event: string;
  readonly map: (event: Event, context: DomEventAdapterContext) => DomToastCommand | null | undefined;
  readonly options?: boolean | AddEventListenerOptions;
}

export interface DomEventAdapterErrorContext {
  readonly event: Event;
  readonly eventType: string;
}

export interface DomEventAdapterOptions {
  readonly target: EventTarget;
  readonly announcementOwner: ToastAnnouncementOwner;
  readonly bindings: readonly DomEventBinding[];
  /** Dismiss adapter-tracked toasts when the adapter itself is destroyed. Defaults to false. */
  readonly dismissTrackedOnDestroy?: boolean;
  readonly onError?: (error: unknown, context: DomEventAdapterErrorContext) => void;
}

export interface DomEventAdapter {
  readonly instance: ToastInstance;
  readonly target: EventTarget;
  readonly announcementOwner: ToastAnnouncementOwner;
  readonly isDestroyed: boolean;
  getToastId(correlationKey: string): ToastId | undefined;
  destroy(): void;
}

function normalizeCorrelationKey(value: unknown, required: boolean): string | null {
  if (value == null && !required) return null;
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key) throw new TypeError('DOM event adapter correlationKey must be a non-empty string.');
  return key;
}

function validateOwner(value: unknown): ToastAnnouncementOwner {
  if (value === 'toast' || value === 'source') return value;
  throw new TypeError('DOM event adapter requires announcementOwner to be "toast" or "source".');
}

function applyShowOwnership(input: ToastInput, owner: ToastAnnouncementOwner): ToastInput {
  return owner === 'source' ? { ...input, priority: 'off' } : { ...input };
}

function applyUpdateOwnership(patch: ToastPatch, owner: ToastAnnouncementOwner): ToastPatch {
  return owner === 'source' ? { ...patch, priority: 'off' } : { ...patch };
}

export function createDomEventAdapter(
  instance: ToastInstance,
  options: DomEventAdapterOptions,
): DomEventAdapter {
  if (!instance || typeof instance.show !== 'function' || typeof instance.update !== 'function') {
    throw new TypeError('createDomEventAdapter requires an A11y Toast instance.');
  }
  const target = options?.target;
  if (!target || typeof target.addEventListener !== 'function' || typeof target.removeEventListener !== 'function') {
    throw new TypeError('DOM event adapter requires an EventTarget.');
  }
  const announcementOwner = validateOwner(options.announcementOwner);
  if (!Array.isArray(options.bindings) || options.bindings.length === 0) {
    throw new TypeError('DOM event adapter requires at least one binding.');
  }

  const bindings = options.bindings.map(binding => {
    const event = typeof binding?.event === 'string' ? binding.event.trim() : '';
    if (!event) throw new TypeError('DOM event adapter binding requires a non-empty event name.');
    if (typeof binding.map !== 'function') throw new TypeError('DOM event adapter binding requires a map function.');
    return Object.freeze({ event, map: binding.map, options: binding.options });
  });

  const correlations = new Map<string, ToastId>();
  const removers: Array<() => void> = [];
  let destroyed = false;

  const getToastId = (rawKey: string): ToastId | undefined => {
    const key = normalizeCorrelationKey(rawKey, true)!;
    const id = correlations.get(key);
    if (!id) return undefined;
    if (!instance.getToast(id)) {
      correlations.delete(key);
      return undefined;
    }
    return id;
  };

  const context: DomEventAdapterContext = Object.freeze({
    instance,
    announcementOwner,
    getToastId,
  });

  const report = (error: unknown, event: Event, eventType: string): void => {
    try { options.onError?.(error, Object.freeze({ event, eventType })); }
    catch { /* Adapter diagnostics must never break source event dispatch. */ }
  };

  const untrackId = (id: ToastId): void => {
    for (const [key, trackedId] of correlations) {
      if (trackedId === id) correlations.delete(key);
    }
  };

  const execute = (command: DomToastCommand): void => {
    if (destroyed || instance.isDestroyed || command.type === 'ignore') return;

    if (command.type === 'show') {
      const key = normalizeCorrelationKey(command.correlationKey, false);
      const input = applyShowOwnership(command.input, announcementOwner);
      if (key) {
        const existingId = getToastId(key);
        if (existingId) {
          if (instance.update(existingId, input)) return;
          correlations.delete(key);
        }
      }
      const id = instance.show(input);
      if (key && id !== null) correlations.set(key, id);
      return;
    }

    const key = normalizeCorrelationKey(command.correlationKey, true)!;
    const id = getToastId(key);
    if (!id) return;

    if (command.type === 'update') {
      if (!instance.update(id, applyUpdateOwnership(command.patch, announcementOwner))) correlations.delete(key);
      return;
    }

    instance.dismiss(id, command.reason);
    correlations.delete(key);
  };

  for (const binding of bindings) {
    const listener: EventListener = event => {
      if (destroyed || instance.isDestroyed) return;
      try {
        const command = binding.map(event, context);
        if (command == null) return;
        if (typeof command !== 'object' || !('type' in command)) {
          throw new TypeError('DOM event adapter mapper must return a valid command, null, or undefined.');
        }
        if (!['show', 'update', 'dismiss', 'ignore'].includes(command.type)) {
          throw new TypeError('DOM event adapter mapper returned an unsupported command type.');
        }
        execute(command as DomToastCommand);
      } catch (error) {
        report(error, event, binding.event);
      }
    };
    target.addEventListener(binding.event, listener, binding.options);
    removers.push(() => target.removeEventListener(binding.event, listener, binding.options));
  }

  removers.push(addToastEventListener(instance.root, TOAST_EVENTS.dismiss, event => {
    if (event.detail.instance === instance) untrackId(event.detail.toast.id);
  }));

  const adapter: DomEventAdapter = {
    instance,
    target,
    announcementOwner,
    get isDestroyed() { return destroyed; },
    getToastId,

    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      for (const remove of removers.splice(0)) remove();
      if (options.dismissTrackedOnDestroy && !instance.isDestroyed) {
        for (const id of new Set(correlations.values())) instance.dismiss(id);
      }
      correlations.clear();
    },
  };

  removers.push(addToastEventListener(instance.root, TOAST_EVENTS.destroy, event => {
    if (event.detail.instance === instance) adapter.destroy();
  }));

  return Object.freeze(adapter);
}
