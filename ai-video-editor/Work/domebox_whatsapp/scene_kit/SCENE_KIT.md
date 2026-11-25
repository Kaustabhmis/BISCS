# Domebox video: animation scene kit

Turn the 11 illustrated stills into short animated clips with real movement, then send the clips back.
I'll cut them to the voiceover and add fresh captions, the Domebox screenshots, the cinematic grade and the end card.

## The 3 steps

### Step 1: remove the caption from each still
Every still in `stills/` still has its grey caption label burned in. A video generator would warp that text,
so remove it first with an AI image editor (e.g. Gemini, or the eraser/"edit image" tool in your video generator).
Use this prompt for every image:

> Remove the grey caption label and the handwritten text on it, near the bottom of this image. Redraw what was
> behind it so it blends with the surrounding illustration. Keep everything else exactly the same: same art style,
> colours, people, screens and the text on them, framing and image size.

Check the result: hands, faces and clothing under the label should look natural.

### Step 2: animate each cleaned still (image-to-video)
Settings in any tool (Veo / Google Flow, Runway, Kling, Luma…):
- **Image-to-video**, using the cleaned still as the **first frame**
- **Aspect ratio 9:16** (vertical), highest quality available
- **Length:** at least the "needs" time below (5 s clips are fine unless noted; scene 11 needs 8 s+)
- Sound doesn't matter; I'll replace it with your voiceover
- Generate 2–3 versions of the important character scenes and pick the most natural one

Add this **style line to the end of every prompt**:

> Keep the exact hand-drawn ink and watercolour illustration style, colours and composition. Subtle, natural,
> realistic motion. All text and numbers on screens and papers stay sharp and unchanged. No new people, no new
> text, no camera cuts.

### Step 3: send the clips back
Name them `scene01.mp4` … `scene11.mp4` (any you skip, I'll keep as moving stills) and upload them here.

---

## Scene prompts

| # | Still | Needs | Narration over it |
|---|---|---|---|
| 1 | Frustrated owner with phone ★ | 6.0 s | "Running a growing business on WhatsApp means lost instructions and performance reviews that turn into arguments." |
| 2 | Desk with dashboard monitor | 6.2 s | "Domebox fixes this chaos by replacing chat groups with four strict rules for team accountability." |
| 3 | Worker hands a part to manager ★ | 4.5 s | "First, tasks are never truly done until the person who assigns them verifies the work." |
| 4 | "Completed / Verification Sign-Off" card | 4.7 s | "This stops half-finished jobs from slipping through because the worker can't just tick it off themselves." |
| 5 | Two managers reviewing the Delegation Score ★ | 5.5 s | "Second, it kills biased annual appraisals using a system-calculated delegation score." |
| 6 | Dashboard 98.4% / 1.2% | 5.7 s | "Every month, it objectively weighs how much work an employee delivered on time against their rework rate." |
| 7 | Stopwatch and "Awaiting Approval" folder | 5.4 s | "Third, managers are held accountable too. If an approval sits on a manager's desk past the deadline…" |
| 8 | Manager card, score 68 ↓ | 4.7 s | "…the manager loses points, ensuring the worker is never punished for a slow checker." |
| 9 | Man at desk, "Subscription Expired" ★ | 5.1 s | "Finally, your data is never held hostage." |
| 10 | "Read-Only Mode" audit log | 5.6 s | "If a company stops paying… the workspace simply turns read-only, keeping years of crucial audit logs safe and accessible." |
| 11 | Smiling man with tablet on the factory floor ★ | 8.1 s | "By tying every single job to a verified timestamp, Domebox shifts your entire culture from constant chasing to objective delivery." |

★ = character scene; worth the most effort.

**1** · The frustrated factory owner in the patterned shirt grips his phone as new message notifications keep
popping up on the screen. He frowns harder, exhales and gives a small shake of his head. Behind him, workers move
around their stations. Slow camera push-in.

**2** · A quiet office desk. On the monitor, the bars of the dashboard chart gently grow and the screen glows softly.
The papers on the desk shift slightly as if in a light breeze. Slow, smooth camera glide towards the monitor.

**3** · The site worker in the yellow hard hat and hi-vis vest hands a metal part to the manager in the white shirt.
The manager takes it, turns it over to inspect it carefully, then gives an approving nod. Machinery in the background
moves softly.

**4** · A pen comes into frame and ticks the "Verification Sign-Off" checkbox with a firm stroke. The "COMPLETED"
stamp presses down with a small bounce. Slow push-in.

**5** · The woman in the teal blouse and lilac scarf studies the "Delegation Score" report. The older man with glasses
points at the chart and speaks; she looks up and nods in agreement. Steam rises gently from the mug. The screen
behind them flickers softly.

**6** · On the monitor, the gauge needle under "On-Time Delivery Rate" sweeps up and settles. The small bar in the
"Rework Rate" chart drops a little. The numbers 98.4% and 1.2% stay exactly as they are. Slow push-in.

**7** · The stopwatch's second hand ticks steadily around the dial. The "Awaiting Approval" folder lies untouched while
the paper corners flutter slightly. A feeling of time passing. Very slow push-in.

**8** · The red arrow next to the score "68" slides further down and pulses once. The manager card shakes slightly as if
pinned to the board. The pens roll a little on the desk.

**9** · The young man with the ID lanyard reads the "Subscription Expired" message on his monitor, pauses, then his
shoulders relax with relief as he keeps working calmly. Soft glow from the screen.

**10** · The "Read-Only Mode" banner settles onto the screen. The rows of the audit log highlight one after another,
top to bottom, like a cursor scanning them. All text stays sharp and readable. Slow push-in.

**11** · The smiling man in the white shirt swipes and taps his tablet, then looks up with quiet confidence. Behind him,
factory workers operate the machines steadily. Slow dolly forward. *(Generate 8–10 s.)*

---

## When the clips come back, I'll:
- Cut each clip to its exact length (above) so it lines up with the voiceover
- Move the Domebox screenshots onto the object scenes (2, 4, 6, 10) so they don't hide the characters' movement
- Add new captions from the corrected transcript ("Delegation Score", "slow checker")
- Keep the cinematic grade, the Domebox end card, and the −14 LUFS voiceover
- Fall back to a moving still for any scene you skip or that comes out badly
