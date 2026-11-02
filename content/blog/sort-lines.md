{
  "tool": "sort-lines",
  "slug": "sort-lines-alphabetically-numerically-online",
  "title": "Sort Lines Alphabetically or by Number: Free Online Tool",
  "description": "Put any list in A–Z, Z–A, natural, numeric or length order, or shuffle it fairly. Learn when to use each sort mode, with tips for names, codes and prices.",
  "keywords": ["sort lines alphabetically", "sort list online", "alphabetical order tool", "sort numbers online", "shuffle list"],
  "summary": "To sort lines, paste a list with one item per line into a line sorter and pick an order such as A to Z, numeric or by length. BISCS India’s Sort Lines tool also offers natural sorting for item 2 before item 10, a fair shuffle, and duplicate removal, all inside your browser.",
  "faq": [
    { "q": "Why does item 10 come before item 2 when I sort?", "a": "Plain alphabetical sorting compares text character by character, so 1 in 10 comes before 2. Choose the Natural mode instead. It reads numbers inside text as whole numbers, so item 2 comes before item 10, the way people expect file names, roll numbers and flat numbers to be ordered." },
    { "q": "How does numeric sort handle prices like ₹1,250?", "a": "Numeric mode looks for the first number in each line, ignores the commas used as thousand separators, and sorts by its value. So ₹1,250 is read as 1250 and placed after ₹999. Lines with no number at all are moved to the end of the list." },
    { "q": "Is the shuffle option random enough for a lucky draw?", "a": "The shuffle uses your browser’s cryptographically secure random number generator with an unbiased algorithm, so every order is equally likely. For a public draw with prizes, also record the process, for example by screen recording, so participants can trust the result." },
    { "q": "Can I sort Hindi or Bengali text?", "a": "Yes. Alphabetical modes use your browser’s language-aware comparison, so text in Devanagari, Bengali and other scripts is ordered by that script’s character order instead of raw computer codes. Mixed lists usually place one script’s block before another’s." },
    { "q": "Does the tool remove duplicates as well?", "a": "It can. Tick Remove duplicates and repeated lines are dropped before sorting. Combine it with Ignore case so that Delhi and DELHI count as one entry. If you need to keep the original order instead, use the Remove Duplicate Lines tool." }
  ]
}
---
To sort lines, paste a list with one item per line, choose an order such as **A → Z**, **Numeric** or **By length**, and copy the result. A good line sorter also handles the awkward cases, like putting "Flat 2" before "Flat 10" or ignoring the commas in "₹1,25,000".

Below is how each sort mode works, which one to pick for common Indian lists, and the mistakes that lead to strange-looking results.

## How to sort a list online

1. Open [Sort Lines](/tools/sort-lines/).
2. Paste your list into the left box, one item per line.
3. Pick a mode: **A → Z**, **Z → A**, **Natural**, **Numeric**, **By length**, **Reverse order** or **Shuffle**.
4. Adjust the options if needed: **Remove duplicates**, **Trim spaces**, **Remove empty lines** and **Ignore case**.
5. The sorted list appears on the right as you go. Click **Copy** or **Download**, or **Use as input** to sort it again a different way.

If you chose Shuffle, a **Shuffle again** button appears so you can draw a fresh order.

## Which sort order should you choose?

Each mode solves a different problem. This table shows what each does with the same few lines.

| Mode | Best for | Example result |
|---|---|---|
| A → Z | Names, cities, words | Agra, Bhopal, Chennai |
| Z → A | Reverse alphabetical lists | Chennai, Bhopal, Agra |
| Natural | Text with numbers inside | Flat 2, Flat 10, Flat 101 |
| Numeric | Prices, scores, quantities | 7.5, 42, 100, 1,250 |
| By length | Finding short or long entries | Tea, Coffee, Masala chai |
| Reverse order | Flipping a list upside down | Last line becomes first |
| Shuffle | Random order, draws, quiz questions | Different every time |

### Alphabetical (A → Z and Z → A)

These modes use your browser's language-aware comparison rather than raw computer codes. That means "apple" and "Apple" sit together instead of all capitals coming first, and accented names like "José" sort next to "Jose". With **Ignore case** off, lines that differ only in capitals are kept in a consistent order.

### Natural

Natural sort is the one most people actually want for anything with numbers in it. Plain A → Z puts "Roll 10" before "Roll 2", because it compares the character "1" with "2". Natural mode understands that 10 is bigger than 2. Use it for file names, invoice numbers like "INV-9" and "INV-12", flat numbers and chapter lists.

### Numeric

Numeric mode finds the first number in each line and sorts by its value. It ignores commas, so Indian-style figures like "1,25,000" are read correctly, and handles decimals and negative numbers. Lines without any number are moved to the bottom, which makes them easy to spot and fix.

### By length

Sorting by length, shortest first, is surprisingly useful. It quickly shows blank-looking entries, codes that are missing a digit (a 9-digit mobile number in a list of 10-digit ones) and over-long product names that will not fit on a label.

### Shuffle

Shuffle puts lines in random order using the browser's cryptographically secure random generator and the Fisher–Yates method, so every arrangement is equally likely. Teachers use it to mix quiz questions or seating plans, and offices use it for duty rosters or Secret Santa lists. For picking one or a few winners from a list, the [Random Picker](/tools/random-picker/) is designed for that job.

## Common mistakes and how to fix them

- **Numbers sorted as text.** If "100" appears before "20", you are in A → Z mode. Switch to Natural or Numeric.
- **Phone numbers in mixed formats.** "+91 98300 12345" and "9830012345" will not sort together. Standardise them first with [Find and Replace](/tools/find-and-replace/).
- **Hidden spaces at the start of lines.** A leading space can push an item to the top. Keep **Trim spaces** ticked.
- **Dates in DD/MM/YYYY format.** Alphabetical sorting puts 01/12/2025 before 02/01/2025. For correct date order, write dates as YYYY-MM-DD before sorting, or sort them in a spreadsheet.
- **Sorting multi-column data.** If each line has a name and an amount separated by a tab, the whole line is sorted by its start. For proper column sorting, open the data in a spreadsheet or the [Excel & CSV Converter](/tools/excel-csv-converter/), which lets you sort by any column.

## Practical examples

**Alphabetical class list.** Paste student names, choose A → Z, tick Remove duplicates, and you have a clean register in seconds.

**Price list from a supplier.** Paste lines like "Rice 25 kg – ₹1,450", choose Numeric, and the tool sorts by the first number it finds. Here that is 25, not the price, so put the price first in each line, or edit the text so the number you care about comes before any other.

**Keyword lists.** SEO teams often merge keyword exports, remove duplicates and sort A → Z to group similar phrases together.

**Random presentation order.** Paste team names, choose Shuffle, and share the result on the group chat.

If you only need repeats removed and want to keep the existing order, use [Remove Duplicate Lines](/tools/remove-duplicate-lines/) instead.

## Does the sorter upload my list?

No. [Sort Lines](/tools/sort-lines/) runs completely inside your browser. The list you paste is not sent to BISCS India's servers or stored after you close the page, which makes it suitable for internal staff lists, customer data or exam marks.
