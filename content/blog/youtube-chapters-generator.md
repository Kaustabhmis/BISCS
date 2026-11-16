{
  "tool": "youtube-chapters-generator",
  "slug": "youtube-chapters-timestamps-rules-generator",
  "title": "YouTube Chapters: Timestamp Rules and a Free Checker",
  "description": "Add chapters to a YouTube video by listing timestamps in the description. Learn the 0:00, three-chapter and 10-second rules, and check your list before posting.",
  "keywords": ["youtube chapters", "how to add timestamps on youtube", "youtube chapters not showing", "youtube timestamps generator", "video chapters in description"],
  "summary": "YouTube creates chapters from a list of timestamps in your video description, as long as the first one is 0:00, there are at least three, and each chapter lasts at least 10 seconds. BISCS India’s free YouTube Chapters Generator helps you set those times, checks every rule as you type, and gives you text ready to paste.",
  "faq": [
    { "q": "Why are my YouTube chapters not showing?", "a": "Usually a rule is broken: the list does not start at 0:00, there are fewer than three timestamps, a chapter is shorter than 10 seconds, or the times are out of order. Chapters can also be turned off in the video's advanced settings. Paste your list into the tool to see which rule fails." },
    { "q": "Do chapter times need to be in a particular format?", "a": "Use minutes and seconds like 4:05, or hours, minutes and seconds like 1:02:30 for long videos. Put the time at the start of the line, followed by a space and the chapter title. The tool writes this format for you and switches to the hour form automatically when a chapter starts after one hour." },
    { "q": "What are automatic chapters in YouTube Studio?", "a": "For some videos, YouTube can suggest chapters on its own when you have not added any. You can usually turn this off in the upload settings. Chapters you write yourself in the description take priority, and you control the wording." },
    { "q": "Can I reuse timestamps I already wrote?", "a": "Yes. Paste them into the Paste existing timestamps box, one per line, and press Use these lines. The tool reads lines such as 1:23 Title or Title - 1:23 and loads them as rows. It then checks them against YouTube's rules and shows any problems." }
  ]
}
---
YouTube chapters come from plain text. Write a list of timestamps with titles anywhere in your video description, and YouTube splits the progress bar into labelled sections, provided the list follows its rules. Get one rule wrong and the chapters quietly fail to appear.

The [YouTube Chapters Generator](/tools/youtube-chapters-generator/) checks those rules for you while you type, and can play your video so you set each timestamp at the right moment.

## The rules YouTube applies

At the time of writing, YouTube's help pages list these requirements:

1. **The first timestamp must be 0:00.** Not 0:01, not 0:05.
2. **At least three timestamps** are needed.
3. **Each chapter must be at least 10 seconds long.**
4. **Times must go up in order.**

There is a practical fifth point: the last chapter also needs 10 seconds before the video ends. The tool checks that too when it knows the video's length.

A valid example looks like this:

```
0:00 Intro
0:45 What you need
3:10 Step-by-step method
7:55 Common problems
10:20 Final result
```

## Why chapters are worth adding

- **Viewers jump straight to what they need**, which is especially useful for tutorials, recipes, reviews and lectures.
- **Chapter titles show in the player**, so people see the structure at a glance.
- **Search results may show key moments.** Google and YouTube can display chapters as links to parts of the video, though this is not guaranteed.

Chapters do not promise more views. They make a long video easier to use, which viewers tend to appreciate.

## How to use the Chapters Generator

1. Open the [YouTube Chapters Generator](/tools/youtube-chapters-generator/). The **Chapters** list starts with **0:00 Intro** and two empty rows.
2. Optionally drop your video on **Optional: load your video**. It plays in the page, and its length fills in automatically. The file stays on your device.
3. For each chapter, type a time in the left box and a title on the right. With a video loaded, play to the right moment and press the clock button beside a row to set its time from the video.
4. Press **Add chapter** for more rows; the trash button deletes one.
5. If no video is loaded, type the **Video length (optional)** so the tool can check the last chapter.
6. Watch the message above the output. It lists every problem, such as "The first chapter must start at 0:00" or a chapter that is only 6 seconds long, and turns green with "Looks good" when all rules pass.
7. Press **Copy for description** and paste the text into your video's description in YouTube Studio.

Already have timestamps written somewhere? Paste them into **Paste existing timestamps**, one per line, and press **Use these lines**.

## Planning chapters for different kinds of videos

The right number of chapters depends on the video. As a rough guide:

- **Recipes:** ingredients, preparation, cooking, plating and tasting. Five chapters cover most dishes.
- **Product reviews:** unboxing, design, features, performance, battery or value, and verdict.
- **Tutorials:** one chapter per major step, plus a short opening that says what viewers will learn.
- **Lectures and webinars:** one chapter per topic or slide section, which also makes revision easier for students.
- **Podcasts:** one chapter per question or guest segment, named after the question itself.

For a short video of three or four minutes, three or four chapters are plenty. Splitting a short clip into many tiny sections makes the progress bar crowded and adds little for the viewer.

## Writing chapter titles that help

- **Describe, do not tease.** "Setting up the router" beats "You won't believe this part".
- **Keep them short.** Long titles get cut off in the player on phones.
- **Use the viewer's words.** If people search "how to fill Form 16", use that phrase rather than your internal jargon.
- **Stay consistent.** Either number every step or none of them.
- **Match the language of the video.** A Hindi video can have Hindi chapter titles; YouTube shows them as written.

The first chapter does not have to be called Intro. If your video starts straight into content, name it after that content.

## Where to paste the chapters

Chapters can go anywhere in the description, but placing them near the top or just after a short summary makes them easy for viewers to find. Keep each timestamp on its own line with nothing before it. A full description with links and hashtags can be drafted with the [YouTube Description Generator](/tools/youtube-description-generator/), which has a section for chapters too.

After saving, chapters can take a little while to show. If they still do not appear, open the video's details in YouTube Studio, click **Show more**, and confirm that automatic chapters or chapter display has not been switched off.

## Mistakes to avoid

- **Starting at 0:01.** This is the most common reason chapters fail.
- **Using full stops or dashes instead of colons.** `4.05` is not read as a time; write `4:05`.
- **Very short sections.** A 7-second "Subscribe reminder" chapter breaks the whole list.
- **Rows out of order.** The tool does not reorder rows for you; it flags the time that is not after the one before, so you can fix it.
- **Leaving titles blank.** The tool warns you and writes "Chapter" as a placeholder, which helps nobody.
- **Editing times after trimming the video.** If you cut part of the video in YouTube Studio's editor, update the timestamps to match.

## Sharing a single moment instead

Sometimes you only want to send someone one part of a video, not split the whole thing. The [YouTube Timestamp Link Generator](/tools/youtube-timestamp-link/) makes a link that starts playing at an exact time, which is handy for replying to a question in comments or a WhatsApp group.
