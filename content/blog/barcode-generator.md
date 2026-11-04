{
  "tool": "barcode-generator",
  "slug": "how-to-make-barcode-ean-13-code-128",
  "title": "How to Make a Barcode: EAN-13, Code 128, UPC and More",
  "description": "Generate Code 128, EAN-13, UPC-A, ITF-14 and other barcodes for labels and inventory. Learn which format to use, how check digits work and printing tips.",
  "keywords": ["barcode generator", "ean 13 barcode generator", "code 128 barcode", "barcode for products india", "free barcode maker"],
  "summary": "To make a barcode, choose a format that suits your use, such as Code 128 for internal labels or EAN-13 for retail products, enter the number or text, and download the image. BISCS India’s free Barcode Generator creates barcodes in your browser as PNG or SVG. For retail products, the number itself must be licensed from GS1.",
  "faq": [
    { "q": "Can I sell products in shops with a barcode made here?", "a": "The generator draws a correct barcode image for any number you enter, but retail barcodes also need a unique, registered number. In India, EAN-13 numbers starting with 890 are allotted by GS1 India to member companies. Large retailers and online marketplaces usually require GS1-registered numbers, so register first and then create the image." },
    { "q": "Which barcode type should I use for my own stock?", "a": "Code 128 is the most flexible choice for internal use. It accepts letters, numbers and symbols, is compact, and almost every scanner reads it. Use it for SKU labels, asset tags, files and library books. Choose EAN or UPC only when a product will be sold through retail systems that expect them." },
    { "q": "What is the check digit in an EAN-13 barcode?", "a": "It is the 13th digit, calculated from the first 12 so that scanners can detect misreads. If you type 12 digits, the generator adds it for you. If you type 13 digits, the last one must be correct or the tool shows an error, which catches typing mistakes." },
    { "q": "Why will my barcode not scan after printing?", "a": "The usual causes are printing too small, bars blurred by a low-quality printer, low contrast colours, or a quiet zone that is too narrow. Print at a larger bar width, use dark bars on a white background, keep empty space on both sides, and test with the scanner you will actually use." }
  ]
}
---
A barcode stores a number or short text as a pattern of bars that a scanner can read in a fraction of a second. To make one, choose the right **format** for your use, enter the data, and download the image. For internal labels, **Code 128** is usually the best choice. For products sold in retail stores, **EAN-13** is the standard in India and most of the world.

The free [Barcode Generator](/tools/barcode-generator/) creates all the common formats in your browser and downloads them as PNG or SVG, with no sign-up and no uploads.

## Which barcode formats are supported?

| Format | What it encodes | Typical use |
|---|---|---|
| Code 128 | Any letters, numbers and symbols | SKUs, shipping labels, asset tags, files |
| EAN-13 | 13 digits | Retail products in India and worldwide |
| EAN-8 | 8 digits | Very small retail packs |
| UPC-A | 12 digits | Retail products mainly in the US and Canada |
| Code 39 | Uppercase A–Z, digits, space and - . $ / + % | Older industrial and ID systems |
| ITF-14 | 14 digits | Cartons and outer cases |
| MSI Plessey | Digits | Shelf labels and warehouses |
| Pharmacode | A number from 3 to 131070 | Pharmaceutical packaging control |
| Codabar | Digits and a few symbols | Libraries, blood banks, older systems |

If you are not sure, pick Code 128. It is compact, reads reliably and accepts almost anything you type.

## How to create a barcode with the BISCS tool

1. Open the [Barcode Generator](/tools/barcode-generator/).
2. Choose the **Type** of barcode. A sample value appears, with a hint describing what that format accepts.
3. Type your own **content**, such as an SKU like `KUR-BLU-M-042` or a 12-digit EAN number.
4. Adjust **bar width**, **height**, **font size** and **quiet zone** (the blank margin).
5. Choose bar and background colours, tick **Show text below** for a human-readable number, or make the background transparent.
6. Download as **PNG** (exported at double resolution) or **SVG** for sharp printing at any size.

If the content is not valid for the chosen format, for example letters in an EAN-13 field, the tool explains what is wrong instead of producing a broken barcode. All drawing happens on your device.

## EAN-13 and the check digit, explained

An EAN-13 number has three parts: a **GS1 prefix** (890 for numbers issued through GS1 India), a **company and product number**, and a final **check digit**.

The check digit lets a scanner catch misreads. To calculate it:

1. Take the first 12 digits, for example `890123456789`.
2. Starting from the rightmost digit, multiply digits alternately by 3 and 1.
3. Add the results. Here the total is 130.
4. The check digit is the amount needed to reach the next multiple of 10. 130 is already a multiple of 10, so the check digit is **0**.

The full number is **8901234567890**. In the generator, you can type just the 12 digits and it adds the check digit for you. If you type all 13, it checks that the last digit is correct, which is a quick way to spot a typo on a product list.

### Do you need GS1 registration?

For goods sold through supermarkets, large retail chains or many online marketplaces, yes. The barcode image is easy to make, but the **number** must be unique worldwide. In India, GS1 India allots EAN numbers to registered companies for a fee. Making up an 890 number risks clashing with another company's product. Check the current registration process and fees on GS1 India's official website.

For goods you sell only in your own shop, or for internal stock, you can use your own numbering with Code 128.

## Practical uses for small businesses

- **Kirana and retail stores:** label loose or self-packed items with your own codes for faster billing.
- **Boutiques and clothing shops:** encode style, colour and size in an SKU like `KUR-BLU-M-042`.
- **Warehouses:** use ITF-14 on cartons and Code 128 on bin locations.
- **Offices and schools:** tag laptops, projectors and library books for audits.
- **Events:** print barcodes on passes for quick check-in.

## Printing tips for barcodes that scan first time

- **Size matters.** Very small barcodes are hard to print sharply. Increase the bar width if your printer struggles.
- **Keep the quiet zone.** Leave clear space on both sides; text or borders too close can stop a scan.
- **Use high contrast.** Black bars on white is safest. Red bars are a common mistake, because many scanners use red light and cannot see them.
- **Use SVG for label software** and design tools, so the bars stay crisp at any size.
- **Test before a big print run,** with the actual scanner or app you will use.
- **Choose matte labels** if glare from glossy stickers causes misreads.

## Common barcode mistakes

- Using EAN-13 for internal stock when Code 128 would be simpler.
- Inventing retail numbers instead of getting them from GS1.
- Duplicating the same code on two different products in your system.
- Stretching a barcode image unevenly, which distorts the bar widths.
- Printing on curved or textured surfaces without testing.
- Forgetting the human-readable text, which staff need when a scan fails.

## Barcode or QR code?

Linear barcodes store a short number and suit billing systems and inventory scanners. QR codes store far more, such as a full website link, Wi-Fi details or a UPI payment address, and can be read by any phone camera. For marketing or payments, use the [QR Code Generator](/tools/qr-code-generator/). For product labels on a billing counter, stick with a barcode.

When you start selling, the [GST Invoice Generator](/tools/invoice-generator/) creates proper tax invoices, and the [HSN Code Finder](/tools/hsn-code-finder/) helps you find the right HSN code for each product.

A clear, correctly formatted barcode saves time at every scan. Make yours with the [Barcode Generator](/tools/barcode-generator/) and test it once before printing in bulk.
