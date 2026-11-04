{
  "tool": "excel-csv-converter",
  "slug": "convert-excel-to-csv-json-online",
  "title": "Convert Excel to CSV or JSON (and Back) in Your Browser",
  "description": "Open XLSX, CSV and JSON files, search and sort the data, then save as Excel, CSV or JSON. Fix garbled Hindi in CSVs and choose the right delimiter. Free tool.",
  "keywords": ["excel to csv converter", "csv to excel online", "xlsx to json", "open csv file online", "convert spreadsheet format"],
  "summary": "To convert Excel to CSV, open the .xlsx file in a converter, pick the sheet and download it as CSV. BISCS India’s Excel & CSV Converter also turns CSV or JSON into Excel, lets you view, search and sort large sheets, and handles delimiters and Indian-language text, all on your device without uploading the file.",
  "faq": [
    { "q": "Why does Hindi or Bengali text look garbled when I open a CSV in Excel?", "a": "Excel sometimes guesses the wrong text encoding for CSV files and shows Indian-language characters as symbols. Saving the CSV with a UTF-8 byte order mark tells Excel the correct encoding. The converter’s UTF-8 BOM (for Excel) option is on by default for this reason." },
    { "q": "Can the converter open old .xls files?", "a": "No. Only the modern .xlsx and .xlsm formats are supported, along with CSV, TSV, text and JSON. Open the old file in Excel, LibreOffice or Google Sheets, save it as .xlsx or .csv, and then open it here." },
    { "q": "Are formulas kept when I convert?", "a": "The converter reads the last calculated value of each formula cell, not the formula itself. That is what you want for CSV and JSON, which cannot hold formulas anyway. If you need the formulas, keep working in the original Excel file and use this tool only for exports." },
    { "q": "What is a CSV delimiter and which one should I use?", "a": "The delimiter is the character that separates columns. Comma is the most common. Semicolon is used in many European settings where the comma is a decimal mark, tab avoids clashes with commas in addresses, and pipe is used by some bank and accounting exports. Choose whatever the receiving system expects." },
    { "q": "Can it handle large files?", "a": "Yes. Files with 50,000 or more rows open comfortably on a computer because the table only draws the rows you can see. Very large workbooks take longer to read on phones and older laptops, but nothing is uploaded, so there is no server size limit." }
  ]
}
---
An Excel and CSV converter changes spreadsheet data from one format to another: Excel workbook (.xlsx) to CSV, CSV to Excel, or either one to JSON. You open the file, check the data, and download it in the format the next system wants.

It sounds trivial until you hit the real-world snags: a bank portal that wants a pipe-separated file, a CSV where every Hindi name turns into question marks, or a phone with no spreadsheet app. This guide covers those too.

## When do you need to convert spreadsheet formats?

- **Uploading to portals.** Government, banking and payroll portals often accept only CSV, sometimes with a specific delimiter.
- **Importing contacts or products.** Google Contacts, e-commerce platforms and CRMs usually import CSV.
- **Sharing data with developers.** Apps and APIs prefer JSON.
- **Opening a CSV properly.** A CSV exported from software is easier to read and filter as an Excel workbook with a bold, frozen header row.
- **Viewing a file on the go.** Check an Excel attachment on a phone without installing an office app.

## How to convert Excel to CSV (or CSV to Excel)

1. Open the [Excel & CSV Converter](/tools/excel-csv-converter/).
2. Choose or drag in your file: `.xlsx`, `.xlsm`, `.csv`, `.tsv`, `.txt` or `.json`.
3. The data appears in a table. For workbooks with several sheets, switch between them using the tabs.
4. Use the search box to filter rows, and click column headers to sort if you need to.
5. Pick an export:
   - **Download .xlsx**: all sheets, with a bold, frozen header row.
   - **CSV (current sheet)**: choose the delimiter and whether to add a UTF-8 BOM.
   - **Download .json**: an array of objects using the header row, or an array of arrays.
   - **HTML table**: copy and paste into Word, Gmail or Google Docs with formatting.

For CSV files, the converter detects the delimiter automatically and shows which one it found.

## Which format should you choose?

| Format | Holds | Best for | Watch out for |
|---|---|---|---|
| XLSX | Multiple sheets, formatting, formulas | People working in Excel or Sheets | Not readable by many upload portals |
| CSV | One sheet of plain values | Imports, portals, simple data exchange | Encoding and delimiter issues; no formatting |
| JSON | Structured records | Developers, apps, APIs | Less friendly for non-technical users |
| HTML table | A formatted table | Pasting into emails and documents | Not meant for re-importing |

## Fixing garbled Hindi, Bengali and ₹ symbols in CSV files

A very common problem in India: you open a CSV in Excel and names like "राम" or "সুমিত" appear as strings of odd symbols, and ₹ turns into "â‚¹".

The cause is encoding. CSV files do not say which character set they use, and Excel on Windows does not always assume UTF-8. Adding a small marker at the start of the file, called a byte order mark (BOM), tells Excel to read it as UTF-8.

The converter's **UTF-8 BOM (for Excel)** option is ticked by default for this reason. Untick it only if the system you are uploading to rejects files with a BOM, which some older portals do.

## Detect numbers and dates: what it does

When building an Excel file from a CSV, **Detect numbers & dates** turns text that looks like a plain number or an ISO date into real numeric and date cells, so you can sum columns, filter by date and sort properly.

The detection is deliberately cautious, because spreadsheets are notorious for damaging Indian data:

- **Leading zeros are kept.** A value like "0712345" or a PIN-style code starting with zero stays as text, so it is not shortened.
- **Long numbers stay as text.** Values of 16 digits or more, such as some bank account or card-style numbers, are not converted, which avoids Excel's scientific notation and lost digits.
- **Only unambiguous dates are converted.** Dates written as YYYY-MM-DD, like 2025-04-01, become date cells. Formats such as 01/04/2025 stay as text, because they could mean 1 April or 4 January.
- **The header row is never converted**, so a column called "2025" stays a label.

Even so, IDs such as mobile numbers, Aadhaar-style numbers and employee codes are safest kept as text. If your file is mostly identifiers, untick the option and every value stays exactly as written.

## A worked example: a bank statement export

Suppose your bank lets you download a statement as a pipe-separated text file, and your accountant wants an Excel file.

1. Open the `.txt` file in the converter. The pipe delimiter is detected automatically.
2. Check that the columns line up: date, narration, withdrawal, deposit, balance.
3. Search for a party name, such as a supplier, to check a few entries quickly.
4. Click **Download .xlsx**. Amounts become numbers you can total, and the header row stays bold and frozen.

Going the other way, a payroll team can open a salary workbook, pick the sheet the portal needs, choose the delimiter the portal specifies, and download a CSV ready to upload.

## Common mistakes

- **Expecting CSV to keep every sheet.** A CSV holds one sheet. Export each sheet separately, or use XLSX.
- **Expecting formatting in CSV.** Colours, bold text, merged cells and formulas are lost; only values remain.
- **Uploading the wrong delimiter.** If a portal shows all your data in one column, it expected a different delimiter.
- **Exporting filtered rows by accident.** The export options can include only rows matching your search, in your sorted order. Clear the search if you want everything.
- **Opening old .xls files.** Save them as .xlsx first.

## Tips for cleaner data

- Search to find a specific invoice, GSTIN or customer in a large file without scrolling.
- Sort by amount or date before exporting a report.
- Developers converting between CSV and JSON for small snippets of pasted text may prefer [CSV to JSON](/tools/csv-to-json/) and [JSON to CSV](/tools/json-to-csv/), which work on text rather than files. To check or tidy a JSON file, use the [JSON Formatter](/tools/json-formatter/).

## Is it safe to open business spreadsheets here?

Yes. The [Excel & CSV Converter](/tools/excel-csv-converter/) reads and writes files inside your browser. Salary sheets, customer lists and sales data are not uploaded to BISCS India. The spreadsheet library is downloaded once when you first open an Excel file; after that, the conversion happens on your device.
