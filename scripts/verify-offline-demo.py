#!/usr/bin/env python3
"""Offline verification using the real portable ESM build.

Requires Python Playwright and a Chromium executable. First run
`npm run build:portable`. Use CHROMIUM_EXECUTABLE to select a browser.
This synthetic-document route supplements, not replaces, served-browser and AT tests.
"""
from pathlib import Path
import os, shutil, sys
from playwright.sync_api import sync_playwright
import re,json
root=Path(__file__).resolve().parents[1]
output_dir=root/'test-results'
output_dir.mkdir(exist_ok=True)
executable=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser')
launch_options={'headless':True}
if executable:
 launch_options['executable_path']=executable
html=re.sub(r'<link[^>]*>', '', (root/'examples/basic/index.html').read_text())
html=re.sub(r'<script[^>]*>.*?</script>', '',html,flags=re.S)
mods={name:(root/'dist'/name).read_text() for name in ['events.js','options.js','LiveAnnouncer.js','A11yToast.js','index.js']}
checks=[]
def check(name,condition):
 checks.append({'name':name,'status':'pass' if condition else 'fail'})
with sync_playwright() as p:
 b=p.chromium.launch(**launch_options)
 page=b.new_page(viewport={'width':1440,'height':1080})
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html)
 page.add_style_tag(content=(root/'dist/styles.css').read_text()+'\n'+(root/'examples/basic/demo.css').read_text())
 urls=page.evaluate(r'''async mods => {const urls={};for(const [name,source] of Object.entries(mods)){const resolved=source.replace(/from ['"]\.\/([^'"]+)['"]/g,(all,dep)=>`from '${urls[dep]}'`);urls[name]=URL.createObjectURL(new Blob([resolved],{type:'text/javascript'}));}window.__toastTestApi=await import(urls['index.js']);return urls;}''',mods)
 demo=(root/'examples/basic/demo.js').read_text().replace('../../dist/index.js',urls['index.js'])
 page.evaluate('''async source=>{window.__toastDemo=await import(URL.createObjectURL(new Blob([source],{type:'text/javascript'})));}''',demo)
 check('No unsolicited toasts on startup',page.locator('[data-a11y-toast-id]').count()==0)
 check('Every demo form control has a visible associated label',page.evaluate("Array.from(document.querySelectorAll('input,select,textarea')).every(e=>e.labels.length>0)"))
 check('Event history is not a live region',page.locator('[data-log]').get_attribute('role') is None and page.locator('[data-log]').get_attribute('aria-live') is None)
 page.get_by_role('button',name='Show toast',exact=False).click()
 check('Show preserves trigger focus',page.evaluate("document.activeElement.type==='submit'"))
 page.wait_for_timeout(180)
 check('Actual polite DOM write occurs',page.locator('[role=status]').text_content()=='Success. Your changes were saved.')
 page.get_by_role('button',name='Close notification',exact=True).click()
 check('Close returns focus to the originating Show control',page.evaluate("document.activeElement.type==='submit'"))
 page.get_by_role('button',name='Show 5 toasts',exact=True).click()
 check('Queue demo produces three visible and two queued',page.evaluate("window.__toastDemo.getDemoManager().visibleCount===3 && window.__toastDemo.getDemoManager().queuedCount===2"))
 page.get_by_role('button',name='Dismiss all notifications',exact=True).focus();page.keyboard.press('Enter')
 check('Clear removes the entire queue and retains useful focus',page.evaluate("window.__toastDemo.getDemoManager().getToasts().length===0 && document.activeElement.type==='submit'"))
 page.get_by_role('button',name='Start loading',exact=True).click()
 load_id=page.evaluate("window.__toastDemo.getDemoManager().getToasts()[0].id")
 check('Loading stays persistent and next action is keyboard reachable',page.evaluate("window.__toastDemo.getDemoManager().getToasts()[0].persistent && document.activeElement.hasAttribute('data-finish-loading')"))
 page.get_by_role('button',name='Finish loading',exact=True).click()
 check('Loading completion updates rather than duplicates the toast',page.evaluate("window.__toastDemo.getDemoManager().getToasts().length===1 && window.__toastDemo.getDemoManager().getToasts()[0].tone==='success' && !window.__toastDemo.getDemoManager().getToasts()[0].persistent") and page.evaluate("window.__toastDemo.getDemoManager().getToasts()[0].id")==load_id)
 page.get_by_role('button',name='Dismiss all notifications',exact=True).focus();page.keyboard.press('Enter')
 page.get_by_role('button',name='Test action retry',exact=True).click()
 page.get_by_role('button',name='Try demo action',exact=True).click()
 check('First demo action failure is visible and retryable',page.locator('.a11y-toast__action-error').is_visible())
 page.get_by_role('button',name='Try demo action',exact=True).click()
 check('Retry succeeds without a second notification',page.evaluate("window.__toastDemo.getDemoManager().getToasts().length===1 && window.__toastDemo.getDemoManager().getToasts()[0].message==='The demo action succeeded.'"))
 page.get_by_role('button',name='Dismiss all notifications',exact=True).focus();page.keyboard.press('Enter')
 page.locator('#position').select_option('top-start');page.get_by_role('button',name='Show toast',exact=False).click()
 check('Changing position safely recreates an empty manager',page.locator('.a11y-toast-region__viewport--top-start').count()==1)
 page.get_by_role('button',name='Dismiss all notifications',exact=True).focus();page.keyboard.press('Enter')
 page.locator('#position').select_option('bottom-end');page.get_by_role('button',name='Show toast',exact=False).click()
 page.evaluate("document.querySelector('[data-a11y-toast]').dir='rtl'")
 check('Logical end placement mirrors in RTL',page.locator('.a11y-toast-region__viewport').bounding_box()['x']<30)
 page.evaluate("document.querySelector('[data-a11y-toast]').dir='ltr'")
 page.emulate_media(reduced_motion='reduce')
 check('Reduced motion removes entry animation',page.locator('.a11y-toast').evaluate("e=>getComputedStyle(e).animationName")=='none')
 page.emulate_media(forced_colors='active')
 check('Forced-colors keeps a visible toast border',page.locator('.a11y-toast').evaluate("e=>parseFloat(getComputedStyle(e).borderTopWidth)>0"))
 page.emulate_media(forced_colors='none')
 page.set_viewport_size({'width':320,'height':720})
 check('320px layout has no document horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'))
 check('Toast remains within the 320px viewport',page.locator('.a11y-toast-region__viewport').evaluate('e=>{const r=e.getBoundingClientRect();return r.x>=0 && r.right<=innerWidth;}'))
 page.evaluate("document.documentElement.style.fontSize='200%'")
 check('200% root-text-size smoke test has no horizontal page overflow',page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth'))
 page.evaluate("document.documentElement.style.fontSize=''")
 # Real browser timers, in addition to deterministic fake-clock lifecycle tests.
 page.get_by_role('button',name='Dismiss all notifications',exact=True).focus();page.keyboard.press('Enter')
 page.mouse.move(0,0)
 real_id=page.evaluate("window.__toastDemo.getDemoManager().show({message:'Real timer',duration:1000,priority:'off'})")
 page.wait_for_timeout(1150)
 check('Real browser timeout expires after one second',page.evaluate('(id)=>window.__toastDemo.getDemoManager().getToast(id)===undefined',real_id))
 page.set_viewport_size({'width':1440,'height':1080})
 page.get_by_role('button',name='Show toast',exact=False).click();page.wait_for_timeout(200)
 page.screenshot(path=str(output_dir/'demo-desktop.png'),full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(output_dir/'demo-mobile.png'),full_page=True)
 report={'browser':b.version,'transport':'Compiled local portable ESM and actual demo markup/styles loaded into a synthetic document; not an HTTP navigation test.','checks':checks,'uncaughtErrors':errors,'limitations':'The root-text-size test is not a substitute for browser 200% zoom or VoiceOver testing.'}
 (output_dir/'ui-results.json').write_text(json.dumps(report,indent=2))
 print(json.dumps({'pass':sum(x['status']=='pass' for x in checks),'total':len(checks),'failures':[x for x in checks if x['status']=='fail'],'errors':errors},indent=2))
 b.close()

if errors or any(row['status'] != 'pass' for row in checks):
 sys.exit(1)
