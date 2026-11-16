{
  "tool": "shorts-maker",
  "slug": "turn-long-video-into-youtube-shorts-reels",
  "title": "Turn a Long Video into YouTube Shorts and Reels (9:16)",
  "description": "Cut vertical 9:16 Shorts and Reels from a long landscape video in your browser: pick clips, reframe with face tracking or blur, add titles and captions.",
  "keywords": ["youtube shorts maker", "long video to shorts", "convert video to reels", "make vertical video from horizontal", "9:16 video clips"],
  "summary": "To turn a long video into Shorts or Reels, choose short moments, reframe each one to vertical 9:16 at 1080×1920, and export separate MP4 clips. BISCS India’s free Shorts & Reels Maker does this in your browser, with optional highlight suggestions, face-following crops, titles and imported captions.",
  "faq": [
    { "q": "How does the tool decide which moments are highlights?", "a": "It measures loudness across the soundtrack and, if you tick the option, looks for sudden visual changes between frames. Loud peaks such as laughter, cheering or a raised voice score highly. It does not understand what is being said, so a quiet but important point can be missed. Treat suggestions as a shortlist and adjust them." },
    { "q": "What does Follow faces do if two people are talking?", "a": "The on-device face detector looks for faces in sampled frames and pans smoothly towards the main one it finds. With two people far apart in a wide shot, a 9:16 crop cannot hold both, so one may be cut off. For interviews like that, Fit + blur or Choose position often gives a better result." },
    { "q": "Can I add captions to my shorts?", "a": "Yes, if you already have an SRT or VTT file timed to the original long video. Import it under Captions (optional) and each short uses only the lines that fall inside its time range, shifted to start correctly. You can create that file first with the Subtitle & Caption Maker." },
    { "q": "Should I choose 1080×1920 or 720×1280?", "a": "1080×1920 is the usual size for Shorts and Reels and looks sharper. It also takes much longer to encode, especially on phones. If you are working on a phone or making many clips, 720×1280 finishes faster and still looks acceptable on most mobile screens." },
    { "q": "Why did my clip get centre-cropped when I chose Follow faces?", "a": "The result card explains each clip. If no clear face was found in enough frames, or the face model could not load in your browser, that clip falls back to a centre crop. Side profiles, small faces, dim lighting and heavy motion all make detection harder." }
  ]
}
---
A long video becomes a Short or Reel in three moves: pick a moment of 15 to 60 seconds, reframe the wide picture into a tall 9:16 frame, and export it as an MP4 at 1080×1920. Do that a few times and one podcast, lecture or vlog gives you a week of vertical clips.

The [Shorts & Reels Maker](/tools/shorts-maker/) handles all three steps on one screen. You can choose clips by hand or ask it to suggest lively moments, and it exports every clip in one go. Use your own recordings or footage you have permission to reuse.

## What the tool can and cannot do

Before you start, here is an honest picture.

- **It reframes, trims and labels.** Each clip gets its own start, end, crop position and optional title.
- **Highlight suggestions are based on sound and scene changes.** The tool listens for loud, energetic stretches and can also look for big visual changes. It does not understand speech or meaning, so it cannot tell a punchline from a cough.
- **Face tracking runs on your device.** A small MediaPipe face model (about 10 MB, downloaded once) finds faces and pans the crop to follow them.
- **Processing happens in your browser.** The video engine, roughly 32 MB, downloads once from this site and is then cached. No file is sent anywhere, there is no sign-up and no BISCS watermark appears on your clips.

## How to use the Shorts & Reels Maker

1. Open the [Shorts & Reels Maker](/tools/shorts-maker/) and click **Choose a long video**, or drag in an MP4, MOV, WebM or MKV file.
2. Under **Platform and length**, pick a card: **YouTube Shorts** (60 s, the safest length), **Shorts up to 3 min**, **Reels** (90 s) or **Any length**. This caps how long each clip can be.
3. Choose a mode under **Reframe to 9:16**: **Center crop**, **Choose position**, **Follow faces** or **Fit + blur**.
4. Set the first clip on the timeline labelled **Selected clip**. Drag the handles, type the **Start** and **End** times, or play the video and press **Set start at playhead** and **Set end at playhead**. **Play clip** previews just that range.
5. To make more clips, press **Add clip** in the **Clips to export** list. Each row has **Edit**, a preview button and a remove button.
6. Or let the tool propose clips: in **Suggest highlights**, set **How many** and **Length each**, optionally tick **Also look for visual changes (slower)**, and press **Suggest highlights**. The suggestions replace your current list.
7. Optionally type a **Title for the selected clip**, choose its size (S, M, L) and colour, or press **Use this title for all clips**.
8. Optionally import an SRT or VTT under **Captions (optional)** and choose a caption size.
9. Pick an **Output size**: **1080×1920 HD** or **720×1280 · faster**.
10. Press **Create short** (or **Create 3 shorts**, and so on). Download each MP4, or use **Download all (ZIP)** when there are several.

## Choosing the right reframe mode

A landscape 16:9 frame is almost three times wider than a 9:16 slice of it, so most of the picture has to go. The four modes decide which part survives.

| Mode | What you get | Works best for |
|---|---|---|
| Center crop | The middle strip of the frame | Talking-head videos where you sit in the centre |
| Choose position | A crop you drag left or right, saved per clip | A speaker standing off to one side |
| Follow faces | A crop that pans smoothly to the main face | Walk-and-talk vlogs, one presenter who moves |
| Fit + blur | The whole frame, with a blurred copy above and below | Slides, screen recordings, group shots, sport |

With **Choose position**, drag the bright box on the preview, use the **Crop position (selected clip)** slider, or nudge with the arrow keys. Each clip remembers its own position, which helps when the speaker moves between segments.

## Getting better highlight suggestions

The highlight finder works by measuring how loud the audio is over time. Peaks in speech, applause, laughter or a music drop score highest. If you tick visual changes, it also samples frames and rewards cuts and big movements. That makes it good at finding the energetic parts of a cricket match or a stage show, and less reliable for a calm lecture where the best line is spoken softly.

A few ways to get more useful results:

- **Match length to content.** Thirty-second suggestions suit most talk content; 15 seconds is better for reaction moments.
- **Ask for a few more than you need.** Request five, keep the best three.
- **Always play each suggestion.** Tighten the start so the clip opens on a strong sentence, not halfway through a word.
- **For silent videos, tick visual changes.** Without audio, scene changes are the only signal available.

## Titles and captions that read well on a phone

Most people watch Shorts and Reels with the sound low or off, so text on screen carries a lot. The title sits at the top of the frame; keep it to a few words that tell the viewer why to stay. Hindi, Bengali and emoji are drawn correctly because the text is rendered by your browser.

Captions are not generated automatically. If you want them, first create an SRT file timed to the full long video with the [Subtitle & Caption Maker](/tools/subtitle-maker/), then import it here. Each short picks up only the lines inside its own time range.

## Speed, phones and file size

Encoding 1080×1920 video in a browser is demanding. On a laptop, expect each minute of HD output to take a few minutes; on a phone it can be much slower, and long batches may run out of memory. The **720×1280 · faster** option is there for exactly this reason. Keep the tab open while it works.

Clips export as H.264 video with AAC audio, the format YouTube, Instagram and Facebook all accept. Upload them from the official apps, and check each app's current length limit, as these change. At the time of writing, YouTube allows Shorts up to 3 minutes for most channels, while the Instagram in-app editor generally works with Reels up to 90 seconds.

## Mistakes to avoid

- **Starting mid-sentence.** The first second decides whether someone keeps watching, so begin on a clean line.
- **Covering faces with the title.** Preview the clip, and choose a smaller title size if the speaker's head sits high in the frame.
- **Using Center crop on slides.** Text at the edges will be cut off; Fit + blur keeps the whole slide readable.
- **Reposting clips you do not own.** Platforms can remove reposted content and issue copyright strikes. Work only with your own footage or material you have rights to.
- **Expecting a guaranteed audience.** Vertical clips can help new people find a channel, but views depend on the content and the platform, not the tool.

Not sure whether a finished clip meets each platform's requirements? Run it through the Video Specs Checker before posting. If you only need to change the shape of a whole video, without cutting clips, the [Video Resizer for Social Media](/tools/video-aspect-converter/) is simpler.
