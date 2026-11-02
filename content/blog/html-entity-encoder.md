{
  "tool": "html-entity-encoder",
  "slug": "html-entities-escape-unescape-guide",
  "title": "HTML Entities: How to Escape and Unescape Special Characters",
  "description": "Learn which characters to escape in HTML, named vs numeric entities like &nbsp; and &#8377;, and how escaping helps prevent XSS. Free browser-based encoder.",
  "keywords": ["html entity encoder", "html escape online", "html unescape", "html special characters", "convert text to html entities"],
  "summary": "HTML escaping replaces characters with special meaning in HTML, mainly <, >, & and quotes, with entities such as &lt; and &amp; so browsers show them as text instead of treating them as code. BISCS India's HTML Entity Encoder escapes and unescapes text in named, decimal or hex style, entirely in your browser.",
  "faq": [
    { "q": "Which characters must be escaped in HTML?", "a": "At minimum, escape the ampersand as &amp;, the less-than sign as &lt; and the greater-than sign as &gt; in text. Inside attribute values, also escape double quotes as &quot; and single quotes as &#39;. Other characters such as ₹ or Hindi letters can be written directly if the page uses UTF-8." },
    { "q": "Does escaping HTML prevent XSS attacks?", "a": "Escaping untrusted text before inserting it into HTML is a core defence against cross-site scripting, but it must match the context. Text in an element body, an attribute, a URL and inline JavaScript each need different handling. Use your framework’s built-in escaping or templating rather than doing it by hand in production." },
    { "q": "What is the difference between named and numeric entities?", "a": "Named entities use a memorable word, such as &copy; for the copyright sign. Numeric entities use the character’s Unicode code point in decimal, like &#169;, or hexadecimal, like &#xA9;. All three display the same character. Numeric entities work for every character, while named ones exist only for a defined list." },
    { "q": "Do I need entities for ₹ or Indian-language text?", "a": "Not if your page is saved and served as UTF-8 with a meta charset tag, which is standard today. You can type ₹, Devanagari or Tamil directly. Entities like &#8377; are useful when an old system, email template or CMS field mangles non-ASCII characters." },
    { "q": "Why does my page show &amp;amp; instead of &?", "a": "The text was escaped twice. The first pass turned & into &amp;, and the second pass escaped that ampersand again. Decode the text once with the Decode mode, then make sure only one layer of your code performs escaping." }
  ]
}
---
HTML entities are short codes that let you show special characters as plain text on a web page. The browser reads `<` as the start of a tag, so to display a literal less-than sign you write `&lt;`. Escaping is the process of swapping such characters for entities; unescaping turns them back.

The [HTML Entity Encoder](/tools/html-entity-encoder/) on BISCS India does both directions in your browser. It can encode just the essential characters, or every non-ASCII character too, in named, decimal or hexadecimal style.

## Why do some characters need escaping?

HTML uses a handful of characters as syntax. If they appear in your content unescaped, the browser may misread the page:

| Character | Entity | Why it matters |
| --- | --- | --- |
| `&` | `&amp;` | Starts every entity |
| `<` | `&lt;` | Starts a tag |
| `>` | `&gt;` | Ends a tag |
| `"` | `&quot;` | Ends a double-quoted attribute |
| `'` | `&#39;` | Ends a single-quoted attribute |

Suppose you are writing a blog post that shows a code sample. If you paste the raw markup into your page, the browser renders a button rather than displaying the code. Escaped, it shows exactly what you typed:

```html
<!-- What you want readers to see -->
<button class="pay">Pay ₹499</button>

<!-- What you put in the HTML source -->
&lt;button class=&quot;pay&quot;&gt;Pay ₹499&lt;/button&gt;
```

## How to escape or unescape HTML with BISCS India

1. Open the [HTML Entity Encoder](/tools/html-entity-encoder/).
2. Choose **Encode** to escape, or **Decode** to turn entities back into characters.
3. For encoding, set the options:
   - **Encode quotes** (on by default) escapes `"` and `'`, needed for attribute values.
   - **Encode all non-ASCII** also converts characters like ₹, é or Hindi letters into entities.
   - **Style** picks **Named where possible**, **Decimal** (`&#8377;`) or **Hex** (`&#x20B9;`).
4. Paste your text into **Input**. The **Output** updates instantly, with a count of how many entities were created or decoded.
5. Click **Copy**, or **Swap** to reverse the direction and check a round trip.

## Named, decimal and hex entities

The same character can be written three ways. The copyright sign, for example:

```text
&copy;     named
&#169;     decimal code point
&#xA9;     hexadecimal code point
```

Named entities are easier to read, but they exist only for a fixed list of characters. The rupee sign has no widely supported named entity, so it is written as `&#8377;` or `&#x20B9;`. Numeric entities work for any Unicode character, including emoji.

## When should you encode all non-ASCII characters?

For a modern website served as UTF-8, you usually do not need to. You can type ₹, नमस्ते or ধন্যবাদ straight into the HTML. Encoding everything just makes the source harder to read.

Encoding all non-ASCII characters is useful when:

- An email template or older CMS field corrupts special characters.
- You are pasting HTML into a system whose character encoding you do not control.
- You need source files that contain only ASCII for a legacy toolchain.

## Where escaping comes up in everyday work

You do not have to be a security engineer to need this. Some very ordinary situations:

- **Writing tutorials or documentation.** Any page that shows HTML, XML or JSX examples needs the angle brackets escaped, or the browser will try to render them.
- **Pasting content into a CMS.** Some WordPress fields, e-commerce product descriptions and newsletter builders treat input as raw HTML. A product title like `Kurta <Size M> & Dupatta` can silently lose the part in angle brackets.
- **Building XML feeds.** Sitemaps, RSS feeds and product feeds for marketplaces are XML, which is even stricter than HTML. A bare `&` in a product name, such as `Tea & Snacks`, makes the whole feed invalid.
- **Reading scraped or exported data.** Text pulled from web pages or APIs often arrives full of `&amp;`, `&#39;` and `&quot;`. Decoding it gives you clean, readable text before you put it in a spreadsheet or report.
- **Email templates.** HTML emails are rendered by many different clients. Using entities for symbols like ₹ and © is a safe habit when you cannot be sure every client respects UTF-8.

In each case, the fix takes seconds: paste the text, copy the escaped or unescaped version, and move on.

## Escaping and security (XSS)

Cross-site scripting (XSS) happens when an attacker gets their own script to run on your page, usually by submitting text that your site later inserts into HTML without escaping. A comment field containing a script tag, displayed raw, would execute in every visitor’s browser.

Escaping `<`, `>`, `&` and quotes before inserting user text into HTML turns that attack into harmless visible text. But a few cautions apply:

- **Context matters.** Escaping for an HTML text node is not enough for values placed inside a `href`, a `style` or a `<script>` block. Each context has its own rules.
- **Use your framework.** React, Angular, Django, Laravel and most templating engines escape output by default. Bypassing that, for example with `innerHTML` or `dangerouslySetInnerHTML`, is where bugs creep in.
- **This tool is for content, not a security layer.** It is ideal for preparing code samples, fixing CMS content or debugging, not for sanitising user input in a live application.

In plain JavaScript, the safe way to insert user text is to set `textContent` rather than `innerHTML`:

```js
el.textContent = userComment;   // shown as text, never run as HTML
```

## Common mistakes

- **Double escaping.** `&amp;amp;` on a page means something escaped twice. Decode once and fix the pipeline.
- **Forgetting the ampersand in URLs.** Query strings in `href` attributes should technically have `&` written as `&amp;`. Browsers forgive this, but validators flag it.
- **Escaping inside code fences in Markdown.** Most Markdown renderers escape code blocks for you. Escaping manually as well gives you visible `&lt;` on the page.
- **Using entities for spacing.** A run of `&nbsp;` to indent text is fragile. Use CSS margin or padding instead.
- **Assuming escaping equals sanitising.** Escaping makes HTML inert; sanitising removes dangerous parts while keeping some formatting. They are different jobs.

## Related tools

If you are cleaning up a page before publishing, the [CSS / HTML / JSON Minifier](/tools/code-minifier/) can compress the final HTML. For characters in links rather than page content, use [URL Encode / Decode](/tools/url-encoder/), because URLs use percent-encoding, not HTML entities. And [Markdown Preview](/tools/markdown-preview/) is handy for checking how escaped text will render in Markdown-based docs.

## Privacy

All conversion happens in your browser with JavaScript. Whatever you paste, whether email templates, internal pages or client copy, stays on your device.
