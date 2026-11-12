import { createHistoryController } from '../../dist/addons/history.js';
import { TOAST_EVENTS } from '../../dist/index.js';

/** Application-owned, non-live inspector. The package itself renders no history UI. */
export function createHistoryDemo(instance, parent) {
  if (!(parent instanceof HTMLElement)) throw new TypeError('A history demo container is required.');
  const history = createHistoryController(instance, { maxEntries: 50 });
  const doc = parent.ownerDocument;
  const element = (tag, className, text = '') => {
    const node = doc.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  };
  const panel = element('section', 'toast-history-demo');
  const heading = element('h2', 'toast-history-demo__heading', 'Notification history');
  heading.id = `${instance.instanceId}-history-heading`;
  panel.setAttribute('aria-labelledby', heading.id);
  const hint = element('p', 'toast-history-demo__hint',
    'Latest 50 show, update and dismiss events in page memory. Reloading or recreating the manager clears history; no announcements or actions are replayed.');
  const details = element('details', 'toast-history-demo__details');
  const summary = element('summary', 'toast-history-demo__summary', 'Inspect notification history');
  const actions = element('div', 'toast-history-demo__actions');
  const refresh = element('button', 'toast-history-demo__button', 'Refresh history');
  const clear = element('button', 'toast-history-demo__button', 'Clear history');
  refresh.type = clear.type = 'button';
  const count = element('p', 'toast-history-demo__count');
  const list = element('ol', 'toast-history-demo__list');
  const empty = element('p', 'toast-history-demo__empty', 'No history entries. Show a toast, then refresh this view.');
  const note = element('p', 'toast-history-demo__hint',
    'Refreshes when opened or on request. Clearing history keeps active toasts. Earlier action labels are shown as text.');
  actions.append(refresh, clear);
  details.append(summary, note, actions, count, empty, list);
  panel.append(heading, hint, details);
  parent.append(panel);
  let destroyed = false;

  const render = (cleared = false) => {
    if (destroyed) return;
    const entries = history.getEntries();
    count.textContent = `${cleared ? 'History cleared. ' : ''}${entries.length} of ${history.maxEntries} lifecycle entries retained at this refresh. Oldest observed first.`;
    empty.hidden = entries.length !== 0;
    const rows = entries.map(entry => {
      const row = element('li', 'toast-history-demo__entry');
      const meta = element('p', 'toast-history-demo__meta',
        `#${entry.sequence} · ${entry.type} · ${entry.toast.state}${entry.reason ? ` · ${entry.reason}` : ''} · `);
      const time = element('time', 'toast-history-demo__time');
      const date = new Date(entry.timestamp);
      time.dateTime = date.toISOString();
      time.textContent = date.toLocaleTimeString();
      meta.append(time);
      row.append(meta);
      if (entry.toast.title) row.append(element('strong', 'toast-history-demo__title', entry.toast.title));
      row.append(element('p', 'toast-history-demo__message', entry.toast.message));
      if (entry.toast.action) row.append(element('p', 'toast-history-demo__action-label', `Original action label: ${entry.toast.action.label} (not available here)`));
      return row;
    });
    list.replaceChildren(...rows);
  };
  const onRefresh = () => render();
  const onClear = () => { history.clear(); render(true); };
  const onToggle = () => { if (details.open) render(); };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    refresh.removeEventListener('click', onRefresh);
    clear.removeEventListener('click', onClear);
    details.removeEventListener('toggle', onToggle);
    instance.root.removeEventListener(TOAST_EVENTS.destroy, onDestroy);
    history.destroy();
    panel.remove();
    list.replaceChildren();
  };
  const onDestroy = event => { if (event.detail.instance === instance) destroy(); };
  refresh.addEventListener('click', onRefresh);
  clear.addEventListener('click', onClear);
  details.addEventListener('toggle', onToggle);
  instance.root.addEventListener(TOAST_EVENTS.destroy, onDestroy);
  render();
  return Object.freeze({ destroy });
}
