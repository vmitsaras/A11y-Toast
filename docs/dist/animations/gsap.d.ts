import { l as ToastAnimationDriver } from "../types-MxcqocoB.js";

//#region src/animations/gsap.d.ts
interface GsapAnimationLike {
  play(): unknown;
  revert(): unknown;
}
interface GsapLike {
  fromTo(target: Element, fromVars: Record<string, unknown>, toVars: Record<string, unknown>): GsapAnimationLike;
  to(target: Element, vars: Record<string, unknown>): GsapAnimationLike;
}
interface GsapToastAnimationOptions {
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
/**
 * Create a TOAST-180 animation driver from a caller-supplied GSAP instance.
 * The driver never discovers window.gsap and never owns reduced-motion policy.
 */
declare function createGsapAnimationDriver(gsap: GsapLike, options?: GsapToastAnimationOptions): ToastAnimationDriver;
//#endregion
export { GsapAnimationLike, GsapLike, GsapToastAnimationOptions, createGsapAnimationDriver };
//# sourceMappingURL=gsap.d.ts.map