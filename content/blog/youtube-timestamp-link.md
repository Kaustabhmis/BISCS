{
  "tool": "youtube-timestamp-link",
  "slug": "youtube-link-with-timestamp-start-at-time",
  "title": "How to Share a YouTube Link That Starts at a Specific Time",
  "description": "Make a YouTube link that opens at the exact second you want, on phone or desktop, and create many timestamped links at once for notes, classes or chapters.",
  "keywords": ["youtube link with timestamp", "share youtube video at specific time", "youtube start time link", "youtube t parameter", "youtube timestamp link generator"],
  "summary": "To share a YouTube video from a specific moment, add a time parameter to the link, such as ?t=90 on a youtu.be link or &t=90s on a watch link. BISCS India’s free YouTube Timestamp Link Generator builds these links from any video URL and a time like 1:30, and can create a whole list of timestamped links at once.",
  "faq": [
    { "q": "What is the difference between t=90 and t=1m30s?", "a": "Both point to the same moment, 90 seconds into the video. The plain number is commonly used on youtu.be short links, while watch links also accept forms like t=90s or t=1m30s. The generator shows a short link, a watch link in seconds and a watch link in hours, minutes and seconds." },
    { "q": "Why does my timestamp link start from the beginning?", "a": "Some apps, in-app browsers and embedded players ignore the time parameter, and some messaging apps may alter links when generating previews. Try opening the link in a normal browser or the YouTube app. Also check that the time is shorter than the video itself." },
    { "q": "Can I make a timestamp link from the YouTube mobile app?", "a": "The Share option in the YouTube app usually gives a plain link without a time. Copy that link, paste it into the generator with the time you noted, and copy the finished link back into WhatsApp, email or wherever you are sharing it." },
    { "q": "Do timestamp links work on Shorts?", "a": "Shorts are brief and usually loop, so a start time is rarely useful. The generator accepts a Shorts link but builds standard short and watch links from its video ID; whether a given app honours the start time on a Short can vary." },
    { "q": "Can I keep the playlist when sharing a timestamp?", "a": "Yes. If your link contains a playlist, tick “Keep the playlist in the link (if any)”. The watch link then includes the list parameter, so the viewer stays in the playlist after the video ends." }
  ]
}
---
Add a time to the end of the video address. For a short link it looks like `https://youtu.be/VIDEO_ID?t=90`, and for a full link `https://www.youtube.com/watch?v=VIDEO_ID&t=90s`; either one opens the video 1 minute 30 seconds in.

Typing that by hand is fiddly, particularly on a phone and when the original link already has extra bits like `?si=` or a playlist. The [YouTube Timestamp Link Generator](/tools/youtube-timestamp-link/) does it reliably: paste the link, type the time, copy the result.

## When a timestamped link helps

- **Answering a question.** "The setting you need is at 4:12" works better as a link that opens at 4:12.
- **Teaching.** Teachers and coaching institutes can send students straight to the worked example rather than the whole lecture.
- **Work feedback.** Editors and clients can point to an exact cut or caption without writing long notes.
- **Long streams and podcasts.** Sharing the one useful segment of a three-hour live stream respects the viewer's time.
- **Your own notes.** A study sheet with a list of links to key moments is easy to revise from later.

## Making a single timestamp link

1. Open the [YouTube Timestamp Link Generator](/tools/youtube-timestamp-link/).
2. Paste a **YouTube link or video ID** into the first box. The tool confirms the video ID in a green note, and tells you if the link already had a time in it.
3. Type a **Start time**. Formats such as `1:30`, `90`, `1m30s` and `1:02:03` all work.
4. Tick **Keep the playlist in the link (if any)** if you want the viewer to continue through a playlist.
5. Copy one of the three results using its copy button: **Short** (youtu.be), **Watch** (time in seconds) or **Watch (h/m/s)** (time written like 1m30s).

Above the links, a line confirms the start time both as a clock time and in seconds, for example "Starts at 1:30 (90 seconds)". If you leave the time empty and the original link had one, the tool keeps it.

## Making many links at once

The second card, **Many timestamps at once**, is the fast way to build a list for notes or a lesson plan.

1. Keep your video link in the first box above.
2. In the text area, type one line per moment: a time, then an optional label. For example `0:00 Intro`, `1:30 The main tip`, `4:05 Results`.
3. A table appears with the time, label and short link for each line, each with its own copy button.
4. Press **Copy all as text** to copy every line in the form "1:30 The main tip – link", or **CSV** to download a spreadsheet with time, seconds, label, short link and watch link.

Lines the tool cannot read are listed by number with a reminder to start each line with a time.

## Which format should you share?

| Link type | Example | Best for |
|---|---|---|
| Short | youtu.be/ID?t=90 | Chats, SMS and social posts where length matters |
| Watch | youtube.com/watch?v=ID&t=90s | Emails, documents and places that need the full address |
| Watch (h/m/s) | youtube.com/watch?v=ID&t=1m30s | Notes where you want the time to be readable inside the link |

They all open at the same moment in a browser. Pick whichever looks cleaner where you are pasting it.

## Example: a revision sheet for a long lecture

Imagine a two-hour accounts lecture on YouTube that your study group keeps returning to. Paste its link once at the top, then type into the multi-link box:

- `0:00 Overview`
- `12:40 Journal entries`
- `38:15 Trial balance`
- `1:05:30 Depreciation methods`
- `1:42:10 Practice questions`

The table immediately lists five links, each opening at its topic. **Copy all as text** gives you a neat block to paste into a WhatsApp group or a Google Doc, and the **CSV** file can sit next to your other revision material in a spreadsheet. Because the links come from the video ID, they keep working as long as the video stays public or unlisted.

## Tips for reliable timestamps

- **Start a second or two early.** Landing mid-word is jarring; a small lead-in gives context.
- **Clean up tracking parameters.** Links copied from the app often include `si=` codes. The generator rebuilds the link from the video ID alone, so these are dropped.
- **Test on a phone.** If most of your audience is on mobile, open the link once in the YouTube app to confirm it lands where you expect.
- **Label your list.** In the multi-link card, a short label like "GST formula" makes a list of links far more useful a week later.

## Mistakes to avoid

- **Pasting a playlist link with no video.** A playlist URL has no single video to start in; open a video in the playlist and copy its link instead. The tool shows this exact message.
- **Using a time longer than the video.** The link will usually just open at the start or the end.
- **Writing 1:30 when you mean an hour and a half.** Two-part times are read as minutes and seconds, so use `1:30:00` or `5400` for 90 minutes. Values such as 1:75, where the seconds go past 59, are rejected so typing slips are caught.
- **Expecting every app to respect the time.** Some in-app browsers and embedded players ignore it, so mention the time in your message too.

## Timestamps for viewers vs chapters for creators

A timestamp link is something anyone can make to share a moment. Chapters are something the video owner adds in the description so the whole timeline is labelled. If you are the creator and want proper chapters, use the [YouTube Chapters Generator](/tools/youtube-chapters-generator/), which follows YouTube's rules of starting at 0:00 with at least three chapters of 10 seconds or more. If you want to place the video on your own website starting at a set point, the [YouTube Embed Code Generator](/tools/youtube-embed-code-generator/) has start and stop options.

Every link is built in your browser from the text you type. Nothing is sent to YouTube or to BISCS India, and no account is needed.
