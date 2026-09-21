//#region src/animations/gsap.ts
function finiteNumber(value, fallback, label) {
	if (value === void 0) return fallback;
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be a finite number greater than or equal to 0.`);
	return value;
}
function nonEmpty(value, fallback, label) {
	if (value === void 0) return fallback;
	if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be a non-empty string.`);
	return value.trim();
}
function resolveOptions(options) {
	return Object.freeze({
		enterDuration: finiteNumber(options.enterDuration, .15, "GSAP enterDuration"),
		exitDuration: finiteNumber(options.exitDuration, .12, "GSAP exitDuration"),
		enterEase: nonEmpty(options.enterEase, "power1.out", "GSAP enterEase"),
		exitEase: nonEmpty(options.exitEase, "power1.in", "GSAP exitEase"),
		distance: finiteNumber(options.distance, 4, "GSAP distance")
	});
}
function validateGsap(value) {
	if (!value || typeof value !== "object") throw new TypeError("createGsapAnimationDriver requires a GSAP instance.");
	const candidate = value;
	if (typeof candidate.fromTo !== "function" || typeof candidate.to !== "function") throw new TypeError("GSAP instance must provide fromTo() and to().");
}
function direction(context, distance) {
	return context.instance.options.position.startsWith("top") ? -distance : distance;
}
function animate(gsap, context, options) {
	const { element, phase, signal } = context;
	if (signal.aborted) return Promise.reject(new DOMException("GSAP animation aborted.", "AbortError"));
	const initialStyle = element.getAttribute("style");
	const travel = direction(context, options.distance);
	return new Promise((resolve, reject) => {
		let animation = null;
		let settled = false;
		let reverting = false;
		const removeAbort = () => signal.removeEventListener("abort", onAbort);
		const revert = () => {
			if (!animation) return;
			reverting = true;
			try {
				animation.revert();
			} finally {
				if (initialStyle === null) element.removeAttribute("style");
				else element.setAttribute("style", initialStyle);
				reverting = false;
			}
		};
		const complete = () => {
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
		const interrupt = () => {
			if (settled || reverting) return;
			settled = true;
			removeAbort();
			try {
				revert();
			} catch {}
			reject(/* @__PURE__ */ new Error(`GSAP ${phase} animation was interrupted before completion.`));
		};
		const onAbort = () => {
			if (settled) return;
			settled = true;
			removeAbort();
			try {
				revert();
			} catch {}
			reject(new DOMException(`GSAP ${phase} animation aborted.`, "AbortError"));
		};
		try {
			if (phase === "enter") animation = gsap.fromTo(element, {
				opacity: 0,
				y: travel
			}, {
				opacity: 1,
				y: 0,
				duration: options.enterDuration,
				ease: options.enterEase,
				paused: true,
				onComplete: complete,
				onInterrupt: interrupt
			});
			else animation = gsap.to(element, {
				opacity: 0,
				y: travel,
				duration: options.exitDuration,
				ease: options.exitEase,
				paused: true,
				onComplete: complete,
				onInterrupt: interrupt
			});
			signal.addEventListener("abort", onAbort, { once: true });
			if (signal.aborted) {
				onAbort();
				return;
			}
			animation.play();
		} catch (error) {
			if (!settled) {
				settled = true;
				removeAbort();
				try {
					revert();
				} catch {}
				reject(error);
			}
		}
	});
}
/**
* Create a TOAST-180 animation driver from a caller-supplied GSAP instance.
* The driver never discovers window.gsap and never owns reduced-motion policy.
*/
function createGsapAnimationDriver(gsap, options = {}) {
	validateGsap(gsap);
	const resolved = resolveOptions(options);
	return Object.freeze({
		name: "gsap",
		enter: (context) => animate(gsap, context, resolved),
		exit: (context) => animate(gsap, context, resolved)
	});
}

//#endregion
export { createGsapAnimationDriver };
//# sourceMappingURL=gsap.js.map