import { addToastEventListener, TOAST_EVENTS } from '../events.js';
import type { ToastId, ToastInput, ToastInstance, ToastPatch } from '../types.js';

export type ToastPromiseLoadingState = string | Omit<ToastInput, 'tone' | 'persistent' | 'duration'>;
export type ToastPromiseOutcomeState = string | ToastInput;

export interface ToastPromiseStates {
  loading: ToastPromiseLoadingState;
  success: ToastPromiseOutcomeState;
  /** Required caller-authored user-facing copy. Rejection values are never rendered automatically. */
  error: ToastPromiseOutcomeState;
}

export interface ToastPromiseHandle<T> {
  readonly id: ToastId | null;
  readonly promise: Promise<T>;
  /** Stop toast orchestration only. The underlying promise/operation is not cancelled. */
  stop(): boolean;
}

function messageOf(state: ToastPromiseLoadingState | ToastPromiseOutcomeState, label: string): string {
  const message = typeof state === 'string' ? state.trim() : typeof state?.message === 'string' ? state.message.trim() : '';
  if (!message) throw new TypeError(`Toast promise ${label} state requires a non-empty message.`);
  return message;
}

function loadingInput(state: ToastPromiseLoadingState): ToastInput {
  if (typeof state === 'string') return { message: state.trim(), tone: 'loading' };
  return { ...state, message: state.message.trim(), tone: 'loading' };
}

function outcomePatch(state: ToastPromiseOutcomeState, tone: 'success' | 'error'): ToastPatch {
  if (typeof state === 'string') return { message: state.trim(), tone };
  return { ...state, message: state.message.trim(), tone: state.tone ?? tone };
}

export function trackToastPromise<T>(
  instance: ToastInstance,
  operation: PromiseLike<T>,
  states: ToastPromiseStates,
): ToastPromiseHandle<T> {
  if (!instance || typeof instance.show !== 'function' || typeof instance.update !== 'function') {
    throw new TypeError('trackToastPromise requires an A11y Toast instance.');
  }
  if (!states || typeof states !== 'object') throw new TypeError('trackToastPromise requires loading, success, and error states.');
  messageOf(states.loading, 'loading');
  messageOf(states.success, 'success');
  messageOf(states.error, 'error');

  const promise = Promise.resolve(operation);
  const id = instance.show(loadingInput(states.loading));
  let active = id !== null && !instance.isDestroyed && Boolean(instance.getToast(id));
  let removeDismiss: (() => void) | null = null;
  let removeDestroy: (() => void) | null = null;

  const stop = (): boolean => {
    if (!active) return false;
    active = false;
    removeDismiss?.();
    removeDestroy?.();
    removeDismiss = null;
    removeDestroy = null;
    return true;
  };

  if (active) {
    removeDismiss = addToastEventListener(instance.root, TOAST_EVENTS.dismiss, event => {
      if (event.detail.instance === instance && event.detail.toast.id === id) stop();
    });
    removeDestroy = addToastEventListener(instance.root, TOAST_EVENTS.destroy, event => {
      if (event.detail.instance === instance) stop();
    });
  }

  const settle = (state: ToastPromiseOutcomeState, tone: 'success' | 'error'): void => {
    if (!active || id === null || instance.isDestroyed || !instance.getToast(id)) {
      stop();
      return;
    }
    try {
      const updated = instance.update(id, outcomePatch(state, tone));
      if (!updated) stop();
      else stop();
    } catch {
      // Invalid/disconnected application state must not create an unhandled promise chain
      // or expose the operation's rejection value. Core/application state remains authoritative.
      stop();
    }
  };

  void promise.then(
    () => settle(states.success, 'success'),
    () => settle(states.error, 'error'),
  );

  return Object.freeze({ id, promise, stop });
}
