#!/usr/bin/env python3
"""Offline verification using the real portable ESM build.

Requires Python Playwright and a Chromium executable. First run
`npm run build:portable`. Use CHROMIUM_EXECUTABLE to select a browser.
This synthetic-document route supplements, not replaces, served-browser and AT tests.
"""
from pathlib import Path
import os, shutil, sys
from playwright.sync_api import sync_playwright
import json
root=Path(__file__).resolve().parents[1]
output_dir=root/'test-results'
output_dir.mkdir(exist_ok=True)
executable=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser')
launch_options={'headless':True}
if executable:
 launch_options['executable_path']=executable
mods={p.relative_to(root).as_posix():p.read_text() for p in (root/'dist').rglob('*.js')}
for name in ['test/browser/suite.js','test/browser/history.js']:
 mods[name]=(root/name).read_text()
with sync_playwright() as p:
 b=p.chromium.launch(**launch_options)
 page=b.new_page(viewport={'width':1440,'height':1000})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html lang="en"><head><title>Toast contract tests</title></head><body></body></html>')
 page.add_style_tag(content=(root/'dist/styles.css').read_text())
 results=page.evaluate(r'''async modules => {
   const urls = new Map(), loading = new Set();
   const resolve = name => {
     if (urls.has(name)) return urls.get(name);
     if (!(name in modules)) throw new Error(`Missing built module: ${name}`);
     if (loading.has(name)) throw new Error(`Unsupported cyclic module graph: ${name}`);
     loading.add(name);
     const source = modules[name].replace(/\bfrom\s*(['"])(\.{1,2}\/[^'"]+)\1/g, (all, quote, dependency) => {
       const path = new URL(dependency, `https://local.invalid/${name}`).pathname.slice(1);
       return `from '${resolve(path)}'`;
     });
     const url = URL.createObjectURL(new Blob([source], {type:'text/javascript'}));
     urls.set(name, url); loading.delete(name); return url;
   };
   try {
     const api = {...await import(resolve('dist/index.js'))};
     const entries = {
       createHistoryController: 'addons/history',
       createProgressAddon: 'addons/progress',
       trackToastPromise: 'addons/promise',
       createDedupeController: 'addons/dedupe',
       createDomEventAdapter: 'adapters/dom-events',
       createAriaNotifyTransport: 'transports/aria-notify',
       createGsapAnimationDriver: 'animations/gsap',
       createGsapFlipLayoutAddon: 'animations/gsap-flip',
       createElementViewTransitionDriver: 'animations/view-transition',
     };
     for (const [name, path] of Object.entries(entries)) {
       api[name] = (await import(resolve(`dist/${path}.js`)))[name];
     }
     const {runSuite} = await import(resolve('test/browser/suite.js'));
     return await runSuite(api);
   } finally { for (const url of urls.values()) URL.revokeObjectURL(url); }
 }''', mods)
 output={'browser':b.version, 'transport':'Local portable ESM via Blob module URLs in a synthetic document. Only module import URL resolution is changed.', 'results':results, 'uncaughtErrors':errors}
 (output_dir/'browser-results.json').write_text(json.dumps(output,indent=2))
 print(json.dumps({'browser':b.version,'pass':sum(x['status']=='pass' for x in results),'total':len(results),'failures':[x for x in results if x['status']=='fail'],'errors':errors},indent=2))
 b.close()

if errors or any(row['status'] != 'pass' for row in results):
 sys.exit(1)
