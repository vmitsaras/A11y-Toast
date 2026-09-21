import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.map': 'application/json', '.md': 'text/plain', '.svg': 'image/svg+xml' };
const demoModuleRoot = path.join('node_modules', 'gsap');

function isAllowedDemoDependency(relative) {
  return relative.startsWith(`${demoModuleRoot}${path.sep}`) && path.extname(relative) === '.js';
}

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const filename = path.resolve(root, `.${pathname === '/' ? '/examples/basic/' : pathname}`);
      const relative = path.relative(root, filename);
      const includesNodeModules = relative.split(path.sep).includes('node_modules');
      if (relative.startsWith('..') || path.isAbsolute(relative) || (includesNodeModules && !isAllowedDemoDependency(relative))) { res.writeHead(403); res.end(); return; }
      const info = await stat(filename);
      const target = info.isDirectory() ? path.join(filename, 'index.html') : filename;
      const bytes = await readFile(target);
      res.writeHead(200, {
        'Content-Type': `${mime[path.extname(target)] || 'application/octet-stream'}; charset=utf-8`,
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'",
      });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const server = createServer();
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`A11y Toast demo: http://127.0.0.1:${port}/examples/basic/`));
}
