{
  "tool": "gstin-validator",
  "slug": "gstin-validator-check-gst-number",
  "title": "How to Check a GSTIN: Format, Checksum and State Code Explained",
  "description": "Learn what each of the 15 characters in a GST number means, how the check digit catches typos, and how to validate one GSTIN or thousands in bulk for free.",
  "keywords": ["gstin validator", "check gst number format", "gstin checksum", "gst number verification", "bulk gstin validation"],
  "summary": "A valid GSTIN has 15 characters: a two-digit state code, the holder's 10-character PAN, an entity number, the letter Z and a check character calculated from the first 14. BISCS India's free GSTIN Validator checks all of this in your browser, singly or in bulk, but only the GST portal can confirm a registration is active.",
  "faq": [
    { "q": "Does a valid format mean the GST number is genuine?", "a": "No. A format and checksum check confirms the number is correctly built and free of typos. It cannot tell you whether the registration was actually issued, is active, or has been cancelled or suspended. For that, use the Search Taxpayer facility on the official GST portal, which shows the legal name and status." },
    { "q": "How can I find the state from a GST number?", "a": "The first two digits are the state or Union Territory code. For example, 27 is Maharashtra, 19 is West Bengal, 29 is Karnataka and 07 is Delhi. The validator shows the state name for every code, including older codes and special codes such as 97 for Other Territory." },
    { "q": "What does the 13th character in a GSTIN mean?", "a": "It shows how many registrations the same PAN holds in that state. A business's first registration in a state usually has 1, the second 2, and after 9 the letters A to Z are used. Zero is never used. A company with branches in one state under separate registrations will see different 13th characters." },
    { "q": "Can I check many GST numbers at once?", "a": "Yes. Switch to Bulk check and paste up to 5,000 GSTINs, one per line or separated by commas, semicolons or tabs. You can filter to valid or invalid entries, spot duplicates and export the results with reasons as a CSV file to open in Excel or Google Sheets." },
    { "q": "Is it safe to paste my customers' GSTINs into the tool?", "a": "The validator runs entirely in your browser using built-in rules. The numbers you paste are not uploaded or stored on a server. GSTINs are also not secret, as they appear on every tax invoice, but keeping customer lists on your own device is still good practice." }
  ]
}
---
To check a GST number (GSTIN), confirm it has exactly 15 characters in the right pattern and that its last character matches the official checksum. A correct GSTIN has a two-digit state code, the holder's 10-character PAN, an entity number, the letter Z and a check character. If any part is wrong, the number is either mistyped or not a real GSTIN.

The free [GSTIN Validator](/tools/gstin-validator/) on BISCS India runs all these checks instantly and tells you the state, the PAN and the type of holder. To confirm the business is actually registered and active, you still need the official GST portal.

## What does each part of a GSTIN mean?

Take the sample number the tool loads, **27AAPFU0939F1ZV**:

| Position | Characters | Meaning |
|---|---|---|
| 1–2 | 27 | State/UT code: Maharashtra |
| 3–12 | AAPFU0939F | PAN of the business or person |
| 4th character of the PAN | F | Holder type: firm or LLP |
| 13 | 1 | Entity number: first registration under this PAN in the state |
| 14 | Z | Default letter for regular registrations |
| 15 | V | Check character calculated from the first 14 |

Because the PAN sits inside the GSTIN, you can see at a glance whether the number belongs to an individual (P), a company (C), a firm or LLP (F), a trust (T), an HUF (H) and so on.

## How does the checksum catch typos?

The 15th character is not random. It is calculated from the first 14 using a mod-36 method: each character is turned into a number from 0 to 35, alternate positions are weighted, the results are summed in a specific way, and the remainder decides the check character.

The practical effect is that most single-character typos and many swapped characters produce a different check character. If someone types 27AAPFU0939F1ZX instead of 27AAPFU0939F1ZV, the validator reports a checksum mismatch and tells you that "V" was expected. That is often enough to catch an error before it reaches your GST return.

## How to use the BISCS GSTIN Validator

1. Open the [GSTIN Validator](/tools/gstin-validator/).
2. Stay on **Single GSTIN** and type or paste the number. Spaces and hyphens are ignored, and lower case is converted to capitals.
3. Read the result: valid or invalid, with the state, PAN, holder type and entity number.
4. Check the list of individual tests (length, characters, state code, PAN pattern, holder type, entity number, 14th character and checksum) to see exactly what failed.
5. For many numbers, switch to **Bulk check**, paste up to 5,000 GSTINs, filter to valid or invalid, and click **Export CSV** to save the results.

Everything runs locally in your browser with no network requests, so your customer and supplier lists stay on your device.

## When should you validate a GSTIN?

- **Before raising a B2B invoice.** A wrong GSTIN means your customer may not see the invoice correctly in their records and may not be able to claim input tax credit.
- **When onboarding a vendor.** Catch typos in vendor master data early.
- **Before filing GSTR-1.** Bulk-check your customer list to reduce errors in reported B2B supplies.
- **When cleaning a spreadsheet.** Paste a whole column, export the CSV and fix the invalid rows.

Once the number checks out, you can use it in the free [Invoice Generator](/tools/invoice-generator/) and work out tax with the [GST Calculator](/tools/gst-calculator/).

## Format check vs portal verification

| Question | Format validator | GST portal search |
|---|---|---|
| Is the number correctly formed? | Yes | Yes |
| Is there a typo? | Usually detected by checksum | Shows "not found" |
| Is the registration active, cancelled or suspended? | No | Yes |
| What is the legal and trade name? | No | Yes |
| Works offline, in bulk, privately | Yes | No |

Use both: the validator for speed and bulk cleaning, and the portal's Search Taxpayer page for status and name.

## Common mistakes with GST numbers

1. **Confusing O and 0, or I and 1.** The checksum usually catches these.
2. **Using a GSTIN from the wrong state.** A business registered in several states has a different GSTIN in each; match it to the place of supply.
3. **Assuming the 14th character is always Z.** It is Z for regular registrations; a few special registration types follow different patterns and may be flagged.
4. **Relying on format alone for large transactions.** Always confirm status on the portal.
5. **Copying from a scanned invoice without checking.** OCR often misreads characters; validate after copying.

The PAN inside a GSTIN can also be checked separately with the [PAN & IFSC Checker](/tools/pan-ifsc-validator/).

## Important limits

The validator checks structure and the checksum only. It cannot see GST network data, so a correctly formed number might still have been cancelled, suspended or never issued. This guide is general information, not legal or tax advice. Before relying on a counterparty's registration, verify it on the official GST portal (gst.gov.in), and consult a GST practitioner if a mismatch affects your returns or input tax credit.
