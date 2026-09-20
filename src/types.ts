import type { ToastEventMap, ToastEventName, ToastCustomEvent } from './events.js';

export type ToastId = string;
export type ToastTone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'loading';
export type ToastPriority = 'off' | 'polite' | 'assertive';
export type ToastPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end';
export type ToastState = 'queued' | 'visible' | 'dismissed' | 'dropped';
export type ToastPauseReason = 'hover' | 'focus' | 'document-hidden' | 'api' | 'action';
export type ToastDismissReason = 'api' | 'timeout' | 'close-button' | 'action' | 'clear';
export type ToastCleanup = () => void;

export interface ToastActionContext {
  readonly instance: ToastInstance;
  readonly id: ToastId;
  readonly toast: ToastSnapshot;
  /** Aborted on dismissal, action replacement, or instance destruction. */
  readonly signal: AbortSignal;
}
export interface ToastAction {
  label: string;
  onClick?: (context: ToastActionContext) => void | Promise<void>;
  /** Defaults to false. Event-only actions must be dismissed explicitly. */
  dismissOnSuccess?: boolean;
}
export interface ToastInput {
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
export type ToastPatch = Partial<ToastInput>;
export type ToastShorthandOptions = Omit<ToastInput, 'message' | 'tone'>;
export interface ToastLabels {
  region: string;
  dismiss: string;
  actionFailed: string;
  empty: string;
  tones: Readonly<Record<ToastTone, string>>;
}
export interface ToastOptions {
  duration?: number;
  maxVisible?: number;
  maxQueue?: number;
  position?: ToastPosition;
  priority?: ToastPriority;
  labels?: Partial<Omit<ToastLabels, 'tones'>> & { tones?: Partial<Record<ToastTone, string>> };
  addons?: readonly ToastAddon[];
}
export interface ResolvedToastOptions {
  readonly duration: number;
  readonly maxVisible: number;
  readonly maxQueue: number;
  readonly position: ToastPosition;
  readonly priority: ToastPriority;
  readonly labels: Readonly<ToastLabels>;
}
export interface ToastSnapshot {
  readonly id: ToastId;
  readonly key: string | null;
  readonly title: string;
  readonly message: string;
  readonly tone: ToastTone;
  readonly priority: ToastPriority;
  readonly announcement: string;
  readonly state: ToastState;
  readonly duration: number;
  readonly persistent: boolean;
  readonly dismissible: boolean;
  readonly remaining: number | null;
  readonly pauseReasons: readonly ToastPauseReason[];
  readonly action: Readonly<{ label: string; dismissOnSuccess: boolean }> | null;
  readonly actionPending: boolean;
  readonly actionError: string | null;
}
export interface ToastInstance {
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
export interface ToastAddonContext {
  readonly instance: ToastInstance;
  readonly root: HTMLElement;
  readonly signal: AbortSignal;
  /** Subscriptions are automatically removed on unregister/destroy; exceptions are isolated. */
  on<K extends ToastEventName>(type: K, listener: (event: ToastCustomEvent<K>) => void): ToastCleanup;
}
export interface ToastAddonHookContext extends ToastAddonContext {
  readonly toast: ToastSnapshot;
}
export interface ToastAddon {
  readonly name: string;
  setup?: (context: ToastAddonContext) => void | ToastCleanup;
  beforeShow?: (context: ToastAddonHookContext) => void;
  afterShow?: (context: ToastAddonHookContext) => void;
  beforeUpdate?: (context: ToastAddonHookContext) => void;
  afterUpdate?: (context: ToastAddonHookContext) => void;
  beforeDismiss?: (context: ToastAddonHookContext) => void;
  afterDismiss?: (context: ToastAddonHookContext) => void;
}
export type ToastEventListener<K extends ToastEventName> = (event: CustomEvent<ToastEventMap[K]>) => void;
