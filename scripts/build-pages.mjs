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
  'examples/basic/history-demo.css',
  'examples/basic/history-demo.js',
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
]) {
  rmSync(new URL(relative, docs), { recursive: true, force: true });
}

mkdirSync(docs, { recursive: true });
cpSync(new URL('dist/', root), new URL('dist/', docs), { recursive: true });

for (const name of ['demo.css', 'history-demo.css']) {
  copyFileSync(new URL(`examples/basic/${name}`, root), new URL(name, docs));
}
copyFileSync(new URL('examples/basic/a11y-toast-mark.svg', root), new URL('a11y-toast-mark.svg', docs));
copyFileSync(new URL('.github/social-preview.png', root), new URL('social-preview.png', docs));

const html = readFileSync(new URL('examples/basic/index.html', root), 'utf8')
  .replaceAll('../../dist/', './dist/');
writeFileSync(new URL('index.html', docs), html);

const demo = readFileSync(new URL('examples/basic/demo.js', root), 'utf8')
  .replaceAll('../../dist/', './dist/')
  .replaceAll('../../node_modules/gsap/', './vendor/gsap/');
writeFileSync(new URL('demo.js', docs), demo);

const historyDemo = readFileSync(new URL('examples/basic/history-demo.js', root), 'utf8')
  .replaceAll('../../dist/', './dist/');
writeFileSync(new URL('history-demo.js', docs), historyDemo);

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
