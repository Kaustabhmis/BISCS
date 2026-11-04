{
  "tool": "video-trimmer",
  "slug": "trim-cut-video-online-free",
  "title": "How to Trim a Video Online: Cut Start, End or a Clip",
  "description": "Cut the start and end off a video or extract a short clip in your browser. Learn fast lossless trimming vs frame-accurate cuts, with no upload or watermark.",
  "keywords": ["trim video online", "cut video", "video cutter free", "extract clip from video", "shorten video"],
  "summary": "To trim a video, open it in a video trimmer, drag the start and end handles around the part you want to keep, and export the clip. BISCS India's Video Trimmer offers a Fast mode that cuts without re-encoding, so there is no quality loss, and a Precise mode for frame-accurate cuts. Everything runs in your browser.",
  "faq": [
    { "q": "Does trimming a video reduce its quality?", "a": "Not in Fast mode. It copies the original video and audio data without re-encoding, so the kept part is bit-for-bit the same quality. Precise mode re-encodes the clip to cut on an exact frame, which involves a small, usually invisible, quality trade-off and takes longer." },
    { "q": "Why does my Fast-mode clip start a little earlier than I selected?", "a": "Compressed video stores full pictures, called keyframes, only every few seconds and records changes in between. A cut without re-encoding can only start cleanly on a keyframe, so the clip begins at the nearest one, sometimes a couple of seconds early. Switch to Precise mode if the exact first frame matters." },
    { "q": "Can I cut out a section from the middle of a video?", "a": "This tool keeps one continuous part of the video. To remove a middle section, trim twice: once to keep the part before it and once to keep the part after it. Joining the two clips back together needs a video editor. For most uses, keeping one highlight clip is enough." },
    { "q": "Can I trim a video on my phone?", "a": "Yes. The trimmer works in modern mobile browsers. Fast mode is quick even on phones because it does not re-encode. Precise mode and very large files are slower on phones and may fail on devices with little memory, so use a computer for long or 4K videos if you can." },
    { "q": "Which formats can I trim?", "a": "Common formats such as MP4, MOV, WebM, MKV, AVI and 3GP are supported. In Fast mode the clip keeps the original format where possible. Precise mode exports MP4, or WebM when the source is WebM and your browser’s engine supports it. Use the Video Converter if you need a different format afterwards." }
  ]
}
---
Trimming a video means keeping only the part you want: cutting off the shaky start, the moment you fumble to stop recording, or pulling a 20-second highlight out of a 10-minute clip. It is the single most useful video edit, and it does not need editing software.

The [Video Trimmer](/tools/video-trimmer/) on BISCS India lets you pick the start and end visually over a strip of thumbnails, preview your selection, and export the clip. Its **Fast** mode cuts without re-encoding, so it finishes in seconds and the quality is untouched. Nothing is uploaded.

## When is trimming useful?

- Removing dead time from the start and end of a phone video before sharing it in a family WhatsApp group.
- Cutting a short clip of a child’s school performance from a long recording.
- Extracting one answer from a recorded webinar or online class to send to a colleague.
- Shortening a product demo to fit a platform’s duration limit, such as for a story or reel.
- Cleaning up a screen recording before sending it to a client.

## Fast vs Precise: how video cutting really works

To understand the two modes, it helps to know how video is stored. Compressed video does not save every frame as a full picture. It saves a complete image, called a **keyframe**, every so often, often every one to a few seconds, and in between it stores only what changed.

That leads to a trade-off:

| | Fast | Precise |
| --- | --- | --- |
| Re-encodes the video | No (stream copy) | Yes |
| Speed | Seconds, even for long files | Slower; depends on clip length and device |
| Quality | Identical to original | Very slightly reduced, usually invisible |
| Cut accuracy | Starts at the nearest keyframe, can be a few seconds early | Exact frame |
| Output format | Same as the original where possible | MP4 (or WebM for WebM sources) |

**Use Fast** for everyday trimming, where a second or two of extra footage at the start does not matter. **Use Precise** when the clip must start on an exact moment, such as the first word of a sentence or the start of a goal.

## How to trim a video with BISCS India

1. Open the [Video Trimmer](/tools/video-trimmer/).
2. Choose a video or drag it onto the page. A preview appears with a strip of thumbnails underneath.
3. Under **Select the part to keep**, drag the left and right handles across the thumbnail strip. The **Start**, **End** and **Length** values update as you drag.
4. For more control, play the video and use **Set start here** and **Set end here** at the current playhead, or type exact times such as `1:23.5` or `83.5`.
5. Click **Play selection** to watch just the chosen part.
6. Choose **Fast** or **Precise** mode. The hint underneath reminds you of the trade-off, and the tool shows the output format.
7. Tick **Remove audio (mute)** if you want a silent clip.
8. Click **Trim video**, then preview and download the result.

Fast mode does not need the video engine to re-encode anything, but processing still uses the in-browser engine, which downloads once (about 32 MB) and is then cached by your browser.

## Tips for clean cuts

- **Leave a little breathing room.** Starting a clip half a second before the action and ending half a second after feels more natural than an abrupt cut.
- **Check the first second of a Fast cut.** If it starts a bit early, nudge the start later or switch to Precise.
- **Trim before you compress.** Shorter videos compress into much smaller files. Cut first, then use the [Video Compressor](/tools/video-compressor/) if the clip is still too big to send.
- **Keep the original.** Trimming creates a new file; your original stays untouched on your device. Keep it until you are sure the clip is right.
- **Use the keyboard for fine tuning.** The start and end controls are sliders, so on a computer you can focus a handle and use the arrow keys for small adjustments.

## Common mistakes

- **Expecting Fast mode to be frame-perfect.** It is not designed to be. That is the price of instant, lossless cuts.
- **Trimming a huge 4K file on an old phone.** The browser holds the file in memory, which can fail on devices with little RAM. A computer handles big files far better, and the tool warns you when a file is large.
- **Using a trimmer to change format.** The trimmer keeps the format where it can. For a different format, or MP3 audio, use the [Video Converter & MP3](/tools/video-converter/).
- **Forgetting about audio.** If you plan to add music elsewhere, muting the clip here saves a step.

## What about removing a section from the middle?

This tool keeps one continuous range. To drop something from the middle, such as an interruption, trim twice to create two clips, before and after. Joining them is a job for a video editing app. Often, though, a single well-chosen highlight is all you need.

## Turning a trimmed clip into something else

Short trimmed clips work well as animations. Send one to [Video to GIF](/tools/video-to-gif/) to create a looping GIF for a presentation, website or chat. And if your source is a screen recording, the [Screen Recorder](/tools/screen-recorder/) pairs naturally with the trimmer for quick tutorials.

## Privacy

The trimmer runs entirely in your browser using a browser build of the FFmpeg engine. Your video is read from your device, cut on your device and saved back to your device. No upload, no account and no watermark, which matters when the video shows your family, your students or your workplace.
