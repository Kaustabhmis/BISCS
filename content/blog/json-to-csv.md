{
  "tool": "json-to-csv",
  "slug": "convert-json-to-csv-excel",
  "title": "How to Convert JSON to CSV for Excel (Nested Data Too)",
  "description": "Turn a JSON array into a CSV file that opens cleanly in Excel or Google Sheets. Flatten nested objects, keep Hindi text intact and avoid common mistakes.",
  "keywords": ["json to csv", "convert json to excel", "json to csv converter online", "flatten nested json", "json array to csv"],
  "summary": "To convert JSON to CSV, paste a JSON array of objects into a converter, which turns each object into a row and each key into a column. BISCS India's JSON to CSV tool also flattens nested objects into columns like address.city and adds a UTF-8 BOM so Excel shows Indian-language text correctly, all inside your browser.",
  "faq": [
    { "q": "What JSON structure converts best to CSV?", "a": "An array of flat objects, where every object has the same keys, maps perfectly to a table: one object per row, one key per column. Nested objects can be flattened into dotted column names. Deeply nested arrays of objects do not fit a flat table well and are written as JSON text inside a cell." },
    { "q": "Why does Excel show strange characters instead of Hindi or the ₹ symbol?", "a": "Excel on Windows may guess the wrong text encoding when opening a CSV. Adding a UTF-8 byte order mark (BOM) at the start of the file tells Excel the file is UTF-8. The BISCS India tool adds this by default when you download, so Devanagari, Bengali and ₹ display correctly." },
    { "q": "My JSON is an object, not an array. Can I still convert it?", "a": "Yes. If the object contains exactly one array of objects, such as a results or data field, the tool uses that array automatically and tells you which one it picked. Otherwise the single object becomes a one-row CSV with each key as a column." },
    { "q": "What happens to commas and line breaks inside values?", "a": "They are handled using standard CSV quoting. Any value containing the delimiter, a double quote or a line break is wrapped in double quotes, and inner quotes are doubled. Excel, Google Sheets and most programming libraries read this format correctly." },
    { "q": "Should I use a comma or semicolon delimiter?", "a": "Use a comma for most cases. Choose semicolon if your spreadsheet is set to a European locale where the comma is the decimal separator. Tab is useful when pasting directly into a spreadsheet, and pipe suits data that contains lots of commas and is read by scripts." }
  ]
}
---
To convert JSON to CSV, you need JSON shaped like a list of records: an array of objects. Each object becomes one row and each key becomes a column header. Paste it into a converter, download the `.csv`, and open it in Excel or Google Sheets.

The [JSON to CSV](/tools/json-to-csv/) tool on BISCS India does this instantly in your browser. It also flattens nested objects, merges keys that only appear in some records, and adds a byte order mark so Excel does not garble Hindi names or the ₹ sign.

## When do you need to turn JSON into a spreadsheet?

Developers live in JSON, but managers, accountants and clients usually want Excel. Common situations include:

- Exporting orders or leads from an API so the sales team can filter them.
- Sharing a list of form submissions with someone who does not code.
- Reconciling payment gateway data against your books.
- Loading data into a tool that only accepts CSV imports.

CSV (comma-separated values) is the simplest common format both worlds understand. It is plain text, one record per line, with values separated by a delimiter.

## How the conversion works

Take this JSON array of customers:

```json
[
  { "id": 1, "name": "Asha Verma", "address": { "city": "Delhi", "pin": "110001" }, "tags": ["admin", "sales"] },
  { "id": 2, "name": "Rohan Das", "address": { "city": "Kolkata" }, "active": false }
]
```

With **Flatten nested objects** switched on, the converter produces:

```text
id,name,address.city,address.pin,tags,active
1,Asha Verma,Delhi,110001,"admin, sales",
2,Rohan Das,Kolkata,,,false
```

Notice three things. The nested `address` object became two columns using dot notation. The simple array `tags` became a single comma-separated value, quoted because it contains a comma. And `active`, which only Rohan’s record has, still gets a column; Asha’s cell is simply empty. The converter collects every key from every object, in the order it first sees them.

## Step-by-step: JSON to CSV with BISCS India

1. Open [JSON to CSV](/tools/json-to-csv/).
2. Paste your JSON into the left box, or click **Upload** to load a `.json` file. You can also drag a file onto the box.
3. Pick a **Delimiter**: comma, semicolon, tab or pipe.
4. Leave **Flatten nested objects (a.b.c)** ticked unless you want nested objects stored as raw JSON text in one cell.
5. Keep **Header row** ticked so the first line holds the column names.
6. Check the table under **Preview**. It shows up to the first 100 rows so you can spot problems before downloading.
7. Click **Download .csv**. With **Excel-friendly download (UTF-8 BOM)** ticked, the file opens correctly in Excel with a double-click.

If the JSON has a syntax error, the tool shows the line and column instead of output. Fix it there, or run it through the [JSON Formatter](/tools/json-formatter/) for a fuller view.

## What if my JSON is not a simple array?

Real API responses are rarely a bare array. They tend to look like this:

```json
{ "status": "ok", "page": 1, "results": [ { "id": 1 }, { "id": 2 } ] }
```

The converter looks for exactly one array of objects inside the top-level object. If it finds one, it uses it and shows a note such as "Using the “results” array." If there are several such arrays, it cannot guess which one you mean, so it treats the whole object as one row. In that case, copy just the array you want into the input.

An array of arrays, such as `[[1, "a"], [2, "b"]]`, is also accepted. Each inner array becomes a row, with generic `column_1`, `column_2` headers.

## Common mistakes when converting JSON to CSV

- **Expecting deep nesting to flatten perfectly.** Arrays of objects, such as order line items, cannot be flattened into a single row without losing structure. They are written as JSON text inside the cell. If you need one row per line item, reshape the data first.
- **Opening the CSV by double-clicking without a BOM.** Excel may show `à¤…` style garbage instead of Hindi. Keep the BOM option on, or import via Excel’s Data tab and choose UTF-8.
- **Losing leading zeros.** PIN codes are safe as text in the CSV, but Excel may strip a leading zero from values like `0042` or turn long numbers like account numbers into scientific notation. Import those columns as Text in Excel.
- **Mixing delimiters and locale.** If Excel puts everything in column A, your regional settings probably expect semicolons. Re-download with the semicolon delimiter.
- **Forgetting that dates are just strings.** JSON has no date type, so dates come through exactly as written, for example `2026-03-31T10:00:00Z`. Format them in the spreadsheet afterwards.

## Choosing a delimiter

| Delimiter | Best for |
| --- | --- |
| Comma `,` | Default; Excel and Google Sheets in Indian and US locales |
| Semicolon `;` | Spreadsheets set to European locales |
| Tab | Pasting straight into a sheet; data full of commas |
| Pipe | Script-to-script transfers, legacy bank and ERP formats |

## Privacy: your data stays on your device

Exports of customers, employees or payments are exactly the kind of data you should not paste into random websites. This converter reads and transforms the JSON with JavaScript in your own browser. Nothing is uploaded, and the CSV is generated locally when you click download.

## Going the other way, or into Excel directly

If you later receive a CSV and need JSON for an API or a script, use [CSV to JSON](/tools/csv-to-json/), which also detects numbers and booleans. For converting between CSV and real `.xlsx` workbooks, the [Excel & CSV Converter](/tools/excel-csv-converter/) handles the spreadsheet side.

## Tips for cleaner output

Keep key names short and consistent before converting, because they become your column headers. `customer_name` in one record and `customerName` in another will produce two separate columns. If your data comes from multiple API versions, normalise the keys first.

Finally, remember that the preview is your friend. Scroll it horizontally to check that every column you expect is there, and that nothing important ended up as a block of JSON text in a single cell.
