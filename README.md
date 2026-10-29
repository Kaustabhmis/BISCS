# Kunnect Digital and Softwares — website

Marketing website for **Kunnect Digital and Softwares** (kunnectds.in), built with
React, TypeScript, Vite, Tailwind CSS, Three.js (React Three Fiber, Drei,
post-processing) and GSAP. Every page is pre-rendered to static HTML for SEO
and hosted on Netlify.

> The file `index` (no extension) in the repository root is an older,
> unrelated single-file page ("BISCS India — Software & Tools"). It is kept
> untouched and is not part of this build.

---

## Quick start

Requires Node.js 22+ (Node 20.19+ also works).

```bash
npm install
npm run dev          # http://localhost:5173 (client-rendered, for development)
npm run build        # type-check, build, and pre-render every page into dist/
npm run build:client # build without pre-rendering (faster, for quick checks)
npm run preview      # serve dist/ at http://localhost:4173
npm run lint         # ESLint
npm run test         # unit tests (form validation)
```

The forms only submit successfully on Netlify (see below). Locally they
correctly show their error state.

---

## Creative concept — “The Growth Engine”

The 3D hero is a working model of what Kunnect does:

- **Channel nodes** (SEO, Ads, Social, Branding, Reviews, Web, Automation) are
  gold diamonds, taken from the circuit nodes in the Kunnect logo. They orbit a
  **refractive glass core** and stream light into it: many channels, one
  connected strategy.
- A **geodesic network of diamonds** surrounds the core, with signals firing
  across it: connection.
- Thousands of **particles spiral upward**, and a **radial bar chart rises**
  beneath the core: growth.
- Cinematic finish: bloom glow, subtle lens fringing, a vignette, a camera that
  flies in on load, and a warm light that follows the mouse across the metal.
- **Scroll journey:** the 3D stage stays pinned behind the hero and the “Who we
  are” section. As visitors scroll, the engine bursts open into a constellation
  behind the company introduction.

**Palette:** obsidian black, ivory, and a metallic champagne-to-amber gold
taken from the logo (`site.colors`). The gold is used as a gradient on buttons
and emphasis words.
**Type:** Inter Tight, Instrument Serif italic and JetBrains Mono, all self-hosted.

---

## Project structure

```
src/
  config/
    site.ts            ← assembles content + technical settings (fonts, form fields)
    navigation.ts      ← menu items, navbar CTA, static routes
    routes.ts          ← pages to pre-render / include in the sitemap
  content/*.json       ← content snapshot, refreshed from the Google Sheet on each build
  data/                ← typed loaders for services, brands, testimonials
  types/content.ts     ← TypeScript interfaces for all content
  components/
    layout/            ← Navbar, MobileMenu, Footer, Logo, Layout
    hero/              ← HeroSection, HeroScene (three.js), HeroFallback (SVG)
    home/              ← HomeExperience (sticky 3D stage), CompanyIntro, BrandCarousel, Testimonials
    services/          ← ServiceDetail, ServiceCard, ServiceVisual
    contact/           ← NetlifyForm (shared), ContactForm, WhatsAppButton
    ui/                ← Button, Reveal, PageHeader, CtaBand, Icon, badges…
    Seo.tsx, OrganizationSchema.tsx  ← head tags and JSON-LD structured data
  pages/               ← Home, Services, ServiceDetail, About, Contact, Feedback, Legal, NotFound
  AppRoutes.tsx        ← route table shared by the browser and the pre-renderer
  entry-server.tsx     ← build-time renderer
scripts/
  vite-site-plugin.ts  ← theme CSS, default <head> tags, Netlify form definitions, sitemap, robots
  prerender.mjs        ← writes static HTML for every route + 404.html + _redirects
  sheet/               ← Google Sheet schema, importer (pull.mjs), template builder
src/admin/             ← admin panel UI (admin.html)
src/lib/liveContent.ts ← loads the live content from the Google Sheet in the browser
cms/model.mjs          ← sheet rows ⇄ admin forms
public/site-config.js  ← the Google Sheet (Apps Script /exec) URL
google-sheets/         ← sheet template (.xlsx), Apps Script (Code.gs), setup guide
public/                ← logo, favicons, og-image, _headers
netlify.toml
```

Routes: `/`, `/services`, `/services/:slug` (one per service), `/about`,
`/contact`, `/feedback`, `/privacy`, `/terms`, and a branded 404.

---

## Admin panel (kunnectds.in/admin.html) + Google Sheet database

All content lives in **one Google Sheet**. Editors use the **admin panel at
`/admin.html`**: log in with a username and password, edit, click **Save**.
The panel saves straight into the sheet through its Apps Script
(`google-sheets/Code.gs`), and the website reads the sheet in the browser on
every visit, so changes appear within about a minute. No builds, no
server, no GitHub needed for editing.

| Admin section | What you edit |
| --- | --- |
| **Testimonials**, **Team**, **Clients & collaborators**, **Services** | Add, edit, reorder, hide or delete items, with image uploads (stored in Google Drive) |
| **Home page**, **About page**, **Pages & forms** | All page text, highlights, stats, values, process, milestones, form messages, legal pages |
| **Company & contact**, **Colours**, **SEO** | Contact details, WhatsApp, social links, footer, launch switch, brand colours, titles and descriptions |
| **Users**, **My account** | People who can log in; change your password |

**Setup:** paste `google-sheets/Code.gs` into the sheet's Apps Script, deploy it
as a web app, put its `/exec` URL in `site-config.js` (or Netlify snippet
injection), and upload the site. Step by step:
**[google-sheets/README.md](google-sheets/README.md)**.

### How it's built

- `scripts/sheet/schema.mjs` maps every sheet tab, row and column to the content. The admin forms are generated from it.
- `scripts/sheet/convert.mjs` turns sheet rows into website content (and checks it, e.g. rejects unsafe links). The website uses it in the browser (`src/lib/liveContent.ts`) and the admin uses it to check before saving.
- `cms/model.mjs` converts between sheet rows and the admin forms.
- `google-sheets/Code.gs` is the backend: public read-only content, admin logins (salted, iterated password hashes; signed 8-hour sessions; lockout after 5 wrong attempts), saving with conflict protection, image uploads to Drive, and users.
- `scripts/sheet/pull.mjs` (optional) runs first in `npm run build` when `CONTENT_SHEET_URL`
  is set, so the pre-built pages contain the latest sheet content. It writes `src/content/*.json` and downloads images to `public/uploads/sheet/`.
- `scripts/sheet/make-template.mjs` (`npm run sheet:template`) regenerates the
  template from `src/content`.
- Without `CONTENT_SHEET_URL`, builds use the JSON already in `src/content`
  (the last snapshot), so local builds work offline. To refresh the snapshot
  locally, run `CONTENT_SHEET_URL=… npm run content:pull`.

### Placeholder content

Rows marked **Placeholder = Yes** show a visible “Placeholder” badge. Before
launch, set **Company → Hide placeholder content = Yes** to remove them all.
Sections left empty (logo strip, team, milestones) disappear.

**Still needs your input:**

| Content | Sheet tab | Status |
| --- | --- | --- |
| Email, address, hours | Company | Empty → hidden. |
| Social links | Social Links | Empty links → hidden. |
| Client / partner logos | Clients | Placeholder slots. |
| Testimonials | Testimonials | 3 labelled placeholders. Add approved feedback from `/feedback`. |
| Team, milestones | Team, Milestones | Placeholders. |
| Service descriptions | Services | Drafted copy: please review. |
| “How we work”, “What happens next” | How We Work, Contact Steps | Drafted copy: please confirm. |
| Budget ranges | Pages → Contact form budget options | Placeholder ₹ bands. |
| Privacy policy / Terms | Pages | Empty: pages say “awaiting content” and are `noindex`. |

**Supplied and in use:** company name, logo, phone **+91 79808 71878**,
WhatsApp, philosophy, introduction, mission, vision, values and the 13 services.

### Things that stay in code

Fonts (`src/main.tsx` and `site.typography`), form field definitions
(`src/config/site.ts`), favicons (`public/`), and the layout and 3D scene
itself. The original logo PNG is kept in `src/assets/`.

---

## Testimonials and customer feedback

The home page shows testimonials as swipeable **feedback cards** (ratings are
shown only when a customer gave one).

Customers can submit their own feedback at **`/feedback`**. The page is linked
from the testimonials section and the footer. Submissions are **not published
automatically**, which prevents spam and fake reviews:

1. A submission arrives in Netlify under **Forms → feedback**, with name, email (never published), role, business, service, rating, feedback, and whether they agreed to publication.
2. Check it is genuine and that the customer agreed to publication.
3. Add a row to the **Testimonials** tab of the Google Sheet and choose **Website → Publish changes**.

---

## Forms (Netlify Forms)

Two forms, **contact** and **feedback**. Their fields are defined in `site.ts`; their messages are edited in the sheet. At build
time a hidden static copy of each is written into the HTML so Netlify detects
them. The visible forms validate input, block double submissions, include a
honeypot spam trap, and show success **only** after Netlify confirms receipt.

**After the first deploy:**

1. Netlify → *Site configuration → Forms* → **Enable form detection**, then redeploy.
2. Confirm **contact** and **feedback** appear under *Forms*.
3. Add **email notifications** for each form (*Forms → Form notifications*).
4. Send a test enquiry and a test review from the live site.

---

## SEO

- **Pre-rendered HTML:** `npm run build` renders every page (21 including the
  404) to static HTML with its full content, so search engines and social
  previews never depend on JavaScript. The browser then hydrates the page.
- Unique title, meta description, canonical URL, Open Graph and Twitter tags per page.
- **Structured data (JSON-LD):** Organization and WebSite on the home page
  (name, logo, phone; social links once added); Service and BreadcrumbList on
  every service page. Only real values are used.
- `sitemap.xml` (legal pages are left out until they have content) and `robots.txt`.
  Deploy previews are automatically set to `Disallow` so they aren't indexed.
- Unknown URLs return the branded 404 page with a **real 404 status**
  (`dist/_redirects`), and it is `noindex`.
- One H1 per page, logical heading order, alt text on images, fast static pages.

**After launch:** add the site to Google Search Console, submit
`https://kunnectds.in/sitemap.xml`, and create a Google Business Profile with
the same name, phone and website.

---

## Deploying to Netlify

### Drag and drop (recommended)

1. Use the ready-made zip (or run `npm run build` and use the `dist` folder).
2. Put your Apps Script `/exec` URL in `site-config.js` (or use Netlify
   snippet injection; see [google-sheets/README.md](google-sheets/README.md)).
3. **app.netlify.com → Add new site → Deploy manually** → drop the folder.
   The folder must contain `index.html` at its top level.
4. Add the domain **kunnectds.in** under *Domain management*.
5. Enable **Forms → form detection**, re-upload once, and add email notifications.

Content edits never need a new upload: they go through the admin panel and the
Google Sheet. Only code or design changes need a new zip.

### Connecting the code repository (optional)

You can also connect this repository in Netlify (*Add new site → Import an
existing project*). `netlify.toml` sets the build command `npm run build`,
publish directory `dist` and Node 22. `dist/_redirects` (real 404s) and
`public/_headers` (caching and security headers) work either way.

### Optional build setting

- `CONTENT_SHEET_URL` (build-time only): when set, `npm run build` copies the
  current sheet content into the pre-built pages first, so search engines and
  social previews see the latest text without JavaScript.
- `VITE_SITE_URL`: canonical origin. Defaults to the website address in the SEO tab.

### Troubleshooting

- **A form doesn't appear in Netlify:** enable form detection, then upload again.
- **Wrong canonical / OG URLs:** fix the website address in the SEO section of the admin.
- **Admin or live content problems:** see *If something goes wrong* in [google-sheets/README.md](google-sheets/README.md).
- **Build fails (only when building yourself):** use Node 22 and run `npm ci` before `npm run build`.

---

## Accessibility, motion and performance

- Semantic landmarks, skip link, one H1 per page, visible focus, labelled form fields with announced errors.
- Mobile menu: focus trap, Escape to close, focus returned to the menu button.
- Logo marquee has a pause button; testimonial cards never auto-advance.
- With **reduced motion** turned on, animations are off and the 3D renders a single still frame.
- **No WebGL:** an SVG illustration of the same composition is shown instead.
- three.js loads only after the page is idle. It pauses when off-screen. On
  phones and low-power devices it runs at 30 fps without post-processing and
  with fewer particles, and it lowers quality automatically if the frame rate drops.

### Known limitations

- three.js 0.186 logs a harmless `THREE.Clock` deprecation warning from inside React Three Fiber.
- Lighthouse in a GPU-less environment reports high blocking time on the home
  page, because WebGL is software-rendered there. Measure real numbers with
  PageSpeed Insights on the live site.
