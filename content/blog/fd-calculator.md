{
  "tool": "fd-calculator",
  "slug": "fd-calculator-maturity-interest",
  "title": "FD Calculator: Fixed Deposit Maturity and Interest Explained",
  "description": "Calculate the maturity amount and interest on a bank fixed deposit with monthly, quarterly or yearly compounding, plus TDS, effective yield and common pitfalls.",
  "keywords": ["fd calculator", "fixed deposit calculator", "fd maturity amount", "fd interest calculator quarterly compounding", "bank fd returns"],
  "summary": "FD maturity is worked out as P × (1 + r ÷ n)^(n × t), where n is the number of compounding periods a year. ₹1 lakh at 7% for 5 years, compounded quarterly as most Indian banks do, matures to about ₹1,41,478. BISCS India's free FD Calculator shows maturity, interest earned and effective yield for any tenure.",
  "faq": [
    { "q": "Do banks compound FD interest quarterly?", "a": "Most Indian banks compound cumulative fixed deposits quarterly, which is why the calculator defaults to quarterly. Very short deposits are often paid simple interest at maturity instead. The exact method is in your bank's deposit terms, so check them if you need the figure to the rupee." },
    { "q": "What is the difference between the FD rate and the effective yield?", "a": "The FD rate is the nominal annual rate. The effective yield includes the effect of compounding within the year. At 7% compounded quarterly, the effective yield is about 7.19% a year. Banks sometimes advertise this annualised yield alongside the card rate." },
    { "q": "Is TDS deducted on fixed deposit interest?", "a": "Banks deduct TDS when your total interest from that bank in a financial year crosses the threshold, currently ₹50,000 for most depositors and ₹1 lakh for senior citizens. The rate is generally 10% if your PAN is linked. If your income is below the taxable limit, you can submit Form 15G or 15H to the bank." },
    { "q": "Is FD interest tax-free?", "a": "No. FD interest is added to your income and taxed at your slab rate, whether or not TDS was deducted. Only specific products, such as five-year tax-saver FDs under Section 80C in the old regime, offer a deduction on the deposit, and even then the interest is taxable." },
    { "q": "Is my fixed deposit insured?", "a": "Deposits in banks covered by DICGC are insured up to ₹5 lakh per depositor per bank, including principal and interest, at the time of writing. Amounts above that are not covered by the insurance. Corporate deposits and NBFC deposits are not covered by DICGC." }
  ]
}
---
A fixed deposit (FD) calculator works out how much you will receive at maturity when you lock in a sum at a fixed interest rate. Banks in India usually compound FD interest every quarter, so the formula is **A = P × (1 + r ÷ 4)^(4 × t)**, with r as the annual rate in decimal and t in years.

₹1,00,000 at 7% for 5 years, compounded quarterly, matures to about ₹1,41,478, so you earn ₹41,478 in interest. The free [FD Calculator](/tools/fd-calculator/) on BISCS India does this for any amount, tenure and compounding frequency, and shows the year-by-year growth.

## How is FD interest calculated?

Each quarter, the bank adds a quarter of the annual rate to your balance, and the next quarter's interest is calculated on that higher balance. For the example above:

- Quarterly rate: 7% ÷ 4 = 1.75%
- Number of quarters: 5 × 4 = 20
- Maturity: 1,00,000 × (1.0175)^20 ≈ ₹1,41,478

Compounding frequency makes a modest difference over five years:

| Compounding | Maturity on ₹1 lakh at 7% for 5 years | Interest |
|---|---|---|
| Yearly | ₹1,40,255 | ₹40,255 |
| Quarterly | ₹1,41,478 | ₹41,478 |
| Monthly | ₹1,41,763 | ₹41,763 |

The tool also shows the **effective yield**, which turns compounding into a single annual figure. At 7% compounded quarterly, that is about 7.19% a year.

## How to use the BISCS FD Calculator

1. Open the [FD Calculator](/tools/fd-calculator/).
2. Enter the **deposit amount** (the slider runs from ₹1,000 to ₹1 crore, and you can type any value).
3. Set the **interest rate** offered by your bank for your tenure.
4. Enter the tenure in **years, months and days**. For a 444-day special FD, for example, type 1 year, 0 months and 79 days.
5. Choose the **compounding frequency**: monthly, quarterly, half-yearly or yearly. Leave it on quarterly unless your bank says otherwise.
6. Read the maturity amount, total interest and effective yield, and check the year-wise table for opening balance, interest and closing balance each year.

Your numbers stay in your browser; nothing is uploaded.

## Example: comparing two FD offers

Ramesh, a retired teacher in Chennai, has ₹2 lakh to deposit for one year. Bank A offers 7.25% compounded quarterly. Bank B advertises 7.40% but pays simple interest at maturity for one-year deposits.

- Bank A: about ₹2,14,899 at maturity (₹14,899 interest)
- Bank B: 2,00,000 × 7.40% = ₹14,800 interest

The higher headline rate is not automatically better once compounding is considered, although the gap here is small. Over longer tenures, compounding matters more. Always compare the maturity amount, not just the rate. (Bank names here are illustrative.)

## How FD interest is taxed

FD interest is taxable at your income tax slab rate in the year it accrues, even if you choose a cumulative FD and receive everything at maturity. Banks deduct TDS once the interest you earn from them in a financial year crosses a threshold, currently ₹50,000 for most people and ₹1 lakh for senior citizens, generally at 10% if your PAN is on record.

TDS is not the final tax. If your slab rate is higher, you pay the difference when filing your return; if your total income is below the taxable limit, you can submit Form 15G (or 15H for seniors) to avoid deduction. To see how FD interest affects your overall tax, add it as "other income" in the [Income Tax Calculator](/tools/income-tax-calculator/).

## Common FD mistakes

1. **Comparing rates without the compounding basis.** Ask whether the rate is compounded quarterly or paid as simple interest.
2. **Forgetting post-tax returns.** For someone in the 30% slab, a 7% FD yields only about 4.8% after tax and cess.
3. **Breaking an FD early without checking the penalty.** Premature withdrawal usually means a lower rate and a penalty, which can wipe out much of the interest.
4. **Ignoring inflation.** If inflation is close to your FD rate, your real return after tax may be near zero or negative.
5. **Putting everything in one bank above the insurance limit.** DICGC cover is ₹5 lakh per depositor per bank.

## Tips for getting more from fixed deposits

- **Ladder your deposits.** Instead of one ₹5 lakh FD for five years, split it into five FDs of ₹1 lakh maturing in years one to five. Something always matures soon, so you rarely need to break an FD early, and you can reinvest at whatever rates are on offer then.
- **Check senior citizen rates.** Many banks pay senior citizens an extra margin on FDs. If a parent is above 60, an FD in their name may earn more, though the interest is then their income for tax purposes.
- **Match the tenure to the need.** Some banks have special tenures, such as 400 or 444 days, with slightly higher rates. Use the days field in the calculator to compare them with a standard one-year FD.
- **Use a nominee.** Adding a nominee makes it much easier for your family to claim the deposit if something happens to you.
- **Keep TDS in view.** If you expect interest above the TDS threshold at one bank, spreading deposits does not change your tax, but it can change when tax is deducted. Plan your advance tax and return accordingly.

## FD, RD or something else?

If you have a lump sum, an FD is the natural fit. If you want to save a fixed amount every month, the [RD Calculator](/tools/rd-calculator/) shows how a recurring deposit grows with quarterly compounding. And to see compounding over longer periods or with regular top-ups, the [Compound Interest](/tools/compound-interest-calculator/) calculator gives more flexibility.

## Limits of this calculator

The tool computes a cumulative (reinvestment) FD. For monthly or quarterly payout FDs, interest is paid out rather than compounded, so your maturity value is just the principal. It also treats part-years using the same compounding formula, while banks may apply simple interest to a final broken quarter or to short deposits. Expect small differences from your bank's figure.

Treat this as an estimate and general information, not financial or tax advice. Your bank's deposit advice is the binding document, and RBI and Income Tax Department rules on TDS and insurance can change, so confirm current limits on their official websites.
