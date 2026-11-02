{
  "tool": "number-base-converter",
  "slug": "binary-decimal-hex-octal-conversion-guide",
  "title": "Binary, Decimal, Hex and Octal Conversion: A Practical Guide",
  "description": "Convert numbers between binary, octal, decimal, hexadecimal and any base up to 36. Learn the methods by hand with worked examples for students and developers.",
  "keywords": ["binary to decimal", "decimal to hex converter", "number base converter", "hex to binary", "octal to decimal"],
  "summary": "To convert a decimal number to another base, divide it repeatedly by the base and read the remainders from bottom to top; to convert back, multiply each digit by the base raised to its position and add. 255 is 11111111 in binary and FF in hex. BISCS India’s free Number Base Converter does this instantly for bases 2 to 36.",
  "faq": [
    { "q": "How do I convert binary to decimal quickly?", "a": "Write the place values 1, 2, 4, 8, 16 and so on under the binary digits from right to left, then add the place values where the digit is 1. For 1010, that is 8 + 2 = 10. The converter does it instantly, even for very long binary strings." },
    { "q": "Why do programmers use hexadecimal?", "a": "One hexadecimal digit represents exactly four binary digits, so long binary values become short and readable. A byte is always two hex digits, from 00 to FF. That is why colours, memory addresses, hashes and byte dumps are usually written in hex." },
    { "q": "Can the converter handle very large numbers?", "a": "Yes. It uses arbitrary-precision integers, so it converts numbers with hundreds of digits exactly, without the rounding that ordinary calculators introduce beyond about 16 significant digits. It works with whole numbers only, not fractions." },
    { "q": "How are negative numbers shown in binary?", "a": "The converter shows negative numbers with a leading minus sign, such as −1010 for −10. Computers usually store negative integers using two’s complement at a fixed width, such as 8 or 32 bits, which looks different. If you need two’s complement, work out the width first and convert manually." },
    { "q": "What does base 36 mean?", "a": "Base 36 uses the digits 0 to 9 and the letters A to Z, giving 36 symbols. It packs large numbers into short strings, so it is sometimes used for compact IDs or short codes. For example, 1,000,000 in base 36 is LFLS." }
  ]
}
---
A number base is how many different digits a number system uses. Decimal (base 10) uses 0 to 9, **binary** (base 2) uses only 0 and 1, **octal** (base 8) uses 0 to 7, and **hexadecimal** (base 16) uses 0 to 9 plus A to F. The same quantity just looks different: 255 in decimal is **11111111** in binary, **377** in octal and **FF** in hex.

The free [Number Base Converter](/tools/number-base-converter/) shows all four at once as you type, plus any custom base from 2 to 36, and handles numbers of any length exactly.

## Why different number bases exist

Humans count in tens, probably because we have ten fingers. Computers work with two states, on and off, so binary is their natural language. Long strings of 0s and 1s are hard for people to read, so programmers group them:

- **Hexadecimal** groups binary digits in fours. One hex digit equals exactly 4 bits, and a byte equals 2 hex digits.
- **Octal** groups binary digits in threes. It is still used for Unix and Linux file permissions.

You meet these bases in computer science classes, networking, web design, electronics and everyday programming.

## How to use the Number Base Converter

1. Open the [Number Base Converter](/tools/number-base-converter/).
2. Type a number into any field: **Binary, Octal, Decimal or Hexadecimal**.
3. The other fields update instantly. Prefixes like `0x`, `0b` and `0o`, spaces and underscores are accepted.
4. For another base, set **Custom base** to any value from 2 to 36 and read or type in the custom field.
5. Check the **Details** panel for bits needed, bytes, decimal digit count and whether the number is even or odd.
6. Use the copy button beside any field to copy that value.

The binary output is also shown grouped in nibbles (blocks of four bits), which makes it easy to read and to match against hex. Invalid digits, such as a 2 in a binary field, are flagged straight away. All work happens in your browser.

## How to convert by hand

### Decimal to binary: divide by 2

Convert **2026** to binary by dividing by 2 and noting each remainder:

| Division | Quotient | Remainder |
|---|---|---|
| 2026 ÷ 2 | 1013 | 0 |
| 1013 ÷ 2 | 506 | 1 |
| 506 ÷ 2 | 253 | 0 |
| 253 ÷ 2 | 126 | 1 |
| 126 ÷ 2 | 63 | 0 |
| 63 ÷ 2 | 31 | 1 |
| 31 ÷ 2 | 15 | 1 |
| 15 ÷ 2 | 7 | 1 |
| 7 ÷ 2 | 3 | 1 |
| 3 ÷ 2 | 1 | 1 |
| 1 ÷ 2 | 0 | 1 |

Read the remainders from bottom to top: **11111101010**. The same method works for any base: divide by 8 for octal or 16 for hex.

### Binary to decimal: add the place values

Each binary digit is worth twice the one to its right: 1, 2, 4, 8, 16, 32 and so on. For **1010**: 8 + 0 + 2 + 0 = **10**.

### Binary to hex: group in fours

Split 11111101010 into groups of four from the right, padding with zeros: 0111 1110 1010. Each group is one hex digit: 7, E, A. So 2026 is **7EA** in hex.

### Hex to decimal

Multiply each digit by a power of 16. **7EA** = 7 × 256 + 14 × 16 + 10 × 1 = 1,792 + 224 + 10 = **2,026**.

## Quick reference: hex, binary and decimal

Learning these sixteen rows by heart makes binary and hex conversion almost instant, because every hex digit maps to exactly one 4-bit pattern.

| Hex | Binary | Decimal | Hex | Binary | Decimal |
|---|---|---|---|---|---|
| 0 | 0000 | 0 | 8 | 1000 | 8 |
| 1 | 0001 | 1 | 9 | 1001 | 9 |
| 2 | 0010 | 2 | A | 1010 | 10 |
| 3 | 0011 | 3 | B | 1011 | 11 |
| 4 | 0100 | 4 | C | 1100 | 12 |
| 5 | 0101 | 5 | D | 1101 | 13 |
| 6 | 0110 | 6 | E | 1110 | 14 |
| 7 | 0111 | 7 | F | 1111 | 15 |

For octal, use only the last three bits of the first eight rows: 0 = 000 through 7 = 111. With these tables, converting between binary, octal and hex never needs a trip through decimal: just regroup the bits.

## Real-world examples

### Colours in web design

The colour `#FF8800` is three bytes: FF (255 red), 88 (136 green) and 00 (0 blue). Converting hex to decimal tells you the RGB values directly. The [Color Converter](/tools/color-converter/) does this for whole colours, including HSL.

### Linux file permissions

The permission `755` is octal. Each digit converts to three bits: 7 = 111, 5 = 101, 5 = 101, which reads as rwx r-x r-x. The owner can read, write and execute; others can read and execute.

### IP addresses

The IPv4 address 192.168.1.1 is four bytes. In binary: 11000000.10101000.00000001.00000001. Subnet masks make much more sense once you can see these bits.

### Limits of data types

The largest unsigned 32-bit integer is 4,294,967,295, which is FFFFFFFF in hex, or 32 ones in binary. Spotting that pattern helps when debugging overflows.

## Common conversion mistakes

- **Reading remainders top to bottom** instead of bottom to top.
- **Forgetting to pad groups** when converting binary to hex or octal from the wrong end. Always group from the right.
- **Using letters beyond the base,** like G in hex or 8 in octal.
- **Confusing 0x prefixes with digits.** `0x1F` is hex 1F, which is 31, not a number starting with zero.
- **Expecting two's complement output** for negative numbers. The tool uses a minus sign instead.
- **Trusting a normal calculator with huge numbers.** Standard floating-point arithmetic loses precision beyond about 16 digits; this tool uses exact integers.

## Tips for students and developers

- Memorise the 16 hex digits and their 4-bit patterns. It speeds up debugging enormously.
- Use the nibble-grouped binary view to check bit flags and masks.
- When writing numbers in code, add the right prefix so others know the base.
- For exam answers, show the division or place-value steps; the converter is ideal for checking your work.

For powers, logs and other maths, the [Scientific Calculator](/tools/scientific-calculator/) handles expressions with full keyboard support. If you are exploring older number systems, the [Roman Numerals](/tools/roman-numeral-converter/) converter is a fun contrast with place-value notation.

Whether you are studying for a computer science exam or reading a hex dump, the [Number Base Converter](/tools/number-base-converter/) gives you exact answers in every base at once.
