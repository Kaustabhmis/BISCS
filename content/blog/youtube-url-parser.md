{
  "tool": "youtube-url-parser",
  "slug": "youtube-video-id-extractor-thumbnail-url",
  "title": "Find a YouTube Video ID and Thumbnail URL from Any Link",
  "description": "Extract the 11-character video ID from any YouTube link, get clean watch, short and embed URLs plus thumbnail image addresses, and process many links at once.",
  "keywords": ["youtube video id extractor", "get youtube video id from url", "youtube thumbnail url", "youtube url parser", "clean youtube link"],
  "summary": "A YouTube video ID is the 11-character code, made of letters, numbers, hyphens and underscores, that identifies each video, such as the part after v= in a watch link. BISCS India’s free YouTube URL & Video ID Extractor pulls it from any link format, builds clean links and thumbnail URLs, and handles up to 2,000 links at a time.",
  "faq": [
    { "q": "Where is the video ID in a YouTube link?", "a": "It depends on the format. In a watch link it follows v=, in a youtu.be link it is the path right after the domain, and in Shorts, live and embed links it comes after /shorts/, /live/ or /embed/. It is always exactly 11 characters, which is how the tool checks it is valid." },
    { "q": "Why is the maxresdefault thumbnail not available for some videos?", "a": "The 1280 × 720 maxresdefault image, and sometimes the 640 × 480 sddefault one, exist only when the video was uploaded in a high enough resolution. For other videos YouTube returns a small grey placeholder, which the tool marks as “not available” when you press Show thumbnails. The hqdefault image is the most dependable." },
    { "q": "Can I use another channel’s thumbnail on my website?", "a": "A thumbnail is the creator’s work and is usually protected by copyright. Showing it as part of a proper YouTube embed or a link card is common, but reusing it in your own designs or videos needs the owner’s permission. When in doubt, link to the video instead." },
    { "q": "What does the “Remove duplicate videos” option do?", "a": "When it is ticked, a video that appears more than once in your list, even through different link formats such as a youtu.be link and a watch link, is kept only once. Untick it if you need one output row for every input line, for example to match a spreadsheet." },
    { "q": "Can it extract IDs from channel or search links?", "a": "No. Channel pages, handles like @name and search results do not contain a video or playlist ID, so the tool marks them as invalid with a clear reason. It handles video links of every common type, plus playlist links, for which it returns the playlist ID." }
  ]
}
---
Every YouTube video has an ID of exactly 11 characters, such as `dQw4w9WgXcQ`, and every link format, whether watch, youtu.be, Shorts or embed, is built around it. Once you have the ID, you can make any other kind of link, an embed or a thumbnail address from it.

Spotting the ID by eye is easy in a tidy link but harder in one full of `si=`, `pp=` or playlist parameters, and slow when you have a spreadsheet of hundreds. The [YouTube URL & Video ID Extractor](/tools/youtube-url-parser/) parses them all in your browser and gives you the IDs, clean links and thumbnail URLs.

## Link formats it understands

The extractor recognises the formats you are likely to meet in the wild:

| Link format | Example pattern | Where the ID sits |
|---|---|---|
| Watch page | youtube.com/watch?v=ID | After `v=` |
| Short link | youtu.be/ID | Right after the domain |
| Shorts | youtube.com/shorts/ID | After `/shorts/` |
| Live | youtube.com/live/ID | After `/live/` |
| Embed | youtube.com/embed/ID or youtube-nocookie.com/embed/ID | After `/embed/` |
| Mobile and Music | m.youtube.com, music.youtube.com | As for watch links |
| Playlist | youtube.com/playlist?list=… | No video; returns the playlist ID |

It also reads start times from `t=`, `start=` and `time_continue=` parameters, keeps any playlist ID it finds, and accepts a bare 11-character ID on its own line.

## How to extract video IDs

1. Open the [YouTube URL & Video ID Extractor](/tools/youtube-url-parser/).
2. Paste your links into **YouTube links (one per line)**. You can paste one link or a whole column from a spreadsheet.
3. Leave **Remove duplicate videos** ticked unless you need a row for every line.
4. Press **Extract**. If you just want to see how it behaves, press **Try examples** to load a mixed sample, including a channel link and a line of plain text.
5. Check the summary badges, which show how many lines are valid and how many are invalid.
6. Use **Copy IDs** to copy every video ID on its own line, or **Export CSV** for a full spreadsheet.

The results table lists each line's number, status, video ID, playlist, start time and link type. Invalid rows say why they failed, for example "Not a YouTube link" or "This YouTube link is not a video or playlist".

## What you get for each video

Below the table, each valid line gets a card with ready-to-copy links:

- **Canonical**, the plain watch link with nothing extra.
- **Short**, the youtu.be version.
- **Embed** and **No-cookie**, for use inside an iframe.
- **Shorts**, the vertical-player address.
- **With start** and **In playlist**, when the original link had a time or a playlist.

A collapsible **Thumbnail image URLs** section lists the five standard image addresses on `i.ytimg.com`:

| Name | Size (px) |
|---|---|
| default | 120 × 90 |
| mqdefault | 320 × 180 |
| hqdefault | 480 × 360 |
| sddefault | 640 × 480 |
| maxresdefault | 1280 × 720 |

These are just text addresses. Nothing is fetched from YouTube until you press **Show thumbnails** on a card, or **Show thumbnails (first 10)** in the toolbar. At that point the images load from YouTube's servers, and any size that does not exist for that video is marked "not available".

The CSV export includes, for every line, the input, a valid flag, video ID, playlist ID, start in seconds, type or error, watch, short, embed and Shorts URLs, and the hq and maxres thumbnail addresses.

## Example: tidying a messy link

Say a colleague sends you `https://m.youtube.com/watch?v=aqz-KE-bpKQ&list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI&index=2`. After pressing **Extract**, the table shows the video ID `aqz-KE-bpKQ`, the playlist ID and the type "Watch page · mobile site". The card then offers:

- a canonical link, `https://www.youtube.com/watch?v=aqz-KE-bpKQ`, with the mobile prefix and index removed;
- a short link, `https://youtu.be/aqz-KE-bpKQ`;
- an "In playlist" link that keeps the list for anyone who wants to continue watching.

Similarly, a youtu.be link carrying `?si=abc123&t=42` is reduced to its ID, with the 42-second start time listed separately so you decide whether to keep it. The tracking code is simply not carried over.

## Who finds this useful

- **Website owners** cleaning a list of video links before adding them to a page or database.
- **Teachers and trainers** who collected links from many people in different formats.
- **Marketers** auditing which videos are linked across campaigns, with duplicates removed.
- **Developers** who need IDs for the YouTube Data API or for building embeds programmatically.
- **Anyone tidying a link** copied from the app, where tracking codes like `si=` make it long and messy.

## Tips and limits

- Up to 2,000 lines are processed at once. Detailed cards are shown for the first 100, while the CSV includes everything.
- An ID that is not exactly 11 characters of A–Z, a–z, 0–9, hyphen or underscore is flagged, which catches links broken by copy-paste.
- Links without `https://`, such as `youtu.be/...`, are accepted and completed automatically.
- Attribution links that wrap another YouTube address are unpacked to find the real video.
- Untick **Remove duplicate videos** when you need the output to line up row for row with an existing spreadsheet; the CSV then keeps one row for every non-empty line you pasted.
- Lines are read independently, so one broken link does not stop the rest of the list from being processed.
- Parsing works offline once the page has loaded, which is handy on patchy connections.

## Mistakes to avoid

- **Assuming a thumbnail URL means a video still exists.** Deleted or private videos can still return a placeholder image; open the canonical link to confirm.
- **Reusing other creators' thumbnails as your own.** Thumbnails are part of their work. Link or embed instead, or design your own in the [YouTube Thumbnail Maker](/tools/youtube-thumbnail-maker/).
- **Expecting channel IDs.** This tool is for videos and playlists, not channels or handles.
- **Forgetting the start time.** If a link had `t=`, use the "With start" link rather than the canonical one when you want to keep it.

## Next steps

Once you have an ID, the [YouTube Embed Code Generator](/tools/youtube-embed-code-generator/) turns it into responsive, privacy-friendly embed code. If your list is in Excel, the [Excel & CSV Converter](/tools/excel-csv-converter/) can help you move the exported CSV back into a workbook. All of these run in your browser with no sign-up and no upload.
