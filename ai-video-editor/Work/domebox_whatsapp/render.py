#!/usr/bin/env python3
"""Render the domebox_whatsapp preview from the approved edit plan.

Run from ai-video-editor/:  python3 Work/domebox_whatsapp/render.py [output.mp4]
The source in Raw Footage/ is only read. All times below are on the SOURCE timeline.
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = "Raw Footage/domebox_whatsapp.mp4"
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "preview_v2.mp4")
FPS = 30
W, H = 1080, 1920

# Approved: gentle pause trims (plan item 1) + ending cut (item 2). (start, end) removed.
CUTS = [(5.96, 6.30), (12.46, 12.93), (13.44, 13.93), (22.68, 23.17),
        (34.38, 34.70), (47.60, 47.91), (55.92, 56.30)]
END = 65.0          # everything after this is removed
FADE_START = 64.6   # 0.4 s fade-out of picture and sound

# Approved: punch-in zooms (item 4). (ramp start, ramp end, hold until scene change)
ZOOMS = [(31.4, 34.4, 34.70), (41.8, 44.6, 44.8667)]
ZOOM_TO = 1.08

# Approved: call to action (item 5), wording/URL taken from the BISCS website.
CTA_IN, CTA_FADE = 59.9, 0.35
CTA_TITLE, CTA_URL = "Try DomeBox Today", "www.domebox.in"
CTA_Y = 300  # below the top ~250 px Instagram UI


def snap(t):  # snap to frame boundaries so audio and video cuts line up exactly
    return round(t * FPS) / FPS


def make_card(path):
    font_b = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf", 78)
    font_u = ImageFont.truetype("/usr/share/fonts/opentype/inter/Inter-Bold.otf", 50)
    cw, ch = 860, 250
    img = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, cw - 1, ch - 1), radius=36, fill=(30, 27, 24, 236))
    for text, font, y, fill in ((CTA_TITLE, font_b, 42, (247, 241, 230, 255)),
                                (CTA_URL, font_u, 150, (242, 107, 58, 255))):
        w = d.textlength(text, font=font)
        d.text(((cw - w) / 2, y), text, font=font, fill=fill)
    img.save(path)
    return cw


def zoom_expr():
    # smoothstep ramp 1.0 -> ZOOM_TO, held until the scene change, then back to 1.0 on the cut
    parts = []
    for a, b, hold in ZOOMS:
        p = f"clip((t-{a})/{b - a:.3f},0,1)"
        parts.append(f"between(t,{a},{hold})*{ZOOM_TO - 1:.3f}*{p}*{p}*(3-2*{p})")
    return "1+" + "+".join(parts)


def main():
    card = os.path.join(HERE, "cta_card.png")
    cw = make_card(card)
    # kept segments as whole frames: [start_frame, end_frame)
    frames = [(round(a * FPS), round(b * FPS)) for a, b in CUTS]
    segs, pos = [], 0
    for a, b in frames:
        segs.append((pos, a))
        pos = b
    segs.append((pos, round(END * FPS)))
    removed = sum(b - a for a, b in frames) / FPS
    n = len(segs)
    z = zoom_expr()
    graph = (
        f"[0:v]scale={W}:{H}:flags=lanczos,"
        f"scale=w='2*trunc({W}*({z})/2)':h='2*trunc({H}*({z})/2)':eval=frame:flags=lanczos,"
        f"crop={W}:{H},setsar=1[v0];"
        f"[1:v]format=rgba,fade=t=in:st={CTA_IN}:d={CTA_FADE}:alpha=1[cta];"
        f"[v0][cta]overlay=x={(W - cw) // 2}:y={CTA_Y}:enable='gte(t,{CTA_IN})',"
        f"fade=t=out:st={FADE_START}:d={END - FADE_START:.2f},split={n}"
        + "".join(f"[vs{i}]" for i in range(n)) + ";"
        f"[0:a]pan=stereo|c0=c0|c1=c0,afade=t=out:st={FADE_START}:d={END - FADE_START:.2f},asplit={n}"
        + "".join(f"[as{i}]" for i in range(n)) + ";"
    )
    for i, (a, b) in enumerate(segs):
        graph += (f"[vs{i}]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}];"
                  f"[as{i}]atrim=start={a / FPS:.6f}:end={b / FPS:.6f},asetpts=PTS-STARTPTS[a{i}];")
    graph += "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[v][a0]"
    # two-pass loudness normalisation to -14 LUFS
    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", SRC, "-loop", "1", "-framerate", str(FPS), "-t", str(END), "-i", card,
         "-filter_complex", graph + ";[v]nullsink;[a0]loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[a]",
         "-map", "[a]", "-f", "null", "-"], capture_output=True, text=True, check=True).stderr
    m = json.loads(probe[probe.rindex("{"):])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", SRC,
         "-loop", "1", "-framerate", str(FPS), "-t", str(END), "-i", card,
         "-filter_complex", graph + f";[a0]{ln},aresample=48000[a]",
         "-map", "[v]", "-map", "[a]", "-r", str(FPS),
         "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT], check=True)
    print(f"removed {removed:.2f}s of pauses -> expected length {round(END * FPS) / FPS - removed:.2f}s")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
