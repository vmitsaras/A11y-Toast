import { TOAST_EVENTS } from '../events.js';
import { prefersReducedMotion } from '../animation.js';
import type {
  ToastAddon,
  ToastAddonContext,
  ToastAddonHookContext,
  ToastId,
  ToastInstance,
} from '../types.js';

const ITEM_SELECTOR = '[data-a11y-toast-id]';
const ID_ATTRIBUTE = 'data-a11y-toast-id';
const FLIP_ID_ATTRIBUTE = 'data-flip-id';

export interface GsapPluginRegistrarLike {
  registerPlugin(...plugins: unknown[]): unknown;
}

export interface GsapFlipAnimationLike {
  kill?(): unknown;
}

export interface GsapFlipLike {
  getState(targets: Element[], vars?: Record<string, unknown>): unknown;
  from(state: unknown, vars: Record<string, unknown>): GsapFlipAnimationLike;
  killFlipsOf(targets: Element[], complete?: boolean): unknown;
}

export interface GsapFlipLayoutOptions {
  /** Seconds. Defaults to 0.2. Set 0 to disable layout motion. */
  duration?: number;
  /** GSAP ease string. Defaults to power1.inOut. */
  ease?: string;
  /** Optional diagnostics for asynchronous Flip failures. */
  onError?: (error: unknown) => void;
}

interface PendingLayout {
  readonly state: unknown;
  readonly elements: readonly HTMLElement[];
  readonly flipIds: ReadonlyMap<HTMLElement, string | null>;
}

interface ActiveLayout {
  readonly targets: readonly HTMLElement[];
  readonly finalStyles: ReadonlyMap<HTMLElement, string | null>;
  readonly flipIds: ReadonlyMap<HTMLElement, string | null>;
  settling: boolean;
}

interface ManagerState {
  readonly context: ToastAddonContext;
  pending: PendingLayout | null;
  active: ActiveLayout | null;
  readonly waitingExits: Set<ToastId>;
  scheduled: boolean;
  cleanup(): void;
  capture(excludeId?: ToastId): void;
  afterMutation(): void;
  afterDismiss(id: ToastId): void;
}

function finiteNumber(value: unknown, fallback: number, label: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a finite number greater than or equal to 0.`);
  }
  return value;
}

function nonEmpty(value: unknown, fallback: string, label: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function validateGsap(value: unknown): asserts value is GsapPluginRegistrarLike {
  if (!value || typeof value !== 'object' || typeof (value as Partial<GsapPluginRegistrarLike>).registerPlugin !== 'function') {
    throw new TypeError('createGsapFlipLayoutAddon requires a GSAP instance with registerPlugin().');
  }
}

function validateFlip(value: unknown): asserts value is GsapFlipLike {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) {
    throw new TypeError('createGsapFlipLayoutAddon requires the GSAP Flip plugin.');
  }
  const candidate = value as Partial<GsapFlipLike>;
  if (
    typeof candidate.getState !== 'function'
    || typeof candidate.from !== 'function'
    || typeof candidate.killFlipsOf !== 'function'
  ) {
    throw new TypeError('GSAP Flip plugin must provide getState(), from(), and killFlipsOf().');
  }
}

function restoreAttribute(
  elements: ReadonlyMap<HTMLElement, string | null>,
  attribute: string,
): void {
  for (const [element, value] of elements) {
    if (value === null) element.removeAttribute(attribute);
    else element.setAttribute(attribute, value);
  }
}

function currentItems(root: HTMLElement, excludeId?: ToastId): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)].filter(element => (
    element.getAttribute(ID_ATTRIBUTE) !== excludeId
    && element.getAttribute('aria-hidden') !== 'true'
    && !element.classList.contains('is-exiting')
  ));
}

function findItem(root: HTMLElement, id: ToastId): HTMLElement | null {
  for (const element of root.querySelectorAll<HTMLElement>(ITEM_SELECTOR)) {
    if (element.getAttribute(ID_ATTRIBUTE) === id) return element;
  }
  return null;
}

/**
 * Animate only surviving toast layout movement. Enter/exit remains owned by the
 * manager's normal animation driver (CSS/GSAP/etc).
 */
export function createGsapFlipLayoutAddon(
  gsap: GsapPluginRegistrarLike,
  Flip: GsapFlipLike,
  options: GsapFlipLayoutOptions = {},
): ToastAddon {
  validateGsap(gsap);
  validateFlip(Flip);

  const duration = finiteNumber(options.duration, 0.2, 'GSAP Flip duration');
  const ease = nonEmpty(options.ease, 'power1.inOut', 'GSAP Flip ease');
  if (options.onError !== undefined && typeof options.onError !== 'function') {
    throw new TypeError('GSAP Flip onError must be a function.');
  }

  gsap.registerPlugin(Flip);
  const states = new WeakMap<ToastInstance, ManagerState>();

  const report = (error: unknown): void => {
    try { options.onError?.(error); }
    catch { /* Decorative layout diagnostics must not break toast lifecycle. */ }
  };

  const setupState = (context: ToastAddonContext): ManagerState => {
    const win = context.root.ownerDocument.defaultView;
    if (!win) throw new Error('GSAP Flip layout add-on requires an active window.');

    const canMove = (): boolean => (
      !context.signal.aborted
      && duration > 0
      && !context.root.ownerDocument.hidden
      && !prefersReducedMotion(win)
    );

    const restorePending = (pending: PendingLayout | null): void => {
      if (pending) restoreAttribute(pending.flipIds, FLIP_ID_ATTRIBUTE);
    };

    const settleActive = (active: ActiveLayout | null): void => {
      if (!active) return;
      restoreAttribute(active.finalStyles, 'style');
      restoreAttribute(active.flipIds, FLIP_ID_ATTRIBUTE);
      if (state.active === active) state.active = null;
    };

    const stopActive = (): void => {
      const active = state.active;
      if (!active) return;
      try { Flip.killFlipsOf([...active.targets], true); }
      catch (error) { report(error); }
      finally { settleActive(active); }
    };

    const flush = (): void => {
      state.scheduled = false;
      if (state.waitingExits.size > 0) return;

      const pending = state.pending;
      state.pending = null;
      if (!pending) return;

      if (!canMove()) {
        restorePending(pending);
        return;
      }

      const targets = pending.elements.filter(element => (
        element.isConnected
        && element.getAttribute('aria-hidden') !== 'true'
        && !element.classList.contains('is-exiting')
      ));
      if (targets.length === 0) {
        restorePending(pending);
        return;
      }

      const finalStyles = new Map(targets.map(element => [element, element.getAttribute('style')] as const));
      const active: ActiveLayout = {
        targets,
        finalStyles,
        flipIds: pending.flipIds,
        settling: false,
      };
      state.active = active;

      const settle = (): void => {
        if (active.settling) return;
        active.settling = true;
        // Flip's own clearProps/finalization runs after onComplete/onInterrupt.
        // Restore authored inline state on the next microtask so our exact state wins.
        win.queueMicrotask(() => settleActive(active));
      };
      try {
        Flip.from(pending.state, {
          targets,
          duration,
          ease,
          simple: true,
          prune: true,
          onComplete: settle,
          onInterrupt: settle,
        });
      } catch (error) {
        settleActive(active);
        report(error);
      }
    };

    const schedule = (): void => {
      if (!state.pending || state.waitingExits.size > 0 || state.scheduled) return;
      state.scheduled = true;
      win.queueMicrotask(flush);
    };

    const state: ManagerState = {
      context,
      pending: null,
      active: null,
      waitingExits: new Set(),
      scheduled: false,

      capture(excludeId?: ToastId): void {
        if (!canMove() || state.pending) return;

        stopActive();
        const elements = currentItems(context.root, excludeId);
        if (elements.length === 0) return;

        const flipIds = new Map(elements.map(element => [element, element.getAttribute(FLIP_ID_ATTRIBUTE)] as const));
        try {
          const captured = Flip.getState(elements, { simple: true });
          state.pending = Object.freeze({
            state: captured,
            elements: Object.freeze([...elements]),
            flipIds,
          });
        } catch (error) {
          restoreAttribute(flipIds, FLIP_ID_ATTRIBUTE);
          report(error);
        }
      },

      afterMutation(): void {
        schedule();
      },

      afterDismiss(id: ToastId): void {
        if (!state.pending) return;
        const element = findItem(context.root, id);
        if (element?.isConnected) state.waitingExits.add(id);
        else schedule();
      },

      cleanup(): void {
        state.scheduled = false;
        state.waitingExits.clear();
        restorePending(state.pending);
        state.pending = null;
        stopActive();
      },
    };

    const removeAnimationEnd = context.on(TOAST_EVENTS.animationEnd, event => {
      if (event.detail.phase !== 'exit') return;
      if (!state.waitingExits.delete(event.detail.toast.id)) return;
      schedule();
    });

    const baseCleanup = state.cleanup.bind(state);
    state.cleanup = () => {
      removeAnimationEnd();
      baseCleanup();
    };

    return state;
  };

  return Object.freeze({
    name: 'gsap-flip-layout',

    setup(context: ToastAddonContext) {
      const state = setupState(context);
      states.set(context.instance, state);
      return () => {
        states.delete(context.instance);
        state.cleanup();
      };
    },

    beforeShow(context: ToastAddonHookContext) {
      states.get(context.instance)?.capture();
    },
    afterShow(context: ToastAddonHookContext) {
      states.get(context.instance)?.afterMutation();
    },

    beforeUpdate(context: ToastAddonHookContext) {
      states.get(context.instance)?.capture(context.toast.id);
    },
    afterUpdate(context: ToastAddonHookContext) {
      states.get(context.instance)?.afterMutation();
    },

    beforeDismiss(context: ToastAddonHookContext) {
      states.get(context.instance)?.capture(context.toast.id);
    },
    afterDismiss(context: ToastAddonHookContext) {
      states.get(context.instance)?.afterDismiss(context.toast.id);
    },
  });
}
