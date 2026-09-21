import { t as TOAST_EVENTS } from "../events-D6MCpthx.js";

//#region src/addons/diagnostics.ts
const TOAST_DIAGNOSTICS_ADDON_NAME = "diagnostics";
const TOAST_DIAGNOSTIC_DEFAULTS = Object.freeze({
	assertiveCount: 3,
	assertiveWindowMs: 1e4
});
const TOAST_DIAGNOSTIC_LIMITS = Object.freeze({
	minAssertiveCount: 2,
	maxAssertiveCount: 100,
	minAssertiveWindowMs: 1e3,
	maxAssertiveWindowMs: 6e4,
	minLongMessageLength: 1,
	maxLongMessageLength: 1e5
});
function integerOption(name, value, fallback, min, max) {
	const resolved = value === void 0 ? fallback : value;
	if (typeof resolved !== "number" || !Number.isFinite(resolved) || !Number.isInteger(resolved) || resolved < min || resolved > max) throw new TypeError(`Toast diagnostics ${name} must be an integer from ${min} to ${max}.`);
	return resolved;
}
/**
* Observe one manager for advisory development signals. The reporter is the only
* output: this add-on never writes to the console, DOM, storage, telemetry or network.
*/
function createDiagnosticsAddon(options) {
	if (!options || typeof options !== "object") throw new TypeError("Toast diagnostics options must be an object.");
	if (typeof options.report !== "function") throw new TypeError("Toast diagnostics requires a synchronous report callback.");
	const report = options.report;
	const assertiveCount = integerOption("assertiveCount", options.assertiveCount, TOAST_DIAGNOSTIC_DEFAULTS.assertiveCount, TOAST_DIAGNOSTIC_LIMITS.minAssertiveCount, TOAST_DIAGNOSTIC_LIMITS.maxAssertiveCount);
	const assertiveWindowMs = integerOption("assertiveWindowMs", options.assertiveWindowMs, TOAST_DIAGNOSTIC_DEFAULTS.assertiveWindowMs, TOAST_DIAGNOSTIC_LIMITS.minAssertiveWindowMs, TOAST_DIAGNOSTIC_LIMITS.maxAssertiveWindowMs);
	const longMessageLength = options.longMessageLength === void 0 ? void 0 : integerOption("longMessageLength", options.longMessageLength, TOAST_DIAGNOSTIC_LIMITS.minLongMessageLength, TOAST_DIAGNOSTIC_LIMITS.minLongMessageLength, TOAST_DIAGNOSTIC_LIMITS.maxLongMessageLength);
	const setup = (context) => {
		const active = /* @__PURE__ */ new Map();
		const assertiveTimestamps = [];
		let burstReported = false;
		const emit = (code, severity, timestamp, toastId, metadata = {}) => {
			report(Object.freeze({
				code,
				severity,
				timestamp,
				instanceId: context.instance.instanceId,
				toastId,
				metadata: Object.freeze({ ...metadata })
			}));
		};
		const condition = (toast, code, matches, severity, timestamp, metadata) => {
			let codes = active.get(toast.id);
			if (!matches) {
				codes?.delete(code);
				if (codes?.size === 0) active.delete(toast.id);
				return;
			}
			if (!codes) {
				codes = /* @__PURE__ */ new Set();
				active.set(toast.id, codes);
			}
			if (codes.has(code)) return;
			codes.add(code);
			emit(code, severity, timestamp, toast.id, metadata);
		};
		const inspect = (toast, timestamp) => {
			const timed = !toast.persistent && toast.duration > 0;
			condition(toast, "timed-action", timed && toast.action !== null, "warning", timestamp, { duration: toast.duration });
			condition(toast, "timed-assertive", timed && toast.priority === "assertive", "warning", timestamp, { duration: toast.duration });
			if (longMessageLength !== void 0) {
				const messageLength = [...toast.message].length;
				condition(toast, "long-message", messageLength > longMessageLength, "advisory", timestamp, {
					messageLength,
					threshold: longMessageLength
				});
			}
		};
		const clear = () => {
			active.clear();
			assertiveTimestamps.length = 0;
			burstReported = false;
		};
		context.on(TOAST_EVENTS.show, ({ detail }) => inspect(detail.toast, detail.timestamp));
		context.on(TOAST_EVENTS.update, ({ detail }) => inspect(detail.toast, detail.timestamp));
		context.on(TOAST_EVENTS.dismiss, ({ detail }) => active.delete(detail.toast.id));
		context.on(TOAST_EVENTS.drop, ({ detail }) => {
			active.delete(detail.toast.id);
			emit("queue-rejection", "warning", detail.timestamp, detail.toast.id, { reason: detail.reason });
		});
		context.on(TOAST_EVENTS.announce, ({ detail }) => {
			if (detail.priority !== "assertive") return;
			const cutoff = detail.timestamp - assertiveWindowMs;
			while ((assertiveTimestamps[0] ?? Number.POSITIVE_INFINITY) < cutoff) assertiveTimestamps.shift();
			assertiveTimestamps.push(detail.timestamp);
			while (assertiveTimestamps.length > assertiveCount) assertiveTimestamps.shift();
			if (assertiveTimestamps.length < assertiveCount) burstReported = false;
			if (assertiveTimestamps.length >= assertiveCount && !burstReported) {
				burstReported = true;
				emit("assertive-burst", "warning", detail.timestamp, detail.toast.id, {
					observedCount: assertiveTimestamps.length,
					windowMs: assertiveWindowMs,
					threshold: assertiveCount
				});
			}
		});
		context.on(TOAST_EVENTS.announcementError, ({ detail }) => emit("announcement-error", "warning", detail.timestamp, detail.toast.id, { transport: detail.transport }));
		context.on(TOAST_EVENTS.animationError, ({ detail }) => emit("animation-error", "warning", detail.timestamp, detail.toast.id, {
			phase: detail.phase,
			driver: detail.driver
		}));
		context.on(TOAST_EVENTS.actionError, ({ detail }) => emit("action-error", "warning", detail.timestamp, detail.toast.id));
		context.on(TOAST_EVENTS.addonError, ({ detail }) => {
			if (detail.addon === TOAST_DIAGNOSTICS_ADDON_NAME) return;
			emit("addon-error", "warning", detail.timestamp, null, {
				sourceAddon: detail.addon,
				phase: detail.phase
			});
		});
		context.on(TOAST_EVENTS.destroy, clear);
		context.signal.addEventListener("abort", clear, { once: true });
		return () => {
			context.signal.removeEventListener("abort", clear);
			clear();
		};
	};
	return Object.freeze({
		name: TOAST_DIAGNOSTICS_ADDON_NAME,
		setup
	});
}

//#endregion
export { TOAST_DIAGNOSTICS_ADDON_NAME, TOAST_DIAGNOSTIC_DEFAULTS, TOAST_DIAGNOSTIC_LIMITS, createDiagnosticsAddon };
//# sourceMappingURL=diagnostics.js.map