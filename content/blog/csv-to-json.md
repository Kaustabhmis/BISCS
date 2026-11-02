{
  "tool": "csv-to-json",
  "slug": "convert-csv-to-json-online",
  "title": "How to Convert CSV to JSON Online (Quotes, Types, Headers)",
  "description": "Convert CSV or Excel exports into a clean JSON array. Handle quoted commas, detect numbers and booleans, pick delimiters and keep PIN codes safe.",
  "keywords": ["csv to json", "convert csv to json online", "csv to json array", "excel to json", "tsv to json"],
  "summary": "To convert CSV to JSON, paste the CSV into a converter that reads the first row as headers and turns each following row into a JSON object. BISCS India's CSV to JSON tool auto-detects the delimiter, handles quoted commas and line breaks, optionally converts numbers and booleans, and runs fully in your browser.",
  "faq": [
    { "q": "How do I convert an Excel sheet to JSON?", "a": "Save or export the sheet as CSV first (File, Save As, CSV UTF-8 in Excel, or File, Download, CSV in Google Sheets). Then paste or upload the CSV into the converter. If you have an .xlsx file and no Excel, the BISCS India Excel and CSV Converter can produce the CSV for you." },
    { "q": "Why did my PIN code or phone number lose its leading zero?", "a": "With type detection on, a value like 0042 is kept as a string because numbers with leading zeros are not valid JSON numbers. However, the source CSV may already have lost the zero if Excel saved it as a number. Format such columns as Text in Excel before exporting." },
    { "q": "What does “Detect numbers, booleans & null” do?", "a": "CSV has no data types; every value is text. With this option on, values like 2500.50 become JSON numbers, true and false become booleans, and the word null becomes null. Turn it off when you need every value kept exactly as a string, for example IDs or codes." },
    { "q": "Can the converter handle commas inside a value?", "a": "Yes, as long as the value is wrapped in double quotes in the CSV, which is the standard. For example, \"Das, Rohan\" stays one value. Double quotes inside a quoted value are written as two quotes, and line breaks inside quotes are also preserved." },
    { "q": "What if some rows have fewer columns than the header?", "a": "The missing cells are filled with empty strings, or null if you tick Empty cells as null. The status line warns you how many rows were short, which often signals an unquoted comma or a broken line in the source file." }
  ]
}
---
Converting CSV to JSON means reading a table and writing each row out as an object whose keys come from the header row. A two-line CSV like `name,city` / `Asha,Delhi` becomes `[{"name": "Asha", "city": "Delhi"}]`.

That sounds simple, until you meet a value with a comma in it, a note that spans two lines, or a semicolon-separated file from a European tool. The [CSV to JSON](/tools/csv-to-json/) converter on BISCS India follows the CSV standard (RFC 4180) closely, so those cases come out right, and it all happens in your browser.

## Why convert CSV to JSON?

Spreadsheets are where data is born in most offices. JSON is what applications want. You might need to:

- Seed a database or a test fixture from a list someone maintained in Excel.
- Feed a product catalogue or price list into a website or app.
- Send records to an API that accepts JSON only.
- Load a lookup table, such as state codes or HSN categories, into JavaScript.

Writing that JSON by hand is slow and error-prone. A converter does it in a second.

## A worked example

Here is a small CSV with a few awkward values:

```text
id,name,city,amount,paid,notes
1,Asha Verma,Delhi,2500.50,true,
2,"Das, Rohan",Kolkata,1200,false,"Said ""call later"""
```

With the default settings, the output is:

```json
[
  { "id": 1, "name": "Asha Verma", "city": "Delhi", "amount": 2500.5, "paid": true, "notes": "" },
  { "id": 2, "name": "Das, Rohan", "city": "Kolkata", "amount": 1200, "paid": false, "notes": "Said \"call later\"" }
]
```

The quoted `"Das, Rohan"` stays a single value. The doubled quotes `""` turn into a literal quote, which JSON then escapes as `\"`. And because type detection is on, `2500.50` is a number and `true` is a boolean rather than strings.

## How to convert CSV to JSON with BISCS India

1. Open [CSV to JSON](/tools/csv-to-json/).
2. Paste your CSV, drag a `.csv`, `.tsv` or `.txt` file onto the box, or click **Upload**.
3. Leave **Delimiter** on **Auto-detect** unless the result looks wrong. It checks comma, semicolon, tab and pipe and picks the one that gives the most consistent column count.
4. Choose the **Output**: **Array of objects** (most common) or **Array of arrays** (smaller, positional).
5. Set the options: **First row is header**, **Detect numbers, booleans & null**, **Empty cells as null**, **Skip empty lines** and **Minify**.
6. Check the table in **Preview** and the status line, which reports rows, columns, the delimiter used and any rows with missing cells.
7. Click **Copy** or **Download .json**.

## Array of objects or array of arrays?

| Output | Looks like | Use it when |
| --- | --- | --- |
| Array of objects | `[{"name":"Asha","city":"Delhi"}]` | Sending to APIs, databases, most code |
| Array of arrays | `[["name","city"],["Asha","Delhi"]]` | Charts, compact storage, column order matters |

Objects are self-describing and easier to work with in code. Arrays repeat no key names, so they are smaller for large tables.

## When should you turn off type detection?

Type detection is convenient, but some values only look like numbers. Switch it off, or check the output carefully, for:

- **Account numbers, Aadhaar-style IDs and long reference numbers.** The tool only converts numbers up to 15 significant digits, so longer IDs stay as strings. Shorter IDs still become numbers, which may not be what your system expects.
- **Codes with leading zeros.** `0042` is kept as a string, because `0042` is not a valid JSON number. Good, but be aware the column then has mixed types if other rows are plain numbers.
- **Version numbers and phone numbers.** `10.20` becomes the number `10.2`, losing the trailing zero.

If in doubt, keep everything as strings and convert the specific fields you need in your own code.

## Common mistakes and how to spot them

- **Unquoted commas.** `Mumbai, Maharashtra` without quotes splits into two cells. The status bar warns about rows with a different number of columns.
- **An unclosed quote.** One stray `"` can swallow the rest of the file into a single value. The converter flags "Unclosed quote at the end of the file" when this happens.
- **Duplicate or blank headers.** Two columns both called `phone` would overwrite each other in an object. The tool renames the second one `phone_2`, and blank headers become `column_1`, `column_2` and so on.
- **The wrong delimiter.** If everything lands in a single column, the file probably uses semicolons or tabs. Auto-detect usually catches this; otherwise choose manually.
- **Excel’s hidden encoding.** Save as "CSV UTF-8" in Excel so that Indian-language text and the ₹ sign survive. A byte order mark at the start of the file is removed automatically.

## Is my data uploaded anywhere?

No. The CSV is parsed by JavaScript running on the page, and the JSON is built in memory on your device. Text files up to 50 MB can be loaded, though very large files will take longer on a phone. Because nothing leaves your computer, you can safely convert staff lists, customer exports or price sheets.

## Related tools

To check or prettify the resulting JSON, open it in the [JSON Formatter](/tools/json-formatter/), which also offers a collapsible tree view. Going the other direction, [JSON to CSV](/tools/json-to-csv/) turns API data back into a spreadsheet-ready file. If your source is an `.xlsx` workbook rather than a CSV, start with the [Excel & CSV Converter](/tools/excel-csv-converter/).

## A quick checklist before you use the JSON

- Row count in the status line matches what you expect.
- No warning about rows with missing cells or unclosed quotes.
- IDs and codes are strings if your system treats them as text.
- Empty cells are `""` or `null`, whichever your application expects.
- Key names are clean: no stray spaces, no duplicates.

Five seconds spent on this list saves a lot of head-scratching when the import fails later.
