import { chromium } from 'playwright';
import { createServer } from './serve.mjs';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

const SKIN_IDS = ['minimal', 'compact', 'rounded', 'classic-light', 'classic-dark', 'snackbar', 'soft', 'outline', 'solid', 'accent-rail', 'top-rule', 'split-panel', 'header-band', 'action-footer', 'monochrome'];
const TONES = ['neutral', 'info', 'success', 'warning', 'error', 'loading'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

// This page has no gallery or demo CSS. The only CSS prerequisites are the
// package base and the one optional skin being exercised.
async function openFixture(page, baseURL, skin) {
  await page.evaluate(() => window.skinFixture?.destroy());
  await page.goto(`${baseURL}/__skin-regressions__`);
  await page.evaluate(async skin => {
    const { createToast } = await import('/dist/index.js');
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `/dist/skins/${skin}.css`;
    await new Promise((resolve, reject) => {
      stylesheet.onload = resolve;
      stylesheet.onerror = () => reject(new Error(`Could not load ${stylesheet.href}`));
      document.head.append(stylesheet);
    });
    const managers = [];
    window.skinFixture = {
      mount({ width = 576, direction = 'ltr', fontSize = 16, cases }) {
        managers.splice(0).forEach(manager => manager.destroy());
        document.querySelector('main').replaceChildren();
        document.documentElement.dir = direction;
        document.documentElement.style.fontSize = `${fontSize}px`;
        for (const entry of cases) {
          const root = document.createElement('div');
          const rootSkin = entry.skin === undefined ? skin : entry.skin;
          root.className = rootSkin ? `a11y-toast-region--skin-${rootSkin}` : '';
          root.style.inlineSize = `${width}px`;
          root.style.setProperty('--a11y-toast-max-height', 'none');
          root.dataset.case = `${entry.tone}/${entry.mask}/${entry.layout}`;
          document.querySelector('main').append(root);
          const manager = createToast(root, {
            animation: 'none', priority: 'off', showToneLabel: entry.showToneLabel !== false,
            labels: { tones: {
              neutral: 'Benachrichtigung', info: 'Information', success: 'Erfolgreich gespeichert',
              warning: 'Bitte überprüfen', error: 'Fehler aufgetreten', loading: 'Wird verarbeitet',
            } },
          });
          managers.push(manager);
          let icon = null;
          if (entry.mask & 2) {
            icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            icon.setAttribute('viewBox', '0 0 24 24');
            const path = document.createElementNS(icon.namespaceURI, 'path');
            path.setAttribute('d', 'm5 12 4 4 10-10');
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'currentColor');
            path.setAttribute('stroke-width', '2');
            icon.append(path);
          }
          const id = manager.show({
            tone: entry.tone, persistent: true, priority: 'off', actionLayout: entry.layout,
            title: entry.mask & 1 ? 'Arbeitsbereich aktualisiert / إشعار' : null,
            message: 'Your collaborative workspace is ready. WeitereBenachrichtigungseinstellungenKönnenJetztÜberprüftWerden. اشترك في التحديثات وتابع العمل.',
            action: entry.mask & 4 ? { label: 'Änderungen rückgängig machen / تراجع' } : null,
            icon,
          });
          if (!id) throw new Error(`Fixture toast was refused: ${root.dataset.case}`);
          // Place an actual package viewport in document flow for simultaneous
          // measurements; no toast, typography or control styles are replaced.
          const viewport = root.querySelector('.a11y-toast-region__viewport');
          Object.assign(viewport.style, { position: 'static', inset: 'auto', inlineSize: '100%', maxInlineSize: '100%', margin: '0' });
        }
      },
      inspect() {
        const failures = [];
        for (const toast of document.querySelectorAll('.a11y-toast')) {
          const description = toast.closest('[data-case]').dataset.case;
          const bounds = toast.getBoundingClientRect();
          if (toast.scrollWidth > toast.clientWidth + 1) failures.push(`${description}: horizontal toast overflow`);
          if (toast.closest('.a11y-toast-region').scrollWidth > toast.closest('.a11y-toast-region').clientWidth + 1) failures.push(`${description}: horizontal host overflow`);
          for (const element of toast.querySelectorAll('.a11y-toast__content, .a11y-toast__title, .a11y-toast__message, .a11y-toast__tone, .a11y-toast__icon, button')) {
            // Hidden wrappers and the intentional clipped AT label are not
            // visible geometry; do not confuse them with content overflow.
            if (!element.getClientRects().length || element.matches('.a11y-toast__tone--visually-hidden')) continue;
            const rect = element.getBoundingClientRect();
            if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) failures.push(`${description}: ${element.className} outside toast`);
            if (element.matches('button') && (rect.width < 43.9 || rect.height < 43.9)) failures.push(`${description}: control target below 44px`);
          }
        }
        return { toasts: document.querySelectorAll('.a11y-toast').length, failures: failures.slice(0, 12) };
      },
      colors() {
        const rgb = value => value.match(/[\d.]+/g).map(Number);
        const backdrop = element => {
          if (!element) return [255, 255, 255];
          const color = rgb(getComputedStyle(element).backgroundColor);
          const alpha = color[3] ?? 1;
          const parent = backdrop(element.parentElement);
          return color.slice(0, 3).map((channel, index) => channel * alpha + parent[index] * (1 - alpha));
        };
        const luminance = color => color.slice(0, 3).map(channel => {
          channel /= 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        }).reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
        const ratio = (first, second) => {
          const a = luminance(first), b = luminance(second);
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        };
        return { rgb, backdrop, ratio };
      },
      contrast() {
        const { rgb, backdrop, ratio } = this.colors();
        const failures = [];
        for (const toast of document.querySelectorAll('.a11y-toast')) {
          for (const element of toast.querySelectorAll('.a11y-toast__tone, .a11y-toast__title, .a11y-toast__message, .a11y-toast__icon, button')) {
            if (!element.getClientRects().length || element.matches('.a11y-toast__tone--visually-hidden')) continue;
            const contrast = ratio(rgb(getComputedStyle(element).color), backdrop(element));
            const minimum = element.matches('.a11y-toast__icon') ? 3 : 4.5;
            if (contrast < minimum) failures.push(`${toast.closest('[data-case]').dataset.case}: ${element.className} contrast ${contrast.toFixed(2)} < ${minimum}`);
          }
        }
        return failures;
      },
      snapshot(root) {
        return [...root.querySelectorAll('.a11y-toast, .a11y-toast__icon, .a11y-toast__tone, .a11y-toast__title, .a11y-toast__message, button')].map(element => {
          const style = getComputedStyle(element);
          return [element.className, ...['backgroundColor', 'color', 'borderRadius', 'borderInlineStartWidth', 'padding', 'display', 'fontSize'].map(property => style[property])];
        });
      },
      destroy() { managers.splice(0).forEach(manager => manager.destroy()); },
    };
  }, skin);
  const stylesheets = await page.evaluate(() => [...document.styleSheets].map(sheet => new URL(sheet.href).pathname));
  assert(stylesheets.length === 2 && stylesheets.includes('/dist/styles.css') && stylesheets.includes(`/dist/skins/${skin}.css`), `Unexpected CSS prerequisite: ${stylesheets}`);
}

function casesFor({ completeOnly = false, hiddenLabel = false } = {}) {
  return TONES.flatMap(tone => (completeOnly ? [7] : [0, 1, 2, 3, 4, 5, 6, 7]).flatMap(mask => ['stacked', 'inline'].map(layout => ({
    tone, mask, layout, showToneLabel: !(hiddenLabel && tone === 'loading'),
  }))));
}

async function checkGeometry(page, options) {
  await page.evaluate(options => window.skinFixture.mount(options), options);
  const metrics = await page.evaluate(() => window.skinFixture.inspect());
  assert(metrics.toasts === options.cases.length && !metrics.failures.length, `${JSON.stringify({ width: options.width, direction: options.direction, fontSize: options.fontSize, ...metrics })}`);
}

export async function runSkinChecks(page, baseURL, test) {
  const context = await page.context().browser().newContext();
  const fixture = await context.newPage();
  const errors = [];
  fixture.on('pageerror', error => errors.push(error.message));
  await fixture.setViewportSize({ width: 1280, height: 900 });
  await fixture.route(`${baseURL}/__skin-regressions__`, route => route.fulfill({
    contentType: 'text/html',
    body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="/dist/styles.css"></head><body><main></main></body></html>',
  }));
  try {
    await test('Skins action-footer keeps its separated action row below wide inline content', async () => {
      await openFixture(fixture, baseURL, 'action-footer');
      await fixture.evaluate(() => window.skinFixture.mount({ cases: [{ tone: 'success', mask: 7, layout: 'inline' }] }));
      const placement = await fixture.locator('.a11y-toast').evaluate(toast => {
        const message = toast.querySelector('.a11y-toast__message').getBoundingClientRect();
        const actions = toast.querySelector('.a11y-toast__actions');
        const row = actions.getBoundingClientRect();
        return { messageBottom: message.bottom, actionTop: row.top, divider: getComputedStyle(actions).borderBlockStartWidth };
      });
      assert(placement.actionTop >= placement.messageBottom && parseFloat(placement.divider) >= 1, `Action footer became a side action: ${JSON.stringify(placement)}`);
    });

    for (const skin of SKIN_IDS) {
      await test(`Skins ${skin} real renderer supports six tones and all optional content at narrow/wide widths`, async () => {
        await openFixture(fixture, baseURL, skin);
        for (const width of [288, 576]) await checkGeometry(fixture, { width, cases: casesFor() });
      });

      await test(`Skins ${skin} enlarged RTL content and hidden tone labels retain usable controls`, async () => {
        await openFixture(fixture, baseURL, skin);
        for (const width of [288, 576]) {
          await checkGeometry(fixture, { width, direction: 'rtl', fontSize: 32, cases: casesFor({ completeOnly: true, hiddenLabel: true }) });
        }
      });

      await test(`Skins ${skin} text/icon/focus contrast and forced colors remain usable`, async () => {
        await openFixture(fixture, baseURL, skin);
        await checkGeometry(fixture, { width: 576, cases: casesFor({ completeOnly: true }) });
        const contrastFailures = await fixture.evaluate(() => window.skinFixture.contrast());
        assert(!contrastFailures.length, contrastFailures.join('\n'));

        // Keyboard focus establishes :focus-visible; scroll and focus only
        // actual visible native controls, never the hidden action placeholder.
        await fixture.keyboard.press('Tab');
        for (const selector of ['.a11y-toast__action', '.a11y-toast__dismiss']) {
          const control = fixture.locator(selector).first();
          await control.focus();
          const focus = await control.evaluate(element => {
            const style = getComputedStyle(element);
            const { rgb, backdrop, ratio } = window.skinFixture.colors();
            return {
              visible: element.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
              contrast: ratio(rgb(style.outlineColor), backdrop(element.closest('.a11y-toast'))),
            };
          });
          assert(focus.visible && focus.contrast >= 3, `${selector} focus failed: ${JSON.stringify(focus)}`);
        }

        await fixture.emulateMedia({ forcedColors: 'active' });
        try {
          const forced = await fixture.evaluate(() => {
            const failures = [];
            const probe = document.createElement('span');
            document.body.append(probe);
            const system = value => { probe.style.color = value; return getComputedStyle(probe).color; };
            const canvas = system('Canvas'), ink = system('CanvasText'), button = system('ButtonText'), face = system('ButtonFace'), highlight = system('Highlight');
            for (const toast of document.querySelectorAll('.a11y-toast')) {
              const description = toast.closest('[data-case]').dataset.case;
              const surface = getComputedStyle(toast);
              if (surface.backgroundColor !== canvas || surface.color !== ink || surface.borderTopColor !== ink) failures.push(`${description}: toast lost system colors`);
              for (const element of toast.querySelectorAll('.a11y-toast__title, .a11y-toast__message, .a11y-toast__tone, .a11y-toast__icon, button')) {
                if (!element.getClientRects().length) continue;
                const style = getComputedStyle(element);
                if (element.matches('button')) {
                  if (style.color !== button || style.backgroundColor !== face || style.borderTopColor !== button) failures.push(`${description}: control lost system colors`);
                } else if (style.color !== ink || style.backgroundColor !== canvas) failures.push(`${description}: content lost system colors`);
                if (element.matches(':focus-visible') && (style.outlineStyle === 'none' || style.outlineColor !== highlight)) failures.push(`${description}: focus lost system highlight`);
              }
            }
            probe.remove();
            return { failures, geometry: window.skinFixture.inspect() };
          });
          assert(!forced.failures.length && !forced.geometry.failures.length, JSON.stringify(forced));
        } finally { await fixture.emulateMedia({ forcedColors: 'none' }); }
      });
    }

    await test('Skins coexist on separate roots and loading the collection preserves default/minimal styles', async () => {
      await openFixture(fixture, baseURL, 'minimal');
      const isolated = await fixture.evaluate(async skins => {
        const cases = [null, ...skins].map(skin => ({ skin, tone: 'success', mask: 7, layout: 'inline' }));
        window.skinFixture.mount({ width: 576, cases });
        const roots = [...document.querySelectorAll('main > div')];
        const snapshot = () => [roots[0], roots[1]].map(root => window.skinFixture.snapshot(root));
        const before = snapshot();
        for (const skin of skins.filter(skin => skin !== 'minimal')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet'; link.href = `/dist/skins/${skin}.css`;
          await new Promise((resolve, reject) => {
            link.onload = resolve; link.onerror = () => reject(new Error(`Could not load ${link.href}`));
            document.head.append(link);
          });
        }
        const styled = roots.slice(1).map(root => window.skinFixture.snapshot(root));
        const alone = [];
        // Each root's final styles must also agree with that skin in isolation.
        const stylesheets = [...document.styleSheets];
        for (const [index, skin] of skins.entries()) {
          stylesheets.forEach(sheet => { sheet.disabled = !sheet.href.endsWith('/dist/styles.css') && !sheet.href.endsWith(`/dist/skins/${skin}.css`); });
          alone.push(window.skinFixture.snapshot(roots[index + 1]));
        }
        stylesheets.forEach(sheet => { sheet.disabled = false; });
        return { before, after: snapshot(), styled, alone, geometry: window.skinFixture.inspect() };
      }, SKIN_IDS);
      assert(JSON.stringify(isolated.before) === JSON.stringify(isolated.after), 'Collection changed the default or minimal root');
      assert(JSON.stringify(isolated.styled) === JSON.stringify(isolated.alone), 'One skin leaked styles into a different skin root');
      assert(isolated.geometry.toasts === 16 && !isolated.geometry.failures.length, JSON.stringify(isolated.geometry));
    });
  } finally {
    await fixture.evaluate(() => window.skinFixture?.destroy()).catch(() => {});
    await context.close();
  }
  await test('Skins isolated real-renderer fixture has no uncaught errors', async () => assert(!errors.length, errors.join('\n')));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {});
    const page = await browser.newPage();
    const results = [];
    await runSkinChecks(page, `http://127.0.0.1:${server.address().port}`, async (name, run) => {
      try { await run(); results.push({ name, status: 'pass' }); }
      catch (error) { results.push({ name, status: 'fail', error: String(error) }); }
    });
    await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
    await writeFile(new URL('../test-results/skins.json', import.meta.url), JSON.stringify({ browser: browser.version(), results }, null, 2));
    for (const result of results) console.log(`${result.status.toUpperCase()} ${result.name}${result.error ? `: ${result.error}` : ''}`);
    console.log(`${results.filter(result => result.status === 'pass').length}/${results.length} passed.`);
    if (results.some(result => result.status !== 'pass')) process.exitCode = 1;
  } finally { await browser?.close(); server.close(); }
}
