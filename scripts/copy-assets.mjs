import { copyFileSync, mkdirSync } from 'node:fs';
const out = new URL('../dist/', import.meta.url);
mkdirSync(out, { recursive: true });
copyFileSync(new URL('../src/styles.css', import.meta.url), new URL('styles.css', out));
