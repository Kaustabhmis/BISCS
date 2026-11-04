{
  "tool": "ai-background-remover",
  "slug": "remove-background-from-photo-free",
  "title": "Remove Background From a Photo Free (Transparent PNG)",
  "description": "Cut out people or objects and download a transparent PNG or a plain colour background. The AI runs on your device, so photos are never uploaded. Edge tips.",
  "keywords": ["remove background from image", "background remover free", "transparent png maker", "remove bg online without upload", "cut out person from photo"],
  "summary": "To remove a photo background, open an AI background remover, choose your image, let the model find the person or click the object to keep, touch up edges, and download a transparent PNG. BISCS India’s AI Background Remover runs the AI model on your own device, so your photos are never uploaded.",
  "faq": [
    { "q": "Is this background remover really free with full resolution?", "a": "Yes. There is no credit system and no low-resolution preview trap. The result is saved at the size of your photo. Very large images above roughly 16 megapixels are scaled down first to stay within browser memory limits, and the tool tells you when that happens." },
    { "q": "Why does the first use take longer?", "a": "The first time, your browser downloads the AI engine and model, roughly 26 MB in total, and stores it. After that it loads from your browser’s cache and starts much faster. Object mode uses an additional, smaller model that also downloads once." },
    { "q": "Can it remove the background from product photos, not just people?", "a": "Yes. Switch What to keep to Object, then click on the product. The interactive model selects the item you clicked. For items with fine gaps, such as jewellery chains or plants, use the Erase and Restore brushes to clean up the result." },
    { "q": "Why are hair edges not perfect?", "a": "Fine hair, fur and see-through fabric such as a dupatta are hard for any automatic tool because each strand mixes with the background. Try a lower edge threshold and a little feathering, then use Restore to paint back missed strands. Plain, contrasting backgrounds give the best starting point." },
    { "q": "Do I need a powerful computer?", "a": "No, but speed depends on your device. Recent phones and laptops process a photo in a few seconds. Older phones may take longer, especially on the first run. The tool uses your device’s graphics chip where the browser allows it." }
  ]
}
---
A background remover separates the main subject of a photo, usually a person or a product, from everything behind it. The result is a cut-out on a transparent background that you can place on a new colour, a poster, a product listing or a presentation slide.

The [AI Background Remover](/tools/ai-background-remover/) from BISCS India uses an AI segmentation model that runs entirely in your browser. You can let it find people automatically, or click any object you want to keep, then refine the edges by hand and download a transparent PNG.

## How does AI background removal work?

The tool uses image segmentation models from Google’s MediaPipe, running locally through WebAssembly. For each pixel, the model estimates how likely it is to belong to the subject. Those estimates form a soft mask: high values are kept, low values become transparent, and the values in between create smooth edges.

There are two modes:

- **Person (auto)** uses a model trained to recognise people, including hair, skin and clothing. It needs no input from you.
- **Object (click)** uses an interactive model. You click a point on the thing you want, and it selects the object at that point. Use it for products, pets, vehicles, food and anything that is not a person.

Because the model runs on your device, the first use downloads it once, about 26 MB for the engine and person model, and your browser keeps it for next time.

## How to remove a background step by step

1. Open the [AI Background Remover](/tools/ai-background-remover/) and choose a photo, drop it in or paste it with Ctrl + V.
2. Wait for the one-time model download if this is your first visit. A progress card shows how far along it is.
3. Under **What to keep**, use **Person (auto)** for people, or switch to **Object (click)** and click on the item you want.
4. Use the tools above the photo: **Compare** to slide between before and after, **Erase** to paint away leftovers, **Restore** to paint back parts that were removed, and **Add object** to click extra items to keep.
5. Fine-tune the **Edge threshold** (higher removes more of the soft edge) and **Edge feather** (softens the outline), and set the **Brush size** for touch-ups.
6. Under **Output**, keep **Transparent** for a PNG cut-out, or choose **Colour** to place the subject on white, black, light grey, light blue, yellow or green and save as PNG or JPG.
7. Press **Download**.

## What can you use a cut-out for?

| Use | Output to choose | Tip |
|---|---|---|
| Product photos for Amazon, Flipkart or Meesho listings | Colour, white, JPG | Check each marketplace’s current image rules |
| Logos and stickers | Transparent PNG | Keep edge feather low for crisp outlines |
| Profile photos | Colour, light blue or grey | Use Person mode for clean hair edges |
| Posters, invitations and thumbnails | Transparent PNG | Place it on a design in another tool |
| ID or application photos | Colour, white | For passport sizing, the AI Passport Photo tool does it all |
| Collages | Transparent PNG | Combine cut-outs with the Collage Maker |

## Tips for clean, professional cut-outs

### Start with a good photo

The AI works best when the subject stands out: a person in a dark kurta against a light wall, a product on a plain table. Busy backgrounds with similar colours to the subject, such as a green shirt in front of plants, make the boundary harder to find.

### Fix edges with the brushes, not the sliders

The threshold and feather sliders change the whole outline. If only one area is wrong, such as a gap between an arm and the body still showing the wall, zoom in and paint it away with **Erase**. Use **Restore** for a missed earring or a bit of hair.

### Think about where it is going

A cut-out placed on a dark background reveals any light fringe left from the original wall, and vice versa. Preview your subject on the colour you will actually use before downloading.

## Product photos for online selling

Indian marketplaces and social commerce, from big platforms to Instagram and WhatsApp catalogues, reward clean, consistent product images. A practical routine for a small seller:

1. Photograph each product on a plain table near a window, at the same angle and distance.
2. Remove the background in **Object** mode, clicking the product.
3. Choose **Colour** with white, or another shade that suits your brand, and save as JPG.
4. Use the same background for the whole catalogue so the grid looks uniform.

Each marketplace sets its own rules for main images, such as background colour and how much of the frame the product should fill, so check the seller guidelines of the platform you use.

## Honest limits

- **Hair and transparent materials** are the hardest part. Expect to touch up wispy hair, nets and glass.
- **Group photos** in Person mode keep everyone. To keep one person only, erase the others with the brush.
- **Very large photos** above about 16 megapixels are reduced first to stay within browser limits, and a badge tells you when this happens.
- **Older phones** are slower, and the first run includes the model download. A Wi-Fi connection helps on the first visit.

## Common mistakes

- **Using JPG when you need transparency.** JPG cannot store transparency. Choose Transparent, which saves as PNG.
- **Forgetting Object mode for products.** Person mode looks for people; a bottle or a saree on a hanger needs Object mode.
- **Over-feathering.** Too much softening makes the subject look like it is glowing. Keep feather low unless the edge is visibly jagged.
- **Expecting a new background in the same step.** To blur or replace the background with a scene, use the [AI Background Blur & Changer](/tools/ai-background-changer/).

## Why on-device processing matters

Most online background removers upload your photo to a server. Here, the AI model is downloaded to your browser and the photo is processed locally, so personal photos, unreleased products and pictures of children never leave your device. Once you have a cut-out, you can combine several in the [Collage Maker](/tools/collage-maker/), or create a passport photo with the [AI Passport Photo](/tools/ai-passport-photo/) tool.
