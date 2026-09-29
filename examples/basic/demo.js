import { createHistoryDemo } from './history-demo.js';
import { createToast, addToastEventListener, TOAST_EVENTS } from '../../dist/index.js';
import { createProgressAddon } from '../../dist/addons/progress.js';
import { trackToastPromise } from '../../dist/addons/promise.js';
import { createDedupeController } from '../../dist/addons/dedupe.js';
import { createDiagnosticsAddon } from '../../dist/addons/diagnostics.js';
import { createDomEventAdapter } from '../../dist/adapters/dom-events.js';
import { createAriaNotifyTransport } from '../../dist/transports/aria-notify.js';
import { createGsapAnimationDriver } from '../../dist/animations/gsap.js';
import { createGsapFlipLayoutAddon } from '../../dist/animations/gsap-flip.js';
import { createElementViewTransitionDriver } from '../../dist/animations/view-transition.js';
import { gsap } from '../../node_modules/gsap/index.js';
import Flip from '../../node_modules/gsap/Flip.js';

const root = document.querySelector('[data-a11y-toast]');
const form = document.querySelector('#toast-form');
const target = document.querySelector('#target');
const position = form.elements.position;
const animation = form.elements.animation;
const animationEffect = form.elements.animationEffect;
const announcementTransport = form.elements.announcementTransport;
const showProgress = form.elements.showProgress;
const showFlipLayout = form.elements.showFlipLayout;
const showToneLabel = form.elements.showToneLabel;
const enableDiagnostics = form.elements.enableDiagnostics;
const toastSkin = form.elements.toastSkin;
const log = document.querySelector('[data-log]');
const feedback = document.querySelector('[data-feedback]');
const adapterOwner = document.querySelector('#adapter-owner');
const sourceStatus = document.querySelector('[data-source-status]');
const sourceEvents = new EventTarget();
const asyncForm = document.querySelector('[data-async-form]');
const asyncOwner = document.querySelector('#async-owner');
const asyncStatus = document.querySelector('[data-async-status]');
const asyncEvents = new EventTarget();
const diagnosticsReport = document.querySelector('[data-diagnostics-report]');
const diagnostics = [];
let manager;
let historyDemo;
let dedupe;
let domAdapter;
let asyncAdapter;
let asyncTimer;
let asyncSaving = false;
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
  animationEffect.disabled = surfaceActive || animation.value === 'none';
  announcementTransport.disabled = surfaceActive;
  showProgress.disabled = surfaceActive;
  showFlipLayout.disabled = surfaceActive;
  showToneLabel.disabled = surfaceActive;
  enableDiagnostics.disabled = surfaceActive;
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
function renderDiagnostics() {
  const items = diagnostics.map(diagnostic => {
    const li = document.createElement('li');
    const time = document.createElement('time');
    const recorded = new Date(diagnostic.timestamp);
    time.dateTime = recorded.toISOString();
    time.textContent = recorded.toLocaleTimeString('en-GB');
    const code = document.createElement('span');
    code.textContent = diagnostic.code;
    const detail = document.createElement('small');
    detail.textContent = `${diagnostic.severity}${diagnostic.toastId ? ` · ${diagnostic.toastId}` : ''}`;
    li.append(time, code, detail);
    return li;
  });
  diagnosticsReport.replaceChildren(...items.reverse());
}
function observe(event) {
  const { instance, toast, reason, phase, driver, status, transport, fallback } = event.detail;
  const li = document.createElement('li');
  const time = document.createElement('time');
  const now = new Date(event.detail.timestamp);
  time.dateTime = now.toISOString();
  time.textContent = now.toLocaleTimeString('en-GB');
  const name = document.createElement('span');
  name.textContent = event.type.replace('a11y-toast:', '');
  const detail = document.createElement('small');
  detail.textContent = [toast?.message, reason, phase, driver, status, transport, fallback ? 'fallback' : ''].filter(Boolean).join(' · ') || 'Manager lifecycle';
  li.append(time, name, detail);
  log.prepend(li);
  while (log.children.length > 40) log.lastElementChild.remove();
  sync(instance);
  if (event.type === TOAST_EVENTS.animationEnd) queueMicrotask(() => sync(instance));
}
for (const name of Object.values(TOAST_EVENTS)) removers.push(addToastEventListener(root, name, observe));

function initializeAdapter() {
  domAdapter?.destroy();
  sourceStatus.textContent = '';
  domAdapter = createDomEventAdapter(manager, {
    target: sourceEvents,
    announcementOwner: adapterOwner.value,
    bindings: [{
      event: 'demo:source-status',
      map(event) {
        const detail = event.detail;
        if (detail.action === 'dismiss') return { type: 'dismiss', correlationKey: 'demo-source' };
        if (detail.action === 'update') return { type: 'update', correlationKey: 'demo-source', patch: { message: detail.message } };
        return { type: 'show', correlationKey: 'demo-source', input: { message: detail.message, tone: 'info', persistent: true } };
      },
    }],
  });
}
function setAsyncStatus(message) {
  if (asyncOwner.value === 'source') {
    asyncStatus.setAttribute('role', 'status');
    asyncStatus.removeAttribute('aria-live');
    asyncStatus.textContent = message;
  } else {
    asyncStatus.removeAttribute('role');
    asyncStatus.setAttribute('aria-live', 'off');
    asyncStatus.textContent = message;
  }
}
function initializeAsyncAdapter() {
  asyncAdapter?.destroy();
  asyncAdapter = createDomEventAdapter(manager, {
    target: asyncEvents,
    announcementOwner: asyncOwner.value,
    dismissTrackedOnDestroy: true,
    bindings: [{
      event: 'demo:async-form',
      map(event) {
        const { state } = event.detail;
        if (state === 'complete') return { type: 'update', correlationKey: 'profile-save', patch: { message: 'Demo profile saved.', tone: 'success', persistent: false, duration: 5000 } };
        return { type: 'show', correlationKey: 'profile-save', input: { message: 'Saving demo profile…', tone: 'loading', persistent: true } };
      },
    }],
  });
}

// Adapt the supplied GSAP operations while keeping the package driver's
// abort, interruption and exact inline-style restoration ownership.
function createDemoGsapDriver(effect) {
  if (effect === 'default') return createGsapAnimationDriver(gsap);
  const distance = effect.startsWith('slide-') ? 32 : 16;
  const offset = {
    opacity: effect.startsWith('slide-') ? 1 : 0,
    x: effect.endsWith('-left') ? -distance : effect.endsWith('-right') ? distance : 0,
    y: effect.endsWith('-top') ? -distance : effect.endsWith('-bottom') ? distance : 0,
    scale: effect === 'zoom' ? 0.96 : 1,
  };
  const settled = { opacity: 1, x: 0, y: 0, scale: 1 };
  return createGsapAnimationDriver({
    fromTo(element, _from, options) {
      if (effect === 'bounce') {
        const { paused, onComplete, onInterrupt } = options;
        return gsap.timeline({ paused, onComplete, onInterrupt })
          .fromTo(element, { ...settled, opacity: 0, y: 16 }, {
            ...settled, y: -3, duration: 0.224, ease: 'power1.out',
          })
          .to(element, { y: 0, duration: 0.096, ease: 'power1.inOut' });
      }
      return gsap.fromTo(element, offset, { ...options, ...settled });
    },
    to(element, options) {
      return gsap.to(element, { ...options, ...offset });
    },
  }, { enterDuration: effect === 'bounce' ? 0.32 : 0.24, exitDuration: 0.16 });
}

function initialize() {
  root.dataset.demoEffect = animationEffect.value;
  manager = createToast(root, {
    maxVisible: 5,
    position: position.value,
    animation: animation.value === 'gsap'
      ? createDemoGsapDriver(animationEffect.value)
      : animation.value === 'view-transition'
        ? createElementViewTransitionDriver()
        : animation.value,
    announcementTransport: announcementTransport.value === 'aria-notify' ? createAriaNotifyTransport() : 'live-region',
    addons: [
      ...(showProgress.checked ? [createProgressAddon()] : []),
      ...(showFlipLayout.checked ? [createGsapFlipLayoutAddon(gsap, Flip)] : []),
      ...(enableDiagnostics.checked ? [createDiagnosticsAddon({ report: diagnostic => diagnostics.push(diagnostic) })] : []),
    ],
    duration: Number(form.elements.duration.value) * 1000,
    showToneLabel: showToneLabel.checked,
  });
  historyDemo?.destroy();
  historyDemo = createHistoryDemo(manager, document.querySelector('main'));
  dedupe = createDedupeController(manager);
  initializeAdapter();
  initializeAsyncAdapter();
  root.classList.toggle('toast-demo-skin--compact', toastSkin.value === 'compact');
  root.classList.toggle('toast-demo-skin--compact-dark', toastSkin.value === 'compact-dark');
  root.classList.toggle('toast-demo-skin--high-contrast', toastSkin.value === 'high-contrast');
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
    actionLayout: String(values.get('actionLayout')),
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
  feedback.textContent = '';
  try { callback(); }
  catch (error) { showFeedback(error instanceof Error ? error.message : 'The operation failed.'); }
}
function showFeedback(message) {
  feedback.hidden = false;
  feedback.textContent = message;
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!valid()) return;
  safely(() => manager.show(input(event.submitter)));
});
form.elements.message.addEventListener('input', () => form.elements.message.setCustomValidity(''));
form.elements.hasAction.addEventListener('change', () => { form.elements.actionLabel.disabled = !form.elements.hasAction.checked; });
function reinitializeManager() {
  safely(() => { domAdapter?.destroy(); asyncAdapter?.destroy(); dedupe?.destroy(); manager.destroy(); initialize(); });
}
position.addEventListener('change', reinitializeManager);
animation.addEventListener('change', reinitializeManager);
animationEffect.addEventListener('change', reinitializeManager);
announcementTransport.addEventListener('change', reinitializeManager);
showProgress.addEventListener('change', reinitializeManager);
showFlipLayout.addEventListener('change', reinitializeManager);
showToneLabel.addEventListener('change', reinitializeManager);
enableDiagnostics.addEventListener('change', reinitializeManager);
toastSkin.addEventListener('change', () => {
  root.classList.toggle('toast-demo-skin--compact', toastSkin.value === 'compact');
  root.classList.toggle('toast-demo-skin--compact-dark', toastSkin.value === 'compact-dark');
  root.classList.toggle('toast-demo-skin--high-contrast', toastSkin.value === 'high-contrast');
});
adapterOwner.addEventListener('change', () => safely(initializeAdapter));
asyncOwner.addEventListener('change', () => safely(() => {
  initializeAsyncAdapter();
  setAsyncStatus('Ready to save. No data leaves this page.');
}));
asyncForm.addEventListener('submit', event => {
  event.preventDefault();
  if (asyncSaving) return;
  if (!asyncForm.reportValidity()) return;
  const button = event.submitter;
  asyncSaving = true;
  button.setAttribute('aria-disabled', 'true');
  setAsyncStatus('Saving demo profile…');
  asyncEvents.dispatchEvent(new CustomEvent('demo:async-form', { detail: { state: 'saving' } }));
  asyncTimer = window.setTimeout(() => {
    setAsyncStatus('Demo profile saved.');
    asyncEvents.dispatchEvent(new CustomEvent('demo:async-form', { detail: { state: 'complete' } }));
    asyncSaving = false;
    button.removeAttribute('aria-disabled');
  }, 900);
});
function dispatchSourceStatus(action, message = '') {
  if (adapterOwner.value === 'source' && message) sourceStatus.textContent = message;
  else sourceStatus.textContent = '';
  sourceEvents.dispatchEvent(new CustomEvent('demo:source-status', { detail: { action, message } }));
}
document.querySelector('[data-adapter-start]').addEventListener('click', () => safely(() => dispatchSourceStatus('show', 'Source operation started.')));
document.querySelector('[data-adapter-update]').addEventListener('click', () => safely(() => dispatchSourceStatus('update', 'Source operation is still running.')));
document.querySelector('[data-adapter-dismiss]').addEventListener('click', () => safely(() => dispatchSourceStatus('dismiss')));
document.querySelector('[data-burst]').addEventListener('click', event => safely(() => {
  for (let i = 1; i <= 5; i++) manager.show({ message: `Batch example ${i} of 5.`, tone: 'info', duration: 7000, origin: event.currentTarget });
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
    showFeedback(error instanceof Error ? error.message : 'The keyed example failed.');
  });
}));
document.querySelector('[data-update]').addEventListener('click', event => {
  if (!valid()) return;
  safely(() => manager.update(target.value, { ...input(event.currentTarget), persistent: form.elements.persistence.value === 'auto' ? undefined : form.elements.persistence.value === 'persistent' }));
});
document.querySelector('[data-dismiss]').addEventListener('click', () => safely(() => manager.dismiss(target.value)));
document.querySelector('[data-clear]').addEventListener('click', () => { manager.dismissAll(); loadingId = null; sync(manager); });
document.querySelector('[data-clear-log]').addEventListener('click', () => log.replaceChildren());
document.querySelector('[data-refresh-diagnostics]').addEventListener('click', renderDiagnostics);
document.querySelector('[data-clear-diagnostics]').addEventListener('click', () => {
  diagnostics.length = 0;
  diagnosticsReport.replaceChildren();
});

// Independent, in-page examples use the package renderer and own their managers.
function classicIcon(kind) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', kind === 'success' ? 'M5 12l4 4L19 6' : 'M12 11v6M12 7h.01');
  if (kind !== 'success') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '9');
    svg.append(circle);
  }
  svg.append(path);
  return svg;
}
const classicLight = createToast(document.querySelector('[data-classic-light-root]'), {
  showToneLabel: false, maxVisible: 1, maxQueue: 0, animation: 'none', labels: { region: 'Classic success preview' },
});
const classicDark = createToast(document.querySelector('[data-classic-dark-root]'), {
  showToneLabel: false, maxVisible: 1, maxQueue: 0, animation: 'none', labels: { region: 'Classic information preview' },
});
function showClassic(instance, input) {
  const existing = instance.getToasts()[0];
  if (existing) instance.update(existing.id, input);
  else instance.show(input);
}
for (const [selector, instance, input] of [
  ['[data-classic-light]', classicLight, {
    message: '2 messages were deleted.', tone: 'success', persistent: true,
    icon: classicIcon('success'), actionLayout: 'inline',
    action: { label: 'Undo', onClick: ({ instance, id }) => instance.update(id, {
      message: '2 messages were restored.', action: null,
    }) },
  }],
  ['[data-classic-dark]', classicDark, {
    title: 'Your current plan allows one generation at a time.',
    message: 'Enable parallel generation to run more at once.',
    tone: 'info', persistent: true, icon: classicIcon('info'),
  }],
]) {
  const button = document.querySelector(selector);
  const show = () => safely(() => showClassic(instance, { ...input, origin: button }));
  button.addEventListener('click', show);
  removers.push(() => button.removeEventListener('click', show));
  button.disabled = false;
}

initialize();
document.querySelector('[data-controls]').disabled = false;
for (const selector of ['[data-burst]', '[data-start-loading]', '[data-retry]', '[data-promise-success]', '[data-promise-error]', '[data-dedupe]', '[data-adapter-start]', '[data-adapter-update]', '[data-adapter-dismiss]', '[data-async-submit]', '[data-clear-log]', '[data-refresh-diagnostics]', '[data-clear-diagnostics]']) document.querySelector(selector).disabled = false;
document.querySelector('[data-boot]').hidden = true;
window.addEventListener('pagehide', event => {
  if (event.persisted) return; // BFCache resumes the same live manager; visibility handles its timers.
  domAdapter?.destroy();
  asyncAdapter?.destroy();
  window.clearTimeout(asyncTimer);
  dedupe?.destroy();
  manager.destroy();
  classicLight.destroy();
  classicDark.destroy();
  for (const remove of removers) remove();
}, { once: false });

// Demo-only inspection, not a singleton/global runtime API.
export function getDemoManager() { return manager; }
