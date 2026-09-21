//#region src/animation.ts
function parseTime(value) {
	const trimmed = value.trim();
	if (trimmed.endsWith("ms")) return Number.parseFloat(trimmed) || 0;
	if (trimmed.endsWith("s")) return (Number.parseFloat(trimmed) || 0) * 1e3;
	return 0;
}
function maxAnimationTime(style) {
	const durations = style.animationDuration.split(",").map(parseTime);
	const delays = style.animationDelay.split(",").map(parseTime);
	const names = style.animationName.split(",").map((value) => value.trim());
	const count = Math.max(durations.length, delays.length, names.length);
	let max = 0;
	for (let i = 0; i < count; i++) {
		if ((names[i % names.length] ?? "none") === "none") continue;
		max = Math.max(max, (durations[i % durations.length] ?? 0) + (delays[i % delays.length] ?? 0));
	}
	return max;
}
function prefersReducedMotion(win) {
	return typeof win.matchMedia === "function" && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function waitForCssAnimation(win, element, phase, signal) {
	if (signal.aborted) return Promise.reject(new DOMException("Animation aborted", "AbortError"));
	const total = maxAnimationTime(win.getComputedStyle(element));
	if (total <= 0) return Promise.resolve();
	return new Promise((resolve, reject) => {
		let settled = false;
		const cleanup = () => {
			element.removeEventListener("animationend", onEnd);
			element.removeEventListener("animationcancel", onCancel);
			signal.removeEventListener("abort", onAbort);
			win.clearTimeout(timeout);
		};
		const finish = () => {
			if (settled) return;
			settled = true;
			cleanup();
			resolve();
		};
		const fail = () => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(new DOMException(`${phase} animation aborted`, "AbortError"));
		};
		const onEnd = (event) => {
			if (event.target === element) finish();
		};
		const onCancel = (event) => {
			if (event.target === element) fail();
		};
		const onAbort = () => fail();
		const timeout = win.setTimeout(finish, Math.ceil(total) + 80);
		element.addEventListener("animationend", onEnd);
		element.addEventListener("animationcancel", onCancel);
		signal.addEventListener("abort", onAbort, { once: true });
	});
}

//#endregion
export { waitForCssAnimation as n, prefersReducedMotion as t };
//# sourceMappingURL=animation-DqMS0Z8l.js.map