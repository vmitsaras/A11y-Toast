import type { ResolvedToastOptions, ToastAction, ToastActionLayout, ToastAnimationDriver, ToastAnimationMode, ToastAnnouncementTransport, ToastInput, ToastLabels, ToastOptions, ToastPosition, ToastPriority, ToastTone } from './types.js';

export const TONES = Object.freeze(['neutral', 'info', 'success', 'warning', 'error', 'loading'] as const);
export const POSITIONS = Object.freeze(['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end'] as const);
export const PRIORITIES = Object.freeze(['off', 'polite', 'assertive'] as const);
export const ANIMATIONS = Object.freeze(['css', 'none'] as const);
export const DEFAULT_LABELS: Readonly<ToastLabels> = Object.freeze({
  region: 'Notifications', dismiss: 'Close notification', actionFailed: 'The action failed. Try again.', empty: 'No notifications.',
  tones: Object.freeze({ neutral: 'Notification', info: 'Information', success: 'Success', warning: 'Warning', error: 'Error', loading: 'In progress' }),
});
export const DEFAULT_OPTIONS: ResolvedToastOptions = Object.freeze({
  duration: 5000, maxVisible: 3, maxQueue: 10, position: 'bottom-end', priority: 'polite', animation: 'css', announcementTransport: 'live-region', showToneLabel: true, labels: DEFAULT_LABELS,
});
export function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
}
export function parseInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value.trim()))) return fallback;
  const number = typeof value === 'number' ? value : Number(value.trim());
  return Number.isSafeInteger(number) && number >= min && number <= max ? number : fallback;
}
export function duration(value: unknown, fallback: number): number {
  const parsed = parseInteger(value, fallback, 0, 86_400_000);
  return parsed === 0 ? 0 : Math.max(1000, parsed);
}
function member<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}
function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}
function label(value: unknown, fallback: string): string { return text(value) || fallback; }
function resolveAnnouncementTransport(value: unknown): ResolvedToastOptions['announcementTransport'] {
  if (value === undefined || value === 'live-region') return 'live-region';
  if (!value || typeof value !== 'object') return 'live-region';
  const transport = value as ToastAnnouncementTransport;
  const name = text(transport.name);
  if (!name) throw new TypeError('Toast announcement transport requires a non-empty name.');
  if (typeof transport.announce !== 'function') throw new TypeError('Toast announcement transport requires an announce function.');
  return Object.freeze({ name, announce: transport.announce });
}
function resolveAnimation(value: unknown): ResolvedToastOptions['animation'] {
  if (typeof value === 'string') return member<ToastAnimationMode>(value, ANIMATIONS, DEFAULT_OPTIONS.animation as ToastAnimationMode);
  if (!value || typeof value !== 'object') return DEFAULT_OPTIONS.animation;
  const driver = value as ToastAnimationDriver;
  const name = text(driver.name);
  if (!name) throw new TypeError('Toast animation driver requires a non-empty name.');
  if (driver.enter !== undefined && typeof driver.enter !== 'function') throw new TypeError('Toast animation driver enter must be a function.');
  if (driver.exit !== undefined && typeof driver.exit !== 'function') throw new TypeError('Toast animation driver exit must be a function.');
  if (!driver.enter && !driver.exit) throw new TypeError('Toast animation driver requires an enter or exit function.');
  return Object.freeze({ name, enter: driver.enter, exit: driver.exit });
}

export function resolveOptions(root: HTMLElement, options: ToastOptions): ResolvedToastOptions {
  const d = root.dataset;
  const labels = options.labels;
  const tones = Object.fromEntries(TONES.map(tone => [tone, label(labels?.tones?.[tone], DEFAULT_LABELS.tones[tone])])) as Record<ToastTone, string>;
  return Object.freeze({
    duration: duration(options.duration ?? d.a11yToastDuration, DEFAULT_OPTIONS.duration),
    maxVisible: parseInteger(options.maxVisible ?? d.a11yToastMaxVisible, DEFAULT_OPTIONS.maxVisible, 1, 8),
    maxQueue: parseInteger(options.maxQueue ?? d.a11yToastMaxQueue, DEFAULT_OPTIONS.maxQueue, 0, 100),
    position: member<ToastPosition>(options.position ?? d.a11yToastPosition, POSITIONS, DEFAULT_OPTIONS.position),
    priority: member<ToastPriority>(options.priority ?? d.a11yToastPriority, PRIORITIES, DEFAULT_OPTIONS.priority),
    animation: resolveAnimation(options.animation ?? d.a11yToastAnimation),
    announcementTransport: resolveAnnouncementTransport(options.announcementTransport),
    showToneLabel: parseBoolean(options.showToneLabel ?? d.a11yToastShowToneLabel, DEFAULT_OPTIONS.showToneLabel),
    labels: Object.freeze({
      region: label(labels?.region, DEFAULT_LABELS.region), dismiss: label(labels?.dismiss, DEFAULT_LABELS.dismiss),
      actionFailed: label(labels?.actionFailed, DEFAULT_LABELS.actionFailed), empty: label(labels?.empty, DEFAULT_LABELS.empty), tones: Object.freeze(tones),
    }),
  });
}
export interface NormalizedToast {
  message: string; title: string; tone: ToastTone; priority: ToastPriority;
  announcement: string; duration: number; persistent: boolean; dismissible: boolean;
  action: Readonly<ToastAction & { dismissOnSuccess: boolean }> | null;
  icon: HTMLElement | SVGElement | null; actionLayout: ToastActionLayout;
  origin: HTMLElement | null; key: string | null;
}
export function isHTMLElement(value: unknown, doc: Document): value is HTMLElement {
  const ctor = doc.defaultView?.HTMLElement;
  return Boolean(ctor && value instanceof ctor);
}
export function normalizeToast(input: ToastInput, options: ResolvedToastOptions, doc: Document): NormalizedToast {
  const message = text(input.message);
  if (!message) throw new TypeError('A11yToast requires a non-empty message string.');
  const title = text(input.title);
  const tone = member(input.tone, TONES, 'neutral');
  const priority = member(input.priority, PRIORITIES, options.priority);
  let action: NormalizedToast['action'] = null;
  if (input.action != null) {
    if (!text(input.action.label)) throw new TypeError('Toast action requires a non-empty label.');
    if (input.action.onClick != null && typeof input.action.onClick !== 'function') throw new TypeError('Toast action.onClick must be a function.');
    action = Object.freeze({ label: text(input.action.label), onClick: input.action.onClick, dismissOnSuccess: parseBoolean(input.action.dismissOnSuccess, false) });
  }
  const ms = duration(input.duration, options.duration);
  const hasExplicitDuration = typeof input.duration === 'number' && Number.isSafeInteger(input.duration) && input.duration > 0 && input.duration <= 86_400_000;
  const persistent = tone === 'loading' || ms === 0 || parseBoolean(input.persistent, !hasExplicitDuration && (action !== null || priority === 'assertive'));
  const phrase = [title || (tone === 'neutral' ? '' : options.labels.tones[tone]), message, action?.label].filter(Boolean).join('. ');
  return {
    message, title, tone, priority, announcement: text(input.announcement) || phrase,
    icon: input.icon ?? null, actionLayout: member(input.actionLayout, ['stacked', 'inline'], 'stacked'),
    duration: ms, persistent, dismissible: parseBoolean(input.dismissible, true), action,
    origin: isHTMLElement(input.origin, doc) ? input.origin : null, key: text(input.key) || null,
  };
}
