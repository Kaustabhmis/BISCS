{
  "tool": "pdf-to-text",
  "slug": "extract-text-from-pdf-free",
  "title": "How to Extract Text from a PDF and Save It as a TXT File",
  "description": "Copy or download all the selectable text in a PDF as a plain .txt file, with optional page separators. Free and private. Plus what to do with scanned PDFs.",
  "keywords": ["pdf to text", "extract text from pdf", "copy text from pdf", "pdf to txt converter", "convert pdf to plain text"],
  "summary": "To extract text from a PDF, open a PDF-to-text tool, load the file, and copy all the text or download it as a .txt file, optionally with page separators. BISCS India’s PDF to Text reads the PDF’s selectable text in your browser without uploading it. Scanned PDFs need OCR, which a separate tool provides.",
  "faq": [
    { "q": "Why is the extracted text empty or very short?", "a": "The PDF is probably a scan, where each page is a picture rather than real text. This tool reads only selectable text and tells you when very little is found. For scans, use Image to Text, which uses OCR to recognise English, Hindi and Bengali." },
    { "q": "Does PDF to Text keep tables and formatting?", "a": "No. The output is plain text, so bold, fonts, colours and table borders are lost, and table columns become text separated by spaces or line breaks. If you need formatting, convert the PDF to Word instead, which keeps headings, lists and basic styling." },
    { "q": "What are page separators?", "a": "When the option is on, the text file includes a line such as Page 3 of 12 before each page’s text. That helps you find where something came from in a long document. Turn it off if you want one continuous block of text." },
    { "q": "Can it extract Hindi text from a PDF?", "a": "If the PDF contains real, selectable Hindi text, it can usually be extracted. Some older Indian-language PDFs use non-Unicode legacy fonts, and their text may come out as garbled characters. In that case OCR on the page images often gives better results." }
  ]
}
---
To extract text from a PDF, open [PDF to Text](/tools/pdf-to-text/), choose your file, and either click **Copy all text** or **Download .txt**. The tool reads every page and gives you the plain text, with optional "Page X of Y" separators so you know where each part came from.

It only works on text that is selectable in the PDF. If your document is a scanned image, you need OCR, which the separate [Image to Text](/tools/image-to-text/) tool provides.

## When plain text is exactly what you need

Copying text from a PDF viewer is often painful: line breaks in odd places, columns jumbled, one page at a time. Extracting everything at once is faster when you want to:

- **Reuse content**: quote a clause from a policy, paste a paragraph into an email, or build notes from a report.
- **Search across a long document** in your favourite text editor.
- **Feed text into other tools**, such as a word counter, a translation tool or a spreadsheet.
- **Archive the words** of a document in a small, future-proof format.
- **Read on a small phone screen**, where reflowing plain text is easier than zooming into a PDF.

## How to extract text step by step

1. Open [PDF to Text](/tools/pdf-to-text/) and choose your PDF.
2. Wait while each page is read. A progress bar shows how far it has got.
3. Look at the preview to check that the text came through.
4. Decide whether to keep **Include page separators** switched on.
5. Click **Copy all text** to paste it elsewhere, or **Download .txt** to save it.

## Digital PDF or scanned PDF?

This is the single most important thing to understand about extracting text.

| | Digital PDF | Scanned PDF |
|---|---|---|
| How it was made | Exported from Word, a website, accounting software or a bank portal | Photographed or scanned from paper |
| Can you select a word in a viewer? | Yes | No, or the whole page selects as an image |
| PDF to Text works? | Yes, accurately | No, little or no text found |
| What to use instead | — | Image to Text (OCR) |

A quick test: open the PDF and try to highlight a single word. If you can, this tool will extract it. The tool also warns you when it finds very little text, which is a strong hint the pages are scans.

## What the output looks like

The result is plain UTF-8 text. That means:

- Paragraphs come through as lines of text; bold, italics and fonts are dropped.
- Tables become rows of words separated by spaces, not neat columns.
- Headers and footers on each page (company name, page numbers) are included like any other text.
- Multi-column layouts, such as newsletters, may come out column by column or line by line depending on how the PDF was made.

If you need headings, lists and basic formatting kept, [PDF to Word](/tools/pdf-to-word/) is the better choice.

## Common mistakes to avoid

- **Trying to extract from a scan.** You will get nothing useful. Use OCR instead.
- **Expecting a perfect table.** For bank statements and price lists, plain text loses the column structure. Copy specific rows instead, or convert to Word.
- **Ignoring legacy-font Hindi PDFs.** Some older documents in Indian languages use fonts that map characters in non-standard ways, so the extracted text looks like gibberish. OCR on the page images usually works better for those.
- **Leaving separators on when pasting into a form.** The "Page X of Y" lines are helpful for reference but not for clean copy. Turn the option off before copying.
- **Assuming the text is complete.** Text inside images, such as a scanned signature block or a logo, is not extracted.

## Practical examples

**A student** has a 60-page PDF of lecture notes and wants to make flashcards. Extracting the text into a .txt file lets her search for key terms and paste definitions straight into her flashcard app.

**An office assistant** needs the exact wording of five clauses from a 40-page lease to put into an email to the landlord. Copying all the text once and picking out the clauses is quicker than copying from the PDF page by page.

**A small business owner** in Indore wants to check how often a supplier's name appears in a long contract. Extracting the text and using Find in a text editor answers it in seconds.

## Tips for cleaner text

- Turn off page separators when you need one continuous text, and on when you need to cite pages.
- After pasting, use a find-and-replace tool to remove repeated headers or footers.
- For documents with some scanned pages, extract the text here first, then run OCR only on the scanned pages.
- Save the .txt file with a meaningful name; it is tiny and easy to search later.

## PDF to Text, PDF to Word or OCR?

| You need… | Best tool |
|---|---|
| The words only, quickly, from a digital PDF | PDF to Text |
| Editable document with headings, lists and basic formatting | PDF to Word |
| Text from a scanned PDF, photo or screenshot | Image to Text (OCR) |
| Text from one specific page as a picture | PDF to Images, then OCR if needed |

For most digital documents, PDF to Text is the fastest route because there is no layout to rebuild. It reads the text the PDF already contains, so it is also exact: there are no recognition errors of the kind OCR sometimes makes with similar-looking letters and numbers.

## Is the extracted text accurate?

For a digital PDF, yes, the characters are taken directly from the file. Occasionally a PDF uses an unusual font encoding, and some characters come out wrong. Ligatures (such as "fi" printed as one symbol) and special dashes can also appear slightly differently. If the text looks wrong in places, compare with the PDF and fix those spots by hand.

## Private by default

Text extraction runs in your browser using a PDF engine loaded with the page. The document is never uploaded, so you can extract text from contracts, medical reports or bank letters without sending them anywhere. The .txt file is created on your device, and closing the tab clears everything else.
