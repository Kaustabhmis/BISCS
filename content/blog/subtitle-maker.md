{
  "tool": "subtitle-maker",
  "slug": "make-srt-subtitles-burn-captions-into-video",
  "title": "Make SRT Subtitles and Burn Captions into a Video",
  "description": "Type or paste your script, time each caption while the video plays, export SRT or VTT for YouTube, or burn Hindi, Bengali or English captions into an MP4.",
  "keywords": ["subtitle maker", "create srt file", "burn subtitles into video", "add captions to video", "hindi subtitles for video"],
  "summary": "To add subtitles, write each caption line, give it a start and end time, and either save it as an SRT file for YouTube or burn the text permanently into the picture. BISCS India’s free Subtitle & Caption Maker lets you type and time captions while the video plays, then export SRT or VTT, or create an MP4 with captions drawn on.",
  "faq": [
    { "q": "Does the Subtitle Maker transcribe speech automatically?", "a": "No. There is no speech recognition here; you type or paste the words yourself and time them. If you want an automatic draft, upload your video to YouTube and let YouTube Studio generate captions, then review them there. For your own script, typing gives you full control over spelling and wording." },
    { "q": "What is the difference between SRT and VTT?", "a": "Both are plain-text caption formats listing numbered lines with start and end times. SRT uses a comma before the milliseconds and is the most widely accepted, including by YouTube and Facebook. VTT (WebVTT) uses a full stop and is the format web video players read natively. Download whichever your platform asks for." },
    { "q": "Should I upload an SRT or burn the captions in?", "a": "Upload an SRT where the platform supports it, such as YouTube, because viewers can turn captions on or off and choose a language. Burn them in for places that ignore caption files, like Instagram Reels or WhatsApp, or when you want styled captions that always show." },
    { "q": "My captions appear a second too late. How do I fix all of them?", "a": "Use Shift all timings. Enter the number of seconds, for example 1 or 0.5, and press Earlier to move every caption back by that amount, or Later to move them forward. The text stays the same, and each line keeps its length." },
    { "q": "Can I edit an existing SRT file?", "a": "Yes. Press Open an SRT / VTT file on the first screen to edit without a video, or load a video and use Import SRT / VTT in the Script, import & export card. You can then fix text, adjust times, and export again." }
  ]
}
---
Subtitles are just lines of text, each with a start time and an end time. You can deliver them in two ways: as a separate SRT or VTT file that the platform shows on request, or burned permanently into the video picture. Both start with the same job, which is writing the words and timing them to the speech.

The [Subtitle & Caption Maker](/tools/subtitle-maker/) is built around that job. It does not listen to the audio or transcribe anything; you type or paste the words, and the tool makes timing them quick. If you would rather start from an automatic draft, YouTube Studio can generate captions after you upload a video, and you can correct them there.

## Why captions are worth the effort

- **Many people watch without sound**, on a bus, in an office, or late at night with a sleeping baby nearby.
- **Viewers who are deaf or hard of hearing** depend on them.
- **Mixed-language audiences** follow more easily. A Hindi vlog with English subtitles, or the reverse, reaches more people.
- **Noisy recordings** become understandable when the words are on screen.

## Three ways to begin

On the first screen you can:

- **Choose your video** to time captions while watching and, later, burn them in.
- Press **Start typing without a video** to write captions with rough times, for example when you already know the timings.
- Press **Open an SRT / VTT file** to edit an existing caption file.

Choosing a video gives you the most tools, so that is the route described below.

## How to time captions with tap-to-time

Tap-to-time is the fastest method when you have a script.

1. Open the [Subtitle & Caption Maker](/tools/subtitle-maker/) and choose your video.
2. In the **Script, import & export** card, paste your script into **Paste lines**, one caption per line, and press **Add lines**. The lines appear untimed in **Caption lines**.
3. Press **Tap-to-time mode** above the editor. The first line appears in a highlighted box.
4. Play the video. Press and hold **Hold while this line is spoken** (or the T key) as the line begins, and release when it ends. The tool records both times and moves to the next line.
5. If you slip, press **Back one line** and redo it. Press **Stop** when finished.
6. Review the list. Each line shows its start and end times, such as `00:00:04,200`, which you can type over. **Start = playhead** and **End = playhead** set either time from the current video position, and the play button replays just that line.
7. Fix any problem the tool flags, such as "End must be after start" or "Overlaps the previous line".
8. Under **Download captions**, press **SRT** or **VTT**, or **Copy SRT** to paste the text elsewhere.

Without a script, pause the video wherever someone starts speaking and press **Add caption at playhead**, then type the words. The **Back 2 seconds** and **Forward 2 seconds** buttons help you listen again.

## Writing captions people can read

- **Keep lines short.** Around 35 to 42 characters per line is a common guideline, with no more than two lines on screen.
- **Split at natural pauses.** Break after a comma or a full phrase, not in the middle of a name.
- **Give each caption time.** A line shown for under a second is hard to read; one to six seconds is typical.
- **Write what is said, lightly cleaned.** Remove repeated "umm"s, but do not change meaning.
- **Use the right script.** Hindi in Devanagari, Bengali in Bengali script, or Hinglish in Roman letters, according to your audience.

## Burning captions into the video

If the video has a file attached, a **Burn captions into the video** card appears below. Choose a **Font**, a **Size** (S, M, L or XL), **Text colour**, **Outline colour** and **Outline width**. Tick **Background box** for a shaded strip behind the words and set its **Box colour** and **Box opacity**. Choose a **Position**: **Bottom**, **Middle** or **Top**. Then press **Burn captions into video**.

Captions are drawn by your browser before being merged into the video, so Hindi, Bengali and emoji appear correctly, which many basic subtitle burners get wrong. The result is an MP4 you can preview and download. The video engine needed for this downloads once (about 32 MB) and is cached; your video is processed on your own device and never uploaded.

Burning is slower than exporting an SRT because every frame is re-encoded. On a phone, start with a short clip to see how long it takes.

## Uploading to YouTube

In YouTube Studio, open the video, choose **Subtitles** from the left menu, pick the language, and select the option to upload a file. Choose "With timing" and select your SRT. At the time of writing that is the usual flow, though YouTube occasionally renames menu items. Facebook also accepts SRT files on many video types. Instagram and WhatsApp do not take caption files, so burn the captions in for those.

If you have chapters in mind for a long video, the [YouTube Chapters Generator](/tools/youtube-chapters-generator/) works well alongside your captions.

## Mistakes to avoid

- **Overlapping lines.** Two captions on screen at once look messy. The editor highlights any overlap.
- **Forgetting the first second.** If the opening words have no caption, people assume captions are missing.
- **Burning in captions you might need to fix later.** Keep the SRT file as well; burned text cannot be edited afterwards.
- **Placing captions over on-screen text.** If the video already has lower-thirds at the bottom, choose **Top** or **Middle**.

Making vertical clips from the same video? Import this SRT into the [Shorts & Reels Maker](/tools/shorts-maker/) and each short picks up its own lines.
