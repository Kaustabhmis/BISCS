# AI Video Editor

A repeatable workflow for editing Reels, Shorts and talking-head videos with Claude Code, FFmpeg and Whisper.
Claude plans and runs the edit; FFmpeg and Whisper do the processing; **you approve every key decision.**

## Folders
| Folder | What goes in it |
|---|---|
| `Raw Footage/` | Your original recordings. Claude never changes these. |
| `References/` | 3–5 style examples you own or have permission to use. |
| `Work/` | Transcripts, edit plans, subtitle files and previews. |
| `Exports/` | Finished MP4s, ready to post. |

Video files are git-ignored (too large for the repo). Only the plans, style guide and scripts are committed.

## Files
- `CLAUDE.md`: standing rules Claude follows automatically in this folder (approval gate, raw footage read-only, export spec).
- `Editing Style Guide.md`: your house style. Fill it in, or have Claude draft it from your references.
- `PROMPTS.md`: copy-paste prompts for each step, plus the master prompt.
- `scripts/check_tools.sh`: shows which tools are installed.
- `scripts/export_reel.sh`: exports at 1080×1920, H.264 and AAC, optionally burning in captions, then checks the file.

## How to use it
1. Open Claude Code in this folder (`cd ai-video-editor && claude`).
2. Run prompt **0** to check the tools.
3. Put references in `References/` and run prompt **1** once to build your style guide.
4. For each video, put the recording in `Raw Footage/` and go through prompts **2 → 8**.
   Claude stops after the edit plan and waits for your approval.

## Tools
| Tool | Job | Install |
|---|---|---|
| FFmpeg | cut, resize, mix audio, burn captions, export | https://ffmpeg.org/download.html |
| OpenAI Whisper | speech-to-text and caption timing | `pip install openai-whisper` (needs FFmpeg) |
| yt-dlp | download references you have permission to use | `pip install yt-dlp` |
| HyperFrames (optional) | coded motion graphics | https://github.com/heygen-com/hyperframes |

Whisper model sizes: `base` is fast but makes more mistakes; `small` or `medium` give better captions but run slower on a CPU.
Always proofread names and jargon.

## Export spec
MP4 · H.264 · AAC · 1080×1920 · source frame rate

```bash
scripts/export_reel.sh "Work/clip/final_cut.mp4" "Exports/clip_final.mp4" "Work/clip/captions.srt"
```
