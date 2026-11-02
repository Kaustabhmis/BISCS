{
  "tool": "text-diff",
  "slug": "compare-two-texts-find-differences",
  "title": "Compare Two Texts and Find the Differences Online",
  "description": "Spot every added, removed or changed line between two versions of a document, with word-level highlights. Free text compare tool that runs in your browser.",
  "keywords": ["compare text online", "text difference checker", "diff checker", "compare two documents", "find changes between texts"],
  "summary": "To compare two texts, paste the original in one box and the new version in the other, and a diff checker highlights what was added, removed or changed. BISCS India’s Text Compare tool shows line-by-line differences with changed words highlighted, can ignore case and spacing, and works entirely in your browser.",
  "faq": [
    { "q": "Can I compare two Word or PDF files?", "a": "Copy the text out of each file and paste it into the two boxes. For PDFs, the PDF to Text tool extracts the text first. Formatting such as bold or fonts is not compared, only the words and lines, which is usually what matters when checking a contract or draft." },
    { "q": "What does Ignore whitespace do?", "a": "It treats lines as equal when they differ only in spaces, tabs or extra spacing, for example when one version has double spaces after full stops. This hides noise so you can focus on real wording changes. Turn it off when spacing matters, such as in code or fixed-width data." },
    { "q": "Why does a small edit show as a removed line and an added line?", "a": "The comparison works line by line, so a changed line is shown as the old line removed and the new line added. With Highlight changed words on, the exact words that differ within that pair are marked, so you can still see the small edit at a glance." },
    { "q": "Is there a size limit for comparing texts?", "a": "There is no upload limit because nothing is uploaded, but very large texts that differ almost everywhere can be too slow to compare in a browser. If that happens, the tool tells you, and you can compare the documents in smaller sections." },
    { "q": "Can I save the result of the comparison?", "a": "Yes. Copy diff copies a plain text summary where removed lines start with a minus sign and added lines with a plus sign. Download .diff saves the same summary as a file you can share with a colleague or attach to an email." }
  ]
}
---
A text compare tool, often called a diff checker, shows exactly what changed between two versions of a text. Paste the original on the left and the new version on the right. Lines that were removed are marked in red, lines that were added are marked in green, and within a changed line the specific words that differ are highlighted.

It answers a question that is surprisingly hard to settle by reading: "What did they actually change?"

## When do you need to compare two texts?

- **Contracts and agreements.** A rental agreement or vendor contract comes back "with minor edits". A diff shows whether a clause on the security deposit or notice period quietly changed.
- **Assignments and theses.** Students and guides can see what was revised between drafts.
- **Website and app content.** Check that a translated or updated page did not drop a paragraph.
- **Policies and notices.** HR teams can show staff exactly which lines of a leave policy changed.
- **Code and configuration.** Developers compare two versions of a config file or snippet when version control is not available.
- **Data exports.** Compare two lists of GSTINs, roll numbers or product codes to find additions and removals.

## How to compare two texts online

1. Open [Text Compare](/tools/text-diff/).
2. Paste the **Original text** into the left box.
3. Paste the **Changed text** into the right box.
4. The differences appear below straight away, with a summary such as "+3 added, −2 removed, 14 unchanged".
5. Adjust the options: **Ignore whitespace**, **Ignore case**, **Highlight changed words** and **Only show changes**.
6. Use **Swap** if you pasted them the wrong way round.
7. Click **Copy diff** or **Download .diff** to save the result.

Each row shows the line number in the original, the line number in the new version, a plus or minus sign, and the text itself.

## Reading the results

| Colour or symbol | Meaning |
|---|---|
| Green row with + | Line exists only in the changed text (added) |
| Red row with − | Line exists only in the original (removed) |
| Plain row | Line is the same in both |
| Darker highlight inside a row | The exact words that changed in that line |
| Grey bar with ⋯ | Unchanged lines hidden in "Only show changes" mode |

When a line is edited rather than fully replaced, you will see the old version in red directly above the new version in green. With **Highlight changed words** ticked, the tool also compares those two lines word by word, so "delivered in 5 days" next to "delivered in 2 days" highlights just the 5 and the 2.

## Choosing the right options

**Ignore whitespace** is ideal for documents that have been re-typed, copied from PDFs or edited in different apps. Extra spaces and tabs no longer show as changes.

**Ignore case** helps when someone has changed headings from capitals to sentence case and you only care about wording.

**Only show changes** hides long stretches of unchanged text and keeps two lines of context around each change. Turn it on for long contracts so you can jump from edit to edit.

**Highlight changed words** is on by default. Turn it off if you prefer whole lines coloured without inner highlights, for example when comparing lists where each line is a separate item.

## A practical example: checking a rental agreement

Suppose your landlord in Bengaluru emails a revised agreement.

1. Copy the text from the original agreement you signed last year.
2. Copy the text from the new draft. If it is a PDF, extract it with [PDF to Text](/tools/pdf-to-text/).
3. Paste both, tick **Ignore whitespace** and **Only show changes**.
4. Read every green and red row. Look closely at numbers: rent, deposit, notice period, lock-in and maintenance charges.

A diff makes small but important changes, like "two months' notice" becoming "three months' notice", impossible to miss.

## Common mistakes when comparing documents

- **Comparing different line wrapping.** If one copy has a line break every 80 characters and the other has whole paragraphs on one line, everything shows as changed. Clean both first with the [Whitespace Cleaner](/tools/whitespace-cleaner/), using **Remove line breaks** if needed.
- **Pasting in the wrong order.** Additions will show as removals. Use **Swap** to fix it.
- **Assuming formatting is compared.** Bold, italics, colours and fonts are not part of plain text, so a diff will not show them.
- **Ignoring the line numbers.** When discussing changes with someone else, quote the line numbers so you are both looking at the same place.
- **Comparing entirely different texts.** If two texts share almost nothing, a diff is not meaningful, and very large unrelated texts may be too slow to compare.

## Tips for cleaner comparisons

- Sort both lists first with [Sort Lines](/tools/sort-lines/) when order does not matter, so only genuine additions and removals show up.
- Use Find and Replace to normalise things like date formats before comparing data exports.
- For long legal documents, compare section by section if the diff becomes hard to read.
- Save the downloaded `.diff` file alongside the documents as a simple record of what changed and when.

## How does a diff checker decide what changed?

The tool uses a well-known comparison method, the Myers diff algorithm, which is also the basis of many version control systems. It looks for the longest stretch of lines the two texts share and treats everything else as additions or removals, giving the smallest set of edits that turns the original into the new version.

That has a practical side effect. If a paragraph was moved from the top of a document to the bottom, a diff shows it as removed in one place and added in another, rather than "moved". When you see the same text in both red and green, check whether it was simply relocated.

## Are my documents uploaded?

No. [Text Compare](/tools/text-diff/) does the comparison in your browser. Neither version of your text is sent to BISCS India's servers or stored, so it is safe to compare confidential contracts, salary letters or unpublished work. Close the tab and both texts are gone.
