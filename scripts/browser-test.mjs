import { chromium } from 'playwright';
import { createServer } from './serve.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const server = createServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/examples/basic/`);
  // Leave the demo empty and exercise independent fixture hosts using the same built entry.
  const results = await page.evaluate(async () => {
    const api = await import('/dist/index.js');
    const { runSuite } = await import('/test/browser/suite.js');
    return runSuite(api);
  });
  await mkdir(new URL('../test-results/', import.meta.url), { recursive: true });
  await writeFile(new URL('../test-results/browser.json', import.meta.url), JSON.stringify({ browser: browser.version(), results, errors }, null, 2));
  for (const row of results) console.log(`${row.status.toUpperCase()} ${row.name}${row.error ? `\n  ${row.error}` : ''}`);
  if (results.some(row => row.status !== 'pass') || errors.length) process.exitCode = 1;
  console.log(`${results.filter(row => row.status === 'pass').length}/${results.length} passed; ${errors.length} uncaught page errors.`);
} finally {
  await browser?.close();
  server.close();
}
