import { LiveAnnouncer } from './LiveAnnouncer.js';
import { addToastEventListener, TOAST_EVENTS } from './events.js';
import type { ToastEventMap, ToastEventName } from './events.js';
import { isHTMLElement, normalizeToast, resolveOptions } from './options.js';
import type { NormalizedToast } from './options.js';
import type {
  ResolvedToastOptions, ToastAddon, ToastAddonContext, ToastAddonHookContext,
  ToastCleanup, ToastDismissReason, ToastId, ToastInput, ToastInstance,
  ToastOptions, ToastPatch, ToastPauseReason, ToastShorthandOptions, ToastSnapshot, ToastState,
} from './types.js';

const SELECTORS = Object.freeze({
  root: '[data-a11y-toast]', item: '[data-a11y-toast-id]',
  action: '[data-a11y-toast-action]', dismiss: '[data-a11y-toast-dismiss]',
  liveAncestor: '[role="alert"], [role="status"], [role="log"], [aria-live="polite"], [aria-live="assertive"]',
});
const CLASSES = Object.freeze({
  host: 'a11y-toast-region', viewport: 'a11y-toast-region__viewport', list: 'a11y-toast-region__list',
  empty: 'a11y-toast-region__empty', live: 'a11y-toast-region__announcer', item: 'a11y-toast', content: 'a11y-toast__content',
  tone: 'a11y-toast__tone', title: 'a11y-toast__title', message: 'a11y-toast__message',
  actions: 'a11y-toast__actions', action: 'a11y-toast__action', dismiss: 'a11y-toast__dismiss',
  error: 'a11y-toast__action-error', initialized: 'is-initialized', visible: 'is-visible',
  paused: 'is-paused', pending: 'is-action-pending',
});
const ATTR = Object.freeze({
  id: 'data-a11y-toast-id', action: 'data-a11y-toast-action', dismiss: 'data-a11y-toast-dismiss',
  role: 'role', label: 'aria-label', describedby: 'aria-describedby', disabled: 'aria-disabled',
  atomic: 'aria-atomic', tabindex: 'tabindex',
});
type Hook = 'beforeShow' | 'afterShow' | 'beforeUpdate' | 'afterUpdate' | 'beforeDismiss' | 'afterDismiss';
interface ToastView {
  item: HTMLLIElement; tone: HTMLElement; title: HTMLElement; message: HTMLElement;
  actions: HTMLElement; action: HTMLButtonElement; dismiss: HTMLButtonElement; error: HTMLElement;
}
interface RecordState {
  id: ToastId;
  input: ToastInput;
  data: NormalizedToast;
  state: ToastState;
  remaining: number;
  startedAt: number | null;
  timer: number | null;
  pauses: Set<ToastPauseReason>;
  view: ToastView | null;
  capturedFocus: HTMLElement | null;
  lastAnnouncement: string | null;
  actionController: AbortController | null;
  actionPending: boolean;
  actionError: string | null;
  updating: boolean;
  dismissing: boolean;
}
interface RegisteredAddon {
  addon: ToastAddon; context: ToastAddonContext; controller: AbortController;
  cleanup: ToastCleanup | null; removers: Set<ToastCleanup>;
}

export class A11yToast implements ToastInstance {
  private static readonly instances = new WeakMap<HTMLElement, A11yToast>();
  public readonly root!: HTMLElement;
  public readonly instanceId!: string;
  public readonly options!: ResolvedToastOptions;
  private readonly doc!: Document;
  private readonly win!: Window & typeof globalThis;
  private readonly viewport!: HTMLElement;
  private readonly list!: HTMLOListElement;
  private readonly empty!: HTMLElement;
  private readonly polite!: HTMLElement;
  private readonly assertive!: HTMLElement;
  private readonly announcer!: LiveAnnouncer;
  private readonly records = new Map<ToastId, RecordState>();
  private readonly queue: ToastId[] = [];
  private readonly addons = new Map<string, RegisteredAddon>();
  private readonly addedClasses: string[] = [];
  private sequence = 0;
  private destroyed = false;
  private clearing = false;
  private draining = false;
  private reportingAddonError = false;
  private readonly handleClick!: (event: MouseEvent) => void;
  private readonly handlePointerOver!: (event: PointerEvent) => void;
  private readonly handlePointerOut!: (event: PointerEvent) => void;
  private readonly handleFocusIn!: (event: FocusEvent) => void;
  private readonly handleFocusOut!: (event: FocusEvent) => void;
  private readonly handleVisibility!: () => void;

  constructor(root: HTMLElement, options: ToastOptions = {}) {
    if (!root?.ownerDocument || !isHTMLElement(root, root.ownerDocument)) throw new TypeError('A11yToast requires a root HTMLElement.');
    const existing = A11yToast.instances.get(root);
    if (existing) return existing;
    if (!root.isConnected) throw new Error('Mount the A11yToast root before initialization.');
    if (root.closest(SELECTORS.liveAncestor)) throw new Error('The toast root must not be inside another live region. Use a non-live host.');
    this.root = root;
    this.doc = root.ownerDocument;
    const win = this.doc.defaultView;
    if (!win) throw new Error('A11yToast requires a document with an active window.');
    this.win = win;
    this.options = resolveOptions(root, options);
    const nonce = win.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
    this.instanceId = `a11y-toast-${nonce}`;
    this.viewport = this.element('section', CLASSES.viewport);
    this.viewport.classList.add(`${CLASSES.viewport}--${this.options.position}`);
    this.viewport.setAttribute(ATTR.label, this.options.labels.region);
    this.viewport.setAttribute(ATTR.tabindex, '-1');
    this.list = this.element('ol', CLASSES.list);
    this.empty = this.element('p', CLASSES.empty);
    this.empty.id = `${this.instanceId}-empty`;
    this.empty.textContent = this.options.labels.empty;
    this.empty.hidden = true;
    this.viewport.append(this.empty, this.list);
    this.polite = this.element('div', CLASSES.live);
    this.assertive = this.element('div', CLASSES.live);
    this.polite.setAttribute(ATTR.role, 'status');
    this.assertive.setAttribute(ATTR.role, 'alert');
    for (const region of [this.polite, this.assertive]) region.setAttribute(ATTR.atomic, 'true');
    this.announcer = new LiveAnnouncer(win, this.polite, this.assertive);
    this.announcer.setPaused(this.doc.hidden);
    for (const name of [CLASSES.host, CLASSES.initialized]) {
      if (!root.classList.contains(name)) { root.classList.add(name); this.addedClasses.push(name); }
    }
    root.append(this.viewport, this.polite, this.assertive);
    this.handleClick = this.onClick.bind(this);
    this.handlePointerOver = this.onPointerOver.bind(this);
    this.handlePointerOut = this.onPointerOut.bind(this);
    this.handleFocusIn = this.onFocusIn.bind(this);
    this.handleFocusOut = this.onFocusOut.bind(this);
    this.handleVisibility = this.onVisibility.bind(this);
    this.viewport.addEventListener('click', this.handleClick);
    this.viewport.addEventListener('pointerover', this.handlePointerOver);
    this.viewport.addEventListener('pointerout', this.handlePointerOut);
    this.viewport.addEventListener('focusin', this.handleFocusIn);
    this.viewport.addEventListener('focusout', this.handleFocusOut);
    this.doc.addEventListener('visibilitychange', this.handleVisibility);
    // Register BEFORE emitting init: re-entrant factory calls must reuse this instance.
    A11yToast.instances.set(root, this);
    this.emit(TOAST_EVENTS.init, {});
    if (this.destroyed) return;
    for (const addon of options.addons ?? []) {
      if (this.destroyed) return;
      try { this.registerAddon(addon); }
      catch (error) { this.addonError(addon?.name ?? 'unnamed', 'registration', error); }
    }
    if (!this.destroyed) this.emit(TOAST_EVENTS.ready, {});
  }
  public get isDestroyed(): boolean { return this.destroyed; }
  public get visibleCount(): number {
    let count = 0;
    for (const record of this.records.values()) if (record.state === 'visible') count++;
    return count;
  }
  public get queuedCount(): number { return this.queue.length; }
  public show(input: ToastInput): ToastId | null {
    this.assertActive();
    this.drain(); // Existing waiters precede re-entrant arrivals from dismissal observers.
    const copied = this.copyInput(input);
    const data = normalizeToast(copied, this.options, this.doc);
    const record: RecordState = {
      id: `${this.instanceId}-${++this.sequence}`, input: copied, data, state: 'queued',
      remaining: data.duration, startedAt: null, timer: null, pauses: new Set(), view: null,
      capturedFocus: isHTMLElement(this.doc.activeElement, this.doc) ? this.doc.activeElement : null,
      lastAnnouncement: null, actionController: null, actionPending: false, actionError: null,
      updating: false, dismissing: false,
    };
    if (this.clearing || (this.visibleCount >= this.options.maxVisible && this.queue.length >= this.options.maxQueue)) {
      record.state = 'dropped';
      this.emit(TOAST_EVENTS.drop, { toast: this.snapshot(record), reason: this.clearing ? 'clearing' : 'queue-full' });
      return null;
    }
    this.records.set(record.id, record);
    if (this.visibleCount < this.options.maxVisible && this.queue.length === 0) this.display(record);
    else {
      this.queue.push(record.id);
      this.emit(TOAST_EVENTS.queue, { toast: this.snapshot(record) });
      this.drain();
    }
    return record.id;
  }
  public info(message: string, options: ToastShorthandOptions = {}): ToastId | null { return this.show({ ...options, message, tone: 'info' }); }
  public success(message: string, options: ToastShorthandOptions = {}): ToastId | null { return this.show({ ...options, message, tone: 'success' }); }
  public warning(message: string, options: ToastShorthandOptions = {}): ToastId | null { return this.show({ ...options, message, tone: 'warning' }); }
  public error(message: string, options: ToastShorthandOptions = {}): ToastId | null { return this.show({ ...options, message, tone: 'error' }); }
  public loading(message: string, options: ToastShorthandOptions = {}): ToastId | null { return this.show({ ...options, message, tone: 'loading' }); }

  public update(id: ToastId, patch: ToastPatch): boolean {
    this.assertActive();
    const record = this.records.get(id);
    if (!record || record.updating || record.dismissing) return false;
    const nextInput = this.copyInput({ ...record.input, ...patch });
    const next = normalizeToast(nextInput, this.options, this.doc);
    record.updating = true;
    try {
      this.runHooks('beforeUpdate', record);
      if (!this.owns(record) || record.dismissing) return false;
      this.stopTimer(record);
      const old = record.data;
      const timingChanged = patch.duration !== undefined || next.duration !== old.duration || next.persistent !== old.persistent;
      if (patch.action !== undefined) this.cancelAction(record);
      if (!this.owns(record)) return false;
      record.data = next;
      record.input = nextInput;
      if (timingChanged) record.remaining = next.duration;
      if (record.view) this.render(record);
      if (!this.owns(record)) return false;
      this.startTimer(record);
      this.emit(TOAST_EVENTS.update, { toast: this.snapshot(record) });
      this.runHooks('afterUpdate', record);
      if (this.owns(record) && record.state === 'visible') this.requestAnnouncement(record);
      return true;
    } finally { record.updating = false; }
  }
  public dismiss(id: ToastId, reason: ToastDismissReason = 'api'): boolean {
    if (this.destroyed) return false;
    const record = this.records.get(id);
    if (!record || record.dismissing) return false;
    record.dismissing = true;
    this.runHooks('beforeDismiss', record);
    if (!this.owns(record)) return false;
    const focused = record.view?.item.contains(this.doc.activeElement) ?? false;
    this.stopTimer(record);
    this.announcer.cancel(id);
    this.cancelAction(record);
    if (!this.owns(record)) return false;
    record.view?.item.remove();
    record.view = null;
    record.state = 'dismissed';
    this.records.delete(id);
    this.list.tabIndex = this.visibleCount > 0 ? 0 : -1;
    const index = this.queue.indexOf(id);
    if (index >= 0) this.queue.splice(index, 1);
    if (focused) this.recoverFocus(record);
    if (this.destroyed) return true;
    this.emit(TOAST_EVENTS.dismiss, { toast: this.snapshot(record), reason });
    this.runHooks('afterDismiss', record);
    this.drain();
    return true;
  }
  public dismissAll(reason: ToastDismissReason = 'clear'): number {
    if (this.destroyed || this.clearing) return 0;
    this.clearing = true;
    let count = 0;
    try {
      // Freeze the target set and suspend queue drainage for the ENTIRE clear operation.
      for (const id of [...this.records.keys()]) if (this.dismiss(id, reason)) count++;
    } finally { this.clearing = false; }
    return count;
  }
  public pause(id: ToastId): boolean {
    const record = this.records.get(id);
    if (this.destroyed || !record) return false;
    return this.setPause(record, 'api', true);
  }
  public resume(id: ToastId): boolean {
    const record = this.records.get(id);
    if (this.destroyed || !record) return false;
    return this.setPause(record, 'api', false);
  }
  public getToast(id: ToastId): ToastSnapshot | undefined {
    const record = this.records.get(id);
    return record ? this.snapshot(record) : undefined;
  }
  public getToasts(): readonly ToastSnapshot[] {
    return Object.freeze([...this.records.values()].map(record => this.snapshot(record)));
  }

  public registerAddon(addon: ToastAddon): void {
    this.assertActive();
    const name = typeof addon?.name === 'string' ? addon.name.trim() : '';
    if (!name) throw new TypeError('Toast addon requires a non-empty name.');
    if (this.addons.has(name)) throw new Error(`Toast addon "${name}" is already registered.`);
    const controller = new this.win.AbortController();
    const removers = new Set<ToastCleanup>();
    const copy = Object.freeze({ ...addon, name });
    const context: ToastAddonContext = Object.freeze({
      instance: this, root: this.root, signal: controller.signal,
      on: <K extends ToastEventName>(type: K, listener: (event: CustomEvent<ToastEventMap[K]>) => void): ToastCleanup => {
        if (controller.signal.aborted) return () => {};
        const remove = addToastEventListener(this.root, type, event => {
          // Ignore another manager's events, including nested hosts.
          if (event.detail.instance !== this || controller.signal.aborted) return;
          this.observeAddon(name, type, () => listener(event));
        });
        let active = true;
        const cleanup = () => { if (active) { active = false; remove(); removers.delete(cleanup); } };
        removers.add(cleanup);
        return cleanup;
      },
    });
    const entry: RegisteredAddon = { addon: copy, context, controller, cleanup: null, removers };
    this.addons.set(name, entry);
    try {
      const cleanup = copy.setup?.(context);
      if (cleanup !== undefined && typeof cleanup !== 'function') {
        void Promise.resolve(cleanup).catch(() => {});
        throw new TypeError('Toast addon setup must return a synchronous cleanup function or undefined.');
      }
      if (typeof cleanup === 'function') {
        if (this.addons.get(name) === entry) entry.cleanup = cleanup;
        else this.safeAddonCleanup(name, cleanup);
      }
    } catch (error) {
      this.unregisterAddon(name);
      this.addonError(name, 'setup', error);
    }
  }
  public unregisterAddon(name: string): boolean {
    const entry = this.addons.get(name);
    if (!entry) return false;
    this.addons.delete(name); // Delete first; cleanup is allowed to be re-entrant.
    entry.controller.abort();
    for (const remove of [...entry.removers]) remove();
    if (entry.cleanup) this.safeAddonCleanup(name, entry.cleanup);
    return true;
  }
  public getAddon(name: string): ToastAddon | undefined { return this.addons.get(name)?.addon; }
  public getAddons(): readonly ToastAddon[] { return Object.freeze([...this.addons.values()].map(entry => entry.addon)); }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true; // All outstanding timers/promise callbacks stop at this boundary.
    const focused = [...this.records.values()].find(record => record.view?.item.contains(this.doc.activeElement));
    this.announcer.destroy();
    for (const record of this.records.values()) { this.stopTimer(record); this.cancelAction(record); }
    this.records.clear();
    this.queue.length = 0;
    this.viewport.removeEventListener('click', this.handleClick);
    this.viewport.removeEventListener('pointerover', this.handlePointerOver);
    this.viewport.removeEventListener('pointerout', this.handlePointerOut);
    this.viewport.removeEventListener('focusin', this.handleFocusIn);
    this.viewport.removeEventListener('focusout', this.handleFocusOut);
    this.doc.removeEventListener('visibilitychange', this.handleVisibility);
    if (focused) this.recoverFocus(focused, true);
    this.viewport.remove();
    this.polite.remove();
    this.assertive.remove();
    for (const name of this.addedClasses) this.root.classList.remove(name);
    // destroy is observable by add-ons while their listeners still exist; methods already refuse work.
    A11yToast.instances.delete(this.root);
    this.emit(TOAST_EVENTS.destroy, {});
    for (const name of [...this.addons.keys()].reverse()) this.unregisterAddon(name);
  }

  private element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
    const element = this.doc.createElement(tag);
    element.className = className;
    return element;
  }
  private copyInput(input: ToastInput): ToastInput {
    if (!input || typeof input !== 'object') throw new TypeError('Toast input must be an object.');
    return { ...input, action: input.action ? { ...input.action } : input.action };
  }
  private assertActive(): void {
    if (this.destroyed) throw new Error('A11yToast was destroyed. Create a new instance.');
    if (!this.root.isConnected) throw new Error('The toast root is disconnected. Mount it or destroy this instance.');
  }
  private owns(record: RecordState): boolean { return !this.destroyed && this.records.get(record.id) === record; }
  private now(): number { return this.win.performance.now(); }
  private remaining(record: RecordState): number {
    return Math.max(0, record.remaining - (record.startedAt === null ? 0 : this.now() - record.startedAt));
  }
  private snapshot(record: RecordState): ToastSnapshot {
    const data = record.data;
    return Object.freeze({
      id: record.id, key: data.key, title: data.title, message: data.message, tone: data.tone,
      priority: data.priority, announcement: data.announcement, state: record.state,
      duration: data.duration, persistent: data.persistent, dismissible: data.dismissible,
      remaining: data.persistent ? null : Math.ceil(this.remaining(record)),
      pauseReasons: Object.freeze([...record.pauses]),
      action: data.action ? Object.freeze({ label: data.action.label, dismissOnSuccess: data.action.dismissOnSuccess }) : null,
      actionPending: record.actionPending, actionError: record.actionError,
    });
  }
  private display(record: RecordState): void {
    if (!this.owns(record)) return;
    // Reserve the slot before calling user hooks, preventing re-entrant show() from exceeding maxVisible.
    record.state = 'visible';
    this.runHooks('beforeShow', record);
    if (!this.owns(record) || record.state !== 'visible') return;
    record.view = this.createView(record);
    this.render(record);
    this.empty.hidden = true;
    this.viewport.removeAttribute(ATTR.describedby);
    this.list.append(record.view.item);
    this.list.tabIndex = 0;
    if (this.doc.activeElement === this.list || this.doc.activeElement === this.viewport) record.pauses.add('focus');
    if (this.doc.hidden) record.pauses.add('document-hidden');
    this.startTimer(record);
    this.emit(TOAST_EVENTS.show, { toast: this.snapshot(record) });
    this.runHooks('afterShow', record);
    if (this.owns(record)) this.requestAnnouncement(record);
  }
  private drain(): void {
    if (this.destroyed || this.clearing || this.draining) return;
    this.draining = true;
    try {
      while (!this.destroyed && this.queue.length > 0 && this.visibleCount < this.options.maxVisible) {
        const id = this.queue.shift();
        const record = id ? this.records.get(id) : undefined;
        if (record) this.display(record);
      }
    } finally { this.draining = false; }
  }
  private createView(record: RecordState): ToastView {
    const item = this.element('li', CLASSES.item);
    item.setAttribute(ATTR.id, record.id);
    const content = this.element('div', CLASSES.content);
    const tone = this.element('span', CLASSES.tone);
    const title = this.element('p', CLASSES.title);
    const message = this.element('p', CLASSES.message);
    message.id = `${record.id}-message`;
    const actions = this.element('div', CLASSES.actions);
    const action = this.element('button', CLASSES.action);
    const dismiss = this.element('button', CLASSES.dismiss);
    const error = this.element('p', CLASSES.error);
    error.id = `${record.id}-action-error`;
    action.type = 'button';
    dismiss.type = 'button';
    action.setAttribute(ATTR.action, '');
    dismiss.setAttribute(ATTR.dismiss, '');
    dismiss.textContent = '×';
    dismiss.setAttribute(ATTR.label, this.options.labels.dismiss);
    action.setAttribute(ATTR.describedby, message.id);
    dismiss.setAttribute(ATTR.describedby, message.id);
    actions.append(action);
    content.append(tone, title, message, actions, error);
    item.append(content, dismiss);
    return { item, tone, title, message, actions, action, dismiss, error };
  }
  private render(record: RecordState): void {
    const v = record.view;
    if (!v) return;
    const active = this.doc.activeElement;
    const data = record.data;
    v.item.className = `${CLASSES.item} ${CLASSES.item}--${data.tone} ${CLASSES.visible}`;
    v.item.classList.toggle(CLASSES.paused, record.pauses.size > 0);
    v.item.classList.toggle(CLASSES.pending, record.actionPending);
    v.tone.textContent = this.options.labels.tones[data.tone];
    v.title.textContent = data.title;
    v.title.hidden = !data.title;
    v.message.textContent = data.message;
    v.action.textContent = data.action?.label ?? '';
    v.actions.hidden = !data.action;
    v.action.setAttribute(ATTR.disabled, String(record.actionPending));
    v.dismiss.hidden = !data.dismissible;
    v.error.hidden = !record.actionError;
    v.error.textContent = record.actionError ?? '';
    if ((active === v.action && !data.action) || (active === v.dismiss && !data.dismissible)) {
      if (data.dismissible) this.focus(v.dismiss);
      else if (data.action) this.focus(v.action);
      else this.recoverFocus(record);
    }
  }
  private startTimer(record: RecordState): void {
    if (!this.owns(record) || record.state !== 'visible' || record.data.persistent || record.pauses.size || record.timer !== null) return;
    record.startedAt = this.now();
    record.timer = this.win.setTimeout(() => {
      record.timer = null;
      record.remaining = 0;
      record.startedAt = null;
      if (!this.owns(record)) return;
      // Late visibility/focus changes must still prevent expiry, even if a browser event was delayed.
      if (this.doc.hidden) {
        record.remaining = Math.min(record.data.duration, 1000);
        this.setPause(record, 'document-hidden', true);
      } else if (record.view?.item.contains(this.doc.activeElement) || this.doc.activeElement === this.list || this.doc.activeElement === this.viewport) {
        record.remaining = Math.min(record.data.duration, 1000);
        this.setPause(record, 'focus', true);
      }
      else this.dismiss(record.id, 'timeout');
    }, Math.ceil(record.remaining));
  }
  private stopTimer(record: RecordState): void {
    record.remaining = this.remaining(record);
    record.startedAt = null;
    if (record.timer !== null) this.win.clearTimeout(record.timer);
    record.timer = null;
  }
  private setPause(record: RecordState, reason: ToastPauseReason, paused: boolean): boolean {
    if (!this.owns(record) || record.dismissing || record.pauses.has(reason) === paused) return false;
    const wasPaused = record.pauses.size > 0;
    if (paused) { this.stopTimer(record); record.pauses.add(reason); }
    else record.pauses.delete(reason);
    record.view?.item.classList.toggle(CLASSES.paused, record.pauses.size > 0);
    this.startTimer(record);
    if (!wasPaused && record.pauses.size > 0) this.emit(TOAST_EVENTS.pause, { toast: this.snapshot(record), reason });
    else if (wasPaused && record.pauses.size === 0) this.emit(TOAST_EVENTS.resume, { toast: this.snapshot(record), reason });
    return true;
  }
  private requestAnnouncement(record: RecordState): void {
    if (!this.owns(record) || record.state !== 'visible') return;
    const priority = record.data.priority;
    const message = [record.data.announcement, record.actionError].filter(Boolean).join(' ');
    const signature = `${priority}:${message}`;
    if (priority === 'off' || signature === record.lastAnnouncement) { this.announcer.cancel(record.id); return; }
    this.announcer.request(priority, {
      id: record.id, message,
      valid: () => this.owns(record) && record.state === 'visible' && this.root.isConnected && record.data.priority === priority,
      committed: () => {
        if (!this.owns(record)) return;
        record.lastAnnouncement = signature;
        this.emit(TOAST_EVENTS.announce, { toast: this.snapshot(record), message, priority });
      },
    });
  }
  private eventRecord(target: EventTarget | null): RecordState | undefined {
    if (!(target instanceof this.win.Element)) return undefined;
    const item = target.closest(SELECTORS.item);
    if (!item || item.parentElement !== this.list) return undefined;
    return this.records.get(item.getAttribute(ATTR.id) ?? '');
  }
  private onPointerOver(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    const record = this.eventRecord(event.target);
    if (!record || (event.relatedTarget instanceof this.win.Node && record.view?.item.contains(event.relatedTarget))) return;
    this.setPause(record, 'hover', true);
  }
  private onPointerOut(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    const record = this.eventRecord(event.target);
    if (!record || (event.relatedTarget instanceof this.win.Node && record.view?.item.contains(event.relatedTarget))) return;
    this.setPause(record, 'hover', false);
  }
  private syncFocusPauses(): void {
    if (this.destroyed) return;
    const active = this.doc.activeElement;
    if (!this.viewport.contains(active)) {
      this.empty.hidden = true;
      this.viewport.removeAttribute(ATTR.describedby);
    }
    const areaFocused = active === this.list || active === this.viewport;
    for (const record of [...this.records.values()]) {
      this.setPause(record, 'focus', areaFocused || Boolean(record.view?.item.contains(active)));
    }
  }
  private onFocusIn(_event: FocusEvent): void { this.syncFocusPauses(); }
  private onFocusOut(_event: FocusEvent): void {
    this.win.queueMicrotask(() => this.syncFocusPauses());
  }
  private onVisibility(): void {
    if (this.destroyed) return;
    this.announcer.setPaused(this.doc.hidden);
    for (const record of [...this.records.values()]) this.setPause(record, 'document-hidden', this.doc.hidden);
  }
  private onClick(event: MouseEvent): void {
    if (!(event.target instanceof this.win.Element)) return;
    const record = this.eventRecord(event.target);
    if (!record || record.dismissing) return;
    if (event.target.closest(SELECTORS.dismiss) && record.data.dismissible) this.dismiss(record.id, 'close-button');
    else if (event.target.closest(SELECTORS.action)) this.invokeAction(record);
  }
  private invokeAction(record: RecordState): void {
    const action = record.data.action;
    if (!action || record.actionPending || !this.owns(record)) return;
    const controller = new this.win.AbortController();
    record.actionController = controller;
    record.actionPending = true;
    record.actionError = null;
    this.setPause(record, 'action', true);
    if (!this.owns(record)) return;
    this.render(record);
    if (!this.owns(record)) return;
    this.emit(TOAST_EVENTS.action, { toast: this.snapshot(record) });
    if (!this.owns(record) || record.actionController !== controller) return;
    const settle = (error?: unknown, failed = false): void => {
      if (!this.owns(record) || record.actionController !== controller || controller.signal.aborted) return;
      record.actionPending = false;
      record.actionController = null;
      if (failed) {
        // Failure stays available for retry; this does not replace the caller's message.
        record.actionError = this.options.labels.actionFailed;
        record.input = { ...record.input, persistent: true };
        record.data = { ...record.data, persistent: true };
      }
      this.setPause(record, 'action', false);
      if (!this.owns(record)) return;
      this.render(record);
      if (!this.owns(record)) return;
      if (failed) {
        this.emit(TOAST_EVENTS.actionError, { toast: this.snapshot(record), error });
        this.requestAnnouncement(record);
      } else if (action.dismissOnSuccess && action.onClick) this.dismiss(record.id, 'action');
    };
    try {
      const result = action.onClick?.(Object.freeze({ instance: this, id: record.id, toast: this.snapshot(record), signal: controller.signal }));
      if (result && typeof result.then === 'function') Promise.resolve(result).then(() => settle(), error => settle(error, true));
      else settle();
    } catch (error) { settle(error, true); }
  }
  private cancelAction(record: RecordState): void {
    const controller = record.actionController;
    record.actionController = null;
    record.actionPending = false;
    record.actionError = null;
    record.pauses.delete('action');
    controller?.abort();
  }
  private focus(element: HTMLElement | null): boolean {
    if (!element || !element.isConnected || element.ownerDocument !== this.doc || element === this.doc.body || element === this.doc.documentElement) return false;
    if (element.closest('[hidden], [inert], [aria-hidden="true"]') || element.matches(':disabled') || element.getClientRects().length === 0) return false;
    const style = this.win.getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    element.focus({ preventScroll: true });
    return this.doc.activeElement === element;
  }
  private recoverFocus(record: RecordState, destroying = false): void {
    // Never choose a disappearing descendant as the origin/captured focus.
    for (const target of [record.data.origin, record.capturedFocus]) {
      if (target && !record.view?.item.contains(target) && (!destroying || !this.viewport.contains(target)) && this.focus(target)) return;
    }
    if (!destroying && !this.clearing) {
      for (const candidate of this.records.values()) {
        if (candidate === record || !candidate.view) continue;
        if (candidate.data.action && this.focus(candidate.view.action)) return;
        if (candidate.data.dismissible && this.focus(candidate.view.dismiss)) return;
      }
    }
    if (!destroying) {
      if (this.visibleCount === 0) {
        this.empty.hidden = false;
        this.viewport.setAttribute(ATTR.describedby, this.empty.id);
      }
      if (this.focus(this.viewport)) return;
    }
    // Last-resort focus anchor: restore only the attribute this operation changed.
    if (this.root.isConnected) {
      const previous = this.root.getAttribute(ATTR.tabindex);
      this.root.setAttribute(ATTR.tabindex, '-1');
      this.focus(this.root);
      if (previous === null) this.root.removeAttribute(ATTR.tabindex);
      else this.root.setAttribute(ATTR.tabindex, previous);
    }
  }
  private runHooks(hook: Hook, record: RecordState): void {
    for (const [name, entry] of [...this.addons]) {
      if (this.destroyed) return;
      if (this.addons.get(name) !== entry) continue;
      const callback = entry.addon[hook];
      if (!callback) continue;
      const context: ToastAddonHookContext = Object.freeze({ ...entry.context, toast: this.snapshot(record) });
      this.observeAddon(name, hook, () => callback(context));
    }
  }
  private safeAddonCleanup(name: string, cleanup: ToastCleanup): void {
    this.observeAddon(name, 'cleanup', cleanup);
  }
  private observeAddon(name: string, phase: string, callback: () => unknown): void {
    try {
      const result = callback();
      if (result && (typeof result === 'object' || typeof result === 'function') && 'then' in result && typeof result.then === 'function') {
        // Hooks remain observers, not asynchronous middleware. Catch accidental async failures.
        void Promise.resolve(result as PromiseLike<unknown>).catch(error => {
          if (!this.destroyed) this.addonError(name, phase, error);
        });
      }
    } catch (error) { this.addonError(name, phase, error); }
  }
  private addonError(addon: string, phase: string, error: unknown): void {
    if (this.reportingAddonError) return;
    this.reportingAddonError = true;
    try { this.emit(TOAST_EVENTS.addonError, { addon, phase, error }); }
    finally { this.reportingAddonError = false; }
  }
  private emit<K extends ToastEventName>(type: K, extra: Omit<ToastEventMap[K], keyof import('./events.js').ToastEventDetail>): void {
    const detail = Object.freeze({
      instance: this, root: this.root, instanceId: this.instanceId, timestamp: Date.now(),
      visibleCount: this.visibleCount, queuedCount: this.queuedCount, ...extra,
    });
    this.root.dispatchEvent(new this.win.CustomEvent(type, { bubbles: true, composed: false, cancelable: false, detail }));
  }
}

export function createToast(root: HTMLElement, options: ToastOptions = {}): A11yToast { return new A11yToast(root, options); }
export function initToastAll(options: ToastOptions = {}, scope?: ParentNode): A11yToast[] {
  const parent = scope ?? (typeof document === 'undefined' ? null : document);
  if (!parent) return [];
  return Array.from(parent.querySelectorAll<HTMLElement>(SELECTORS.root)).map(root => createToast(root, options));
}
