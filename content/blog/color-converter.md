{
  "tool": "color-converter",
  "slug": "hex-rgb-hsl-color-converter-guide",
  "title": "HEX to RGB and HSL Colour Converter (With Contrast Check)",
  "description": "Convert colours between HEX, RGB, HSL, HSV and CMYK, pick colours from your screen, build tints and shades, and check WCAG contrast for readable text.",
  "keywords": ["hex to rgb", "color converter", "rgb to hex", "hsl color picker", "wcag contrast checker"],
  "summary": "To convert a colour, enter it in any format, such as #4F46E5, rgb(79, 70, 229) or hsl(243, 75%, 59%), and read the equivalents in the others. BISCS India's Color Converter handles HEX, RGB, HSL, HSV and CMYK, shows tints and shades, and checks WCAG text contrast, all inside your browser.",
  "faq": [
    { "q": "What is the difference between HEX and RGB?", "a": "None in the colour itself. Both describe the same red, green and blue values from 0 to 255. HEX writes each value as two hexadecimal digits, so rgb(255, 153, 51) becomes #FF9933. HEX is compact for CSS and design tools; RGB is easier to read and adjust by hand." },
    { "q": "Why should I use HSL in CSS?", "a": "HSL describes colour as hue, saturation and lightness, which matches how people think. To make a button darker on hover, you lower the lightness and keep the hue the same. Building a consistent palette is much easier than guessing new HEX values, and all modern browsers support it." },
    { "q": "Is the CMYK value accurate for printing?", "a": "It is a straightforward mathematical conversion, useful as a starting point. Real print colours depend on the printer, paper and colour profile, so a professional printer may give different values. For brand-critical printing, such as visiting cards or packaging, ask your printer for a proof or use their recommended profile." },
    { "q": "What contrast ratio do I need for readable text?", "a": "WCAG 2.1 level AA asks for at least 4.5:1 between normal body text and its background, and 3:1 for large text, roughly 18.66px bold or 24px regular and above. Level AAA raises these to 7:1 and 4.5:1. The converter shows the ratio against white and black for any colour." },
    { "q": "How do I pick a colour from a logo or website?", "a": "In Chrome and Edge on a computer, click Pick from screen and then click anywhere on your screen to capture that colour. In browsers without the EyeDropper feature, use the BISCS India Image Color Picker on a screenshot or image file instead." }
  ]
}
---
A colour converter translates one colour into every other format you might need. Type `#FF9933`, the saffron of the Indian flag, and you instantly get `rgb(255, 153, 51)`, `hsl(30, 100%, 60%)` and the rest, ready to paste into CSS, a design tool or a print brief.

The [Color Converter](/tools/color-converter/) on BISCS India accepts any CSS colour, including names like `teal`, and converts between HEX, RGB, HSL, HSV and CMYK. It also generates a row of tints and shades and checks text contrast against WCAG guidelines, which is where colour choices most often go wrong.

## The main colour formats, explained simply

Screens make colour by mixing red, green and blue light. Every format below is just a different way of writing that mix.

| Format | Example | Best for |
| --- | --- | --- |
| HEX | `#4F46E5` | CSS, design handoff, brand guides |
| RGB | `rgb(79, 70, 229)` | Reading values, transparency with `rgba` |
| HSL | `hsl(243, 75%, 59%)` | Adjusting lightness, building palettes |
| HSV / HSB | `hsv(243, 69%, 90%)` | Colour pickers in Photoshop and Figma |
| CMYK | `cmyk(66%, 69%, 0%, 10%)` | A starting point for print |

**HEX** is RGB in hexadecimal: two digits each for red, green and blue, from `00` to `FF` (0 to 255). Short forms like `#FFF` expand to `#FFFFFF`, and an eight-digit form like `#4F46E580` adds transparency.

**HSL** stands for hue (the position on the colour wheel, 0–360 degrees), saturation (how vivid, 0–100%) and lightness (from black at 0% to white at 100%). It is the most intuitive format for making related colours.

**HSV**, also called HSB, uses value or brightness instead of lightness. Many design apps show it in their pickers, so the converter includes it for easy matching.

**CMYK** is the ink model used in printing: cyan, magenta, yellow and black.

## How to convert a colour with BISCS India

1. Open the [Color Converter](/tools/color-converter/).
2. Type or paste a colour into **Any CSS colour (name, hex, rgb, hsl)**, or edit any of the individual **HEX**, **RGB**, **HSL**, **HSV / HSB** or **CMYK** fields directly. All the others update instantly.
3. Use the colour picker swatch for a visual choice, **Random** for inspiration, or **Pick from screen** (in browsers that support it) to grab a colour from anywhere on your display.
4. Click the copy button next to any format to copy it.
5. Look at **Tints & shades**, a row of lighter and darker versions of your colour. Click any one to copy it.
6. Check **Contrast (WCAG 2.1)** to see whether white or black text on your colour is readable.

## Converting HEX to RGB by hand

It is worth knowing how it works, if only to sanity-check a value. Split the HEX code into pairs and convert each from base 16 to base 10:

```text
#FF9933
 FF -> 15×16 + 15 = 255   (red)
 99 ->  9×16 +  9 = 153   (green)
 33 ->  3×16 +  3 =  51   (blue)
= rgb(255, 153, 51)
```

In JavaScript:

```js
const hex = 'FF9933';
const [r, g, b] = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
// [255, 153, 51]
```

For other base conversions, such as binary or octal, the [Number Base Converter](/tools/number-base-converter/) does the arithmetic.

## Transparency: rgba, hsla and eight-digit HEX

Sometimes you need a colour you can see through, such as a dark overlay on a hero image so white text stays readable. CSS offers three equivalent ways to add an alpha (opacity) value from 0 (invisible) to 1 (solid): `rgba(0, 0, 0, 0.5)`, `hsla(0, 0%, 0%, 0.5)` and the eight-digit HEX `#00000080`, where the last two digits are the alpha on the 00–FF scale.

The converter reads all three forms. Paste a semi-transparent colour and the alpha carries through to the RGB and HSL outputs, so you can switch notation without losing it. Keep in mind that contrast ratios for see-through colours depend on whatever sits behind them, so check the final, blended result on the real page.

## Why contrast matters

A colour can look great on a brand board and still be unreadable as a button label. Colour vision deficiency is common, particularly among men, and everyone struggles with low contrast on a phone in bright sunlight.

The Web Content Accessibility Guidelines (WCAG) measure contrast as a ratio from 1:1 (no difference) to 21:1 (black on white). The common targets are:

- **4.5:1** for normal text (level AA).
- **3:1** for large text and for important interface elements like input borders and icons (level AA).
- **7:1** for normal text at the stricter AAA level.

The converter shows the ratio of your colour against white and against black, with a pass or fail for each level. If neither passes, darken or lighten the colour using the tints and shades row until one does.

## Building a palette from one brand colour

Most brands start with one or two colours. You need more: a lighter version for backgrounds, a darker one for hover states, and borders in between. The **Tints & shades** row gives you that range in one click.

A practical approach for a small business site:

- Use the base colour for primary buttons and links, only if white text on it passes 4.5:1.
- Use a very light tint for section backgrounds or highlighted boxes.
- Use a darker shade for hover and active states.
- Keep body text near-black, not your brand colour, for readability.

Once you have colours, the [CSS Gradient Generator](/tools/css-gradient-generator/) can blend two of them into a background.

## Common mistakes with colour codes

- **Forgetting the `#`.** CSS needs `#FF9933`, not `FF9933`.
- **Confusing HSL and HSV.** `hsl(30, 100%, 60%)` and `hsv(30, 100%, 60%)` are different colours. Check which one your tool expects.
- **Trusting CMYK for print without a proof.** On-screen conversion cannot know your printer’s inks and paper.
- **Picking text colour by eye.** Always check the contrast ratio, especially for light greys and pastel brand colours.
- **Copying a colour from a compressed image.** JPEG compression shifts colours slightly. Get official brand values from the source file or brand guide where possible.

## Picking colours from images

The **Pick from screen** button uses the browser’s EyeDropper feature, currently available in Chromium-based browsers such as Chrome and Edge on desktop. If you do not see the button, your browser does not support it. In that case, take a screenshot and use the [Image Color Picker](/tools/image-color-picker/), which reads colours from any image file.

## Privacy

Everything is calculated in your browser. No colours, screenshots or picks are sent anywhere, so you can work freely on unreleased brand identities and client projects.
