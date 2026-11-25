# Edit plan — domebox_whatsapp

**Status: preview v2 rendered (`preview_v2.mp4`). Approved: items 1 (gentle), 2, 4, 5. Not approved: 3 (hook headline).**

Re-render: `python3 Work/domebox_whatsapp/render.py` from `ai-video-editor/`.

## Source
`Raw Footage/domebox_whatsapp.mp4`: 67.5 s · 720×1280 vertical · 30 fps · H.264 / AAC mono 44.1 kHz ·
loudness −19.2 LUFS (peak −1.7 dBTP). Made read-only.

Type: illustrated explainer with voiceover and **captions already burned into the picture**
(handwritten style, lower-middle, clear of the Instagram UI). 11 scene changes, at
6.3 · 12.9 · 18.0 · 23.2 · 28.7 · 34.7 · 40.1 · 44.9 · 50.3 · 56.3 · 64.4 s.
The narration is already tight: no retakes, mistakes or repeats to remove.

## Transcript corrections (Whisper vs. the on-screen captions)
| Time | Whisper heard | On-screen / correct |
|---|---|---|
| 28.3 | delegation **scope** | Delegation **Score** |
| 44.5 | a slow **checkup** | a slow **checker** |

Corrected transcript: `transcript_corrected.srt`.

## Proposed edits

### 1. Trim long pauses: recommended "gentle" version (7 cuts, ~5.5 s saved → ~62 s)
Every pause is left at ~0.25 s. Cut points are snapped to scene changes where one falls inside the pause.

| # | Remove from | to | Saves | Where |
|---|---|---|---|---|
| 1 | 5.96 | 6.30 | 0.34 s | after "…arguments." (at scene change) |
| 2 | 12.46 | 12.93 | 0.47 s | after "…accountability." (at scene change) |
| 3 | 13.44 | 13.93 | 0.49 s | after "First," |
| 4 | 22.68 | 23.17 | 0.49 s | after "…themselves." (at scene change) |
| 5 | 34.38 | 34.70 | 0.32 s | after "…rework rate." (at scene change) |
| 6 | 47.60 | 47.91 | 0.31 s | after "…held hostage." |
| 7 | 55.92 | 56.30 | 0.38 s | after "…accessible." (at scene change) |

Alternative **"tight" version**: also trim the 10 smaller pauses (0.17–0.29 s each) → **~59.9 s**,
under the 60 s mark. Downside: 10 extra micro-cuts, which may look like small jumps in the illustrations.

### 2. Ending
- 64.4–67.5 s is a silent end card with a small logo. **Proposed:** keep 0.6 s of it after the last word
  and remove 65.0–67.5 (2.5 s), adding a 0.4 s fade-out of picture and sound.
- Alternative: keep the full end card.

### 3. Hook (0–3 s)
The opening line ("Running a growing business on WhatsApp means lost instructions…") is a good hook.
**Proposed:** add one headline in the upper third for the first 3 s, above the existing captions and below
the top ~250 px Instagram UI. Suggested text (pick one or write your own):
- **"Still running your team on WhatsApp?"**
- "WhatsApp is not a task manager."

### 4. Captions
- **No new burned-in captions.** The video already has them; a second set would clash.
- Export a corrected `.srt` file separately, for upload as captions on YouTube Shorts / LinkedIn / Facebook.

### 5. Motion
Keep it restrained: the illustrations already change every ~5–6 s. Optional slow punch-ins (1.0 → 1.08):
- 31.4–34.4 s: the dashboard (98.4% on-time, 1.2% rework), the key proof moment
- 41.8–44.6 s: the manager score dropping to 68

### 6. Audio
Normalise to −14 LUFS (from −19.2), true peak ≤ −1 dBTP. Convert mono to stereo. No music or SFX unless you supply licensed tracks.

### 7. Export
MP4 · H.264 · AAC · 1080×1920 (upscaled from 720×1280) · 30 fps →
`Exports/domebox_whatsapp_final.mp4`

## Your decisions
1. Pauses: **gentle (~62 s)** / tight (~60 s) / none
2. End card: **trim to 0.6 s + fade** / keep full
3. Hook headline: yes (which text?) / no
4. Punch-in zooms: yes / no
5. Anything else to change, e.g. a call to action at the end ("Book a demo at …")

## Change log
### preview_v1.mp4
- Approved: **ending cut.** Removed 65.00–67.50 s; 0.4 s fade-out of picture and sound from 64.60 s.
  The end card now shows for ~0.6 s. Duration 67.5 s → 65.0 s.
- Technical (no editorial change): loudness −19.2 → −14.1 LUFS (true peak −0.9 dBTP), mono → stereo 48 kHz,
  upscaled 720×1280 → 1080×1920, H.264/AAC, 30 fps.
- Not applied (not approved): pause trims, hook headline, zooms.

### preview_v2.mp4
- Approved **item 1, gentle pause trims**: the 7 cuts in the table above, snapped to whole frames → 2.80 s removed.
- Kept **item 2, ending cut** (as v1).
- Approved **item 4, punch-in zooms** 1.0 → 1.08 (smooth ease): dashboard 31.4–34.7 s, manager score 41.8–44.87 s
  (source times); each snaps back to 1.0 on the scene change.
- Approved **item 5, call to action**: dark card in the upper third (y = 300 px), "Try DomeBox Today" /
  "www.domebox.in" (wording from the BISCS website). Fades in at 59.9 s (source), on "DomeBox shifts your
  entire culture…", and stays to the end.
- Result: 62.20 s · 1866 frames; audio 62.20 s (frame-accurate trim/atrim, no drift) · −14.1 LUFS · −1.3 dBTP.
