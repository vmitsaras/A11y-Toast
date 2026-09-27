import { C as ToastInput, D as ToastPatch, S as ToastId, b as ToastDismissReason, w as ToastInstance } from "../types-MxcqocoB.js";

//#region src/adapters/dom-events.d.ts
type ToastAnnouncementOwner = 'toast' | 'source';
type DomToastCommand = {
  readonly type: 'show';
  readonly input: ToastInput;
  readonly correlationKey?: string | null;
} | {
  readonly type: 'update';
  readonly correlationKey: string;
  readonly patch: ToastPatch;
} | {
  readonly type: 'dismiss';
  readonly correlationKey: string;
  readonly reason?: ToastDismissReason;
} | {
  readonly type: 'ignore';
};
interface DomEventAdapterContext {
  readonly instance: ToastInstance;
  readonly announcementOwner: ToastAnnouncementOwner;
  getToastId(correlationKey: string): ToastId | undefined;
}
interface DomEventBinding {
  readonly event: string;
  readonly map: (event: Event, context: DomEventAdapterContext) => DomToastCommand | null | undefined;
  readonly options?: boolean | AddEventListenerOptions;
}
interface DomEventAdapterErrorContext {
  readonly event: Event;
  readonly eventType: string;
}
interface DomEventAdapterOptions {
  readonly target: EventTarget;
  readonly announcementOwner: ToastAnnouncementOwner;
  readonly bindings: readonly DomEventBinding[];
  /** Dismiss adapter-tracked toasts when the adapter itself is destroyed. Defaults to false. */
  readonly dismissTrackedOnDestroy?: boolean;
  readonly onError?: (error: unknown, context: DomEventAdapterErrorContext) => void;
}
interface DomEventAdapter {
  readonly instance: ToastInstance;
  readonly target: EventTarget;
  readonly announcementOwner: ToastAnnouncementOwner;
  readonly isDestroyed: boolean;
  getToastId(correlationKey: string): ToastId | undefined;
  destroy(): void;
}
declare function createDomEventAdapter(instance: ToastInstance, options: DomEventAdapterOptions): DomEventAdapter;
//#endregion
export { DomEventAdapter, DomEventAdapterContext, DomEventAdapterErrorContext, DomEventAdapterOptions, DomEventBinding, DomToastCommand, ToastAnnouncementOwner, createDomEventAdapter };
//# sourceMappingURL=dom-events.d.ts.map