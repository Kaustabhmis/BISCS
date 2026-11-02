{
  "tool": "salary-slip-generator",
  "slug": "salary-slip-format-pf-esi-professional-tax",
  "title": "Salary Slip Generator: Payslip Format with PF, ESI and PT",
  "description": "Create monthly payslips with Basic, HRA, EPF, ESI, professional tax and TDS. Learn what each salary component means and how the deductions are worked out.",
  "keywords": ["salary slip generator", "payslip format india", "salary slip with pf and esi", "professional tax west bengal", "how to calculate epf deduction"],
  "summary": "A salary slip lists an employee’s monthly earnings, such as Basic and HRA, minus deductions like EPF, ESI, professional tax and TDS, to show net pay. BISCS India’s Salary Slip Generator calculates these from your figures, handles loss-of-pay days, shows employer contributions and prints a professional payslip as a PDF from your browser.",
  "faq": [
    { "q": "How is the EPF deduction on a salary slip calculated?", "a": "The employee contributes 12% of PF wages, which usually means Basic plus Dearness Allowance. Many employers apply the statutory wage ceiling of ₹15,000 a month, which caps the employee share at ₹1,800. Contributions on a higher wage are allowed by choice. Tick PF wage only for the components your employer counts." },
    { "q": "When does ESI apply to an employee?", "a": "At the time of writing, ESI covers employees whose gross monthly wages are up to ₹21,000, with a higher limit of ₹25,000 for persons with disability. The employee pays 0.75% and the employer 3.25% of gross wages. Coverage is decided per contribution period, so check the ESIC rules for mid-period salary changes." },
    { "q": "What is the professional tax slab in West Bengal?", "a": "As built into this tool, the West Bengal monthly slab is nil up to ₹10,000, ₹110 for ₹10,001 to ₹15,000, ₹130 for ₹15,001 to ₹25,000, ₹150 for ₹25,001 to ₹40,000 and ₹200 above ₹40,000. State rates can change, so confirm with the state’s commercial tax department." },
    { "q": "Is a salary slip from an online generator valid?", "a": "A payslip is valid when it is issued by the employer and reflects salary actually paid. The generator only helps employers and small businesses format slips correctly. Creating payslips for salary that was not paid, for loans or visas, is fraud. Banks often cross-check slips with bank statements and Form 16." },
    { "q": "Why are employer PF and ESI shown separately?", "a": "Employer contributions are part of the cost to company but are not deducted from the employee’s pay, so they do not affect net salary. Showing them in a separate box helps employees understand their CTC. The tool splits employer PF into the pension share of 8.33% and the provident fund share of 3.67%." }
  ]
}
---
A salary slip, or payslip, is the monthly statement an employer gives an employee showing how their pay was worked out: the earnings, each deduction, and the net amount credited to the bank. For employees it is proof of income for loans, rental agreements and visas. For employers, especially small businesses, it is a basic record-keeping duty.

The BISCS India generator does the arithmetic and layout for you, but it helps to understand what every line means. That is what most of this guide covers.

## What is on a typical Indian salary slip?

A complete payslip has four parts:

1. **Employer and employee details**: company name and address, employee name, ID, designation, department, date of joining, PAN, UAN and bank account (usually only the last few digits).
2. **Attendance**: days in the month, paid days and loss-of-pay (LOP) days.
3. **Earnings and deductions**, side by side, with totals.
4. **Net pay**, in figures and in words, and space for signatures.

Some employers also show employer contributions to PF and ESI, which helps employees understand their cost to company (CTC).

## Salary components explained

### Earnings

| Component | What it is | Notes |
|---|---|---|
| Basic | The core fixed salary | Usually the base for PF and often for gratuity |
| Dearness Allowance (DA) | Inflation-linked allowance | Common in government and some private jobs; usually counts for PF |
| House Rent Allowance (HRA) | Help with rent | Tax exemption depends on your tax regime and rent paid |
| Conveyance or transport allowance | Travel to work | Tax treatment has changed over the years; check current rules |
| Special allowance | Balancing figure in the salary structure | Fully taxable |
| Bonus, overtime, incentives | Variable pay | Shown only in the months paid |

### Deductions

**Employees' Provident Fund (EPF).** The employee contributes 12% of PF wages, usually Basic plus DA. The statutory wage ceiling is ₹15,000 a month, so many employers calculate PF on a maximum of ₹15,000, which caps the employee share at ₹1,800. Employers and employees may agree to contribute on the full wage instead. The employer also contributes 12%, of which 8.33% (on wages up to ₹15,000) goes to the Employees' Pension Scheme and the rest to the PF account.

**Employees' State Insurance (ESI).** At the time of writing, ESI applies to employees with gross monthly wages up to ₹21,000 (₹25,000 for persons with disability) in covered establishments. The employee pays 0.75% of gross wages and the employer 3.25%. ESI is assessed over six-month contribution periods, so an employee who crosses the limit mid-period may continue to contribute until it ends.

**Professional tax (PT).** A state tax on employment, deducted by the employer. Each state sets its own slabs, some states do not levy it at all, and the Constitution caps it at ₹2,500 per person per year.

**Income tax (TDS).** The employer estimates your annual tax under your chosen regime and deducts a share each month.

**Other deductions**: salary advances, loan recoveries, canteen charges and similar items.

## Professional tax: the West Bengal slab

The generator includes the West Bengal monthly slab, as currently implemented in the tool:

| Monthly salary | Professional tax |
|---|---|
| Up to ₹10,000 | Nil |
| ₹10,001 to ₹15,000 | ₹110 |
| ₹15,001 to ₹25,000 | ₹130 |
| ₹25,001 to ₹40,000 | ₹150 |
| Above ₹40,000 | ₹200 |

It also offers simplified slabs for Maharashtra and Karnataka, a manual entry option for other states, and a "No professional tax" option for states such as Delhi that do not levy it. Rates are revised from time to time, so verify the current slab with your state's commercial tax or professional tax department before issuing slips.

## How to create a salary slip

1. Open the [Salary Slip Generator](/tools/salary-slip-generator/). Sample data loads so you can see a complete slip.
2. Enter **company details**, and optionally upload a logo and choose an accent colour.
3. Enter **employee details**: name, ID, designation, department, PAN, UAN, bank account digits and date of joining.
4. Choose the **pay month**, and enter any **LOP days**. Tick "Reduce earnings for LOP days" to pro-rate pay.
5. Add **earnings**. Tick **PF wage** for the components that count towards PF, usually Basic and DA.
6. Set the **deductions**: EPF (with or without the ₹15,000 cap), ESI, the professional tax state, TDS and any other deductions.
7. Check the preview, then click **Download PDF** and choose "Save as PDF" in the print dialog.

To issue slips for several months at once, use **Print several months** and pick a range, such as a financial year. Months other than the selected pay month assume full attendance, so adjust any month with LOP separately.

## A worked example

Take the sample: Basic ₹15,000, HRA ₹7,500, conveyance ₹1,600 and special allowance ₹5,900, for a gross of ₹30,000 in Kolkata.

- EPF: 12% of ₹15,000 (Basic only) = ₹1,800
- ESI: not applicable, as gross is above ₹21,000
- Professional tax (West Bengal, ₹25,001 to ₹40,000): ₹150
- Net pay before TDS: ₹30,000 − ₹1,800 − ₹150 = ₹28,050

If the employee had two LOP days in a 30-day month with pro-rating on, each earning would be reduced by 2/30 before deductions are worked out.

## Common payslip mistakes

- **Counting HRA or special allowance as PF wages.** That inflates the deduction; follow your organisation's PF policy.
- **Applying ESI above the limit**, or forgetting it for a low-paid employee.
- **Using the wrong state's PT slab** for an employee who works in another state.
- **Net pay that does not match the bank credit.** Slips should reflect what was actually paid.
- **Missing PAN or UAN**, which employees need for tax filing and PF tracking.

## Important: rules change, so verify

This tool uses EPF at 12% with the ₹15,000 wage ceiling, ESI at 0.75% and 3.25% up to ₹21,000 gross, and simplified PT slabs. India's new labour codes also change how "wages" are defined for PF and other purposes, which can affect salary structures. Check current rates and how they apply to your organisation with your payroll adviser, the EPFO and ESIC websites, or your state tax department.

A payslip must reflect salary genuinely paid. Making slips for income that does not exist, for a loan or visa, is fraud.

## Related tools and privacy

Employees can check the tax side of their salary with the [Income Tax Calculator](/tools/income-tax-calculator/) and work out exempt HRA with the [HRA Calculator](/tools/hra-calculator/). Tenants claiming HRA will also need rent receipts, which the [Rent Receipt Generator](/tools/rent-receipt-generator/) creates.

Salary data is sensitive. The [Salary Slip Generator](/tools/salary-slip-generator/) works in your browser, saves your draft only on your device, and does not send employee details to BISCS India.
