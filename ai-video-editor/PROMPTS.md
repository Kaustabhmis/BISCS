# Copy-paste prompts

Use these in Claude Code, opened in the `ai-video-editor/` folder. `CLAUDE.md` already holds the
standing rules, so the prompts can stay short.

## 0 · Check setup
> Run `scripts/check_tools.sh` and tell me what is installed and what's missing. Ask before installing anything.

## 1 · Style analysis (once)
> Study the videos in References using the available analysis tools. Identify their pacing, edit rhythm,
> caption design, colours, transitions, zooms and recurring motion patterns. Fill in Editing Style Guide.md.
> State what you could verify and flag any uncertain observations.

## 2 · Edit plan
> Transcribe the footage in Raw Footage with Whisper. Identify silence, repeats, mistakes and strong moments.
> Use my Editing Style Guide to propose timestamped cuts, caption moments, zooms and graphics.
> Show the edit decision list first. Do not modify the source or render anything until I approve.

## 3 · Approved first cut
> I reviewed the edit plan. Apply only the cuts I approve, preserve my raw footage, create an editable
> version of the plan, and render a first preview. Show me a short change log with the cut timestamps.

## 4 · Captions
> Transcribe the approved edit with Whisper. Create captions aligned to the spoken words, based on my style
> guide. Keep them readable on a phone, avoid covering the speaker, and leave clear space around Instagram
> interface elements. Export a captioned preview and a separate subtitle file.

## 5 · Caption correction pass
> Review the captions line by line. Correct misheard words, capitalisation, punctuation and timing errors.
> Fix "Cloud" to "Claude" where appropriate, enlarge captions where needed, and regenerate the preview.

## 6 · Motion pass
> Use my Editing Style Guide to add tasteful zooms, animated emphasis words and motion graphics where they
> help explain the message. Use FFmpeg to composite and export. Avoid constant movement and unnecessary
> sound effects. Render a preview for review.

## 7 · Review fixes
> Here are my corrections with timestamps: … Fix only those issues, preserve all approved edits, and render
> a fresh preview.

## 8 · Final export
> Export the approved final video with scripts/export_reel.sh (MP4, H.264, AAC, 1080×1920, source frame rate).
> Check that captions, music and speech are in sync. Save it in Exports and verify that it plays.

---

## Master prompt (whole workflow in one go)
> You are my AI video editing assistant. Work only inside this project folder.
> 1. Inspect Raw Footage and read Editing Style Guide.md.
> 2. Use Whisper to transcribe the video and build a timestamped edit plan.
> 3. Mark dead air, repeats, weak takes, strong hooks and graphic opportunities.
> 4. Show me the plan and WAIT for approval before making edits.
> 5. After approval, use the installed tools to create a first cut.
> 6. Add accurate captions, restrained motion, and licensed audio where useful.
> 7. Render a preview, provide a change log, and fix my review notes.
> 8. Export the approved MP4 to Exports, leaving original files unchanged.
>
> If a required tool is missing, explain what is needed and ask permission before installing.
> Do not claim a render or test succeeded unless you checked it.
