{
  "tool": "image-color-picker",
  "slug": "pick-color-from-image-hex-code",
  "title": "How to Pick a Colour From an Image and Get Its HEX Code",
  "description": "Find the HEX, RGB or HSL code of any colour in a photo or screenshot, and extract a palette of its main colours. A free eyedropper that runs in your browser.",
  "keywords": ["color picker from image", "get hex code from image", "image eyedropper online", "extract color palette from image", "find colour of logo"],
  "summary": "To pick a colour from an image, open an image colour picker, upload the picture, click the exact spot you want and copy the HEX, RGB or HSL code. BISCS India’s Image Color Picker adds a magnifier for precise picking and extracts a palette of up to ten dominant colours, all inside your browser.",
  "faq": [
    { "q": "Why is the picked colour slightly different from my brand colour?", "a": "Photos and screenshots rarely contain one perfectly flat colour. Lighting, shadows, JPG compression and screen colour profiles all shift pixels slightly. Pick from the flattest, best-lit area, use the magnifier, and compare a few nearby points. For official brand colours, ask for the brand guidelines." },
    { "q": "What is the difference between HEX, RGB and HSL?", "a": "They describe the same colour in different ways. HEX is a six-character code such as #F76B15 used in web design. RGB lists red, green and blue amounts from 0 to 255. HSL uses hue, saturation and lightness, which is handy when you want a lighter or darker shade." },
    { "q": "How does the dominant colour palette work?", "a": "The tool scans a reduced copy of your image and groups similar pixels together using a clustering method called k-means. Each group becomes one colour in the palette, shown with the percentage of the image it covers. You can choose five, six, eight or ten colours." },
    { "q": "Can I pick colours from a screenshot of a website or app?", "a": "Yes. Take a screenshot, then paste it straight into the tool with Ctrl + V or upload the file. Screenshots are usually PNG, which keeps colours exact, so the codes you pick from flat buttons and backgrounds are generally very accurate." }
  ]
}
---
An image colour picker lets you click any point in a photo, logo or screenshot and get the exact colour code for it. Designers use it to match a brand colour, shop owners to choose a banner that goes with their products, and anyone decorating a home to match paint or fabric to a picture they like.

The [Image Color Picker](/tools/image-color-picker/) from BISCS India gives you HEX, RGB and HSL codes for any pixel, a magnifying lens for precision, a history of what you picked, and a palette of the image’s dominant colours. It all runs in your browser.

## How to find the colour code of anything in a picture

1. Open the [Image Color Picker](/tools/image-color-picker/) and choose an image, drag it in, or paste a screenshot with Ctrl + V.
2. Move your mouse or finger over the image. A round magnifier shows the pixels under your cursor at large size, with a small square marking the exact pixel.
3. Click or tap to pick that colour. The swatch updates and shows the **HEX**, **RGB** and **HSL** values.
4. Press the copy button next to the code you need.
5. Every colour you pick is added to the **History** row, so you can compare several and go back to an earlier one.
6. Scroll down to the **Dominant colour palette**, choose 5, 6, 8 or 10 colours, and click any swatch to copy it. Use **Copy HEX list** or **Copy CSS variables** to take the whole palette at once.

## HEX, RGB or HSL: which code should you use?

| Format | Example | Where it is used |
|---|---|---|
| HEX | #F76B15 | Websites, CSS, Canva-style design tools, most colour fields |
| RGB | rgb(247, 107, 21) | CSS, spreadsheets, programming, some print-shop forms |
| HSL | hsl(23, 93%, 53%) | CSS when you want easy lighter or darker variations |

If a tool asks for a colour and you are not sure, try HEX first. It is the most widely accepted. To convert between these and other formats, the [Color Converter](/tools/color-converter/) handles it in both directions.

## Picking accurately: what affects the result

### Choose a flat area

A logo on a white background is easy. A red saree in a photo is not: folds, highlights and shadows create dozens of shades of red. Use the magnifier to find a mid-tone area that is neither in shadow nor catching the light.

### Prefer the original file

JPG compression introduces small colour variations, especially around edges and text. A PNG screenshot or the original logo file will give more reliable codes than a photo forwarded several times on WhatsApp.

### Pick a few times and compare

The history row makes it easy to pick three or four nearby points and see how much they vary. If they are very close, any of them will do. If they differ a lot, the area is not a single colour, and the dominant palette may be more useful.

## Using the dominant colour palette

The palette is created by grouping similar pixels in a scaled-down copy of your image with a k-means clustering method. Each swatch shows the colour and the share of the picture it covers.

This is useful when you want the overall feel of an image rather than one exact pixel:

- **Matching a website or social post to a product photo.** Pull the palette from your best product image and use those colours for buttons, backgrounds and text.
- **Wedding and event invitations.** Extract colours from a photo of the venue or the outfit and build a coordinated card.
- **Home décor.** Snap a picture of a cushion or a painting and use the palette to choose wall or curtain colours, then take the codes to the shop. Note that paint on a wall never looks exactly like a screen, so check physical samples too.

The **Copy CSS variables** button gives you lines such as `--color-1: #...;`, ready for a stylesheet. Pair them with the [CSS Gradient Generator](/tools/css-gradient-generator/) to build backgrounds that blend two palette colours.

## Building a colour scheme from one picked colour

Often you only need one starting colour, and the rest can be derived from it. This is where the HSL code is handy. Keep the hue the same and change the lightness to get a family of matching shades: a darker version for text or buttons, a much lighter version for backgrounds, and the original for highlights.

Say you run a small sweet shop and your signboard orange picks as roughly hsl(23, 93%, 53%). A version at 35% lightness works for headings, the original for buttons, and a pale 94% version for page or poster backgrounds. Because they share a hue, they always look like they belong together.

For a contrasting accent, move the hue roughly halfway round the colour wheel, about 180 degrees. Orange pairs with a deep blue, for example. Test text colours for readability on their backgrounds before finalising anything for print or a website.

## Common mistakes

- **Picking from an anti-aliased edge.** The pixels where a letter meets the background are a blend of both. Pick from the middle of a shape.
- **Trusting a photo of a printed colour.** Camera white balance and room lighting change colours a lot. For accurate brand colours, use the digital artwork or the official guidelines.
- **Ignoring screen differences.** The code is exact, but how it looks varies between phone screens, laptops and printers.
- **Mixing up similar codes.** When copying several colours, label them in your notes so you do not paste the shadow tone instead of the main one.

## Your images stay private

The image is read and analysed by your browser on your own device. Nothing is uploaded, so you can safely pick colours from unreleased designs, client mock-ups or internal dashboards. Very large photos are analysed on a reduced copy for the palette, which keeps it quick even on phones, while individual picks use the full-resolution pixels.
