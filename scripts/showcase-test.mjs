import { chromium } from 'playwright';
import { createServer } from './serve.mjs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const assert = (condition, message) => { if (!condition) throw new Error(message); };

export async function runShowcaseChecks(page, baseURL, test) {
  const evidence = new URL('../test-results/', import.meta.url);
  await mkdir(evidence, { recursive: true });
  for (const route of ['/examples/basic/', '/docs/']) {
    const prefix = `Showcase ${route}`;
    await test(`${prefix} loads without notifications or optional infrastructure`, async () => {
      const requests = [];
      const observe = request => requests.push(new URL(request.url()).pathname);
      page.on('request', observe);
      try {
        await page.goto(`${baseURL}${route}`);
        await page.locator('[data-example="success"]').waitFor({ state: 'visible', timeout: 4000 });
        await page.waitForFunction(() => document.querySelector('[data-a11y-toast]')?.classList.contains('is-initialized'));
        assert(await page.locator('[data-example]').count() === 4, 'Expected four example triggers.');
        assert(await page.locator('[data-a11y-toast-id]').count() === 0, 'A toast appeared on load.');
        assert(await page.locator('[data-a11y-toast] [role="status"]').textContent() === '', 'An announcement appeared on load.');
        assert(await page.locator('form, select, textarea').count() === 0, 'Configuration leaked into the showcase.');
        assert(!requests.some(url => /gsap|vendor|diagnostics|history|aria-notify|view-transition/.test(url)), 'The showcase loaded advanced infrastructure.');
      } finally { page.off('request', observe); }
    });

    const reset = async () => {
      await page.getByRole('button', { name: 'Reset examples', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('[data-a11y-toast-id]'));
    };
    const snapshot = () => page.evaluate(async () => {
      const manager = (await import(new URL('./demo.js', location.href).href)).getDemoManager();
      return manager.getToasts();
    });

    await test(`${prefix} success keeps trigger focus and retains its result after expiry`, async () => {
      const button = page.locator('[data-example="success"]');
      await button.focus(); await button.press('Enter');
      assert(await button.evaluate(element => document.activeElement === element), 'Showing moved focus.');
      const result = await page.locator('[data-result]').textContent();
      assert(result.includes('saved'), 'The result did not reflect the example.');
      assert(await page.locator('[data-result]').evaluate(element => !element.hasAttribute('role') && !element.hasAttribute('aria-live')), 'Result duplicates live speech.');
      await page.evaluate(async () => {
        const manager = (await import(new URL('./demo.js', location.href).href)).getDemoManager();
        manager.update(manager.getToasts()[0].id, { duration: 1000 });
      });
      await page.waitForFunction(() => !document.querySelector('[data-a11y-toast-id]'), null, { timeout: 3000 });
      assert(await page.locator('[data-result]').textContent() === result, 'Expiry erased the persistent result.');
    });

    await test(`${prefix} Undo updates one toast and Close only dismisses`, async () => {
      await page.locator('[data-example="undo"]').click();
      const [before] = await snapshot();
      assert(before.persistent && before.action.label === 'Undo', 'Undo is timed or unavailable.');
      const undo = page.getByRole('button', { name: 'Undo', exact: true });
      await undo.focus(); await undo.press('Enter');
      const [after] = await snapshot();
      assert(after.id === before.id && !after.persistent && !after.action && after.message.includes('restored'), 'Undo replaced its toast or failed to restore.');
      assert(await page.locator('[data-a11y-toast-dismiss]').evaluate(element => element === document.activeElement), 'Removing Undo lost focus.');
      await reset();
      await page.locator('[data-example="undo"]').click();
      const result = await page.locator('[data-result]').textContent();
      const close = page.locator('[data-a11y-toast-dismiss]');
      await close.focus(); await close.press('Enter');
      await page.waitForFunction(() => !document.querySelector('[data-a11y-toast-id]'));
      assert(await page.locator('[data-result]').textContent() === result && !result.includes('restored'), 'Close activated Undo.');
      assert(await page.locator('[data-example="undo"]').evaluate(element => document.activeElement === element), 'Close did not recover trigger focus.');
    });

    await test(`${prefix} loading retains its ID and early close suppresses settlement`, async () => {
      await reset();
      await page.locator('[data-example="loading"]').click();
      const [loading] = await snapshot();
      assert(loading.tone === 'loading' && loading.persistent, 'Loading is not persistent.');
      await page.waitForFunction(() => document.querySelector('.a11y-toast__message')?.textContent.includes('ready'));
      const [ready] = await snapshot();
      assert(ready.id === loading.id && ready.tone === 'success' && !ready.persistent, 'Loading did not update the same ID.');
      await reset();
      await page.locator('[data-example="loading"]').click();
      await page.locator('[data-a11y-toast-dismiss]').click();
      await page.waitForTimeout(1100); // Past the explicitly simulated 900ms operation.
      assert((await snapshot()).length === 0, 'Dismissed loading reappeared.');
      assert(!(await page.locator('[data-result]').textContent()).includes('ready'), 'Dismissed loading exposed a late result.');
    });

    await test(`${prefix} retry updates a persistent polite error`, async () => {
      await page.locator('[data-example="retry"]').click();
      const [error] = await snapshot();
      assert(error.tone === 'error' && error.priority === 'polite' && error.persistent, 'Retry error has unsafe defaults.');
      await page.getByRole('button', { name: 'Retry', exact: true }).click();
      const [success] = await snapshot();
      assert(success.id === error.id && success.tone === 'success' && !success.action && !success.persistent, 'Retry did not settle the same toast.');
      await reset();
    });

    await test(`${prefix} reset cancels pending work and queue refusal has feedback`, async () => {
      await page.locator('[data-example="loading"]').click();
      await reset();
      const result = await page.locator('[data-result]').textContent();
      await page.waitForTimeout(1100);
      assert((await snapshot()).length === 0 && await page.locator('[data-result]').textContent() === result, 'Reset left an operation running.');
      await page.evaluate(async () => {
        const manager = (await import(new URL('./demo.js', location.href).href)).getDemoManager();
        for (let index = 0; index < 13; index++) manager.show({ message: `Existing ${index}`, persistent: true, priority: 'off' });
      });
      await page.locator('[data-example="success"]').click();
      const feedback = page.locator('[data-feedback]');
      assert(await feedback.isVisible() && await feedback.getAttribute('role') === 'status' && (await feedback.textContent()).includes('queue'), 'No accessible queue-refusal feedback.');
      await reset();
    });

    await test(`${prefix} page lifecycle preserves cached state and disposes real departures`, async () => {
      await page.locator('[data-example="loading"]').click();
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
      await page.waitForFunction(() => document.querySelector('.a11y-toast__message')?.textContent.includes('ready'));
      assert(await page.evaluate(async () => !(await import(new URL('./demo.js', location.href).href)).getDemoManager().isDestroyed), 'Cached pagehide destroyed the manager.');
      await reset();
      await page.locator('[data-example="loading"]').click();
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
      assert(await page.evaluate(async () => (await import(new URL('./demo.js', location.href).href)).getDemoManager().isDestroyed), 'Real pagehide retained the manager.');
      const result = await page.locator('[data-result]').textContent();
      await page.waitForTimeout(1100);
      await page.locator('[data-example="success"]').click();
      assert(await page.locator('[data-a11y-toast-id]').count() === 0 && await page.locator('[data-result]').textContent() === result, 'Disposed page kept work or handlers.');
      await page.reload();
      await page.waitForFunction(() => document.querySelector('[data-boot]')?.hidden === true);
    });

    await test(`${prefix} narrow layouts and motion/contrast preferences remain usable`, async () => {
      for (const width of [1280, 768, 375, 320]) {
        await page.setViewportSize({ width, height: 800 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `Page overflows at ${width}px.`);
        await page.locator('[data-example="undo"]').click();
        assert(await page.locator('[data-a11y-toast-dismiss]').isVisible(), `Close unavailable at ${width}px.`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `Toast overflows at ${width}px.`);
        if (width === 1280 || width === 375) {
          await page.waitForFunction(() => !document.querySelector('.a11y-toast.is-entering'));
          await page.screenshot({ path: fileURLToPath(new URL(`showcase-${route === '/docs/' ? 'pages' : 'authored'}-${width}.png`, evidence)), fullPage: true });
        }
        await reset();
      }
      await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
      const trigger = page.locator('[data-example="success"]');
      await trigger.focus(); await trigger.press('Enter');
      assert((await snapshot())[0].animationPhase === null, 'Reduced motion still animates entrance.');
      assert(await trigger.evaluate(element => element.matches(':focus-visible') && getComputedStyle(element).outlineStyle !== 'none'), 'Focus indicator is absent.');
      await reset();
      await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' });
      await page.setViewportSize({ width: 1280, height: 800 });
      const labLink = page.getByRole('link', { name: 'Advanced', exact: true });
      await labLink.click();
      await page.waitForFunction(() => document.querySelector('[data-boot]')?.hidden === true && document.querySelector('.toast-history-demo'));
      assert(new URL(page.url()).pathname === (route === '/docs/' ? '/docs/advanced/' : '/examples/advanced/'), 'Advanced navigation reached the wrong route.');
      assert(await page.locator('.toast-history-demo').count() === 1, 'The lab did not initialize.');
    });

    await test(`${prefix} advanced assets, disclosures and text reflow work`, async () => {
      const missing = await page.evaluate(async () => {
        const urls = [...document.querySelectorAll('link[rel="stylesheet"],script[src],img[src]')].map(element => element.href || element.src);
        return (await Promise.all(urls.map(async url => ({ url, status: (await fetch(url)).status })))).filter(asset => asset.status !== 200);
      });
      assert(missing.length === 0, `Missing lab assets: ${JSON.stringify(missing)}`);
      await page.locator('details').evaluateAll(elements => elements.forEach(element => { element.open = true; }));
      for (const width of [1280, 375, 320]) {
        await page.setViewportSize({ width, height: 800 });
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `Open lab overflows at ${width}px.`);
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Open lab overflows with 200% root text at 320px.');
      await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.getByRole('link', { name: 'Demo', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('[data-example="success"]')?.disabled === false);
      assert(new URL(page.url()).pathname === route, 'The lab home link reached the wrong route.');
    });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {});
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await runShowcaseChecks(page, `http://127.0.0.1:${server.address().port}`, async (name, run) => { await run(); console.log(`PASS ${name}`); });
    assert(errors.length === 0, `Page errors: ${errors.join('; ')}`);
  } finally { await browser?.close(); server.close(); }
}
