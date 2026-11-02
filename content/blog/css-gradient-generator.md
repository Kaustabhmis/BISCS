{
  "tool": "css-gradient-generator",
  "slug": "css-gradient-generator-linear-radial",
  "title": "CSS Gradient Generator: Linear, Radial and Conic Made Easy",
  "description": "Design linear, radial and conic CSS gradients visually, understand angles and colour stops, and copy clean background code with a solid-colour fallback.",
  "keywords": ["css gradient generator", "linear gradient css", "radial gradient generator", "conic gradient", "gradient background css"],
  "summary": "A CSS gradient is a smooth blend between colours created entirely in code with linear-gradient, radial-gradient or conic-gradient, so no image file is needed. BISCS India's CSS Gradient Generator lets you choose the type, angle and up to five colour stops visually, then copy ready-to-use CSS with a fallback colour.",
  "faq": [
    { "q": "Do CSS gradients work in all browsers?", "a": "Linear and radial gradients without vendor prefixes work in all current browsers. Conic gradients are supported in all modern browsers too, but not in very old ones. The generated code starts with a plain background colour, so if a browser cannot draw the gradient, it still shows a sensible solid colour." },
    { "q": "Are gradients better than background images?", "a": "For simple colour blends, yes. A gradient is a few dozen bytes of CSS, scales perfectly to any screen size and resolution, needs no extra download and is easy to change. Use an image only when you need texture, photographs or effects CSS cannot produce." },
    { "q": "Why does my gradient look banded or stripy?", "a": "Banding appears when two similar colours are stretched across a very large area, because screens can show only a limited number of steps between them. Use colours that differ more, add a middle stop, or overlay a very subtle noise texture. Some displays and compressed screenshots make banding more visible." },
    { "q": "What does 90deg mean in linear-gradient?", "a": "The angle sets the direction the gradient travels. 0deg goes from bottom to top, 90deg from left to right, 180deg from top to bottom and 270deg from right to left. The keyword form to right is equivalent to 90deg for a linear gradient." },
    { "q": "Can I put text on top of a gradient?", "a": "Yes, but check contrast at both ends of the gradient, not just in the middle. Text that is readable on the dark end may disappear on the light end. Use the BISCS India Color Converter to test each stop colour against your text colour for a WCAG contrast ratio of at least 4.5:1." }
  ]
}
---
A CSS gradient is a background that blends smoothly from one colour to another, drawn by the browser from a single line of code. No image file, no extra download, and it stays crisp on every screen from a budget Android phone to a 4K monitor.

The [CSS Gradient Generator](/tools/css-gradient-generator/) on BISCS India lets you build one visually. Choose linear, radial or conic, drag the angle and colour stops, and copy the finished `background` CSS. A live preview shows exactly what you will get.

## The three kinds of CSS gradient

**Linear gradients** blend along a straight line at an angle you choose. They are the most common, used for hero sections, buttons and cards.

```css
background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);
```

**Radial gradients** spread outward from a point, as a circle or ellipse. They are good for spotlights, soft glows and vignettes.

```css
background: radial-gradient(circle at center, #fde68a 0%, #fb7185 70%, #9d174d 100%);
```

**Conic gradients** sweep around a centre point like the hands of a clock. They are useful for colour wheels, pie-chart style indicators and eye-catching abstract backgrounds.

```css
background: conic-gradient(from 0deg at center, #22d3ee 0%, #a78bfa 33%, #f472b6 66%, #22d3ee 100%);
```

All three also have **repeating** versions, such as `repeating-linear-gradient`, which tile the pattern to create stripes.

## How to make a gradient with BISCS India

1. Open the [CSS Gradient Generator](/tools/css-gradient-generator/).
2. Start from a preset if you like. There are eight, including Indigo dusk, Ocean, Sunset, Mint and a tricolour-inspired Saffron. Or start from scratch.
3. Choose the **Type**: **Linear**, **Radial** or **Conic**.
4. For linear and conic, set the **Angle** with the slider. For radial, choose the **Shape** (circle or ellipse). For radial and conic, choose the **Position**, such as center, top left or bottom right.
5. Edit the **Colour stops**. Each stop has a colour picker, a HEX field and a position slider from 0% to 100%. Use **Add stop** for up to five colours, or the bin icon to remove one (a gradient always keeps at least two).
6. Tick **Repeating gradient** for striped or ring patterns.
7. Click **Random** for inspiration, then **Copy CSS** when you are happy.

The copied code includes two lines:

```css
background: #4f46e5;
background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);
```

The first line is a solid-colour fallback. Browsers that understand the gradient use the second line; anything older keeps the first.

## Understanding angles

Angles trip people up because CSS measures them differently from school geometry. In `linear-gradient`, the angle is the direction the colours **travel towards**:

| Angle | Direction | Keyword equivalent |
| --- | --- | --- |
| `0deg` | Bottom to top | `to top` |
| `90deg` | Left to right | `to right` |
| `135deg` | Top-left to bottom-right | (diagonal) |
| `180deg` | Top to bottom (the default) | `to bottom` |
| `270deg` | Right to left | `to left` |

For conic gradients, the angle sets where the sweep starts, measured clockwise from the top.

## Colour stops and hard edges

A colour stop is a colour plus a position. The browser blends smoothly between consecutive stops. If two stops share the same position, there is no blend at all, just a sharp line:

```css
background: linear-gradient(90deg, #ff9933 0% 33%, #ffffff 33% 66%, #138808 66% 100%);
```

That example draws three solid bands, an easy way to make flag-style stripes without images. In the generator, you get a similar effect by dragging two stops close together.

## Two popular tricks: overlays and gradient text

**Image overlays.** Text placed directly on a photo is often hard to read. Layering a semi-transparent gradient over the image fixes this without editing the photo. CSS lets you stack a gradient and an image in one `background` declaration, with the gradient listed first so it sits on top:

```css
background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%), url(hero.jpg) center / cover;
```

The bottom of the photo darkens gently, so a white headline there stays readable.

**Gradient text.** Headlines filled with a gradient are eye-catching. Apply the gradient as the background of the text element, then clip it to the letters with `background-clip: text` and make the text colour transparent. Use it sparingly, on large headings only, and keep a plain fallback colour so the text never disappears in a browser that does not support clipping.

## Design tips for gradients that look good

- **Stay close on the colour wheel.** Blues to purples, or oranges to pinks, usually look smoother than opposites like red to green, which pass through a muddy middle.
- **Add a middle stop to avoid greyness.** If the centre of your gradient looks dull, add a third stop with a brighter, more saturated colour.
- **Use subtle gradients for large areas.** A gentle shift between two close shades feels modern and does not fight with text.
- **Check text contrast at both ends.** White text may pass on the dark end and fail on the light end. Test stop colours in the [Color Converter](/tools/color-converter/).
- **Match your brand.** Start from your brand colour and a lighter or darker version of it, rather than random hues.

## Common mistakes

- **Using `background-color` for a gradient.** Gradients are images in CSS terms, so they belong in `background` or `background-image`, not `background-color`.
- **Forgetting the element has no height.** An empty `div` with a gradient background is zero pixels tall. Give it content, padding or a height.
- **Gradient on `body` that stops halfway.** On short pages, add `min-height: 100vh` to the element, or the gradient may repeat or end early.
- **Too many colours.** Five stops is plenty for almost any design. More usually looks busy.
- **Exporting a gradient as a PNG.** Code is smaller, sharper and easier to change than an image.

## Where gradients work well

Gradients suit landing page hero sections, call-to-action buttons, card headers, app splash screens and social media graphics. For more depth, pair a gradient card with a soft shadow from the [Box Shadow Generator](/tools/box-shadow-generator/). And if the gradient is headed for social media rather than a web page, the [Instagram Grid & Story Maker](/tools/social-post-maker/) helps you design posts and stories at the right sizes.

## Privacy

The preview is drawn by your own browser and nothing is sent to a server. You can design and copy as many gradients as you like with no account and no watermark.
