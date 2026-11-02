{
  "tool": "regex-tester",
  "slug": "regex-tester-javascript-patterns-india",
  "title": "Regex Tester: Test JavaScript Regular Expressions Live",
  "description": "Test regular expressions with live highlighting, capture groups and replace preview. Includes patterns for Indian mobile numbers, PAN, GSTIN and PIN codes.",
  "keywords": ["regex tester", "regular expression tester online", "javascript regex test", "regex for indian mobile number", "pan card regex"],
  "summary": "A regex tester lets you type a regular expression and instantly see what it matches in sample text, including capture groups and the result of a replacement. BISCS India's Regex Tester uses the JavaScript regex engine, supports all flags, and includes presets for Indian mobile numbers, PAN, GSTIN, IFSC and PIN codes, all running in your browser.",
  "faq": [
    { "q": "Which regex flavour does this tester use?", "a": "It uses your browser’s JavaScript (ECMAScript) regex engine, the same one used by Node.js and front-end code. Most syntax is shared with Python, Java and PCRE, but there are differences, for example in lookbehind support in older engines, possessive quantifiers and some flags. Test in your target language before relying on edge cases." },
    { "q": "Why does my regex match only the first occurrence?", "a": "Without the g (global) flag, JavaScript stops after the first match. Tick global to find every match. Note that with g, methods like test and exec remember their position through lastIndex, which can cause surprising results when you reuse the same regex object in code." },
    { "q": "Is there a regex that fully validates an email address?", "a": "Not a practical one. The official email address rules are very permissive, so any short regex will either reject some valid addresses or accept some invalid ones. Use a simple pattern to catch obvious typos, then confirm the address by sending a verification email." },
    { "q": "Can a regex verify that a PAN or GSTIN is genuine?", "a": "No. A regex checks only the format, such as five letters, four digits and a letter for PAN. It cannot tell whether the number was actually issued. GSTINs also include a check digit that a regex cannot calculate. Use a proper validator and, for compliance, the official government portal." },
    { "q": "What does catastrophic backtracking mean?", "a": "Some patterns with nested repetition, such as (a+)+ followed by something that fails, make the engine try an enormous number of combinations, so it freezes on certain inputs. This can be exploited to slow down servers. Avoid nested quantifiers on overlapping patterns and test with long non-matching strings." }
  ]
}
---
A regex tester is a scratchpad for regular expressions. You type a pattern, paste some sample text, and every match lights up as you type, with its position and capture groups listed underneath. It turns regex writing from guesswork into a quick feedback loop.

The [Regex Tester](/tools/regex-tester/) on BISCS India uses the JavaScript regex engine built into your browser, supports every standard flag, previews replacements, and comes with ready-made patterns for things Indian developers validate all the time: mobile numbers, PIN codes, PAN, GSTIN and IFSC.

## What is a regular expression?

A regular expression (regex) is a compact pattern that describes text. `\d{6}` means "six digits". `[A-Z]{5}` means "five capital letters". Combine pieces and you can find, validate or reshape text in ways that would take dozens of lines of ordinary code.

Here is the pattern the tester uses for an Indian PIN code:

```text
\b[1-9][0-9]{5}\b
```

Read left to right: a word boundary, a digit from 1 to 9 (PIN codes never start with 0), five more digits, and another word boundary so it does not match the middle of a longer number.

## How to test a regex with BISCS India

1. Open the [Regex Tester](/tools/regex-tester/).
2. Type your pattern in the **Regular expression** box, between the slashes. You can also paste a full literal such as `/\d+/gi`, and the flags are picked up automatically.
3. Tick the flags you need: **g** (global), **i** (ignore case), **m** (multiline), **s** (dotAll), **u** (unicode) and **y** (sticky).
4. Paste text into **Test string**. Matches are highlighted in alternating colours so neighbouring matches are easy to tell apart, and a badge shows the count.
5. Check **Match details** for each match’s position and capture groups, including named groups. **Copy matches** copies every match, one per line.
6. To transform text, type a replacement in the **Replace** box using `$1`, `$<name>` or `$&`, and see the result immediately. **Copy result** grabs the output.

If the pattern has a syntax error, such as an unclosed bracket, the error message appears in place of the highlights.

## Ready-made patterns for Indian data

The **Common patterns** menu loads a preset pattern with the right flags. These are useful starting points:

| Preset | Pattern | Matches |
| --- | --- | --- |
| Indian mobile number | `[6-9]\d{9}` with an optional +91 or 0 prefix | 98XXXXXXXX, +91 98XXXXXXXX, 098XXXXXXXX |
| PIN code | `\b[1-9][0-9]{5}\b` | 700001, 560034 |
| PAN | `\b[A-Z]{5}[0-9]{4}[A-Z]\b` | ABCDE1234F |
| IFSC code | `\b[A-Z]{4}0[A-Z0-9]{6}\b` | Four letters, a zero, six characters |
| Date (DD/MM/YYYY) | Day, month and year with `/`, `-` or `.` | 31/03/2026 |

There are also presets for email addresses, URLs, ISO dates with named groups, IPv4 addresses, hex colours and hashtags.

Remember that a format check is not proof of validity. A PAN regex cannot tell whether a PAN was issued, and a GSTIN has a check digit that a regex cannot compute. For those, use a dedicated checker such as the [GSTIN Validator](/tools/gstin-validator/) or the [PAN & IFSC Checker](/tools/pan-ifsc-validator/).

## Tip: test a whole list at once

When you are building a validation pattern for a form field, paste a list of real-looking values into the test string, one per line, including the ones that should fail. For a mobile number field, that might be a correct ten-digit number, one with +91, one with a space in the middle, a landline with an STD code and a nine-digit typo.

Then anchor the pattern with `^` and `$` and tick **m (multiline)**, so each line is tested as a separate value. You can see at a glance which lines match and which do not. Keep the list somewhere handy; when someone reports that a valid number was rejected, add it to the list and re-test before changing the pattern.

## Understanding the flags

- **g (global)** finds all matches instead of stopping at the first.
- **i (ignore case)** treats `a` and `A` as the same.
- **m (multiline)** makes `^` and `$` match at the start and end of each line, not just the whole text. Essential when testing a list of values, one per line.
- **s (dotAll)** lets `.` match line breaks too.
- **u (unicode)** treats characters outside the basic range, such as emoji, as single characters and enables `\p{…}` property escapes. For example, `\p{Script=Devanagari}+` with the `u` flag matches Hindi words.
- **y (sticky)** only matches at the exact current position. Mostly useful for writing tokenisers.

## Capture groups and replacement: a practical example

Suppose you have dates written as `31/03/2026` and need them in ISO format, `2026-03-31`, for a database import. Use this pattern with the **g** flag:

```text
(\d{2})/(\d{2})/(\d{4})
```

And this replacement:

```text
$3-$2-$1
```

Each pair of brackets captures a piece, numbered from left to right. Named groups make this more readable:

```js
const re = /(?<d>\d{2})\/(?<m>\d{2})\/(?<y>\d{4})/g;
'Due 31/03/2026'.replace(re, '$<y>-$<m>-$<d>');  // "Due 2026-03-31"
```

For simple literal swaps across a whole document, the [Find and Replace](/tools/find-and-replace/) tool may be quicker.

## Common regex mistakes

- **Forgetting anchors when validating.** `\d{6}` matches inside `1234567`. To validate a whole field, use `^\d{6}$`.
- **Unescaped dots.** `.` means "any character". To match a literal full stop, as in a domain name, write `\.`.
- **Greedy matching.** `".+"` on `"Pune" and "Nagpur"` matches everything from the first quote to the last. Use the lazy `".+?"` to stop at the first closing quote.
- **Escaping twice or not at all in code.** In a JavaScript string, `"\d"` loses its backslash. Use a regex literal `/\d/` or write `"\\d"` in strings.
- **Catastrophic backtracking.** Patterns like `(\w+)+$` can freeze on long inputs that almost match. Keep quantifiers simple and test with long, non-matching text.
- **Trying to parse HTML or JSON with regex.** Use a real parser. Regex is great for extracting simple tokens, not nested structures.

## Privacy and limits

The tester runs your pattern against your text inside the browser; nothing is uploaded. To keep the page responsive, it stops highlighting after 5,000 matches and lists the first 500 in the details table. And because it uses the JavaScript engine, a pattern that works here may need small changes for Python, Java or a database.
