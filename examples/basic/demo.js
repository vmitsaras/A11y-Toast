import { createToast, addToastEventListener, TOAST_EVENTS } from '../../dist/index.js';
import { createProgressAddon } from '../../dist/addons/progress.js';
import { trackToastPromise } from '../../dist/addons/promise.js';
import { createDedupeController } from '../../dist/addons/dedupe.js';

const root = document.querySelector('[data-a11y-toast]');
const form = document.querySelector('#toast-form');
const target = document.querySelector('#target');
const position = form.elements.position;
const animation = form.elements.animation;
const showProgress = form.elements.showProgress;
const showToneLabel = form.elements.showToneLabel;
const log = document.querySelector('[data-log]');
const feedback = document.querySelector('[data-feedback]');
let manager;
let dedupe;
let dedupeSequence = 0;
let loadingId = null;
const removers = [];

function sync(source) {
  const focused = document.activeElement;
  const records = source.getToasts();
  document.querySelector('[data-visible]').textContent = String(source.visibleCount);
  document.querySelector('[data-queued]').textContent = String(source.queuedCount);
  const selected = target.value;
  const items = records.map(record => {
    const option = document.createElement('option');
    option.value = record.id;
    option.textContent = `${record.title || record.message.slice(0, 55)} — ${record.state}`;
    return option;
  });
  if (!items.length) {
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'No notifications';
    items.push(empty);
  }
  target.replaceChildren(...items);
  if (records.some(record => record.id === selected)) target.value = selected;
  else if (records.length) target.value = records.at(-1).id;
  target.disabled = !records.length;
  const surfaceActive = Boolean(root.querySelector('[data-a11y-toast-id]'));
  position.disabled = surfaceActive;
  animation.disabled = surfaceActive;
  showProgress.disabled = surfaceActive;
  showToneLabel.disabled = surfaceActive;
  for (const selector of ['[data-update]', '[data-dismiss]', '[data-clear]']) document.querySelector(selector).disabled = !records.length;
  if (loadingId && !source.getToast(loadingId)) loadingId = null;
  document.querySelector('[data-finish-loading]').disabled = !loadingId;
  document.querySelector('[data-start-loading]').disabled = Boolean(loadingId);
  if (focused instanceof HTMLElement && focused.matches(':disabled')) {
    const next = focused.matches('[data-start-loading]') ? document.querySelector('[data-finish-loading]')
      : focused.matches('[data-finish-loading]') ? document.querySelector('[data-start-loading]')
      : form.querySelector('[type=submit]');
    if (!next.disabled) next.focus({ preventScroll: true });
  }
}
function observe(event) {
  const { instance, toast, reason, phase, driver, status } = event.detail;
  const li = document.createElement('li');
  const time = document.createElement('time');
  const now = new Date(event.detail.timestamp);
  time.dateTime = now.toISOString();
  time.textContent = now.toLocaleTimeString('en-GB');
  const name = document.createElement('span');
  name.textContent = event.type.replace('a11y-toast:', '');
  const detail = document.createElement('small');
  detail.textContent = [toast?.message, reason, phase, driver, status].filter(Boolean).join(' · ') || 'Manager lifecycle';
  li.append(time, name, detail);
  log.prepend(li);
  while (log.children.length > 40) log.lastElementChild.remove();
  sync(instance);
  if (event.type === TOAST_EVENTS.animationEnd) queueMicrotask(() => sync(instance));
}
for (const name of Object.values(TOAST_EVENTS)) removers.push(addToastEventListener(root, name, observe));

function initialize() {
  manager = createToast(root, {
    position: position.value,
    animation: animation.value,
    addons: showProgress.checked ? [createProgressAddon()] : [],
    duration: Number(form.elements.duration.value) * 1000,
    showToneLabel: showToneLabel.checked,
  });
  dedupe = createDedupeController(manager);
  sync(manager);
}
function valid() {
  form.elements.message.setCustomValidity(form.elements.message.value.trim() ? '' : 'Enter a message, not only spaces.');
  return form.reportValidity();
}
function input(origin) {
  const values = new FormData(form);
  const spec = {
    message: String(values.get('message')).trim(), title: String(values.get('title') || ''),
    tone: String(values.get('tone')), priority: String(values.get('priority')),
    announcement: String(values.get('announcement') || ''),
    dismissible: form.elements.dismissible.checked, origin, duration: undefined,
  };
  if (values.get('persistence') === 'persistent') spec.persistent = true;
  else if (values.get('persistence') === 'timed') { spec.persistent = false; spec.duration = Number(values.get('duration')) * 1000; }
  // Do not supply duration for automatic action/assertive defaults: it is an explicit timing override.
  else if (!form.elements.hasAction.checked && spec.tone !== 'loading' && spec.priority !== 'assertive') spec.duration = Number(values.get('duration')) * 1000;
  spec.action = form.elements.hasAction.checked ? {
    label: form.elements.actionLabel.value.trim() || 'Undo demo change',
    onClick: ({ instance, id }) => { instance.update(id, { message: 'Demo change undone. No real data was changed.', tone: 'success', action: null, persistent: false, duration: 5000, announcement: null }); },
  } : null;
  return spec;
}
function safely(callback) {
  feedback.hidden = true;
  try { callback(); }
  catch (error) { feedback.textContent = error instanceof Error ? error.message : 'The operation failed.'; feedback.hidden = false; }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!valid()) return;
  safely(() => manager.show(input(event.submitter)));
});
form.elements.message.addEventListener('input', () => form.elements.message.setCustomValidity(''));
form.elements.hasAction.addEventListener('change', () => { form.elements.actionLabel.disabled = !form.elements.hasAction.checked; });
function reinitializeManager() {
  safely(() => { dedupe?.destroy(); manager.destroy(); initialize(); });
}
position.addEventListener('change', reinitializeManager);
animation.addEventListener('change', reinitializeManager);
showProgress.addEventListener('change', reinitializeManager);
showToneLabel.addEventListener('change', reinitializeManager);
document.querySelector('[data-burst]').addEventListener('click', event => safely(() => {
  for (let i = 1; i <= 5; i++) manager.show({ message: `Queue example ${i} of 5.`, tone: 'info', duration: 7000, origin: event.currentTarget });
}));
document.querySelector('[data-start-loading]').addEventListener('click', event => safely(() => {
  loadingId = manager.loading('Preparing a demo export…', { title: 'Export', origin: event.currentTarget });
  sync(manager);
}));
document.querySelector('[data-finish-loading]').addEventListener('click', () => safely(() => {
  if (loadingId) manager.update(loadingId, { message: 'Your demo export is ready.', tone: 'success', persistent: false, duration: 5000 });
  loadingId = null;
  sync(manager);
}));
document.querySelector('[data-promise-success]').addEventListener('click', event => safely(() => {
  const operation = new Promise(resolve => window.setTimeout(() => resolve('ok'), 900));
  const handle = trackToastPromise(manager, operation, {
    loading: { message: 'Saving a demo item…', title: 'Promise example', origin: event.currentTarget },
    success: { message: 'The demo item was saved.', title: 'Promise example', duration: 5000 },
    error: { message: 'The demo item could not be saved. Try again.', title: 'Promise example', persistent: true },
  });
  void handle.promise;
}));
document.querySelector('[data-promise-error]').addEventListener('click', event => safely(() => {
  const operation = new Promise((_, reject) => window.setTimeout(() => reject(new Error('Intentional private demo failure')), 900));
  const handle = trackToastPromise(manager, operation, {
    loading: { message: 'Saving a demo item…', title: 'Promise example', origin: event.currentTarget },
    success: { message: 'The demo item was saved.', title: 'Promise example', duration: 5000 },
    error: { message: 'The demo item could not be saved. Try again.', title: 'Promise example', persistent: true },
  });
  void handle.promise.catch(() => {});
}));
document.querySelector('[data-retry]').addEventListener('click', event => safely(() => {
  let attempted = false;
  manager.show({
    title: 'Safe retry example', message: 'The first attempt fails on purpose. The second succeeds.', tone: 'info', origin: event.currentTarget,
    action: { label: 'Try demo action', onClick: ({ instance, id }) => {
      if (!attempted) { attempted = true; throw new Error('Intentional demo failure'); }
      instance.update(id, { message: 'The demo action succeeded.', tone: 'success', action: null, persistent: false, duration: 5000 });
    } },
  });
}));
document.querySelector('[data-dedupe]').addEventListener('click', () => safely(() => {
  const key = document.querySelector('#dedupe-key').value.trim();
  const policy = document.querySelector('#dedupe-policy').value;
  dedupeSequence += 1;
  void dedupe.show({
    key,
    message: `Keyed update ${dedupeSequence}`,
    tone: 'info',
    duration: 7000,
  }, policy).catch(error => {
    feedback.textContent = error instanceof Error ? error.message : 'The keyed example failed.';
    feedback.hidden = false;
  });
}));
document.querySelector('[data-update]').addEventListener('click', event => {
  if (!valid()) return;
  safely(() => manager.update(target.value, { ...input(event.currentTarget), persistent: form.elements.persistence.value === 'auto' ? undefined : form.elements.persistence.value === 'persistent' }));
});
document.querySelector('[data-dismiss]').addEventListener('click', () => safely(() => manager.dismiss(target.value)));
document.querySelector('[data-clear]').addEventListener('click', () => { manager.dismissAll(); loadingId = null; sync(manager); });
document.querySelector('[data-clear-log]').addEventListener('click', () => log.replaceChildren());

initialize();
document.querySelector('[data-controls]').disabled = false;
for (const selector of ['[data-burst]', '[data-start-loading]', '[data-retry]', '[data-promise-success]', '[data-promise-error]', '[data-dedupe]', '[data-clear-log]']) document.querySelector(selector).disabled = false;
document.querySelector('[data-boot]').hidden = true;
window.addEventListener('pagehide', event => {
  if (event.persisted) return; // BFCache resumes the same live manager; visibility handles its timers.
  dedupe?.destroy();
  manager.destroy();
  for (const remove of removers) remove();
}, { once: false });

// Demo-only inspection, not a singleton/global runtime API.
export function getDemoManager() { return manager; }
