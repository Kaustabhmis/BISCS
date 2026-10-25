/**
 * Google Sheet ⇄ website content mapping.
 *
 * One schema drives both directions:
 *   - scripts/sheet/make-template.mjs builds the .xlsx template from it
 *   - scripts/sheet/convert.mjs turns the live sheet into src/content/*.json
 *
 * Two kinds of tabs:
 *   - SETTINGS tabs: one row per setting (Key | Setting | Value | Help).
 *     The Key column is how the website finds a value — don't edit it.
 *   - LIST tabs: one row per item, in display order. "Show" = No hides a row.
 *
 * Value types:
 *   text        plain text
 *   lines       one item per line (Alt+Enter / Ctrl+Enter for a new line in a cell)
 *   paragraphs  paragraphs separated by an empty line
 *   bool        Yes / No
 *   number/int  a number
 *   color       a hex colour like #F2B33D
 *   image       an image URL (Google Drive share link, any https URL, or a site path like /logo.webp)
 *   steps       one step per line, written "Title: description"
 *   links       one link per line, written "Label | https://…"
 */

const ICONS = ['id', 'camera', 'monitor', 'pin', 'search', 'star', 'message', 'megaphone', 'target', 'sparkles', 'calendar', 'user', 'whatsapp', 'users', 'share', 'pen', 'chart', 'layers', 'compass', 'zap', 'globe']
const SOCIAL_ICONS = ['linkedin', 'instagram', 'facebook', 'x', 'youtube', 'link']

/** [key, label, file, path, type, help] */
const kv = (key, label, file, path, type = 'text', help = '') => ({ key, label, file, path, type, help })

export const settingsTabs = [
  {
    tab: 'Company',
    description: 'Company details, contact information, footer and launch settings.',
    rows: [
      kv('company.name', 'Company full name', 'company', 'brand.name'),
      kv('company.short_name', 'Short name', 'company', 'brand.shortName'),
      kv('company.wordmark_suffix', 'Small text after the name', 'company', 'brand.wordmarkSuffix'),
      kv('company.tagline', 'Tagline / philosophy', 'company', 'brand.tagline'),
      kv('company.logo', 'Logo image', 'company', 'brand.logo.src', 'image', 'Wide logo on a transparent background. Google Drive link (shared “Anyone with the link”) or https URL.'),
      kv('company.logo_width', 'Logo width (pixels)', 'company', 'brand.logo.width', 'int', 'Optional. Helps the page load without jumping.'),
      kv('company.logo_height', 'Logo height (pixels)', 'company', 'brand.logo.height', 'int'),
      kv('contact.email', 'Email', 'company', 'contact.email', 'text', 'Leave empty to hide.'),
      kv('contact.phone', 'Phone (as shown)', 'company', 'contact.phone', 'text', 'e.g. +91 79808 71878. Leave empty to hide.'),
      kv('contact.whatsapp', 'WhatsApp number', 'company', 'contact.whatsapp', 'text', 'Country code + number, digits only, e.g. 917980871878. Empty hides WhatsApp buttons.'),
      kv('contact.whatsapp_message', 'WhatsApp greeting message', 'company', 'contact.whatsappMessage'),
      kv('contact.address', 'Office address', 'company', 'contact.address'),
      kv('contact.hours', 'Business hours', 'company', 'contact.hours'),
      kv('contact.map_url', 'Map link', 'company', 'contact.mapUrl'),
      kv('footer.blurb', 'Footer introduction', 'company', 'footer.blurb'),
      kv('launch.hide_placeholders', 'Hide placeholder content', 'company', 'launch.hidePlaceholderContent', 'bool', 'Set to Yes before going live: removes every row marked Placeholder = Yes.'),
    ],
  },
  {
    tab: 'Home',
    description: 'Text on the home page.',
    rows: [
      kv('hero.eyebrow', 'Hero — small text above headline', 'home', 'hero.eyebrow'),
      kv('hero.headline', 'Hero — headline', 'home', 'hero.headline'),
      kv('hero.gold_words', 'Hero — gold words', 'home', 'hero.headlineEmphasis', 'text', 'Must appear exactly inside the headline.'),
      kv('hero.subheadline', 'Hero — subheadline', 'home', 'hero.subheadline'),
      kv('hero.button1_text', 'Hero — main button text', 'home', 'hero.primaryCta.label'),
      kv('hero.button1_link', 'Hero — main button link', 'home', 'hero.primaryCta.href'),
      kv('hero.button2_text', 'Hero — second button text', 'home', 'hero.secondaryCta.label'),
      kv('hero.button2_link', 'Hero — second button link', 'home', 'hero.secondaryCta.href'),
      kv('hero.featured_label', 'Featured service — small label', 'home', 'hero.featuredService.label'),
      kv('hero.featured_title', 'Featured service — title', 'home', 'hero.featuredService.title'),
      kv('hero.featured_summary', 'Featured service — summary', 'home', 'hero.featuredService.summary'),
      kv('hero.featured_link', 'Featured service — link', 'home', 'hero.featuredService.href'),
      kv('hero.3d_labels', 'Labels orbiting the 3D scene', 'home', 'hero.channels', 'lines', 'One per line, 3–8 labels.'),
      kv('hero.scene_description', '3D scene description (screen readers)', 'home', 'hero.sceneDescription'),
      kv('intro.label', '“Who we are” — label', 'home', 'intro.label'),
      kv('intro.heading', '“Who we are” — heading', 'home', 'intro.heading'),
      kv('intro.statement', '“Who we are” — main statement', 'home', 'intro.statement'),
      kv('intro.philosophy', '“Who we are” — quote', 'home', 'intro.philosophy'),
      kv('intro.button_text', '“Who we are” — button text', 'home', 'intro.cta.label'),
      kv('intro.button_link', '“Who we are” — button link', 'home', 'intro.cta.href'),
      kv('clients.label', 'Clients section — label', 'home', 'brandsSection.label'),
      kv('clients.heading', 'Clients section — heading', 'home', 'brandsSection.heading'),
      kv('testimonials.label', 'Testimonials section — label', 'home', 'testimonialsSection.label'),
      kv('testimonials.heading', 'Testimonials section — heading', 'home', 'testimonialsSection.heading'),
      kv('testimonials.button_text', 'Testimonials — “share” button text', 'home', 'testimonialsSection.shareCta.label'),
      kv('testimonials.button_link', 'Testimonials — “share” button link', 'home', 'testimonialsSection.shareCta.href'),
      kv('cta.eyebrow', 'Closing banner — small text', 'home', 'closingCta.eyebrow', 'text', 'The banner at the end of every page.'),
      kv('cta.heading', 'Closing banner — heading', 'home', 'closingCta.heading'),
      kv('cta.text', 'Closing banner — text', 'home', 'closingCta.text'),
      kv('cta.button1_text', 'Closing banner — main button text', 'home', 'closingCta.primary.label'),
      kv('cta.button1_link', 'Closing banner — main button link', 'home', 'closingCta.primary.href'),
      kv('cta.button2_text', 'Closing banner — second button text', 'home', 'closingCta.secondary.label'),
      kv('cta.button2_link', 'Closing banner — second button link', 'home', 'closingCta.secondary.href'),
    ],
  },
  {
    tab: 'Pages',
    description: 'Text on the About, Services, Contact, Feedback and legal pages.',
    rows: [
      kv('about.label', 'About — label', 'about', 'label'),
      kv('about.heading', 'About — heading', 'about', 'heading'),
      kv('about.intro', 'About — company introduction', 'about', 'intro', 'paragraphs', 'Separate paragraphs with an empty line.'),
      kv('about.mission', 'About — mission', 'about', 'mission'),
      kv('about.vision', 'About — vision', 'about', 'vision'),
      kv('services_page.label', 'Services page — label', 'pages', 'servicesPage.label'),
      kv('services_page.heading', 'Services page — heading', 'pages', 'servicesPage.heading'),
      kv('services_page.intro', 'Services page — introduction', 'pages', 'servicesPage.intro'),
      kv('contact_page.label', 'Contact page — label', 'pages', 'contactPage.label'),
      kv('contact_page.heading', 'Contact page — heading', 'pages', 'contactPage.heading'),
      kv('contact_page.intro', 'Contact page — introduction', 'pages', 'contactPage.intro'),
      kv('contact_form.button_text', 'Contact form — button text', 'pages', 'contactForm.submitLabel'),
      kv('contact_form.success_title', 'Contact form — success heading', 'pages', 'contactForm.successTitle'),
      kv('contact_form.success_text', 'Contact form — success message', 'pages', 'contactForm.successText'),
      kv('contact_form.error_text', 'Contact form — error message', 'pages', 'contactForm.errorText'),
      kv('contact_form.budget_options', 'Contact form — budget options', 'pages', 'contactForm.budgetOptions', 'lines', 'One option per line.'),
      kv('feedback_page.label', 'Feedback page — label', 'pages', 'feedbackPage.label'),
      kv('feedback_page.heading', 'Feedback page — heading', 'pages', 'feedbackPage.heading'),
      kv('feedback_page.intro', 'Feedback page — introduction', 'pages', 'feedbackPage.intro'),
      kv('feedback_page.notes', 'Feedback page — side notes', 'pages', 'feedbackPage.notes', 'lines', 'One note per line.'),
      kv('feedback_form.button_text', 'Feedback form — button text', 'pages', 'feedbackForm.submitLabel'),
      kv('feedback_form.success_title', 'Feedback form — success heading', 'pages', 'feedbackForm.successTitle'),
      kv('feedback_form.success_text', 'Feedback form — success message', 'pages', 'feedbackForm.successText'),
      kv('feedback_form.error_text', 'Feedback form — error message', 'pages', 'feedbackForm.errorText'),
      kv('privacy.title', 'Privacy policy — title', 'pages', 'legal.privacy.title'),
      kv('privacy.text', 'Privacy policy — text', 'pages', 'legal.privacy.body', 'paragraphs', 'Leave empty until you have a real policy (the page then says “awaiting content”).'),
      kv('terms.title', 'Terms — title', 'pages', 'legal.terms.title'),
      kv('terms.text', 'Terms — text', 'pages', 'legal.terms.body', 'paragraphs'),
    ],
  },
  {
    tab: 'SEO',
    description: 'Search engine and social sharing settings.',
    rows: [
      kv('seo.site_url', 'Website address', 'seo', 'siteUrl', 'text', 'e.g. https://kunnectds.in — no trailing slash.'),
      kv('seo.locale', 'Locale', 'seo', 'locale'),
      kv('seo.share_image', 'Social share image (1200×630)', 'seo', 'ogImage', 'image'),
      kv('seo.twitter', 'X / Twitter handle', 'seo', 'twitterHandle'),
      kv('seo.structured_data', 'Structured data for Google', 'seo', 'structuredData', 'bool'),
      kv('seo.home_title', 'Home — title', 'seo', 'pages.home.title', 'text', 'Titles: under 60 characters.'),
      kv('seo.home_description', 'Home — description', 'seo', 'pages.home.description', 'text', 'Descriptions: 120–160 characters.'),
      kv('seo.services_title', 'Services — title', 'seo', 'pages.services.title'),
      kv('seo.services_description', 'Services — description', 'seo', 'pages.services.description'),
      kv('seo.about_title', 'About — title', 'seo', 'pages.about.title'),
      kv('seo.about_description', 'About — description', 'seo', 'pages.about.description'),
      kv('seo.contact_title', 'Contact — title', 'seo', 'pages.contact.title'),
      kv('seo.contact_description', 'Contact — description', 'seo', 'pages.contact.description'),
      kv('seo.feedback_title', 'Feedback — title', 'seo', 'pages.feedback.title'),
      kv('seo.feedback_description', 'Feedback — description', 'seo', 'pages.feedback.description'),
      kv('seo.not_found_title', 'Page not found — title', 'seo', 'pages.notFound.title'),
      kv('seo.not_found_description', 'Page not found — description', 'seo', 'pages.notFound.description'),
    ],
  },
  {
    tab: 'Colours',
    description: 'Brand colours used across the site and the 3D scene (hex codes like #F2B33D).',
    rows: [
      kv('colour.background', 'Background (dark)', 'theme', 'ink', 'color'),
      kv('colour.surface', 'Raised dark surface', 'theme', 'inkRaised', 'color'),
      kv('colour.light', 'Light background / text on dark', 'theme', 'paper', 'color'),
      kv('colour.light_deep', 'Light surface (deeper)', 'theme', 'paperDeep', 'color'),
      kv('colour.muted_on_dark', 'Muted text on dark', 'theme', 'ash', 'color'),
      kv('colour.muted_on_light', 'Muted text on light', 'theme', 'stone', 'color'),
      kv('colour.gold', 'Gold accent', 'theme', 'accent', 'color'),
      kv('colour.gold_text', 'Accent text on light backgrounds', 'theme', 'accentInk', 'color', 'Must stay dark enough to read on the light background.'),
      kv('colour.highlight', 'Highlight', 'theme', 'signal', 'color'),
      kv('colour.gold_light', 'Gold — light shine', 'theme', 'goldLight', 'color'),
      kv('colour.gold_deep', 'Gold — deep shade', 'theme', 'goldDeep', 'color'),
    ],
  },
]

/** column helper: [header, field, type, options] */
const col = (header, field, type = 'text', extra = {}) => ({ header, field, type, ...extra })

export const listTabs = [
  {
    tab: 'Testimonials',
    file: 'testimonials',
    path: 'items',
    description: 'Customer feedback cards on the home page. Only add genuine reviews the customer agreed to publish.',
    columns: [
      col('Quote', 'quote', 'text', { required: true, width: 60 }),
      col('Name', 'name', 'text', { required: true }),
      col('Role', 'role'),
      col('Company', 'company'),
      col('Rating (1-5)', 'rating', 'int', { options: ['5', '4', '3', '2', '1'], help: 'Only if the customer gave one' }),
      col('Project', 'project'),
      col('Photo', 'portrait.src', 'image'),
      col('Company logo', 'logo.src', 'image'),
      col('Placeholder', 'placeholder', 'bool'),
    ],
  },
  {
    tab: 'Team',
    file: 'team',
    path: 'items',
    description: 'Team members on the About page. Hide or delete all rows to hide the section.',
    columns: [
      col('Name', 'name', 'text', { required: true }),
      col('Role', 'role', 'text', { required: true }),
      col('Bio', 'bio', 'text', { width: 50 }),
      col('Photo', 'portrait.src', 'image', { help: 'Portrait, ideally 4:5' }),
      col('Links', 'links', 'links', { width: 40, help: 'One per line: Label | https://…' }),
      col('Placeholder', 'placeholder', 'bool'),
    ],
  },
  {
    tab: 'Clients',
    file: 'brands',
    path: 'items',
    description: 'Clients, partners and platforms in the logo strip. Only list brands you really work with and may show.',
    columns: [
      col('Name', 'name', 'text', { required: true }),
      col('Logo', 'logo', 'image', { help: 'SVG or transparent PNG/WebP. Empty shows a name badge.' }),
      col('Type', 'relationship', 'choice', { options: ['Client', 'Partner', 'Platform'], default: 'client' }),
      col('Website', 'href'),
      col('Placeholder', 'placeholder', 'bool'),
    ],
  },
  {
    tab: 'Services',
    file: 'services',
    path: 'items',
    description: 'Every service gets its own page. Categories appear in the order they first appear here.',
    columns: [
      col('Title', 'title', 'text', { required: true, width: 28 }),
      col('Slug', 'slug', 'text', { help: 'Page address, e.g. google-meta-ads. Empty = made from the title.' }),
      col('Short name', 'shortTitle'),
      col('Category', 'category', 'text', { required: true }),
      col('Icon', 'icon', 'choice', { options: ICONS, keepCase: true }),
      col('Intro', 'intro', 'text', { width: 50 }),
      col('Description', 'description', 'paragraphs', { width: 60 }),
      col('Benefits', 'benefits', 'lines', { width: 45 }),
      col('Deliverables', 'deliverables', 'lines', { width: 35 }),
      col('Steps', 'process', 'steps', { width: 50, help: 'One per line: Title: description' }),
      col('Image', 'image.src', 'image'),
      col('Image description', 'image.alt'),
      col('Case study title', 'caseStudy.title'),
      col('Case study summary', 'caseStudy.summary'),
      col('Case study link', 'caseStudy.href'),
      col('Button text', 'cta.label'),
      col('Button link', 'cta.href'),
      col('Placeholder', 'placeholder', 'bool'),
    ],
  },
  {
    tab: 'Highlights',
    file: 'home',
    path: 'intro.differentiators',
    description: '“What makes us different” in the Who we are section on the home page.',
    columns: [col('Title', 'title', 'text', { required: true }), col('Text', 'text', 'text', { width: 60 })],
  },
  {
    tab: 'Stats',
    file: 'home',
    path: 'intro.stats',
    description: 'Numbers in the Who we are section. Only rows with Verified = Yes are shown — never publish unverified numbers.',
    columns: [
      col('Number', 'value', 'text', { required: true }),
      col('Label', 'label', 'text', { required: true }),
      col('Verified', 'verified', 'bool', { always: true }),
      col('Placeholder', 'placeholder', 'bool'),
    ],
  },
  {
    tab: 'Values',
    file: 'about',
    path: 'values',
    description: 'Company values on the About page.',
    columns: [col('Title', 'title', 'text', { required: true }), col('Text', 'text', 'text', { width: 60 })],
  },
  {
    tab: 'How We Work',
    file: 'about',
    path: 'methodology',
    description: 'Process steps on the About page.',
    columns: [col('Title', 'title', 'text', { required: true }), col('Text', 'text', 'text', { width: 60 })],
  },
  {
    tab: 'Milestones',
    file: 'about',
    path: 'milestones',
    description: 'Company history on the About page.',
    columns: [
      col('Year', 'year', 'text', { required: true }),
      col('Title', 'title', 'text', { required: true }),
      col('Text', 'text', 'text', { width: 60 }),
      col('Placeholder', 'placeholder', 'bool'),
    ],
  },
  {
    tab: 'Achievements',
    file: 'about',
    path: 'achievements',
    description: 'Awards and achievements on the About page. Only Verified = Yes rows are shown.',
    columns: [
      col('Title', 'title', 'text', { required: true }),
      col('Detail', 'detail', 'text', { width: 60 }),
      col('Verified', 'verified', 'bool', { always: true }),
      col('Placeholder', 'placeholder', 'bool'),
    ],
  },
  {
    tab: 'Contact Steps',
    file: 'pages',
    path: 'contactPage.nextSteps',
    description: '“What happens next” on the Contact page.',
    columns: [col('Title', 'title', 'text', { required: true }), col('Text', 'text', 'text', { width: 60 })],
  },
  {
    tab: 'Social Links',
    file: 'company',
    path: 'socials',
    description: 'Social media links. Rows without a link are hidden on the site.',
    columns: [
      col('Name', 'label', 'text', { required: true }),
      col('Icon', 'icon', 'choice', { options: SOCIAL_ICONS, keepCase: true }),
      col('Link', 'href', 'text', { default: '' }),
    ],
  },
]

/** Every content file the sheet produces. */
export const contentFiles = ['company', 'home', 'about', 'team', 'testimonials', 'brands', 'services', 'pages', 'seo', 'theme']
