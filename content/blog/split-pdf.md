{
  "tool": "split-pdf",
  "slug": "split-pdf-by-page-range-free",
  "title": "How to Split a PDF by Page Ranges, Every N Pages or Singly",
  "description": "Split one PDF into several files by page ranges, fixed chunks or single pages, free in your browser. Clear steps, examples and tips for portal upload limits.",
  "keywords": ["split pdf", "split pdf by pages", "separate pdf pages", "divide pdf into multiple files", "split pdf online free"],
  "summary": "To split a PDF, open a PDF splitter, choose how to divide it (page ranges such as 1-3, 4-6, fixed chunks of N pages, every page separately, or cut points you click), then download the parts as a ZIP. BISCS India’s Split PDF runs in your browser, so the document is never uploaded.",
  "faq": [
    { "q": "How do I type page ranges for splitting?", "a": "Separate each part with a comma. For example 1-3, 4-6, 7 creates three files: pages one to three, pages four to six, and page seven alone. Each comma-separated range becomes its own PDF, and the file name includes the pages it contains." },
    { "q": "What is the difference between Split PDF and Extract PDF Pages?", "a": "Split PDF divides a document into several output files, usually covering all pages. Extract PDF Pages picks specific pages and saves them as one new PDF, or as separate files if you choose. Use split for breaking a big file apart and extract for pulling out a few pages." },
    { "q": "Why do I get a ZIP file?", "a": "Splitting usually produces several PDFs, and browsers handle one download better than many. The parts are packed into a ZIP that you can open on any phone or computer. On Android and iPhone, the Files app can extract it with a tap." },
    { "q": "Does splitting reduce quality or change the pages?", "a": "No. Pages are copied exactly as they are into the new files, so text stays selectable and images keep their original resolution. Each part’s file size is roughly proportional to the pages it contains." },
    { "q": "Can I split a scanned PDF?", "a": "Yes. Splitting works on pages, not on text, so scanned and digital PDFs both split the same way. Scanned pages are often large, so if a part is still too big for an upload portal, compress it afterwards." }
  ]
}
---
To split a PDF, open [Split PDF](/tools/split-pdf/), choose a split mode and click **Split PDF**. You can split by page ranges (for example `1-3, 4-6, 7`), into chunks of a fixed size, into single pages, or by clicking the pages where each new file should start. The parts download together as a ZIP.

Pages are copied exactly as they are, so nothing is re-compressed, and the file is processed in your browser rather than uploaded to a server.

## Four ways to split a PDF

The tool offers four modes, and each suits a different job.

| Mode | How it works | Good for |
|---|---|---|
| Ranges | Type comma-separated ranges; each range becomes one PDF | Pulling chapters or sections apart |
| Every N | Cut the document into chunks of N pages | Monthly statements, batches for printing |
| All pages | Every page becomes its own PDF | Separating a bundle of single-page certificates |
| Pick | Click thumbnails; the file is cut after each selected page | Uneven sections you can spot visually |

The **Ranges** box is pre-filled with a sensible default (the first half and the second half), so you can see the format immediately.

## How to split a PDF step by step

1. Open [Split PDF](/tools/split-pdf/) and choose your file.
2. Look at the page thumbnails to understand where each section starts and ends.
3. Pick a split mode: Ranges, Every N, All pages or Pick.
4. Enter your ranges or chunk size, or click the pages where you want cuts. The tool tells you how many files will be created.
5. Click **Split PDF**.
6. Download the ZIP and open it to find each part, named after the original file and the pages it contains.

## Real examples from everyday paperwork

**A combined scan from the office photocopier.** You scanned twelve documents in one go and got a single 30-page PDF. Use Pick mode: click the last page of each document, and you get twelve separate files.

**An annual bank statement.** Your bank emailed a 48-page PDF for the year, but the loan officer wants only the last six months. Use Ranges to split it into the two halves, or use [Extract PDF Pages](/tools/extract-pdf-pages/) to save just the pages you need.

**Exam answer sheets or certificates.** A school has a 40-page PDF with one certificate per student. "All pages" turns it into 40 files in seconds, ready to email individually.

**Printing in batches.** Large booklets are easier to print and staple in sets of 20. Every N with N set to 20 does it.

## Splitting to meet portal upload limits

Many Indian government and institutional portals cap the size of each upload, and the cap differs from portal to portal. If a scanned document is too big and the portal lets you upload several parts (some allow "Document 1", "Document 2" and so on), splitting is a clean solution.

Check the specific portal's instructions first. Some portals want a single file per document, in which case compressing is the better route. [Compress PDF](/tools/compress-pdf/) can bring scanned files down considerably, and you can combine both approaches: split first, then compress any part that is still too large.

## Common mistakes to avoid

- **Overlapping or missing ranges.** If you type `1-5, 5-10`, page 5 appears in both files. If you type `1-4, 6-10`, page 5 is left out. The tool checks your input, but it cannot know your intention, so read the ranges once more.
- **Typing page numbers printed on the document.** Use the PDF's own page positions (as shown under the thumbnails), not the numbers printed in the footer, which often start after a cover page.
- **Splitting when you meant to remove pages.** If you only want to drop a few pages and keep one file, use [Remove PDF Pages](/tools/remove-pdf-pages/) instead.
- **Forgetting to rename the parts.** Names like `statement-pages-1-6.pdf` are clear, but a portal reviewer will appreciate `April-to-September-statement.pdf` even more.

## Tips for a smooth split

- An open-ended range such as `8-` runs from page 8 to the end, which saves counting.
- For very long PDFs, the Every N mode is quicker than typing many ranges.
- If the document has sideways pages, fix them first with [Rotate PDF](/tools/rotate-pdf/); split copies pages as they are.
- On phones, the ZIP lands in Downloads. Use your file manager to extract it before attaching parts to email or WhatsApp.

## How the output files are named

Each part is named after your original file plus the pages it contains, so `property-papers.pdf` split with ranges might give `property-papers-pages-1-4.pdf` and `property-papers-pages-5-12.pdf`. In All pages mode the parts are called `page-1`, `page-2` and so on, and in Every N or Pick mode they are numbered `part1`, `part2`.

These names sort correctly in a file manager, which helps when you have dozens of parts. Still, a descriptive name helps the person who receives the file, so rename the important ones before you share them.

## Example: separating a scanned bundle of documents

Arjun, an accountant in Chennai, receives a 36-page scan from a client who fed every bill for the quarter into the office scanner at once. He needs each vendor's bills as a separate PDF for his records.

He opens the file, switches to Pick mode, and clicks the last page of each vendor's set while glancing at the thumbnails: page 4, page 9, page 15 and so on. The status line confirms that eight files will be created. One click later he has a ZIP of eight PDFs, each starting at the right page. What would have taken twenty minutes with print-and-rescan is done in under two.

## Privacy and performance

The splitting is done by a PDF library that runs in your browser tab. Your file is read from your device and the parts are written back to your device, with no upload in between. That makes it suitable for medical reports, legal bundles and anything carrying Aadhaar or PAN details.

Because your own device does the work, a 500-page scanned PDF will take longer on a budget phone than on a desktop. The tool shows progress as each part is created, so you can see it working.
