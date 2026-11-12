import { createToast, addToastEventListener, TOAST_EVENTS } from './dist/index.js';
import { trackToastPromise } from './dist/addons/promise.js';

const root = document.querySelector('[data-a11y-toast]');
const result = document.querySelector('[data-result]');
const feedback = document.querySelector('[data-feedback]');
const loadingButton = document.querySelector('[data-example="loading"]');
const manager = createToast(root);
const removers = [];
let loadingTask = null;
let disposed = false;
let resetting = false;

function listen(target, type, listener) {
  target.addEventListener(type, listener);
  removers.push(() => target.removeEventListener(type, listener));
}
function clearFeedback() { feedback.hidden = true; feedback.textContent = ''; }
function reportFailure(message = 'The example could not run. Reset the examples and try again.') {
  feedback.textContent = message;
  feedback.hidden = false;
}
function show(input, origin) {
  clearFeedback();
  try {
    const id = manager.show({ ...input, origin, priority: 'polite' });
    if (id) result.textContent = input.message;
    else reportFailure('The notification queue is full. Close a notification or reset the examples.');
    return id;
  } catch { reportFailure(); return null; }
}
function stopLoading() {
  const task = loadingTask;
  if (!task) return;
  loadingTask = null;
  window.clearTimeout(task.timer);
  task.handle?.stop();
  task.finish();
  loadingButton.removeAttribute('aria-disabled');
}
function startLoading(origin) {
  if (loadingTask || disposed) return;
  clearFeedback();
  let finish;
  const operation = new Promise(resolve => { finish = resolve; });
  const task = { timer: null, handle: null, finish };
  loadingTask = task;
  loadingButton.setAttribute('aria-disabled', 'true');
  try {
    task.handle = trackToastPromise(manager, operation, {
      loading: { message: 'Preparing your report…', priority: 'polite', origin },
      success: { message: 'Your report is ready.', tone: 'success', persistent: false, duration: 5000 },
      error: { message: 'The report could not be prepared. Try again.', persistent: true },
    });
    if (!task.handle.id || !manager.getToast(task.handle.id)) {
      stopLoading();
      reportFailure('The notification queue is full. Close a notification or reset the examples.');
      return;
    }
    result.textContent = 'Preparing your report…';
    task.timer = window.setTimeout(() => { task.timer = null; finish(); }, 900);
    void operation.then(() => {
      if (loadingTask !== task || disposed) return;
      if (manager.getToast(task.handle.id)) result.textContent = 'Your report is ready.';
      stopLoading();
    });
  } catch { stopLoading(); reportFailure(); }
}

for (const button of document.querySelectorAll('[data-example]')) {
  listen(button, 'click', () => {
    if (disposed) return;
    if (button.dataset.example === 'loading') { startLoading(button); return; }
    if (button.dataset.example === 'success') { show({ message: 'Settings saved.', tone: 'success' }, button); return; }
    const undo = button.dataset.example === 'undo';
    show({
      message: undo ? 'Message deleted.' : 'Your changes could not be synced.',
      tone: undo ? 'success' : 'error', persistent: true,
      action: {
        label: undo ? 'Undo' : 'Retry',
        onClick: ({ instance, id }) => {
          const message = undo ? 'Message restored.' : 'Your changes are synced.';
          if (instance.update(id, { message, tone: 'success', action: null, persistent: false, duration: 5000 })) result.textContent = message;
        },
      },
    }, button);
  });
  button.disabled = false;
}
removers.push(addToastEventListener(root, TOAST_EVENTS.dismiss, event => {
  if (event.detail.instance !== manager || !loadingTask?.handle || event.detail.toast.id !== loadingTask.handle.id) return;
  stopLoading();
  if (!resetting && !disposed) result.textContent = 'Report export cancelled.';
}));
const reset = document.querySelector('[data-reset]');
listen(reset, 'click', () => {
  if (disposed) return;
  resetting = true;
  stopLoading();
  manager.dismissAll();
  resetting = false;
  clearFeedback();
  result.textContent = 'Examples reset. Choose another example.';
});
reset.disabled = false;
document.querySelector('[data-boot]').hidden = true;
listen(window, 'pagehide', event => {
  if (event.persisted) return;
  disposed = true;
  stopLoading();
  manager.destroy();
  for (const remove of removers) remove();
});

// Demo-only inspection for the served-browser checks, not a package singleton.
export function getDemoManager() { return manager; }
