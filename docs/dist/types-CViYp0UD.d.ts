//#region src/events.d.ts
declare const TOAST_EVENTS: Readonly<{
  readonly init: "a11y-toast:init";
  readonly ready: "a11y-toast:ready";
  readonly show: "a11y-toast:show";
  readonly queue: "a11y-toast:queue";
  readonly update: "a11y-toast:update";
  readonly announce: "a11y-toast:announce";
  readonly announcementError: "a11y-toast:announcement-error";
  readonly action: "a11y-toast:action";
  readonly actionError: "a11y-toast:action-error";
  readonly pause: "a11y-toast:pause";
  readonly resume: "a11y-toast:resume";
  readonly dismiss: "a11y-toast:dismiss";
  readonly drop: "a11y-toast:drop";
  readonly animationStart: "a11y-toast:animation-start";
  readonly animationEnd: "a11y-toast:animation-end";
  readonly animationError: "a11y-toast:animation-error";
  readonly addonError: "a11y-toast:addon-error";
  readonly destroy: "a11y-toast:destroy";
}>;
interface ToastEventDetail {
  readonly instance: ToastInstance;
  readonly root: HTMLElement;
  readonly instanceId: string;
  readonly timestamp: number;
  readonly visibleCount: number;
  readonly queuedCount: number;
}
interface ToastItemEventDetail extends ToastEventDetail {
  readonly toast: ToastSnapshot;
}
interface ToastEventMap {
  'a11y-toast:init': ToastEventDetail;
  'a11y-toast:ready': ToastEventDetail;
  'a11y-toast:show': ToastItemEventDetail;
  'a11y-toast:queue': ToastItemEventDetail;
  'a11y-toast:update': ToastItemEventDetail;
  'a11y-toast:announce': ToastItemEventDetail & {
    readonly message: string;
    readonly priority: Exclude<ToastPriority, 'off'>;
    readonly transport: string;
    readonly fallback: boolean;
  };
  'a11y-toast:announcement-error': ToastItemEventDetail & {
    readonly message: string;
    readonly priority: Exclude<ToastPriority, 'off'>;
    readonly transport: string;
    readonly error: unknown;
  };
  'a11y-toast:action': ToastItemEventDetail;
  'a11y-toast:action-error': ToastItemEventDetail & {
    readonly error: unknown;
  };
  'a11y-toast:pause': ToastItemEventDetail & {
    readonly reason: ToastPauseReason;
  };
  'a11y-toast:resume': ToastItemEventDetail & {
    readonly reason: ToastPauseReason;
  };
  'a11y-toast:dismiss': ToastItemEventDetail & {
    readonly reason: ToastDismissReason;
  };
  'a11y-toast:drop': ToastItemEventDetail & {
    readonly reason: 'queue-full' | 'clearing';
  };
  'a11y-toast:animation-start': ToastItemEventDetail & {
    readonly phase: ToastAnimationPhase;
    readonly driver: string;
  };
  'a11y-toast:animation-end': ToastItemEventDetail & {
    readonly phase: ToastAnimationPhase;
    readonly driver: string;
    readonly status: ToastAnimationStatus;
  };
  'a11y-toast:animation-error': ToastItemEventDetail & {
    readonly phase: ToastAnimationPhase;
    readonly driver: string;
    readonly error: unknown;
  };
  'a11y-toast:addon-error': ToastEventDetail & {
    readonly addon: string;
    readonly phase: string;
    readonly error: unknown;
  };
  'a11y-toast:destroy': ToastEventDetail;
}
type ToastEventName = keyof ToastEventMap;
type ToastCustomEvent<K extends ToastEventName = ToastEventName> = CustomEvent<ToastEventMap[K]>;
/** No global HTMLElementEventMap augmentation: each consumer opts into the typed helper. */
declare function addToastEventListener<K extends ToastEventName>(target: EventTarget, type: K, listener: (event: ToastCustomEvent<K>) => void, options?: boolean | AddEventListenerOptions): () => void;
//#endregion
//#region src/types.d.ts
type ToastId = string;
type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'loading';
type ToastPriority = 'off' | 'polite' | 'assertive';
type ToastPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
type ToastState = 'queued' | 'visible' | 'dismissed' | 'dropped';
type ToastPauseReason = 'hover' | 'focus' | 'document-hidden' | 'api' | 'action';
type ToastDismissReason = 'api' | 'timeout' | 'close-button' | 'action' | 'clear';
type ToastAnimationPhase = 'enter' | 'exit';
type ToastAnimationStatus = 'completed' | 'cancelled' | 'failed';
type ToastAnimationMode = 'css' | 'none';
type ToastAnnouncementPriority = Exclude<ToastPriority, 'off'>;
type ToastCleanup = () => void;
interface ToastAnnouncementTransportContext {
  readonly message: string;
  readonly priority: ToastAnnouncementPriority;
  readonly liveRegion: HTMLElement;
}
interface ToastAnnouncementTransportResult {
  readonly transport: string;
  readonly fallback: boolean;
}
interface ToastAnnouncementTransport {
  readonly name: string;
  announce(context: ToastAnnouncementTransportContext): void | ToastAnnouncementTransportResult;
}
type ToastAnnouncementTransportOption = 'live-region' | ToastAnnouncementTransport;
interface ToastAnimationContext {
  readonly instance: ToastInstance;
  readonly root: HTMLElement;
  readonly element: HTMLElement;
  readonly toast: ToastSnapshot;
  readonly phase: ToastAnimationPhase;
  readonly signal: AbortSignal;
}
interface ToastAnimationDriver {
  readonly name: string;
  enter?: (context: ToastAnimationContext) => void | Promise<void>;
  exit?: (context: ToastAnimationContext) => void | Promise<void>;
}
type ToastAnimationOption = ToastAnimationMode | ToastAnimationDriver;
interface ToastActionContext {
  readonly instance: ToastInstance;
  readonly id: ToastId;
  readonly toast: ToastSnapshot;
  /** Aborted on dismissal, action replacement, or instance destruction. */
  readonly signal: AbortSignal;
}
interface ToastAction {
  label: string;
  onClick?: (context: ToastActionContext) => void | Promise<void>;
  /** Defaults to false. Event-only actions must be dismissed explicitly. */
  dismissOnSuccess?: boolean;
}
interface ToastInput {
  message: string;
  title?: string | null;
  tone?: ToastTone;
  priority?: ToastPriority;
  /** Defaults to a plain-text description of the visible notification. */
  announcement?: string | null;
  /** Milliseconds. 0 means persistent; positive values are clamped to 1,000–86,400,000. */
  duration?: number;
  persistent?: boolean;
  dismissible?: boolean;
  action?: ToastAction | null;
  origin?: HTMLElement | null;
  /** Opaque caller correlation key. No implicit deduplication. */
  key?: string | null;
}
type ToastPatch = Partial<ToastInput>;
type ToastShorthandOptions = Omit<ToastInput, 'message' | 'tone'>;
interface ToastLabels {
  region: string;
  dismiss: string;
  actionFailed: string;
  empty: string;
  tones: Readonly<Record<ToastTone, string>>;
}
interface ToastOptions {
  duration?: number;
  maxVisible?: number;
  maxQueue?: number;
  position?: ToastPosition;
  priority?: ToastPriority;
  /** Built-in CSS, no motion, or an injected engine-neutral animation driver. Defaults to css. */
  animation?: ToastAnimationOption;
  /** Live regions by default, or an explicit announcement transport driver. */
  announcementTransport?: ToastAnnouncementTransportOption;
  /** Controls whether the tone label is visually displayed. The text stays available to assistive technology and live announcements. Defaults to true. */
  showToneLabel?: boolean;
  labels?: Partial<Omit<ToastLabels, 'tones'>> & {
    tones?: Partial<Record<ToastTone, string>>;
  };
  addons?: readonly ToastAddon[];
}
interface ResolvedToastOptions {
  readonly duration: number;
  readonly maxVisible: number;
  readonly maxQueue: number;
  readonly position: ToastPosition;
  readonly priority: ToastPriority;
  readonly animation: ToastAnimationMode | Readonly<ToastAnimationDriver>;
  readonly announcementTransport: 'live-region' | Readonly<ToastAnnouncementTransport>;
  readonly showToneLabel: boolean;
  readonly labels: Readonly<ToastLabels>;
}
interface ToastSnapshot {
  readonly id: ToastId;
  readonly key: string | null;
  readonly title: string;
  readonly message: string;
  readonly tone: ToastTone;
  readonly priority: ToastPriority;
  readonly announcement: string;
  readonly state: ToastState;
  readonly animationPhase: ToastAnimationPhase | null;
  readonly duration: number;
  readonly persistent: boolean;
  readonly dismissible: boolean;
  readonly remaining: number | null;
  readonly pauseReasons: readonly ToastPauseReason[];
  readonly action: Readonly<{
    label: string;
    dismissOnSuccess: boolean;
  }> | null;
  readonly actionPending: boolean;
  readonly actionError: string | null;
}
interface ToastInstance {
  readonly root: HTMLElement;
  readonly instanceId: string;
  readonly options: ResolvedToastOptions;
  readonly isDestroyed: boolean;
  readonly visibleCount: number;
  readonly queuedCount: number;
  show(input: ToastInput): ToastId | null;
  info(message: string, options?: ToastShorthandOptions): ToastId | null;
  success(message: string, options?: ToastShorthandOptions): ToastId | null;
  warning(message: string, options?: ToastShorthandOptions): ToastId | null;
  error(message: string, options?: ToastShorthandOptions): ToastId | null;
  loading(message: string, options?: ToastShorthandOptions): ToastId | null;
  update(id: ToastId, patch: ToastPatch): boolean;
  dismiss(id: ToastId, reason?: ToastDismissReason): boolean;
  dismissAll(reason?: ToastDismissReason): number;
  /** Only manages the caller-owned `api` pause, never clears focus/hover/visibility safeguards. */
  pause(id: ToastId): boolean;
  resume(id: ToastId): boolean;
  getToast(id: ToastId): ToastSnapshot | undefined;
  getToasts(): readonly ToastSnapshot[];
  registerAddon(addon: ToastAddon): void;
  unregisterAddon(name: string): boolean;
  getAddon(name: string): ToastAddon | undefined;
  getAddons(): readonly ToastAddon[];
  destroy(): void;
}
interface ToastAddonContext {
  readonly instance: ToastInstance;
  readonly root: HTMLElement;
  readonly signal: AbortSignal;
  /** Subscriptions are automatically removed on unregister/destroy; exceptions are isolated. */
  on<K extends ToastEventName>(type: K, listener: (event: ToastCustomEvent<K>) => void): ToastCleanup;
}
interface ToastAddonHookContext extends ToastAddonContext {
  readonly toast: ToastSnapshot;
}
interface ToastAddon {
  readonly name: string;
  setup?: (context: ToastAddonContext) => void | ToastCleanup;
  beforeShow?: (context: ToastAddonHookContext) => void;
  afterShow?: (context: ToastAddonHookContext) => void;
  beforeUpdate?: (context: ToastAddonHookContext) => void;
  afterUpdate?: (context: ToastAddonHookContext) => void;
  beforeDismiss?: (context: ToastAddonHookContext) => void;
  afterDismiss?: (context: ToastAddonHookContext) => void;
}
type ToastEventListener<K extends ToastEventName> = (event: CustomEvent<ToastEventMap[K]>) => void;
//#endregion
export { ToastShorthandOptions as A, addToastEventListener as B, ToastInstance as C, ToastPauseReason as D, ToastPatch as E, ToastCustomEvent as F, ToastEventDetail as I, ToastEventMap as L, ToastState as M, ToastTone as N, ToastPosition as O, TOAST_EVENTS as P, ToastEventName as R, ToastInput as S, ToastOptions as T, ToastAnnouncementTransportResult as _, ToastAddonContext as a, ToastEventListener as b, ToastAnimationDriver as c, ToastAnimationPhase as d, ToastAnimationStatus as f, ToastAnnouncementTransportOption as g, ToastAnnouncementTransportContext as h, ToastAddon as i, ToastSnapshot as j, ToastPriority as k, ToastAnimationMode as l, ToastAnnouncementTransport as m, ToastAction as n, ToastAddonHookContext as o, ToastAnnouncementPriority as p, ToastActionContext as r, ToastAnimationContext as s, ResolvedToastOptions as t, ToastAnimationOption as u, ToastCleanup as v, ToastLabels as w, ToastId as x, ToastDismissReason as y, ToastItemEventDetail as z };
//# sourceMappingURL=types-CViYp0UD.d.ts.map