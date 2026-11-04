{
  "tool": "entity-schema-builder",
  "slug": "organization-author-schema-entity-seo",
  "title": "Entity SEO: Organization and Author Schema With sameAs",
  "description": "Build connected Organization, WebSite and Person JSON-LD with sameAs profiles, so search engines and AI tools know who you are. Includes an E-E-A-T checklist.",
  "keywords": ["organization schema generator", "author schema markup", "entity seo", "sameas schema", "person schema json-ld"],
  "summary": "Entity SEO means helping search engines and AI systems recognise your business and authors as distinct, real entities, using consistent details and structured data. BISCS India’s free Entity & Author Schema Builder creates linked Organization, WebSite and Person JSON-LD with sameAs profiles, stable @id references and expertise fields, in your browser.",
  "faq": [
    { "q": "What does sameAs mean in schema markup?", "a": "sameAs lists URLs of other pages that represent the same entity, such as your official LinkedIn, Facebook or Instagram profile, or a reputable reference page about you. It helps search engines connect those profiles to your website. List only official profiles you control or that genuinely describe you." },
    { "q": "Will Organization schema get me a knowledge panel?", "a": "Not by itself. Knowledge panels are generated automatically when Google has enough consistent, trusted information about an entity. Organization markup helps by stating your official name, logo, website and profiles clearly, but there is no markup that guarantees a panel." },
    { "q": "Where should I add Organization and author schema?", "a": "Add the Organization and WebSite markup to your home page, and optionally your About page. Author or Person markup belongs on the author’s profile page. Articles can then reference the same author and publisher using their @id URLs instead of repeating every detail." },
    { "q": "Is author schema the same as E-E-A-T?", "a": "No. E-E-A-T, which stands for experience, expertise, authoritativeness and trustworthiness, is a concept from Google’s quality rater guidelines, not a markup type. Author schema simply describes who wrote the content. Real author pages, credentials and accurate content are what demonstrate E-E-A-T." },
    { "q": "Is my business information uploaded when I use the builder?", "a": "No. The form is processed in your browser and the JSON-LD is generated on your device. Nothing is sent to a server. You copy or download the code and add it to your own site." }
  ]
}
---
Entity SEO is about making sure search engines and AI systems understand **who** is behind a website: which organisation runs it, who writes its content, and which social profiles and listings belong to them. When those facts are consistent and clearly stated, it is easier for Google, Bing and AI assistants to connect your site with your brand and trust it as a source.

The [Entity & Author Schema Builder](/tools/entity-schema-builder/) from BISCS India creates the structured data for this: a linked set of Organization, WebSite and Person JSON-LD, with sameAs profiles and stable @id references that other pages can point to.

## What is an entity, and why does it matter?

To a search engine, an entity is a distinct thing it can recognise: a company, a person, a place, a product. "BISCS India, an IT company in Kolkata" is an entity; the words "biscs india" on a page are just text until the search engine links them to that thing.

Entities matter more as search becomes answer-driven. When an AI assistant names a recommended accountant or quotes a guide, it needs confidence about who the source is. Consistent names, addresses, logos and profiles across the web, plus clear structured data on your own site, give it that confidence.

## What the builder generates

The output is a single JSON-LD block using an `@graph` with up to three connected items:

| Item | Key properties | Purpose |
|---|---|---|
| Organization | Type, official name, other names, URL, logo, description, founding date, email, phone, address, contact point, sameAs, knowsAbout | States who you are and links your official profiles |
| WebSite | URL, name, publisher | Ties the website to the organisation |
| Person (optional) | Name, job title, works for, author page URL, photo, sameAs, alumniOf, knowsAbout | Describes an author or founder and their expertise |

Each item gets a stable `@id`, such as `https://www.example.com/#organization` and `https://www.example.com/#founder`. Articles elsewhere on your site can then reference the same publisher and author by `@id`, rather than repeating the details.

The organisation type can be Organization, LocalBusiness, ProfessionalService, Corporation, EducationalOrganization or NGO. For a detailed local business listing with opening hours and map coordinates, the [Schema Markup Generator](/tools/schema-markup-generator/) has a dedicated Local Business form.

## How to build your entity schema

1. Open the [Entity & Author Schema Builder](/tools/entity-schema-builder/).
2. Under **Organisation**, choose the type and enter your **official name** exactly as it appears on your registration, signboard and Google Business Profile. Add **other names** such as abbreviations.
3. Enter your **website URL** (it must be a full `https://` address) and a **logo URL** for a square logo at least 112 px wide.
4. Add a short **description**, the **founding date**, **email**, **phone with country code** (for example +91), and your **city, state, PIN code and country code**.
5. List your **official profiles** in sameAs, one URL per line: LinkedIn company page, Facebook page, Instagram, YouTube channel and similar.
6. Add **topics you are known for**, such as "GST compliance, payroll, company registration".
7. Under **Author (person)**, keep "Include an author / founder" ticked if you want a Person entry. Add the name, job title, author page URL, photo, profiles, where they studied and their expertise.
8. Read the warnings, then press **Copy** or **Download** and add the code to your home page, and optionally your About page.
9. Test the page with Google's Rich Results Test or the Schema.org validator.

Everything is generated in your browser; no details are sent anywhere.

## Getting sameAs right

sameAs is the heart of entity markup, and it is easy to misuse:

- **Do** list official profiles you control: LinkedIn, Facebook, Instagram, X, YouTube.
- **Do** include reputable reference pages that are genuinely about you, such as a Wikipedia article if one exists.
- **Do not** list directory pages, review sites or other people's pages just to add links.
- **Do not** include profiles you have abandoned with outdated information. Update them first.
- **Use the same name, logo and description** on every profile as on your site.

## Author pages and E-E-A-T

Google's quality rater guidelines describe E-E-A-T: experience, expertise, authoritativeness and trustworthiness. Schema does not create E-E-A-T, but it helps describe evidence that already exists.

A strong setup looks like this:

- A real **About page** describing the business, its team and how to contact it.
- An **author page** for each regular writer, with a photo, role, relevant qualifications (for example a chartered accountant writing about tax) and links to their profiles.
- Articles with a visible **byline** linking to that author page, and, for finance, health or legal topics, a "reviewed by" credit where appropriate.
- Person markup on the author page that matches all of the above.

## Common entity SEO mistakes

- **Inconsistent names**: "Sharma & Sons", "Sharma and Sons Pvt Ltd" and "Sharma Sons Traders" across different platforms.
- **Old addresses or phone numbers** on listings after a move.
- **Fake authors** or stock photos presented as experts. This undermines trust badly if discovered.
- **Several conflicting Organization blocks** from different plugins. Check your HTML with the [On-Page SEO Checker](/tools/on-page-seo-checker/).
- **Changing @id URLs** later, which breaks references from other pages.

## Bringing it together

Entity markup works best alongside good content and consistent listings. Once your organisation and authors are described clearly, check that your articles are structured to be quoted using the [GEO Content Analyzer](/tools/geo-content-analyzer/). Revisit the [Entity & Author Schema Builder](/tools/entity-schema-builder/) whenever your logo, address, team or profiles change.
