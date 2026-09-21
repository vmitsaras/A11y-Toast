// This file is imported by test/consumer.ts and is compile-only.
import { createHistoryController, TOAST_HISTORY_DEFAULTS, TOAST_HISTORY_LIMITS, TOAST_HISTORY_ADDON_NAME } from 'a11y-toast/addons/history';
import type { ToastHistoryController, ToastHistoryEntry, ToastHistoryEvent, ToastHistoryOptions } from 'a11y-toast/addons/history';
import type { ToastInstance } from 'a11y-toast';
declare const toast: ToastInstance;
const options: ToastHistoryOptions = { maxEntries: 25 };
const history: ToastHistoryController = createHistoryController(toast, options);
const entries: readonly ToastHistoryEntry[] = history.getEntries();
const event: ToastHistoryEvent | undefined = entries[0]?.type;
const removed: number = history.clear();
void [event, removed, TOAST_HISTORY_DEFAULTS, TOAST_HISTORY_LIMITS, TOAST_HISTORY_ADDON_NAME];
// @ts-expect-error History does not expose a replay method.
history.replay();
// @ts-expect-error Returned entry collections cannot be mutated.
entries.push(entries[0]!);
// @ts-expect-error Snapshot text is readonly.
if (entries[0]) entries[0].toast.message = 'Cannot mutate';
// @ts-expect-error Recorded action metadata never exposes executable callbacks.
if (entries[0]?.toast.action) entries[0].toast.action.onClick();
// @ts-expect-error Capacity is numeric, not a coercible string.
createHistoryController(toast, { maxEntries: '50' });
history.destroy();
