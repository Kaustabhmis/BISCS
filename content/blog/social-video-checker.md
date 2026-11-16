{
  "tool": "social-video-checker",
  "slug": "check-video-requirements-youtube-reels-whatsapp",
  "title": "Check Video Requirements for YouTube, Reels and WhatsApp",
  "description": "See whether a video's shape, length, resolution, file size and codec suit YouTube, Shorts, Instagram and Facebook Reels, the Facebook feed and WhatsApp Status.",
  "keywords": ["video requirements for youtube", "instagram reels video size", "whatsapp status video length", "check video resolution online", "youtube shorts requirements"],
  "summary": "Before posting, check a video's shape, length, resolution, file size and codec against each platform's common recommendations, so it is not cropped, rejected or squashed. BISCS India’s free Video Specs Checker reads your file in the browser and gives a pass, fix or note for YouTube, Shorts, Reels, the Facebook feed and WhatsApp Status.",
  "faq": [
    { "q": "What does the Check codecs and bitrate button add?", "a": "The basic check reads length, resolution, shape, file size and format using your browser's own player. The button runs a deeper scan with the video engine to read the video codec, audio codec, frame rate and bitrate. That fills in the codec, audio and frame-rate rows of the checklist." },
    { "q": "What is the best video format for social media?", "a": "An MP4 file with H.264 video and AAC audio is accepted almost everywhere and plays on nearly every phone. HEVC, VP9 and AV1 are also supported by the big platforms, but H.264 remains the safest choice. If the checker flags an unusual codec, converting to H.264 MP4 usually solves it." },
    { "q": "Why does a vertical video show black bars on YouTube?", "a": "The regular YouTube player on computers and TVs is 16:9, so a 9:16 video fills only a narrow strip in the middle. On phones it can fill the screen. A vertical video of up to 3 minutes may also be treated as a Short, depending on YouTube's current rules." },
    { "q": "Why does WhatsApp make my video look blurry?", "a": "WhatsApp compresses videos to save data, and large files are compressed hardest. A file of around 16 MB or less, at 720p or 1080p, usually survives better than a huge 4K original. The checker flags large files for WhatsApp Status and links to a compressor." }
  ]
}
---
Most upload problems are predictable. A landscape clip posted as a Reel shrinks to a thin strip; a 75-second clip is too long for a single WhatsApp Status; an unusual codec plays on your laptop but not in an app. Checking five or six numbers before you post avoids almost all of it.

The [Video Specs Checker](/tools/social-video-checker/) reads those numbers from your file and compares them with common recommendations for five destinations. It runs in your browser, so the video is never uploaded.

## What the checker looks at

For every video it reads:

- **Length**, shown in minutes and seconds.
- **Resolution**, such as 1920 × 1080.
- **Shape**, the aspect ratio, like 16:9, 9:16, 1:1 or 4:5.
- **File size** in MB.
- **Format**, from the file extension, such as MP4 or MOV.

With the optional deeper check, it adds the **video codec** (H.264, HEVC and so on), **audio** codec, **frame rate** and **bitrate**.

It then builds a **Platform checklist** with a section for each destination:

| Section | Main checks |
|---|---|
| YouTube (regular video) | File type, codecs, shape, resolution, frame rate, length and size |
| YouTube Shorts | Vertical or square shape, length, resolution |
| Instagram & Facebook Reels | 9:16 shape, length, resolution, file size |
| Facebook feed | Square or 4:5 shape, codec, resolution, file size |
| WhatsApp Status | Length per status, file size, shape |

Each row gets **Pass**, **Fix** or **Note**, with a short explanation. A section with no Fix rows shows a **Ready** badge; otherwise it says **Needs changes**.

## How to check a video

1. Open the [Video Specs Checker](/tools/social-video-checker/).
2. Choose a video, or drag it onto the page. Any common format works.
3. Read the **Your video** card for the basic details.
4. Optionally press **Check codecs and bitrate**. This downloads the video engine once (about 32 MB, then cached) and reads the deeper details on your device.
5. Scroll through the **Platform checklist**. Look at the badge on each platform first, then at any row marked Fix.
6. Where a fix is suggested, the note links straight to the tool that can do it, such as resizing to 9:16, trimming, compressing or converting to MP4.
7. Fix the file, then run the new version through the checker again.

## Understanding the common results

**"Landscape videos are not shown as Shorts."** A Short needs to be vertical or square. Make a vertical version with the [Shorts & Reels Maker](/tools/shorts-maker/), which can follow faces or add a blurred background.

**Shorts length.** Under 60 seconds always passes. Between 60 seconds and 3 minutes passes with a reminder that, at the time of writing, YouTube allows Shorts up to 3 minutes for most channels. Longer clips are flagged.

**Reels length.** Within 90 seconds passes on both apps. Longer clips get a note: Instagram has been allowing longer Reels, but the in-app editor and Facebook have commonly worked with a 90-second limit. Check the app you are using.

**"Vertical video may be shown cropped to 4:5 in the feed."** Facebook often trims tall videos in the main feed. A 4:5 or 1:1 version from the [Video Resizer for Social Media](/tools/video-aspect-converter/) takes up the space properly.

**WhatsApp Status length.** Each status has generally held around 60 seconds at the time of writing. Longer videos are split or must be trimmed in the app.

**WhatsApp file size.** Files above roughly 16 MB are compressed heavily by WhatsApp. Making a smaller file yourself usually gives a cleaner result than letting the app do it.

**Low resolution.** Anything with a short side under 720 pixels is marked as soft. Re-exporting at a higher resolution will not add detail, so the fix is usually to find the original file.

## Why the checker hedges

Platform rules change often, and the limits shown differ between accounts, countries and app versions. The checker reflects common recommendations at the time of writing and says so on the page. Treat a Pass as "very likely fine" and a Fix as "worth sorting out first", then glance at the app's own guidance before posting anything important.

The tool also does not judge content. It cannot tell you whether music is licensed, whether a video follows community guidelines, or how many people will watch it.

## Tips for a smooth upload

- **Export from your editor as MP4, H.264 and AAC.** It is the format least likely to cause trouble.
- **Keep 1080 pixels on the short side** for most posts. 4K is fine for YouTube, but large for everything else.
- **Stick to common frame rates:** 24, 25, 30 or 60 fps.
- **Make one version per shape.** A single file rarely suits YouTube, Reels and the Facebook feed equally well.
- **Re-check after editing.** Compression and resizing change the numbers.

## A quick example

Imagine a 75-second vertical phone video, 1080 × 1920, 140 MB, in HEVC. The checker would likely mark both YouTube sections and the Reels section as ready, since 75 seconds is within the usual Shorts and Reels limits. The Facebook feed section would note that a tall video may be cropped. WhatsApp Status would show two fixes: the clip is longer than one status, and the file is well above 16 MB. One trimmed and compressed copy for WhatsApp, and the original for everything else, would cover all five.

## Mistakes to avoid

- **Assuming a phone recording is ready everywhere.** Phone videos are often HEVC and very large; fine for YouTube, heavy for WhatsApp.
- **Uploading a landscape clip as a Reel.** It works technically but looks tiny on screen.
- **Ignoring file size on mobile data.** A 1 GB upload over a weak connection may fail halfway.
- **Treating every note as an error.** Notes are information. Only Fix rows normally need action.
