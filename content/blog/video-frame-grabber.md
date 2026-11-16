{
  "tool": "video-frame-grabber",
  "slug": "extract-still-frame-from-video-full-quality",
  "title": "Extract a Still Frame from a Video in Full Quality",
  "description": "Save a sharp still image from any moment of a video, step frame by frame, capture many evenly spaced frames at once, and build a contact sheet.",
  "keywords": ["extract frame from video", "video to image", "save still from video", "video screenshot full resolution", "frame by frame video"],
  "summary": "To save a still from a video at full quality, pause on the exact frame and capture the decoded picture directly rather than taking a screen screenshot. BISCS India’s free Video Frame Grabber does this in your browser at the video's own resolution, as PNG or JPG, and can also capture evenly spaced frames and build a contact sheet.",
  "faq": [
    { "q": "Why is a captured frame better than a phone screenshot?", "a": "A screenshot records whatever is on your display, at your screen's size, often with player controls or a notification on top. The Frame Grabber copies the decoded video frame itself, so a 4K video gives a 3840×2160 image and nothing else appears in it." },
    { "q": "How do I move exactly one frame at a time?", "a": "Set Frame step to match your video's frame rate, such as 25 or 30 fps, then use the Previous frame and Next frame buttons. After clicking on the video you can also press the left and right arrow keys. With the wrong rate, a step may skip or repeat a frame." },
    { "q": "Why do some frames look blurry?", "a": "Video is shot as a sequence of moments, and fast movement during each frame's exposure shows up as motion blur. Stepping one frame forward or back often finds a sharper one. Heavily compressed videos, such as those forwarded on messaging apps, can also look soft or blocky." },
    { "q": "What is a contact sheet used for?", "a": "A contact sheet places many frames in a grid on one image, so you can see the whole video at a glance. It is handy for picking a thumbnail, reviewing footage with a client, documenting a shoot, or checking continuity. The tool can print each frame's time on it." }
  ]
}
---
The cleanest way to get a still image out of a video is to capture the actual video frame, not your screen. That gives you the full resolution the video was recorded at, with no player buttons, cursor or notification bar in the way.

The [Video Frame Grabber](/tools/video-frame-grabber/) does exactly that inside your browser. Pause, step to the perfect frame, and capture it as a PNG or JPG. It can also pull a set of evenly spaced frames from the whole clip and lay them out as a contact sheet.

## Good reasons to grab frames

- **Thumbnails.** A still from your own footage is often the most honest thumbnail you can use.
- **Family moments.** A birthday candle being blown out, a first step, a wedding pheri: sometimes the video caught it better than any photo.
- **Work and study.** Save a slide from a recorded lecture, a diagram from a training video, or a reading from a dashboard recording.
- **Reviews and reports.** Show a client a specific shot, or document a defect seen in inspection footage.
- **Social posts.** A carousel of stills from a short trip video can work well alongside the video itself.

Use your own recordings, or videos you have the right to use. Frames taken from someone else's film or broadcast are still covered by their copyright.

## How to use the Frame Grabber

1. Open the [Video Frame Grabber](/tools/video-frame-grabber/) and choose a video, or drag it onto the page.
2. Under **Image format**, pick **PNG (lossless)** for the best quality or **JPG (smaller)** for lighter files.
3. Set **Frame step** to your video's frame rate: 24, 25, 30, 50 or 60 fps. Most phone videos are 30 fps; Indian TV-style footage is often 25.
4. Play the video and pause near the moment you want.
5. Use **Previous frame** and **Next frame** to step precisely. The time display shows the position to the millisecond.
6. Press **Capture this frame**. The still appears in **Captured frames** with its time.
7. Repeat for as many frames as you like. Download each one from its own button, or press **Download all (ZIP)**. **Clear** empties the list.

Keyboard users can click the video once, then use the left and right arrow keys to step and the C key to capture. This is the fastest way to work through a long clip.

## Capturing many frames at once

Sometimes you want an overview rather than one perfect moment. In the **Many frames at once** section, set **Number of frames** (from 2 up to 100) and press **Capture evenly spaced frames**. The tool divides the video into equal parts and captures one frame from the middle of each part.

For a five-minute video and 10 frames, that is roughly one frame every 30 seconds. It is a quick way to find the best-looking section before stepping through it frame by frame.

## Building a contact sheet

Once you have some frames, press **Make contact sheet**. You get a single JPG, 1920 pixels wide, with:

- the file name and video length in a header row,
- your frames arranged in a grid,
- the time printed on each frame, if **Print the time on each frame** is ticked.

Set **Columns** between 2 and 8 to control the layout. Four columns of twelve frames suits most videos; use more columns for longer reviews. Contact sheets are useful when choosing a thumbnail with someone else, because everyone can see the options at once and refer to them by time.

## PNG or JPG?

| | PNG (lossless) | JPG (smaller) |
|---|---|---|
| Quality | Exactly the decoded frame | Very slight compression, rarely visible |
| File size | Larger, often several MB for 4K | Much smaller |
| Best for | Editing, printing, thumbnails you will add text to | Sharing on chat apps, email, quick previews |

If you plan to design a thumbnail, take a PNG and load it into the [YouTube Thumbnail Maker](/tools/youtube-thumbnail-maker/) as a photo.

## When the browser cannot play the video

Some formats, such as certain MKV or older AVI files, will not preview in every browser. In that case the tool shows a **Time to capture** box instead of a player. Type a time such as `1:23.5` and press **Capture at this time**. The frame is then extracted by the in-browser video engine, which downloads once (about 32 MB) and is cached afterwards. Evenly spaced capture also works this way. In every case the video stays on your device.

## Tips for sharper stills

- **Step around motion.** If a frame is blurred, the one before or after is often crisper.
- **Prefer the original file.** A video that has been forwarded on WhatsApp has been compressed heavily; the copy on the phone that recorded it is far better.
- **Avoid scaled previews.** The capture is always at full resolution, even if the player on screen looks small.
- **Watch for interlacing.** Old camcorder footage can show comb-like lines on moving edges. That is in the source, not added by the tool.

## Mistakes to avoid

- **Using the wrong frame step.** A 30 fps step on a 25 fps video will sometimes jump two frames or none.
- **Expecting a still to look like a photo.** Video frames have less detail and more blur than a camera photo taken at the same moment.
- **Forgetting to download.** Captured frames live in the page. Closing or refreshing the tab clears them, so save the ZIP first.

To turn a short moment into a moving image instead of a still, the [Video to GIF](/tools/video-to-gif/) tool is the next step.
