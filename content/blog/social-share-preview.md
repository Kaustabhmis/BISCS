{
  "tool": "social-share-preview",
  "slug": "preview-link-whatsapp-facebook-linkedin",
  "title": "Social Share Preview: Check Link Cards for WhatsApp and LinkedIn",
  "description": "Preview how your link looks on WhatsApp, Facebook, LinkedIn and X before sharing. Fix missing images, wrong sizes and stale previews with Open Graph tags.",
  "keywords": ["social share preview", "whatsapp link preview", "open graph preview", "og image size", "link preview not showing"],
  "summary": "A social share preview shows how your link card will appear when someone shares the URL on WhatsApp, Facebook, LinkedIn or X. BISCS India’s free Social Share Preview builds the cards from your title, description and image, checks the image size and ratio, and generates the Open Graph and X tags to paste into your page.",
  "faq": [
    { "q": "Why is my WhatsApp link preview not showing an image?", "a": "Common causes are a missing og:image tag, a relative image path instead of a full https URL, an image that is too large in file size, or a server that blocks the request. Compress the image, use an absolute https URL and test again in a new chat." },
    { "q": "What is the best Open Graph image size?", "a": "1200 × 630 pixels, a ratio of about 1.91:1, works well across Facebook, LinkedIn, WhatsApp and X large cards. Keep text and logos near the centre because some apps crop the edges, and use JPG or PNG." },
    { "q": "I changed my og:image but Facebook still shows the old one. Why?", "a": "Social networks cache link previews. After updating your tags, use Facebook’s Sharing Debugger or LinkedIn’s Post Inspector to fetch the page again. WhatsApp also caches previews, so testing in a fresh chat may show the new card sooner." },
    { "q": "Is the image I upload to the preview tool published anywhere?", "a": "No. An uploaded image is only used locally to draw the preview in your browser. To make it appear in real link cards, you must upload it to your own website and paste its full URL into the image field." },
    { "q": "Do Open Graph tags help SEO?", "a": "They are not a Google ranking factor. Their value is in how your links look when shared, which affects how many people click them on social apps and messaging platforms. Google relies on your title tag and page content instead." }
  ]
}
---
When you paste a link into WhatsApp or LinkedIn, the app fetches the page and builds a small card from its Open Graph tags: a title, a short description and an image. A social share preview lets you see that card before anyone else does, so you can fix a blurry image or a cut-off headline in advance.

The [Social Share Preview](/tools/social-share-preview/) from BISCS India shows approximate cards for WhatsApp, Facebook, LinkedIn and X side by side, checks your image dimensions, and writes the tags you need.

## Why link previews matter so much in India

For many Indian businesses, WhatsApp is the main way links travel. A shop owner shares a festive offer page in customer groups, a college forwards an admission notice, a builder sends a project brochure link. If the card shows a grey box and a URL, it looks like spam. If it shows a crisp image and a clear headline, people tap it.

The same is true on LinkedIn for B2B services and on Facebook for local audiences. You only control these cards through a handful of meta tags, and you cannot see the result until someone shares the link, unless you preview it.

## Which tags control a link card?

- **og:title** is the headline on the card. If it is missing, apps fall back to your page title.
- **og:description** is the one or two lines under the headline. Not every app shows it.
- **og:image** is the picture. It must be a full `https://` URL.
- **og:url** and **og:site_name** tell apps the canonical address and your brand name.
- **twitter:card** set to `summary_large_image` tells X to show a big image card.

The tool generates all of these, and adds `og:image:width` and `og:image:height` once it has measured your image, which helps some apps render the card on the first share.

## How to preview and fix your link card

1. Open the [Social Share Preview](/tools/social-share-preview/) and press **Sample** to see how a complete card looks.
2. Enter the **Title (og:title)** and **Description (og:description)**. Counters warn you when the title is likely to be cut off.
3. Add the **Page URL** and **Site name**.
4. Paste the **Image URL (og:image)**, or upload an image from your device just to try it out. Uploads stay in your browser and are never sent anywhere.
5. Read the image checks. The tool reports the pixel size and ratio, and warns if the image is too small, not 1.91:1, or large in file size for WhatsApp.
6. Compare the four previews. Pay attention to how the headline wraps and how the image is cropped.
7. Press **Copy** to get the Open Graph and X tags, and paste them into the `<head>` of your page.
8. After publishing, refresh any cached preview using the Facebook Sharing Debugger or LinkedIn Post Inspector.

## Getting the image right

The image does most of the work on a link card, and it is where most problems start.

| Check | Recommended | What goes wrong otherwise |
|---|---|---|
| Size | 1200 × 630 px | Below about 600 × 315 px, many apps show a small thumbnail instead |
| Ratio | 1.91:1 | Other shapes get cropped, often cutting off text |
| File size | As small as practical; under about 300 KB for WhatsApp | Heavy images are often skipped by WhatsApp |
| Format | JPG or PNG | Some apps do not support newer formats in previews |
| URL | Absolute `https://` address | Relative paths and `http://` images may not load |
| Content | Key text and logo near the centre | Edges are cropped in some layouts |

If your image is too heavy, shrink it with the [Image Compressor](/tools/image-compressor/). If it is the wrong shape, crop it to 1200 × 630 with the [Image Resizer](/tools/image-resizer/) before uploading it to your site.

## Common link preview mistakes

**Using the logo as the share image.** A square logo on a 1.91:1 card gets cropped or shrunk into a tiny thumbnail. Design a proper banner instead, with the logo as one element.

**Putting all the information in the image.** On some cards the title is overlaid or hidden. Keep the headline in og:title too, and use the image for visual impact.

**Same image on every page.** It is fine as a fallback, but your most-shared pages (offers, articles, product pages) deserve their own image so they are recognisable in a chat.

**Forgetting the cache.** Social networks remember previews. If you share a link before adding tags, the old blank card can stick for a while. Use the official debugging tools to refresh it.

**Blocking the crawler.** If your server or a security plugin blocks bots, apps cannot read your tags. Check that your robots.txt and firewall do not block social preview crawlers such as `facebookexternalhit`.

## Tips for headlines that work on small screens

Link cards are mostly read on phones, inside busy chats and feeds. A few habits help:

- Keep the headline to around 60–70 characters so it does not wrap awkwardly.
- Make the description concrete: what the reader will get, such as "Free checklist", "Prices from ₹499" or "Register by 15 December".
- Do not repeat the site name in the title if og:site_name already shows it.
- Write in the language your audience uses. A Bengali or Hindi headline for a regional audience is perfectly fine; just keep the text encoding as UTF-8.

## Approximate, not pixel-perfect

Each app changes its card design from time to time, and the cards in the tool are close approximations rather than screenshots. What they reliably show is whether your image loads, how it is cropped, and whether your text is likely to fit. That is enough to catch nearly every real-world problem.

For a full set of head tags, including the page title, description, robots and canonical tags, use the [Meta Tag Generator](/tools/meta-tag-generator/). Then come back to the [Social Share Preview](/tools/social-share-preview/) whenever you design a new share image or launch a campaign page.
