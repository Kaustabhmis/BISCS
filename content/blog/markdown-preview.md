{
  "tool": "markdown-preview",
  "slug": "markdown-editor-live-preview-html",
  "title": "Markdown Preview: Write Markdown and See It Live, Then Export",
  "description": "Write Markdown with a live formatted preview, then copy clean HTML or export a styled HTML page. A beginner’s syntax guide with tables, task lists and tips.",
  "keywords": ["markdown preview", "markdown editor online", "markdown to html", "readme preview", "markdown cheat sheet"],
  "summary": "To preview Markdown, type or paste it into a Markdown editor and the formatted result appears beside it as you write. BISCS India’s Markdown Preview supports GitHub-flavoured Markdown including tables and task lists, and lets you copy the HTML, export a styled HTML page or download a .md file, all in your browser.",
  "faq": [
    { "q": "What is GitHub-flavoured Markdown?", "a": "It is a widely used version of Markdown that adds features the original lacked, such as tables, task list checkboxes, strikethrough text and automatic links. GitHub, many documentation tools and note apps support it, so text written in this style looks the same in most places." },
    { "q": "Is the exported HTML safe to paste into my website?", "a": "The preview cleans the generated HTML with a sanitiser that removes scripts and other risky code before showing or exporting it. Still review the output before publishing, especially if the Markdown came from someone else, and check that links and images point where you expect." },
    { "q": "Why does the preview say Loading Markdown engine?", "a": "The tool loads its Markdown converter and HTML sanitiser the first time you open it. This needs an internet connection and takes a moment on slow networks. After that, everything you type is converted inside your browser, and your text is not sent anywhere." },
    { "q": "Can I convert Markdown to a Word document or PDF?", "a": "Not directly. Export the HTML page, open it in your browser and use Print, Save as PDF to get a PDF. To get a Word file, open the exported HTML in Microsoft Word or paste the copied preview into a Word document, then tidy the formatting." },
    { "q": "Do images in Markdown show in the preview?", "a": "Yes, if the image link points to a public web address. The preview loads it like any web page would. Images on your own computer cannot be referenced by a local file path, so upload them somewhere first or keep them out of the preview." }
  ]
}
---
Markdown is a simple way to format text using plain characters: `#` for headings, `**` for bold, `-` for bullet points. A Markdown preview shows you, as you type, how that plain text will look once it is formatted. Write on the left, see the finished document on the right.

It is the format behind README files on GitHub, many documentation sites, note-taking apps like Obsidian, and even chat apps that turn `*stars*` into bold. Learning the basics takes about ten minutes.

## How to preview Markdown online

1. Open [Markdown Preview](/tools/markdown-preview/). A sample document is loaded so you can see the syntax in action.
2. Click **Clear** and start writing, or paste existing Markdown.
3. Watch the **Preview** pane update as you type.
4. When you are happy, choose how to take it away:
   - **Copy Markdown** copies your source text.
   - **Copy HTML** copies the converted HTML code.
   - **Export HTML** downloads a complete, styled HTML page.
   - **.md** downloads your source as a Markdown file.

The exported files are named after the first heading in your document, so a file starting with "# Project Notes" is saved as `project-notes.html`.

## Markdown cheat sheet

These are the elements you will use most. All of them work in the preview.

| You type | You get |
|---|---|
| `# Heading`, `## Heading`, `### Heading` | Headings, levels 1 to 3 |
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `~~strikethrough~~` | Strikethrough text |
| `- item` or `1. item` | Bullet or numbered list |
| `- [ ] task` and `- [x] done` | Task list with checkboxes |
| `[BISCS India](https://biscsindia.com)` | A clickable link |
| `![alt text](image-url)` | An image |
| `` `code` `` | Inline code |
| Three backticks on lines above and below | A code block |
| `> quoted text` | A blockquote |
| `---` on its own line | A horizontal rule |

### Tables

Tables use pipes and dashes:

- First line: `| Item | Price |`
- Second line: `|---|---|`
- Then rows: `| Masala chai | ₹20 |`

Columns do not need to line up perfectly in the source; the preview handles it.

## Who uses Markdown, and for what?

- **Developers** write README files, changelogs and documentation for GitHub, GitLab and Bitbucket.
- **Students and researchers** keep notes in apps that store plain Markdown files, which never get locked into one program.
- **Bloggers** draft posts in Markdown for platforms and static site generators that accept it.
- **Teams** write meeting notes, checklists and how-to guides that look tidy in wikis and chat tools.
- **Content writers** send clean drafts that editors can paste anywhere without stray formatting.

The big advantage is that the source stays readable even without a preview, and it works with any text editor.

## Markdown vs WhatsApp formatting

Many people in India already use a cousin of Markdown without realising it. WhatsApp turns text between single asterisks into bold, between underscores into italics, and between tildes into strikethrough.

Standard Markdown is slightly different, and the difference catches people out:

- In WhatsApp, single asterisks make text **bold**. In Markdown, single asterisks make it *italic*, and you need double asterisks for bold.
- WhatsApp has no headings, tables or links with custom text. Markdown has all three.
- WhatsApp formatting only shows inside WhatsApp. Markdown can be turned into HTML, PDF or a web page.

If you copy a message from WhatsApp into the preview and the bold text turns italic, that is why. Add a second asterisk on each side.

## Worked example: a simple project README

Say a college team in Pune is sharing a final-year project on GitHub. A useful README needs just a few parts:

1. A `#` heading with the project name.
2. A one-paragraph description of what it does.
3. A `## Setup` section with numbered steps and the commands in a code block.
4. A `## Team` section with a bullet list of names and roles.
5. A `## To do` section using task list checkboxes for unfinished work.

Write it in the editor, check the preview, then click **.md** and save the file as `README.md` in the project folder. GitHub will display it on the project's front page with the same formatting you saw here.

## Common Markdown mistakes

- **Forgetting the blank line.** A list or heading straight after a paragraph sometimes merges into it. Leave an empty line before lists, headings and tables.
- **No space after the hash.** `#Heading` may not become a heading; write `# Heading`.
- **Mixing indentation in nested lists.** Use consistent spaces to indent sub-items.
- **Unescaped special characters.** An asterisk in a price like `5*3` can trigger italics. Put a backslash before it, or wrap it in backticks.
- **Line breaks ignored.** A single line break inside a paragraph is usually treated as a space. Leave a blank line to start a new paragraph.

## Turning Markdown into other formats

**HTML for a website or email.** Click **Copy HTML** and paste it into your CMS's HTML view. For a standalone page, **Export HTML** gives you a file with simple, readable styling built in.

**PDF.** Open the exported HTML file in your browser, press print and choose "Save as PDF". For plain text without any formatting, the [Text to PDF](/tools/text-to-pdf/) tool is a quick alternative.

**Word documents.** Open the exported HTML in Microsoft Word, or paste the content from the preview pane into a Word document. Expect to tidy up some spacing.

## Tips for cleaner documents

- Start every document with one top-level `#` heading. It becomes the title of your exported page.
- Keep heading levels in order: `##` under `#`, `###` under `##`. It helps both readers and screen readers.
- Use the [Word Counter](/tools/word-counter/) to check length; paste the preview text rather than the source to exclude symbols.
- If you need placeholder paragraphs while designing a layout, generate them with the [Lorem Ipsum Generator](/tools/lorem-ipsum-generator/).
- Building URL-friendly heading IDs or file names? The [Slug Generator](/tools/slug-generator/) creates them from titles.

## Privacy and limits

[Markdown Preview](/tools/markdown-preview/) converts your text inside the browser. The Markdown engine is downloaded once when the page loads, which needs a connection; after that, nothing you write is uploaded to BISCS India. Links in the preview open in a new tab, and the generated HTML is cleaned of scripts before it is shown or exported.

Your text is not saved between visits, so download the `.md` file if you want to continue later.
