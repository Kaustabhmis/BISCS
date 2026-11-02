{
  "tool": "json-formatter",
  "slug": "format-validate-json-online",
  "title": "How to Format and Validate JSON Online (With Error Lines)",
  "description": "Pretty-print, validate and minify JSON in your browser. Learn to read JSON error messages, fix trailing commas and quotes, and keep API data private.",
  "keywords": ["json formatter", "json validator online", "pretty print json", "json beautifier", "fix invalid json"],
  "summary": "To format JSON, paste it into a JSON formatter, choose an indent (2 spaces, 4 spaces or tab) and copy the pretty-printed result. If the JSON is invalid, a good formatter shows the exact line and column of the error. BISCS India's JSON Formatter does all of this in your browser, so API responses never leave your device.",
  "faq": [
    { "q": "Why does my JSON say “Unexpected token” when it looks fine?", "a": "The usual culprits are a trailing comma after the last item, single quotes instead of double quotes, comments, or an unquoted key. JavaScript object syntax allows some of these, but strict JSON does not. The formatter points to the line and column so you can fix the exact character." },
    { "q": "Is it safe to paste API responses with customer data into an online JSON formatter?", "a": "It depends on the tool. Many websites send your text to a server. The BISCS India JSON Formatter parses and formats everything with JavaScript inside your browser, so nothing is uploaded. Even so, follow your company’s data policy for production data containing personal details." },
    { "q": "Does formatting JSON change the data?", "a": "No. Formatting only adds or removes whitespace between tokens. Keys, values and order stay the same, unless you tick Sort keys, which reorders object keys alphabetically. Very large integers above 2^53 may lose precision because browsers store JSON numbers as 64-bit floating point values." },
    { "q": "What is the difference between pretty-printing and minifying JSON?", "a": "Pretty-printing adds line breaks and indentation so people can read the structure. Minifying removes all unnecessary whitespace so the file is as small as possible for sending over a network. Both versions represent exactly the same data and parse to the same result." },
    { "q": "Can I add comments to a JSON file?", "a": "Standard JSON has no comment syntax, so a strict parser rejects them. Some tools accept variants such as JSONC or JSON5 for configuration files, but if the file is consumed by an API or JSON.parse, remove comments or store notes in a normal string field instead." }
  ]
}
---
A JSON formatter takes a dense block of JSON, checks that it is valid, and re-prints it with consistent indentation so you can actually read it. If something is wrong, it tells you where: the line, the column and what it expected to find.

The [JSON Formatter](/tools/json-formatter/) on BISCS India does three jobs in one screen: pretty-print, validate and minify. It runs entirely in your browser, which matters when the JSON you are debugging is a live API response with names, phone numbers or order details.

## What does a JSON formatter actually do?

JSON (JavaScript Object Notation) is the format almost every web API speaks, from UPI payment callbacks to weather services. Servers usually send it minified, with no spaces or line breaks, because that saves bandwidth. That is fine for machines and miserable for people.

A formatter parses the text into a data structure and prints it back out with indentation. Here is the same object before and after:

```json
{"order":{"id":"ORD-2041","city":"Kolkata","items":[{"sku":"TEA-250","qty":2}],"paid":true}}
```

```json
{
  "order": {
    "id": "ORD-2041",
    "city": "Kolkata",
    "items": [
      { "sku": "TEA-250", "qty": 2 }
    ],
    "paid": true
  }
}
```

Because the formatter has to parse the JSON first, it doubles as a validator. If parsing fails, you get an error instead of output.

## How to format JSON with BISCS India

1. Open the [JSON Formatter](/tools/json-formatter/).
2. Paste your JSON into the **Input JSON** box, drop a `.json` file onto it, or use **Upload**.
3. Choose an indent from the dropdown: 2 spaces, 4 spaces or Tab. Tick **Sort keys** if you want object keys in alphabetical order.
4. Click **Format**. The output appears on the right, along with a status line showing the type (object or array), number of keys, nesting depth and size.
5. Switch the output view to **Tree** if you want to expand and collapse nested objects instead of scrolling through text.
6. Use **Copy** or **Download** to save the result. Click **Minify** if you need the compact version instead.

The tool re-validates as you type, so you can fix an error and see the green "Valid JSON" badge appear straight away.

## How do I find the error in invalid JSON?

When parsing fails, the formatter shows a red "Invalid JSON" box with a plain-English message, the line and column, and a snippet of the offending line with a caret pointing at the problem. The **Go to error** button jumps your cursor to that character in the input.

Most JSON errors come from writing JavaScript-style objects by hand. The most common ones:

- **Trailing commas.** `[1, 2, 3,]` is valid JavaScript but invalid JSON. The message reads "Trailing comma before “]”".
- **Single quotes.** JSON strings and keys must use double quotes: `"name"`, never `'name'`.
- **Unquoted keys.** `{city: "Pune"}` must be `{"city": "Pune"}`.
- **Comments.** `//` and `/* */` are not part of JSON.
- **Line breaks inside strings.** A raw newline inside quotes is not allowed; it must be written as `\n`.
- **Special values.** `undefined`, `NaN` and `Infinity` do not exist in JSON. Use `null` or a string.
- **Two values side by side.** Pasting two JSON objects one after another, as often happens with log files, gives "Unexpected … after the end of the JSON value". Wrap them in an array or validate them one at a time.

A quick test you can run in any browser console shows the difference between JavaScript and JSON:

```js
JSON.parse('{"a": 1}');   // works
JSON.parse("{'a': 1}");   // SyntaxError: single quotes
JSON.parse('{"a": 1,}');  // SyntaxError: trailing comma
```

## Pretty-print or minify: which should you use?

| Situation | Use | Why |
| --- | --- | --- |
| Reading an API response | Pretty-print, 2 spaces | Easy to scan, compact enough on screen |
| Config file in a Git repo | Pretty-print, sorted keys | Cleaner diffs when values change |
| Sending a payload over the network | Minify | Fewer bytes per request |
| Embedding JSON in an environment variable | Minify | Must fit on one line |
| Comparing two responses | Pretty-print, sorted keys, then diff | Same order makes real changes stand out |

Sorting keys is especially useful before comparing two JSON files. Format both with **Sort keys** ticked, then paste them into the [Text Diff](/tools/text-diff/) tool, and only genuine differences will be highlighted.

## A note on large numbers

The tool shows a warning badge, "Large numbers may lose precision", when it sees long runs of digits. This is not a bug in the formatter. Browsers store every JSON number as a 64-bit floating point value, which can only represent integers exactly up to 9,007,199,254,740,991 (2^53 − 1).

Long numeric IDs, such as some bank reference numbers or social media post IDs, can be silently rounded when parsed. If you control the API, send such IDs as strings. If you do not, be careful about copying formatted output back into a system that needs the exact value.

## Practical tips for working with JSON

- **Use the Tree view for deep data.** GST e-invoice JSON, for example, nests seller, buyer and item details several levels deep. Collapsing branches makes it much easier to find one field.
- **Keep the Sample handy.** If you are learning JSON, click **Sample** to load a small example with objects, arrays, numbers, booleans and `null`, then try breaking it to see the error messages.
- **Validate before you deploy.** A single trailing comma in a `package.json` or a translation file can break a build. Pasting the file into a validator takes seconds.
- **Convert when a spreadsheet is the real goal.** If someone asks for "this data in Excel", run the JSON through [JSON to CSV](/tools/json-to-csv/) instead of formatting it by hand.
- **Minify for production assets.** For whole files, the [CSS / HTML / JSON Minifier](/tools/code-minifier/) shows exactly how many bytes you saved.

## Why formatting in the browser matters for privacy

Debugging often means pasting real data: customer records, internal API tokens inside a response, or payment webhook bodies. Many online formatters send that text to their server to process it, and you have no idea whether it is logged.

The BISCS India formatter uses your browser’s built-in `JSON.parse` and `JSON.stringify`. The text never leaves your device, and the page keeps working even if your connection drops after it loads. That said, if your organisation has rules about handling production data, those rules still apply.

## Limits worth knowing

The formatter handles files up to 50 MB when loaded from disk, but very large inputs will be slower to re-validate on a phone or older laptop. The tree view stops drawing after a few thousand nodes to keep the page responsive; the text output is unaffected. And because it follows the JSON standard strictly, it will not accept JSON5 or JSONC (JSON with comments) unless you remove the extra syntax first.
