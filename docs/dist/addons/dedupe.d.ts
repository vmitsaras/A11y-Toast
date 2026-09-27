import { C as ToastInput, S as ToastId, w as ToastInstance } from "../types-MxcqocoB.js";

//#region src/addons/dedupe.d.ts
type ToastDedupePolicy = 'update-existing' | 'drop-new' | 'replace-existing';
type ToastDedupeStatus = 'shown' | 'updated' | 'kept-existing' | 'replaced' | 'rejected' | 'stopped';
interface ToastDedupeOptions {
  /** Default policy. Defaults to update-existing. */
  policy?: ToastDedupePolicy;
}
interface ToastDedupeResult {
  readonly id: ToastId | null;
  readonly previousId: ToastId | null;
  readonly status: ToastDedupeStatus;
}
interface ToastDedupeController {
  readonly instance: ToastInstance;
  readonly policy: ToastDedupePolicy;
  readonly isDestroyed: boolean;
  show(input: ToastInput, policy?: ToastDedupePolicy): Promise<ToastDedupeResult>;
  destroy(): void;
}
declare function createDedupeController(instance: ToastInstance, options?: ToastDedupeOptions): ToastDedupeController;
//#endregion
export { ToastDedupeController, ToastDedupeOptions, ToastDedupePolicy, ToastDedupeResult, ToastDedupeStatus, createDedupeController };
//# sourceMappingURL=dedupe.d.ts.map