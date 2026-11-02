{
  "tool": "url-encoder",
  "slug": "url-encode-decode-percent-encoding",
  "title": "URL Encode and Decode: Percent-Encoding Explained Simply",
  "description": "What %20 and %26 mean, when to use encodeURIComponent vs encodeURI, why spaces become + in forms, and how to encode or decode URLs safely online.",
  "keywords": ["url encode", "url decode online", "percent encoding", "encodeuricomponent vs encodeuri", "query string encoder"],
  "summary": "URL encoding, or percent-encoding, replaces characters that are unsafe in a web address with a % sign and their byte value in hex, so a space becomes %20 and & becomes %26. BISCS India's URL Encode / Decode tool converts both ways, supports component and full-URL modes, and breaks any URL into its parts in your browser.",
  "faq": [
    { "q": "What does %20 mean in a URL?", "a": "%20 is the percent-encoded form of a space character. Spaces are not allowed in URLs, so they are replaced by a percent sign followed by the character’s hexadecimal byte value, which is 20 for a space. In HTML form submissions, a space may instead appear as a plus sign." },
    { "q": "Should I use encodeURI or encodeURIComponent?", "a": "Use encodeURIComponent for a single piece of a URL, such as one query parameter value or a path segment, because it also encodes reserved characters like &, = and /. Use encodeURI only for a complete URL that is already correctly structured, since it leaves those structural characters alone." },
    { "q": "Why do I see a + instead of a space in some URLs?", "a": "HTML forms submitted with the application/x-www-form-urlencoded format encode spaces as + rather than %20. Both are common in query strings. When decoding form data, tick the Spaces as + option so that plus signs are turned back into spaces instead of being kept as literal plus characters." },
    { "q": "Why is my Hindi text in a URL shown as lots of % codes?", "a": "Non-ASCII characters are first converted to UTF-8 bytes, and each byte is then percent-encoded. A single Devanagari letter takes three bytes in UTF-8, so it becomes three %XX groups. Browsers often display the readable version in the address bar but send the encoded form." },
    { "q": "Can URL encoding break a link if done twice?", "a": "Yes. Encoding an already-encoded URL turns each % into %25, so %20 becomes %2520 and the server receives the wrong text. If you see %25 in a link, it has probably been double-encoded. Decode it once and check that the result looks right." }
  ]
}
---
URL encoding, properly called percent-encoding, is how web addresses carry characters that would otherwise break them. A space becomes `%20`, an ampersand becomes `%26`, and the rupee sign becomes `%E2%82%B9`. Each `%XX` is one byte written in hexadecimal.

You need it whenever you put user text, search terms or another URL inside a link. The [URL Encode / Decode](/tools/url-encoder/) tool on BISCS India converts both ways, lets you choose between component and full-URL encoding, and includes a URL parser that splits any address into its parts.

## Why do URLs need encoding at all?

A URL has structure. The `?` starts the query string, `&` separates parameters, `=` joins a key to its value, `#` starts a fragment and `/` separates path segments. If your data contains any of these characters, the browser and server cannot tell data from structure.

Imagine a search for "salt & pepper" on a shopping site:

```text
https://shop.example.com/search?q=salt & pepper&sort=price
```

The server sees a parameter `q` with value `salt `, then a broken parameter called ` pepper`. Encoded properly, it is unambiguous:

```text
https://shop.example.com/search?q=salt%20%26%20pepper&sort=price
```

## encodeURIComponent vs encodeURI

JavaScript has two built-in functions, and the tool offers both under **Type**.

| Function | Leaves alone | Use for |
| --- | --- | --- |
| `encodeURIComponent` | Letters, digits and `- _ . ! ~ * ' ( )` | One parameter value, a path segment, a URL inside another URL |
| `encodeURI` | All of the above plus `; , / ? : @ & = + $ #` | A whole URL that is already correctly built |

The rule of thumb: encode each **piece** with `encodeURIComponent`, then join the pieces. Using `encodeURI` on a parameter value is a classic bug, because it leaves `&` and `=` unencoded.

```js
const city = 'Mumbai & Thane';
const url = 'https://api.example.com/stores?city=' + encodeURIComponent(city);
// https://api.example.com/stores?city=Mumbai%20%26%20Thane
```

For building URLs in code, the `URLSearchParams` object handles this for you and is usually the cleanest option.

## How to encode or decode a URL with BISCS India

1. Open [URL Encode / Decode](/tools/url-encoder/).
2. Choose **Encode** or **Decode**.
3. Select the **Type**: **Component (encodeURIComponent)** for a single value, or **Full URL (encodeURI)** for a whole address.
4. Tick **Spaces as + (form encoding)** if you are working with HTML form data.
5. Paste your text or URL into **Input**. The **Output** updates as you type.
6. Click **Copy**, or **Swap** to move the output back into the input and reverse the direction.

If decoding fails, for example because of a stray `%` not followed by two hex digits, the tool tells you instead of returning half-decoded text.

## Using the URL parser

Below the encoder is a **URL parser**. Paste any address and it breaks it into protocol, username, password, host, port, path, query and fragment, then lists every query parameter in a table with its decoded value.

This is handy for:

- Reading long tracking links from ad platforms or emails to see what is really in them.
- Debugging an API call where one parameter seems to be missing.
- Checking repeated parameters, such as `tags=silk&tags=wedding`, which the table shows as separate rows.

If you build campaign links regularly, the [UTM Link Builder](/tools/utm-builder/) creates correctly encoded tracking URLs from a simple form.

## Which characters are safe in a URL without encoding?

The URL standard defines a small set of "unreserved" characters that never need encoding: the letters `A–Z` and `a–z`, the digits `0–9`, and four symbols, hyphen, full stop, underscore and tilde. Everything else either has a structural job (the reserved characters such as `/ ? # & =`) or is simply not allowed, like spaces, quotation marks, angle brackets and any non-ASCII character.

That is why a well-chosen slug such as `/blog/gst-invoice-format` travels everywhere untouched, while a path like `/files/Annual Report 2025.pdf` has to become `/files/Annual%20Report%202025.pdf`. If you control the names of pages and files, sticking to lowercase letters, digits and hyphens avoids encoding problems entirely.

## How do other languages encode URLs?

Most programming languages have an equivalent of `encodeURIComponent`, but the defaults differ slightly, which is a common source of mismatched signatures and broken API calls:

- **Python:** `urllib.parse.quote(value, safe='')` encodes a component; `urllib.parse.urlencode()` builds a whole query string and uses `+` for spaces.
- **PHP:** `rawurlencode()` follows the standard with `%20` for spaces, while `urlencode()` uses `+`, form-style.
- **Java:** `URLEncoder.encode(value, StandardCharsets.UTF_8)` is designed for form data, so it also turns spaces into `+`.

When two systems disagree on a value, paste both versions into the decoder. If one shows `+` and the other `%20`, you have found the difference, and you can tick or untick **Spaces as +** to match the system you are talking to.

## What happens to Indian-language text?

URLs travel as ASCII. Non-ASCII text is first converted to UTF-8 bytes, and each byte is percent-encoded. Devanagari, Bengali and Tamil characters use three bytes each, so a short Hindi word turns into a long string of `%E0%A4…` codes.

Modern browsers display the readable form in the address bar, but copy-paste often gives you the encoded form. The decoder turns it back. For website page addresses, plain English slugs are usually easier to share; the [Slug Generator](/tools/slug-generator/) can create one from any title.

## Common mistakes with URL encoding

- **Double encoding.** Encoding an already-encoded string turns `%20` into `%2520`. If a server shows `%20` literally on the page, something encoded twice.
- **Encoding the whole URL with encodeURIComponent.** This turns `https://` into `https%3A%2F%2F` and the link stops working. Only use component encoding on pieces.
- **Forgetting to encode user input.** A customer name like `D'Souza & Sons` will break a query string if inserted raw.
- **Mixing up + and %20.** In a path, `+` is a literal plus. In form-encoded query strings, it means space. Know which context you are in.
- **Confusing URL encoding with Base64.** They solve different problems. For binary data in a URL, use URL-safe Base64 from the [Base64 Encode / Decode](/tools/base64-encoder/) tool.

## Privacy

Links frequently contain session tokens, email addresses or reset codes in their query strings. The encoder and the parser run entirely in your browser using the standard `encodeURIComponent`, `decodeURIComponent` and `URL` functions, so nothing you paste is uploaded or logged.
