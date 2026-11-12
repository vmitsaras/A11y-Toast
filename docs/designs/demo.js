import { createToast, addToastEventListener, TOAST_EVENTS } from '../dist/index.js';

const skinSelect = document.querySelector('#design-skin');
const toneSelect = document.querySelector('#design-tone');
const actionInput = document.querySelector('#design-action');
const form = document.querySelector('[data-design-form]');
const controls = document.querySelector('[data-design-controls]');
const root = document.querySelector('[data-live-preview]');
const dismiss = document.querySelector('[data-dismiss-design]');
const result = document.querySelector('[data-design-result]');
const usage = document.querySelector('[data-usage-details]');
const usageTitle = document.querySelector('[data-usage-title]');
const copyStatus = document.querySelector('[data-copy-status]');
const download = document.querySelector('[data-skin-download]');
const codes = Object.fromEntries(['css', 'html', 'js'].map(type => [type, document.querySelector(`[data-${type}-code]`)]));
const cards = new Map(Array.from(document.querySelectorAll('[data-design-card]'), card => [card.dataset.designCard, card]));
const removers = [];
let manager = null;
let currentSkin = null;
let disposed = false;
let copyRevision = 0;

const content = {
  neutral: { title: 'Update ready', message: 'Your changes are ready.' },
  info: { title: 'An update is available', message: 'You can review the latest changes.' },
  success: { title: 'Changes saved', message: 'Your changes are ready.' },
  warning: { title: 'Review your changes', message: 'Check the details before continuing.' },
  error: { title: 'Changes could not be saved', message: 'Please try again when you are ready.' },
  loading: { title: 'Updating your changes', message: 'The operation is in progress.' },
};

// Trusted, passive SVG only. This exact helper is included in the usage example.
function createIcon(tone) {
  const shapes = {
    neutral: 'M12 8h.01M12 12v4',
    info: 'M12 8h.01M12 12v4',
    success: 'M5 12l4 4L19 6',
    warning: 'M12 8v5M12 17h.01M12 3L2 21h20L12 3',
    error: 'M8 8l8 8M16 8l-8 8',
    loading: 'M12 6v6l4 2',
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [name, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) svg.setAttribute(name, value);
  if (['neutral', 'info', 'error', 'loading'].includes(tone)) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '9');
    svg.append(circle);
  }
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', shapes[tone]);
  svg.append(path);
  return svg;
}

function listen(target, type, handler) {
  target.addEventListener(type, handler);
  removers.push(() => target.removeEventListener(type, handler));
}

function selectedName() { return skinSelect.selectedOptions[0].textContent; }

function updateUsage() {
  copyRevision += 1;
  copyStatus.textContent = '';
  const skin = skinSelect.value;
  const tone = toneSelect.value;
  const sample = content[tone];
  document.querySelector('[data-skin-name]').textContent = selectedName();
  usageTitle.textContent = `Use ${selectedName()}`;
  codes.css.textContent = `import 'a11y-toast/styles.css';\nimport 'a11y-toast/skins/${skin}.css';`;
  codes.html.textContent = `<div class="a11y-toast-region--skin-${skin}" data-toast-host></div>\n<button type="button" data-show-toast>Show toast</button>`;
  const action = actionInput.checked ? `\n    action: {\n      label: 'Try action',\n      onClick: ({ instance, id }) => instance.update(id, {\n        title: 'Complete', message: 'Action completed.',\n        tone: 'success', icon: createIcon('success'), action: null,\n      }),\n    },` : '';
  codes.js.textContent = `import { createToast } from 'a11y-toast';\n\nconst root = document.querySelector('[data-toast-host]');\nroot.style.setProperty('--a11y-toast-width', '36rem');\nconst button = document.querySelector('[data-show-toast]');\nconst toast = createToast(root, { showToneLabel: false });\n\nbutton.addEventListener('click', () => {\n  toast.show({\n    title: ${JSON.stringify(sample.title)},\n    message: ${JSON.stringify(sample.message)},\n    tone: '${tone}', priority: 'polite', persistent: true,\n    icon: createIcon('${tone}'), actionLayout: 'inline',\n    origin: button,${action}\n  });\n});\n\n// When your application removes this host, call toast.destroy().\n\n${createIcon.toString()}`;
  download.href = new URL(`../dist/skins/${skin}.css`, import.meta.url).href;
  download.download = `a11y-toast-${skin}.css`;
  download.textContent = `Download ${selectedName()} CSS`;
  for (const [id, card] of cards) card.classList.toggle('is-selected', id === skin);
}

function syncDismiss() {
  dismiss.disabled = !manager || manager.isDestroyed || manager.getToasts().length === 0;
}

function showPreview(origin) {
  if (disposed) return;
  manager?.destroy();
  if (currentSkin) root.classList.remove(`a11y-toast-region--skin-${currentSkin}`);
  currentSkin = skinSelect.value;
  root.classList.add(`a11y-toast-region--skin-${currentSkin}`);
  manager = createToast(root, { showToneLabel: false, maxVisible: 1, maxQueue: 0, position: 'bottom-end' });
  const tone = toneSelect.value;
  manager.show({
    ...content[tone], tone, priority: 'polite', persistent: true,
    icon: createIcon(tone), actionLayout: 'inline', origin,
    action: actionInput.checked ? {
      label: 'Try action',
      onClick: ({ instance, id }) => instance.update(id, {
        title: 'Complete', message: 'Action completed.',
        tone: 'success', icon: createIcon('success'), action: null,
      }),
    } : null,
  });
  result.textContent = `${selectedName()} · ${toneSelect.selectedOptions[0].textContent}. Preview stays until you close it.`;
  syncDismiss();
}

listen(form, 'submit', event => {
  event.preventDefault();
  showPreview(event.submitter ?? document.querySelector('[data-show-design]'));
});
listen(dismiss, 'click', () => manager?.dismissAll());
for (const control of [skinSelect, toneSelect, actionInput]) listen(control, 'change', updateUsage);

for (const [skin, card] of cards) {
  const tryButton = card.querySelector('[data-try-skin]');
  listen(tryButton, 'click', () => {
    skinSelect.value = skin;
    updateUsage();
    showPreview(tryButton);
  });
  listen(card.querySelector('[data-use-skin]'), 'click', () => {
    skinSelect.value = skin;
    updateUsage();
    usage.open = true;
    usageTitle.focus();
  });
}

removers.push(addToastEventListener(root, TOAST_EVENTS.dismiss, () => {
  result.textContent = 'Preview closed. The designs and setup remain available.';
  syncDismiss();
}));
removers.push(addToastEventListener(root, TOAST_EVENTS.update, event => {
  if (event.detail.toast.message === 'Action completed.') result.textContent = 'Action completed. The same notification was updated.';
}));

for (const button of document.querySelectorAll('[data-copy]')) {
  listen(button, 'click', async () => {
    const code = codes[button.dataset.copy];
    const revision = ++copyRevision;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(code.textContent);
      if (!disposed && revision === copyRevision) copyStatus.textContent = `${button.dataset.copy === 'js' ? 'JavaScript' : button.dataset.copy.toUpperCase()} copied.`;
    } catch {
      if (disposed || revision !== copyRevision) return;
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(range);
      code.tabIndex = -1;
      code.focus();
      copyStatus.textContent = 'Copy is unavailable. The code is selected; use your usual copy command.';
    }
  });
}

listen(window, 'pagehide', event => {
  if (event.persisted) return;
  disposed = true;
  copyRevision += 1;
  manager?.destroy();
  manager = null;
  for (const remove of removers.splice(0)) remove();
});

updateUsage();
controls.disabled = false;
for (const button of document.querySelectorAll('[data-try-skin], [data-use-skin], [data-copy]')) button.disabled = false;
document.querySelector('[data-boot]').hidden = true;

// Demo-only inspection, never a package singleton or auto-initialization API.
export function getDemoManager() { return manager; }
