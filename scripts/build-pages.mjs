import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const docs = new URL('../docs/', import.meta.url);

const required = [
  'dist/index.js',
  'dist/styles.css',
  'examples/basic/index.html',
  'examples/basic/a11y-toast-mark.svg',
  'examples/basic/demo.css',
  'examples/basic/demo.js',
  'examples/shared/demo.css',
  'examples/advanced/index.html',
  'examples/advanced/demo.css',
  'examples/advanced/demo.js',
  'examples/advanced/history-demo.css',
  'examples/advanced/history-demo.js',
  'examples/designs/index.html',
  'examples/designs/demo.css',
  'examples/designs/demo.js',
  'dist/skins/minimal.css',
  '.github/social-preview.png',
  'node_modules/gsap/index.js',
  'node_modules/gsap/gsap-core.js',
  'node_modules/gsap/CSSPlugin.js',
  'node_modules/gsap/Flip.js',
  'node_modules/gsap/utils/matrix.js',
];

for (const relative of required) {
  if (!existsSync(new URL(relative, root))) {
    throw new Error(`Cannot generate GitHub Pages: missing ${relative}`);
  }
}

for (const relative of [
  'index.html',
  'demo.css',
  'demo.js',
  'history-demo.css',
  'history-demo.js',
  'social-preview.png',
  'a11y-toast-mark.svg',
  '.nojekyll',
  'dist',
  'vendor',
  'advanced',
  'designs',
  'shared',
]) {
  rmSync(new URL(relative, docs), { recursive: true, force: true });
}

mkdirSync(docs, { recursive: true });
cpSync(new URL('dist/', root), new URL('dist/', docs), { recursive: true });

mkdirSync(new URL('shared/', docs), { recursive: true });
copyFileSync(new URL('examples/shared/demo.css', root), new URL('shared/demo.css', docs));
copyFileSync(new URL('examples/basic/a11y-toast-mark.svg', root), new URL('a11y-toast-mark.svg', docs));
copyFileSync(new URL('.github/social-preview.png', root), new URL('social-preview.png', docs));

for (const [example, directory, prefix] of [['basic', '', './'], ['advanced', 'advanced/', '../'], ['designs', 'designs/', '../']]) {
  const destination = new URL(directory, docs);
  mkdirSync(destination, { recursive: true });
  const html = readFileSync(new URL(`examples/${example}/index.html`, root), 'utf8')
    .replaceAll('../../dist/', `${prefix}dist/`)
    .replaceAll('../shared/', `${prefix}shared/`)
    .replaceAll('../basic/', prefix)
    .replaceAll('../designs/', `${prefix}designs/`)
    .replaceAll('../advanced/', `${prefix}advanced/`);
  writeFileSync(new URL('index.html', destination), html);
  copyFileSync(new URL(`examples/${example}/demo.css`, root), new URL('demo.css', destination));
  const demo = readFileSync(new URL(`examples/${example}/demo.js`, root), 'utf8')
    .replaceAll('../../dist/', `${prefix}dist/`)
    .replaceAll('../../node_modules/gsap/', `${prefix}vendor/gsap/`);
  writeFileSync(new URL('demo.js', destination), demo);
}
copyFileSync(new URL('examples/advanced/history-demo.css', root), new URL('advanced/history-demo.css', docs));
const historyDemo = readFileSync(new URL('examples/advanced/history-demo.js', root), 'utf8')
  .replaceAll('../../dist/', '../dist/');
writeFileSync(new URL('advanced/history-demo.js', docs), historyDemo);

for (const relative of ['index.js', 'gsap-core.js', 'CSSPlugin.js', 'Flip.js', 'utils/matrix.js']) {
  const destination = new URL(`vendor/gsap/${relative}`, docs);
  mkdirSync(new URL('./', destination), { recursive: true });
  copyFileSync(new URL(`node_modules/gsap/${relative}`, root), destination);
}

writeFileSync(new URL('.nojekyll', docs), '');

if (!existsSync(new URL('index.html', docs))) {
  throw new Error(`GitHub Pages output has no index.html at ${fileURLToPath(docs)}`);
}

console.log(`GitHub Pages output generated at ${fileURLToPath(docs)}`);
