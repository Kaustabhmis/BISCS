# Kunnect Digital and Softwares — website

Marketing website for **Kunnect Digital and Softwares** (kunnectds.in), built with
React, TypeScript, Vite, Tailwind CSS, Three.js (React Three Fiber + Drei) and
GSAP. Designed for Netlify hosting.

> The file `index` (no extension) in the repository root is an older,
> unrelated single-file page ("BISCS India — Software & Tools"). It is kept
> untouched and is not part of this build.

---

## Quick start

Requires Node.js 22+ (Node 20.19+ also works).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm run lint       # ESLint
npm run test       # unit tests (form validation)
npm run typecheck  # TypeScript only
```

The contact form only submits successfully on Netlify (see below). Locally it
correctly shows its error state.

---

## Creative concept — “The Growth Engine”

The 3D hero is a working model of what the agency does: **channel nodes** (SEO,
Ads, Social, Branding, Reviews, Web, Automation) travel on three tilted orbits.
Each node is a gold diamond, taken from the circuit nodes in the Kunnect logo,
and sends a stream of light into a faceted glass **core**: many channels
converging into one connected strategy. Underneath, a **radial bar chart rises
around the circle**: growth, measured. As the visitor scrolls, the structure
lifts and tilts away into the company introduction.

- **Type:** Inter Tight (display/body), Instrument Serif italic (accent words), JetBrains Mono (labels). Self-hosted, with no third-party font requests.
- **Colour:** near-black ink, warm paper, and logo gold as the single accent. Dark and light sections alternate for rhythm.
- **Motion:** one cinematic entrance on the hero, then restrained scroll reveals. Nothing loops except the 3D scene and the logo marquee, and both can be paused or are disabled for reduced motion.

---

## Project structure

```
src/
  config/
    site.ts            ← ALL business content, colours, fonts, SEO, form fields
    navigation.ts      ← menu items, navbar CTA, sitemap routes
  data/
    services.ts        ← services (grouped by category)
    brands.ts          ← client / partner logos for the carousel
    testimonials.ts    ← client testimonials
  types/content.ts     ← TypeScript interfaces for all content
  components/
    layout/            ← Navbar, MobileMenu, Footer, Logo, Layout
    hero/              ← HeroSection, HeroScene (three.js), HeroFallback (SVG)
    home/              ← CompanyIntro, BrandCarousel, Testimonials
    services/          ← ServiceDetail, ServiceCard, ServiceVisual
    contact/           ← ContactForm
    ui/                ← Button, Reveal, PageHeader, CtaBand, Icon, badges…
    Seo.tsx            ← per-page title / description / canonical / OG tags
  pages/               ← Home, Services, ServiceDetail, About, Contact, Legal, NotFound
  lib/                 ← validation, Netlify form submit, GSAP setup, WebGL detection
  hooks/               ← media query / reduced motion / in-view
  styles/index.css     ← Tailwind v4 theme tokens + type scale
scripts/vite-site-plugin.ts  ← build-time: theme CSS, <head> tags, Netlify form, sitemap, robots
public/                ← logo, favicons, og-image, _redirects
netlify.toml
```

Routes: `/`, `/services`, `/services/:slug` (one per service), `/about`,
`/contact`, `/privacy`, `/terms`, and a branded 404 for anything else.

---

## Editing content

Everything lives in **`src/config/site.ts`** and **`src/data/*.ts`**. Components
never hardcode business information.

### Placeholder content

Anything marked `placeholder: true` (or commented `PLACEHOLDER` / `DRAFT`) is
temporary. Placeholder items show a visible **“Placeholder”** badge on the site.

Before launch, set:

```ts
// src/config/site.ts
launch: { hidePlaceholderContent: true }
```

This removes every placeholder item, and sections left empty (brand carousel,
testimonials, team, milestones) disappear automatically.

**Still placeholder / needs your input:**

| Content | Where | Status |
| --- | --- | --- |
| Email, phone, address, hours | `site.contact` | Empty → hidden. Add real details. |
| Social links | `site.socials` | Empty `href` → hidden. |
| Client / partner logos | `src/data/brands.ts` | 8 neutral placeholder slots. |
| Testimonials | `src/data/testimonials.ts` | 3 clearly labelled placeholders. |
| Team | `site.about.team` | 4 placeholder profiles. |
| Milestones | `site.about.milestones` | 3 placeholders. |
| Company statistics | `site.intro.stats` | Hidden until `verified: true` with a real value. |
| Service descriptions | `src/data/services.ts` | Names are yours. Descriptions are drafted copy: please review. |
| “How we work” and “What happens next” | `site.about.methodology`, `site.contactPage.nextSteps` | Drafted copy: please confirm. |
| Budget ranges | `site.contactForm.fields` → `budget` | Placeholder ₹ bands. |
| Privacy policy / Terms | `site.legal` | Empty: pages show “awaiting content” and are `noindex`. |

Supplied content already in use: company name, logo, philosophy (“Building
Connections, Delivering Growth”), company introduction, mission, vision,
values (Innovation, Integration, Trends), and the 13 services in two groups.

### Logo, favicon, colours, fonts

- **Logo:** `public/logo.webp` (navbar/footer), set by `site.brand.logo` with its width and height. The original PNG is kept in `src/assets/`.
- **Favicons:** `public/favicon.png`, `public/apple-touch-icon.png` (generated from the head mark).
- **Social share image:** `public/og-image.jpg` (1200×630).
- **Colours:** `site.colors`. `accent` is the logo gold. `accentInk` is a darker gold used for text on light backgrounds and must keep ≥ 4.5:1 contrast. The 3D scene reads the same values.
- **Fonts:** change the `@fontsource` imports in `src/main.tsx` and the stacks in `site.typography`.

### Services

Add an object to `src/data/services.ts`. It automatically appears on
`/services`, gets its own `/services/<slug>` page, and is added to the footer,
the contact form “Service of interest” options and `sitemap.xml`. Each service’s
CTA links to `/contact?service=<slug>`, which pre-selects it in the form.
Optional fields: `image`, `caseStudy`, `cta`.

### Brands

Add logo files to `public/brands/` and entries such as
`{ name: 'Acme', logo: '/brands/acme.svg', width: 120, height: 32, relationship: 'client' }`.
SVG, PNG and WebP work, and logos are scaled to a consistent height without distortion.
Only list brands with a confirmed relationship and permission.

### Testimonials

Add `{ quote, name, role, company, portrait?, logo?, project? }` to
`src/data/testimonials.ts`. Use genuine, approved quotes only.

### Hero

`site.hero`: eyebrow, headline (`headlineEmphasis` is set in gold italic),
subheadline, both CTAs, the featured-service card, and `channels` (the labels
orbiting the 3D core; 3–8 works best).

---

## Contact form (Netlify Forms)

The form submits to **Netlify Forms**; no server code or secrets are needed.

How it works:

1. At build time, `scripts/vite-site-plugin.ts` writes a hidden static
   `<form name="contact" data-netlify="true">` into `dist/index.html`, with
   every field name from `site.contactForm.fields`. Netlify detects it during deploy.
2. The React form POSTs URL-encoded data (`form-name=contact&…`) to `/`.
3. Success is shown **only** after Netlify responds with 2xx; any other
   response shows an error message, so submissions are never silently dropped.
4. Spam protection: a honeypot field (`bot-field`) plus Netlify’s built-in
   spam filtering. Client-side validation covers required fields, email and
   phone format, select options and max lengths. Netlify Forms has no custom
   server-side validation; if you need it, add a Netlify Function (e.g.
   `netlify/functions/contact.ts`) and point `site.contactForm.endpoint` to it.

**To activate after the first deploy:**

1. Netlify → *Site configuration → Forms* → **Enable form detection**, then redeploy.
2. Check that a form named **contact** appears under *Forms*.
3. Under *Forms → Form notifications*, add an **email notification** to the address that should receive enquiries.
4. Send a test enquiry from the live site and confirm it arrives in *Forms → contact* and by email.
5. Optional: enable reCAPTCHA by adding `data-netlify-recaptcha="true"` and a `<div data-netlify-recaptcha="true" />` to the form.

If you rename a field in `site.contactForm.fields`, redeploy so Netlify picks up the new definition.

---

## Deploying to Netlify

Configuration is in `netlify.toml`:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 22 (`NODE_VERSION` in `netlify.toml`) |

`public/_redirects` contains `/* /index.html 200`, so direct visits and
refreshes on `/services`, `/about`, `/contact` and other routes work. Real files
(`sitemap.xml`, `robots.txt`, images) are served as-is.

### Connect GitHub → Netlify

1. Netlify → **Add new site → Import an existing project → GitHub**, and choose this repository.
2. Netlify reads `netlify.toml`; confirm build command `npm run build` and publish directory `dist`.
3. Set the **production branch** (e.g. `main`) under *Site configuration → Build & deploy → Branches*.
4. Deploy. Every pull request gets a **Deploy Preview** URL automatically.
   Previews and branch deploys emit a `robots.txt` that blocks indexing (via
   Netlify’s `CONTEXT` variable); production allows indexing.
5. Add the custom domain **kunnectds.in** under *Domain management* and enable HTTPS.
6. Complete the Forms steps above.

### Environment variables

See `.env.example`. Only one, and it is optional:

- `VITE_SITE_URL`: canonical origin (defaults to `https://kunnectds.in`). Set it in Netlify under *Site configuration → Environment variables* if the domain changes.

Anything prefixed `VITE_` is embedded in the public JavaScript bundle. **Never
put secrets in `VITE_` variables.** No secrets are required by this site.

### Troubleshooting

- **404 on refresh:** make sure `dist/_redirects` exists after build (it is copied from `public/`).
- **Form not listed in Netlify:** enable form detection, then trigger a new deploy.
- **Form shows an error on the live site:** check *Forms* for the `contact` form; field names must match the deployed HTML.
- **Wrong canonical / OG URLs:** set `VITE_SITE_URL` or `site.seo.siteUrl`.
- **Build fails on Node version:** use Node 22 (`NODE_VERSION` in `netlify.toml`).

---

## Accessibility, motion and performance

- Semantic landmarks, skip link, logical headings, visible focus, labelled controls and form errors announced to screen readers.
- Mobile menu: focus trap, Escape to close, focus returned to the toggle, page scroll locked.
- Logo marquee pauses on hover/focus and has a pause button; testimonials never auto-advance.
- `prefers-reduced-motion`: entrance and scroll animations are off, the marquee is a static scrollable row, and the 3D scene renders a single still frame.
- **No WebGL:** an SVG illustration of the same composition is shown instead.
- three.js is code-split and loaded only after the page becomes idle. The SVG illustration shows until the scene is ready, so the layout never shifts.
- The 3D scene stops rendering when the hero is off-screen, and runs at reduced quality and 30 fps on mobile and low-power devices. It lowers its pixel ratio if frame rate drops, and disposes geometries and textures on unmount.
- SEO: unique titles and descriptions, canonical URLs, Open Graph/Twitter tags (static defaults in the HTML for crawlers), `sitemap.xml`, `robots.txt`, a `noindex` 404 page. Organization structured data is off until contact details are real (`site.seo.structuredData`).

### Known limitations

- This is a client-rendered single-page app. Google renders JavaScript, but
  some other crawlers only see the default tags in `index.html`. Prerendering
  can be added later if needed.
- three.js 0.186 logs a `THREE.Clock` deprecation warning from inside React
  Three Fiber; it is harmless and will go away with a future R3F release.
