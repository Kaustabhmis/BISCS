{
  "tool": "robots-txt-generator",
  "slug": "create-robots-txt-file-guide",
  "title": "How to Create a robots.txt File (With Free Generator)",
  "description": "Create a correct robots.txt with allow and disallow rules, sitemap links and optional AI crawler blocks. Learn what robots.txt can and cannot do for SEO.",
  "keywords": ["robots.txt generator", "create robots txt", "robots.txt disallow", "robots.txt for wordpress", "block ai crawlers robots.txt"],
  "summary": "A robots.txt file sits at the root of your website and tells crawlers which paths they may or may not crawl. BISCS India’s free Robots.txt Generator builds the file from presets and custom rules, adds your sitemap URL, checks for common syntax errors and lets you download it ready to upload.",
  "faq": [
    { "q": "Does robots.txt stop a page from appearing in Google?", "a": "Not reliably. robots.txt controls crawling, not indexing. A blocked URL can still be indexed if other sites link to it, usually without a description. To keep a page out of search results, allow crawling and add a noindex meta tag instead." },
    { "q": "Where should the robots.txt file be placed?", "a": "At the root of the domain, so it opens at https://yourdomain.com/robots.txt. Each subdomain needs its own file. A robots.txt placed in a subfolder is ignored by crawlers." },
    { "q": "Does Google follow Crawl-delay?", "a": "No. Googlebot ignores the Crawl-delay line. Bing and Yandex have historically respected it. If Google is genuinely overloading your server, there are other ways to manage this, such as temporarily returning 503 or 429 responses, explained in Google’s crawling documentation." },
    { "q": "Should I block AI crawlers like GPTBot?", "a": "It depends on your goals. Blocking them may keep future content out of some AI training or AI search features, but well-behaved bots follow robots.txt voluntarily, and blocking Google-Extended does not affect your Google Search ranking. Decide deliberately rather than by default." },
    { "q": "Can a wrong robots.txt harm my SEO?", "a": "Yes. A single line like Disallow: / under User-agent: * blocks every compliant crawler from your entire site. Always review the final file and test important URLs in Google Search Console’s robots.txt report after uploading." }
  ]
}
---
A robots.txt file is a plain text file at the root of your site that gives crawlers instructions about which parts of the site they may visit. It is one of the first files Googlebot requests, and a small mistake in it can hide an entire website from search.

The [Robots.txt Generator](/tools/robots-txt-generator/) from BISCS India builds the file for you from simple choices: a default policy, quick presets, custom rules and your sitemap URL. It checks each line as you go and explains what search engines will and will not do with it.

## What does a robots.txt file actually do?

Robots.txt is a set of polite requests, not a lock. Well-behaved crawlers like Googlebot and Bingbot read it and follow the rules. Badly behaved scrapers ignore it.

The file uses a few simple directives:

- `User-agent:` names the crawler a group of rules applies to. `*` means all crawlers.
- `Disallow:` lists a path that crawler should not fetch.
- `Allow:` makes an exception inside a disallowed folder.
- `Sitemap:` gives the full URL of your XML sitemap.

A simple, healthy file for a small business site often looks like this:

```
User-agent: *
Disallow: /admin/
Disallow: /cart/

Sitemap: https://www.example.com/sitemap.xml
```

## What robots.txt cannot do

This is where many site owners go wrong, so it is worth being clear:

| You want to | Use robots.txt? | Better approach |
|---|---|---|
| Stop crawlers wasting time on cart or search pages | Yes | Disallow those paths |
| Keep a page out of Google results | No | Add a `noindex` meta tag and let Google crawl it |
| Hide private documents | No | Password protection or server-level restrictions |
| Remove a page already indexed | No | noindex, or the removals tool in Search Console |
| Tell crawlers where your sitemap is | Yes | Add a `Sitemap:` line |

The robots.txt file itself is public. Anyone can open it in a browser, so listing a "secret" folder in it actually advertises that folder.

## How to create robots.txt with the BISCS tool

1. Open the [Robots.txt Generator](/tools/robots-txt-generator/).
2. Choose the **Default for all crawlers**: **Allow all** for nearly every public website, or **Disallow all** for a staging or test site.
3. Add **Quick presets** if they fit your site: block admin and login pages, block internal search results, or block cart and account pages for an online shop.
4. Use **Add rule** for anything else. Pick a user-agent from the suggestion list (Googlebot, Bingbot and many others are included), choose Allow or Disallow, and type the path starting with `/`.
5. Optionally enter a **Crawl-delay**. The tool reminds you that Google ignores it.
6. Paste your **Sitemap URL(s)**, one per line, as full `https://` addresses.
7. Read the messages under the output. Errors such as paths with spaces or missing user-agents are flagged.
8. Press **Download** to save `robots.txt`, then upload it to the root of your site.

Nothing is sent to a server while you build the file; it is assembled in your browser.

## Should you block AI crawlers?

The generator includes an optional preset that blocks several AI-related crawlers: GPTBot, CCBot, Google-Extended, anthropic-ai, ClaudeBot and PerplexityBot. Whether you should use it depends on what you want.

Some points to weigh:

- **These rules are voluntary.** Reputable AI companies say their crawlers respect robots.txt, but it is not an enforcement mechanism.
- **Google-Extended is not a search crawler.** It is a control token that tells Google whether your content may be used for training and grounding its Gemini models. Blocking it does not affect how your site ranks in Google Search.
- **Blocking can reduce visibility in AI answers.** If you want ChatGPT, Perplexity or similar tools to cite your pages, blocking their crawlers works against that goal.
- **Bot names change.** Companies add and rename user agents, so review the list now and then against each company's official documentation.

To check how an existing file treats these bots, paste it into the [AI Crawler Access Checker](/tools/ai-crawler-checker/).

## Common robots.txt mistakes

- **Leaving `Disallow: /` live after launch.** Developers often block staging sites and forget to change the rule when the site goes live.
- **Blocking CSS and JavaScript folders.** Google needs these to render your pages. Old advice to block `/wp-includes/` or `/assets/` can hurt how Google sees your site.
- **Paths without a leading slash.** `Disallow: admin` is unclear; use `Disallow: /admin/`.
- **Using robots.txt to fix duplicate content.** Use canonical tags instead, so Google can still see and consolidate the pages.
- **Relative sitemap URLs.** The `Sitemap:` line must be a full URL. The tool checks this.
- **Wrong file name or location.** It must be lowercase `robots.txt` at the domain root.

## Tips for WordPress and online shops

WordPress creates a virtual robots.txt automatically. If you upload a real file, it replaces the virtual one, so make sure it includes everything you need. The admin preset in the generator blocks `/wp-admin/` while still allowing `admin-ajax.php`, which some themes and plugins rely on.

For WooCommerce or other shops, blocking cart, checkout and account pages saves crawl effort for the pages that matter. Faceted filter URLs (colour, size, price) can create thousands of near-duplicate pages; disallowing the filter parameters can help, but test carefully so you do not block category pages you want ranked.

## After you upload the file

Open `https://yourdomain.com/robots.txt` in a browser to confirm it is live. In Google Search Console, the robots.txt report shows the version Google fetched and any parsing problems.

Then make sure the sitemap you referenced actually exists. If you do not have one yet, the [XML Sitemap Generator](/tools/sitemap-generator/) can create it from a list of URLs. To confirm individual pages are not set to noindex by mistake, run them through the [On-Page SEO Checker](/tools/on-page-seo-checker/).

A good robots.txt is usually short. Build yours in the [Robots.txt Generator](/tools/robots-txt-generator/), keep it simple, and revisit it whenever your site structure changes.
