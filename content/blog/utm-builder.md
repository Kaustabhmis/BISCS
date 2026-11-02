{
  "tool": "utm-builder",
  "slug": "utm-link-builder-campaign-tracking",
  "title": "UTM Link Builder: Track WhatsApp, Email and Ad Campaigns",
  "description": "Build UTM tracking links for Google Analytics in seconds. Learn what source, medium and campaign mean, naming rules that keep reports clean, and bulk tagging.",
  "keywords": ["utm builder", "utm link generator", "campaign url builder", "google analytics utm parameters", "whatsapp utm tracking"],
  "summary": "A UTM link is an ordinary URL with tags such as utm_source, utm_medium and utm_campaign added, so analytics tools can tell which campaign brought each visitor. BISCS India’s free UTM Link Builder creates single or bulk tagged links, keeps your existing parameters, offers presets for WhatsApp, email and ads, and can show a QR code.",
  "faq": [
    { "q": "Which UTM parameters are required?", "a": "Google Analytics needs utm_source to attribute a visit, and you should always add utm_medium and utm_campaign as well so traffic is grouped properly. utm_term, utm_content and utm_id are optional and useful for keywords, ad variations or matching campaign IDs." },
    { "q": "Are UTM parameters case-sensitive?", "a": "Yes. Facebook, facebook and FACEBOOK appear as three separate sources in your reports. That is why the BISCS builder converts values to lowercase by default and replaces spaces with underscores. Pick a naming style and stick to it." },
    { "q": "Do UTM parameters affect SEO?", "a": "Not if used correctly. Use UTM links only in campaigns and external shares, never in internal links between your own pages, and make sure your pages have a canonical tag pointing to the clean URL so tagged versions are not treated as separate pages." },
    { "q": "Can I track WhatsApp messages with UTM links?", "a": "Yes. Tag the link you share with utm_source=whatsapp and utm_medium=social or messaging, plus a campaign name. Visits from people who tap that link are then attributed to WhatsApp in Google Analytics instead of appearing as direct traffic." },
    { "q": "Where is my UTM link history stored?", "a": "Saved and copied links are stored only in your own browser’s local storage. They are not sent to any server and will not appear on another device. Clearing your browser data or pressing Clear history removes them." }
  ]
}
---
A UTM link is your normal web address with a few extra tags at the end, like `?utm_source=whatsapp&utm_medium=social&utm_campaign=diwali_sale`. When someone clicks it, Google Analytics reads those tags and records exactly which campaign sent them.

The [UTM Link Builder](/tools/utm-builder/) on BISCS India builds these links for you, keeps them consistent, and works for one link or a whole list. It keeps any existing query parameters and `#anchors` intact, which many simple builders break.

## Why tag links at all?

Without tags, much of your marketing traffic lands in vague buckets. Visits from WhatsApp forwards, email newsletters, PDF brochures and many mobile apps often show up as "direct" because no referrer is passed. You cannot tell whether the Diwali offer you broadcast to customers worked better than the Instagram story.

UTM tags fix that. Each tagged link carries its own label, so your analytics can show sessions, enquiries and sales per campaign.

## What each UTM parameter means

| Parameter | Answers | Example values |
|---|---|---|
| `utm_source` | Where did the visitor come from? | whatsapp, newsletter, google, facebook |
| `utm_medium` | What type of channel? | social, email, cpc, qr, sms |
| `utm_campaign` | Which campaign or promotion? | diwali_sale, jee_admissions_2027 |
| `utm_term` | Which paid keyword? | home_loan_emi |
| `utm_content` | Which link or creative variation? | banner_top, status_post, link_2 |
| `utm_id` | Which campaign ID? | Matches an ID in your ad platform or data import |

Source, medium and campaign are the core three. Google Analytics relies on source and medium to place traffic into channel groups such as Email, Organic Social or Paid Search, so consistent medium values make your reports far more useful.

## How to build a UTM link with the BISCS tool

1. Open the [UTM Link Builder](/tools/utm-builder/).
2. Choose **Single link** or **Bulk** mode.
3. Paste your **Website URL**. Existing parameters such as `?ref=home` and anchors like `#pricing` are preserved.
4. Click a **Preset** (WhatsApp, Facebook, Instagram, Email newsletter or Google Ads) to fill source and medium, or type your own.
5. Enter a **Campaign name**, and optionally term, content and ID.
6. Keep **Convert values to lowercase** and **Replace spaces with _** ticked for clean, consistent reports.
7. Copy the finished link, or press **Save to history** to keep it for later.
8. Tick **Show QR code for this link** if you want to print it on a flyer or shop counter card, and download the QR as PNG or SVG.

In Bulk mode, paste several URLs, one per line, and the same tags are applied to each. You can copy them all at once or download a CSV.

Everything happens in your browser. Your link history is stored only in local storage on your device.

## A naming convention that keeps reports clean

The biggest UTM problem is inconsistency. One person writes "WhatsApp", another "whatsapp", a third "wa", and your report now has three sources for one channel. Agree a short convention and write it down:

- **Lowercase everything.** The builder does this by default.
- **Use underscores instead of spaces.** `summer_sale`, not `summer sale` (which becomes `summer%20sale`).
- **Fix your medium list.** For example: `social`, `email`, `cpc`, `qr`, `sms`, `referral`. Do not invent new ones per campaign.
- **Name campaigns by what and when.** `ipl_offer_apr`, `gst_webinar_nov`.
- **Use utm_content for variations.** If one email has a button and a text link, tag them `button` and `text_link` to see which gets clicked.

## Practical examples for Indian businesses

**A clothing shop's festive offer on WhatsApp:** source `whatsapp`, medium `social`, campaign `durga_puja_offer`, content `broadcast_list`. Share it in customer groups and on the WhatsApp Business status, using a different content value for each.

**A CA firm's monthly newsletter:** source `newsletter`, medium `email`, campaign `itr_deadline_reminder`. Any reader who clicks through to the ITR filing page is recorded under that campaign.

**A printed brochure at a trade fair:** source `brochure`, medium `qr`, campaign `pragati_maidan_expo`. Print the QR code from the builder so visits from the fair stand out.

## Common UTM mistakes

- **Tagging internal links.** Using UTM links in your own menu or between your own pages overwrites the original source and corrupts your data. Only tag links that point to your site from elsewhere.
- **Skipping the medium.** Without it, channel reports group visits poorly. The builder warns when it is missing.
- **Mixing cases.** "Facebook" and "facebook" become two sources.
- **Breaking single-page app URLs.** Some sites put a `?` after the `#`. The builder places tags before the `#`, where analytics tools can read them, and warns you.
- **Sharing ugly links.** Long tagged URLs look suspicious in a chat. Put them behind a button, a QR code or descriptive link text where possible.

## Where to see UTM results in Google Analytics

Once people start clicking your tagged links, the data appears in Google Analytics 4 within a day or so, and often sooner in the realtime view. The most useful places to look are:

- **Traffic acquisition report.** Change the main dimension to "Session source / medium" to see rows such as `whatsapp / social` or `newsletter / email`.
- **Session campaign.** Switch the dimension to campaign to compare `diwali_sale` with `durga_puja_offer` side by side.
- **Key events.** If you have set up events for form submissions, calls or purchases, add them as a column to see which campaigns produce real enquiries, not just visits.
- **Explorations.** For deeper analysis, build a free-form exploration with source, medium, campaign and content as rows.

Give a campaign a week or two before drawing conclusions, especially for small businesses with modest traffic. A handful of visits is not enough to judge one channel against another.

## How UTM tags interact with ad platforms

Google Ads can tag links automatically using its own click identifier, and that is usually the better option when your Ads and Analytics accounts are linked. Manual UTM tags are most valuable for everything that does not tag itself: WhatsApp, email, SMS, QR codes, influencer posts, partner websites and offline material. Some social ad platforms also offer their own URL parameter fields; if you use them, follow the same naming convention so the data lines up.

## Make sure your pages handle tagged URLs

Tagged links create many URL variations of the same page. A canonical tag tells search engines which is the main version, so check that your pages have one using the [Meta Tag Generator](/tools/meta-tag-generator/) or the [On-Page SEO Checker](/tools/on-page-seo-checker/). If you want a standalone, styled QR code with more design options, the [QR Code Generator](/tools/qr-code-generator/) can encode your tagged link too.

Start every campaign by tagging its links in the [UTM Link Builder](/tools/utm-builder/), and your analytics will finally tell you which efforts are worth repeating.
