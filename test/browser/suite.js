/* Browser and Vitest share this behavioral contract. No production internals are exposed. */
export async function runSuite(api, capabilities = { layout: true }) {
  const results = [];
  let fixture, instances, clock, hiddenDescriptor;
  const equal = (actual, expected, note = '') => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${note} Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  };
  const ok = (condition, note = 'Assertion failed') => { if (!condition) throw new Error(note); };
  const throws = fn => { let thrown = false; try { fn(); } catch { thrown = true; } ok(thrown, 'Expected an exception'); };
  const waitMicrotasks = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
  const host = () => { const root = document.createElement('div'); root.dataset.a11yToast = ''; fixture.append(root); return root; };
  const trigger = () => { const b = document.createElement('button'); b.textContent = 'Origin'; fixture.append(b); return b; };
  const create = (options = {}, root = host()) => { const instance = api.createToast(root, { animation: 'none', ...options }); instances.push(instance); return instance; };
  const item = (m, id) => m.root.querySelector(`[data-a11y-toast-id="${id}"]`);
  const events = (m, type) => { const rows = []; m.root.addEventListener(type, event => rows.push(event.detail)); return rows; };
  const hidden = value => { Object.defineProperty(document, 'hidden', { configurable: true, value }); document.dispatchEvent(new Event('visibilitychange')); };
  const fakeClock = () => {
    const pending = new Map();
    const oldSet = window.setTimeout, oldClear = window.clearTimeout;
    const oldNow = Object.getOwnPropertyDescriptor(performance, 'now');
    let now = 0, sequence = 0;
    window.setTimeout = (fn, delay = 0, ...args) => { const id = ++sequence; pending.set(id, { at: now + Math.max(0, Number(delay)), fn: () => fn(...args) }); return id; };
    window.clearTimeout = id => pending.delete(id);
    Object.defineProperty(performance, 'now', { configurable: true, value: () => now });
    clock = {
      tick(ms) {
        const end = now + ms;
        let guard = 0;
        while (true) {
          const next = [...pending].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
          if (!next) break;
          if (++guard > 5000) throw new Error('Timer loop did not settle');
          pending.delete(next[0]); now = next[1].at; next[1].fn();
        }
        now = end;
      },
      get size() { return pending.size; },
      restore() {
        window.setTimeout = oldSet; window.clearTimeout = oldClear;
        if (oldNow) Object.defineProperty(performance, 'now', oldNow); else delete performance.now;
      },
    };
    return clock;
  };
  async function test(name, fn, layout = false) {
    if (layout && !capabilities.layout) { results.push({ name, status: 'skipped', note: 'Requires a layout-capable browser' }); return; }
    fixture = document.createElement('div'); document.body.append(fixture);
    instances = []; clock = null;
    hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    const started = Date.now();
    try { await fn(); results.push({ name, status: 'pass', ms: Date.now() - started }); }
    catch (error) { results.push({ name, status: 'fail', error: String(error), stack: error.stack }); }
    finally {
      for (const m of instances.reverse()) m.destroy();
      clock?.restore();
      fixture.remove();
      if (hiddenDescriptor) Object.defineProperty(document, 'hidden', hiddenDescriptor); else delete document.hidden;
      await waitMicrotasks();
    }
  }
  await test('01 invalid/detached roots fail before setup', () => { throws(() => api.createToast(null)); throws(() => api.createToast(document.createElement('div'))); });
  await test('02 duplicate factory and class return same instance', () => {
    const m = create(); equal(api.createToast(m.root, { maxVisible: 8 }) === m, true); equal(new api.A11yToast(m.root) === m, true);
    equal(m.root.querySelectorAll('[role=status]').length, 1); equal(m.options.maxVisible, 3);
  });
  await test('03 init is re-entrant and init/ready bubble in order', () => {
    const root = host(), order = []; let reused;
    fixture.addEventListener(api.TOAST_EVENTS.init, e => { order.push('init'); reused = api.createToast(root); ok(e.bubbles && !e.composed && !e.cancelable); });
    fixture.addEventListener(api.TOAST_EVENTS.ready, () => order.push('ready'));
    const m = create({}, root); equal(reused === m, true); equal(order, ['init', 'ready']);
  });
  await test('04 authored DOM, styles and existing classes survive destroy', () => {
    const root = host(); root.className = 'author a11y-toast-region'; root.setAttribute('style', 'color: purple');
    const p = document.createElement('p'); p.textContent = 'Server-rendered status'; root.append(p);
    const before = root.outerHTML; const m = create({}, root); m.show({ message: 'Temporary' }); m.destroy(); equal(root.outerHTML, before);
  });
  await test('05 invalid data attributes are rejected, not partially parsed', () => {
    const root = host(); root.dataset.a11yToastMaxVisible = '5junk'; root.dataset.a11yToastDuration = '500ms'; root.dataset.a11yToastMaxQueue = '0';
    const m = create({}, root); equal(m.options.maxVisible, 3); equal(m.options.duration, 5000); equal(m.options.maxQueue, 0);
    ok(Object.isFrozen(m.options) && Object.isFrozen(m.options.labels) && Object.isFrozen(m.options.labels.tones));
  });
  await test('06 explicit options precede valid dataset options', () => {
    const root = host(); root.dataset.a11yToastMaxVisible = ' 2 '; root.dataset.a11yToastPriority = 'off';
    const m = create({ maxVisible: 1 }, root); equal(m.options.maxVisible, 1); equal(m.options.priority, 'off');
  });
  await test('07 host under another live region is rejected', () => { const parent = document.createElement('div'); parent.setAttribute('role','status'); fixture.append(parent); const root = host(); parent.append(root); throws(() => api.createToast(root)); });
  await test('08 empty messages are rejected atomically', () => { const m = create(); throws(() => m.show({ message: '   ' })); equal(m.getToasts().length, 0); });
  await test('09 content is plain text and never steals focus', () => {
    const origin = trigger(); origin.focus(); const m = create(); const id = m.show({ message: '<img src=x onerror=alert(1)>', title: '<script>bad</script>' });
    equal(item(m,id).querySelectorAll('img,script').length, 0); equal(document.activeElement === origin, true);
  });
  await test('10 snapshots are deeply frozen at exposed boundaries', () => {
    const m = create(); const action = { label: 'Undo', onClick() {} }; const id = m.show({ message: 'Saved', action });
    action.label = 'Changed outside'; const s = m.getToast(id); equal(s.action.label, 'Undo');
    ok(Object.isFrozen(s) && Object.isFrozen(s.action) && Object.isFrozen(s.pauseReasons) && Object.isFrozen(m.getToasts()));
    equal('onClick' in s.action, false); equal('origin' in s, false);
  });
  await test('11 visual errors remain polite unless explicitly overridden', () => { const m=create(); const id=m.error('Background refresh failed'); equal(m.getToast(id).priority,'polite'); equal(m.getToast(id).persistent,false); });
  await test('12 loading, action and assertive persistence defaults', () => {
    const m=create(); for (const input of [{tone:'loading'}, {action:{label:'Undo'}}, {priority:'assertive'}]) { const id=m.show({message:'Test',...input}); equal(m.getToast(id).persistent,true); }
  });
  await test('13 explicit timing override and zero-duration persistence', () => {
    const m=create(); const a=m.show({message:'A',action:{label:'Undo'},duration:1200}); const b=m.show({message:'B',priority:'assertive',duration:1}); const c=m.show({message:'C',duration:0});
    equal(m.getToast(a).persistent,false); equal(m.getToast(b).duration,1000); equal(m.getToast(c).persistent,true);
  });
  await test('14 queue is FIFO and waits for a free slot', () => {
    const m=create({maxVisible:1}); const a=m.show({message:'A',persistent:true}), b=m.show({message:'B',persistent:true}), c=m.show({message:'C',persistent:true});
    equal(m.visibleCount,1); equal(m.queuedCount,2); m.dismiss(a); equal(m.getToast(b).state,'visible'); equal(m.getToast(c).state,'queued');
  });
  await test('15 queued updates retain ID and show latest text', () => {
    const m=create({maxVisible:1}); const a=m.show({message:'A'}), b=m.show({message:'B'}); m.update(b,{message:'Latest B'}); m.dismiss(a);
    equal(m.getToast(b).state,'visible'); equal(item(m,b).querySelector('.a11y-toast__message').textContent,'Latest B');
  });
  await test('16 removing a queued toast prevents later display', () => {
    const m=create({maxVisible:1}); const a=m.show({message:'A'}), b=m.show({message:'B'}); m.dismiss(b); m.dismiss(a); equal(m.getToasts().length,0);
  });
  await test('17 bounded queue rejects incoming item, preserving existing items', () => {
    const m=create({maxVisible:1,maxQueue:1}); const drops=events(m,api.TOAST_EVENTS.drop); m.show({message:'A'});m.show({message:'B'});
    equal(m.show({message:'C'}),null); equal(m.visibleCount,1); equal(m.queuedCount,1); equal(drops[0].reason,'queue-full'); equal(drops[0].toast.state,'dropped');
  });
  await test('18 maxQueue zero supports no waiting queue', () => { const m=create({maxVisible:1,maxQueue:0});m.show({message:'A'});equal(m.show({message:'B'}),null);equal(m.queuedCount,0); });
  await test('19 dismissAll never briefly shows or announces queued items', () => {
    const c=fakeClock(),m=create({maxVisible:1});m.show({message:'A'});m.show({message:'B'});m.show({message:'C'});
    const shows=events(m,api.TOAST_EVENTS.show),announces=events(m,api.TOAST_EVENTS.announce);
    equal(m.dismissAll(),3);c.tick(10000);equal(shows.length,0);equal(announces.length,0);equal(m.getToasts().length,0);
  });
  await test('20 re-entrant additions during clear are explicitly dropped', () => {
    const m=create({maxVisible:1});m.show({message:'A'});m.show({message:'B'}); const returned=[];
    m.root.addEventListener(api.TOAST_EVENTS.dismiss,()=>returned.push(m.show({message:'New'})));
    m.dismissAll();equal(returned,[null,null]);equal(m.getToasts().length,0);
  });
  await test('21 a dismissal observer cannot jump ahead of existing waiters', () => {
    const m=create({maxVisible:1});const a=m.show({message:'A'}),b=m.show({message:'B'});let c;
    m.root.addEventListener(api.TOAST_EVENTS.dismiss,()=>{c=m.show({message:'C'});},{once:true});m.dismiss(a);
    equal(m.getToast(b).state,'visible');equal(m.getToast(c).state,'queued');
  });
  await test('22 exact timeout boundary', () => {const c=fakeClock(),m=create();const id=m.show({message:'Timed',duration:1000});c.tick(999);ok(m.getToast(id));c.tick(1);equal(m.getToast(id),undefined);});
  await test('23 content-only updates preserve remaining timeout', () => {
    const c=fakeClock(),m=create();const id=m.show({message:'Timed',duration:1000});c.tick(400);m.update(id,{message:'Changed'});equal(m.getToast(id).remaining,600);c.tick(600);equal(m.getToast(id),undefined);
  });
  await test('24 explicit duration restarts even when numerically unchanged', () => {
    const c=fakeClock(),m=create();const id=m.show({message:'Timed',duration:1000});c.tick(400);m.update(id,{duration:1000});equal(m.getToast(id).remaining,1000);c.tick(999);ok(m.getToast(id));c.tick(1);equal(m.getToast(id),undefined);
  });
  await test('25 API pause is idempotent and preserves remaining time', () => {
    const c=fakeClock(),m=create();const id=m.show({message:'Timed',duration:1000});c.tick(300);equal(m.pause(id),true);equal(m.pause(id),false);c.tick(5000);equal(m.getToast(id).remaining,700);m.resume(id);c.tick(700);equal(m.getToast(id),undefined);
  });
  await test('26 hover, focus and API pauses cannot clear each other', async () => {
    const c=fakeClock(),m=create();const id=m.show({message:'Timed',duration:1000});const el=item(m,id);
    el.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));el.querySelector('[data-a11y-toast-dismiss]').focus();m.pause(id);
    el.dispatchEvent(new PointerEvent('pointerout',{bubbles:true,pointerType:'mouse',relatedTarget:fixture}));m.resume(id);c.tick(2000);
    ok(m.getToast(id));equal(m.getToast(id).pauseReasons,['focus']);trigger().focus();await waitMicrotasks();c.tick(1000);equal(m.getToast(id),undefined);
  },true);
  await test('27 touch pointer events do not leave a stuck hover pause', () => {const m=create();const id=m.show({message:'A'});item(m,id).dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'touch'}));equal(m.getToast(id).pauseReasons,[]);},true);
  await test('28 hidden document pauses timers and announcements', () => {
    const c=fakeClock(),m=create();const seen=events(m,api.TOAST_EVENTS.announce);const id=m.show({message:'A',duration:1000});c.tick(50);hidden(true);c.tick(10000);
    equal(m.getToast(id).remaining,950);equal(seen.length,0);hidden(false);c.tick(100);equal(seen.length,1);c.tick(850);equal(m.getToast(id),undefined);
  });
  await test('29 initially hidden toast starts with full remaining duration', () => {const c=fakeClock();hidden(true);const m=create();const id=m.show({message:'A',duration:1000});c.tick(5000);equal(m.getToast(id).remaining,1000);hidden(false);c.tick(1000);equal(m.getToast(id),undefined);});
  await test('30 only final resume emits resume event', () => {const m=create();const id=m.show({message:'A'});const resumes=events(m,api.TOAST_EVENTS.resume);m.pause(id);hidden(true);m.resume(id);equal(resumes.length,0);hidden(false);equal(resumes.length,1);});
  await test('31 loading updates to timed success without a replacement ID', () => {const c=fakeClock(),m=create();const id=m.loading('Working');c.tick(10000);m.update(id,{message:'Done',tone:'success',duration:1000});equal(m.getToast(id).persistent,false);c.tick(1000);equal(m.getToast(id),undefined);});
  await test('32 invalid update leaves old content and timer intact', () => {const c=fakeClock(),m=create();const id=m.show({message:'Old',duration:1000});c.tick(400);throws(()=>m.update(id,{message:' '}));equal(m.getToast(id).message,'Old');equal(m.getToast(id).remaining,600);});
  await test('33 repeated same announcement update is quiet', () => {const c=fakeClock(),m=create();const seen=events(m,api.TOAST_EVENTS.announce);const id=m.show({message:'Same',persistent:true});c.tick(100);m.update(id,{message:'Same'});c.tick(3000);equal(seen.length,1);});
  await test('34 burst announcements are serialized rather than overwritten', () => {const c=fakeClock(),m=create();const seen=events(m,api.TOAST_EVENTS.announce);m.show({message:'One',persistent:true});m.show({message:'Two',persistent:true});m.show({message:'Three',persistent:true});c.tick(2500);equal(seen.map(e=>e.message),['One','Two','Three']);});
  await test('35 distinct toasts may repeat the same announcement', () => {const c=fakeClock(),m=create();const seen=events(m,api.TOAST_EVENTS.announce);m.show({message:'Saved',persistent:true});m.show({message:'Saved',persistent:true});c.tick(2000);equal(seen.length,2);});
  await test('36 update before first DOM write replaces stale message', () => {const c=fakeClock(),m=create();const seen=events(m,api.TOAST_EVENTS.announce);const id=m.show({message:'Old'});m.update(id,{message:'New'});c.tick(100);equal(seen.map(e=>e.message),['New']);});
  await test('37 priority off cancels a pending announcement', () => {const c=fakeClock(),m=create();const seen=events(m,api.TOAST_EVENTS.announce);const id=m.show({message:'Private'});m.update(id,{priority:'off'});c.tick(2000);equal(seen.length,0);equal(m.root.querySelector('[role=status]').textContent,'');});
  await test('38 announcement override and separate alert channel', () => {const c=fakeClock(),m=create();m.show({message:'Visible text',announcement:'Urgent detail',priority:'assertive'});c.tick(100);equal(m.root.querySelector('[role=alert]').textContent,'Urgent detail');equal(m.root.querySelector('[role=status]').textContent,'');});
  await test('39 queued messages remain unannounced until displayed', () => {const c=fakeClock(),m=create({maxVisible:1});const seen=events(m,api.TOAST_EVENTS.announce);const a=m.show({message:'A',persistent:true});m.show({message:'B',persistent:true});c.tick(2000);equal(seen.length,1);m.dismiss(a);c.tick(100);equal(seen.map(e=>e.message),['A','B']);});
  await test('40 action receives signal and callback fires once per invocation', () => {const m=create();let calls=0;const id=m.show({message:'Undoable',action:{label:'Undo',onClick(ctx){calls++;equal(ctx.id,id);ok(ctx.signal instanceof AbortSignal);}}});item(m,id).querySelector('[data-a11y-toast-action]').click();equal(calls,1);equal(m.getToast(id).actionPending,false);});
  await test('41 asynchronous action locks duplicates and unlocks after resolve', async () => {
    const m=create();let calls=0,resolve;const p=new Promise(r=>{resolve=r;});const id=m.show({message:'A',action:{label:'Run',onClick(){calls++;return p;}}});const b=item(m,id).querySelector('[data-a11y-toast-action]');b.click();b.click();equal(calls,1);equal(b.getAttribute('aria-disabled'),'true');resolve();await waitMicrotasks();equal(m.getToast(id).actionPending,false);equal(b.getAttribute('aria-disabled'),'false');
  });
  await test('42 action rejection leaves a visible retryable persistent failure', async () => {
    const c=fakeClock(),m=create();let first=true;const id=m.show({message:'A',duration:1000,action:{label:'Retry',onClick(){if(first){first=false;return Promise.reject(new Error('Demo'));}}}});const b=item(m,id).querySelector('[data-a11y-toast-action]');b.click();await waitMicrotasks();equal(m.getToast(id).persistent,true);ok(!item(m,id).querySelector('.a11y-toast__action-error').hidden);c.tick(2000);ok(m.getToast(id));b.click();equal(m.getToast(id).actionError,null);
  });
  await test('43 synchronous action exceptions become action-error, not uncaught errors', () => {const m=create(),seen=events(m,api.TOAST_EVENTS.actionError);const id=m.show({message:'A',action:{label:'Run',onClick(){throw new Error('Failure');}}});item(m,id).querySelector('[data-a11y-toast-action]').click();equal(seen.length,1);ok(m.getToast(id).actionError);});
  await test('44 self-updating action does not overwrite its own successful result', () => {const m=create();const id=m.show({message:'A',action:{label:'Undo',onClick({instance,id}){instance.update(id,{message:'Undone',action:null,tone:'success',persistent:false});}}});item(m,id).querySelector('[data-a11y-toast-action]').click();equal(m.getToast(id).message,'Undone');equal(m.getToast(id).action,null);});
  await test('45 dismissed pending action aborts and late resolution is ignored', async () => {const m=create();let resolve,signal;const p=new Promise(r=>{resolve=r;});const id=m.show({message:'A',action:{label:'Run',onClick(ctx){signal=ctx.signal;return p;}}});item(m,id).querySelector('[data-a11y-toast-action]').click();m.dismiss(id);ok(signal.aborted);resolve();await waitMicrotasks();equal(m.getToasts().length,0);});
  await test('46 replacing pending action aborts only the old operation', async () => {const m=create();let reject,signal;const p=new Promise((_,r)=>{reject=r;});const id=m.show({message:'A',action:{label:'Old',onClick(ctx){signal=ctx.signal;return p;}}});item(m,id).querySelector('[data-a11y-toast-action]').click();m.update(id,{action:{label:'New'}});ok(signal.aborted);reject(new Error('Old result'));await waitMicrotasks();equal(m.getToast(id).action.label,'New');equal(m.getToast(id).actionError,null);});
  await test('47 dismissing in the action event prevents callback execution', () => {const m=create();let called=false;const id=m.show({message:'A',action:{label:'Run',onClick(){called=true;}}});m.root.addEventListener(api.TOAST_EVENTS.action,()=>m.dismiss(id));item(m,id).querySelector('[data-a11y-toast-action]').click();equal(called,false);});
  await test('48 opt-in dismissal after successful action', () => {const m=create();const id=m.show({message:'A',action:{label:'Done',dismissOnSuccess:true,onClick(){}}});item(m,id).querySelector('[data-a11y-toast-action]').click();equal(m.getToast(id),undefined);});
  await test('49 add-on setup and cleanup execute exactly once', () => {const m=create();let setup=0,cleanup=0;const a={name:'test',setup(){setup++;return()=>{cleanup++;};}};m.registerAddon(a);throws(()=>m.registerAddon(a));equal(m.unregisterAddon('test'),true);equal(m.unregisterAddon('test'),false);m.destroy();equal([setup,cleanup],[1,1]);});
  await test('50 setup failure automatically removes add-on subscriptions', () => {const m=create();let called=0;const errs=events(m,api.TOAST_EVENTS.addonError);m.registerAddon({name:'bad',setup(ctx){ctx.on(api.TOAST_EVENTS.show,()=>called++);throw new Error('Setup');}});m.show({message:'A'});equal(called,0);equal(m.getAddon('bad'),undefined);equal(errs.length,1);});
  await test('51 observer-hook failure does not prevent display', () => {const m=create();const errs=events(m,api.TOAST_EVENTS.addonError);m.registerAddon({name:'bad',beforeShow(){throw new Error('Hook');}});const id=m.show({message:'A'});ok(item(m,id));equal(errs[0].phase,'beforeShow');});
  await test('52 add-on cleanup runs in reverse order despite errors', () => {const m=create();const order=[];m.registerAddon({name:'first',setup(){return()=>order.push('first');}});m.registerAddon({name:'second',setup(){return()=>{order.push('second');throw new Error('Cleanup');};}});m.destroy();equal(order,['second','first']);});
  await test('53 unregistering another add-on does not skip remaining hooks', () => {const m=create();const order=[];m.registerAddon({name:'a',beforeShow(){m.unregisterAddon('b');order.push('a');}});m.registerAddon({name:'b',beforeShow(){order.push('b');}});m.registerAddon({name:'c',beforeShow(){order.push('c');}});m.show({message:'A'});equal(order,['a','c']);});
  await test('54 self-unregister during setup still runs returned cleanup once', () => {const m=create();let cleanup=0;m.registerAddon({name:'a',setup(){m.unregisterAddon('a');return()=>cleanup++;}});m.destroy();equal(cleanup,1);});
  await test('55 typed event helper returns a working disposer', () => {const m=create();let n=0;const off=api.addToastEventListener(m.root,api.TOAST_EVENTS.show,()=>n++);m.show({message:'A'});off();m.show({message:'B'});equal(n,1);});
  await test('56 destroy cancels all timers and pending DOM writes', () => {const c=fakeClock(),m=create();const seen=events(m,api.TOAST_EVENTS.announce);m.show({message:'A'});m.pause(m.getToasts()[0].id);m.destroy();m.destroy();equal(c.size,0);c.tick(10000);equal(seen.length,0);equal(m.root.children.length,0);});
  await test('57 post-destroy mutations fail safely and reads are empty', () => {const m=create();m.destroy();throws(()=>m.show({message:'A'}));throws(()=>m.update('x',{message:'A'}));throws(()=>m.registerAddon({name:'a'}));equal(m.dismiss('x'),false);equal(m.dismissAll(),0);equal(m.getToasts(),[]);});
  await test('58 reinitialization from destroy event retains new registration', () => {const m=create();let next;m.root.addEventListener(api.TOAST_EVENTS.destroy,()=>{next=create({},m.root);},{once:true});m.destroy();ok(next!==m);equal(next.isDestroyed,false);equal(api.createToast(m.root)===next,true);equal(next.root.querySelectorAll('[role=status]').length,1);});
  await test('59 destroyed pending action never emits later events', async () => {const c=fakeClock(),m=create();let reject;const p=new Promise((_,r)=>{reject=r;});const id=m.show({message:'A',action:{label:'Run',onClick(){return p;}}});item(m,id).querySelector('[data-a11y-toast-action]').click();m.destroy();const seen=events(m,api.TOAST_EVENTS.actionError);reject(new Error('Late'));await waitMicrotasks();c.tick(5000);equal(seen.length,0);equal(m.getToasts().length,0);});
  await test('60 abort listener destroying manager cannot revive an update', () => {const m=create();const id=m.show({message:'A',action:{label:'Run',onClick({signal}){signal.addEventListener('abort',()=>m.destroy());return new Promise(()=>{});}}});item(m,id).querySelector('[data-a11y-toast-action]').click();equal(m.update(id,{action:null,message:'Should not render'}),false);equal(m.isDestroyed,true);equal(m.root.children.length,0);});
  await test('61 initial/dismiss events carry stable frozen state', () => {const m=create();const shown=events(m,api.TOAST_EVENTS.show),dismissed=events(m,api.TOAST_EVENTS.dismiss);const id=m.show({message:'A'});m.dismiss(id);ok(Object.isFrozen(shown[0])&&Object.isFrozen(shown[0].toast));equal(shown[0].toast.state,'visible');equal(dismissed[0].toast.state,'dismissed');ok(shown[0].instance===m);});
  await test('62 multiple instances keep state, styles and cleanup independent', () => {const a=create(),b=create();const id=a.show({message:'A'}),id2=b.show({message:'B'});ok(id!==id2);a.destroy();ok(item(b,id2));equal(b.visibleCount,1);});
  await test('63 root disconnect is an explicit lifecycle error, destroy still works', () => {const m=create();m.root.remove();throws(()=>m.show({message:'Detached'}));m.destroy();equal(m.isDestroyed,true);});
  await test('64 scoped init helper initializes only matching descendants', () => {const a=host(),b=host();const results=api.initToastAll({},fixture);instances.push(...results);equal(results.length,2);equal(results[0].root,a);equal(results[1].root,b);});
  await test('65 focused close restores a surviving explicit origin', () => {const origin=trigger();const m=create();const id=m.show({message:'A',origin});const close=item(m,id).querySelector('[data-a11y-toast-dismiss]');close.focus();close.click();equal(document.activeElement===origin,true);},true);
  await test('66 programmatic dismissal cannot steal outside focus', () => {const first=trigger(),second=trigger(),m=create();const id=m.show({message:'A',origin:first});second.focus();m.dismiss(id);equal(document.activeElement===second,true);},true);
  await test('67 disconnected origin falls back to another toast control', () => {const origin=trigger(),m=create();const a=m.show({message:'A',origin}),b=m.show({message:'B'});origin.remove();const close=item(m,a).querySelector('[data-a11y-toast-dismiss]');close.focus();close.click();equal(document.activeElement===item(m,b).querySelector('[data-a11y-toast-dismiss]'),true);},true);
  await test('68 focused action survives content updates and moves when removed', () => {const m=create();const id=m.show({message:'A',action:{label:'Run'}});const button=item(m,id).querySelector('[data-a11y-toast-action]');button.focus();m.update(id,{message:'B'});equal(document.activeElement===button,true);m.update(id,{action:null});equal(document.activeElement===item(m,id).querySelector('[data-a11y-toast-dismiss]'),true);},true);
  await test('69 focus on notification list pauses all visible timers', async () => {const c=fakeClock(),m=create();const a=m.show({message:'A',duration:1000}),b=m.show({message:'B',duration:1000});m.root.querySelector('ol').focus();c.tick(5000);ok(m.getToast(a)&&m.getToast(b));trigger().focus();await waitMicrotasks();c.tick(1000);equal(m.getToasts().length,0);},true);
  await test('70 no global Escape handler dismisses notifications', () => {const m=create();const id=m.show({message:'A'});document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));ok(m.getToast(id));});
  await test('71 helper includes action wording but not close-control chrome', () => {const c=fakeClock(),m=create();const seen=events(m,api.TOAST_EVENTS.announce);m.show({message:'Deleted',action:{label:'Undo'}});c.tick(100);equal(seen[0].message,'Deleted. Undo');ok(!seen[0].message.includes('Close'));});
  await test('72 nested manager events are not consumed by another add-on', () => {const outer=create();const nested=document.createElement('div');outer.root.append(nested);const inner=create({},nested);let n=0;outer.registerAddon({name:'observer',setup(ctx){ctx.on(api.TOAST_EVENTS.show,()=>n++);}});inner.show({message:'Inner'});equal(n,0);outer.show({message:'Outer'});equal(n,1);});
  await test('73 last focused close has a visible fallback when no origin survives', async () => {const m=create();const id=m.show({message:'A'});const close=item(m,id).querySelector('[data-a11y-toast-dismiss]');close.focus();close.click();const empty=m.root.querySelector('.a11y-toast-region__empty');equal(empty.hidden,false);ok(document.activeElement.contains(empty));ok(document.activeElement.getBoundingClientRect().height>20);trigger().focus();await waitMicrotasks();equal(empty.hidden,true);},true);
  await test('74 destruction from a pause observer prevents a later action event', () => {const m=create();let calls=0;const id=m.show({message:'A',action:{label:'Run',onClick(){calls++;}}});const seen=events(m,api.TOAST_EVENTS.action);m.root.addEventListener(api.TOAST_EVENTS.pause,()=>m.destroy());item(m,id).querySelector('[data-a11y-toast-action]').click();equal(m.isDestroyed,true);equal(calls,0);equal(seen.length,0);});
  await test('75 destruction from a resume observer prevents stale action errors', async () => {const m=create();let reject;const p=new Promise((_,r)=>{reject=r;});const id=m.show({message:'A',action:{label:'Run',onClick(){return p;}}});item(m,id).querySelector('[data-a11y-toast-action]').click();const seen=events(m,api.TOAST_EVENTS.actionError);m.root.addEventListener(api.TOAST_EVENTS.resume,()=>m.destroy());reject(new Error('Expected'));await waitMicrotasks();equal(m.isDestroyed,true);equal(seen.length,0);});
  await test('76 malformed async add-on setup is rejected without unhandled rejection', async () => {const m=create();const seen=events(m,api.TOAST_EVENTS.addonError);m.registerAddon({name:'async-invalid',async setup(){throw new Error('Invalid async setup');}});await waitMicrotasks();equal(m.getAddon('async-invalid'),undefined);equal(seen.length,1);});
  await test('77 accidental async observer failures are isolated', async () => {const m=create();const seen=events(m,api.TOAST_EVENTS.addonError);m.registerAddon({name:'async-observer',async afterShow(){throw new Error('Observer');}});const id=m.show({message:'A'});await waitMicrotasks();ok(m.getToast(id));equal(seen.length,1);});
  await test('78 tone label is visible by default and can be hidden without changing announcement wording', () => {
    const visible = create();
    const visibleId = visible.success('Saved', { persistent: true });
    const visibleTone = item(visible, visibleId).querySelector('.a11y-toast__tone');
    equal(visibleTone.hidden, false);

    const hiddenManager = create({ showToneLabel: false });
    const hiddenId = hiddenManager.success('Saved', { persistent: true });
    const hiddenTone = item(hiddenManager, hiddenId).querySelector('.a11y-toast__tone');
    equal(hiddenManager.options.showToneLabel, false);
    equal(hiddenTone.hidden, false);
    equal(hiddenTone.getAttribute('aria-hidden'), null);
    equal(hiddenTone.classList.contains('a11y-toast__tone--visually-hidden'), true);
    if (capabilities.layout) {
      const rect = hiddenTone.getBoundingClientRect();
      ok(rect.width <= 1.1 && rect.height <= 1.1, 'Visually hidden tone text must not occupy visible layout space');
    }
    equal(hiddenManager.getToast(hiddenId).announcement, 'Success. Saved');
  });

  await test('79 tone-label dataset option is strict and explicit option wins', () => {
    const root = host();
    root.dataset.a11yToastShowToneLabel = '0';
    const invalidManager = create({}, root);
    equal(invalidManager.options.showToneLabel, true);
    invalidManager.destroy();

    root.dataset.a11yToastShowToneLabel = 'false';
    const hiddenManager = create({}, root);
    equal(hiddenManager.options.showToneLabel, false);
    hiddenManager.destroy();

    const shownManager = create({ showToneLabel: true }, root);
    equal(shownManager.options.showToneLabel, true);
    const id = shownManager.info('Visible label', { persistent: true });
    const tone = item(shownManager, id).querySelector('.a11y-toast__tone');
    equal(tone.classList.contains('a11y-toast__tone--visually-hidden'), false);
  });

  await test('80 animation defaults to css and invalid custom drivers fail before initialization', () => {
    const root = host();
    const m = api.createToast(root);
    instances.push(m);
    equal(m.options.animation, 'css');
    equal(m.root.querySelector('.a11y-toast-region__viewport').dataset.a11yToastAnimation, 'css');
    m.destroy();
    throws(() => create({ animation: { name: 'empty-driver' } }, root));
  });

  await test('81 custom entrance delays timeout until animation completion', async () => {
    const c = fakeClock(); let resolveEnter, signal;
    const driver = { name: 'test-driver', enter(context) {
      signal = context.signal;
      return new Promise(resolve => { resolveEnter = resolve; });
    }};
    const m = create({ animation: driver });
    const starts = events(m, api.TOAST_EVENTS.animationStart);
    const ends = events(m, api.TOAST_EVENTS.animationEnd);
    const id = m.show({ message: 'Animated', duration: 1000 });
    equal(m.getToast(id).animationPhase, 'enter');
    equal(starts.map(row => [row.phase, row.driver]), [['enter', 'test-driver']]);
    c.tick(5000);
    equal(m.getToast(id).remaining, 1000);
    ok(!signal.aborted);
    resolveEnter();
    await waitMicrotasks();
    equal(m.getToast(id).animationPhase, null);
    equal(ends.map(row => [row.phase, row.status]), [['enter', 'completed']]);
    c.tick(999); ok(m.getToast(id));
    c.tick(1); equal(m.getToast(id), undefined);
  });

  await test('82 animated exit dismisses logically at once but reserves its visual slot', async () => {
    let resolveExit;
    const driver = { name: 'exit-driver', exit() { return new Promise(resolve => { resolveExit = resolve; }); } };
    const m = create({ animation: driver, maxVisible: 1 });
    const a = m.show({ message: 'A', persistent: true });
    const b = m.show({ message: 'B', persistent: true });
    const element = item(m, a);
    equal(m.getToast(b).state, 'queued');
    equal(m.dismiss(a), true);
    equal(m.getToast(a), undefined);
    equal(element.isConnected, true);
    equal(element.getAttribute('aria-hidden'), 'true');
    equal(element.inert, true);
    equal(m.getToast(b).state, 'queued');
    resolveExit();
    await waitMicrotasks();
    equal(element.isConnected, false);
    equal(m.getToast(b).state, 'visible');
  });

  await test('83 destroy aborts an active custom animation and removes generated DOM synchronously', () => {
    let signal;
    const driver = { name: 'never-ending', enter(context) {
      signal = context.signal;
      return new Promise(() => {});
    }};
    const m = create({ animation: driver });
    const ends = events(m, api.TOAST_EVENTS.animationEnd);
    m.show({ message: 'A', persistent: true });
    m.destroy();
    equal(signal.aborted, true);
    equal(ends.map(row => row.status), ['cancelled']);
    equal(m.root.children.length, 0);
  });

  await test('84 animation driver failure is isolated and leaves the toast usable', async () => {
    const m = create({ animation: { name: 'failing', enter() { return Promise.reject(new Error('Animation failure')); } } });
    const errors = events(m, api.TOAST_EVENTS.animationError);
    const ends = events(m, api.TOAST_EVENTS.animationEnd);
    const id = m.show({ message: 'Still visible', persistent: true });
    await waitMicrotasks();
    ok(m.getToast(id));
    equal(m.getToast(id).animationPhase, null);
    equal(errors.length, 1);
    equal(errors[0].driver, 'failing');
    equal(ends.map(row => row.status), ['failed']);
  });

  await test('85 reduced motion skips injected animation and starts timing immediately', () => {
    const oldMatchMedia = window.matchMedia;
    window.matchMedia = query => ({
      matches: query === '(prefers-reduced-motion: reduce)', media: query, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    });
    try {
      const c = fakeClock(); let calls = 0;
      const m = create({ animation: { name: 'motion', enter() { calls++; } } });
      const id = m.show({ message: 'Reduced', duration: 1000 });
      equal(calls, 0);
      equal(m.getToast(id).animationPhase, null);
      c.tick(1000);
      equal(m.getToast(id), undefined);
    } finally { window.matchMedia = oldMatchMedia; }
  });

  await test('86 CSS exit keeps an inert surface until animation completes, then promotes the queue', async () => {
    const m = create({ animation: 'css', maxVisible: 1 });
    const waitForPhase = phase => new Promise(resolve => {
      const off = api.addToastEventListener(m.root, api.TOAST_EVENTS.animationEnd, event => {
        if (event.detail.phase !== phase) return;
        off(); resolve(event.detail);
      });
    });
    const enterDone = waitForPhase('enter');
    const a = m.show({ message: 'A', persistent: true });
    await enterDone;
    const b = m.show({ message: 'B', persistent: true });
    const element = item(m, a);
    const exitDone = waitForPhase('exit');
    m.dismiss(a);
    equal(m.getToast(a), undefined);
    equal(element.isConnected, true);
    equal(element.classList.contains('is-exiting'), true);
    equal(element.getAttribute('aria-hidden'), 'true');
    equal(m.getToast(b).state, 'queued');
    const detail = await exitDone;
    equal(detail.status, 'completed');
    equal(element.isConnected, false);
    equal(m.getToast(b).state, 'visible');
  }, true);

  await test('87 dismissing re-entrantly from animation-start cancels entrance without a stale timer', async () => {
    const c = fakeClock(); let enterCalls = 0;
    const m = create({ animation: { name: 'start-reentry', enter() { enterCalls++; } } });
    const ends = events(m, api.TOAST_EVENTS.animationEnd);
    let id;
    m.root.addEventListener(api.TOAST_EVENTS.animationStart, event => {
      if (event.detail.phase === 'enter') m.dismiss(event.detail.toast.id);
    });
    id = m.show({ message: 'A', duration: 1000 });
    await waitMicrotasks();
    equal(enterCalls, 0);
    equal(m.getToast(id), undefined);
    equal(item(m, id), null);
    equal(ends.map(row => [row.phase, row.status]), [['enter', 'cancelled']]);
    c.tick(5000);
    equal(m.getToasts().length, 0);
  });

  await test('88 destroying from animation-error prevents stale animation-end and completion work', async () => {
    const m = create({ animation: { name: 'fail-reentry', enter() { return Promise.reject(new Error('Expected failure')); } } });
    const ends = events(m, api.TOAST_EVENTS.animationEnd);
    const errors = events(m, api.TOAST_EVENTS.animationError);
    m.root.addEventListener(api.TOAST_EVENTS.animationError, () => m.destroy(), { once: true });
    m.show({ message: 'A', duration: 1000 });
    await waitMicrotasks();
    equal(errors.length, 1);
    equal(ends.length, 0);
    equal(m.isDestroyed, true);
    equal(m.root.children.length, 0);
  });

  await test('89 re-entrant show from exit animation-end stays behind an existing waiter', async () => {
    let resolveExit;
    const m = create({
      maxVisible: 1,
      animation: { name: 'queue-order', exit() { return new Promise(resolve => { resolveExit = resolve; }); } },
    });
    const a = m.show({ message: 'A', persistent: true });
    const b = m.show({ message: 'B', persistent: true });
    let cId = null;
    m.root.addEventListener(api.TOAST_EVENTS.animationEnd, event => {
      if (event.detail.phase === 'exit') cId = m.show({ message: 'C', persistent: true });
    }, { once: true });
    m.dismiss(a);
    resolveExit();
    await waitMicrotasks();
    equal(m.getToast(b).state, 'visible');
    equal(m.getToast(cId).state, 'queued');
    equal(m.getToasts().map(row => row.message), ['B', 'C']);
  });

  await test('90 dismissAll clears visible and queued records atomically while multiple exits finish independently', async () => {
    const resolvers = new Map();
    const m = create({
      maxVisible: 2,
      animation: {
        name: 'batch-exit',
        exit(context) { return new Promise(resolve => resolvers.set(context.toast.id, resolve)); },
      },
    });
    const ids = ['A', 'B', 'C', 'D'].map(message => m.show({ message, persistent: true }));
    const dropped = events(m, api.TOAST_EVENTS.drop);
    const reentrant = [];
    m.root.addEventListener(api.TOAST_EVENTS.dismiss, () => reentrant.push(m.show({ message: 'During clear', persistent: true })));
    equal(m.dismissAll(), 4);
    equal(m.getToasts().length, 0);
    equal(reentrant, [null, null, null, null]);
    equal(dropped.map(row => row.reason), ['clearing', 'clearing', 'clearing', 'clearing']);
    equal(ids.slice(0, 2).every(id => item(m, id)?.getAttribute('aria-hidden') === 'true'), true);
    equal(ids.slice(2).every(id => item(m, id) === null), true);
    equal(resolvers.size, 2);
    for (const resolve of resolvers.values()) resolve();
    await waitMicrotasks();
    equal(m.root.querySelectorAll('[data-a11y-toast-id]').length, 0);
  });

  await test('91 hiding the document cancels entrance, preserves full time, and resumes timing when visible', async () => {
    const c = fakeClock(); let signal;
    const m = create({
      animation: { name: 'hidden-enter', enter(context) { signal = context.signal; return new Promise(() => {}); } },
    });
    const ends = events(m, api.TOAST_EVENTS.animationEnd);
    const id = m.show({ message: 'A', duration: 1000 });
    equal(m.getToast(id).animationPhase, 'enter');
    hidden(true);
    equal(signal.aborted, true);
    equal(m.getToast(id).animationPhase, null);
    equal(m.getToast(id).remaining, 1000);
    equal(ends.map(row => [row.phase, row.status]), [['enter', 'cancelled']]);
    c.tick(5000);
    ok(m.getToast(id));
    hidden(false);
    c.tick(999); ok(m.getToast(id));
    c.tick(1); equal(m.getToast(id), undefined);
  });

  await test('92 hiding the document cancels exit and releases its slot without reviving the dismissed record', async () => {
    let signal;
    const m = create({
      maxVisible: 1,
      animation: { name: 'hidden-exit', exit(context) { signal = context.signal; return new Promise(() => {}); } },
    });
    const a = m.show({ message: 'A', persistent: true });
    const b = m.show({ message: 'B', persistent: true });
    const element = item(m, a);
    m.dismiss(a);
    equal(element.isConnected, true);
    hidden(true);
    equal(signal.aborted, true);
    equal(element.isConnected, false);
    equal(m.getToast(a), undefined);
    equal(m.getToast(b).state, 'visible');
    equal(m.getToast(b).pauseReasons.includes('document-hidden'), true);
    hidden(false);
  });

  await test('93 destroy from animation-end suppresses stale completion and queued promotion', async () => {
    let resolveExit;
    const m = create({
      maxVisible: 1,
      animation: { name: 'end-destroy', exit() { return new Promise(resolve => { resolveExit = resolve; }); } },
    });
    const a = m.show({ message: 'A', persistent: true });
    m.show({ message: 'B', persistent: true });
    m.root.addEventListener(api.TOAST_EVENTS.animationEnd, event => {
      if (event.detail.phase === 'exit') m.destroy();
    }, { once: true });
    m.dismiss(a);
    resolveExit();
    await waitMicrotasks();
    equal(m.isDestroyed, true);
    equal(m.getToasts().length, 0);
    equal(m.root.children.length, 0);
  });

  await test('94 two controlled exits release exactly one queued slot each', async () => {
    const resolvers = new Map();
    const m = create({
      maxVisible: 2,
      animation: {
        name: 'slot-stress',
        exit(context) { return new Promise(resolve => resolvers.set(context.toast.id, resolve)); },
      },
    });
    const a = m.show({ message: 'A', persistent: true });
    const b = m.show({ message: 'B', persistent: true });
    const cId = m.show({ message: 'C', persistent: true });
    const d = m.show({ message: 'D', persistent: true });
    m.dismiss(a);
    m.dismiss(b);
    equal(m.getToast(cId).state, 'queued');
    equal(m.getToast(d).state, 'queued');
    resolvers.get(b)();
    await waitMicrotasks();
    equal(m.getToast(cId).state, 'visible');
    equal(m.getToast(d).state, 'queued');
    resolvers.get(a)();
    await waitMicrotasks();
    equal(m.getToast(d).state, 'visible');
    equal(m.visibleCount, 2);
  });

  await test('95 progress add-on renders only for visible timed notifications and stays non-semantic', () => {
    const m = create({ addons: [api.createProgressAddon()] });
    const timed = m.show({ message: 'Timed', duration: 5000 });
    const track = item(m, timed).querySelector('[data-a11y-toast-progress]');
    ok(track);
    equal(track.getAttribute('aria-hidden'), 'true');
    equal(track.getAttribute('role'), null);
    equal(track.getAttribute('aria-live'), null);
    const persistent = m.show({ message: 'Persistent', persistent: true });
    equal(item(m, persistent).querySelector('[data-a11y-toast-progress]'), null);
  });

  await test('96 progress add-on waits for queued toast display before creating DOM', () => {
    const m = create({ maxVisible: 1, addons: [api.createProgressAddon()] });
    const a = m.show({ message: 'A', persistent: true });
    const b = m.show({ message: 'B', duration: 5000 });
    equal(item(m, b), null);
    m.dismiss(a);
    ok(item(m, b).querySelector('[data-a11y-toast-progress]'));
  });

  await test('97 progress add-on freezes and resumes from authoritative remaining time', () => {
    const c = fakeClock();
    const m = create({ addons: [api.createProgressAddon()] });
    const id = m.show({ message: 'A', duration: 1000 });
    c.tick(400);
    m.pause(id);
    const track = item(m, id).querySelector('[data-a11y-toast-progress]');
    const bar = track.querySelector('[data-a11y-toast-progress-bar]');
    equal(track.dataset.a11yToastProgressState, 'paused');
    ok(bar.style.transform.includes('0.6'));
    m.resume(id);
    equal(track.dataset.a11yToastProgressState, 'running');
    equal(Number.parseFloat(bar.style.transitionDuration), 600);
  });

  await test('98 progress add-on follows timed/persistent updates without owning timer state', () => {
    const c = fakeClock();
    const m = create({ addons: [api.createProgressAddon()] });
    const id = m.show({ message: 'A', duration: 1000 });
    c.tick(400);
    m.update(id, { message: 'B' });
    let bar = item(m, id).querySelector('[data-a11y-toast-progress-bar]');
    equal(Number.parseFloat(bar.style.transitionDuration), 600);
    m.update(id, { persistent: true });
    equal(item(m, id).querySelector('[data-a11y-toast-progress]'), null);
    m.update(id, { persistent: false, duration: 2000 });
    bar = item(m, id).querySelector('[data-a11y-toast-progress-bar]');
    equal(Number.parseFloat(bar.style.transitionDuration), 2000);
  });

  await test('99 loading-to-success creates progress only when the toast becomes timed', () => {
    const m = create({ addons: [api.createProgressAddon()] });
    const id = m.loading('Working');
    equal(item(m, id).querySelector('[data-a11y-toast-progress]'), null);
    m.update(id, { message: 'Done', tone: 'success', persistent: false, duration: 5000 });
    ok(item(m, id).querySelector('[data-a11y-toast-progress]'));
  });

  await test('100 unregistering progress removes all add-on DOM and leaves toast lifecycle untouched', () => {
    const m = create();
    const id = m.show({ message: 'A', duration: 5000 });
    m.registerAddon(api.createProgressAddon());
    ok(item(m, id).querySelector('[data-a11y-toast-progress]'));
    equal(m.unregisterAddon('progress'), true);
    equal(item(m, id).querySelector('[data-a11y-toast-progress]'), null);
    ok(m.getToast(id));
  });

  await test('101 progress add-on can adopt an already-visible timed toast', () => {
    const c = fakeClock();
    const m = create();
    const id = m.show({ message: 'A', duration: 1000 });
    c.tick(250);
    m.registerAddon(api.createProgressAddon());
    const bar = item(m, id).querySelector('[data-a11y-toast-progress-bar]');
    ok(bar);
    equal(Number.parseFloat(bar.style.transitionDuration), 750);
  });

  await test('102 promise orchestration updates one retained ID from loading to success', async () => {
    let resolve;
    const operation = new Promise(r => { resolve = r; });
    const m = create();
    const handle = api.trackToastPromise(m, operation, {
      loading: 'Saving',
      success: { message: 'Saved', duration: 5000 },
      error: 'Could not save',
    });
    ok(handle.id);
    equal(m.getToast(handle.id).tone, 'loading');
    equal(m.getToast(handle.id).persistent, true);
    resolve('value');
    await waitMicrotasks();
    equal(m.getToast(handle.id).message, 'Saved');
    equal(m.getToast(handle.id).tone, 'success');
    equal(m.getToasts().length, 1);
    equal(await handle.promise, 'value');
  });

  await test('103 promise rejection uses caller copy and never exposes raw rejection text', async () => {
    let reject;
    const operation = new Promise((_, r) => { reject = r; });
    const m = create();
    const handle = api.trackToastPromise(m, operation, {
      loading: 'Saving',
      success: 'Saved',
      error: { message: 'Could not save. Try again.', persistent: true },
    });
    reject(new Error('secret backend detail'));
    await handle.promise.catch(() => {});
    await waitMicrotasks();
    const toast = m.getToast(handle.id);
    equal(toast.message, 'Could not save. Try again.');
    equal(toast.tone, 'error');
    equal(toast.persistent, true);
    ok(!toast.message.includes('secret backend detail'));
  });

  await test('104 dismissing the loading toast stops orchestration and late resolution is ignored', async () => {
    let resolve;
    const operation = new Promise(r => { resolve = r; });
    const m = create();
    const updates = events(m, api.TOAST_EVENTS.update);
    const handle = api.trackToastPromise(m, operation, {
      loading: 'Working', success: 'Done', error: 'Failed',
    });
    m.dismiss(handle.id);
    resolve('late');
    await waitMicrotasks();
    equal(m.getToast(handle.id), undefined);
    equal(updates.length, 0);
    equal(handle.stop(), false);
  });

  await test('105 destroying the manager ignores late rejection without leaking a toast update', async () => {
    let reject;
    const operation = new Promise((_, r) => { reject = r; });
    const m = create();
    const handle = api.trackToastPromise(m, operation, {
      loading: 'Working', success: 'Done', error: 'Friendly failure',
    });
    m.destroy();
    reject(new Error('private failure'));
    await handle.promise.catch(() => {});
    await waitMicrotasks();
    equal(m.isDestroyed, true);
    equal(handle.stop(), false);
  });

  await test('106 promise can settle while queued and displays the latest outcome when promoted', async () => {
    let resolve;
    const operation = new Promise(r => { resolve = r; });
    const m = create({ maxVisible: 1 });
    const blocker = m.show({ message: 'Blocker', persistent: true });
    const handle = api.trackToastPromise(m, operation, {
      loading: 'Queued work', success: { message: 'Queued work done', duration: 5000 }, error: 'Queued work failed',
    });
    equal(m.getToast(handle.id).state, 'queued');
    resolve('done');
    await waitMicrotasks();
    equal(m.getToast(handle.id).message, 'Queued work done');
    equal(m.getToast(handle.id).state, 'queued');
    m.dismiss(blocker);
    equal(m.getToast(handle.id).state, 'visible');
    equal(m.getToast(handle.id).tone, 'success');
  });

  await test('107 promise orchestration composes with progress add-on after loading becomes timed', async () => {
    let resolve;
    const operation = new Promise(r => { resolve = r; });
    const m = create({ addons: [api.createProgressAddon()] });
    const handle = api.trackToastPromise(m, operation, {
      loading: 'Working', success: { message: 'Done', duration: 5000 }, error: 'Failed',
    });
    equal(item(m, handle.id).querySelector('[data-a11y-toast-progress]'), null);
    resolve('done');
    await waitMicrotasks();
    ok(item(m, handle.id).querySelector('[data-a11y-toast-progress]'));
  });

  await test('108 stop detaches orchestration without dismissing or cancelling the underlying promise', async () => {
    let resolve;
    const operation = new Promise(r => { resolve = r; });
    const m = create();
    const handle = api.trackToastPromise(m, operation, {
      loading: 'Working', success: 'Done', error: 'Failed',
    });
    equal(handle.stop(), true);
    equal(handle.stop(), false);
    ok(m.getToast(handle.id));
    resolve('value');
    equal(await handle.promise, 'value');
    await waitMicrotasks();
    equal(m.getToast(handle.id).message, 'Working');
    equal(m.getToast(handle.id).tone, 'loading');
  });

  await test('109 invalid promise state copy fails before creating a loading toast', () => {
    const m = create();
    throws(() => api.trackToastPromise(m, Promise.resolve(), {
      loading: 'Working', success: '  ', error: 'Failed',
    }));
    equal(m.getToasts().length, 0);
    throws(() => api.trackToastPromise(m, Promise.resolve(), {
      loading: 'Working', success: 'Done', error: '',
    }));
    equal(m.getToasts().length, 0);
  });

  await test('110 full queue returns a null orchestration ID while preserving promise pass-through', async () => {
    const m = create({ maxVisible: 1, maxQueue: 0 });
    m.show({ message: 'Blocker', persistent: true });
    const handle = api.trackToastPromise(m, Promise.resolve(42), {
      loading: 'Working', success: 'Done', error: 'Failed',
    });
    equal(handle.id, null);
    equal(await handle.promise, 42);
    await waitMicrotasks();
    equal(m.getToasts().length, 1);
  });

  await test('111 update-existing keeps one ID and avoids a second show event', async () => {
    const m = create();
    const controller = api.createDedupeController(m);
    const first = await controller.show({ key: 'save', message: 'Saving', persistent: true });
    const shows = events(m, api.TOAST_EVENTS.show);
    const updates = events(m, api.TOAST_EVENTS.update);
    const second = await controller.show({ key: 'save', message: 'Saved', duration: 5000 });
    equal(first.status, 'shown');
    equal(second.status, 'updated');
    equal(second.id, first.id);
    equal(m.getToasts().length, 1);
    equal(m.getToast(first.id).message, 'Saved');
    equal(shows.length, 0);
    equal(updates.length, 1);
  });

  await test('112 update-existing preserves queued position while updating keyed content', async () => {
    const m = create({ maxVisible: 1 });
    const controller = api.createDedupeController(m);
    const blocker = m.show({ message: 'Blocker', persistent: true });
    const keyed = await controller.show({ key: 'job', message: 'Queued A', persistent: true });
    const other = m.show({ message: 'Other', persistent: true });
    const updated = await controller.show({ key: 'job', message: 'Queued B', persistent: true });
    equal(updated.id, keyed.id);
    equal(m.getToasts().map(row => row.message), ['Blocker', 'Queued B', 'Other']);
    m.dismiss(blocker);
    equal(m.getToast(keyed.id).state, 'visible');
    equal(m.getToast(other).state, 'queued');
  });

  await test('113 drop-new keeps existing keyed toast unchanged without update or announcement', async () => {
    const c = fakeClock();
    const m = create();
    const controller = api.createDedupeController(m, { policy: 'drop-new' });
    const first = await controller.show({ key: 'sync', message: 'First', persistent: true });
    c.tick(100);
    const updates = events(m, api.TOAST_EVENTS.update);
    const announcements = events(m, api.TOAST_EVENTS.announce);
    const second = await controller.show({ key: 'sync', message: 'Second', persistent: true });
    c.tick(2000);
    equal(second.status, 'kept-existing');
    equal(second.id, first.id);
    equal(m.getToast(first.id).message, 'First');
    equal(updates.length, 0);
    equal(announcements.length, 0);
  });

  await test('114 replace-existing waits for visual exit before showing the replacement', async () => {
    let resolveExit;
    const m = create({
      animation: { name: 'dedupe-exit', exit() { return new Promise(resolve => { resolveExit = resolve; }); } },
    });
    const controller = api.createDedupeController(m, { policy: 'replace-existing' });
    const first = await controller.show({ key: 'notice', message: 'Old', persistent: true });
    const shows = events(m, api.TOAST_EVENTS.show);
    const pending = controller.show({ key: 'notice', message: 'New', persistent: true });
    await waitMicrotasks();
    equal(m.getToast(first.id), undefined);
    equal(m.root.querySelectorAll('[data-a11y-toast-id]').length, 1);
    equal(shows.length, 0);
    resolveExit();
    const replacement = await pending;
    equal(replacement.status, 'replaced');
    ok(replacement.id !== first.id);
    equal(replacement.previousId, first.id);
    equal(m.getToast(replacement.id).message, 'New');
    equal(shows.length, 1);
  });

  await test('115 replacing a queued keyed toast gives the replacement a new queue position', async () => {
    const m = create({ maxVisible: 1, animation: 'none' });
    const controller = api.createDedupeController(m, { policy: 'replace-existing' });
    m.show({ message: 'Blocker', persistent: true });
    const old = await controller.show({ key: 'queued', message: 'Old', persistent: true });
    const other = m.show({ message: 'Other', persistent: true });
    const replacement = await controller.show({ key: 'queued', message: 'New', persistent: true });
    ok(replacement.id !== old.id);
    equal(m.getToasts().map(row => row.message), ['Blocker', 'Other', 'New']);
    equal(m.getToast(other).state, 'queued');
    equal(m.getToast(replacement.id).state, 'queued');
  });

  await test('116 dedupe requires a non-empty trimmed key and matching is exact case-sensitive', async () => {
    const m = create();
    const controller = api.createDedupeController(m);
    throws(() => controller.show({ message: 'No key' }));
    throws(() => controller.show({ key: '   ', message: 'Blank key' }));
    const first = await controller.show({ key: ' Save ', message: 'Upper', persistent: true });
    equal(m.getToast(first.id).key, 'Save');
    const second = await controller.show({ key: 'save', message: 'Lower', persistent: true });
    ok(second.id !== first.id);
    equal(m.getToasts().length, 2);
    throws(() => controller.show({ key: 'Save', message: 'Invalid policy' }, 'merge'));
  });

  await test('117 same-key operations serialize across a pending replacement', async () => {
    let resolveExit;
    const m = create({
      animation: { name: 'serialized-exit', exit() { return new Promise(resolve => { resolveExit = resolve; }); } },
    });
    const controller = api.createDedupeController(m, { policy: 'replace-existing' });
    const first = await controller.show({ key: 'serial', message: 'First', persistent: true });
    const replacing = controller.show({ key: 'serial', message: 'Second', persistent: true });
    const updating = controller.show({ key: 'serial', message: 'Third', persistent: true }, 'update-existing');
    await waitMicrotasks();
    equal(m.root.querySelectorAll('[data-a11y-toast-id]').length, 1);
    resolveExit();
    const replaced = await replacing;
    const updated = await updating;
    equal(updated.id, replaced.id);
    equal(updated.status, 'updated');
    equal(m.getToast(updated.id).message, 'Third');
    equal(m.getToasts().length, 1);
    ok(updated.id !== first.id);
  });

  await test('118 controller destroy stops future keyed operations without changing existing toast state', async () => {
    const m = create();
    const controller = api.createDedupeController(m);
    const first = await controller.show({ key: 'stop', message: 'Existing', persistent: true });
    controller.destroy();
    equal(controller.isDestroyed, true);
    const result = await controller.show({ key: 'stop', message: 'Ignored', persistent: true });
    equal(result.status, 'stopped');
    equal(result.id, null);
    equal(m.getToast(first.id).message, 'Existing');
  });

  await test('119 new keyed show reports queue rejection without mutating unrelated records', async () => {
    const m = create({ maxVisible: 1, maxQueue: 0 });
    m.show({ message: 'Blocker', persistent: true });
    const controller = api.createDedupeController(m);
    const result = await controller.show({ key: 'new', message: 'Rejected', persistent: true });
    equal(result.status, 'rejected');
    equal(result.id, null);
    equal(m.getToasts().map(row => row.message), ['Blocker']);
  });

  await test('120 update-existing uses normal timer semantics instead of resetting implicitly', async () => {
    const c = fakeClock();
    const m = create();
    const controller = api.createDedupeController(m);
    const first = await controller.show({ key: 'timer', message: 'A', duration: 1000 });
    c.tick(400);
    const updated = await controller.show({ key: 'timer', message: 'B' });
    equal(updated.id, first.id);
    equal(m.getToast(first.id).remaining, 600);
    c.tick(600);
    equal(m.getToast(first.id), undefined);
  });

  await test('121 replace-existing adopts a same-key toast created by an external dismissal observer', async () => {
    const m = create({ animation: 'none' });
    const controller = api.createDedupeController(m, { policy: 'replace-existing' });
    const first = await controller.show({ key: 'shared', message: 'Old', persistent: true });
    let externalId = null;
    m.root.addEventListener(api.TOAST_EVENTS.dismiss, event => {
      if (event.detail.toast.id === first.id) externalId = m.show({ key: 'shared', message: 'External', persistent: true });
    }, { once: true });
    const result = await controller.show({ key: 'shared', message: 'Replacement', persistent: true });
    equal(result.status, 'updated');
    equal(result.id, externalId);
    equal(m.getToasts().length, 1);
    equal(m.getToast(externalId).message, 'Replacement');
  });

  await test('122 source-owned adapter forces priority off for show and update while retaining one correlation ID', () => {
    const source = new EventTarget();
    const m = create();
    const adapter = api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'source',
      bindings: [{
        event: 'job',
        map(event) {
          const detail = event.detail;
          return detail.phase === 'start'
            ? { type: 'show', correlationKey: detail.id, input: { message: detail.message, priority: 'assertive', persistent: true } }
            : { type: 'update', correlationKey: detail.id, patch: { message: detail.message, priority: 'assertive' } };
        },
      }],
    });
    source.dispatchEvent(new CustomEvent('job', { detail: { id: '42', phase: 'start', message: 'Working' } }));
    const id = adapter.getToastId('42');
    ok(id);
    equal(m.getToast(id).priority, 'off');
    source.dispatchEvent(new CustomEvent('job', { detail: { id: '42', phase: 'update', message: 'Still working' } }));
    equal(adapter.getToastId('42'), id);
    equal(m.getToast(id).message, 'Still working');
    equal(m.getToast(id).priority, 'off');
  });

  await test('123 toast-owned adapter preserves mapped announcement priority', () => {
    const c = fakeClock();
    const source = new EventTarget();
    const m = create();
    const announced = events(m, api.TOAST_EVENTS.announce);
    api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'toast',
      bindings: [{
        event: 'notice',
        map: () => ({ type: 'show', correlationKey: 'n', input: { message: 'Important', priority: 'assertive', persistent: true } }),
      }],
    });
    source.dispatchEvent(new Event('notice'));
    c.tick(100);
    equal(m.getToasts()[0].priority, 'assertive');
    equal(announced.length, 1);
    equal(announced[0].priority, 'assertive');
  });

  await test('124 correlated update and dismiss commands use retained IDs and external dismiss clears tracking', () => {
    const source = new EventTarget();
    const m = create();
    const adapter = api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'toast',
      bindings: [{
        event: 'flow',
        map(event) {
          const detail = event.detail;
          if (detail.action === 'show') return { type: 'show', correlationKey: detail.id, input: { message: detail.message, persistent: true } };
          if (detail.action === 'update') return { type: 'update', correlationKey: detail.id, patch: { message: detail.message } };
          return { type: 'dismiss', correlationKey: detail.id };
        },
      }],
    });
    source.dispatchEvent(new CustomEvent('flow', { detail: { id: 'a', action: 'show', message: 'A' } }));
    const id = adapter.getToastId('a');
    source.dispatchEvent(new CustomEvent('flow', { detail: { id: 'a', action: 'update', message: 'B' } }));
    equal(m.getToast(id).message, 'B');
    source.dispatchEvent(new CustomEvent('flow', { detail: { id: 'a', action: 'dismiss' } }));
    equal(m.getToast(id), undefined);
    equal(adapter.getToastId('a'), undefined);

    source.dispatchEvent(new CustomEvent('flow', { detail: { id: 'x', action: 'show', message: 'X' } }));
    const external = adapter.getToastId('x');
    m.dismiss(external);
    equal(adapter.getToastId('x'), undefined);
  });

  await test('125 repeated show for one correlation updates the retained toast instead of duplicating it', () => {
    const source = new EventTarget();
    const m = create();
    const shows = events(m, api.TOAST_EVENTS.show);
    const updates = events(m, api.TOAST_EVENTS.update);
    const adapter = api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'toast',
      bindings: [{
        event: 'status',
        map: event => ({ type: 'show', correlationKey: 'same', input: { message: event.detail, persistent: true } }),
      }],
    });
    source.dispatchEvent(new CustomEvent('status', { detail: 'First' }));
    const id = adapter.getToastId('same');
    source.dispatchEvent(new CustomEvent('status', { detail: 'Second' }));
    equal(adapter.getToastId('same'), id);
    equal(m.getToasts().length, 1);
    equal(m.getToast(id).message, 'Second');
    equal(shows.length, 1);
    equal(updates.length, 1);
  });

  await test('126 unknown correlation update and dismiss commands are safe no-ops', () => {
    const source = new EventTarget();
    const m = create();
    const adapter = api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'toast',
      bindings: [
        { event: 'u', map: () => ({ type: 'update', correlationKey: 'missing', patch: { message: 'Nope' } }) },
        { event: 'd', map: () => ({ type: 'dismiss', correlationKey: 'missing' }) },
      ],
    });
    source.dispatchEvent(new Event('u'));
    source.dispatchEvent(new Event('d'));
    equal(m.getToasts().length, 0);
    equal(adapter.getToastId('missing'), undefined);
  });

  await test('127 mapper and command validation errors are isolated through onError', () => {
    const source = new EventTarget();
    const m = create();
    const errors = [];
    api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'toast',
      onError(error, context) { errors.push([String(error), context.eventType]); },
      bindings: [
        { event: 'throw', map() { throw new Error('Mapper failed'); } },
        { event: 'bad', map: () => ({ type: 'unsupported' }) },
        { event: 'key', map: () => ({ type: 'update', correlationKey: '  ', patch: { message: 'Bad' } }) },
      ],
    });
    source.dispatchEvent(new Event('throw'));
    source.dispatchEvent(new Event('bad'));
    source.dispatchEvent(new Event('key'));
    equal(errors.length, 3);
    equal(errors.map(row => row[1]), ['throw', 'bad', 'key']);
    equal(m.getToasts().length, 0);
  });

  await test('128 adapter destroy removes source listeners and optionally dismisses tracked toasts', () => {
    const source = new EventTarget();
    const m = create();
    const adapter = api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'toast',
      dismissTrackedOnDestroy: true,
      bindings: [{
        event: 'show',
        map: () => ({ type: 'show', correlationKey: 'a', input: { message: 'A', persistent: true } }),
      }],
    });
    source.dispatchEvent(new Event('show'));
    const id = adapter.getToastId('a');
    ok(m.getToast(id));
    adapter.destroy();
    equal(adapter.isDestroyed, true);
    equal(m.getToast(id), undefined);
    source.dispatchEvent(new Event('show'));
    equal(m.getToasts().length, 0);
    adapter.destroy();
  });

  await test('129 destroying the toast manager automatically disposes the adapter source listeners', () => {
    const source = new EventTarget();
    const m = create();
    let calls = 0;
    const adapter = api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'toast',
      bindings: [{
        event: 'show',
        map: () => { calls++; return { type: 'show', correlationKey: 'a', input: { message: 'A' } }; },
      }],
    });
    m.destroy();
    equal(adapter.isDestroyed, true);
    source.dispatchEvent(new Event('show'));
    equal(calls, 0);
  });

  await test('130 source-owned duplicate show remains silent and update-only', () => {
    const c = fakeClock();
    const source = new EventTarget();
    const m = create();
    const announcements = events(m, api.TOAST_EVENTS.announce);
    api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'source',
      bindings: [{
        event: 'status',
        map: event => ({ type: 'show', correlationKey: 'x', input: { message: event.detail, priority: 'assertive', persistent: true } }),
      }],
    });
    source.dispatchEvent(new CustomEvent('status', { detail: 'One' }));
    source.dispatchEvent(new CustomEvent('status', { detail: 'Two' }));
    c.tick(3000);
    equal(m.getToasts().length, 1);
    equal(m.getToasts()[0].message, 'Two');
    equal(m.getToasts()[0].priority, 'off');
    equal(announcements.length, 0);
  });

  await test('131 queued correlated toast can be updated before promotion', () => {
    const source = new EventTarget();
    const m = create({ maxVisible: 1 });
    m.show({ message: 'Blocker', persistent: true });
    const adapter = api.createDomEventAdapter(m, {
      target: source,
      announcementOwner: 'toast',
      bindings: [{
        event: 'job',
        map(event) {
          return event.detail.update
            ? { type: 'update', correlationKey: event.detail.id, patch: { message: event.detail.message } }
            : { type: 'show', correlationKey: event.detail.id, input: { message: event.detail.message, persistent: true } };
        },
      }],
    });
    source.dispatchEvent(new CustomEvent('job', { detail: { id: '7', message: 'Queued' } }));
    const id = adapter.getToastId('7');
    equal(m.getToast(id).state, 'queued');
    source.dispatchEvent(new CustomEvent('job', { detail: { id: '7', message: 'Latest queued', update: true } }));
    equal(m.getToast(id).message, 'Latest queued');
    equal(m.getToast(id).state, 'queued');
  });

  await test('132 invalid adapter configuration fails before source listeners are attached', () => {
    const source = new EventTarget();
    const m = create();
    let calls = 0;
    throws(() => api.createDomEventAdapter(m, { target: source, bindings: [{ event: 'x', map() { calls++; return null; } }] }));
    throws(() => api.createDomEventAdapter(m, { target: source, announcementOwner: 'toast', bindings: [] }));
    throws(() => api.createDomEventAdapter(m, { target: source, announcementOwner: 'toast', bindings: [{ event: ' ', map() { return null; } }] }));
    source.dispatchEvent(new Event('x'));
    equal(calls, 0);
  });

  await test('133 custom announcement transport commits without writing the live-region DOM', () => {
    const c = fakeClock();
    const calls = [];
    const m = create({
      announcementTransport: {
        name: 'test-transport',
        announce(context) {
          calls.push([context.message, context.priority, context.liveRegion.textContent]);
          return { transport: 'test-transport', fallback: false };
        },
      },
    });
    const announced = events(m, api.TOAST_EVENTS.announce);
    m.show({ message: 'Custom transport', priority: 'polite', persistent: true });
    c.tick(100);
    equal(calls, [['Custom transport', 'polite', '']]);
    equal(m.root.querySelector('[role="status"]').textContent, '');
    equal(announced.map(row => [row.transport, row.fallback]), [['test-transport', false]]);
  });

  await test('134 announcement transport receives assertive priority unchanged', () => {
    const c = fakeClock();
    const priorities = [];
    const m = create({
      announcementTransport: {
        name: 'priority-probe',
        announce(context) {
          priorities.push(context.priority);
          return { transport: 'priority-probe', fallback: false };
        },
      },
    });
    m.show({ message: 'Urgent', priority: 'assertive', persistent: true });
    c.tick(100);
    equal(priorities, ['assertive']);
  });

  await test('135 transport failures emit announcement-error without breaking toast lifecycle', () => {
    const c = fakeClock();
    const m = create({
      announcementTransport: {
        name: 'failing-transport',
        announce() { throw new Error('Transport failed'); },
      },
    });
    const announced = events(m, api.TOAST_EVENTS.announce);
    const errors = events(m, api.TOAST_EVENTS.announcementError);
    const id = m.show({ message: 'Still visible', persistent: true });
    c.tick(100);
    ok(m.getToast(id));
    equal(announced.length, 0);
    equal(errors.length, 1);
    equal(errors[0].transport, 'failing-transport');
  });

  await test('136 custom transport keeps existing coalescing semantics', () => {
    const c = fakeClock();
    const messages = [];
    const m = create({
      announcementTransport: {
        name: 'coalesce-probe',
        announce(context) {
          messages.push(context.message);
          return { transport: 'coalesce-probe', fallback: false };
        },
      },
    });
    const id = m.show({ message: 'First', persistent: true });
    m.update(id, { message: 'Second' });
    m.update(id, { message: 'Third' });
    c.tick(100);
    equal(messages, ['Third']);
  });

  await test('137 priority off bypasses an injected announcement transport', () => {
    const c = fakeClock(); let calls = 0;
    const m = create({
      announcementTransport: {
        name: 'off-probe',
        announce() { calls++; return { transport: 'off-probe', fallback: false }; },
      },
    });
    m.show({ message: 'Silent', priority: 'off', persistent: true });
    c.tick(5000);
    equal(calls, 0);
  });

  return results;
}
