{
  "tool": "sitemap-generator",
  "slug": "create-xml-sitemap-from-url-list",
  "title": "How to Create an XML Sitemap and Submit It to Google",
  "description": "Turn a list of URLs into a valid XML sitemap in seconds. Learn what to include, why lastmod matters more than priority, and how to submit it in Search Console.",
  "keywords": ["xml sitemap generator", "create sitemap xml", "submit sitemap to google", "sitemap for website", "sitemap index file"],
  "summary": "An XML sitemap is a file that lists the URLs you want search engines to find, optionally with the date each page last changed. BISCS India’s free XML Sitemap Generator turns a pasted list of URLs or paths into a valid sitemap, removes duplicates and invalid lines, splits very large lists, and runs entirely in your browser.",
  "faq": [
    { "q": "Do small websites need an XML sitemap?", "a": "A small site with good internal links can be crawled without one, but a sitemap still helps Google discover new pages faster and lets you see indexing reports per sitemap in Search Console. It takes a few minutes to create, so it is usually worth having." },
    { "q": "Does Google use priority and changefreq in sitemaps?", "a": "Google has said it ignores the priority and changefreq values. It does use lastmod when the dates are consistently accurate. Other search engines may read priority and changefreq, so including them is harmless but not important." },
    { "q": "How many URLs can one sitemap contain?", "a": "A single sitemap file can hold up to 50,000 URLs and must be no larger than 50 MB uncompressed. Bigger sites split their URLs into several sitemaps and list them in a sitemap index file, which the BISCS generator creates automatically." },
    { "q": "Should I include every page of my website in the sitemap?", "a": "No. Include only canonical pages you want to appear in search. Leave out redirects, error pages, noindex pages, duplicate filter URLs, login pages and thank-you pages. A clean sitemap gives search engines a clear signal about what matters." },
    { "q": "What is the difference between an XML sitemap and an HTML sitemap?", "a": "An XML sitemap is written for search engines and lists URLs in a machine-readable format. An HTML sitemap is an ordinary web page with links for visitors. They serve different audiences, and a site can have both." }
  ]
}
---
An XML sitemap is a list of the pages on your website, written in a format search engines read easily. It does not guarantee that every page will be indexed, but it helps Google and Bing discover your pages and understand when they last changed.

The [XML Sitemap Generator](/tools/sitemap-generator/) from BISCS India turns a plain list of URLs into a valid `sitemap.xml`. Paste the addresses, choose a few options and download the file. It removes duplicates, skips invalid lines and handles very large lists for you.

## What does an XML sitemap look like?

A sitemap is a short XML file with one `url` entry per page. Each entry contains the page address in a `loc` tag, such as `https://www.example.com/services/`, and optionally the date the page last changed in a `lastmod` tag, written as `2026-10-28`. All the entries sit inside a single `urlset` element.

That is really all most sites need. You can also add `changefreq` and `priority`, but Google has said it ignores both, so the generator leaves them out unless you choose otherwise.

## When does a sitemap help most?

Sitemaps are most useful when:

- **Your site is new** and has few links from other websites.
- **You publish often**, such as a news site, blog or product catalogue.
- **Some pages are hard to reach** through menus, for example old blog posts many clicks deep.
- **Your site is large**, with thousands of products or listings.

For a five-page brochure site with a clear menu, the benefit is smaller, but submitting a sitemap also unlocks useful indexing reports in Google Search Console, so most site owners should still have one.

## How to create a sitemap with the BISCS generator

1. Open the [XML Sitemap Generator](/tools/sitemap-generator/).
2. Choose the **Input type**: **Full URLs** if you have complete addresses, or **Base URL + paths** if you have paths like `/about/` and `/contact/`.
3. Paste your URLs or paths, **one per line**. Lines starting with `#` are treated as comments and ignored.
4. Set **Last modified** to Today, a date you pick, or leave it out.
5. Leave **Change frequency** and **Priority** as "Leave out" unless another search engine you care about needs them.
6. Tick **Drop URLs from other domains** if your list may contain outside links, and **Sort URLs A–Z** if you want a tidy file.
7. Check the counters for URLs, duplicates removed, invalid lines and other domains, and read any warnings.
8. Choose **XML** (or **Plain text** for a simple text sitemap) and press **Download**.

The list stays in your browser. Nothing is uploaded, so you can safely build a sitemap for a site that is not public yet.

## Where do you get the list of URLs?

The generator does not crawl your website; it works from a list you provide. Some practical sources:

- **Your CMS or shop admin**, which can often export product or page URLs to a spreadsheet.
- **Google Search Console**, where the Pages report lets you export indexed URLs.
- **Your own planning sheet** for a new site.
- **A copy of your menu and footer links** for a small brochure site.

Copy the URL column from a spreadsheet and paste it straight in. The tool trims spaces, removes `#fragments` (search engines ignore them anyway) and drops exact duplicates.

## What to include and what to leave out

| Include | Leave out |
|---|---|
| Home page and main sections | Login, cart, checkout and account pages |
| Service, product and category pages | Thank-you and confirmation pages |
| Blog posts and guides | URLs that redirect elsewhere |
| Location pages for each city you serve | Pages with a noindex tag |
| Important PDFs you want found | Filter and sort variations of the same list |
| The canonical version of each page | `http://` versions if your site uses `https://` |

A sitemap is a signal of which URLs you consider important and canonical. Filling it with redirects and duplicates sends mixed signals.

## Large websites: sitemap index files

The sitemap protocol allows up to 50,000 URLs per file and 50 MB uncompressed. If your list is longer, the generator automatically splits it into `sitemap-1.xml`, `sitemap-2.xml` and so on, plus a `sitemap-index.xml` that points to them. The download becomes a ZIP containing all the files.

Upload every file to the root of your site and submit only the index file to Search Console. Google will find the rest from there.

## Common sitemap mistakes

- **Wrong protocol or domain.** Listing `http://example.com` when the site lives at `https://www.example.com` creates redirects. The tool warns when URLs use `http://`.
- **Mixing domains.** A sitemap should only list URLs from its own site.
- **Fake lastmod dates.** Setting every page to today's date on every upload teaches Google to ignore your dates. Update lastmod when content really changes.
- **Forgetting to update it.** A sitemap from two years ago that is missing your newest pages is of little use.
- **Blocking the sitemap in robots.txt.** Make sure the file itself is crawlable.

## How to submit your sitemap to Google

1. Upload `sitemap.xml` to the root of your website so it opens at `https://yourdomain.com/sitemap.xml`.
2. Add a line `Sitemap: https://yourdomain.com/sitemap.xml` to your robots.txt. The [Robots.txt Generator](/tools/robots-txt-generator/) has a field for this.
3. In Google Search Console, open **Sitemaps**, paste the sitemap URL and press **Submit**.
4. Do the same in Bing Webmaster Tools if you want Bing (and services that use Bing's index) to find your pages quickly.

Search Console then reports how many URLs it discovered and any that could not be read. If a page shows as "Discovered – currently not indexed", the problem is usually the page itself rather than the sitemap: check its content and tags with the [On-Page SEO Checker](/tools/on-page-seo-checker/).

If your site has pages in several languages, the [Hreflang Tag Generator](/tools/hreflang-generator/) can produce the alternate-language entries to go alongside your sitemap.

Keep your sitemap honest and current, and regenerate it with the [XML Sitemap Generator](/tools/sitemap-generator/) whenever you add or remove important pages.
