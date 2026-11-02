{
  "tool": "gst-calculator",
  "slug": "gst-calculator-add-remove-gst",
  "title": "How to Calculate GST: Add or Remove GST with CGST/SGST Split",
  "description": "Learn the formulas to add GST to a price or remove it from an inclusive amount, split CGST, SGST and IGST, and check your invoice maths with worked ₹ examples.",
  "keywords": ["gst calculator", "how to calculate gst", "remove gst from total", "gst inclusive price formula", "cgst sgst calculation"],
  "summary": "To add GST, multiply the net price by the rate and add the result: ₹10,000 at 18% becomes ₹11,800. To remove GST from an inclusive price, divide by (1 + rate ÷ 100): ₹11,800 ÷ 1.18 = ₹10,000. BISCS India's free GST Calculator does both and shows the CGST/SGST or IGST split.",
  "faq": [
    { "q": "How do I calculate GST backwards from the total amount?", "a": "Divide the GST-inclusive total by 1 plus the rate as a decimal. For 18% GST, divide by 1.18; for 5%, divide by 1.05. The answer is the taxable value, and the difference between the total and that value is the GST included in the price." },
    { "q": "Is CGST plus SGST the same as IGST?", "a": "In amount, yes. On an intra-state sale at 18%, you charge 9% CGST and 9% SGST, which together equal the 18% IGST you would charge on an inter-state sale. What differs is who receives the tax and how input tax credit is set off." },
    { "q": "Which GST rates are used after the September 2025 changes?", "a": "From 22 September 2025, GST rates were rationalised so that most goods and services fall in 5% or 18%, with 40% for certain luxury and sin goods. Special rates such as 3% for gold remain. Rates for specific items change by notification, so confirm the current rate on the CBIC website." },
    { "q": "Should GST be calculated on the discounted price or the MRP?", "a": "Generally GST is charged on the transaction value, so a discount shown on the invoice at the time of sale reduces the taxable value before GST is added. Post-sale discounts follow separate conditions. If you are unsure how a particular scheme is treated, check with a GST practitioner." },
    { "q": "Why does my bill show GST to the paisa but the calculator rounds?", "a": "The calculator shows amounts to two decimal places, which matches paisa-level billing. Businesses often round the final invoice total to the nearest rupee and show a small round-off line. That rounding is an accounting choice and does not change the tax rate applied." }
  ]
}
---
GST is calculated as a percentage of the taxable value of a sale. If a price excludes GST, multiply it by the rate and add that amount on top. If a price already includes GST, divide it by (1 + rate ÷ 100) to get the value before tax, then subtract to find the GST inside it.

For a sale within one state, the tax is split equally into CGST and SGST. For a sale from one state to another, the whole amount is charged as IGST. The free [GST Calculator](/tools/gst-calculator/) on BISCS India does all of this as you type and shows the same amount at every common rate.

## What is the formula to add GST to a price?

When you quote a price "plus GST", the arithmetic is simple:

- **GST amount** = net price × rate ÷ 100
- **Total** = net price + GST amount

**Example:** A Pune-based designer bills a client in Pune ₹10,000 for a logo, at 18%.

- GST = 10,000 × 18 ÷ 100 = ₹1,800
- Total = ₹11,800
- Split: CGST 9% = ₹900, SGST 9% = ₹900

If the same client were in Bengaluru, the designer would charge IGST of ₹1,800 instead of the CGST/SGST pair. The total stays ₹11,800.

## How do you remove GST from an inclusive amount?

Retail prices, restaurant menus and many online listings already include GST. To find the taxable value, divide rather than subtract a percentage:

- **Net price** = inclusive total ÷ (1 + rate ÷ 100)
- **GST included** = inclusive total − net price

**Example:** A box of stationery costs ₹5,250 including 5% GST.

- Net price = 5,250 ÷ 1.05 = ₹5,000
- GST included = ₹250 (₹125 CGST + ₹125 SGST)

The most common error is taking 18% of the total and subtracting it. On ₹11,800 that gives 11,800 − 2,124 = ₹9,676, which is wrong by more than ₹300, because the 18% was originally calculated on ₹10,000, not on ₹11,800.

## How to use the BISCS GST Calculator

1. Open the [GST Calculator](/tools/gst-calculator/).
2. Choose **Add GST (exclusive)** if your amount is before tax, or **Remove GST (inclusive)** if it already contains tax.
3. Type the amount in rupees. Commas are fine, and the field reformats when you leave it.
4. Pick a rate: 0.25%, 3%, 5%, 12%, 18%, 28% or 40%, or choose **Custom** and enter any rate up to 100%.
5. Select **Within state** for a CGST + SGST split or **Inter-state** for IGST.
6. Read the result card for the net amount, GST, the split and the total. Scroll down to the table to see the same amount worked out at every listed rate side by side.

Everything is calculated in your browser. The figures you enter are not sent anywhere, so you can check client invoices or supplier bills without sharing them.

## Which GST rate should you use?

The rate depends on the goods or services and is set by the GST Council through notifications. With effect from 22 September 2025, the structure was rationalised (often called "GST 2.0"): most goods and services now sit in the 5% and 18% slabs, and a 40% rate applies to certain luxury and sin goods. Special rates continue for a few categories, such as 3% on gold and jewellery and 0.25% on rough diamonds.

The calculator still offers 12% and 28% because older invoices, credit notes for earlier periods and some exceptions may need them. Treat the rate list as a convenience, not a ruling. Before you bill, look up your product's HSN or service's SAC code with the [HSN & SAC Code Finder](/tools/hsn-code-finder/) and confirm the current rate on the CBIC GST rate pages.

| Situation | Tax charged | Example on ₹10,000 at 18% |
|---|---|---|
| Seller and buyer in the same state | CGST + SGST, half each | ₹900 + ₹900 |
| Seller in a Union Territory without legislature, buyer in the same UT | CGST + UTGST | ₹900 + ₹900 |
| Seller and buyer in different states | IGST, full rate | ₹1,800 |
| Imports | IGST (plus customs duty) | ₹1,800 on the assessable value |

## When is a GST calculator most useful?

- **Quoting prices.** Freelancers and small businesses can check that "₹40,000 + GST" means ₹47,200 to the client at 18%.
- **Checking bills.** Restaurant, hotel and electronics bills sometimes mix inclusive and exclusive prices. Reverse calculation shows how much tax you actually paid.
- **Setting MRP.** If you want a shelf price of ₹999 inclusive of 5% GST, the taxable value is 999 ÷ 1.05 = ₹951.43, which helps you plan margins.
- **Reconciling purchases.** Before you claim input tax credit, a quick check of each supplier invoice can catch arithmetic slips.

## Common mistakes to avoid

1. **Subtracting the rate from an inclusive total.** Always divide by 1.18, 1.05 and so on.
2. **Charging CGST/SGST on an inter-state sale.** The place of supply decides the tax type. Charging the wrong one can mean paying the right tax again under the correct head and then claiming a refund of the wrong one.
3. **Splitting IGST.** IGST is never split; it is the full rate under one head.
4. **Using an outdated rate.** Rates for many items changed in September 2025. Copying a rate from an old invoice is risky.
5. **Ignoring rounding on high-volume billing.** Round each invoice consistently. Tiny paisa differences add up across thousands of bills.
6. **Applying GST before a trade discount.** If the discount is on the invoice, deduct it first. The [Discount Calculator](/tools/discount-calculator/) can add GST after stacked discounts.

## Tips for small businesses and freelancers

Keep the calculator open in a tab while drafting quotes, and when you are ready to bill, move the figures into the free [Invoice Generator](/tools/invoice-generator/). For B2B invoices, validate your customer's GST number first with the [GSTIN Validator](/tools/gstin-validator/) so the tax lands in the right place in their records.

If you sell both within your state and outside it, keep a separate column for IGST in your sales register. It makes GSTR-1 preparation and the GSTR-3B summary much easier at month end.

## A note on accuracy

This calculator does the arithmetic correctly for any rate you enter, but it cannot tell you which rate or tax type legally applies to your supply. Classification, exemptions, reverse charge and place-of-supply rules can be subtle. This guide is general information, not tax advice. For anything beyond routine billing, check the GST portal and CBIC notifications, or ask a chartered accountant or GST practitioner who knows your business.
