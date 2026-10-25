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
  content/*.json       ← ALL editable content (edited via /admin)
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
public/                ← logo, favicons, og-image, _headers, admin/ (Decap CMS), uploads/
netlify.toml
```

Routes: `/`, `/services`, `/services/:slug` (one per service), `/about`,
`/contact`, `/feedback`, `/privacy`, `/terms`, and a branded 404.

---

## Admin panel (edit content without code)

Open **https://kunnectds.in/admin/** to edit everything on the site:

| Section | What you can edit |
| --- | --- |
| **Testimonials** | Add, edit, reorder or remove reviews (quote, name, role, company, rating, photo, logo) |
| **Team** | Team members with photos, bios and links |
| **Clients & collaborators** | Logos in the home page strip: upload logos, mark each as client, partner or platform |
| **Services** | All services and categories, including adding new services (each gets its own page) |
| **Home page** | Hero headline, gold words, buttons, featured service, 3D labels, “Who we are”, statistics, section headings, closing call to action |
| **About page** | Introduction, mission, vision, values, how we work, milestones, achievements |
| **Other pages & forms** | Services/Contact/Feedback page text, form messages, budget options, privacy policy and terms |
| **Company & contact** | Name, logo, tagline, email, phone, WhatsApp, address, hours, social links, footer text, and the **launch switch** |
| **Brand colours** | Every site colour (also used by the 3D scene) |
| **SEO** | Website address, share image, page titles and descriptions, structured data |

**How it works:** the admin panel is [Decap CMS](https://decapcms.org). When
you click **Publish**, your change is saved to `src/content/*.json` in the
GitHub repository, and Netlify rebuilds and publishes the site automatically
in about 1–2 minutes. Uploaded images go to `public/uploads/`. No database is
needed, and every page stays pre-rendered for SEO.

### One-time setup (about 10 minutes)

The admin panel needs the site to be deployed **from GitHub** (Option B
below), because it saves changes to the repository. Drag-and-drop deploys can't
receive admin edits.

1. **Merge this work into `main`.** The admin panel saves to the `main`
   branch (`public/admin/config.yml` → `backend.branch`), and Netlify should
   deploy from `main`.
2. **Create a GitHub OAuth app:** GitHub → *Settings → Developer settings →
   OAuth Apps → New OAuth App*.
   - Homepage URL: `https://kunnectds.in`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Copy the **Client ID**, then generate and copy a **Client secret**.
3. **Connect it in Netlify:** *Site configuration → Access & security → OAuth →
   Install provider → GitHub*, then paste the Client ID and secret.
4. Open **https://kunnectds.in/admin/** and click **Login with GitHub**.

**Who can log in:** anyone with *write* access to the GitHub repository
`Kaustabhmis/BISCS`. To give a colleague access, invite them under GitHub →
repository *Settings → Collaborators*. To remove access, remove them there.

### Approving customer reviews

1. Read new reviews in Netlify → *Forms → feedback*.
2. If the customer ticked “I agree … may be published”, open **Admin →
   Testimonials → Add testimonial** and copy in their quote, name, role,
   company and rating.
3. Click **Publish**. The card appears on the home page after the rebuild.

### Editing on your own computer

```bash
npm run dev            # terminal 1
npx decap-server       # terminal 2
# open http://localhost:5173/admin/index.html: changes are written to src/content/ directly
```

---

## Editing content in code

The admin panel edits the JSON files in **`src/content/`**. You can also edit
them directly. `src/config/site.ts` assembles them and holds the technical
settings (fonts, form fields).

### Placeholder content

Items marked as placeholders show a visible **“Placeholder”** badge. Before
launch, turn on **Admin → Company & contact → Launch settings → Hide
placeholder content** to remove them all. Sections left empty (brand carousel, team, milestones) disappear.

**Still needs your input:**

| Content | Where | Status |
| --- | --- | --- |
| Email, address, hours | Admin → Company & contact | Empty → hidden. |
| Social links | Admin → Company & contact | Empty links → hidden. |
| Client / partner logos | Admin → Clients & collaborators | Placeholder slots. |
| Testimonials | Admin → Testimonials | 3 labelled placeholders. Add approved feedback from `/feedback`. |
| Team, milestones | Admin → Team / About page | Placeholders. |
| Service descriptions | Admin → Services | Drafted copy: please review. |
| “How we work”, “What happens next” | `site.about.methodology`, `site.contactPage.nextSteps` | Drafted copy: please confirm. |
| Budget ranges | `site.contactForm` → `budget` | Placeholder ₹ bands. |
| Privacy policy / Terms | `site.legal` | Empty: pages say “awaiting content” and are `noindex`. |

**Supplied and in use:** company name, logo, phone **+91 79808 71878**,
WhatsApp, philosophy, introduction, mission, vision, values and the 13 services.

### Phone and WhatsApp

`site.contact.phone` is shown on the Contact page and in the footer, with a
**Call** button. `site.contact.whatsapp` (digits only, with country code) powers
the **Chat on WhatsApp** buttons, which open a chat pre-filled with
`site.contact.whatsappMessage`. Clear `whatsapp` to hide the buttons.

### Logo, colours, fonts

- **Logo:** `public/logo.webp`, set in `site.brand.logo`. The original PNG is kept in `src/assets/`.
- **Icons:** `public/favicon.png`, `public/apple-touch-icon.png`. **Share image:** `public/og-image.jpg` (1200×630).
- **Colours:** `site.colors` (`accent`, `goldLight` and `goldDeep` form the metallic gold). The 3D scene uses the same values.
- **Fonts:** the `@fontsource` imports in `src/main.tsx` plus `site.typography`.

### Services, brands

Add a service object to `src/data/services.ts`. It gets its own page,
structured data, a sitemap entry, a footer link and a contact-form option.
Add brand logos to `public/brands/` and list them in `src/data/brands.ts`
(confirmed relationships only).

---

## Testimonials and customer feedback

The home page shows testimonials as swipeable **feedback cards** (ratings are
shown only when a customer gave one).

Customers can submit their own feedback at **`/feedback`**. The page is linked
from the testimonials section and the footer. Submissions are **not published
automatically**, which prevents spam and fake reviews:

1. A submission arrives in Netlify under **Forms → feedback**, with name, email (never published), role, business, service, rating, feedback, and whether they agreed to publication.
2. Check it is genuine and that the customer agreed to publication.
3. Add it in **Admin → Testimonials** (see “Approving customer reviews” above).

---

## Forms (Netlify Forms)

Two forms, **contact** and **feedback**, both defined in `site.ts`. At build
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

### Option A — drag and drop (no Git needed)

1. Run `npm run build`, or use the ready-made zip of `dist/`.
2. Go to **app.netlify.com → Add new site → Deploy manually** and drop the
   `dist` folder (or the unzipped contents of the zip). The folder must
   contain `index.html` at its top level.
3. Add the domain **kunnectds.in** under *Domain management*.
4. Complete the Forms steps above.

To update the site later, rebuild and drop the new `dist` folder onto
*Deploys* for the same site.

### Option B — connect GitHub (automatic deploys)

1. Netlify → **Add new site → Import an existing project → GitHub**, then choose this repository.
2. Netlify reads `netlify.toml`: build command `npm run build`, publish directory `dist`, Node 22.
3. Choose the production branch. Every pull request gets a Deploy Preview.
4. Add the domain and complete the Forms steps.

`dist/_redirects` (generated) handles real 404s; `public/_headers` sets caching
and security headers. Both work for either deploy option.

### Environment variables

Optional: `VITE_SITE_URL` (canonical origin, defaults to `https://kunnectds.in`).
Variables starting with `VITE_` are public; never put secrets in them. The site
needs no secrets.

### Troubleshooting

- **A form doesn't appear in Netlify:** enable form detection, then redeploy.
- **Wrong canonical / OG URLs:** set `VITE_SITE_URL` or `site.seo.siteUrl`.
- **Build fails:** use Node 22 and run `npm ci` before `npm run build`.

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
