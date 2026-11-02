{
  "tool": "text-extractor",
  "slug": "extract-emails-urls-phone-numbers-from-text",
  "title": "Extract Emails, URLs and Phone Numbers from Any Text",
  "description": "Pull every email address, link, Indian mobile number, hashtag and mention out of messy text, remove duplicates, and export to CSV. Free and runs in-browser.",
  "keywords": ["extract emails from text", "email extractor", "url extractor", "extract phone numbers from text", "link extractor online"],
  "summary": "To extract emails, links or phone numbers, paste the text into an extractor and copy the list it finds. BISCS India’s Email & URL Extractor pulls out email addresses, URLs, Indian mobile numbers, hashtags, mentions and numbers, removes duplicates, formats phones as +91, and exports everything to CSV, all within your browser.",
  "faq": [
    { "q": "Which phone numbers does the extractor find?", "a": "It looks for Indian mobile numbers: ten digits starting with 6, 7, 8 or 9, with or without +91, 0091 or a leading 0, and with spaces, dots or hyphens between digits. Landline numbers with STD codes and international numbers from other countries are not detected." },
    { "q": "Can I extract emails from a PDF or Excel file?", "a": "Copy the text out of the file and paste it in. For PDFs, the PDF to Text tool extracts text first. For Excel, select the relevant columns and paste them; the extractor finds emails among any surrounding text, so you do not need to clean the data beforehand." },
    { "q": "Is it legal to send marketing emails to addresses I extract?", "a": "Extracting addresses is just text processing, but how you use them is regulated. India’s data protection law and anti-spam norms expect a lawful basis or consent for contacting people, and bulk messaging platforms have their own rules. Only contact people who have agreed to hear from you." },
    { "q": "Why are some URLs cut short or missing?", "a": "The tool recognises links starting with http, https or www. Links written without these, such as example.com on its own, are not picked up, to avoid matching ordinary words with dots. Trailing punctuation like a full stop or closing bracket is removed so links work when clicked." },
    { "q": "What does All as CSV include?", "a": "It creates one spreadsheet file listing every item found across all categories, with a type column such as email, url or phone and a value column. The file is saved with a marker that helps Excel open Indian and other non-English characters correctly." }
  ]
}
---
An email and URL extractor scans a block of text and pulls out specific items: email addresses, web links, phone numbers and more. Instead of reading through a long email thread or web page and copying each address by hand, you paste the whole thing in and get a clean list in seconds.

The BISCS India version is tuned for Indian use, so it recognises mobile numbers written in all the usual local formats and can standardise them to +91.

## What can you extract?

The [Email & URL Extractor](/tools/text-extractor/) sorts what it finds into six tabs, each with a count.

| Tab | What it finds | Example |
|---|---|---|
| Emails | Email addresses | accounts@example.co.in |
| URLs | Links starting with http, https or www | https://www.example.com/page |
| Phones | Indian mobile numbers | +91 98300 12345, 09830012345 |
| Hashtags | Words starting with # | #SmallBusiness, #कोलकाता |
| Mentions | Social media handles | @biscsindia |
| Numbers | Standalone numbers, including Indian commas | 1,25,000 or 42.5 |

Hashtags work with Indian scripts too, so Hindi or Bengali tags are found alongside English ones.

## How to extract emails and links from text

1. Open the [Email & URL Extractor](/tools/text-extractor/).
2. Paste your text: an email thread, a web page, a CSV export, a WhatsApp chat or HTML source code all work.
3. Check the options: **Remove duplicates**, **Sort A → Z**, **Lowercase emails** and **Format phones as +91 XXXXX XXXXX**.
4. Click the tab you need, such as **Emails** or **Phones**, to see that list.
5. Click **Copy** or **Download** for the current list, or **All as CSV** to save every category in one spreadsheet file.

Results update as you paste or change options.

## How the options help

**Remove duplicates** is on by default, because the same address often appears many times in an email thread, in signatures and in quoted replies.

**Lowercase emails** treats "Rahul.Sen@Example.com" and "rahul.sen@example.com" as the same address, which they are for practically every email provider.

**Format phones** turns "098300-12345", "+91 9830012345" and "98300 12345" into one consistent format, "+91 98300 12345". That makes duplicates easier to spot and the list ready for a contacts import. Untick it to keep numbers exactly as written.

**Sort A → Z** is handy for long lists you need to scan or compare.

## Everyday uses

- **Building a client list** from years of email threads, before importing into your CRM or Google Contacts.
- **Collecting enquiry numbers** from a WhatsApp group export or a lead sheet.
- **Auditing links** on a web page or in a document, to check none are broken or pointing to old domains.
- **Gathering hashtags** used by competitors or in a trending discussion for social media research.
- **Pulling figures** out of a report to paste into a spreadsheet.
- **Event follow-ups**: extracting attendee emails from a registration form export.

## Worked example: turning a WhatsApp export into a contact list

A tuition centre in Patna has a WhatsApp group of parents and wants their numbers in a spreadsheet for fee reminders, with the parents' agreement.

1. Export the group chat from WhatsApp as a text file, without media, and open it.
2. Copy everything and paste it into the extractor.
3. Open the **Phones** tab. With **Format phones** and **Remove duplicates** on, each parent appears once as "+91 XXXXX XXXXX", even if they posted fifty times.
4. Click **Download** to save the list, or **All as CSV** if you also want any emails and links shared in the chat.
5. Open the file in Excel or Google Sheets and add a column for each student's name.

Note that people saved in your phone's contacts usually appear in a chat export by name rather than number, so only unsaved numbers, and numbers typed into messages, show up in the text. You may need to add the rest by hand.

## Limits worth knowing

Being clear about what the tool does not catch saves confusion:

- **Landlines and foreign numbers** are not detected. Phone extraction is designed for 10-digit Indian mobiles starting with 6 to 9.
- **Links without http, https or www**, such as "example.com" on its own, are skipped so ordinary words with dots are not mistaken for links.
- **Obfuscated emails** like "name [at] example [dot] com" are not recognised. Use [Find and Replace](/tools/find-and-replace/) to turn " [at] " into "@" first.
- **Text inside images** cannot be read. Run screenshots and scans through [Image to Text](/tools/image-to-text/) first, then paste the result here.
- **Validity is not checked.** The tool finds text shaped like an email or number; it does not confirm the inbox exists or the phone is in use.

## Common mistakes

- **Pasting a PDF directly.** You need the text, not the file. Use [PDF to Text](/tools/pdf-to-text/) to extract it.
- **Forgetting to remove duplicates** when merging several sources. Leave the option on, or clean the final list with [Remove Duplicate Lines](/tools/remove-duplicate-lines/).
- **Mixing up mentions and emails.** An email address is not counted as a mention, but a handle immediately followed by a dot and word may be skipped. Check the Mentions tab for anything you expected to see.
- **Contacting people without consent.** Just because an email is visible in a thread does not mean the person wants marketing messages.

## A note on privacy and responsible use

The extractor runs entirely in your browser. The text you paste, which often includes names, emails and phone numbers of other people, is not uploaded to or stored by BISCS India.

That protects you, but you still carry responsibility for the data. India's Digital Personal Data Protection Act sets rules on collecting and using personal data, and bulk SMS, WhatsApp and email platforms have their own anti-spam policies. Use extracted contacts for genuine business with people who expect to hear from you, store exported files securely, and delete them when they are no longer needed.

## Tips for cleaner results

- Paste HTML source rather than visible page text if links are hidden behind words like "click here"; the extractor finds the actual addresses in the code.
- Clean up very messy text first if numbers are split across lines, so each number sits on one line.
- Open the CSV in Excel or Google Sheets and filter by the type column to separate emails, phones and links.
- Keep the original text until you have checked the extracted list against it.
