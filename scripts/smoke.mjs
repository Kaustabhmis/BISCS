#!/usr/bin/env node
/*
 * Smoke test: open tool pages in headless Chromium and fail on JS errors or
 * tools that don't render.
 *
 *   npx http-server -p 8080 -s .   (in another terminal)
 *   node scripts/smoke.mjs [--base http://127.0.0.1:8080] [--cat pdf] [tool-id ...]
 *
 * Needs the `playwright` package (global or local).
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { TOOLS } = require(path.join(ROOT, 'assets/js/registry.js'));

let playwright;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
  try { playwright = require(p); break; } catch { /* try next */ }
}
if (!playwright) { console.error('playwright not found'); process.exit(2); }

const args = process.argv.slice(2);
let base = 'http://127.0.0.1:8080';
let cat = null;
const ids = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--base') base = args[++i];
  else if (args[i] === '--cat') cat = args[++i];
  else ids.push(args[i]);
}
const list = TOOLS.filter((t) => (ids.length ? ids.includes(t.id) : true) && (cat ? t.cat === cat : true));

const browser = await playwright.chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined
});
const page = await browser.newPage();
let failed = 0;
for (const t of list) {
  const errors = [];
  const onErr = (e) => errors.push('pageerror: ' + e.message);
  const onConsole = (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); };
  page.on('pageerror', onErr);
  page.on('console', onConsole);
  await page.goto(`${base}/tools/${t.id}/`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => {
    const r = document.querySelector('#tool-root');
    return {
      loading: !!r.querySelector('.loading'),
      error: r.querySelector('.notice.error')?.textContent || '',
      size: r.innerHTML.length
    };
  });
  page.off('pageerror', onErr);
  page.off('console', onConsole);
  const bad = errors.filter((e) => !/favicon|fonts\.g/.test(e));
  if (state.loading || state.error || state.size < 50 || bad.length) {
    failed++;
    console.log(`FAIL ${t.id}`, JSON.stringify({ ...state, errors: bad }));
  } else {
    console.log(`ok   ${t.id}`);
  }
}
await browser.close();
console.log(`\n${list.length - failed}/${list.length} passed`);
process.exit(failed ? 1 : 0);
