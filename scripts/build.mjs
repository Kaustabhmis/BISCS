#!/usr/bin/env node
/*
 * BISCS Tools — static page generator.
 *
 *   node scripts/build.mjs
 *
 * Reads assets/js/registry.js and writes:
 *   index.html, tools/<id>/index.html, category/<id>/index.html,
 *   about/, contact/, privacy/, terms/, 404.html, sitemap.xml, robots.txt
 *
 * Pages are plain HTML (good for SEO and AdSense); tool UIs are rendered by
 * assets/js/tools/*.js in the browser. Re-run after editing the registry.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { TOOLS, CATEGORIES } = require(path.join(ROOT, 'assets/js/registry.js'));
const ICONS = require(path.join(ROOT, 'assets/js/icons.js'));

// ------------------------------------------------------------------ config
const SITE = {
  name: 'BISCS India',
  url: 'https://www.biscsindia.com',
  tagline: '100 free online tools for everyday work',
  email: 'info@biscsindia.com',
  address: { locality: 'Kolkata', region: 'West Bengal', postalCode: '700026', country: 'IN', countryName: 'India' },
  year: new Date().getFullYear(),
  version: '' // cache-buster for CSS/JS, set from asset contents below
};

// Content hash of all CSS/JS so browsers refetch only when assets change.
{
  const h = crypto.createHash('sha1');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'vendor') walk(p); } else if (/\.(css|js)$/.test(e.name)) h.update(fs.readFileSync(p));
  });
  walk(path.join(ROOT, 'assets'));
  SITE.version = h.digest('hex').slice(0, 10);
}

// ----------------------------------------------------------------- helpers
const addressLine = () => `${SITE.address.locality}, ${SITE.address.region}, ${SITE.address.countryName} ${SITE.address.postalCode}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (name, cls = '') =>
  `<svg class="icon ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.sparkles}</svg>`;
const cat = (id) => CATEGORIES.find((c) => c.id === id);
const toolsIn = (id) => TOOLS.filter((t) => t.cat === id);
const fileFor = (t) => t.file || t.cat;

function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function toolCard(t, base, extra = '') {
  const c = cat(t.cat);
  return `<a class="tool-card${extra}" href="${base}tools/${t.id}/" data-id="${t.id}" data-cat="${t.cat}" style="--c:${c.color}">
  <span class="tool-icon">${icon(t.icon)}</span>
  <h3>${esc(t.name)}</h3>
  <p>${esc(t.desc)}</p>
  <span class="go">${icon('arrow-right')}</span>
</a>`;
}

function miniLink(t, base) {
  return `<a href="${base}tools/${t.id}/"><span class="mi" style="background:${cat(t.cat).color}">${icon(t.icon)}</span>${esc(t.name)}</a>`;
}

// ------------------------------------------------------------------ layout
function layout({ base, title, description, canonical, body, scripts = '', active = '', jsonld = [], extraHead = '' }) {
  const nav = [
    ['pdf', 'PDF Tools'], ['finance', 'Finance'], ['calculators', 'Calculators'],
    ['text', 'Text'], ['dev', 'Developer'], ['image', 'Image']
  ];
  const navLinks = nav.map(([id, label]) =>
    `<a href="${base}category/${id}/"${active === id ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const mobileLinks = CATEGORIES.map((c) =>
    `<a href="${base}category/${c.id}/"><span class="mi" style="background:${c.color};width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:#fff">${icon(c.icon)}</span>${esc(c.name)}</a>`).join('');
  const footCols = [
    ['PDF Tools', toolsIn('pdf').slice(0, 7)],
    ['Finance', toolsIn('finance').slice(0, 7)],
    ['Popular', ['word-counter', 'image-compressor', 'qr-code-generator', 'invoice-generator', 'json-formatter', 'age-calculator', 'password-generator'].map((id) => TOOLS.find((t) => t.id === id))]
  ];
  return `<!doctype html>
<html lang="en-IN" data-base="${base}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE.url}${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE.url}${canonical}">
<meta property="og:image" content="${SITE.url}/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#4f46e5">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="manifest" href="${base}site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="${base}assets/css/site.css?v=${SITE.version}">
<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('bt-theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
${jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
${extraHead}
</head>
<body>
<a class="sr-only" href="#main">Skip to content</a>
<header class="site-header">
  <div class="container">
    <div class="bar">
      <a class="logo" href="${base}" aria-label="${esc(SITE.name)} home"><span class="logo-mark">${icon('zap')}</span><span>BISCS <em>India</em></span></a>
      <nav class="nav" aria-label="Main">${navLinks}</nav>
      <div class="header-actions">
        <button class="search-trigger" data-search-open type="button">${icon('search')}<span>Search tools…</span><kbd>Ctrl K</kbd></button>
        <button class="icon-btn search-trigger-mobile" data-search-open type="button" aria-label="Search tools">${icon('search')}</button>
        <button class="icon-btn" data-theme-toggle type="button" aria-label="Toggle dark mode">${icon('moon')}</button>
        <button class="icon-btn menu-btn" data-menu-toggle type="button" aria-label="Menu" aria-expanded="false">${icon('menu')}</button>
      </div>
    </div>
    <nav class="mobile-nav" aria-label="Categories">${mobileLinks}</nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="logo" href="${base}"><span class="logo-mark">${icon('zap')}</span><span>BISCS <em>India</em></span></a>
        <p>${TOOLS.length} free tools for PDFs, money, text, images and code. Everything runs in your browser, so your files never leave your device.</p>
        <address class="footer-contact">
          <a href="mailto:${SITE.email}">${icon('mail')} ${SITE.email}</a>
          <span>${icon('map-pin')} ${esc(addressLine())}</span>
        </address>
      </div>
      ${footCols.map(([h, list]) => `<div><h2>${h}</h2><ul>${list.map((t) => `<li><a href="${base}tools/${t.id}/">${esc(t.name)}</a></li>`).join('')}</ul></div>`).join('')}
      <div><h2>Company</h2><ul>
        <li><a href="${base}about/">About</a></li>
        <li><a href="${base}contact/">Contact</a></li>
        <li><a href="${base}privacy/">Privacy Policy</a></li>
        <li><a href="${base}terms/">Terms of Use</a></li>
        <li><a href="https://www.domebox.in" target="_blank" rel="noopener">DomeBox ${icon('external-link')}</a></li>
      </ul></div>
    </div>
    <div class="footer-bottom"><span>© ${SITE.year} ${esc(SITE.name)}. All rights reserved.</span><span>Made in India 🇮🇳 · Files are processed locally in your browser</span></div>
  </div>
</footer>
<script src="${base}assets/js/registry.js?v=${SITE.version}" defer></script>
<script src="${base}assets/js/icons.js?v=${SITE.version}" defer></script>
<script src="${base}assets/js/core.js?v=${SITE.version}" defer></script>
${scripts}
</body>
</html>
`;
}

// -------------------------------------------------------------- home page
function buildHome() {
  const base = '';
  const popularIds = ['pdf-editor', 'merge-pdf', 'compress-pdf', 'gst-calculator', 'emi-calculator', 'income-tax-calculator', 'image-compressor', 'qr-code-generator'];
  const popular = popularIds.map((id) => TOOLS.find((t) => t.id === id));
  const pdfTop = ['pdf-editor', 'sign-pdf', 'merge-pdf', 'split-pdf', 'compress-pdf', 'organize-pdf', 'jpg-to-pdf', 'pdf-to-jpg'].map((id) => TOOLS.find((t) => t.id === id));

  const body = `
<section class="hero">
  <canvas class="hero-3d" aria-hidden="true"></canvas>
  <div class="hero-tiles" aria-hidden="true">${CATEGORIES.map((c, i) => `<span class="ht ht${i}" style="--c:${c.color}">${icon(c.icon)}</span>`).join('')}</div>
  <div class="container">
    <h1>Every tool you need, <span class="grad">in one place.</span></h1>
    <p class="lead">${TOOLS.length} free tools for PDFs, GST and tax, images, text and code. They're fast and private: your files are processed on your device and never uploaded.</p>
    <form class="hero-search" role="search" action="#all-tools">
      ${icon('search')}
      <input type="search" data-filter-input placeholder="Try “merge pdf”, “emi”, “compress image”…" aria-label="Search tools" autocomplete="off">
      <button class="btn btn-primary" type="submit">Search</button>
    </form>
    <div class="hero-stats">
      <span>${icon('zap')} ${TOOLS.length} free tools</span>
      <span>${icon('lock')} No uploads, 100% private</span>
      <span>${icon('smartphone')} Works on mobile</span>
      <span>${icon('gift')} No sign-up</span>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head reveal"><div><h2>Most popular</h2><p>The tools people use every day.</p></div></div>
    <div class="tool-grid reveal">${popular.map((t) => toolCard(t, base)).join('\n')}</div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="pdf-banner reveal">
      <div>
        <span class="badge" style="background:rgba(255,255,255,.2);color:#fff">${icon('sparkles')} PDF suite</span>
        <h2 style="margin-top:12px">Every PDF tool you need, free and private</h2>
        <p>Edit, sign, merge, split, compress and convert PDFs right in your browser. There are no watermarks, no file limits and no uploads.</p>
        <div class="btn-group">
          <a class="btn btn-lg" href="tools/pdf-editor/">${icon('file-pen-line')} Edit a PDF</a>
          <a class="btn btn-lg btn-ghost" href="category/pdf/">All ${toolsIn('pdf').length} PDF tools ${icon('arrow-right')}</a>
        </div>
      </div>
      <div class="pdf-stack" aria-hidden="true">
        <div class="pdf-sheet"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="pdf-sheet"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="pdf-sheet"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
    </div>
    <div class="tool-grid reveal" style="margin-top:16px">${pdfTop.map((t) => toolCard(t, base)).join('\n')}</div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="section-head reveal"><div><h2>Browse by category</h2><p>Seven toolkits, one place.</p></div></div>
    <div class="cat-grid reveal">
      ${CATEGORIES.map((c) => `<a class="cat-card" href="category/${c.id}/" style="--c:${c.color}">
        <span class="ci">${icon(c.icon)}</span><span class="count">${toolsIn(c.id).length} tools</span>
        <h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>${icon(c.icon, 'big-icon')}</a>`).join('\n')}
    </div>
  </div>
</section>

<section class="section" id="all-tools" style="padding-top:0">
  <div class="container">
    <div class="section-head"><div><h2>All ${TOOLS.length} tools</h2><p>Filter by category or search above.</p></div></div>
    <div class="cat-bar">
      <div class="chips" role="toolbar" aria-label="Filter by category">
        <button class="chip" type="button" data-cat-chip="all" aria-pressed="true">All</button>
        ${CATEGORIES.map((c) => `<button class="chip" type="button" data-cat-chip="${c.id}" aria-pressed="false"><span class="dot" style="background:${c.color}"></span>${esc(c.short)}</button>`).join('')}
      </div>
    </div>
    <div class="tool-grid" data-tool-grid style="margin-top:8px">${TOOLS.map((t) => toolCard(t, base)).join('\n')}</div>
    <p class="empty-state hidden" data-empty>No tools match your search. <button class="btn btn-sm" type="button" data-search-open>Open search</button></p>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="container">
    <div class="features reveal">
      <div class="feature"><span class="fi">${icon('lock')}</span><h3>Private by design</h3><p>Files are processed in your browser with modern web technology. Nothing is uploaded to a server.</p></div>
      <div class="feature"><span class="fi">${icon('zap')}</span><h3>Instant results</h3><p>No queues and no waiting for uploads. Calculations update as you type.</p></div>
      <div class="feature"><span class="fi">${icon('indian-rupee')}</span><h3>Built for India</h3><p>GST, income tax (new and old regime), lakh and crore formatting, UPI QR codes and more.</p></div>
      <div class="feature"><span class="fi">${icon('gift')}</span><h3>Free forever</h3><p>No sign-up, no watermarks and no daily limits.</p></div>
    </div>
  </div>
</section>`;

  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.url + '/',
    potentialAction: { '@type': 'SearchAction', target: SITE.url + '/?q={search_term_string}', 'query-input': 'required name=search_term_string' }
  }, {
    '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: SITE.url + '/',
    logo: SITE.url + '/assets/img/icon-512.png', email: SITE.email,
    address: {
      '@type': 'PostalAddress', addressLocality: SITE.address.locality, addressRegion: SITE.address.region,
      postalCode: SITE.address.postalCode, addressCountry: SITE.address.country
    },
    contactPoint: { '@type': 'ContactPoint', email: SITE.email, contactType: 'customer support', areaServed: 'IN', availableLanguage: ['English', 'Hindi', 'Bengali'] }
  }];
  write('index.html', layout({
    base, canonical: '/',
    title: `${SITE.name}: ${TOOLS.length} Free Online Tools (PDF, GST, EMI, Image & More)`,
    description: `${TOOLS.length} free online tools: edit, merge and compress PDFs, GST, EMI and income tax calculators, and image, text and developer tools. Private: files never leave your device.`,
    body, jsonld,
    scripts: `<script type="module" src="assets/js/hero3d.js?v=${SITE.version}"></script>`
  }));
}

// ----------------------------------------------------------- category page
function buildCategory(c) {
  const base = '../../';
  const list = toolsIn(c.id);
  const body = `
<section class="tool-hero">
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${base}">Home</a>${icon('chevron-right')}<span>${esc(c.name)}</span></nav>
    <div class="tool-title" style="--c:${c.color}">
      <span class="tool-icon">${icon(c.icon)}</span>
      <div><h1>${esc(c.name)}</h1><p>${esc(c.desc)}</p></div>
    </div>
  </div>
</section>
<section class="section" style="padding-top:20px">
  <div class="container">
    <h2 class="sr-only">All ${esc(c.name)}</h2>
    <div class="tool-grid">${list.map((t) => toolCard(t, base)).join('\n')}</div>
  </div>
</section>
<section class="section" style="padding-top:0">
  <div class="container">
    <h2>More free tools</h2>
    <div class="chips" style="margin-top:12px">${CATEGORIES.filter((o) => o.id !== c.id).map((o) => `<a class="chip" href="${base}category/${o.id}/"><span class="dot" style="background:${o.color}"></span>${esc(o.name)}</a>`).join('')}</div>
  </div>
</section>`;
  write(`category/${c.id}/index.html`, layout({
    base, active: c.id, canonical: `/category/${c.id}/`,
    title: `Free ${c.name} Online: ${list.length} Tools | ${SITE.name}`,
    description: `${c.desc} ${list.length} free tools including ${list.slice(0, 4).map((t) => t.name).join(', ')}.`,
    body,
    jsonld: [{
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
        { '@type': 'ListItem', position: 2, name: c.name, item: `${SITE.url}/category/${c.id}/` }
      ]
    }]
  }));
}

// --------------------------------------------------------------- tool page
const HOWTO = {
  pdf: (t) => [`Click <strong>Choose PDF</strong> or drag your file into the box.`, `Adjust the options for ${esc(t.name.toLowerCase())}.`, `Press the main button and your new PDF downloads instantly.`],
  image: (t) => [`Choose an image (JPG, PNG or WebP) or drop it in.`, `Adjust the settings and check the live preview.`, `Download the result. The image never leaves your device.`],
  default: (t) => [`Enter your values or paste your text into ${esc(t.name)}.`, `Results update instantly as you type.`, `Copy or download the result with one click.`]
};
const FAQ = (t, c) => [
  [`Is ${t.name} free?`, `Yes. ${t.name} is completely free with no sign-up, no watermarks and no usage limits.`],
  [`Are my files or data uploaded?`, `No. ${t.name} runs entirely in your web browser. Your ${c.id === 'pdf' || c.id === 'image' ? 'files are' : 'data is'} processed on your own device and never sent to our servers.`],
  [`Does it work on mobile?`, `Yes. ${SITE.name} works in any modern browser on Android, iPhone, Windows, Mac and Linux.`]
];

function buildTool(t) {
  const base = '../../';
  const c = cat(t.cat);
  const related = toolsIn(t.cat).filter((o) => o.id !== t.id).slice(0, 6);
  const others = ['pdf-editor', 'merge-pdf', 'gst-calculator', 'image-compressor', 'word-counter', 'qr-code-generator']
    .filter((id) => id !== t.id && !related.find((r) => r.id === id)).slice(0, 4).map((id) => TOOLS.find((x) => x.id === id));
  const steps = (HOWTO[t.cat] || HOWTO.default)(t);
  const faqs = FAQ(t, c);
  const wide = t.cat === 'pdf' || t.id === 'invoice-generator';

  const body = `
<section class="tool-hero">
  <div class="container">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${base}">Home</a>${icon('chevron-right')}<a href="${base}category/${c.id}/">${esc(c.name)}</a>${icon('chevron-right')}<span>${esc(t.name)}</span></nav>
    <div class="tool-title" style="--c:${c.color}">
      <span class="tool-icon">${icon(t.icon)}</span>
      <div><h1>${esc(t.name)}</h1><p>${esc(t.desc)}</p></div>
    </div>
    <span class="privacy-pill">${icon('lock')} Runs in your browser. Nothing is uploaded.</span>
  </div>
</section>
<div class="container">
  <div class="tool-layout${wide ? '' : ' has-aside'}">
    <div>
      <div class="ad-slot" data-ad="tool-top"></div>
      <h2 class="sr-only">${esc(t.name)} tool</h2>
      <div id="tool-root" data-tool="${t.id}"><div class="loading"><span class="spinner"></span> Loading ${esc(t.name)}…</div></div>
      <noscript><p class="notice warn">Please enable JavaScript to use this tool.</p></noscript>
    </div>
    ${wide ? '' : `<aside class="tool-aside">
      <div class="card"><h3>Related tools</h3><div class="mini-list">${related.map((r) => miniLink(r, base)).join('')}</div></div>
      <div class="ad-slot" data-ad="tool-side"></div>
      <div class="card promo"><h3>Manage your team with DomeBox</h3><p>A task management system built for Indian businesses.</p><a class="btn btn-sm" href="https://www.domebox.in" target="_blank" rel="noopener">Try DomeBox ${icon('external-link')}</a></div>
    </aside>`}
  </div>
</div>
<section class="howto">
  <div class="container">
    <div class="split">
      <div>
        <h2>How to use ${esc(t.name)}</h2>
        <ol>${steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      </div>
      <div class="faq">
        <h2>FAQ</h2>
        ${faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
      </div>
    </div>
    ${wide ? `<h2 style="margin-top:32px">More ${esc(c.name)}</h2><div class="tool-grid" style="margin-top:12px">${related.concat(others).slice(0, 8).map((r) => toolCard(r, base)).join('')}</div>` :
      `<h2 style="margin-top:32px">You might also like</h2><div class="tool-grid" style="margin-top:12px">${others.map((r) => toolCard(r, base)).join('')}</div>`}
  </div>
</section>`;

  const jsonld = [
    {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: t.name, description: t.desc,
      url: `${SITE.url}/tools/${t.id}/`, applicationCategory: c.id === 'dev' ? 'DeveloperApplication' : c.id === 'finance' ? 'FinanceApplication' : 'UtilitiesApplication',
      operatingSystem: 'Any', browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url + '/' },
        { '@type': 'ListItem', position: 2, name: c.name, item: `${SITE.url}/category/${c.id}/` },
        { '@type': 'ListItem', position: 3, name: t.name, item: `${SITE.url}/tools/${t.id}/` }
      ]
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
    }
  ];

  write(`tools/${t.id}/index.html`, layout({
    base, active: c.id, canonical: `/tools/${t.id}/`,
    title: `${t.name}: Free Online ${c.short === 'PDF' ? 'PDF Tool' : 'Tool'} | ${SITE.name}`,
    description: `${t.desc} Free, fast and private: works in your browser with no uploads or sign-up.`,
    body, jsonld,
    scripts: `<script src="${base}assets/js/tools/${fileFor(t)}.js?v=${SITE.version}" defer></script>`
  }));
}

// ------------------------------------------------------------ static pages
function buildPage(slug, title, description, html, opts = {}) {
  const base = '../'.repeat(slug.split('/').length);
  write(`${slug}/index.html`, layout({
    base, canonical: `/${slug}/`, title: `${title} | ${SITE.name}`, description,
    extraHead: opts.noindex ? '<meta name="robots" content="noindex">' : '',
    body: `<div class="container"><article class="prose${opts.wide ? ' wide' : ''}"><nav class="crumbs"><a href="${base}">Home</a>${icon('chevron-right')}<span>${esc(title)}</span></nav><h1>${esc(title)}</h1>${html}</article></div>`
  }));
}

function buildStaticPages() {
  const updated = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  buildPage('about', 'About Us', `About ${SITE.name}: free, private online tools for everyday work.`, `
<p>${SITE.name} builds simple, fast and private tools for everyday work. The site offers ${TOOLS.length} free tools covering PDFs, finance and tax, text, images and development, made with Indian users in mind.</p>
<h2>Why we built it</h2>
<p>Most online tools ask you to upload your documents to someone else’s server. Our tools run entirely in your web browser, so your PDFs, photos and data stay on your device.</p>
<h2>Our software</h2>
<p>We also make <a href="https://www.domebox.in" target="_blank" rel="noopener">DomeBox</a>, a team task management system for Indian businesses.</p>
<h2>Get in touch</h2>
<p>Have a suggestion for a new tool or found a bug? <a href="../contact/">Contact us</a>.</p>`);

  buildPage('contact', 'Contact Us', `Contact ${SITE.name} with feedback, tool requests or business enquiries.`, `
<p>We’d love to hear from you, whether it’s a bug report, a request for a new tool or a business enquiry.</p>
<div class="contact-layout">
  <form class="card contact-form" name="contact" method="POST" action="/contact/thanks/" data-netlify="true" netlify-honeypot="company-website" data-contact-form novalidate>
    <input type="hidden" name="form-name" value="contact">
    <p class="hp" aria-hidden="true"><label>Leave this empty <input name="company-website" tabindex="-1" autocomplete="off"></label></p>
    <h2 class="cf-title">Send us a message</h2>
    <div class="row cols-2">
      <div class="field"><label for="cf-name">Your name <span class="req" aria-hidden="true">*</span></label>
        <input type="text" id="cf-name" name="name" autocomplete="name" required maxlength="100"></div>
      <div class="field"><label for="cf-email">Email <span class="req" aria-hidden="true">*</span></label>
        <input type="email" id="cf-email" name="email" autocomplete="email" required maxlength="150"></div>
    </div>
    <div class="row cols-2">
      <div class="field"><label for="cf-phone">Phone <span class="muted small">(optional)</span></label>
        <input type="tel" id="cf-phone" name="phone" autocomplete="tel" inputmode="tel" maxlength="20"></div>
      <div class="field"><label for="cf-topic">Topic</label>
        <select id="cf-topic" name="topic">
          <option>General question</option>
          <option>Request a new tool</option>
          <option>Report a problem</option>
          <option>Business enquiry</option>
          <option>DomeBox</option>
          <option>Advertising</option>
        </select></div>
    </div>
    <div class="field"><label for="cf-message">Message <span class="req" aria-hidden="true">*</span></label>
      <textarea id="cf-message" name="message" required minlength="10" maxlength="5000" rows="6" placeholder="How can we help?"></textarea>
      <span class="hint" data-count>0 / 5000</span></div>
    <label class="check"><input type="checkbox" name="consent" value="yes" required><span>I agree that BISCS India may use these details to reply to me (see our <a href="../privacy/">Privacy Policy</a>).</span></label>
    <div class="cf-status" role="status" aria-live="polite"></div>
    <button class="btn btn-primary btn-lg" type="submit">${icon('mail')} Send message</button>
  </form>
  <div class="contact-side">
    <div class="card contact-card">
      <h2 class="cf-title">Contact details</h2>
      <p>${icon('mail')} <a href="mailto:${SITE.email}">${SITE.email}</a></p>
      <p>${icon('map-pin')} <span>${esc(addressLine())}</span></p>
    </div>
    <div class="card">
      <h2 class="cf-title">Response time</h2>
      <p class="muted" style="margin:0">We usually reply within two working days, Monday to Saturday.</p>
    </div>
  </div>
</div>`, { wide: true });

  buildPage('contact/thanks', 'Message sent', `Thank you for contacting ${SITE.name}.`, `
<div class="card contact-thanks">
  <span class="tool-icon" style="--c:#08786c">${icon('check')}</span>
  <div><h2 class="cf-title">Thank you, we’ve received your message.</h2>
  <p class="muted" style="margin:0">We usually reply within two working days. If it’s urgent, email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p></div>
</div>
<p style="margin-top:20px"><a class="btn" href="../../">${icon('arrow-left')} Back to all tools</a></p>`, { noindex: true });

  buildPage('privacy', 'Privacy Policy', `${SITE.name} privacy policy: our tools process your files locally in your browser.`, `
<p class="muted">Last updated: ${updated}</p>
<h2>Files and data you use with our tools</h2>
<p>All tools on ${SITE.name} run inside your web browser. Files you open (such as PDFs and images) and data you type are processed on your device and are <strong>not uploaded</strong> to our servers. When you close the page, that data is gone.</p>
<h2>Information we collect</h2>
<p>Like most websites, our hosting provider may log standard technical information such as IP address, browser type and pages visited, for security and performance. We may use privacy-respecting analytics to understand which tools are popular.</p>
<h2>Cookies and advertising</h2>
<p>We may show advertisements served by third parties such as Google AdSense. These vendors may use cookies to serve ads based on your prior visits to this and other websites. Google’s use of advertising cookies enables it and its partners to serve ads based on your visits. You can opt out of personalised advertising at <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener">Google Ads Settings</a>.</p>
<h2>Local storage</h2>
<p>We store small preferences, such as your light or dark theme choice, in your browser’s local storage. You can clear them at any time in your browser settings.</p>
<h2>Third-party services</h2>
<p>We load the Inter font from Google Fonts. All other libraries are hosted on our own domain.</p>
<h2>Contact form</h2>
<p>If you send us a message through our contact form, we receive your name, email address, optional phone number and message. The form is processed and stored by our hosting provider, Netlify, and is used only to reply to you. We do not sell or share these details, and we delete messages when they are no longer needed. To ask us to delete your message, email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>
<h2>Children</h2>
<p>Our services are not directed at children under 13 and we do not knowingly collect their personal information.</p>
<h2>Contact</h2>
<p>Questions about this policy? Email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>`);

  buildPage('terms', 'Terms of Use', `${SITE.name} terms of use.`, `
<p class="muted">Last updated: ${updated}</p>
<p>By using ${SITE.name} you agree to these terms.</p>
<h2>Use of the tools</h2>
<p>The tools are provided free of charge for personal and commercial use. Do not use them for unlawful purposes or to process content you do not have the right to use.</p>
<h2>No professional advice</h2>
<p>Calculators (including tax, GST, loan and investment calculators) give estimates for general information only. They are not financial, tax or legal advice. Rules and rates change, so please verify important figures with a qualified professional or the official source.</p>
<h2>No warranty</h2>
<p>The tools are provided “as is”, without warranty of any kind. Always keep a copy of your original files. We are not liable for any loss arising from use of the site.</p>
<h2>Changes</h2>
<p>We may update these terms from time to time. Continued use of the site means you accept the updated terms.</p>
<h2>Contact</h2>
<p>Email <a href="mailto:${SITE.email}">${SITE.email}</a>.</p>`);

  write('404.html', layout({
    base: '/', canonical: '/404.html', title: `Page not found | ${SITE.name}`, description: 'Page not found.',
    body: `<div class="container"><div class="prose" style="text-align:center;margin:0 auto"><h1>Page not found</h1><p>The page you’re looking for doesn’t exist. Try searching our ${TOOLS.length} free tools.</p><p><button class="btn btn-primary" data-search-open type="button">${icon('search')} Search tools</button> <a class="btn" href="/">Go home</a></p></div></div>`
  }));
}

function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/', ...CATEGORIES.map((c) => `/category/${c.id}/`), ...TOOLS.map((t) => `/tools/${t.id}/`), '/about/', '/contact/', '/privacy/', '/terms/'];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE.url}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
}

// -------------------------------------------------------------------- run
buildHome();
CATEGORIES.forEach(buildCategory);
TOOLS.forEach(buildTool);
buildStaticPages();
buildSitemap();

const missing = [...new Set(TOOLS.map(fileFor))].filter((f) => !fs.existsSync(path.join(ROOT, `assets/js/tools/${f}.js`)));
console.log(`Built ${TOOLS.length} tool pages, ${CATEGORIES.length} category pages.`);
if (missing.length) console.warn('Missing implementation files:', missing.join(', '));
