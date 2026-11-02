{
  "tool": "find-and-replace",
  "slug": "find-and-replace-text-online-regex",
  "title": "Find and Replace Text Online, With Optional Regex Support",
  "description": "Replace a word, name or pattern across a whole document in one click. Covers match case, whole words and regex groups, with examples for dates and phones.",
  "keywords": ["find and replace online", "replace text online", "regex find and replace", "bulk replace words", "search and replace tool"],
  "summary": "To find and replace text online, paste your text, type the word to find and its replacement, preview the highlighted matches and click Replace all. BISCS India’s Find and Replace tool adds match case, whole-word and regular expression options with capture groups, plus undo, all running in your browser.",
  "faq": [
    { "q": "How do I replace a word only when it appears on its own?", "a": "Tick Whole words only. Then searching for art will match art but not part, start or article. The check understands letters in Hindi and other scripts too, so a whole-word search for a Hindi word will not match it inside a longer word." },
    { "q": "How do I delete every match instead of replacing it?", "a": "Leave the Replace with box empty and click Replace all. Every match is removed from the text. This is a quick way to strip a repeated footer line, a prefix such as +91, or a symbol you do not want." },
    { "q": "What is a regular expression and do I need one?", "a": "A regular expression, or regex, is a pattern language for matching text by shape rather than exact words, for example any 10-digit number. Most everyday jobs only need plain text replacement. Turn on regex when you need patterns, such as reformatting dates or removing all numbers." },
    { "q": "Can I undo a Replace all?", "a": "Yes. Click Undo above the text box to restore the version before the replacement. The tool keeps several earlier versions while the page is open, so you can try a replacement, check it and step back if it went wrong." },
    { "q": "Why does my regex show an error?", "a": "The pattern has a syntax problem, such as an unclosed bracket or a stray special character like a plus or question mark. The error message explains what went wrong. To search for those characters literally, put a backslash in front of them, or switch regex off and search as plain text." }
  ]
}
---
Find and replace lets you change every occurrence of a word or phrase in one go. Type what to find, type what to replace it with, check the highlighted matches, and click **Replace all**. It is the fastest way to fix a misspelt name, update a price throughout a document, or reformat data copied from somewhere else.

Word processors have this built in, but an online tool is handy when your text lives somewhere else: a WhatsApp export, a CSV file, code, an email draft or a website's content.

## How to find and replace text online

1. Open [Find and Replace](/tools/find-and-replace/).
2. Paste your text into the **Text** box on the left.
3. Type the word or phrase in **Find**. Matches are highlighted on the right, and a badge shows how many there are.
4. Type the new text in **Replace with**. Leave it empty if you want to delete the matches.
5. Switch the preview from **Matches** to **Result** to see exactly how the text will look.
6. Click **Replace all**. If something looks wrong, click **Undo**.
7. **Copy result** or **Download** the final text.

The preview updates as you type, so you can refine the search before changing anything.

## What do the three options do?

| Option | What it changes | Example |
|---|---|---|
| Match case | Only matches the exact capitals you typed | "GST" will not match "gst" |
| Whole words only | Ignores matches inside longer words | "rate" will not match "corporate" |
| Regular expression | Treats Find as a pattern, not plain text | `\d{10}` matches any 10-digit number |

By default the search ignores case and matches anywhere, which is what you want most of the time. Whole words is the option people forget, and it prevents embarrassing results like replacing "Ram" and accidentally changing "Ramesh" and "program".

## Everyday examples

**Correcting a name throughout a document.** A contract mentions "Mr. Sharma" 40 times but should say "Mr. Verma". Find "Sharma", replace with "Verma", tick Whole words, and check the preview.

**Updating a city or branch.** Moving an office from Mumbai to Pune? Paste the brochure text and replace every "Mumbai" in seconds. Watch for addresses that should stay unchanged.

**Removing a repeated phrase.** Text copied from a PDF often includes "Page 3 of 12" lines. With regex on, find `Page \d+ of \d+` and leave the replacement empty.

**Cleaning phone numbers.** Remove "+91 " from a contact list by finding "+91 " and replacing with nothing. Then use [Remove Duplicate Lines](/tools/remove-duplicate-lines/) to drop repeats.

**Changing separators.** Turn a comma-separated list into one item per line: with regex on, find `,\s*` and replace with `\n`.

## Using regular expressions: a gentle introduction

Regex is a mini-language for describing text patterns. You do not need to master it, but a few patterns go a long way.

| Pattern | Matches |
|---|---|
| `\d` | Any digit 0–9 |
| `\d{6}` | Exactly six digits, such as a PIN code |
| `\s+` | One or more spaces, tabs or line breaks |
| `[A-Z]{5}\d{4}[A-Z]` | Text shaped like a PAN number |
| `^` and `$` | Start and end of a line |
| `(…)` | A group you can reuse in the replacement |

In the **Replace with** box, regex mode understands:

- `$1`, `$2` and so on for the first, second captured group;
- `$<name>` for a named group;
- `$&` for the whole match;
- `\n` for a new line and `\t` for a tab.

### Example: reformatting dates

Suppose your text has dates like 15/03/2025 and you need 2025-03-15 for a spreadsheet import.

- Find: `(\d{2})/(\d{2})/(\d{4})`
- Replace with: `$3-$2-$1`

Each group captures one part of the date, and the replacement puts them back in a new order. Check the **Result** preview before applying.

If you want to build and test more complex patterns step by step, the [Regex Tester](/tools/regex-tester/) shows every match and group in detail.

## Common mistakes to avoid

- **Replacing inside other words.** Searching "in" and replacing with "IN" changes "India", "invoice" and "begin". Use Whole words only.
- **Forgetting special characters in regex.** A full stop in regex means "any character", so `Rs.` also matches "Rs5" or "Rsx". Write `Rs\.` to match the dot itself, or turn regex off.
- **Not checking the count.** If you expected 5 matches and the badge says 37, stop and look before replacing.
- **Replacing over and over.** Running "Replace all" twice with a replacement that contains the search word, for example "Ltd" to "Ltd.", can double things up. Use the preview and Undo.
- **Working on the only copy.** For important files, keep the original text safe until you have checked the result.

## Tips for larger documents

- Replacing in a Word or PDF file? Copy the text out, replace here, and paste it back. For PDFs, extract text first with [PDF to Text](/tools/pdf-to-text/).
- The match badge counts up to 10,000 matches, which covers almost any real document.
- To compare the original and replaced versions line by line, paste both into [Text Compare](/tools/text-diff/).
- Use the **Matches** view with alternating highlight colours to spot neighbouring matches that run together.

## Online tool or your word processor?

Microsoft Word (Ctrl + H), Google Docs and most code editors have their own find and replace. If your text is already in one of them and you only need a plain word swap, use it there.

An online tool earns its place in a few situations:

- **On a phone.** Mobile apps often hide replace options or lack them entirely. Here you paste, replace and copy in a few taps.
- **Text without a home.** A WhatsApp chat export, a list copied from a website or an email draft is quicker to fix here than in a new document.
- **Regex without setup.** Google Docs supports regular expressions, but Word uses its own wildcard system. This tool uses standard JavaScript regex, the same syntax you will find in most tutorials.
- **Seeing everything first.** The live highlight and match count let you check every hit before anything changes.

## Is it safe for confidential text?

Yes. [Find and Replace](/tools/find-and-replace/) runs in your browser, and the text you paste is not uploaded to or stored by BISCS India. That makes it suitable for contracts, salary sheets and customer lists. The undo history exists only while the page is open, and closing the tab clears everything.
