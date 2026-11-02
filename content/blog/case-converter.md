{
  "tool": "case-converter",
  "slug": "convert-text-case-upper-lower-title",
  "title": "Case Converter: Change Text to UPPER, lower or Title Case",
  "description": "Fix text typed in caps lock, format headings in Title Case, or turn names into camelCase and snake_case. Free in-browser case converter with undo.",
  "keywords": ["case converter", "convert uppercase to lowercase", "title case converter", "sentence case online", "camelcase to snake case"],
  "summary": "To change the case of text, paste it into a case converter and click the style you want, such as UPPER CASE, lower case, Title Case or Sentence case. BISCS India’s Case Converter also handles camelCase, snake_case and kebab-case line by line, with undo, and runs entirely in your browser.",
  "faq": [
    { "q": "What is the difference between Title Case and Sentence case?", "a": "Title Case capitalises the main words of a heading, as in How to File Your Income Tax Return, while leaving short words like of, and, to in lower case. Sentence case capitalises only the first word and proper nouns, as in How to file your income tax return. News sites and government pages increasingly prefer sentence case." },
    { "q": "Will the converter keep names like Delhi or GST in capitals?", "a": "Not automatically. A tool cannot know which words are proper nouns or acronyms, so Sentence case and lower case will turn GST into gst and Delhi into delhi. After converting, scan the result and fix names, brands and abbreviations by hand. The undo button lets you step back if needed." },
    { "q": "Can I convert a list of variable names at once?", "a": "Yes. The programming styles, camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case, work line by line. Paste one name per line, click a style, and every line is converted separately, which is handy for database columns, JSON keys or CSS class names." },
    { "q": "Does it work with Hindi or other scripts?", "a": "Scripts such as Devanagari, Bengali and Tamil do not have upper and lower case, so those letters stay as they are. Any English words mixed into the text are converted normally. Accented Latin letters, such as those in French or German names, are handled correctly." },
    { "q": "How do I undo a conversion?", "a": "Click Undo above the text box. The tool remembers up to 50 previous versions of your text in the current session, so you can try several styles and step back through them. Clearing the page or closing the tab removes that history." }
  ]
}
---
A case converter changes the capitalisation of text without retyping it. Paste a paragraph typed with caps lock on, click **lower case** or **Sentence case**, and it is fixed in one go. The same tool can turn a heading into Title Case or a list of field names into `snake_case` for code.

It is one of those small tools that saves real time, especially when text arrives from forms, spreadsheets or old documents where nobody cared about consistent capitals.

## Which text cases can you convert to?

The BISCS India [Case Converter](/tools/case-converter/) offers twelve styles, split into everyday writing and programming formats.

| Style | Example | Typical use |
|---|---|---|
| UPPER CASE | PAY BEFORE 20 JULY | Notices, short labels, form fields that demand capitals |
| lower case | pay before 20 july | Cleaning up shouty text before editing |
| Title Case | How to Apply for a PAN Card | Blog titles, book and report headings |
| Sentence case | How to apply for a PAN card | Body text, news-style headlines, buttons |
| aLtErNaTiNg | pAy BeFoRe | Memes and playful social posts |
| iNVERSE cASE | pAY bEFORE | Fixing text typed with caps lock accidentally on |
| camelCase | invoiceTotalAmount | JavaScript and Java variables |
| PascalCase | InvoiceTotalAmount | Class and component names |
| snake_case | invoice_total_amount | Python, database columns |
| kebab-case | invoice-total-amount | URLs, CSS classes, file names |
| CONSTANT_CASE | INVOICE_TOTAL_AMOUNT | Environment variables, constants |
| dot.case | invoice.total.amount | Config keys, some translation files |

Notice that the PAN acronym in the examples above would not survive a blanket lower-case conversion. More on that below.

## How to change text case online

1. Open the [Case Converter](/tools/case-converter/).
2. Paste or type your text into the box. The word and character count appears above it.
3. Click the style you want from the grid of buttons. The text is converted in place.
4. Not quite right? Press **Undo** to go back, then try another style.
5. Press **Copy** to put the result on your clipboard, or **Download** to save it as a `.txt` file.

Everything runs inside your browser tab, so customer names, addresses or internal notes you paste are not uploaded anywhere.

## Title Case vs Sentence case: which should you use?

Both are correct, and style guides disagree, so the main rule is to pick one and be consistent.

**Title Case** gives headings a formal, traditional look. The BISCS converter follows the common convention of leaving short words such as "a", "an", "the", "and", "of", "in", "to" and "with" in lower case, unless they are the first or last word or come straight after a colon. So "a guide to gst for small shops" becomes "A Guide to Gst for Small Shops".

**Sentence case** reads more naturally and is easier to scan, which is why many government portals, apps and news sites use it for headings and buttons. The converter capitalises the first letter after each full stop, question mark, exclamation mark or Hindi purna viram, and fixes a lone "i" to "I".

Look at that Title Case example again: "Gst" is wrong. That leads to the most important tip.

## Common mistakes to avoid

- **Losing acronyms and proper nouns.** No converter can tell that GST, PAN, UPI, Kolkata or your company name should stay as they are. Always proofread after converting and fix them by hand.
- **Using UPPER CASE for long text.** Paragraphs in capitals are harder to read and come across as shouting in emails and WhatsApp messages. Keep capitals for short labels.
- **Converting code that is already mixed.** The programming styles split words at spaces, punctuation and changes from lower to upper case, so `HTTPServerError` becomes `http_server_error`. Check edge cases like version numbers.
- **Expecting Indian scripts to change.** Hindi, Bengali, Tamil and most Indian scripts have no capital letters, so they are left untouched.

## Tips for developers and data work

The programming styles treat each line separately. That makes the tool handy for bulk renaming:

- Paste the header row of a spreadsheet, one column name per line, and convert to `snake_case` before importing into a database.
- Turn a list of labels like "First Name", "Date of Birth" and "PAN Number" into `camelCase` JSON keys: `firstName`, `dateOfBirth`, `panNumber`.
- Convert component names to `kebab-case` for file names and CSS classes.

If you are building URLs from page titles, the dedicated [Slug Generator](/tools/slug-generator/) is a better fit because it also strips punctuation, handles accents and can drop stop words. When you need to rename one term throughout a long file rather than change case, use [Find and Replace](/tools/find-and-replace/).

## Fixing text copied from forms and spreadsheets

Data entered by many different people is rarely consistent. A customer list may contain "RAMESH KUMAR", "priya sharma" and "Anil  verma" in the same column. A quick clean-up routine looks like this:

1. Paste the column into the Case Converter and choose **Title Case** for names.
2. Copy the result into the [Whitespace Cleaner](/tools/whitespace-cleaner/) to remove the double spaces.
3. Check initials and surnames such as "D'Souza" or "McDonald", which may need a manual fix.

For addresses, keep in mind that PIN codes and state abbreviations like "WB" or "MH" need to stay in capitals.

## Does the case converter save my text?

No. The conversion happens with JavaScript in your browser, so nothing is sent to BISCS India's servers. The undo history lasts only while the page is open, up to 50 steps, and disappears when you close the tab or clear the box.

That makes it suitable for working on client lists, unpublished articles or internal documents, though as always it is wise to use your own device for anything sensitive.
