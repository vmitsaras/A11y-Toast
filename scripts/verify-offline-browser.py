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
mods={name:(root/'dist'/name).read_text() for name in ['events.js','options.js','LiveAnnouncer.js','A11yToast.js','index.js']}
with sync_playwright() as p:
 b=p.chromium.launch(**launch_options)
 page=b.new_page(viewport={'width':1440,'height':1000})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<!doctype html><html lang="en"><head><title>Toast contract tests</title></head><body></body></html>')
 page.add_style_tag(content=(root/'dist/styles.css').read_text())
 page.evaluate(r'''async mods => {
   const urls = {};
   for (const [name,source] of Object.entries(mods)) {
     const resolved=source.replace(/from ['"]\.\/([^'"]+)['"]/g, (all, dep)=>`from '${urls[dep]}'`);
     urls[name]=URL.createObjectURL(new Blob([resolved], {type:'text/javascript'}));
   }
   window.__toastTestApi = await import(urls['index.js']);
 }''',mods)
 source=(root/'test/browser/suite.js').read_text()
 results=page.evaluate('''async source => {
   const {runSuite}=await import(URL.createObjectURL(new Blob([source],{type:'text/javascript'})));
   return runSuite(window.__toastTestApi);
 }''', source)
 output={'browser':b.version, 'transport':'Local portable ESM via Blob module URLs in a synthetic document. Only module import URL resolution is changed.', 'results':results, 'uncaughtErrors':errors}
 (output_dir/'browser-results.json').write_text(json.dumps(output,indent=2))
 print(json.dumps({'browser':b.version,'pass':sum(x['status']=='pass' for x in results),'total':len(results),'failures':[x for x in results if x['status']=='fail'],'errors':errors},indent=2))
 b.close()

if errors or any(row['status'] != 'pass' for row in results):
 sys.exit(1)
