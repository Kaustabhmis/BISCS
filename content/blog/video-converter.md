{
  "tool": "video-converter",
  "slug": "convert-video-mp4-extract-mp3",
  "title": "Convert Video to MP4, WebM or MOV and Extract MP3 Audio",
  "description": "Convert videos between MP4, WebM, MOV and MKV, or pull the audio out as MP3, M4A or WAV, in your browser. Codecs and containers explained in plain English.",
  "keywords": ["video converter", "convert mov to mp4", "video to mp3", "extract audio from video", "webm to mp4"],
  "summary": "To convert a video, open it in a converter, choose the output format such as MP4, WebM, MOV or MKV, and export. To get just the sound, choose MP3, M4A or WAV. BISCS India's Video Converter & MP3 does both in your browser, copies streams without re-encoding when possible, and never uploads your file.",
  "faq": [
    { "q": "What is the best video format for sharing?", "a": "MP4 with H.264 video and AAC audio is the safest choice. It plays on Android phones, iPhones, Windows and Mac computers, smart TVs, WhatsApp, PowerPoint and almost every website. Use WebM mainly for web pages, and MOV when an Apple editing workflow specifically asks for it." },
    { "q": "Why won’t my MOV file from an iPhone play on Windows or Android?", "a": "Newer iPhones often record in HEVC, also called H.265, inside a MOV file. Some Windows PCs, older Android phones and websites cannot decode HEVC without extra support. Converting to MP4 with H.264 solves this. Note that HEVC files may also fail to preview in some browsers, though the converter can usually still read them." },
    { "q": "Which audio bitrate should I choose for MP3?", "a": "For speech such as lectures, interviews or voice notes, 128 kbps is plenty. For music, 192 kbps sounds good to most listeners, and 320 kbps is the highest common MP3 setting. A higher bitrate cannot restore quality the original video never had, so do not exceed the source quality." },
    { "q": "Is it legal to extract audio from a YouTube or film video?", "a": "The tool converts files already on your device; it does not download from websites. Whether you may use the audio depends on copyright and the platform’s terms. Your own recordings, licensed material and content whose owner gave permission are fine. Commercial films and songs generally are not yours to redistribute." },
    { "q": "What does Copy streams when possible do?", "a": "If the video and audio inside your file already use codecs the new container supports, the converter copies them into the new wrapper without re-encoding. That is much faster and loses no quality. If the codecs are not compatible, it automatically re-encodes instead. This option is not available for WebM output or when changing resolution." }
  ]
}
---
Converting a video changes the file format so that it plays on a device or app that refused the original. Extracting audio pulls the sound out as an MP3 or similar file, so you can keep a lecture, a voice note or your own song without the picture.

The [Video Converter & MP3](/tools/video-converter/) on BISCS India does both. It converts between MP4, WebM, MOV and MKV, exports audio as MP3, M4A or WAV, and runs entirely in your browser, so your files are never uploaded.

## Containers and codecs, explained simply

Video files confuse people because two separate things are going on, and file names show only one of them.

- **The container** is the box: MP4, MOV, MKV, WebM. It is what the extension tells you. A container holds a video track, one or more audio tracks and some information such as duration.
- **The codec** is how the contents of the box were compressed: H.264, HEVC (H.265), VP9 or AV1 for video; AAC, MP3 or Opus for audio.

A device needs to understand both. A `.mp4` file can still fail to play if the video inside uses a codec the device does not support. That is why simply renaming `video.mov` to `video.mp4` does not work: the box gets a new label, but the contents are unchanged.

## Which format should you choose?

| Format | Inside (this tool) | Best for |
| --- | --- | --- |
| MP4 | H.264 + AAC | Sharing anywhere: WhatsApp, phones, PowerPoint, TVs |
| WebM | VP8/VP9 + Opus | Web pages, open formats |
| MOV | H.264 + AAC | Apple apps and some editing workflows |
| MKV | H.264 + AAC | Archiving, media players such as VLC |
| MP3 | Audio only | Universal audio: phones, car stereos, podcasts |
| M4A | AAC audio | Apple devices, good quality at small sizes |
| WAV | Uncompressed audio | Editing in audio software; large files |

If you are unsure, choose **MP4** for video and **MP3** for audio. They work almost everywhere.

## How to convert a video with BISCS India

1. Open the [Video Converter & MP3](/tools/video-converter/).
2. Choose a video or audio file, or drag it onto the page. MP4, MOV, WebM, MKV, AVI, MP3, WAV and many other formats are accepted.
3. Under **Format**, pick the output: **MP4**, **WebM**, **MOV**, **MKV**, **MP3**, **M4A** or **WAV**. Video formats only appear when the file has a video track.
4. For video output, set the **Quality** (**Smaller**, **Balanced** or **Better**) and the **Resolution**. Leave **Copy streams when possible (much faster, no quality loss)** ticked unless you have a reason to force a re-encode.
5. For MP3 or M4A, choose an **Audio bitrate**: 128, 192 or 320 kbps for MP3, or 128, 192 or 256 kbps for M4A.
6. Click **Convert**. The first time, the browser downloads a video engine of about 32 MB, which is then cached.
7. Preview and download the result. The tool shows the original size next to the new size.

## Extracting audio: MP3 from a video

Choosing MP3, M4A or WAV for a video file keeps only the sound. Common reasons include:

- Saving a recorded lecture or seminar to listen to on a commute.
- Getting the audio of a family function video to share with elderly relatives on a basic phone.
- Pulling a voice-over out of a screen recording to edit it separately.
- Turning a recorded song practice into an audio file for your teacher.

As a guide, 128 kbps MP3 is fine for speech, while 192 kbps or more suits music. WAV is uncompressed, about 10 MB per minute, so use it only if you will edit the audio further. For recording new audio directly, or trimming an existing clip before export, the [Audio Recorder & Converter](/tools/audio-recorder/) is a better fit.

## Speed: copying vs re-encoding

**Stream copy** moves the existing video and audio into a new container without touching them. Converting an iPhone MOV that already contains H.264 to MP4 this way takes seconds and loses nothing.

**Re-encoding** decodes every frame and compresses it again. It is needed when the codec must change, for example HEVC to H.264, or any conversion to WebM. It takes longer and depends heavily on your device: a laptop is much faster than a phone, and long or 4K videos can take many minutes. The converter tries a copy first when the option is ticked and falls back to re-encoding automatically when needed.

## Tips and common mistakes

- **Do not rename extensions to convert.** Use a converter so the codec actually changes.
- **Do not convert repeatedly.** Each re-encode loses a little quality. Always convert from the original file.
- **Keep the resolution at Original** unless you also want a smaller file. Lowering it forces a re-encode. If size is your real goal, the [Video Compressor](/tools/video-compressor/) has presets for WhatsApp, email and exact sizes.
- **Expect larger WAV files.** That is normal, not a fault.
- **Keep the tab open** during long conversions, especially on phones, where switching apps can pause the browser.
- **Trim first if you only need part of it.** The [Video Trimmer](/tools/video-trimmer/) cuts without re-encoding, and a shorter clip converts faster.

## Privacy and limits

The conversion runs on your own device using a browser build of the FFmpeg engine, the same open-source engine many desktop apps use behind the scenes. Your video is never uploaded, so personal and work recordings stay private. Very large files are processed in memory, which can fail on phones or older computers; the tool warns you before starting if a file is large, and a shorter clip is the easiest workaround.
