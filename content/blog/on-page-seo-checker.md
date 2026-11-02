{
  "tool": "on-page-seo-checker",
  "slug": "on-page-seo-checker-audit-html",
  "title": "On-Page SEO Checker: Audit Any Page From Its HTML",
  "description": "Paste a page’s HTML to check the title, meta description, headings, alt text, canonical, links and schema. Get a score and a prioritised list of fixes.",
  "keywords": ["on page seo checker", "seo audit tool free", "check page seo", "heading structure checker", "missing alt text checker"],
  "summary": "An on-page SEO checker reviews the HTML of a single page for the basics search engines rely on: title, meta description, headings, image alt text, canonical tag, robots settings, links and structured data. BISCS India’s free On-Page SEO Checker scores the page out of 100 and lists each issue with a plain-English fix, without uploading anything.",
  "faq": [
    { "q": "How do I get the HTML of my page?", "a": "Open the page in a desktop browser, right-click and choose View page source, then select all and copy. Paste it into the checker. You can also save the page as an HTML file and upload it. The tool never fetches websites itself." },
    { "q": "What is a good on-page SEO score?", "a": "In this tool, 80 or above means the basics are in good shape, 50–79 means some important items need work, and below 50 means several fundamentals are missing. The score is a checklist summary, not a prediction of rankings, which depend on many other factors." },
    { "q": "Why does the checker say my content is thin?", "a": "It counts the visible words on the page. Pages with under about 300 words of useful text are flagged because they often struggle to rank. That is fine for contact pages or tools, but service and article pages usually need more helpful detail." },
    { "q": "Does a skipped heading level hurt SEO?", "a": "Jumping from H2 to H4 will not cause a penalty, but a logical heading outline helps screen reader users and makes the page structure clearer to search engines. The checker lists skipped levels so you can tidy them up easily." },
    { "q": "Can this tool check page speed or backlinks?", "a": "No. It analyses the HTML you paste, so it covers on-page elements only. For speed, use Google’s PageSpeed Insights, and for indexing and links pointing to your site, use Google Search Console." }
  ]
}
---
On-page SEO covers everything on the page itself that helps search engines understand it and helps people choose it: the title, description, headings, content, images, links and a few technical tags. An on-page SEO checker reviews those elements and tells you what is missing or misconfigured.

The [On-Page SEO Checker](/tools/on-page-seo-checker/) from BISCS India works from the page's HTML. You paste the source, optionally add a focus keyword and the page URL, and it returns a score out of 100, a list of checks marked pass, warn or fail, and the page's heading outline.

## What does the checker look at?

The checks are grouped so you can work through them in order:

| Group | Checks |
|---|---|
| Basics | Title tag present and its length, multiple titles, meta description and its length |
| Content | H1, heading hierarchy, word count |
| Keyword (optional) | Focus keyword in title, H1, meta description, first paragraph, URL slug, and its density |
| Technical | Canonical URL, robots meta (noindex/nofollow), language attribute, mobile viewport, character set, favicon, hreflang, duplicate IDs, inline styles |
| Social | Open Graph tags, X (Twitter) card |
| Structured data | JSON-LD blocks found, their types, and any that fail to parse |
| Images | Alt text on images |
| Links | Internal and external links, nofollow/sponsored links, links without text |

Each check carries a weight. A missing title or an accidental noindex costs far more than a missing favicon, so the score reflects what actually matters.

## How to run an on-page SEO check

1. Open your page in a desktop browser, right-click and choose **View page source**. Select everything and copy it.
2. Open the [On-Page SEO Checker](/tools/on-page-seo-checker/) and paste into the **Page HTML** box, or upload a saved `.html` file.
3. Enter a **Focus keyword** if the page targets a particular search, such as `gst calculator` or `wedding photographer kolkata`.
4. Enter the **Page URL**. This lets the tool separate internal from external links and check whether the slug contains the keyword.
5. Read the **score** and verdict at the top.
6. Switch the checks list to **Issues only** and start with anything marked **Fail**.
7. Look at the **Heading outline**. Skipped levels are highlighted in red.
8. Fix the issues in your CMS or code, copy the new source, and run the check again.

Pasted HTML is parsed as an inert document inside your browser. Its scripts never run, and nothing is sent to a server, so you can check staging pages and client work safely.

## Which problems should you fix first?

Not all warnings are equal. A practical order:

1. **Accidental noindex.** If the robots meta says noindex, the page cannot appear in Google at all. This is the most damaging and most common launch mistake.
2. **Missing or duplicate title.** Every page needs one unique, descriptive title.
3. **No mobile viewport.** Without it, phones render the desktop layout, which hurts both visitors and mobile-first indexing.
4. **Missing meta description and canonical.** Both are quick fixes with real benefits.
5. **Images without alt text.** Important for accessibility and image search.
6. **Thin content.** Pages with very little text, other than tools and contact pages, rarely rank well.
7. **Heading structure, Open Graph tags and structured data.** Polish that improves understanding and presentation.

## Understanding a few checks that confuse people

**Canonical points to a different URL.** That is correct for duplicate pages, such as a product reachable through two categories. On a normal page, though, the canonical should point to itself. A template that points every page to the home page is a serious error.

**Language attribute.** `<html lang="en-IN">` tells browsers and assistive technology which language the page is in. It is a small fix that helps accessibility and language targeting.

**Links without text.** Icon-only links, such as a WhatsApp or phone icon with no label, give search engines and screen readers no clue where they lead. Add an `aria-label` or visually hidden text.

**Duplicate IDs.** Two elements with the same `id` can break form labels, in-page anchors and scripts. It is not a direct ranking issue, but it is a quality issue worth fixing.

## Common on-page SEO mistakes on small business sites

- Every page titled with just the company name.
- The H1 is the logo image, so the page has no real heading text.
- Service pages with two sentences and a contact form.
- Photos named `IMG_2034.jpg` with no alt text.
- Old Open Graph tags copied from a template, so every WhatsApp share shows the wrong page.
- JSON-LD pasted with a missing comma, so search engines ignore it. The checker reports blocks that fail to parse.

## Tips for using the checker well

Check the **rendered** HTML if your site builds pages with JavaScript. View source shows the original HTML; for JavaScript-heavy sites, copy the HTML from your browser's developer tools (the Elements panel) after the page has loaded.

Run the checker on your most important pages first: home page, top service or product pages, and the blog posts that already get impressions in Search Console. Small fixes on pages that already rank often bring results sooner than new pages.

Use the companion tools to fix what it finds. The [Meta Tag Generator](/tools/meta-tag-generator/) writes titles, descriptions, canonical and social tags. The [Schema Markup Generator](/tools/schema-markup-generator/) produces valid JSON-LD. The [Keyword Density Checker](/tools/keyword-density-checker/) helps when the keyword checks show stuffing or a missing topic.

## What on-page checks cannot tell you

An HTML checklist cannot judge whether your content is genuinely helpful, original or better than competing pages, and it cannot see page speed, backlinks or how Google has indexed the page. Treat the score as a hygiene check: it removes avoidable mistakes so your content gets a fair chance.

Paste your next page into the [On-Page SEO Checker](/tools/on-page-seo-checker/) before you publish, and make it part of your routine whenever a template or theme changes.
