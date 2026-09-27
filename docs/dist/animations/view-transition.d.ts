import { l as ToastAnimationDriver } from "../types-MxcqocoB.js";

//#region src/animations/view-transition.d.ts

/**
 * Experimental TOAST-180 driver using Element.startViewTransition().
 * Unsupported browsers settle immediately with no decorative motion.
 * Document.startViewTransition() is never used as a fallback.
 *
 * Motion distance/timing are stylesheet concerns so this driver never writes
 * inline styles. See a11y-toast/animations/view-transition.css.
 */
declare function createElementViewTransitionDriver(): ToastAnimationDriver;
//#endregion
export { createElementViewTransitionDriver };
//# sourceMappingURL=view-transition.d.ts.map