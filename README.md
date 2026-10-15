# BISCS India: Free Online Tools

A fast, private website with **100 free everyday tools**, including a full PDF suite (edit, sign, merge, split, compress, convert…), GST and income-tax calculators, and image, text and developer tools.

Everything runs **in the browser**. Files and data are never uploaded.

## Highlights

- **PDF editor** (Sejda-style): edit existing text, add text, images, signatures, shapes, highlights, whiteout and freehand drawing. Changes are drawn into the original PDF as vector content.
- **19 PDF tools** with an iLovePDF-style flow: drop a file, see page thumbnails, set options, download.
- **India-first calculators**: GST, EMI, SIP, FD/RD/PPF, income tax (new vs old regime, FY 2025-26), HRA and gratuity.
- **Interactive 3D home page** (Three.js), 3D tilt cards, animated page transitions, instant search (`Ctrl K` or `/`), and dark mode.
- SEO-ready: one pre-rendered page per tool, category pages, JSON-LD, `sitemap.xml`, and Open Graph tags.

## Project layout

```
index.html, tools/<id>/, category/<id>/, about/ …   generated pages (committed)
assets/css/site.css                                  design system
assets/js/registry.js                                list of all tools and categories (source of truth)
assets/js/core.js                                    shared helpers (window.BT) and site behaviour
assets/js/hero3d.js                                  3D hero (Three.js)
assets/js/tools/*.js                                 tool implementations, one file per category
assets/vendor/                                       pdf-lib, pdf.js, JSZip, Three.js… (self-hosted)
scripts/build.mjs                                    page generator
scripts/smoke.mjs                                    headless smoke test of every tool page
netlify.toml                                         Netlify config (headers, redirect)
```

## Deploying on Netlify

The generated HTML is committed, so no build step is needed. Choose either option.

**Option A: drag and drop (quickest)**
1. Unzip `biscs-netlify.zip`.
2. Open https://app.netlify.com/drop and drag the unzipped folder onto the page.

**Option B: connect this GitHub repository (automatic redeploys)**
1. In Netlify, choose **Add new site → Import an existing project** and pick this repository and branch.
2. Leave the build command empty and set the publish directory to `.`. Both are already set in `netlify.toml`.

**Then, for either option:**
- Add `www.biscsindia.com` under **Domain management**. `_redirects` sends `biscsindia.com` to `www`.
- `_headers` adds security headers and caching.

## Adding or changing a tool

1. Add an entry to `assets/js/registry.js` (id, name, category, icon, description).
2. Implement it in `assets/js/tools/<category>.js` with `BT.impl('<id>', function (root, ctx) { … })`.
3. Run `node scripts/build.mjs` to regenerate the pages and sitemap.
4. Optionally test it: start `npx http-server -p 8080 -s .`, then run `node scripts/smoke.mjs <id>`.

## Before going live

- Set your real contact email in `scripts/build.mjs` (`SITE.email`), then rebuild.
- To show ads, place your AdSense code in the `.ad-slot` elements. They stay hidden while empty.
