import { chromium } from 'playwright';
import { createServer } from './serve.mjs';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

export const SKIN_IDS = ['minimal', 'compact', 'rounded', 'classic-light', 'classic-dark', 'snackbar', 'soft', 'outline', 'solid', 'accent-rail', 'top-rule', 'split-panel', 'header-band', 'action-footer', 'monochrome'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

export async function runDesignChecks(page, baseURL, test) {
  for (const route of ['/examples/designs/', '/docs/designs/']) {
    await test(`Designs ${route} exposes fifteen quiet, usable design samples`, async () => {
      const response = await page.goto(`${baseURL}${route}`);
      assert(response.status() === 200, `Design gallery returned ${response.status()}`);
      await page.waitForFunction(() => document.querySelector('[data-boot]')?.hidden === true);
      assert(await page.locator('[data-design-card]').count() === 15, 'Expected fifteen cards');
      assert(await page.locator('[data-design-preview] .a11y-toast').count() === 15, 'Expected fifteen static toast previews');
      assert(await page.locator('[data-a11y-toast-id]').count() === 0, 'Gallery created a live toast on load');
      assert(await page.locator('[data-design-preview] button, [data-design-preview] [tabindex], [data-design-preview] [role="status"], [data-design-preview] [role="alert"], [data-design-preview] [aria-live]').count() === 0, 'Static sample has interaction or a live region');
      assert(await page.locator('#design-skin').inputValue() === 'classic-light', 'Initial design changed');
      assert(await page.locator('#design-tone').inputValue() === 'success', 'Initial tone changed');
      assert(await page.locator('#design-action').isChecked(), 'Action should initially be included');
    });

    const live = page.locator('[data-live-preview]');
    const state = () => page.evaluate(async () => {
      const manager = (await import(new URL('./demo.js', location.href).href)).getDemoManager();
      return manager ? { destroyed: manager.isDestroyed, toasts: manager.getToasts() } : null;
    });
    const show = page.locator('[data-show-design]');

    await test(`Designs ${route} selects without showing and replaces only on explicit activation`, async () => {
      await page.locator('#design-skin').selectOption('solid');
      await page.locator('#design-tone').selectOption('warning');
      assert(await live.locator('[data-a11y-toast-id]').count() === 0, 'Selection displayed a notification');
      await show.focus(); await show.press('Enter');
      const first = (await state()).toasts[0];
      assert(first.tone === 'warning' && first.priority === 'polite' && first.persistent, 'Preview is not persistent/polite');
      assert(await show.evaluate(element => element === document.activeElement), 'Showing stole trigger focus');
      await page.locator('#design-skin').selectOption('classic-dark');
      assert((await state()).toasts[0].id === first.id && await live.evaluate(element => element.classList.contains('a11y-toast-region--skin-solid')), 'Selection restyled or replaced the current preview');
      await show.click();
      assert((await state()).toasts.length === 1 && (await state()).toasts[0].id !== first.id, 'Explicit Show did not replace the previous preview');
      assert(await live.locator('.a11y-toast-region__viewport').count() === 1, 'A stale viewport survived replacement');
      assert(await live.locator('[role="status"]').count() === 1, 'A stale announcer survived replacement');
    });

    await test(`Designs ${route} action updates its ID and closing recovers the active trigger`, async () => {
      const before = (await state()).toasts[0];
      const action = live.getByRole('button', { name: 'Try action', exact: true });
      await action.focus(); await action.press('Enter');
      const after = (await state()).toasts[0];
      assert(after.id === before.id && after.tone === 'success' && !after.action && after.message === 'Action completed.', 'Action did not update the same record');
      const close = live.getByRole('button', { name: 'Close notification', exact: true });
      assert(await close.evaluate(element => document.activeElement === element), 'Removing action lost focus');
      await close.press('Enter');
      assert(await show.evaluate(element => document.activeElement === element), 'Close did not recover Show focus');
      await page.waitForFunction(() => !document.querySelector('[data-live-preview] [data-a11y-toast-id]'));
      assert(await page.locator('[data-design-result]').textContent() !== 'No live preview yet.', 'Dismissal lost retained result');
    });

    await test(`Designs ${route} card Try uses each skin and honors tone/action settings`, async () => {
      await page.locator('#design-action').uncheck();
      await page.locator('#design-tone').selectOption('loading');
      for (const id of SKIN_IDS) {
        const trigger = page.locator(`[data-try-skin="${id}"]`);
        await trigger.click();
        assert(await page.locator('#design-skin').inputValue() === id, `Try did not select ${id}`);
        const current = (await state()).toasts;
        assert(current.length === 1 && current[0].tone === 'loading' && !current[0].action && current[0].persistent, `${id} ignored preview settings`);
        assert(await trigger.evaluate(element => element === document.activeElement), `${id} moved trigger focus`);
        assert(await live.evaluate((element, skin) => element.classList.contains(`a11y-toast-region--skin-${skin}`), id), `${id} was not applied to the actual toast host`);
      }
      await page.locator('[data-dismiss-design]').click();
      await page.waitForFunction(() => !document.querySelector('[data-live-preview] [data-a11y-toast-id]'));
      await page.locator('#design-action').check();
      await page.locator('#design-tone').selectOption('success');
    });

    await test(`Designs ${route} selected instructions and downloadable CSS match`, async () => {
      for (const id of SKIN_IDS) {
        await page.locator(`[data-use-skin="${id}"]`).click();
        assert(await page.locator('[data-usage-details]').evaluate(element => element.open), 'Use did not open instructions');
        assert(await page.locator('[data-usage-title]').evaluate(element => element === document.activeElement), 'Use did not move focus to the setup heading');
        const css = await page.locator('[data-css-code]').textContent();
        const html = await page.locator('[data-html-code]').textContent();
        assert(css.includes(`a11y-toast/skins/${id}.css`) && html.includes(`a11y-toast-region--skin-${id}`), `Setup does not match ${id}`);
        const target = await page.locator('[data-skin-download]').getAttribute('href');
        const response = await page.request.get(new URL(target, page.url()).href);
        assert(response.status() === 200 && (await response.text()).includes(`.a11y-toast-region--skin-${id}`), `Broken CSS download for ${id}`);
      }
    });

    await test(`Designs ${route} unavailable clipboard leaves the selected code ready to copy`, async () => {
      assert(await page.locator('[data-copy-status]').evaluate(element => getComputedStyle(element).display !== 'none'), 'Copy status was hidden before its first update');
      await page.evaluate(() => {
        window.__originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new DOMException('Denied', 'NotAllowedError'); } } });
      });
      try {
        await page.locator('[data-copy="html"]').click();
        await page.waitForFunction(() => document.querySelector('[data-copy-status]').textContent.includes('selected'));
        assert(await page.evaluate(() => getSelection().toString()) === await page.locator('[data-html-code]').textContent(), 'Fallback did not select the chosen code');
        assert(await page.locator('[data-html-code]').evaluate(element => element === document.activeElement), 'Fallback did not focus the copyable code');
      } finally {
        await page.evaluate(() => {
          if (window.__originalClipboard) Object.defineProperty(navigator, 'clipboard', window.__originalClipboard);
          else delete navigator.clipboard;
          delete window.__originalClipboard;
        });
      }
    });

    await test(`Designs ${route} copied examples run with base CSS and their individual skin only`, async () => {
      for (const id of SKIN_IDS) {
        await page.locator(`[data-use-skin="${id}"]`).click();
        const html = await page.locator('[data-html-code]').textContent();
        const js = await page.locator('[data-js-code]').textContent();
        const snippetContext = await page.context().browser().newContext();
        const isolated = await snippetContext.newPage();
        const errors = [];
        isolated.on('pageerror', error => errors.push(error.message));
        try {
          await isolated.goto(`${baseURL}/dist/styles.css`);
          await isolated.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>${html}</body></html>`);
          await isolated.addStyleTag({ url: `${baseURL}/dist/styles.css` });
          await isolated.addStyleTag({ url: `${baseURL}/dist/skins/${id}.css` });
          const executable = js.replace("from 'a11y-toast'", `from '${baseURL}/dist/index.js'`);
          const moduleURL = `${baseURL}/__skin-usage-example.js`;
          await isolated.route(moduleURL, route => route.fulfill({ contentType: 'text/javascript', body: executable }));
          await isolated.evaluate(url => import(url), moduleURL);
          const trigger = isolated.locator('[data-show-toast]');
          await trigger.click();
          const toast = isolated.locator('[data-a11y-toast-id]');
          assert(await toast.count() === 1 && await toast.locator('.a11y-toast__message').textContent() === 'Your changes are ready.', `${id}: copied setup did not create the expected toast`);
          assert(await trigger.evaluate(element => document.activeElement === element), `${id}: copied setup stole focus`);
          const action = toast.getByRole('button', { name: 'Try action', exact: true });
          await action.focus(); await action.press('Enter');
          assert(await toast.locator('.a11y-toast__message').textContent() === 'Action completed.', `${id}: copied action failed`);
          const close = toast.getByRole('button', { name: 'Close notification', exact: true });
          assert(await close.evaluate(element => document.activeElement === element), `${id}: copied action lost focus`);
          await close.press('Enter');
          assert(await trigger.evaluate(element => document.activeElement === element), `${id}: copied Close lost origin`);
          assert(!errors.length, `${id}: copied setup errors ${errors.join(', ')}`);
        } finally { await snippetContext.close(); }
      }
    });

    await test(`Designs ${route} local assets and all three navigation routes resolve`, async () => {
      const urls = await page.locator('link[rel="stylesheet"], script[src], .toast-demo__brand img').evaluateAll(elements => elements.map(element => element.href || element.src));
      for (const url of urls) assert((await page.request.get(url)).status() === 200, `Missing asset ${url}`);
      const links = page.locator('.toast-demo__nav-links');
      for (const label of ['Demo', 'Designs', 'Advanced']) {
        const link = links.getByRole('link', { name: label, exact: true });
        const target = new URL(await link.getAttribute('href'), page.url()).href;
        const response = await page.request.get(target);
        assert(response.status() === 200, `Broken ${label} navigation`);
        assert(!(await response.text()).includes('Cannot GET'), `Wrong ${label} route`);
      }
    });

    for (const width of [1280, 375, 320]) {
      await test(`Designs ${route} ${width}px layout keeps previews and open instructions in view`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => { document.querySelector('[data-usage-details]').open = true; });
        const metrics = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          columns: getComputedStyle(document.querySelector('.toast-designs__grid')).gridTemplateColumns.split(' ').length,
          samples: Array.from(document.querySelectorAll('[data-design-preview] .a11y-toast')).map(element => ({ overflow: element.scrollWidth - element.clientWidth, width: element.getBoundingClientRect().width })),
        }));
        assert(metrics.overflow <= 1 && metrics.samples.every(sample => sample.overflow <= 1 && sample.width > 0), `Horizontal overflow: ${JSON.stringify(metrics)}`);
        assert(metrics.columns === (width >= 1024 ? 2 : 1), 'Gallery columns do not reflow');
        await page.evaluate(() => { document.querySelector('[data-usage-details]').open = false; window.scrollTo(0, 0); });
        await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
        await page.screenshot({ path: new URL(`../test-results/designs-${route.includes('/docs/') ? 'pages' : 'authored'}-${width}.png`, import.meta.url).pathname, fullPage: true });
      });
    }

    await test(`Designs ${route} enlarged RTL text and reduced motion remain usable`, async () => {
      await page.evaluate(() => { document.documentElement.dir = 'rtl'; document.documentElement.style.fontSize = '200%'; document.querySelector('[data-usage-details]').open = true; });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Enlarged RTL layout overflowed');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await show.click();
      assert(await live.locator('.is-entering').count() === 0, 'Reduced motion retained entrance animation');
      const close = live.locator('[data-a11y-toast-dismiss]');
      await close.focus(); await close.press('Enter');
      assert(await show.evaluate(element => document.activeElement === element), 'RTL/reduced motion close lost focus');
      await page.evaluate(() => { document.documentElement.dir = 'ltr'; document.documentElement.style.fontSize = ''; document.querySelector('[data-usage-details]').open = false; });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    });

    await test(`Designs ${route} visible focus uses the skin contrast and forced colors survive`, async () => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.locator('#design-skin').selectOption('solid');
      await page.locator('#design-tone').selectOption('warning');
      await show.click();
      const close = live.locator('[data-a11y-toast-dismiss]');
      await close.focus();
      const focus = await close.evaluate(element => {
        const style = getComputedStyle(element);
        const parse = value => value.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
        const luminance = value => { const [r, g, b] = parse(value); return r * 0.2126 + g * 0.7152 + b * 0.0722; };
        const outline = luminance(style.outlineColor), background = luminance(getComputedStyle(element.closest('.a11y-toast')).backgroundColor);
        return { visible: element.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2, ratio: (Math.max(outline, background) + 0.05) / (Math.min(outline, background) + 0.05) };
      });
      assert(focus.visible && focus.ratio >= 3, `Skin focus contrast failed: ${JSON.stringify(focus)}`);
      await page.emulateMedia({ forcedColors: 'active' });
      const colors = await close.evaluate(element => ({ foreground: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor, outline: getComputedStyle(element).outlineStyle }));
      assert(colors.foreground !== colors.background && colors.outline !== 'none', `Forced-color control disappeared: ${JSON.stringify(colors)}`);
      await page.screenshot({ path: new URL(`../test-results/designs-forced-${route.includes('/docs/') ? 'pages' : 'authored'}.png`, import.meta.url).pathname });
      await page.emulateMedia({ forcedColors: 'none' });
    });

    await test(`Designs ${route} persisted pagehide keeps ownership and departure tears down`, async () => {
      await page.locator('[data-use-skin="solid"]').click();
      await page.evaluate(() => {
        window.__originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise(resolve => { window.__copyRelease = resolve; }) } });
      });
      try {
        await page.locator('[data-copy="html"]').click();
        await page.waitForFunction(() => typeof window.__copyRelease === 'function');
        const feedback = await page.locator('[data-copy-status]').textContent();
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
        assert((await state()).toasts.length === 1, 'Persisted pagehide disposed the manager');
        await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
        assert(await state() === null && await live.locator('[data-a11y-toast-id]').count() === 0, 'Departure retained a manager or toast');
        await page.evaluate(async () => { window.__copyRelease(); await Promise.resolve(); });
        assert(await page.locator('[data-copy-status]').textContent() === feedback, 'A stale clipboard completion updated departed feedback');
        await page.locator('[data-try-skin="minimal"]').click();
        assert(await state() === null && await live.locator('[data-a11y-toast-id]').count() === 0, 'Departed page retained handlers');
      } finally {
        await page.evaluate(() => {
          if (window.__originalClipboard) Object.defineProperty(navigator, 'clipboard', window.__originalClipboard);
          else delete navigator.clipboard;
          delete window.__copyRelease; delete window.__originalClipboard;
        });
      }
    });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {});
    const page = await browser.newPage();
    const results = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await runDesignChecks(page, `http://127.0.0.1:${server.address().port}`, async (name, run) => {
      try { await run(); results.push({ name, status: 'pass' }); }
      catch (error) { results.push({ name, status: 'fail', error: String(error) }); }
    });
    await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
    await writeFile(new URL('../test-results/designs.json', import.meta.url), JSON.stringify({ browser: browser.version(), results, errors }, null, 2));
    for (const result of results) console.log(`${result.status.toUpperCase()} ${result.name}${result.error ? `: ${result.error}` : ''}`);
    console.log(`${results.filter(result => result.status === 'pass').length}/${results.length} passed; ${errors.length} uncaught errors.`);
    if (errors.length || results.some(result => result.status !== 'pass')) process.exitCode = 1;
  } finally { await browser?.close(); server.close(); }
}
