import type { ToastAnimationContext, ToastAnimationDriver } from '../types.js';

export interface GsapAnimationLike {
  play(): unknown;
  revert(): unknown;
}

export interface GsapLike {
  fromTo(
    target: Element,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
  ): GsapAnimationLike;
  to(
    target: Element,
    vars: Record<string, unknown>,
  ): GsapAnimationLike;
}

export interface GsapToastAnimationOptions {
  /** Seconds. Defaults to 0.15. */
  enterDuration?: number;
  /** Seconds. Defaults to 0.12. */
  exitDuration?: number;
  /** GSAP ease string. Defaults to power1.out. */
  enterEase?: string;
  /** GSAP ease string. Defaults to power1.in. */
  exitEase?: string;
  /** Vertical travel in CSS pixels before/after the settled position. Defaults to 4. */
  distance?: number;
}

interface ResolvedOptions {
  enterDuration: number;
  exitDuration: number;
  enterEase: string;
  exitEase: string;
  distance: number;
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

function resolveOptions(options: GsapToastAnimationOptions): Readonly<ResolvedOptions> {
  return Object.freeze({
    enterDuration: finiteNumber(options.enterDuration, 0.15, 'GSAP enterDuration'),
    exitDuration: finiteNumber(options.exitDuration, 0.12, 'GSAP exitDuration'),
    enterEase: nonEmpty(options.enterEase, 'power1.out', 'GSAP enterEase'),
    exitEase: nonEmpty(options.exitEase, 'power1.in', 'GSAP exitEase'),
    distance: finiteNumber(options.distance, 4, 'GSAP distance'),
  });
}

function validateGsap(value: unknown): asserts value is GsapLike {
  if (!value || typeof value !== 'object') {
    throw new TypeError('createGsapAnimationDriver requires a GSAP instance.');
  }
  const candidate = value as Partial<GsapLike>;
  if (typeof candidate.fromTo !== 'function' || typeof candidate.to !== 'function') {
    throw new TypeError('GSAP instance must provide fromTo() and to().');
  }
}

function direction(context: ToastAnimationContext, distance: number): number {
  return context.instance.options.position.startsWith('top') ? -distance : distance;
}

function animate(
  gsap: GsapLike,
  context: ToastAnimationContext,
  options: Readonly<ResolvedOptions>,
): Promise<void> {
  const { element, phase, signal } = context;
  if (signal.aborted) return Promise.reject(new DOMException('GSAP animation aborted.', 'AbortError'));

  const initialStyle = element.getAttribute('style');
  const travel = direction(context, options.distance);

  return new Promise<void>((resolve, reject) => {
    let animation: GsapAnimationLike | null = null;
    let settled = false;
    let reverting = false;

    const removeAbort = (): void => signal.removeEventListener('abort', onAbort);

    const revert = (): void => {
      if (!animation) return;
      reverting = true;
      try { animation.revert(); }
      finally {
        if (initialStyle === null) element.removeAttribute('style');
        else element.setAttribute('style', initialStyle);
        reverting = false;
      }
    };

    const complete = (): void => {
      if (settled) return;
      settled = true;
      removeAbort();
      try {
        revert();
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    const interrupt = (): void => {
      if (settled || reverting) return;
      settled = true;
      removeAbort();
      try { revert(); }
      catch { /* Preserve the interruption as the primary failure. */ }
      reject(new Error(`GSAP ${phase} animation was interrupted before completion.`));
    };

    const onAbort = (): void => {
      if (settled) return;
      settled = true;
      removeAbort();
      try { revert(); }
      catch { /* Abort cleanup is best-effort; core already owns final DOM teardown. */ }
      reject(new DOMException(`GSAP ${phase} animation aborted.`, 'AbortError'));
    };

    try {
      if (phase === 'enter') {
        animation = gsap.fromTo(
          element,
          { opacity: 0, y: travel },
          {
            opacity: 1,
            y: 0,
            duration: options.enterDuration,
            ease: options.enterEase,
            paused: true,
            onComplete: complete,
            onInterrupt: interrupt,
          },
        );
      } else {
        animation = gsap.to(element, {
          opacity: 0,
          y: travel,
          duration: options.exitDuration,
          ease: options.exitEase,
          paused: true,
          onComplete: complete,
          onInterrupt: interrupt,
        });
      }

      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) {
        onAbort();
        return;
      }
      animation.play();
    } catch (error) {
      if (!settled) {
        settled = true;
        removeAbort();
        try { revert(); }
        catch { /* Preserve the original GSAP failure. */ }
        reject(error);
      }
    }
  });
}

/**
 * Create a TOAST-180 animation driver from a caller-supplied GSAP instance.
 * The driver never discovers window.gsap and never owns reduced-motion policy.
 */
export function createGsapAnimationDriver(
  gsap: GsapLike,
  options: GsapToastAnimationOptions = {},
): ToastAnimationDriver {
  validateGsap(gsap);
  const resolved = resolveOptions(options);

  return Object.freeze({
    name: 'gsap',
    enter: (context: ToastAnimationContext) => animate(gsap, context, resolved),
    exit: (context: ToastAnimationContext) => animate(gsap, context, resolved),
  });
}
