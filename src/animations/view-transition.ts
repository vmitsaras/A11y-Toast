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

function animate(
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
    restoreAttribute(scope, 'style', initialStyle);
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
      if (error !== undefined) reject(error);
      else resolve();
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

  return Object.freeze({
    name: 'view-transition',
    enter: (context: ToastAnimationContext) => animate(context, distance),
    exit: (context: ToastAnimationContext) => animate(context, distance),
  });
}
