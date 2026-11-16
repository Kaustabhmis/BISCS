#!/usr/bin/env node
/*
 * Regenerate the social share image (assets/img/og.png, 1200×630) and the
 * app icons (icon-192/512.png) from favicon.svg. Needs Playwright:
 *
 *   node scripts/build-og.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let playwright;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
  try { playwright = require(p); break; } catch { /* try next */ }
}
if (!playwright) { console.error('Playwright is required'); process.exit(1); }

const svg = fs.readFileSync(path.join(ROOT, 'favicon.svg'), 'utf8');
const ICONS = require(path.join(ROOT, 'assets/js/icons.js'));
const { CATEGORIES } = require(path.join(ROOT, 'assets/js/registry.js'));
const LABEL = '100+';
const ic = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;
const rot = [-8, 6, -4, 9, -6, 4, -10, 7, -5, 8, -7, 5, -3, 6, -9, 4];
const shift = [0, 30, -10, 20, 0, -20, 10, -15, 25, -5, 15, 0, 10, -10, 5, 20];
const tiles = CATEGORIES.slice(0, 12).map((c, i) =>
  `<div class="t" style="background:linear-gradient(140deg,${c.color}cc,${c.color});transform:rotate(${rot[i]}deg) translateY(${shift[i]}px)">${ic(c.icon)}</div>`).join('');

const browser = await playwright.chromium.launch();
for (const s of [192, 512]) {
  const p = await browser.newPage({ viewport: { width: s, height: s } });
  await p.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${s}px;height:${s}px;display:block}</style>${svg}`);
  await p.screenshot({ path: path.join(ROOT, `assets/img/icon-${s}.png`), omitBackground: true });
}
const p = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(`<style>
body{margin:0;width:1200px;height:630px;font-family:system-ui,sans-serif;color:#fff;overflow:hidden;
background:radial-gradient(800px 400px at 80% 0%,#4338ca,transparent 60%),radial-gradient(600px 400px at 0% 100%,#7c3aed66,transparent 60%),linear-gradient(160deg,#1e1b4b,#312e81)}
.w{padding:80px 72px;position:relative;z-index:2}
.logo{display:flex;align-items:center;gap:16px;font-weight:800;font-size:34px}
.logo svg{width:60px;height:60px}
h1{font-size:68px;line-height:1.05;margin:44px 0 20px;letter-spacing:-2px;max-width:560px}
h1 span{background:linear-gradient(90deg,#a5b4fc,#f0abfc,#fda4af);-webkit-background-clip:text;color:transparent}
p{font-size:26px;color:#c7cbea;margin:0;max-width:560px}
.g{position:absolute;right:28px;top:60px;display:grid;grid-template-columns:repeat(4,96px);gap:16px;z-index:1}
.t{width:96px;height:96px;border-radius:24px;display:grid;place-items:center;box-shadow:0 30px 50px -20px rgba(0,0,0,.6),inset 0 2px 0 rgba(255,255,255,.35)}
.t svg{width:46px;height:46px}
</style><div class="w"><div class="logo">${svg}<span>BISCS India</span></div><h1>${LABEL} free tools, <span>one place.</span></h1><p>PDF editor, AI photo, YouTube &amp; video, GST &amp; tax, office, design and SEO tools. Private: files never leave your device.</p></div><div class="g">${tiles}</div>`);
await p.screenshot({ path: path.join(ROOT, 'assets/img/og.png') });
await browser.close();
console.log('Wrote assets/img/og.png and app icons');
