import { createToast, addToastEventListener, TOAST_EVENTS } from 'a11y-toast';
import type { ToastInput, ToastAddon, ToastAnimationDriver } from 'a11y-toast';
import { docs } from 'a11y-toast/docs';
import { createProgressAddon } from 'a11y-toast/addons/progress';
import { trackToastPromise } from 'a11y-toast/addons/promise';
import { createDedupeController } from 'a11y-toast/addons/dedupe';
import { createDomEventAdapter } from 'a11y-toast/adapters/dom-events';
import { createMenuButtonAsyncStateToastAdapter } from 'a11y-toast/adapters/menu-button-async-state';
declare const root: HTMLElement;
const logger: ToastAddon = {
  name: 'consumer-test',
  setup(context) {
    return context.on(TOAST_EVENTS.show, event => { const message: string = event.detail.toast.message; void message; });
  },
};
const animation: ToastAnimationDriver = {
  name: 'consumer-test',
  enter({ element, signal }) { if (!signal.aborted) void element; },
};
const toast = createToast(root, { addons: [logger, createProgressAddon()], animation });
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
