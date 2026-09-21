/* TOAST-270: shared by the browser contract and Vitest; only public APIs are used. */
export async function runHistorySuite(api) {
  const results = [];
  const equal = (actual, expected) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
    }
  };
  const ok = (value, message = 'Assertion failed') => { if (!value) throw new Error(message); };
  const throws = (fn) => { let caught = false; try { fn(); } catch { caught = true; } ok(caught, 'Expected an exception'); };
  const microtasks = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
  let fixture, managers, restorers;
  const host = (parent = fixture) => { const root = document.createElement('div'); parent.append(root); return root; };
  const create = (options = {}, root = host()) => {
    const manager = api.createToast(root, { animation: 'none', priority: 'off', ...options });
    managers.push(manager);
    return manager;
  };
  const history = (manager, options) => api.createHistoryController(manager, options);
  const show = (manager, message = 'Saved') => manager.show({ message, persistent: true });
  const clock = () => {
    const tasks = new Map();
    const oldSet = window.setTimeout, oldClear = window.clearTimeout;
    const oldNow = Object.getOwnPropertyDescriptor(performance, 'now');
    let now = 0, sequence = 0;
    window.setTimeout = (fn, delay = 0, ...args) => {
      const id = ++sequence; tasks.set(id, { at: now + Number(delay), fn: () => fn(...args) }); return id;
    };
    window.clearTimeout = id => tasks.delete(id);
    Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
    restorers.push(() => {
      window.setTimeout = oldSet; window.clearTimeout = oldClear;
      if (oldNow) Object.defineProperty(performance, 'now', oldNow); else delete performance.now;
    });
    return {
      get size() { return tasks.size; },
      tick(ms) {
        const end = now + ms;
        for (let guard = 0; ; guard++) {
          const next = [...tasks].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
          if (!next) break;
          if (guard > 5000) throw new Error('Timer loop');
          tasks.delete(next[0]); now = next[1].at; next[1].fn();
        }
        now = end;
      },
    };
  };
  async function test(name, fn) {
    fixture = document.createElement('div'); document.body.append(fixture);
    managers = []; restorers = [];
    const hidden = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    const started = Date.now();
    try { await fn(); results.push({ name, status: 'pass', ms: Date.now() - started }); }
    catch (error) { results.push({ name, status: 'fail', error: String(error), stack: error.stack }); }
    finally {
      for (const manager of managers.reverse()) manager.destroy();
      for (const restore of restorers.reverse()) restore();
      fixture.remove();
      if (hidden) Object.defineProperty(document, 'hidden', hidden); else delete document.hidden;
      await microtasks();
    }
  }

  await test('H01 history is explicit, empty, frozen and defaults to 50 entries', () => {
    const m = create(); equal(m.getAddons().length, 0);
    const h = history(m); equal([h.size, h.maxEntries, h.isDestroyed], [0, 50, false]);
    ok(Object.isFrozen(h) && Object.isFrozen(h.getEntries())); equal(m.getAddons().length, 1);
  });
  await test('H02 invalid capacities fail atomically; integer endpoints work', () => {
    const m = create();
    for (const maxEntries of [0, -1, 1.5, NaN, Infinity, 1001, '5', null]) {
      throws(() => history(m, { maxEntries })); equal(m.getAddons().length, 0);
    }
    for (const maxEntries of [1, 1000]) { const h = history(m, { maxEntries }); equal(h.maxEntries, maxEntries); h.destroy(); }
    throws(() => history(null)); throws(() => history(m, null));
    m.destroy(); throws(() => history(m));
  });
  await test('H03 attaching does not backfill or announce existing notifications', () => {
    const m = create(); const id = show(m, 'Already here'); const before = m.root.outerHTML;
    const h = history(m); equal(h.getEntries(), []); equal(m.root.outerHTML, before);
    m.update(id, { message: 'Changed later' }); equal(h.getEntries().map(e => e.type), ['update']);
  });
  await test('H04 show/update/dismiss preserve independent snapshots and original timestamp', () => {
    const m = create(); const stamps = [];
    for (const type of ['show', 'update', 'dismiss']) m.root.addEventListener(api.TOAST_EVENTS[type], e => stamps.push(e.detail.timestamp));
    const h = history(m); const id = show(m, 'First'); m.update(id, { message: 'Second' }); m.dismiss(id, 'close-button');
    const entries = h.getEntries(); equal(entries.map(e => e.type), ['show', 'update', 'dismiss']);
    equal(entries.map(e => e.toast.message), ['First', 'Second', 'Second']);
    equal(entries.map(e => e.toast.state), ['visible', 'visible', 'dismissed']);
    equal(entries.map(e => e.timestamp), stamps); equal(entries.map(e => e.sequence), [1, 2, 3]);
    equal(entries.map(e => e.reason), [null, null, 'close-button']);
  });
  await test('H05 all exposed object/array boundaries are frozen and have no executable/DOM data', () => {
    const m = create(); const origin = document.createElement('button'); fixture.append(origin);
    const h = history(m); const id = m.show({ message: '<img src=x>', origin, action: { label: 'Undo', onClick() {} } });
    const entries = h.getEntries(), entry = entries[0], snapshot = entry.toast;
    for (const value of [entries, entry, snapshot, snapshot.action, snapshot.pauseReasons]) ok(Object.isFrozen(value));
    throws(() => { snapshot.message = 'Mutated'; }); throws(() => snapshot.pauseReasons.push('api'));
    const visit = value => {
      ok(typeof value !== 'function'); ok(!(value instanceof Node)); ok(!(value instanceof Event));
      if (value && typeof value === 'object') for (const child of Object.values(value)) visit(child);
    };
    visit(entries); equal('onClick' in snapshot.action, false); equal('origin' in snapshot, false);
    equal('instance' in entry, false); equal('root' in entry, false);
    m.update(id, { action: { label: 'Different' }, message: 'Later' });
    equal([snapshot.action.label, snapshot.message], ['Undo', '<img src=x>']);
    ok(JSON.stringify(entries).includes('<img src=x>'));
  });
  await test('H06 ring eviction retains only the newest lifecycle entries', () => {
    const m = create(); const h = history(m, { maxEntries: 3 }); const id = show(m, '0');
    const first = h.getEntries(); for (let i = 1; i <= 8; i++) m.update(id, { message: String(i) });
    equal(h.size, 3); equal(h.getEntries().map(e => e.sequence), [7, 8, 9]);
    equal(h.getEntries().map(e => e.toast.message), ['6', '7', '8']); equal(first[0].toast.message, '0');
    m.dismiss(id); equal(h.getEntries().map(e => e.type), ['update', 'update', 'dismiss']);
  });
  await test('H07 clear changes only history, returns its count and does not reuse sequence IDs', () => {
    const m = create(); const h = history(m); const id = show(m); const before = m.root.outerHTML;
    const retainedByCaller = h.getEntries(); equal(h.clear(), 1); equal(h.clear(), 0);
    equal(h.size, 0); equal(m.root.outerHTML, before); ok(m.getToast(id));
    equal(retainedByCaller.length, 1); m.update(id, { message: 'After clear' }); equal(h.getEntries()[0].sequence, 2);
  });
  await test('H08 queue/drop are excluded; a queued update is not presented as a show', () => {
    const m = create({ maxVisible: 1, maxQueue: 1 }); const h = history(m); const visible = show(m, 'Visible');
    const queued = show(m, 'Queued'); equal(show(m, 'Rejected'), null); equal(h.size, 1);
    m.update(queued, { message: 'Queued update' });
    equal([h.getEntries()[1].type, h.getEntries()[1].toast.state], ['update', 'queued']);
    m.dismiss(queued); equal(h.getEntries().map(e => e.type), ['show', 'update', 'dismiss']);
    equal(h.getEntries().filter(e => e.type === 'show').map(e => e.toast.id), [visible]);
  });
  await test('H09 promotion records the latest queued content exactly once', () => {
    const m = create({ maxVisible: 1 }); const h = history(m); const a = show(m, 'A'); const b = show(m, 'B');
    m.update(b, { message: 'B latest' }); m.dismiss(a);
    equal(h.getEntries().map(e => e.type), ['show', 'update', 'dismiss', 'show']);
    equal([h.getEntries().at(-1).toast.id, h.getEntries().at(-1).toast.message], [b, 'B latest']);
  });
  await test('H10 separate/nested managers cannot contribute to each other\'s history', () => {
    const outer = create(), inner = create({}, host(outer.root)); const a = history(outer), b = history(inner);
    show(outer, 'Outer'); show(inner, 'Inner'); equal(a.getEntries().map(e => e.toast.message), ['Outer']);
    equal(b.getEntries().map(e => e.toast.message), ['Inner']); b.clear(); equal(a.size, 1);
  });
  await test('H11 reads/clear add no announcement, action, timer, or core lifecycle work', () => {
    const timer = clock(), m = create({ priority: 'polite' }); const h = history(m);
    let announcements = 0, actions = 0, lifecycle = 0;
    m.root.addEventListener(api.TOAST_EVENTS.announce, () => announcements++);
    for (const type of ['show', 'update', 'dismiss']) m.root.addEventListener(api.TOAST_EVENTS[type], () => lifecycle++);
    m.show({ message: 'Saved', action: { label: 'Undo', onClick() { actions++; } } });
    timer.tick(1200); equal(announcements, 1); equal(timer.size, 0);
    const before = m.root.outerHTML;
    for (let i = 0; i < 10; i++) h.getEntries(); h.clear(); timer.tick(5000);
    equal([announcements, actions, lifecycle, timer.size], [1, 0, 1, 0]); equal(m.root.outerHTML, before);
  });
  await test('H12 a real action stays on the live toast, never on history', () => {
    const m = create(); const h = history(m); let actions = 0;
    const id = m.show({ message: 'Saved', action: { label: 'Undo', dismissOnSuccess: true, onClick() { actions++; } } });
    m.root.querySelector('[data-a11y-toast-action]').click(); equal(actions, 1); equal(m.getToast(id), undefined);
    equal(h.getEntries().at(-1).reason, 'action'); h.getEntries(); h.clear(); equal(actions, 1);
    equal('replay' in h, false); equal('restore' in h, false); equal('show' in h, false);
  });
  await test('H13 explicit destruction clears/disconnects history but leaves the manager alive', () => {
    const m = create(); const h = history(m); const id = show(m); h.destroy(); h.destroy();
    equal([h.size, h.isDestroyed, m.isDestroyed, m.getAddons().length], [0, true, false, 0]);
    m.update(id, { message: 'Still active' }); equal(h.getEntries(), []); equal(h.clear(), 0);
  });
  await test('H14 duplicate attachment cannot replace the existing history controller', () => {
    const m = create(); const first = history(m); show(m); throws(() => history(m));
    equal([first.size, first.isDestroyed, m.getAddons().length], [1, false, 1]);
    first.destroy(); const next = history(m); equal(next.size, 0); show(m); equal(next.size, 1);
  });
  await test('H15 external unregister disposes history; an old handle cannot remove a replacement', () => {
    const m = create(); const first = history(m); show(m); m.unregisterAddon('history');
    equal([first.isDestroyed, first.size], [true, 0]); const next = history(m); first.destroy();
    show(m); equal([next.isDestroyed, next.size, m.getAddons().length], [false, 1, 1]);
  });
  await test('H16 core teardown clears history even when destroy event propagation is stopped', () => {
    const m = create(); m.root.addEventListener(api.TOAST_EVENTS.destroy, event => event.stopImmediatePropagation());
    const h = history(m); show(m); m.destroy(); equal([h.isDestroyed, h.size], [true, 0]);
  });
  await test('H17 nested lifecycle dispatch preserves payload snapshots in observation order', () => {
    const m = create(); m.root.addEventListener(api.TOAST_EVENTS.show, event => m.dismiss(event.detail.toast.id), { once: true });
    const h = history(m); show(m, 'Nested');
    equal(h.getEntries().map(e => [e.type, e.toast.state, e.sequence]), [['dismiss', 'dismissed', 1], ['show', 'visible', 2]]);
    equal(m.getToasts(), []);
  });
  await test('H18 re-entrant destruction before the history observer prevents late capture', () => {
    const m = create(); m.root.addEventListener(api.TOAST_EVENTS.show, () => m.destroy(), { once: true });
    const h = history(m); show(m); equal([h.size, h.isDestroyed], [0, true]);
  });
  await test('H19 animation exit retains its slot; history never waits, drains or starts motion', async () => {
    let finish; const m = create({ maxVisible: 1, animation: { name: 'history-test', exit: () => new Promise(resolve => { finish = resolve; }) } });
    const h = history(m); const a = show(m, 'A'), b = show(m, 'B'); m.dismiss(a);
    equal([h.getEntries().at(-1).type, m.visibleCount, m.queuedCount], ['dismiss', 0, 1]);
    ok(m.root.querySelector(`[data-a11y-toast-id="${a}"]`).inert); h.clear(); equal(m.queuedCount, 1);
    finish(); await microtasks(); equal(m.getToast(b).state, 'visible'); equal(h.getEntries().map(e => e.type), ['show']);
  });
  await test('H20 timer expiry is still core-owned after history reads and clear', () => {
    const timer = clock(), m = create(), h = history(m); const id = m.show({ message: 'Timed', duration: 1000 });
    timer.tick(400); h.getEntries(); h.clear(); equal(m.getToast(id).remaining, 600);
    timer.tick(600); equal(m.getToast(id), undefined); equal(h.getEntries()[0].reason, 'timeout');
  });
  await test('H21 5000 updates stay bounded; eviction does not keep a per-toast journal', () => {
    const m = create(); const h = history(m, { maxEntries: 1000 }); const id = show(m, '0');
    for (let i = 1; i <= 5000; i++) m.update(id, { message: String(i) });
    equal(h.size, 1000); const entries = h.getEntries();
    equal([entries[0].sequence, entries.at(-1).sequence, entries.at(-1).toast.message], [4002, 5001, '5000']);
    equal(h.clear(), 1000); equal(h.size, 0);
  });
  await test('H22 repeated attach/destroy cycles leave no registered or recording history observer', () => {
    const m = create(); const id = show(m);
    for (let i = 0; i < 100; i++) {
      const h = history(m); m.update(id, { message: String(i) }); equal(h.size, 1);
      h.destroy(); equal(m.getAddons().length, 0); m.update(id, { message: 'After destroy' }); equal(h.size, 0);
    }
  });
  await test('H23 late asynchronous action settlement cannot resurrect destroyed history', async () => {
    const m = create(), h = history(m); let finish;
    m.show({ message: 'Working', action: { label: 'Run', dismissOnSuccess: true, onClick: () => new Promise(resolve => { finish = resolve; }) } });
    m.root.querySelector('[data-a11y-toast-action]').click(); h.destroy(); finish(); await microtasks();
    equal([h.isDestroyed, h.size, m.visibleCount], [true, 0, 0]);
  });
  await test('H24 a synchronously removed registration never returns a phantom active controller', () => {
    const m = create(); const original = m.registerAddon.bind(m);
    m.registerAddon = addon => { original(addon); m.unregisterAddon(addon.name); };
    throws(() => history(m)); equal(m.getAddons().length, 0);
  });
  await test('H25 history does not use storage, network, polling, or animation frames', () => {
    const m = create(); const timer = clock(); const touched = [];
    const patch = (target, name) => {
      const descriptor = Object.getOwnPropertyDescriptor(target, name);
      if (!descriptor || !descriptor.configurable) return;
      Object.defineProperty(target, name, { configurable: true, value: () => { touched.push(name); throw new Error(`Unexpected ${name}`); } });
      restorers.push(() => Object.defineProperty(target, name, descriptor));
    };
    patch(Storage.prototype, 'setItem'); patch(window, 'fetch'); patch(window, 'requestAnimationFrame');
    if (typeof IDBFactory !== 'undefined') patch(IDBFactory.prototype, 'open');
    const h = history(m); const id = show(m); m.update(id, { message: 'Changed' }); m.dismiss(id);
    h.getEntries(); h.clear(); h.destroy(); equal(touched, []); equal(timer.size, 0);
  });
  return results;
}
