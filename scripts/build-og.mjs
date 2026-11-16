#!/usr/bin/env node
/*
 * Regenerate the social share image (assets/img/og.png, 1200×630) and every
 * icon from favicon.svg: favicon.ico, favicon PNGs, apple-touch-icon and app icons. Needs Playwright:
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
/** Render favicon.svg at `size` px. `pad` (0-1) shrinks the logo; `bg` fills the square (no transparency). */
async function renderIcon(size, { pad = 0, bg = null } = {}) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  const inner = Math.round(size * (1 - pad));
  // On a full-bleed background, draw only the bolt (drop the logo's rounded square).
  const art = bg ? svg.replace(/<rect[^>]*\/>/, '') : svg;
  await p.setContent(`<style>html,body{margin:0;width:${size}px;height:${size}px;display:grid;place-items:center;background:${bg || 'transparent'}}svg{width:${inner}px;height:${inner}px;display:block}</style>${art}`);
  const buf = await p.screenshot({ omitBackground: !bg });
  await p.close();
  return buf;
}
const BRAND_BG = 'linear-gradient(135deg,#4f46e5,#7c3aed 60%,#ec4899)';
// App and browser icons.
fs.writeFileSync(path.join(ROOT, 'assets/img/icon-192.png'), await renderIcon(192));
fs.writeFileSync(path.join(ROOT, 'assets/img/icon-512.png'), await renderIcon(512));
// Android maskable icon: logo inside the 80% safe zone on a full-bleed background.
fs.writeFileSync(path.join(ROOT, 'assets/img/icon-maskable-512.png'), await renderIcon(512, { pad: 0.28, bg: BRAND_BG }));
// Apple touch icon must be opaque (iOS adds its own rounded corners).
fs.writeFileSync(path.join(ROOT, 'apple-touch-icon.png'), await renderIcon(180, { pad: 0.16, bg: BRAND_BG }));
// PNG favicons; Google Search shows a square favicon that is a multiple of 48 px.
fs.writeFileSync(path.join(ROOT, 'favicon-48x48.png'), await renderIcon(48));
fs.writeFileSync(path.join(ROOT, 'favicon-96x96.png'), await renderIcon(96));
// favicon.ico with 16, 32 and 48 px PNG images (ICO container).
const pngs = [];
for (const s of [16, 32, 48]) pngs.push([s, await renderIcon(s)]);
const head = Buffer.alloc(6 + 16 * pngs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
let offset = head.length;
pngs.forEach(([s, buf], i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += buf.length;
});
fs.writeFileSync(path.join(ROOT, 'favicon.ico'), Buffer.concat([head, ...pngs.map((x) => x[1])]));
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
console.log('Wrote og.png, favicon.ico, favicon PNGs, apple-touch-icon and app icons');
