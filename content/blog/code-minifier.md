{
  "tool": "code-minifier",
  "slug": "minify-css-html-json-online",
  "title": "How to Minify CSS, HTML and JSON Online (and What It Saves)",
  "description": "Minify CSS, HTML and JSON to shrink file size: what minification removes, how it differs from gzip, what to keep, and how to check the bytes you saved.",
  "keywords": ["css minifier", "minify html online", "json minify", "compress css code", "html minifier"],
  "summary": "Minifying code removes whitespace, line breaks and comments that browsers do not need, making CSS, HTML and JSON files smaller and slightly faster to download. BISCS India's CSS / HTML / JSON Minifier does this in your browser, keeps licence comments and preformatted content intact, and shows exactly how many bytes you saved.",
  "faq": [
    { "q": "Does minifying CSS or HTML change how the page looks?", "a": "It should not. Minification only removes characters that have no effect on rendering, such as indentation, comments and redundant semicolons. Whitespace that matters, for example inside pre and textarea elements, is preserved. Always test the minified page once, because unusual markup or CSS hacks can occasionally behave differently." },
    { "q": "Is minification still worth it if my server uses gzip or Brotli?", "a": "Usually yes, but the gain is smaller. Compression already shrinks repeated whitespace very efficiently, so a file that is 30% smaller after minifying might be only a few percent smaller after compression. Minifying also removes comments, which can contain internal notes you would rather not publish." },
    { "q": "Can I minify JavaScript with this tool?", "a": "No. This tool handles CSS, HTML and JSON. Safely minifying JavaScript requires understanding variable scope and syntax in depth, which is the job of dedicated tools such as Terser or esbuild, usually run as part of a build process. Inline script blocks inside HTML are left unchanged." },
    { "q": "Can I un-minify code later?", "a": "You can re-format minified code so it is readable again, but comments and original formatting that were removed are gone for good. Always keep your original, readable source files and treat the minified version as a build output, never as the file you edit." },
    { "q": "What does Keep /*! licence */ comments mean?", "a": "By convention, a comment whose opening marker is followed by an exclamation mark holds a licence or copyright notice that should survive minification. Many open-source licences require that notice to stay with the code. With the option ticked, the minifier removes ordinary comments but keeps these special ones." }
  ]
}
---
Minifying code means stripping out everything a browser does not need: indentation, line breaks, comments and redundant characters. The page looks and works exactly the same, but the file is smaller, so it downloads and parses a little faster.

The [CSS / HTML / JSON Minifier](/tools/code-minifier/) on BISCS India handles all three formats in one place. Paste your code or upload a file, and it shows the minified output alongside the original size, the new size and the percentage saved.

## What does minification remove?

Take this small piece of CSS:

```css
/* Card component */
.card {
  display: flex;
  padding: 16px 20px;
  color: #333333;
}
```

Minified, it becomes:

```css
.card{display:flex;padding:16px 20px;color:#333333}
```

The comment, newlines and indentation are gone, spaces around `{`, `:` and `;` are removed, and the final semicolon before `}` is dropped because CSS does not require it. Every remaining character is needed.

For HTML, the minifier collapses runs of whitespace between tags and removes ordinary comments. For JSON, it removes all whitespace between tokens.

## How to minify code with BISCS India

1. Open the [CSS / HTML / JSON Minifier](/tools/code-minifier/).
2. Choose the language at the top: **CSS**, **HTML** or **JSON**.
3. Paste your code, drop a file onto the input, or click **Upload** to load a `.css`, `.html`, `.htm` or `.json` file. **Sample** loads an example if you want to see it work first.
4. For CSS, decide whether to tick **Keep /*! licence */ comments**. It is on by default.
5. The minified output appears immediately, with **Original**, **Minified** and **Saved** figures underneath.
6. Copy the result or download it, and use it as your production file.

When you upload a file, the tool picks the matching language from its extension, so a `.json` file switches to JSON mode automatically. The download button names the output sensibly too, for example `styles.min.css`, which keeps it clearly separate from your editable source.

If you paste invalid JSON in JSON mode, the tool reports the error with its line and column instead of producing output.

## What the HTML minifier is careful to keep

Whitespace in HTML is not always meaningless, so the minifier leaves certain things alone:

- **Content of `pre` and `textarea` elements**, where spaces and line breaks are visible to users.
- **Inline `script` and `style` blocks**, which are passed through unchanged rather than risk breaking code.
- **Conditional comments** used for old Internet Explorer, in case your template still includes them.
- **A single space between inline elements**, because removing it would glue words together, for example between a bold word and the next one.

Ordinary comments such as `<!-- page styles -->` are removed. If you have template comments that a CMS or framework needs, check the output before publishing.

## Minification vs compression: what is the difference?

| | Minification | Gzip or Brotli compression |
| --- | --- | --- |
| Where it happens | Once, before you upload the file | On the server for every response (or pre-compressed) |
| What it does | Removes unnecessary characters | Encodes repeated patterns more efficiently |
| Output | Still valid, readable-by-browser code | Binary, decoded by the browser automatically |
| Removes comments | Yes | No |
| Typical setup | Build tool or a minifier like this one | Hosting or CDN setting |

They work best together. Most hosting platforms, including popular static hosts and CDNs, apply compression automatically; minification is the part you control.

## How much will I actually save?

It depends on how the code was written. Heavily commented, well-indented CSS can shrink by a third or more. Already-compact code saves little. The **Saved** figure tells you the real number for your file, so there is no need to guess.

Keep perspective, though. A 6 KB stylesheet becoming 4 KB is a nice tidy-up, but if your page also loads a 2 MB hero photo, compressing that image will matter far more. The [Compress Image](/tools/image-compressor/) tool is a better first stop for slow pages.

## When should you minify?

- **Small websites without a build step.** A hand-written landing page or portfolio site can be minified manually before upload.
- **Email templates.** Some email clients have size limits that clip long messages, so trimming HTML weight can help keep the whole email visible.
- **Embedding JSON in configuration.** Environment variables and some API fields need JSON on a single line.
- **Quick checks.** Even if your build pipeline minifies automatically, it is useful to see how much a stylesheet shrinks.

If your project uses a framework or bundler such as Vite, Next.js or webpack, minification is usually already built into the production build. Use this tool for one-off files and for everything outside that pipeline.

## A simple workflow for small sites

If you maintain a small business website by hand, a light routine keeps things tidy without a build system. Keep a `src` folder with your readable `style.css` and HTML pages. When you are ready to publish, minify each changed file, save the output into a separate `public` folder, upload that folder, and open the live site on your phone to check nothing broke. Next time you need a change, edit the files in `src` and repeat. It takes a minute and keeps your editable code and your published code from ever getting mixed up.

## Common mistakes

- **Editing the minified file.** Always edit the readable source and minify again. Keep the minified file as an output, with a name like `style.min.css`.
- **Deleting licence notices.** Many open-source licences require the copyright comment to stay. Keep the `/*!` option on for third-party CSS.
- **Minifying broken code.** Errors become harder to spot on one long line. Validate first; for JSON, the [JSON Formatter](/tools/json-formatter/) points to the exact error.
- **Forgetting to test.** After replacing a stylesheet or template with its minified version, load the page once on desktop and mobile.
- **Expecting JavaScript support.** Inline scripts are left untouched, and separate `.js` files need a dedicated JavaScript minifier.

## Readability first, size second

Write code for people, with clear indentation and helpful comments, and let tools make it small for machines. If you ever need to escape snippets of HTML for documentation rather than shrink them, the [HTML Entity Encoder](/tools/html-entity-encoder/) is the right tool.

## Privacy

Your code is processed entirely in the browser. Nothing is uploaded, which means unreleased designs, client templates and internal configuration files stay on your computer.
