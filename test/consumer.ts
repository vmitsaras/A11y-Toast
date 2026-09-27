import './history-consumer.js';
import { createToast, addToastEventListener, TOAST_EVENTS } from 'a11y-toast';
import type { ToastInput, ToastAddon, ToastAnimationDriver, ToastEventMap, ToastEventName } from 'a11y-toast';
import { docs } from 'a11y-toast/docs';
import { createProgressAddon } from 'a11y-toast/addons/progress';
import { trackToastPromise } from 'a11y-toast/addons/promise';
import { createDedupeController } from 'a11y-toast/addons/dedupe';
import { createDomEventAdapter } from 'a11y-toast/adapters/dom-events';
import { createMenuButtonAsyncStateToastAdapter } from 'a11y-toast/adapters/menu-button-async-state';
import { createAriaNotifyTransport } from 'a11y-toast/transports/aria-notify';
import { createGsapAnimationDriver } from 'a11y-toast/animations/gsap';
import { createGsapFlipLayoutAddon } from 'a11y-toast/animations/gsap-flip';
import { createElementViewTransitionDriver } from 'a11y-toast/animations/view-transition';
import { createDiagnosticsAddon } from 'a11y-toast/addons/diagnostics';
import type { ToastDiagnostic } from 'a11y-toast/addons/diagnostics';
import { gsap } from 'gsap';
import Flip from 'gsap/Flip';
declare const root: HTMLElement;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
export type ToastEventNamesMatchConstants = Assert<Equal<ToastEventName, (typeof TOAST_EVENTS)[keyof typeof TOAST_EVENTS]>>;
export type ToastEventMapKeysMatchNames = Assert<Equal<keyof ToastEventMap, ToastEventName>>;
const logger: ToastAddon = {
  name: 'consumer-test',
  setup(context) {
    return context.on(TOAST_EVENTS.show, event => { const message: string = event.detail.toast.message; void message; });
  },
};
const animation: ToastAnimationDriver = createGsapAnimationDriver(gsap, {
  enterDuration: 0.15,
  exitDuration: 0.12,
});
const experimentalTransport = createAriaNotifyTransport();
const toast = createToast(root, {
  addons: [logger, createProgressAddon(), createGsapFlipLayoutAddon(gsap, Flip), createDiagnosticsAddon({
    report(diagnostic: ToastDiagnostic) {
      const code: string = diagnostic.code;
      void code;
      // @ts-expect-error Diagnostic payloads are readonly.
      diagnostic.metadata.reason = 'changed';
    },
  })],
  animation,
  announcementTransport: experimentalTransport,
});
const input: ToastInput = { message: 'Saved', priority: 'polite', action: { label: 'Undo', onClick: async ({ signal }) => { if (signal.aborted) return; } } };
const id = toast.show(input);
if (id !== null) toast.update(id, { message: 'Updated' });
const tracked = trackToastPromise(toast, Promise.resolve('ok'), {
  loading: 'Saving…',
  success: { message: 'Saved', duration: 5000 },
  error: { message: 'Could not save. Try again.', persistent: true },
});
void tracked.promise;
const dedupe = createDedupeController(toast);
void dedupe.show({ key: 'save-status', message: 'Saved' });
const source = new EventTarget();
const adapter = createDomEventAdapter(toast, {
  target: source,
  announcementOwner: 'toast',
  bindings: [{
    event: 'demo:status',
    map: event => event instanceof CustomEvent
      ? { type: 'show', correlationKey: 'demo', input: { message: String(event.detail) } }
      : { type: 'ignore' },
  }],
});
adapter.destroy();
declare const menuRoot: HTMLElement;
const menuAdapter = createMenuButtonAsyncStateToastAdapter(toast, menuRoot);
menuAdapter.destroy();
addToastEventListener(root, TOAST_EVENTS.drop, event => { const reason: 'queue-full' | 'clearing' = event.detail.reason; void reason; });
// @ts-expect-error Unsupported ARIA politeness is rejected by the public declaration contract.
toast.show({ message: 'Invalid', priority: 'loud' });
// @ts-expect-error Snapshot state cannot be mutated by consumers.
if (id) toast.getToast(id)!.message = 'Cannot mutate';
void docs;

const experimentalViewTransition = createElementViewTransitionDriver();
void experimentalViewTransition;

// Decorative icon and action layout declarations.
const fontIcon: HTMLElement = document.createElement('i');
const vectorIcon: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
toast.show({ message: 'Saved', icon: fontIcon, actionLayout: 'inline' });
toast.show({ message: 'Saved', icon: vectorIcon, actionLayout: 'stacked' });
if (id !== null) toast.update(id, { icon: null, actionLayout: 'inline' });
// @ts-expect-error HTML strings are not accepted as icons.
toast.show({ message: 'Saved', icon: '<svg></svg>' });
// @ts-expect-error The action layout vocabulary is bounded.
toast.show({ message: 'Saved', actionLayout: 'floating' });
// @ts-expect-error Snapshots never expose icon DOM.
toast.getToast('id')?.icon;
