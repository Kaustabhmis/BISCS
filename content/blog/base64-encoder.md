{
  "tool": "base64-encoder",
  "slug": "base64-encode-decode-explained",
  "title": "Base64 Encode and Decode Online: What It Is and When to Use It",
  "description": "Learn what Base64 is, why it is encoding and not encryption, and how to encode or decode text and files, including URL-safe Base64 and Unicode text.",
  "keywords": ["base64 encode", "base64 decode online", "what is base64", "base64 to text", "url safe base64"],
  "summary": "Base64 converts any data, including images or Unicode text, into a string of 64 safe ASCII characters so it can travel through systems built for text. It is encoding, not encryption: anyone can decode it. BISCS India's Base64 tool encodes and decodes text or files, with URL-safe mode, entirely in your browser.",
  "faq": [
    { "q": "Is Base64 a form of encryption?", "a": "No. Base64 is a reversible encoding with no key or secret. Anyone who sees a Base64 string can decode it in seconds. Never use it to hide passwords, API keys or personal data. If you need secrecy, use real encryption such as AES, and transport data over HTTPS." },
    { "q": "Why is Base64 output bigger than the original?", "a": "Base64 represents every 3 bytes of input as 4 characters, so output is about 33% larger, plus up to two = padding characters. A 300 KB image becomes roughly 400 KB of Base64 text. That overhead is why embedding large images as Base64 in web pages is usually a bad idea." },
    { "q": "What is URL-safe Base64?", "a": "Standard Base64 uses + and /, which have special meanings in URLs. URL-safe Base64, also called base64url, replaces them with - and _ and usually drops the = padding. JSON Web Tokens use this variant. The BISCS India decoder accepts both forms automatically." },
    { "q": "Why does decoding give me garbled text?", "a": "The original data was probably binary, such as an image, PDF or compressed file, rather than text. The tool detects this and warns you. Use Download to save the decoded bytes as a file, then rename it with the correct extension if you know what it is." },
    { "q": "Why does btoa() fail on Hindi or emoji text?", "a": "The browser function btoa only accepts characters in the Latin-1 range. To encode Unicode text you must first convert it to UTF-8 bytes, for example with TextEncoder, and then Base64-encode those bytes. The BISCS India tool does this automatically, so any language works." }
  ]
}
---
Base64 is a way of writing any data, whether text, an image or a PDF, using only 64 plain characters: `A–Z`, `a–z`, `0–9`, `+` and `/`. It exists because many systems, from email to JSON to HTML, were built to carry text and can corrupt raw binary bytes.

The most important thing to know is that Base64 is **encoding, not encryption**. It hides nothing. The [Base64 Encode / Decode](/tools/base64-encoder/) tool on BISCS India converts both ways in your browser, handles Hindi, Bengali and emoji correctly, and can turn whole files into Base64 strings.

## How does Base64 work?

Computers store data as bytes of 8 bits. Base64 takes 3 bytes (24 bits) at a time, splits them into four 6-bit groups, and maps each group to one of 64 characters. When the input length is not a multiple of 3, the output is padded with one or two `=` signs.

The word `Hi!` is three bytes, so it becomes exactly four characters:

```text
Hi!      ->  SGkh
Hello    ->  SGVsbG8=
```

Because 3 bytes become 4 characters, Base64 output is always about one third larger than the input.

## Where you will meet Base64

- **Data URLs.** Small images embedded directly in CSS or HTML, such as `data:image/png;base64,iVBORw0…`.
- **Email attachments.** MIME email encodes attachments in Base64, wrapped at 76 characters per line.
- **JSON Web Tokens.** The header and payload of a JWT are base64url-encoded JSON.
- **HTTP Basic authentication.** The `Authorization: Basic …` header carries `username:password` in Base64, which is exactly why it must only be sent over HTTPS.
- **APIs that accept files.** Some government and business APIs, including several used for e-invoicing and document upload, expect file contents as a Base64 string inside JSON.

## Encoding is not encryption

This is the mistake that causes real security incidents. A developer stores an API key or password as Base64 in a config file or front-end code, thinking it is "encrypted". It is not. Decoding it is one click:

```js
atob('cGFzc3dvcmQxMjM=');  // "password123"
```

Use Base64 to make data **transportable**, never to make it **secret**. For secrecy you need encryption with a key; for storing passwords you need a slow password hash such as bcrypt or Argon2.

## How to encode or decode with BISCS India

1. Open [Base64 Encode / Decode](/tools/base64-encoder/).
2. Choose **Encode** or **Decode** at the top.
3. Type or paste your text into the left box. The result appears instantly on the right, with the byte size of each side.
4. Optional: tick **URL-safe (- _ no padding)** for base64url output, or **Wrap lines at 76 chars** for email-style formatting.
5. Use **Swap** to send the output back to the input and flip the mode, which is a quick way to check a round trip.
6. Click **Copy**, or **Download** to save the result. When decoding binary data, Download saves the original bytes.

### Encoding a file

Scroll to **File to Base64**, choose a file (up to 25 MB) and the Base64 appears in the output box. Keep **Include data: URL prefix** ticked if you want a ready-to-use `data:` URL, or untick it for the bare Base64 string that most APIs expect. For images specifically, the [Image to Base64](/tools/image-to-base64/) tool adds previews and ready-made HTML and CSS snippets.

## Unicode: why the Sample uses ₹ and नमस्ते

The browser’s built-in `btoa()` function throws an error on any character outside Latin-1, which rules out Hindi, Tamil, the rupee sign and emoji. The correct approach is to convert the text to UTF-8 bytes first:

```js
const bytes = new TextEncoder().encode('₹ नमस्ते');
const b64 = btoa(String.fromCharCode(...bytes));
```

The tool does this for you. When decoding, it checks that the bytes are valid UTF-8. If they are not, it shows a warning that the data is binary and offers a download instead of printing gibberish.

## Standard vs URL-safe Base64

| | Standard | URL-safe (base64url) |
| --- | --- | --- |
| Characters 62 and 63 | `+` and `/` | `-` and `_` |
| Padding | `=` at the end | Usually omitted |
| Used in | Email, data URLs, most APIs | JWTs, URL parameters, file names |

The decoder accepts either variant, ignores whitespace and line breaks, and strips a leading `data:…;base64,` prefix automatically.

## How do I tell if a string is Base64?

There is no foolproof test, because many ordinary words are technically valid Base64. But a few signs are strong hints:

- The string uses only letters, digits, `+` and `/` (or `-` and `_` for the URL-safe form), with no spaces.
- Its length is a multiple of 4, often ending in one or two `=` signs.
- It starts with a familiar prefix. `iVBORw0KGgo` is the start of every PNG image, `/9j/` is a JPEG, `JVBERi0` is a PDF, and `eyJ` is how JSON beginning with `{"` followed by a letter usually encodes, which is why so many tokens start with those three letters.

The quickest check is to paste it into the decoder. If the result is readable text or JSON, you have your answer. If the tool reports binary data, use **Download** and open the file to see what it contains.

## Common mistakes with Base64

- **Treating it as security.** Covered above, but worth repeating.
- **Embedding big images as data URLs.** The 33% size increase and loss of browser caching usually make pages slower. Inline only tiny icons.
- **Double encoding.** Encoding an already-encoded string produces valid but useless output. If a decoded result still looks like Base64, it was encoded twice.
- **Mixing up Base64 and URL encoding.** A `+` in standard Base64 inside a URL may be read as a space. Use URL-safe Base64, or percent-encode the string with the [URL Encode / Decode](/tools/url-encoder/) tool.
- **Breaking padding.** Removing or adding `=` characters by hand can make strict decoders reject the string.

## Privacy

Encoding happens in your browser with JavaScript. Text you type and files you select are never uploaded. That matters, because the strings people decode are often tokens and credentials. If you are inspecting a JWT, the [JWT Decoder](/tools/jwt-decoder/) splits it into header and payload for you, again without sending it anywhere.
