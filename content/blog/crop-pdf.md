{
  "tool": "crop-pdf",
  "slug": "crop-pdf-margins-online-free",
  "title": "How to Crop PDF Pages and Trim Margins Online for Free",
  "description": "Trim white margins and scanner borders from PDF pages by dragging a box or typing millimetres, for all pages or one. Free and private, with tips and honest limits.",
  "keywords": ["crop pdf", "trim pdf margins", "crop pdf pages online", "remove white margins pdf", "cut pdf page size"],
  "summary": "To crop a PDF, open a PDF cropper, drag the box on the page preview or type the margins to trim in millimetres, choose whether to apply it to all pages or only the current one, and download. BISCS India’s Crop PDF does this in your browser without uploading. Cropping hides content outside the box rather than deleting it.",
  "faq": [
    { "q": "Does cropping a PDF delete the content outside the crop area?", "a": "No. Cropping changes the visible page area, so the trimmed parts are hidden, but the underlying content usually remains inside the file. Do not rely on cropping to remove sensitive information. Use Remove PDF Pages for whole pages, or recreate the document without the sensitive part." },
    { "q": "What does Also shrink the page size do?", "a": "With it on, both the visible area (CropBox) and the page size (MediaBox) are reduced, so the page really becomes smaller when printed or viewed in any reader. With it off, only the visible area changes. Leaving it on gives the most consistent result across PDF readers." },
    { "q": "Can I crop different pages differently?", "a": "Yes. Choose This page only, crop the current page, download, then open the result and crop the next page that needs a different box. For most documents, one crop applied to all pages is enough because scanner borders tend to be similar." },
    { "q": "Will cropping make the PDF file smaller?", "a": "Usually not by much, because the hidden content is still stored in the file. Cropping is about how the page looks, not its size in KB. To reduce the file size, use Compress PDF after cropping." },
    { "q": "Why do I get an error that the margins are too large?", "a": "The margins you entered add up to more than the page’s width or height on at least one page, which often happens when a document mixes page sizes. Reduce the margins, or crop only the current page." }
  ]
}
---
To crop a PDF, open [Crop PDF](/tools/crop-pdf/), drag the handles of the crop box on the page preview (or type the margins to trim in millimetres), choose **All pages** or **This page only**, and download. The pages are trimmed to the area you kept.

Everything happens in your browser, so the document stays on your device. One thing to know up front: cropping **hides** what is outside the box; it does not securely delete it.

## Why crop a PDF?

Cropping is about making pages look right. Typical reasons:

- **Scanner and phone borders.** Dark edges, a bit of the desk, or the shadow of the scanner lid around every page.
- **Wide white margins.** Some PDFs, especially exported slides and old e-books, have huge margins that make text tiny on a phone.
- **Focusing on one part.** You need just the table from a report page, or one receipt from a page of several.
- **Fitting a page for printing or slides.** A tighter page enlarges the content when printed "fit to page".
- **Removing printer marks** around the edges of design proofs.

## How to crop a PDF step by step

1. Open [Crop PDF](/tools/crop-pdf/) and choose your PDF.
2. The first page appears with a crop box. Drag the corner and edge handles, or drag the whole box. Drag on the dark area to draw a new box from scratch.
3. Or type exact values in **Top**, **Bottom**, **Left** and **Right** (in millimetres).
4. Use the page arrows to check other pages with the same box.
5. Choose **Apply to**: All pages, or This page only.
6. Decide whether to keep **Also shrink the page size (MediaBox)** switched on (it is on by default).
7. Crop and download. The result shows the new page size in millimetres.

## CropBox vs MediaBox, in plain words

Every PDF page has a few "boxes". Two matter here:

| Box | What it means | When the tool changes it |
|---|---|---|
| CropBox | The visible area a reader shows | Always |
| MediaBox | The physical page size | Only when "Also shrink the page size" is on |

Changing both gives the most predictable result: the page is smaller in every viewer and prints at the new size. Changing only the CropBox can be useful when you want to keep the original page size information for some later step, but a few readers and printers treat CropBox differently, so the default is to change both.

In both cases, the content outside the box usually remains in the file. It is simply out of view.

## Cropping is not redaction

This deserves its own section, because it is a common and risky misunderstanding. If a bank statement page shows your account number in a corner and you crop it off, someone with PDF software may still be able to reveal or extract it. The same applies to covering text with a white box.

If you need to withhold information:

- Drop whole pages with [Remove PDF Pages](/tools/remove-pdf-pages/), which genuinely excludes them from the new file.
- Or convert the cropped page to an image with [PDF to Images](/tools/pdf-to-jpg/), since an image contains only what is visible, and then turn it back into a PDF if needed.
- For formal or legal redaction, use dedicated redaction software or ask for a fresh document from the source.

## Common mistakes to avoid

- **Cropping into the text.** Check every page in the preview, especially pages where text runs closer to the edge than on page 1.
- **Applying one crop to mixed page sizes.** A crop that fits A4 pages may be too large for a smaller receipt page in the same file. The tool stops with a clear error if the margins exceed a page; crop those pages separately.
- **Expecting a smaller file.** Cropping changes appearance, not storage. Compress afterwards if size matters.
- **Cropping before rotating.** Fix orientation first with [Rotate PDF](/tools/rotate-pdf/) so that "top" means what you think it means. The tool does account for rotation, but working on upright pages is less confusing.

## Example: cleaning up phone scans for a portal

Lakshmi photographed her four-page Class 12 mark sheet bundle on a wooden table and turned the photos into a PDF. Each page now has a brown border of tabletop around it. She opens the PDF in the cropper, drags the box in to the paper's edges on page 1, flips through the other pages to confirm the box fits them too, and crops all pages at once. The result looks like a proper scan.

For future documents, she could use Scan to PDF instead, which detects the paper edges and straightens the page automatically while capturing.

## Tips for precise crops

- Use the typed millimetre values when you need the same crop on several documents, such as a monthly report with fixed margins.
- A small margin of 3–5 mm around the content looks more professional than cropping tight to the text.
- For slides exported as PDF, trimming large side margins makes the content much more readable on phones.
- After cropping, a document printed with "fit to page" will appear larger on paper, which can help small print.

## Checklist before you download

- The crop box fits every page, not just the first one.
- No text, signature, stamp or page number is cut off at the edges.
- "Also shrink the page size" is on, unless you have a specific reason to keep the original page size.
- Nothing sensitive is merely hidden outside the crop area.
- Your original file is safely kept in case you need a different crop later.

## Private processing

The crop is applied by a PDF library running in your browser. Your document is never uploaded, which matters because the pages people crop are often scans of personal papers. The cropped copy is saved to your device, and your original file is untouched.
