{
  "tool": "meta-tag-generator",
  "slug": "meta-tag-generator-title-description-og-tags",
  "title": "Meta Tag Generator: Write Title, Description and OG Tags",
  "description": "Create a page title, meta description, canonical, Open Graph and X card tags in one go. Learn what each tag does, ideal lengths and mistakes to avoid.",
  "keywords": ["meta tag generator", "meta description generator", "open graph tags generator", "seo title and description", "html head meta tags"],
  "summary": "A meta tag generator turns your page title, description, URL and share image into ready-to-paste HTML for the head of your page. BISCS India's free Meta Tag Generator builds the title, meta description, robots, canonical, Open Graph and X (Twitter) tags in your browser and warns you about lengths and common errors.",
  "faq": [
    { "q": "Does Google still use the meta keywords tag?", "a": "No. Google has said for many years that it ignores the meta keywords tag for ranking, which is why the BISCS generator leaves it out. Spend that effort on a clear title, a useful description and good content on the page instead." },
    { "q": "Why does Google show a different description from the one I wrote?", "a": "Google rewrites snippets when it thinks other text on the page better matches the search. A description that accurately summarises the page and includes the main topic is more likely to be used, but there is no way to force it." },
    { "q": "How long should a meta description be?", "a": "Around 120–160 characters is a sensible target. Google truncates by pixel width rather than a fixed character count, so the generator shows both the character count and an estimated pixel width, and warns you when the text is likely to be cut off." },
    { "q": "Do I need separate Open Graph and Twitter tags?", "a": "Open Graph tags are read by Facebook, WhatsApp and LinkedIn, and X can fall back to them. Adding the twitter:card tag is still worthwhile because it tells X whether to show a large image card or a small summary." },
    { "q": "Where do I paste the generated meta tags?", "a": "Inside the head section of your page’s HTML, before the closing head tag. On WordPress or a site builder, use the SEO plugin or page settings fields instead of editing the theme, so updates do not overwrite your changes." }
  ]
}
---
A meta tag generator saves you from hand-typing the dozen or so lines of HTML that tell search engines and social apps what a page is about. You fill in a title, a short description, the page URL and a share image, and it gives you correctly formatted tags to paste into the `<head>` of the page.

The [Meta Tag Generator](/tools/meta-tag-generator/) from BISCS India does this live as you type. It also measures your title and description in approximate pixels, flags missing or broken values, and leaves out tags that no longer matter.

## What are meta tags, and which ones still matter?

Meta tags are lines of HTML that describe a page rather than appear on it. Visitors rarely see them directly, but Google, Bing, WhatsApp and LinkedIn all read them when they display your link.

Not every tag is worth adding. Here is what the generator produces and why:

| Tag | What it does | Still useful? |
|---|---|---|
| `<title>` | The clickable headline in search results and the browser tab | Essential |
| `meta name="description"` | Often used as the snippet under the title | Very useful for clicks |
| `meta name="robots"` | Tells search engines whether to index the page and follow links | Useful, especially to avoid accidental noindex |
| `link rel="canonical"` | Names the main version of a page when duplicates exist | Important for sites with filters, tracking links or www/non-www versions |
| `og:title`, `og:description`, `og:image` | Controls link previews on Facebook, WhatsApp and LinkedIn | Essential if links get shared |
| `twitter:card` | Chooses a large-image or small card on X | Worth adding |
| `meta charset` and `viewport` | Correct text encoding and mobile layout | Essential basics |
| `meta name="keywords"` | Once listed target keywords | Ignored by Google, so left out |

The tool also offers optional extras such as `theme-color` (the colour some mobile browsers use for the address bar), an author tag, `og:locale` from the language you choose, and `max-image-preview:large`, which permits search engines to show a large image preview of your page.

## How to generate meta tags with the BISCS tool

1. Open the [Meta Tag Generator](/tools/meta-tag-generator/). Press **Sample** first if you want to see a filled-in example.
2. Type your **page title**. Watch the counter and colour bar: it shows characters and an estimated pixel width, and turns amber or red when the title is likely to be cut off.
3. Write a **meta description** of one or two sentences. The counter aims you at roughly 120–160 characters.
4. Add the **canonical URL** and **site name**. The URL must be a full address starting with `https://`.
5. Paste a **share image URL** (1200 × 630 px is the recommended size) and add **image alt text**.
6. Choose the **language** (English (India), Hindi, Bengali, Tamil and other Indian languages are listed), the **page type** (website, article or profile) and the **X card type**.
7. Check the **Robots & technical** boxes. Leave "Allow indexing" ticked unless you really want the page hidden from search.
8. Read any warnings under the output, then press **Copy** or **Download** and paste the tags into your page's `<head>`.

Everything runs in your browser. Nothing you type is sent to a server, so you can draft tags for an unreleased product page without it leaking anywhere.

## How to write a title that gets clicked

The title tag is still one of the strongest on-page signals, and it is the first thing a searcher reads. A few habits make a real difference:

- **Lead with the topic.** "GST Calculator – Free CGST, SGST and IGST Split" beats "Welcome to Sharma & Associates | Home".
- **Keep it within the visible width.** Google cuts titles by pixels, roughly 600 px on desktop. Wide letters like W and M use more space than i and l, which is why the tool shows pixel estimates.
- **Make every title unique.** Ten pages called "Services | Company Name" compete with each other.
- **Add the brand at the end** if there is room, separated by a pipe or dash.
- **Avoid shouting.** ALL CAPS and stacks of exclamation marks look spammy and take more width.

## Writing a meta description people actually read

Google does not use the meta description as a ranking factor, but it often shows it as the snippet, and a good snippet earns more clicks. Think of it as a short advert for the page.

A practical formula is: what the page offers, who it is for, and one reason to choose it. For example, a Kolkata coaching centre might write: "Weekend JEE Main crash course in Salt Lake with small batches, printed notes and weekly mock tests. See fees and batch timings."

If you write it and Google still shows something else, that is normal. Google picks text that best matches each search. A clear, accurate description simply improves the odds that yours is used.

## Open Graph tags and WhatsApp previews

In India, a large share of links are shared on WhatsApp before anyone searches for them. When someone pastes your URL into a chat, WhatsApp reads the `og:title`, `og:description` and `og:image` tags to build the preview card.

Without them, the app guesses, and you might get a blank grey box or your cookie banner text. With them, you get a proper card with your image and headline. Use an absolute image URL (starting with `https://`), keep the file reasonably small, and stick to the 1.91:1 shape so it is not awkwardly cropped.

To check how a card will look before publishing, paste the same details into the [Social Share Preview](/tools/social-share-preview/) tool.

## Common meta tag mistakes

- **Leaving noindex on after launch.** Developers often block staging sites. If that tag reaches the live site, the page disappears from Google. The generator warns you when indexing is switched off.
- **Relative image paths.** `og:image` set to `/images/banner.jpg` fails on most social networks. Use the full URL.
- **Canonical pointing to the wrong page.** Copying a template and forgetting to update the canonical tells Google that every page is a duplicate of the home page.
- **Duplicate titles across a site.** Common on e-commerce category pages and blog archives.
- **Stuffing keywords into the title.** "Cheap Shoes, Buy Shoes Online, Best Shoes India" reads badly and rarely helps.
- **Forgetting alt text for the share image.** It helps screen reader users when the image appears in feeds.

## When should you use a meta tag generator?

It is most useful when you are building or fixing pages by hand: a static HTML site, a landing page for a Diwali offer, a college fest microsite, or a template you will reuse. If you use WordPress with an SEO plugin, the plugin fills these fields for you, but the generator is still handy for drafting titles and descriptions and checking their length before you paste them in.

After publishing, run the page through the [On-Page SEO Checker](/tools/on-page-seo-checker/) to confirm the tags are actually present in the final HTML, and use the [Google SERP Preview](/tools/serp-preview/) to fine-tune how the result looks on mobile and desktop. If you are adding structured data too, the [Schema Markup Generator](/tools/schema-markup-generator/) creates the matching JSON-LD.

Good meta tags will not rescue a weak page, but they make sure a good page is described properly everywhere it appears. Draft yours in the [Meta Tag Generator](/tools/meta-tag-generator/), paste them in, and check the result once the page is live.
