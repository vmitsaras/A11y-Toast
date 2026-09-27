import type { ToastAnimationPhase, ToastAnimationStatus, ToastDismissReason, ToastInstance, ToastPauseReason, ToastPriority, ToastSnapshot } from './types.js';

export const TOAST_EVENTS = Object.freeze({
  init: 'a11y-toast:init', ready: 'a11y-toast:ready',
  show: 'a11y-toast:show', queue: 'a11y-toast:queue', update: 'a11y-toast:update',
  announce: 'a11y-toast:announce', announcementError: 'a11y-toast:announcement-error', action: 'a11y-toast:action',
  actionError: 'a11y-toast:action-error', pause: 'a11y-toast:pause', resume: 'a11y-toast:resume',
  dismiss: 'a11y-toast:dismiss', drop: 'a11y-toast:drop',
  animationStart: 'a11y-toast:animation-start', animationEnd: 'a11y-toast:animation-end',
  animationError: 'a11y-toast:animation-error',
  addonError: 'a11y-toast:addon-error', destroy: 'a11y-toast:destroy',
} as const);
export interface ToastEventDetail {
  readonly instance: ToastInstance;
  readonly root: HTMLElement;
  readonly instanceId: string;
  readonly timestamp: number;
  readonly visibleCount: number;
  readonly queuedCount: number;
}
export interface ToastItemEventDetail extends ToastEventDetail { readonly toast: ToastSnapshot; }
export interface ToastEventMap {
  [TOAST_EVENTS.init]: ToastEventDetail;
  [TOAST_EVENTS.ready]: ToastEventDetail;
  [TOAST_EVENTS.show]: ToastItemEventDetail;
  [TOAST_EVENTS.queue]: ToastItemEventDetail;
  [TOAST_EVENTS.update]: ToastItemEventDetail;
  [TOAST_EVENTS.announce]: ToastItemEventDetail & { readonly message: string; readonly priority: Exclude<ToastPriority, 'off'>; readonly transport: string; readonly fallback: boolean };
  [TOAST_EVENTS.announcementError]: ToastItemEventDetail & { readonly message: string; readonly priority: Exclude<ToastPriority, 'off'>; readonly transport: string; readonly error: unknown };
  [TOAST_EVENTS.action]: ToastItemEventDetail;
  [TOAST_EVENTS.actionError]: ToastItemEventDetail & { readonly error: unknown };
  [TOAST_EVENTS.pause]: ToastItemEventDetail & { readonly reason: ToastPauseReason };
  [TOAST_EVENTS.resume]: ToastItemEventDetail & { readonly reason: ToastPauseReason };
  [TOAST_EVENTS.dismiss]: ToastItemEventDetail & { readonly reason: ToastDismissReason };
  [TOAST_EVENTS.drop]: ToastItemEventDetail & { readonly reason: 'queue-full' | 'clearing' };
  [TOAST_EVENTS.animationStart]: ToastItemEventDetail & { readonly phase: ToastAnimationPhase; readonly driver: string };
  [TOAST_EVENTS.animationEnd]: ToastItemEventDetail & { readonly phase: ToastAnimationPhase; readonly driver: string; readonly status: ToastAnimationStatus };
  [TOAST_EVENTS.animationError]: ToastItemEventDetail & { readonly phase: ToastAnimationPhase; readonly driver: string; readonly error: unknown };
  [TOAST_EVENTS.addonError]: ToastEventDetail & { readonly addon: string; readonly phase: string; readonly error: unknown };
  [TOAST_EVENTS.destroy]: ToastEventDetail;
}
export type ToastEventName = keyof ToastEventMap;
export type ToastCustomEvent<K extends ToastEventName = ToastEventName> = CustomEvent<ToastEventMap[K]>;
/** No global HTMLElementEventMap augmentation: each consumer opts into the typed helper. */
export function addToastEventListener<K extends ToastEventName>(
  target: EventTarget, type: K, listener: (event: ToastCustomEvent<K>) => void,
  options?: boolean | AddEventListenerOptions,
): () => void {
  const wrapped: EventListener = (event) => listener(event as ToastCustomEvent<K>);
  target.addEventListener(type, wrapped, options);
  return () => target.removeEventListener(type, wrapped, options);
}
