import type { ToastAnimationContext, ToastAnimationDriver } from '../types.js';

const PHASE_ATTRIBUTE = 'data-a11y-toast-view-transition-phase';

interface ElementViewTransitionLike {
  readonly finished: Promise<unknown>;
  readonly ready?: Promise<unknown>;
  skipTransition(): void;
  readonly transitionRoot?: Element;
}

type StartElementViewTransition = (
  updateCallback?: () => void | Promise<void>,
) => ElementViewTransitionLike;

type ViewTransitionElement = HTMLElement & {
  startViewTransition?: StartElementViewTransition;
};

export interface ElementViewTransitionOptions {
  /** Vertical travel in CSS pixels before/after the settled position. Defaults to 4. */
  distance?: number;
}

function finiteNumber(value: unknown, fallback: number, label: string): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`${label} must be a finite number greater than or equal to 0.`);
  }
  return value;
}

function direction(context: ToastAnimationContext, distance: number): number {
  return context.instance.options.position.startsWith('top') ? -distance : distance;
}

function restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function restoreStyle(element: HTMLElement, value: string | null): void {
  if (value !== null) {
    element.setAttribute('style', value);
    return;
  }
  // Chromium may preserve an empty style attribute after CSSStyleDeclaration
  // mutations even when removeAttribute() ran earlier. Clear the driver-owned
  // declarations and serialized cssText before removing the attribute.
  element.style.removeProperty('opacity');
  element.style.removeProperty('translate');
  element.style.cssText = '';
  element.removeAttribute('style');
}

function animateNow(
  context: ToastAnimationContext,
  distance: number,
): Promise<void> {
  const scope = context.element as ViewTransitionElement;
  const startViewTransition = scope.startViewTransition;
  if (typeof startViewTransition !== 'function') return Promise.resolve();
  if (context.signal.aborted) {
    return Promise.reject(new DOMException('View Transition animation aborted.', 'AbortError'));
  }

  const initialStyle = scope.getAttribute('style');
  const initialPhase = scope.getAttribute(PHASE_ATTRIBUTE);
  const travel = direction(context, distance);

  const restore = (): void => {
    restoreStyle(scope, initialStyle);
    restoreAttribute(scope, PHASE_ATTRIBUTE, initialPhase);
  };

  const applyOffset = (): void => {
    scope.style.opacity = '0';
    scope.style.translate = `0 ${travel}px`;
  };

  scope.setAttribute(PHASE_ATTRIBUTE, context.phase);
  if (context.phase === 'enter') applyOffset();

  let transition: ElementViewTransitionLike;
  try {
    transition = startViewTransition.call(scope, () => {
      if (context.phase === 'enter') restoreAttribute(scope, 'style', initialStyle);
      else applyOffset();
    });
  } catch (error) {
    restore();
    return Promise.reject(error);
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let aborted = false;

    const removeAbort = (): void => context.signal.removeEventListener('abort', onAbort);

    const finish = (error?: unknown): void => {
      if (settled) return;
      settled = true;
      removeAbort();
      restore();
      const finalize = (): void => {
        // Some browsers finalize scoped-transition bookkeeping after finished
        // callbacks run. Restore once more before exposing driver completion.
        restore();
        if (error !== undefined) reject(error);
        else resolve();
      };
      const queue = scope.ownerDocument.defaultView?.queueMicrotask?.bind(scope.ownerDocument.defaultView);
      if (queue) queue(finalize);
      else Promise.resolve().then(finalize);
    };

    const onAbort = (): void => {
      if (settled || aborted) return;
      aborted = true;
      try { transition.skipTransition(); }
      catch { /* The transition may already be finished/skipped. */ }
      Promise.resolve(transition.finished).then(
        () => finish(new DOMException(`View Transition ${context.phase} animation aborted.`, 'AbortError')),
        () => finish(new DOMException(`View Transition ${context.phase} animation aborted.`, 'AbortError')),
      );
    };

    context.signal.addEventListener('abort', onAbort, { once: true });
    if (context.signal.aborted) {
      onAbort();
      return;
    }

    Promise.resolve(transition.finished).then(
      () => {
        if (aborted) return;
        finish();
      },
      error => {
        if (aborted) return;
        finish(error);
      },
    );
  });
}

/**
 * Experimental TOAST-180 driver using Element.startViewTransition().
 * Unsupported browsers settle immediately with no decorative motion.
 * Document.startViewTransition() is never used as a fallback.
 */
export function createElementViewTransitionDriver(
  options: ElementViewTransitionOptions = {},
): ToastAnimationDriver {
  const distance = finiteNumber(options.distance, 4, 'View Transition distance');
  const tails = new WeakMap<HTMLElement, Promise<void>>();

  const animate = (context: ToastAnimationContext): Promise<void> => {
    const previous = tails.get(context.element);
    const task = previous
      ? previous.catch(() => {}).then(() => animateNow(context, distance))
      : animateNow(context, distance);
    const tail = task.then(() => undefined, () => undefined);
    tails.set(context.element, tail);
    void tail.finally(() => {
      if (tails.get(context.element) === tail) tails.delete(context.element);
    });
    return task;
  };

  return Object.freeze({
    name: 'view-transition',
    enter: animate,
    exit: animate,
  });
}
