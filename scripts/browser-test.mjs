import { chromium } from 'playwright';
import { createServer } from './serve.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/examples/basic/`);
  await page.waitForFunction(() => !document.querySelector('#toast-form [type="submit"]')?.disabled);
  const demoReady = await page.evaluate(async () => ({
    loadingNoticeHidden: document.querySelector('[data-boot]')?.hidden === true,
    historyInspectorPresent: document.querySelector('.toast-history-demo') instanceof HTMLElement,
    unrelatedDependencyStatus: (await fetch('/node_modules/typescript/package.json')).status,
  }));
  if (!demoReady.loadingNoticeHidden || !demoReady.historyInspectorPresent || demoReady.unrelatedDependencyStatus !== 403) {
    throw new Error(`Playground failed to initialize: ${JSON.stringify(demoReady)}`);
  }
  // Leave the demo empty and exercise independent fixture hosts using the same built entry.
  const results = await page.evaluate(async () => {
    const api = await import('/dist/index.js');
    const { createHistoryController } = await import('/dist/addons/history.js');
    const { createDiagnosticsAddon } = await import('/dist/addons/diagnostics.js');
    const { createProgressAddon } = await import('/dist/addons/progress.js');
    const { createSwipeDismissAddon } = await import('/dist/addons/swipe-dismiss.js');
    const { trackToastPromise } = await import('/dist/addons/promise.js');
    const { createDedupeController } = await import('/dist/addons/dedupe.js');
    const { createDomEventAdapter } = await import('/dist/adapters/dom-events.js');
    const { createAriaNotifyTransport } = await import('/dist/transports/aria-notify.js');
    const { createGsapAnimationDriver } = await import('/dist/animations/gsap.js');
    const { createGsapFlipLayoutAddon } = await import('/dist/animations/gsap-flip.js');
    const { createElementViewTransitionDriver } = await import('/dist/animations/view-transition.js');
    const { runSuite } = await import('/test/browser/suite.js');
    return runSuite({ ...api, createHistoryController, createDiagnosticsAddon, createProgressAddon, createSwipeDismissAddon, trackToastPromise, createDedupeController, createDomEventAdapter, createAriaNotifyTransport, createGsapAnimationDriver, createGsapFlipLayoutAddon, createElementViewTransitionDriver });
  });
  async function demoTest(name, run) {
    try { await run(); results.push({ name, status: 'pass' }); }
    catch (error) { results.push({ name, status: 'fail', error: String(error) }); }
  }
  await demoTest('D01 async form keeps submit focus while saving', async () => {
    await page.locator('summary').filter({ hasText: 'Try an async form recipe' }).click();
    const button = page.locator('[data-async-submit]');
    await button.focus();
    await page.evaluate(() => {
      const status = document.querySelector('[data-async-status]');
      window.__demoStatusChanges = [];
      window.__demoStatusObserver = new MutationObserver(() => window.__demoStatusChanges.push(status.textContent));
      window.__demoStatusObserver.observe(status, { childList: true });
    });
    await button.press('Enter');
    const during = await page.evaluate(() => {
      const button = document.querySelector('[data-async-submit]');
      return { focused: document.activeElement === button, disabled: button.getAttribute('aria-disabled'), nativeDisabled: button.disabled };
    });
    if (!during.focused || during.disabled !== 'true' || during.nativeDisabled) throw new Error(`Saving focus/state: ${JSON.stringify(during)}`);
    await button.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-async-status]').textContent === 'Demo profile saved.');
    const after = await page.evaluate(() => {
      const button = document.querySelector('[data-async-submit]');
      window.__demoStatusObserver.disconnect();
      const changes = window.__demoStatusChanges;
      delete window.__demoStatusObserver;
      delete window.__demoStatusChanges;
      return { focused: document.activeElement === button, enabled: !button.hasAttribute('aria-disabled'), changes };
    });
    if (!after.focused || !after.enabled || JSON.stringify(after.changes) !== JSON.stringify(['Saving demo profile…', 'Demo profile saved.'])) {
      throw new Error(`Submit focus, enabled state, or single save cycle failed: ${JSON.stringify(after)}`);
    }
  });
  await demoTest('D02 demo errors expose an alert', async () => {
    await page.locator('summary').filter({ hasText: 'Try keyed deduplication' }).click();
    await page.locator('#dedupe-key').fill('');
    await page.locator('[data-dedupe]').click();
    await page.waitForFunction(() => !document.querySelector('[data-feedback]').hidden);
    const feedback = await page.locator('[data-feedback]').evaluate(element => ({ role: element.getAttribute('role'), text: element.textContent.trim() }));
    if (feedback.role !== 'alert' || !feedback.text) throw new Error(`Missing error alert: ${JSON.stringify(feedback)}`);
  });
  await demoTest('D03 masthead focus indicator has 3:1 contrast', async () => {
    await page.keyboard.press('Shift');
    const focus = await page.evaluate(() => {
      const link = document.querySelector('.toast-demo__brand');
      link.focus();
      const style = getComputedStyle(link);
      const parse = value => value.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      const luminance = value => {
        const [red, green, blue] = parse(value);
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      };
      const outline = luminance(style.outlineColor);
      const background = luminance(getComputedStyle(link.closest('.toast-demo__masthead')).backgroundColor);
      return {
        visible: link.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 3,
        ratio: (Math.max(outline, background) + 0.05) / (Math.min(outline, background) + 0.05),
      };
    });
    if (!focus.visible || focus.ratio < 3) throw new Error(`Masthead focus indicator: ${JSON.stringify(focus)}.`);
  });
  await demoTest('D04 five-toast demo shows the full stack without a scrollbar at normal size', async () => {
    await page.locator('[data-clear]').click();
    await page.waitForFunction(() => document.querySelector('[data-a11y-toast] .a11y-toast-region__list').children.length === 0);
    await page.locator('[data-burst]').click();
    const stack = await page.evaluate(() => {
      const list = document.querySelector('[data-a11y-toast] .a11y-toast-region__list');
      return {
        visible: document.querySelector('[data-visible]').textContent,
        queued: document.querySelector('[data-queued]').textContent,
        count: list.children.length,
        horizontalOverflow: list.scrollWidth - list.clientWidth,
        verticalOverflow: list.scrollHeight - list.clientHeight,
      };
    });
    if (stack.visible !== '5' || stack.queued !== '0' || stack.count !== 5 || stack.horizontalOverflow > 1 || stack.verticalOverflow > 1) {
      throw new Error(`Five-toast stack: ${JSON.stringify(stack)}`);
    }
  });
  await demoTest('D05 in-page swipe stack dismisses a notification', async () => {
    await page.locator('[data-swipe-stack]').click();
    const result = await page.evaluate(() => {
      const root = document.querySelector('[data-swipe-root]');
      const items = root.querySelectorAll('[data-a11y-toast-id]');
      const message = items[0]?.querySelector('.a11y-toast__message');
      if (!message) return { before: items.length, after: -1 };
      message.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, isPrimary: true, pointerId: 91, pointerType: 'touch', clientX: 10, clientY: 10 }));
      window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, isPrimary: true, pointerId: 91, pointerType: 'touch', clientX: 120, clientY: 10, cancelable: true }));
      window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, isPrimary: true, pointerId: 91, pointerType: 'touch', clientX: 120, clientY: 10 }));
      return { before: items.length, after: root.querySelectorAll('[data-a11y-toast-id]').length };
    });
    if (result.before !== 5 || result.after !== 4) throw new Error(`In-page swipe stack: ${JSON.stringify(result)}`);
  });
  await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
  await writeFile(new URL('../test-results/browser.json', import.meta.url), JSON.stringify({ browser: browser.version(), results, errors }, null, 2));
  for (const row of results) console.log(`${row.status.toUpperCase()} ${row.name}${row.error ? `\n  ${row.error}` : ''}`);
  if (results.some(row => row.status !== 'pass') || errors.length) process.exitCode = 1;
  console.log(`${results.filter(row => row.status === 'pass').length}/${results.length} passed; ${errors.length} uncaught page errors.`);
} finally {
  await browser?.close();
  server.close();
}
