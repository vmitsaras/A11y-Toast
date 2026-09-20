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
  'a11y-toast:init': ToastEventDetail;
  'a11y-toast:ready': ToastEventDetail;
  'a11y-toast:show': ToastItemEventDetail;
  'a11y-toast:queue': ToastItemEventDetail;
  'a11y-toast:update': ToastItemEventDetail;
  'a11y-toast:announce': ToastItemEventDetail & { readonly message: string; readonly priority: Exclude<ToastPriority, 'off'>; readonly transport: string; readonly fallback: boolean };
  'a11y-toast:announcement-error': ToastItemEventDetail & { readonly message: string; readonly priority: Exclude<ToastPriority, 'off'>; readonly transport: string; readonly error: unknown };
  'a11y-toast:action': ToastItemEventDetail;
  'a11y-toast:action-error': ToastItemEventDetail & { readonly error: unknown };
  'a11y-toast:pause': ToastItemEventDetail & { readonly reason: ToastPauseReason };
  'a11y-toast:resume': ToastItemEventDetail & { readonly reason: ToastPauseReason };
  'a11y-toast:dismiss': ToastItemEventDetail & { readonly reason: ToastDismissReason };
  'a11y-toast:drop': ToastItemEventDetail & { readonly reason: 'queue-full' | 'clearing' };
  'a11y-toast:animation-start': ToastItemEventDetail & { readonly phase: ToastAnimationPhase; readonly driver: string };
  'a11y-toast:animation-end': ToastItemEventDetail & { readonly phase: ToastAnimationPhase; readonly driver: string; readonly status: ToastAnimationStatus };
  'a11y-toast:animation-error': ToastItemEventDetail & { readonly phase: ToastAnimationPhase; readonly driver: string; readonly error: unknown };
  'a11y-toast:addon-error': ToastEventDetail & { readonly addon: string; readonly phase: string; readonly error: unknown };
  'a11y-toast:destroy': ToastEventDetail;
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
