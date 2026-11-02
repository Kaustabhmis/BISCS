{
  "tool": "pan-ifsc-validator",
  "slug": "pan-ifsc-code-format-check",
  "title": "PAN and IFSC Code Format Check: What Each Character Means",
  "description": "Check PAN, IFSC and MICR code formats, decode the PAN holder type and bank code, validate PANs in bulk and know when you still need the official portal.",
  "keywords": ["pan validator", "pan card format check", "ifsc code checker", "ifsc code format", "micr code meaning"],
  "summary": "A PAN has 10 characters in the pattern AAAAA9999A, where the fourth letter shows the holder type, such as P for an individual or C for a company. An IFSC has 11 characters: a four-letter bank code, a zero and a six-character branch code. BISCS India's free PAN & IFSC Checker validates both formats privately in your browser.",
  "faq": [
    { "q": "What does the fourth letter of a PAN mean?", "a": "It identifies the type of holder. P is an individual, C a company, H a Hindu Undivided Family, F a firm or LLP, A an association of persons, T a trust, B a body of individuals, L a local authority, J an artificial juridical person and G a government body. The checker shows this for every PAN you enter." },
    { "q": "Can this tool tell me whose PAN it is?", "a": "No. It checks the structure only and shows the holder type and the initial letter in the fifth position. It has no access to the Income Tax Department's database, so it cannot confirm the name, whether the PAN exists or whether it is active. Use the Verify Your PAN service on the e-filing portal for that." },
    { "q": "Why is the fifth character of an IFSC always zero?", "a": "The fifth character is reserved for future use and is currently always the digit 0. A common data-entry mistake is typing the letter O instead. The checker flags this immediately, which helps avoid failed NEFT, RTGS or IMPS transfers caused by a mistyped code." },
    { "q": "Can I find the branch address from an IFSC here?", "a": "No. The checker identifies the bank from the first four letters using a built-in list of about 80 bank codes, including older codes of merged banks, but it does not include branch names or addresses. Confirm the branch using the RBI's published IFSC list or your bank's website." },
    { "q": "What is a MICR code and where do I find it?", "a": "A MICR code is a nine-digit number printed at the bottom of a cheque, used for cheque clearing. The first three digits are a city code that usually matches the first three digits of the city's PIN code, the next three identify the bank and the last three the branch." }
  ]
}
---
A PAN (Permanent Account Number) is valid in format if it has exactly 10 characters: five letters, four digits and one letter, as in **ABCPK1234F**. The fourth letter tells you the type of holder, such as P for an individual or C for a company. An IFSC (Indian Financial System Code) has 11 characters: four letters for the bank, a zero, and six letters or digits for the branch, as in **SBIN0001234**.

The free [PAN & IFSC Checker](/tools/pan-ifsc-validator/) on BISCS India checks both patterns, decodes what each part means and also reads MICR codes from cheques. It works entirely offline in your browser, so the numbers you check are not uploaded anywhere.

## How is a PAN structured?

Using the sample **ABCPK1234F**:

| Position | Example | Meaning |
|---|---|---|
| 1–3 | ABC | Alphabetic series |
| 4 | P | Holder type (P = individual) |
| 5 | K | First letter of the surname for individuals, or of the name for others |
| 6–9 | 1234 | Sequence number |
| 10 | F | Check letter |

The holder types the checker recognises are P (individual), C (company), H (HUF), F (firm or LLP), A (association of persons), T (trust), B (body of individuals), L (local authority), J (artificial juridical person) and G (government).

One honest limit: the tenth character is a check letter, but the Income Tax Department does not publish how it is calculated. So no offline tool can verify it. A PAN can pass every format check and still not exist.

## How is an IFSC structured?

| Part | Example | Meaning |
|---|---|---|
| Characters 1–4 | SBIN | Bank code (here, State Bank of India) |
| Character 5 | 0 | Always the digit zero, reserved |
| Characters 6–11 | 001234 | Branch code, unique within the bank |

The checker recognises about 80 bank codes, including payment banks, small finance banks, major co-operative banks and older codes of banks that have merged, such as Vijaya Bank (now part of Bank of Baroda) or Syndicate Bank (now part of Canara Bank). You can browse and filter the full list on the tool page.

## How to use the BISCS PAN & IFSC Checker

1. Open the [PAN & IFSC Checker](/tools/pan-ifsc-validator/).
2. On the **PAN** tab, type a PAN. Spaces are ignored and letters are capitalised. You will see whether the format is valid, the holder type, the fifth-character initial and a list of checks.
3. To check many PANs, switch to **Bulk**, paste up to 5,000 (one per line or separated by commas, semicolons or tabs), then click **Export CSV** for a spreadsheet of results with reasons.
4. On the **IFSC** tab, type an 11-character code to see the bank name and branch code, or a clear reason if the format is wrong.
5. On the **MICR** tab, type the nine digits from the bottom of a cheque to split it into city, bank and branch codes.

## When is a format check useful?

- **Payroll and vendor onboarding:** catch typos in employee or supplier PANs before they reach TDS returns, where a wrong PAN can cause mismatches.
- **Setting up bank transfers:** confirm an IFSC is well formed and belongs to the bank you expect before adding a beneficiary.
- **Cleaning data:** bulk-check a column of PANs from a spreadsheet and fix invalid rows.
- **Invoices and quotations:** many businesses print their PAN and bank details on invoices. Check them once before using the [Invoice Generator](/tools/invoice-generator/).

For GST numbers, which contain a PAN inside them, use the [GSTIN Validator](/tools/gstin-validator/), which also verifies the GSTIN's checksum.

## Common mistakes the checker catches

1. **Letter O instead of zero** in the fifth position of an IFSC.
2. **Swapped letters and digits** in a PAN, such as "ABCPK12E4F".
3. **Extra characters** from copying, like a trailing full stop or an extra digit.
4. **Unknown holder type**, where the fourth PAN letter is not one of the recognised codes.
5. **Old bank codes.** A merged bank's code may still appear valid, but some old IFSCs have been retired, so confirm with the bank.

## Privacy matters with PAN

PAN details are personal financial identifiers and are often misused in fraud. The checker never sends what you type to a server; it uses built-in rules only. Even so, share PANs only with people and organisations that genuinely need them, such as your employer, bank or tax deductor, and avoid posting PAN cards on messaging groups.

## What this tool cannot do

It cannot confirm that a PAN is issued, active or linked to Aadhaar, and it cannot tell you the holder's name. It cannot look up branch addresses or confirm that an IFSC is still in use. This guide is general information, not legal or financial advice. For authoritative answers, use the Verify Your PAN service on the Income Tax Department's e-filing portal (incometax.gov.in), the RBI's published IFSC and MICR lists, or your bank. If you are working on TDS, the [Income Tax Calculator](/tools/income-tax-calculator/) can help you estimate tax, but the e-filing portal remains the final word.
