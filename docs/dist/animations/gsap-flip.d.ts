import { a as ToastAddon } from "../types-MxcqocoB.js";

//#region src/animations/gsap-flip.d.ts
interface GsapPluginRegistrarLike {
  registerPlugin(...plugins: unknown[]): unknown;
}
interface GsapFlipAnimationLike {
  kill?(): unknown;
}
interface GsapFlipLike {
  getState(targets: Element[], vars?: Record<string, unknown>): unknown;
  from(state: unknown, vars: Record<string, unknown>): GsapFlipAnimationLike;
  killFlipsOf(targets: Element[], complete?: boolean): unknown;
}
interface GsapFlipLayoutOptions {
  /** Seconds. Defaults to 0.2. Set 0 to disable layout motion. */
  duration?: number;
  /** GSAP ease string. Defaults to power1.inOut. */
  ease?: string;
  /** Optional diagnostics for asynchronous Flip failures. */
  onError?: (error: unknown) => void;
}
/**
 * Animate only surviving toast layout movement. Enter/exit remains owned by the
 * manager's normal animation driver (CSS/GSAP/etc).
 */
declare function createGsapFlipLayoutAddon(gsap: GsapPluginRegistrarLike, Flip: GsapFlipLike, options?: GsapFlipLayoutOptions): ToastAddon;
//#endregion
export { GsapFlipAnimationLike, GsapFlipLayoutOptions, GsapFlipLike, GsapPluginRegistrarLike, createGsapFlipLayoutAddon };
//# sourceMappingURL=gsap-flip.d.ts.map