#!/usr/bin/env python3
"""Render the domebox_whatsapp edit (current version: preview v3, "cinema").

Run from ai-video-editor/:  python3 Work/domebox_whatsapp/render.py [output.mp4]
The source in Raw Footage/ is only read. All times are on the SOURCE timeline unless noted.

Earlier versions: v1 = ending cut only; v2 = + pause trims, zooms, CTA overlay (see git history).
"""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
BUILD = os.path.join(HERE, "build")
SRC = "Raw Footage/domebox_whatsapp.mp4"
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "preview_v3.mp4")
FPS, W, H = 30, 1080, 1920
SR = 44100  # source sample rate; resampled to 48 kHz at the end

# ---- Edit decisions -------------------------------------------------------------------------
# Approved: gentle pause trims (plan item 1). (start, end) removed.
CUTS = [(5.96, 6.30), (12.46, 12.93), (13.44, 13.93), (22.68, 23.17),
        (34.38, 34.70), (47.60, 47.91), (55.92, 56.30)]
# Ending: cut before the NotebookLM end card appears at 64.43 s (user request, v3).
END = 64.40
DIP = (64.00, 0.40)          # picture dips to black
AUDIO_FADE = (64.15, 0.25)   # after the last word ("delivery." ends 64.12 s)

# Approved: punch-in zooms (item 4). (ramp start, ramp end, hold until scene change)
ZOOMS = [(31.4, 34.4, 34.70), (41.8, 44.6, 44.8667)]
ZOOM_TO = 1.08

# Cinematic finish: slow push across every scene, supersampled so it moves smoothly.
SCENES = [0, 6.3, 12.9333, 17.9667, 23.1667, 28.7, 34.7, 40.1333, 44.8667, 50.3, 56.3, 64.4333]
PUSH, SS = 0.04, 2
GRADE = ("curves=all='0/0.035 0.25/0.225 0.75/0.79 1/0.975',"
         "colorbalance=rs=-0.03:bs=0.045:rh=0.035:gh=0.01:bh=-0.035,"
         "eq=saturation=1.07,vignette=angle=PI/4.6")
GRAIN = "noise=c0s=7:c0f=t"
FADE_IN = 0.25

# Product screenshots as "proof" cards, timed to the narration. Kept above the burned-in
# captions (~y 1360) and clear of the approved zoom shots.
#   file, crop box (px in the screenshot), display width, show from, to
PROOF = [
    ("phone_tasks.jpg", (0, 0, 1170, 1700), 620, 6.80, 12.30),     # "Domebox fixes this chaos…"
    ("task_detail.jpg", (1150, 0, 1800, 800), 640, 14.20, 19.60),  # "…until the person who assigns them verifies"
    ("appraisal.jpg", (420, 60, 1380, 1000), 820, 24.00, 28.55),   # "…biased annual appraisals… delegation score"
    ("leaderboard.jpg", (240, 195, 1560, 885), 960, 35.40, 40.00),  # "managers are held accountable too"
    ("tasks_board.jpg", (1335, 445, 1755, 930), 560, 57.00, 60.50),  # "…a verified timestamp"
]
CARD_TOP, CARD_BOTTOM = 330, 1300
CARD_IN, CARD_OUT, CARD_RISE = 0.35, 0.30, 36

# End card (replaces the NotebookLM card). Wording from the Domebox slides.
ENDCARD_DUR = 2.8
NAVY = (18, 41, 75)  # sampled from the Domebox app header, so the logo crop blends in
LOGO_CROP = ("phone_tasks.jpg", (40, 50, 420, 150))
END_LINES = [("Start growing this week", "Inter-ExtraBold.otf", 84, (255, 255, 255)),
             ("14 days free · no card", "Inter-Medium.otf", 46, (196, 210, 238)),
             ("www.domebox.in", "Inter-Bold.otf", 66, (245, 183, 0))]
FONTS = "/usr/share/fonts/opentype/inter/"


# ---- Assets ---------------------------------------------------------------------------------
def proof_card(name, box, width, path):
    shot = Image.open(os.path.join(ASSETS, name)).convert("RGB").crop(box)
    h = round(shot.height * width / shot.width)
    shot = shot.resize((width, h), Image.LANCZOS)
    pad, r = 48, 26
    shadow = Image.new("L", (width + 2 * pad, h + 2 * pad), 0)
    ImageDraw.Draw(shadow).rounded_rectangle((pad, pad + 14, pad + width, pad + h + 14), r, fill=120)
    img = Image.new("RGBA", shadow.size, (10, 15, 30, 0))
    img.putalpha(shadow.filter(ImageFilter.GaussianBlur(20)))
    mask = Image.new("L", (width, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, h - 1), r, fill=255)
    img.paste(shot, (pad, pad), mask)
    ImageDraw.Draw(img).rounded_rectangle((pad, pad, pad + width - 1, pad + h - 1), r,
                                          outline=(255, 255, 255, 90), width=2)
    img.save(path)
    return img.size, pad


def end_card(path):
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)
    name, box = LOGO_CROP
    logo = Image.open(os.path.join(ASSETS, name)).convert("RGB").crop(box)
    logo = logo.resize((logo.width * 2, logo.height * 2), Image.LANCZOS)
    y = 640
    img.paste(logo, ((W - logo.width) // 2, y))
    y += logo.height + 70
    d.line(((W // 2 - 60, y), (W // 2 + 60, y)), fill=(245, 183, 0), width=4)
    y += 70
    for text, font, size, color in END_LINES:
        f = ImageFont.truetype(FONTS + font, size)
        tw = d.textlength(text, font=f)
        d.text(((W - tw) / 2, y), text, font=f, fill=color)
        y += size + 44
    img.save(path)


# ---- Render ---------------------------------------------------------------------------------
def zoom_expr():
    parts = []
    for a, b, hold in ZOOMS:
        p = f"clip((t-{a})/{b - a:.3f},0,1)"
        parts.append(f"between(t,{a},{hold})*{ZOOM_TO - 1:.3f}*{p}*{p}*(3-2*{p})")
    for a, b in zip(SCENES, SCENES[1:]):
        parts.append(f"between(t,{a},{b})*{PUSH}*(t-{a})/{b - a:.4f}")
    return "1+" + "+".join(parts)


def main():
    os.makedirs(BUILD, exist_ok=True)
    inputs = ["-i", SRC]
    cards = []
    for i, (name, box, width, t0, t1) in enumerate(PROOF):
        path = os.path.join(BUILD, f"proof_{i}.png")
        (cw, ch), pad = proof_card(name, box, width, path)
        x = (W - cw) // 2
        y = CARD_TOP + (CARD_BOTTOM - CARD_TOP - (ch - 2 * pad)) // 2 - pad
        cards.append((x, y, t0, t1))
        inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{END:.2f}", "-i", path]
    ec = os.path.join(BUILD, "end_card.png")
    end_card(ec)
    k_end = len(PROOF) + 1
    inputs += ["-loop", "1", "-framerate", str(FPS), "-t", f"{ENDCARD_DUR}", "-i", ec,
               "-f", "lavfi", "-t", f"{ENDCARD_DUR}", "-i", f"anullsrc=r={SR}:cl=stereo"]
    k_sil = k_end + 1

    frames = [(round(a * FPS), round(b * FPS)) for a, b in CUTS]
    segs, pos = [], 0
    for a, b in frames:
        segs.append((pos, a))
        pos = b
    segs.append((pos, round(END * FPS)))
    n = len(segs)
    z = zoom_expr()

    vf = (f"[0:v]scale={W * SS}:{H * SS}:flags=lanczos,"
          f"scale=w='2*trunc({W * SS}*({z})/2)':h='2*trunc({H * SS}*({z})/2)':eval=frame:flags=lanczos,"
          f"crop={W * SS}:{H * SS},scale={W}:{H}:flags=lanczos,{GRADE},setsar=1[b0];")
    last = "b0"
    for i, (x, y, t0, t1) in enumerate(cards):
        rise = f"{CARD_RISE}*pow(1-clip((t-{t0})/0.6,0,1),2)"
        vf += (f"[{i + 1}:v]format=rgba,fade=t=in:st={t0}:d={CARD_IN}:alpha=1,"
               f"fade=t=out:st={t1 - CARD_OUT:.2f}:d={CARD_OUT}:alpha=1[c{i}];"
               f"[{last}][c{i}]overlay=x={x}:y='{y}+{rise}':enable='between(t,{t0},{t1})'[b{i + 1}];")
        last = f"b{i + 1}"
    vf += (f"[{last}]{GRAIN},fade=t=in:st=0:d={FADE_IN},fade=t=out:st={DIP[0]}:d={DIP[1]},split={n}"
           + "".join(f"[vs{i}]" for i in range(n)) + ";")
    for i, (a, b) in enumerate(segs):
        vf += f"[vs{i}]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{i}];"
    vf += (f"[{k_end}:v]format=yuv420p,vignette=angle=PI/4.6,{GRAIN},"
           f"fade=t=in:st=0:d=0.45,fade=t=out:st={ENDCARD_DUR - 0.5}:d=0.5,setsar=1[vend];")
    vf += "".join(f"[v{i}]" for i in range(n)) + f"[vend]concat=n={n + 1}:v=1:a=0[v]"

    af = (f"[0:a]pan=stereo|c0=c0|c1=c0,afade=t=out:st={AUDIO_FADE[0]}:d={AUDIO_FADE[1]},asplit={n}"
          + "".join(f"[as{i}]" for i in range(n)) + ";")
    for i, (a, b) in enumerate(segs):
        af += f"[as{i}]atrim=start={a / FPS:.6f}:end={b / FPS:.6f},asetpts=PTS-STARTPTS[a{i}];"
    af += "".join(f"[a{i}]" for i in range(n)) + f"[{k_sil}:a]concat=n={n + 1}:v=0:a=1[a0]"

    probe = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", SRC, "-f", "lavfi", "-t", f"{ENDCARD_DUR}", "-i",
         f"anullsrc=r={SR}:cl=stereo", "-filter_complex",
         af.replace(f"[{k_sil}:a]", "[1:a]") + ";[a0]loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[a]",
         "-map", "[a]", "-f", "null", "-"], capture_output=True, text=True, check=True).stderr
    m = json.loads(probe[probe.rindex("{"):])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *inputs,
         "-filter_complex", vf + ";" + af + f";[a0]{ln},aresample=48000[a]",
         "-map", "[v]", "-map", "[a]", "-r", str(FPS),
         "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-profile:v", "high", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT], check=True)
    main_len = (round(END * FPS) - sum(b - a for a, b in frames)) / FPS
    print(f"expected length {main_len:.2f}s + end card {ENDCARD_DUR}s = {main_len + ENDCARD_DUR:.2f}s")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
