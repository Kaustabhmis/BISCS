{
  "tool": "pdf-metadata",
  "slug": "edit-pdf-metadata-title-author",
  "title": "How to View and Edit PDF Metadata (Title, Author, Keywords)",
  "description": "See and change a PDF’s title, author, subject, keywords and dates, or strip all metadata for privacy before sharing. Free, browser-based and never uploaded.",
  "keywords": ["edit pdf metadata", "change pdf title", "remove pdf metadata", "pdf author name change", "pdf properties editor"],
  "summary": "To edit PDF metadata, open a PDF metadata editor, change fields such as title, author, subject and keywords, or tick Remove all metadata, then save. BISCS India’s PDF Metadata Editor also shows the page count, PDF version and dates, and works entirely in your browser, so the document is never uploaded.",
  "faq": [
    { "q": "What is PDF metadata?", "a": "Metadata is information stored inside the PDF about the document itself rather than its pages: title, author, subject, keywords, the application that created it, the PDF library that produced it, and creation and modification dates. Readers show it under Document Properties, and search engines may use the title." },
    { "q": "Why does my PDF show a strange title in the browser tab?", "a": "Browsers display the PDF’s Title metadata instead of the file name when it exists. If the document was made from a template, the title may still say something like Untitled or an old project name. Edit the Title field to fix what people see." },
    { "q": "Should I remove metadata before sharing a PDF?", "a": "It is a good habit for documents going outside your organisation. Metadata can reveal the author’s name, the software used, internal file names and when the document was created or edited. Removing it takes a second and shares only what is on the pages." },
    { "q": "Does editing metadata change the content of the PDF?", "a": "No. The pages, text, images and layout stay exactly the same. Only the document information fields are changed. Any embedded XMP metadata is removed when saving, so every PDF reader shows the values you entered." },
    { "q": "Can I change the creation date of a PDF?", "a": "The editor shows the Created and Modified dates and lets you edit them, and by default sets Modified to the current time. Do not change dates to misrepresent when a document was made; for official records that can have serious consequences." }
  ]
}
---
To view or edit a PDF's metadata, open the [PDF Metadata Editor](/tools/pdf-metadata/), load your file, change fields such as **Title**, **Author**, **Subject** and **Keywords**, and save. To strip everything before sharing, tick **Remove all metadata** instead.

The editor also shows the page count, PDF version and file size. It works in your browser, so the document is never uploaded.

## What metadata hides inside your PDFs

Open almost any PDF's Document Properties and you will find information you did not type on the page:

| Field | What it usually contains |
|---|---|
| Title | The document title, shown in browser tabs and some search results |
| Author | Often the name of the person whose computer created it |
| Subject | A short description |
| Keywords | Words to help search and filing |
| Creator | The application used, such as a word processor |
| Producer | The PDF library or printer driver that made the file |
| Created / Modified | Dates and times of creation and last change |

Most of the time nobody looks at these. But they show up in more places than you might expect: browser tab titles, file previews, document management systems and sometimes search engines.

## How to edit PDF metadata step by step

1. Open the [PDF Metadata Editor](/tools/pdf-metadata/) and choose your PDF.
2. Review the current values. The panel also shows pages, PDF version and file size.
3. Edit the fields you want to change. Separate keywords with commas or spaces.
4. Keep **Set "Modified" to now** ticked if the modification date should reflect your change.
5. To wipe everything instead, tick **Remove all metadata**. This clears title, author, dates, software names and the XMP metadata stream.
6. Save and download the updated PDF.

## Good reasons to change metadata

**Fix the title people see.** Share a PDF link and the browser tab says "Microsoft Word - Final_v7_JK_edits.docx". Setting a clean Title such as "Annual Report 2025–26, Sharma Textiles" looks far more professional.

**Correct the author.** A document created by a former employee or on a shared office computer may name the wrong person. Update it to the company name or the correct author.

**Help search and filing.** Firms that keep thousands of PDFs, from CA offices to architecture practices, can make documents easier to find by setting consistent titles, subjects and keywords.

**Publishing on a website.** If you publish brochures or price lists as PDFs, a meaningful Title gives search engines and visitors a clear description of the file.

## Privacy: what your PDF may be revealing

Metadata is a classic source of accidental disclosure. A proposal sent to a client may carry the name of a junior colleague as author, an internal project code in the title, or a creation date that reveals a quote was rushed together the night before. A CV exported from a template may still list the template designer as author.

Before sending documents outside your organisation, especially tenders, proposals, legal drafts and job applications, consider ticking **Remove all metadata**. The pages look exactly the same; only the hidden information goes.

Metadata is only one layer. Comments, hidden layers or text covered by shapes are part of the page content, not metadata, and this tool does not remove them.

## Common mistakes to avoid

- **Leaving template titles in place.** A wrong title is the most visible metadata error, because browsers show it.
- **Assuming the file name and the title are the same.** Renaming the file does not change the Title field inside it.
- **Misusing dates.** Changing Created or Modified dates to make a document seem older or newer than it is can be misleading, and for official or legal documents it may be treated as tampering. Edit dates only to correct genuine errors.
- **Editing metadata of a digitally signed PDF.** Any change to a signed file can invalidate the digital signature. Edit metadata before signing, not after.

## Checklist before sharing a document externally

- Title is clean and describes the document.
- Author is the correct person or organisation, or blank.
- Keywords and subject contain nothing internal or embarrassing.
- Or: all metadata removed in one click.
- Pages themselves checked for hidden notes and comments.

## Example: sending a quotation to a new client

Nikhil runs a small interior design studio in Ahmedabad. He prepares quotations from an old template on his office desktop and exports them to PDF. When a client opens one in their browser, the tab reads "Quote-template-2019-Ramesh", which is the name of a designer who left years ago, and the Author field shows Ramesh too.

Before sending the next quotation, he opens it in the metadata editor, sets the Title to "Quotation – 3BHK Interiors, Satellite", the Author to his studio's name, adds a few keywords for his own filing, and keeps "Set Modified to now" ticked. The client now sees a clear, professional title, and the old employee's name is gone. For proposals going to large companies, he sometimes removes all metadata instead.

## Where to see metadata on your own device

You do not need special software to check what a PDF carries. In most desktop PDF readers, open the file and look for Document Properties (often under the File menu or by pressing Ctrl+D). Browsers show the Title in the tab. On a phone, some file managers show basic details such as dates. Loading the file into the metadata editor is the quickest way to see every field at once, together with the PDF version and page count.

## Metadata and other PDF tools

Some processing steps reset or change metadata. For example, the Strong and Extreme levels in [Compress PDF](/tools/compress-pdf/) rebuild the document from page images. If you care about the final metadata, make metadata edits the **last** step, after merging, compressing or watermarking.

If you are publishing a set of documents, combine this with [Add Page Numbers](/tools/pdf-page-numbers/) and [Merge PDF](/tools/merge-pdf/) to produce a tidy, well-labelled final file.

## Private and instant

The metadata editor reads and rewrites only the document information, so it is fast even for large files. It runs in your browser, the PDF never leaves your device, and nothing is stored once you close the tab.
