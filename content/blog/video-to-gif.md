{
  "tool": "video-to-gif",
  "slug": "convert-video-to-gif-online",
  "title": "How to Convert a Video to GIF (Small Size, Good Quality)",
  "description": "Turn a video clip into an animated GIF in your browser. Choose the part, frame rate and width, keep file size down, and learn when a short MP4 works better.",
  "keywords": ["video to gif", "convert mp4 to gif", "gif maker from video", "make gif online free", "reduce gif size"],
  "summary": "To convert a video to GIF, open it in a GIF maker, select a short clip of a few seconds, choose a width and frame rate, and export. BISCS India's Video to GIF builds an optimised colour palette for better quality, can also make a much smaller silent MP4 version, and runs fully in your browser.",
  "faq": [
    { "q": "Why are GIF files so large?", "a": "GIF is a format from the late 1980s. It stores up to 256 colours per frame and uses compression that is far less efficient than modern video codecs. A few seconds of smooth motion can easily reach several megabytes. Keeping clips short, narrow and at 10 to 15 frames per second keeps sizes reasonable." },
    { "q": "What is the best frame rate for a GIF?", "a": "Around 10 to 15 frames per second suits most GIFs. It looks smooth enough for reactions, screen demos and product loops while keeping the file small. Use higher rates, up to 25, only for fast action that looks jerky otherwise, and accept that the file will grow noticeably." },
    { "q": "Do GIFs have sound?", "a": "No. The GIF format cannot contain audio, so any sound in your video is dropped. If you need sound, share the trimmed clip as an MP4 instead. The optional MP4 version this tool creates is also silent, because it is meant as a lightweight GIF replacement." },
    { "q": "Should I use a GIF or a short MP4?", "a": "A short silent MP4 is usually five to ten times smaller than the same GIF and looks better, and many chat apps and websites loop it just like a GIF. Use a GIF where video is not accepted, such as some email clients, documentation tools, forums and older platforms." },
    { "q": "What does the Smooth or Compact dithering option change?", "a": "Dithering mixes dots of the limited palette colours to imitate shades the GIF cannot store. Smooth uses error-diffusion dithering, which gives gentler gradients but slightly larger files. Compact uses a regular ordered pattern that compresses better, at the cost of a visible fine texture in gradients." }
  ]
}
---
Converting a video to GIF turns a short moving clip into an animated image that plays automatically and loops, with no play button and no sound. GIFs remain popular for reactions, quick product demos, how-to snippets in documentation, and anywhere that video embeds are not allowed.

The [Video to GIF](/tools/video-to-gif/) tool on BISCS India lets you pick the exact part of a video, set the frame rate and width, and export a GIF with a colour palette built specifically for your clip. It can also create a far smaller MP4 version with one click. Everything happens in your browser.

## Why GIFs need special care

GIF is an old format. Each frame can use at most 256 colours, and its compression is primitive compared with modern video codecs such as H.264. That causes two familiar problems:

- **Big files.** A five-second clip at full HD can run to tens of megabytes as a GIF.
- **Banding and speckles.** Skies, skin tones and gradients have more than 256 shades, so they look stepped or grainy.

Good GIF makers fight both. This tool uses a two-pass process: first it analyses your clip and builds the best 256-colour palette for it, then it renders every frame using that palette with your chosen dithering. That gives noticeably better colours than a generic palette.

## How to make a GIF with BISCS India

1. Open [Video to GIF](/tools/video-to-gif/).
2. Choose a video or drag it in. MP4, MOV, WebM, MKV and AVI files are supported.
3. Drag the handles over the thumbnail strip to select the part you want. Keep it short: two to six seconds is ideal.
4. In **GIF settings**, set **Frames per second** (5 to 25, default 12) and **Width** (240 to 800 px). The height follows automatically to keep the shape.
5. Choose **Dithering**: **Smooth** for nicer gradients or **Compact** for smaller files.
6. Leave **Loop forever** ticked for a classic GIF, or untick it to play once.
7. Click **Make GIF**. The first time, a video engine of about 32 MB downloads once and is cached by your browser.
8. Preview the result with its size, dimensions and length, then download it. If the GIF is large, click **Make MP4 instead (smaller)** for a lightweight silent video of the same clip.

## Settings that control file size

GIF size grows with every setting, roughly multiplying together:

| Setting | Effect on size | Suggested value |
| --- | --- | --- |
| Length | Doubles when the clip doubles | 2–6 seconds |
| Frames per second | More frames, more data | 10–15 fps |
| Width | Height scales too, so pixels grow fast | 320–480 px for chat, up to 800 for docs |
| Dithering | Compact is usually smaller | Smooth for photos, Compact for screen recordings |
| Content | Busy, moving backgrounds compress poorly | Steady camera, simple backgrounds |

If a GIF is over a size limit, cut the length first, then reduce the width, then the frame rate. The tool warns you when a GIF comes out larger than about 8 MB.

## GIF or MP4? Choose by where it is going

Many platforms that seem to show GIFs are actually playing short silent videos, because video is so much more efficient. The tool’s MP4 option makes the same clip at the same width and frame rate, usually five to ten times smaller than the GIF, and most chat apps such as WhatsApp and Telegram loop it like a GIF.

Use a **GIF** when:

- The destination accepts images but not video, such as many email newsletters, GitHub README files, wikis and older forums.
- You want it to play everywhere automatically without any player controls.

Use the **MP4** when:

- You are posting to chat apps or social media that accept video.
- File size matters, for example on a website where page speed counts.

## Tips for better-looking GIFs

- **Trim tightly.** The best GIFs show one action, starting and ending at natural moments. If the loop point jumps, try shifting the end slightly.
- **Use a steady shot.** Camera shake changes every pixel on every frame, which bloats the file. Screen recordings and tripod shots make excellent GIFs.
- **Go narrow for chat.** 320–480 px wide looks fine on a phone and keeps the file small.
- **Choose Compact for screen recordings.** Interfaces have flat colours, so the ordered pattern is barely visible and saves space.
- **Choose Smooth for real-world footage.** Faces, food and landscapes benefit from gentler dithering.
- **Record specially for a GIF.** For a software demo, capture just the window you need with the [Screen Recorder](/tools/screen-recorder/), then convert a few seconds of it.

## Common mistakes

- **Converting a whole video.** A one-minute GIF is almost always too large to be useful. Cut out the essential moment, or use the [Video Trimmer](/tools/video-trimmer/) for a longer clip you share as video instead.
- **Using maximum width and frame rate.** 800 px at 25 fps looks nice but produces huge files. Increase settings only if the default looks poor.
- **Expecting sound.** GIFs are always silent.
- **Uploading a giant GIF to a website.** Large GIFs slow pages down. Consider the MP4, or compress other heavy media with the [Video Compressor](/tools/video-compressor/).

## Privacy and performance

The GIF is created on your device using a browser build of the FFmpeg engine; your video is not uploaded anywhere. Because your own processor does the work, a computer is faster than a phone, and very large source videos can fail on devices with little memory. Selecting a short clip keeps processing quick on any device.
