{
  "tool": "box-shadow-generator",
  "slug": "css-box-shadow-generator-guide",
  "title": "CSS Box Shadow Generator: Soft, Layered and Inset Shadows",
  "description": "Build CSS box shadows visually: offset, blur, spread, colour, inset and multiple layers. Learn what each value does and copy clean CSS for cards and buttons.",
  "keywords": ["box shadow generator", "css box shadow", "box-shadow examples", "inset shadow css", "layered shadow css"],
  "summary": "The CSS box-shadow property draws a shadow around an element using up to five parts: horizontal offset, vertical offset, blur, spread and colour, plus an optional inset keyword. BISCS India's Box Shadow Generator lets you adjust each value with sliders, stack up to eight layers and copy the finished CSS, all in your browser.",
  "faq": [
    { "q": "What is the order of values in box-shadow?", "a": "The order is horizontal offset, vertical offset, blur radius, spread radius and colour, for example 0 10px 30px -5px rgba(0, 0, 0, 0.18). Offsets are required; blur and spread are optional and default to zero. The inset keyword can go at the start or the end, and multiple shadows are separated by commas." },
    { "q": "What is the difference between blur and spread?", "a": "Blur controls how soft the shadow’s edge is: zero gives a hard edge, larger values fade it out over more pixels. Spread grows or shrinks the shadow before blurring. A positive spread makes it bigger than the element, and a negative spread pulls it inwards, which is the secret to soft, natural shadows." },
    { "q": "Does box-shadow slow down a website?", "a": "Static shadows are cheap for modern browsers. Problems arise mainly when very large, heavily blurred shadows are animated, or when hundreds of shadowed elements scroll on low-end phones. To animate a shadow smoothly, fade in a pseudo-element that already has the shadow, rather than animating box-shadow itself." },
    { "q": "Why use rgba instead of a solid colour for shadows?", "a": "Real shadows are partly transparent, letting the background show through. A solid grey shadow looks flat and wrong on coloured backgrounds. A black or dark-tinted colour at low opacity, typically 0.05 to 0.25, blends naturally with whatever is behind the element." },
    { "q": "What is the difference between box-shadow and drop-shadow?", "a": "box-shadow follows the element’s rectangular box, including rounded corners. The CSS filter drop-shadow follows the actual visible shape, including transparent areas of a PNG or SVG. Use box-shadow for cards and buttons, and drop-shadow for irregular shapes like icons or cut-out product photos." }
  ]
}
---
The CSS `box-shadow` property adds depth to flat elements: a card that seems to float, a button that looks pressable, an input that appears recessed. One line of CSS replaces what used to need image files and extra markup.

The catch is that its five numbers interact in ways that are hard to picture. The [Box Shadow Generator](/tools/box-shadow-generator/) on BISCS India solves that with sliders and a live preview. Adjust offset, blur, spread, colour and opacity, stack several layers, and copy the CSS once it looks right.

## The anatomy of a box-shadow

Here is a typical soft card shadow:

```css
box-shadow: 0px 10px 30px -5px rgba(0, 0, 0, 0.18);
```

Reading it left to right:

| Value | Name | What it does |
| --- | --- | --- |
| `0px` | X offset | Moves the shadow right (positive) or left (negative) |
| `10px` | Y offset | Moves it down (positive) or up (negative) |
| `30px` | Blur | Softens the edge; 0 is a hard edge |
| `-5px` | Spread | Grows (positive) or shrinks (negative) the shadow |
| `rgba(0, 0, 0, 0.18)` | Colour | Usually black or a dark tint at low opacity |

Add the keyword `inset` at the start and the shadow is drawn inside the element instead, making it look pressed in.

## How to build a shadow with BISCS India

1. Open the [Box Shadow Generator](/tools/box-shadow-generator/).
2. Click a preset to start: **Soft**, **Medium**, **Large**, **Hard**, **Glow**, **Layered**, **Neumorphic** or **Inset**.
3. Fine-tune with the sliders or number fields: **X offset** and **Y offset** (−100 to 100 px), **Blur** (0 to 200 px), **Spread** (−100 to 100 px) and **Opacity** (0 to 1).
4. Pick a shadow **Colour** and tick **Inset** if you want an inner shadow.
5. Match the preview to your design by setting the **Corner radius**, **Box colour** and **Background**. A shadow that looks good on white can look heavy on a grey page.
6. Click **Add layer** to stack another shadow (up to eight). Select a layer chip to edit it, or **Remove layer** to delete it.
7. Click **Copy CSS**.

## Why negative spread makes shadows look natural

Beginners often crank up the blur and wonder why the shadow looks like a grey cloud around the whole card. In real life, an object lifted off a surface casts a shadow mostly beneath it, not around its sides.

A negative spread shrinks the shadow before it is blurred, so it hides behind the element at the sides and peeks out mainly at the bottom, thanks to the positive Y offset. Compare:

```css
/* Muddy halo */
box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);

/* Lifted card */
box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.18);
```

## Layered shadows for realistic depth

Real shadows have a sharp, dark core close to the object and a wide, faint area further away. A single CSS shadow cannot do both, but several stacked shadows can. The **Layered** preset uses five shadows that double in size each time:

```css
box-shadow:
  0 1px 1px rgba(0, 0, 0, 0.08),
  0 2px 2px rgba(0, 0, 0, 0.08),
  0 4px 4px rgba(0, 0, 0, 0.08),
  0 8px 8px rgba(0, 0, 0, 0.08),
  0 16px 16px rgba(0, 0, 0, 0.08);
```

Each layer is very light on its own; together they produce a smooth, believable falloff. This approach is popular in modern design systems because it looks good on any background.

## Shadow styles and when to use them

- **Soft:** cards, modals and dropdown menus on light backgrounds.
- **Medium:** small UI elements like buttons and chips that need a gentle lift.
- **Large:** pop-ups and dialogs that should feel clearly above the page.
- **Hard:** zero blur and an offset, giving a flat, retro or "neo-brutalist" look.
- **Glow:** a coloured shadow with no offset, useful for focus states or highlighting a primary call to action.
- **Neumorphic:** a light shadow on one side and a dark one on the other, so the element seems extruded from the background. It only works when the element and background are the same colour, and it often has poor contrast, so use it sparingly.
- **Inset:** input fields, toggles and pressed button states.

## Design tips

- **Keep one light source.** If shadows on your page point down, all of them should. Mixed directions look odd.
- **Use elevation levels.** Define three or four shadows, for example resting, raised, floating and modal, and reuse them across the site instead of inventing new ones.
- **Tint shadows on coloured backgrounds.** On a blue background, a dark blue shadow looks richer than pure black.
- **Respect dark mode.** Shadows are barely visible on dark backgrounds. Many dark themes use lighter surface colours or subtle borders to show depth instead.
- **Do not rely on shadows alone.** An outline or slight background difference helps people with low vision tell where a card begins.

## Common mistakes

- **Opacity too high.** A shadow at 0.5 or more looks heavy and dated. Most interface shadows sit between 0.05 and 0.25.
- **Forgetting `border-radius`.** The shadow follows the element’s corners. If the card is rounded but the shadow preview was square, the result will not match. Set the same radius in the generator.
- **Shadows cut off.** A parent with `overflow: hidden` clips child shadows. Add padding to the parent or move the overflow rule.
- **Animating `box-shadow` directly.** It can be janky on slower phones. Animate the opacity of a pseudo-element that carries the shadow instead.
- **Using shadows as borders.** `0 0 0 1px` is a neat trick for a border that does not affect layout, but a real `border` or `outline` is clearer for accessibility tools.

## Pair it with other CSS tools

Shadows look best with a thoughtful background. Try a subtle gradient from the [CSS Gradient Generator](/tools/css-gradient-generator/) behind a white card, and choose a shadow tint that matches your palette using the [Color Converter](/tools/color-converter/).

## Privacy

The preview is rendered by your browser and the CSS is generated on the page. Nothing is uploaded or saved, and there is no sign-up or watermark.
