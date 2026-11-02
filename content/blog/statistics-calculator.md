{
  "tool": "statistics-calculator",
  "slug": "mean-median-mode-standard-deviation-guide",
  "title": "Mean, Median, Mode and Standard Deviation Explained Simply",
  "description": "Calculate average, median, mode, range, quartiles and standard deviation for any list of numbers. Clear formulas, worked examples and when to use each measure.",
  "keywords": ["mean median mode calculator", "standard deviation calculator", "average calculator", "how to find median", "sample vs population standard deviation"],
  "summary": "The mean is the sum of values divided by how many there are, the median is the middle value when sorted, and the mode is the most frequent value. Standard deviation measures how spread out the values are. BISCS India’s free Average & Statistics calculator finds all of these, plus quartiles and variance, from any pasted list.",
  "faq": [
    { "q": "When should I use the median instead of the mean?", "a": "Use the median when your data has extreme values or is skewed, such as salaries, house prices or delivery times. A single very large value pulls the mean up but barely moves the median. When data is fairly symmetric with no outliers, the mean and median are close and either works." },
    { "q": "What is the difference between sample and population standard deviation?", "a": "Population standard deviation divides by N and is used when your list contains every member of the group you care about. Sample standard deviation divides by n − 1 and is used when your list is a sample from a larger group. The sample version is slightly larger to correct for estimating from limited data." },
    { "q": "What if my data has two modes or no mode?", "a": "A list can have more than one mode if several values share the highest frequency, and the calculator lists them all. If every value appears only once, there is no mode, and the calculator says so rather than picking one arbitrarily." },
    { "q": "Can I paste data from Excel or Google Sheets?", "a": "Yes. Copy a column or row and paste it into the box. Numbers separated by new lines, tabs, commas, spaces or semicolons are all recognised, and symbols like ₹ and % are stripped. Text such as headings is skipped and listed so you can check nothing important was missed." },
    { "q": "How are quartiles calculated?", "a": "The calculator uses linear interpolation on the sorted data, the inclusive method used by Excel’s QUARTILE.INC function. Textbooks and other software sometimes use slightly different methods, so quartiles may differ a little for small data sets. Check which method your course or report expects." }
  ]
}
---
The **mean** (average) is the total of all values divided by how many values there are. The **median** is the middle value once the list is sorted. The **mode** is the value that appears most often. **Standard deviation** tells you how spread out the values are around the mean.

For the marks 78, 85, 62, 91, 85, 70, 88 and 73, the mean is 79, the median is 81.5, the mode is 85 and the population standard deviation is about 9.38. The free [Average & Statistics](/tools/statistics-calculator/) calculator gives all of these, and more, as soon as you paste your numbers.

## What does the calculator work out?

| Group | Measures |
|---|---|
| Central tendency | Count, sum, mean, median, mode, geometric mean |
| Spread | Minimum, maximum, range, Q1, Q3, interquartile range (IQR) |
| Variability | Variance, standard deviation and coefficient of variation, for both population and sample |
| Extras | Sorted list of values, and a note of any items skipped as non-numeric |

## How to use Average & Statistics

1. Open the [Average & Statistics](/tools/statistics-calculator/) calculator.
2. Type or paste your numbers into the box. Separate them with commas, spaces, tabs or new lines.
3. Read the mean at the top, with the count, sum and median beside it.
4. Scroll down for mode, geometric mean, range, quartiles, variance and standard deviation.
5. Use **Sort list** to tidy your input, or **Clear** to start again.

You can paste a column straight from Excel or Google Sheets. Symbols like ₹, $ and % are removed automatically, and anything that is not a number, such as a heading, is skipped and listed so you can check it. Your data stays in your browser.

## Formulas and worked example

Take the test marks of eight students: **78, 85, 62, 91, 85, 70, 88, 73**.

### Mean

Add them up: 632. Divide by the count, 8. **Mean = 79.**

### Median

Sort them: 62, 70, 73, 78, 85, 85, 88, 91. With an even count, the median is the average of the two middle values, 78 and 85. **Median = 81.5.**

### Mode

85 appears twice; every other mark appears once. **Mode = 85.**

### Range

Highest minus lowest: 91 − 62 = **29.**

### Standard deviation

1. Subtract the mean from each value and square the result. For 78, that is (78 − 79)² = 1; for 62, it is (62 − 79)² = 289.
2. Add all the squared differences. Here they total 704.
3. Divide by N (8) for the **population variance**, 88, or by n − 1 (7) for the **sample variance**, about 100.57.
4. Take the square root. **Population SD ≈ 9.38, sample SD ≈ 10.03.**

### Quartiles

Using the inclusive method, **Q1 = 72.25** and **Q3 = 85.75**, so the **IQR = 13.5**. Half the class scored within this middle band.

## Mean or median: which average should you use?

The mean uses every value, which is good, but it is sensitive to extremes. Consider five monthly salaries in a small office: ₹25,000, ₹28,000, ₹30,000, ₹32,000 and ₹35,000. The mean and median are both ₹30,000.

Now add the owner's ₹2,50,000. The **mean jumps to about ₹66,667**, which describes nobody in the office. The **median moves only to ₹31,000**, which still reflects a typical salary.

That is why incomes, property prices and waiting times are usually reported as medians. Use the mean when data is roughly symmetric, as with heights or many test scores, and when you need the total to make sense, such as average daily sales.

## Population or sample standard deviation?

- Use **population** (divide by N) when your list includes everyone you care about, like all 40 students in your class.
- Use **sample** (divide by n − 1) when your list is a sample used to estimate a larger group, like 200 customers surveyed out of thousands.

The calculator shows both side by side so you can pick the right one. In Excel, these correspond to STDEV.P and STDEV.S.

## What is the coefficient of variation?

The coefficient of variation (CV) is the standard deviation divided by the mean, shown as a percentage. It lets you compare spread between data sets with different scales. A shop whose daily sales have a CV of 8% is more predictable than one with a CV of 25%, even if their averages differ.

## When is the geometric mean useful?

The geometric mean multiplies all the values and takes the nth root, instead of adding and dividing. It is the right average for rates of growth that compound, such as investment returns or population growth.

Suppose a fund returns 10% one year and loses 10% the next. The arithmetic mean of the returns is 0%, which suggests you broke even. In fact ₹1,000 becomes ₹1,100 and then ₹990. Using growth factors of 1.10 and 0.90, the geometric mean is about 0.995, a loss of about 0.5% a year, which matches reality.

The calculator shows the geometric mean only when every value is positive, because it is not defined for zero or negative numbers. For returns, enter growth factors like 1.10 and 0.90 rather than percentages like 10 and −10.

## Common statistics mistakes

- **Forgetting to sort** before finding the median by hand.
- **Using the mean for skewed data,** such as salaries or delivery times with a few very late orders.
- **Mixing up sample and population** standard deviation in assignments.
- **Including headers or totals** when pasting a column, which can distort results. The calculator skips text, but a "Total" row with a number would be counted, so remove it first.
- **Reporting too many decimals.** Round to a sensible precision for your audience.
- **Assuming one mode.** Some data sets have several modes; others have none.

## Practical uses in everyday life

- **Students:** check homework answers and understand class results.
- **Teachers:** summarise test scores and spot outliers.
- **Small businesses:** analyse daily sales, order values or delivery times.
- **Households:** track monthly electricity or grocery spending and spot unusual months.
- **Analysts:** get a quick summary before building charts or reports.

For percentage changes between two values, use the [Percentage Calculator](/tools/percentage-calculator/). If you need to work with logs, powers or square roots alongside your data, the [Scientific Calculator](/tools/scientific-calculator/) is a good companion. And to pick a random sample of names for a survey, the [Random Name Picker](/tools/random-picker/) helps you select fairly.

Numbers tell a clearer story when you summarise them well. Paste your list into [Average & Statistics](/tools/statistics-calculator/) and see the full picture in one go.
