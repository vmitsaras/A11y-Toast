import { copyFileSync, mkdirSync } from 'node:fs';
const out = new URL('../dist/', import.meta.url);
mkdirSync(out, { recursive: true });
mkdirSync(new URL('addons/', out), { recursive: true });
mkdirSync(new URL('animations/', out), { recursive: true });
copyFileSync(new URL('../src/styles.css', import.meta.url), new URL('styles.css', out));
copyFileSync(new URL('../src/addons/progress.css', import.meta.url), new URL('addons/progress.css', out));
copyFileSync(new URL('../src/animations/view-transition.css', import.meta.url), new URL('animations/view-transition.css', out));
