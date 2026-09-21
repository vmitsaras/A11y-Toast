import { i as ToastAddon } from "../types-CViYp0UD.js";

//#region src/addons/diagnostics.d.ts
declare const TOAST_DIAGNOSTICS_ADDON_NAME = "diagnostics";
declare const TOAST_DIAGNOSTIC_DEFAULTS: Readonly<{
  assertiveCount: 3;
  assertiveWindowMs: 10000;
}>;
declare const TOAST_DIAGNOSTIC_LIMITS: Readonly<{
  minAssertiveCount: 2;
  maxAssertiveCount: 100;
  minAssertiveWindowMs: 1000;
  maxAssertiveWindowMs: 60000;
  minLongMessageLength: 1;
  maxLongMessageLength: 100000;
}>;
type ToastDiagnosticCode = 'timed-action' | 'timed-assertive' | 'queue-rejection' | 'assertive-burst' | 'announcement-error' | 'animation-error' | 'action-error' | 'addon-error' | 'long-message';
type ToastDiagnosticSeverity = 'warning' | 'advisory';
interface ToastDiagnosticMetadata {
  readonly reason?: string;
  readonly phase?: string;
  readonly sourceAddon?: string;
  readonly driver?: string;
  readonly transport?: string;
  readonly duration?: number;
  readonly messageLength?: number;
  readonly observedCount?: number;
  readonly windowMs?: number;
  readonly threshold?: number;
}
interface ToastDiagnostic {
  readonly code: ToastDiagnosticCode;
  readonly severity: ToastDiagnosticSeverity;
  readonly timestamp: number;
  readonly instanceId: string;
  readonly toastId: string | null;
  readonly metadata: Readonly<ToastDiagnosticMetadata>;
}
interface ToastDiagnosticsOptions {
  report(diagnostic: ToastDiagnostic): void;
  assertiveCount?: number;
  assertiveWindowMs?: number;
  longMessageLength?: number;
}
/**
 * Observe one manager for advisory development signals. The reporter is the only
 * output: this add-on never writes to the console, DOM, storage, telemetry or network.
 */
declare function createDiagnosticsAddon(options: ToastDiagnosticsOptions): ToastAddon;
//#endregion
export { TOAST_DIAGNOSTICS_ADDON_NAME, TOAST_DIAGNOSTIC_DEFAULTS, TOAST_DIAGNOSTIC_LIMITS, ToastDiagnostic, ToastDiagnosticCode, ToastDiagnosticMetadata, ToastDiagnosticSeverity, ToastDiagnosticsOptions, createDiagnosticsAddon };
//# sourceMappingURL=diagnostics.d.ts.map