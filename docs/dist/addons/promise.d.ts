import { C as ToastInput, S as ToastId, w as ToastInstance } from "../types-MxcqocoB.js";

//#region src/addons/promise.d.ts
type ToastPromiseLoadingState = string | Omit<ToastInput, 'tone' | 'persistent' | 'duration'>;
type ToastPromiseOutcomeState = string | ToastInput;
interface ToastPromiseStates {
  loading: ToastPromiseLoadingState;
  success: ToastPromiseOutcomeState;
  /** Required caller-authored user-facing copy. Rejection values are never rendered automatically. */
  error: ToastPromiseOutcomeState;
}
interface ToastPromiseHandle<T> {
  readonly id: ToastId | null;
  readonly promise: Promise<T>;
  /** Stop toast orchestration only. The underlying promise/operation is not cancelled. */
  stop(): boolean;
}
declare function trackToastPromise<T>(instance: ToastInstance, operation: PromiseLike<T>, states: ToastPromiseStates): ToastPromiseHandle<T>;
//#endregion
export { ToastPromiseHandle, ToastPromiseLoadingState, ToastPromiseOutcomeState, ToastPromiseStates, trackToastPromise };
//# sourceMappingURL=promise.d.ts.map