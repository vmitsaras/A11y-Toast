import { createToast, addToastEventListener, TOAST_EVENTS } from 'a11y-toast';
import type { ToastInput, ToastAddon, ToastAnimationDriver } from 'a11y-toast';
import { docs } from 'a11y-toast/docs';
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
const toast = createToast(root, { addons: [logger], animation });
const input: ToastInput = { message: 'Saved', priority: 'polite', action: { label: 'Undo', onClick: async ({ signal }) => { if (signal.aborted) return; } } };
const id = toast.show(input);
if (id !== null) toast.update(id, { message: 'Updated' });
addToastEventListener(root, TOAST_EVENTS.drop, event => { const reason: 'queue-full' | 'clearing' = event.detail.reason; void reason; });
// @ts-expect-error Unsupported ARIA politeness is rejected by the public declaration contract.
toast.show({ message: 'Invalid', priority: 'loud' });
// @ts-expect-error Snapshot state cannot be mutated by consumers.
if (id) toast.getToast(id)!.message = 'Cannot mutate';
void docs;
