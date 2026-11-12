#!/usr/bin/env python3
"""Targeted TOAST-270 ESM/browser checks, without an HTTP server.

Run npm run build:portable first. Requires Python Playwright plus Chromium.
This supplements, not replaces, the standard served browser/Vitest/AT gates.
Only relative module URL specifiers are rewritten to Blob URLs; module bodies
and JavaScript module semantics remain intact. No network requests are used.
"""
from pathlib import Path
import json
import os
import shutil
import sys
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
modules = {p.relative_to(root).as_posix(): p.read_text() for p in (root / 'dist').rglob('*.js')}
for name in ('test/browser/history.js', 'examples/advanced/history-demo.js'):
    modules[name] = (root / name).read_text()
launch = {'headless': True}
executable = os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser')
if executable:
    launch['executable_path'] = executable
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(**launch)
    page = browser.new_page(viewport={'width': 1120, 'height': 850})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>TOAST-270 checks</title></head><body></body></html>')
    page.add_style_tag(content=(root / 'examples/advanced/history-demo.css').read_text())
    report = page.evaluate(r'''async modules => {
      const urls = new Map();
      const loading = new Set();
      const resolve = name => {
        if (urls.has(name)) return urls.get(name);
        if (!(name in modules)) throw new Error(`Missing module: ${name}`);
        if (loading.has(name)) throw new Error(`Unsupported cyclic module graph: ${name}`);
        loading.add(name);
        const source = modules[name].replace(/\bfrom\s*(['"])(\.{1,2}\/[^'"]+)\1/g, (all, quote, dependency) => {
          const path = new URL(dependency, `https://local.invalid/${name}`).pathname.slice(1);
          return `from '${resolve(path)}'`;
        });
        const url = URL.createObjectURL(new Blob([source], {type: 'text/javascript'}));
        urls.set(name, url);
        loading.delete(name);
        return url;
      };
      try {
        const core = await import(resolve('dist/index.js'));
        const history = await import(resolve('dist/addons/history.js'));
        const {runHistorySuite} = await import(resolve('test/browser/history.js'));
        const results = await runHistorySuite({...core, ...history});
        const {createHistoryDemo} = await import(resolve('examples/advanced/history-demo.js'));
        const fixture = document.createElement('main');
        const host = document.createElement('div');
        fixture.append(host);
        document.body.append(fixture);
        const manager = core.createToast(host, {animation: 'none', priority: 'off'});
        const inspector = createHistoryDemo(manager, fixture);
        const assert = (ok, message) => { if (!ok) throw new Error(message); };
        const ui = [];
        const check = (name, fn) => {
          try { fn(); ui.push({name, status:'pass'}); }
          catch (error) { ui.push({name,status:'fail',error:String(error)}); }
        };
        const panel = fixture.querySelector('.toast-history-demo');
        const buttons = panel.querySelectorAll('button');
        const details = panel.querySelector('details');
        details.open = true;
        let actions = 0;
        const id = manager.show({title:'Recorded title',message:'<img src=x onerror=alert(1)>',persistent:true,action:{label:'Undo original',onClick(){actions++;}}});
        check('UI01 no live regions or replay controls; text-only rendering', () => {
          buttons[0].click();
          assert(!panel.querySelector('[aria-live],[role="log"],[role="alert"],[role="status"]'), 'History must not be live');
          assert(panel.querySelectorAll('button').length === 2, 'Only Refresh/Clear controls');
          assert(!panel.querySelector('img,script'), 'Plain text must not become markup');
          assert(panel.querySelectorAll('li').length === 1, 'Show recorded');
          assert(panel.textContent.includes('Undo original'), 'Action label is explanatory text');
          assert(actions === 0, 'No action invocation');
        });
        check('UI02 explicit refresh, no asynchronous list replacement', () => {
          manager.update(id, {message:'Latest content'});
          assert(!panel.textContent.includes('Latest content'), 'No automatic history update');
          buttons[0].focus();
          buttons[0].click();
          assert(panel.querySelectorAll('li').length === 2, 'Refresh reads current entries');
          assert(document.activeElement === buttons[0], 'Refresh preserves focus');
        });
        check('UI03 Clear keeps the live toast and keyboard focus', () => {
          buttons[1].focus();
          buttons[1].click();
          assert(panel.querySelectorAll('li').length === 0, 'Clear empties displayed rows');
          assert(Boolean(manager.getToast(id)), 'Clear cannot dismiss live toast');
          assert(document.activeElement === buttons[1], 'Clear preserves focus');
          assert(!panel.querySelector('.toast-history-demo__empty').hidden, 'Empty state appears');
        });
        check('UI04 manager destruction disposes inspector and data', () => {
          manager.destroy();
          assert(!panel.isConnected, 'No orphaned inspector');
          inspector.destroy();
          assert(panel.querySelectorAll('li').length === 0, 'Detached display retains no history rows');
        });
        fixture.remove();
        return {results, ui};
      } finally {
        for (const url of urls.values()) URL.revokeObjectURL(url);
      }
    }''', modules)
    report.update({
        'browser': browser.version,
        'baseline': '353b27ea7c4fcc313875d0f7e94ed3c12c40291a',
        'transport': 'Real compiled ESM via Blob module URLs in a synthetic document; relative import URL specifiers only are rewritten.',
        'scope': '25 targeted TOAST-270 scenarios plus four inspector DOM checks; not full CI, served-browser, manual VoiceOver or zoom verification.',
        'errors': errors,
    })
    output = root / 'test-results'
    output.mkdir(exist_ok=True)
    (output / 'history-offline.json').write_text(json.dumps(report, indent=2) + '\n')
    browser.close()
rows = report['results'] + report['ui']
for row in rows:
    print(row['status'].upper(), row['name'], row.get('error', ''))
print(f"{sum(row['status'] == 'pass' for row in rows)}/{len(rows)} passed; {len(errors)} uncaught page errors.")
if errors or any(row['status'] != 'pass' for row in rows):
    sys.exit(1)
