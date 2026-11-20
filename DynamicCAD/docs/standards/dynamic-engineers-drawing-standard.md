---
name: dynamic-engineers-drawing-standard
description: Creates and checks engineering part, assembly, general arrangement, marking-plan and shop drawings for Dynamic Engineers using the controlled A3 landscape sheet standard. Use whenever the user requests a fan drawing, engineering drawing, fabrication drawing, GA, BOM, title block, drawing PDF, AutoCAD DXF, or revision of an existing drawing. Prepare from the supplied client/source drawing; never invent missing engineering data.
---

# Dynamic Engineers Drawing Standard

## 1. Purpose and authority

Apply this skill to every engineering drawing prepared for **Dynamic Engineers**: fan parts, fabricated parts, assemblies, general arrangements (GA), marking plans, shop drawings and revisions.

The drawing must be prepared from the client's design drawing, RDSO drawing, approved sketch or other source supplied for the job. **The original client/source design governs any conflict.** This skill controls sheet presentation and drafting workflow; it does not authorize Claude to design, redesign, optimize or infer engineering structures.

Do not silently change the source geometry, dimensions, tolerances, material, hole positions, orientation, quantity, notes or construction. If the source is unclear or contradictory, stop at the affected item, identify the uncertainty and ask for clarification. Never fill gaps with plausible values.

Use the company name **DYNAMIC ENGINEERS** throughout. Do not use or carry forward IECPL / Indo East Corporation Private Limited identity, logo, address, CIN, phone, email, ownership wording or document codes. Do not invent Dynamic Engineers corporate details. Use explicit placeholders until approved details are supplied.

## 2. Required sheet standard

Use one master sheet only:

- Trimmed sheet: **A3 landscape, 420 × 297 mm**.
- Coordinate origin: bottom-left of sheet; all coordinates in millimetres.
- Frame: 0.7 mm line; left x=20, right x=410, bottom y=10, top y=287.
- Filing margin: 20 mm at left.
- Drawing area: x=20–230 mm.
- Right information panel: x=230–410 mm, exactly 180 mm wide, full frame height.
- Never redraw the frame at A1, A2, A4 or A0. Other paper sizes are produced by scaling the complete A3 sheet with “Fit to paper”.
- Scale stated on the drawing is always the scale at A3. A4 copy factor 0.707×; A2 1.414×; A1 2×; A0 2.828×. Clearly warn that printed copies may not measure at the stated A3 scale. Written dimensions govern.
- Minimum text height: 2.5 mm.

### Centring marks and grid

Use 0.7 mm centring marks:
- x=210 at top and bottom, from sheet edge to 5 mm inside frame.
- y=148.5 at left and right, from sheet edge to 5 mm inside frame.

Grid zones:
- Columns 1–8, left to right: 20–60, 60–110, 110–160, 160–210, 210–260, 260–310, 310–360, 360–410.
- Rows A–F, top to bottom: 287–248.5, 248.5–198.5, 198.5–148.5, 148.5–98.5, 98.5–48.5, 48.5–10.
- Zone labels: 3.5 mm, centred in margin strips.

## 3. Right information panel

The panel is 180 mm wide (x=230–410). Arrange its contents from top to bottom as follows, adapting vertical space without changing required widths or moving the title block away from the bottom-right:

1. **GENERAL NOTES**: heading 3.5 mm bold navy with gold underline; numbered notes 3.0 mm. Include the default notes in section 5, edited only where job-specific source information requires it. Never omit notes 9 or 10.
2. **BILL OF MATERIAL (BOM)**: heading and table. Column widths in mm:
   - MARK 18.5
   - DESCRIPTION: remaining width
   - SECTION/SIZE 27.5
   - LENGTH × W 24.3
   - QTY 12
   - UNIT WT kg 18.5
   - TOTAL WT kg 19.6
   Header row height 6 mm, fill `#EDF2F7`. Final row text: **TOTAL WEIGHT PER SET (black, before galv.)**, fill `#FFF6D6`.
3. **REVISION TABLE**: newest revision at top; header row at bottom. Columns:
   - REV 12 mm
   - DATE 24 mm
   - REVISION DESCRIPTION: remaining width
   - DRN 14 mm
   - CHKD 14 mm
   - APPD 14 mm
   Row height 6 mm.
4. **Status/projection strip**, 17.5 mm high:
   - Projection symbol plus words **FIRST ANGLE**, occupying 53 mm.
   - Status stamp: gold fill, navy border and navy text. Allowed statuses only: PRELIMINARY / FOR CLIENT APPROVAL / APPROVED BY CLIENT / FOR FABRICATION / AS BUILT / SUPERSEDED.
   - Optional QR box 13 × 13 mm, labelled “Scan to verify latest revision”. Do not create a fake verification QR. Include only when a real revision-verification destination exists.
5. **Title block**, 180 mm wide, bottom-right, using the identification zone at the bottom-most part of the sheet. ISO 7200-inspired layout:
   - Gold band 1.6 mm high, colour `#F4B400`, with 0.7 mm line above.
   - Ownership line 5 mm high, text 2.5 mm: use approved Dynamic Engineers ownership/legal wording only. Until approved, use `[DYNAMIC ENGINEERS OWNERSHIP / CONFIDENTIALITY WORDING]`. Right-aligned document-format identifier: `[DYNAMIC ENGINEERS FORMAT NO.] · [REV]`.
   - Row 10 mm: CLIENT 60 | PROJECT / STRUCTURE 60 | CLIENT DESIGN DRG REF. 60.
   - Row 10 mm: SCALE @ A3 19 | PRINT AT 16 (pale gold) | DOCUMENT TYPE 27 | MATERIAL 48 | FINISH 49 | WT / SET 21.
   - Approvals: 4 rows × 6 mm. Columns: label 20 mm | DRAWN 53.3 | CHECKED 53.3 | APPROVED 53.3. Rows: header (light blue) / NAME / SIGN / DATE. 0.7 mm line below.
   - Identification zone at bottom:
     - LEGAL OWNER area 26 mm high. Use the approved Dynamic Engineers logo, preserving its supplied design and proportions. If unavailable, show a labelled `[DYNAMIC ENGINEERS LOGO REQUIRED]` box; never invent or imitate a logo.
     - Beside logo, use only confirmed legal name, Hindi name (if approved), address, CIN (if applicable), phone, email and website. Until supplied, use clearly labelled placeholders such as `[LEGAL COMPANY NAME]`, `[REGISTERED ADDRESS]`, `[PHONE]`, `[EMAIL]`, `[WEBSITE]`, `[CIN IF APPLICABLE]`.
     - Company name line 4.5 mm bold; approved Hindi line 4 mm; gold rule 53 mm; corporate details 2.5 mm.
     - TITLE row 12 mm: drawing title, 5 mm bold capitals.
     - Final row 13 mm: IDENTIFICATION NO. (DRAWING NO.) 113 mm (pale gold, 5 mm monospaced navy) | REV 15 mm | DATE OF ISSUE 30 mm | SHEET 22 mm (e.g. `1 / 1`).
   - Field labels: 2.5 mm grey `#4A5562`, placed top-left of each cell.

Do not invent or reuse old IECPL drawing numbers or format identifiers. Use the client/approved Dynamic Engineers number supplied by the user. If none is supplied, show `[DRAWING NUMBER TO BE CONFIRMED]`. The proposed scheme `IEC/SD/[PRJ]/NNNN` is obsolete for this skill and must not appear.

## 4. Default general notes

Include these ten notes on every drawing, editing bracketed job-specific fields only when confirmed. Preserve notes 9 and 10 in every revision.

1. All dimensions are in millimetres. Do not scale this drawing; work to stated dimensions only.
2. Material: IS 2062 E250 BR unless stated otherwise in the Bill of Material. If the source specifies another material, the source governs and the note/BOM must be reconciled.
3. Bolt holes: hole dia = bolt dia + 1.5 mm (M16 → 17.5, M20 → 21.5). Holes punched or drilled; all burrs removed. Apply only where consistent with the source/client specification.
4. Bolts and nuts: hot-dip galvanized, grade and standard as per client specification `[BOLT SPEC]`.
5. Finish: hot-dip galvanizing as per IS 4759 / IS 2629; minimum coating `[___ g/m²]` as per client specification.
6. Unspecified fabrication tolerances as per IS 7215.
7. Welding, where shown: as per IS 816; complete before galvanizing; vent/drain holes where required.
8. Piece mark and Dynamic Engineers identification to be hard-stamped before galvanizing, characters min. 10 mm high. Confirm marking requirements against client specification before applying.
9. Prepared from the client design drawing referenced in the title block. In case of conflict the client drawing governs; refer to Dynamic Engineers Planning before fabrication.
10. Drawing prepared on A3 landscape; stated scale applies at A3 only. Printed on A1 the drawing is 2× and on A4 it is 0.71×; measure with the graphic scale bar or use written dimensions.

If a default note conflicts with the source/client specification or is not applicable, do not silently impose it. Mark it “as per client specification” or raise an open point for approval, while retaining the note number and intent.

## 5. Drawing-area rules

### Orthographic views and dimensions

- Use first-angle projection by default (BIS SP 46, India). Use third-angle only when the client explicitly requires it.
- Arrange front view with side, top and section views as needed in correct first-angle positions.
- Give each view a title underneath, e.g. **FRONT VIEW**, underlined, 3.5 mm bold, with `SCALE 1:n` below.
- Piece marks go in circular balloons with the mark inside, bold.
- Plate thickness notation: `PL 8 THK` (replace 8 only with confirmed thickness).
- Chain dimensions inside; overall dimensions outside.
- Closed filled arrowheads. Dimension text 3.0–3.5 mm; use Arial or ISOCPEUR.
- Hole callout format: `n HOLES Ø17.5`, with n and diameter taken from the source.
- Use appropriate visible, hidden, centre and dimension lines; do not omit features needed to understand manufacture.
- Do not add dimensions that cannot be read from or derived unambiguously from the source. Label genuinely derived/reference values as such and explain derivation.

### Mandatory 3D isometric view

Every sheet must contain a 3D isometric view of the same part or assembly, generated from the same geometry as the orthographic views—not an independently invented sketch.

- Typical placement: lower-right of drawing area, clear of orthographic views and dimensions; typical box about 80 × 65 mm at A3. It may move to upper-right if that space is clearer.
- Use true isometric axes per ISO 5456-3: X at +30°, Y vertical, Z at 150° as specified by this project standard.
- Show real thickness by offsetting the back face and joining visible corner edges.
- Show holes as isometric ellipses; show piece-mark balloons with leaders.
- Assemblies: show members in assembled positions and balloon each mark.
- Face shading: front faces light grey `#F4F6F9`; receding faces `#E3E8EE`; all visible edges black. Omit hidden lines in the isometric view.
- No dimensions in the 3D view.
- Caption: **ISOMETRIC VIEW** (3.5 mm bold, underlined), then `Not to scale · for reference only · dimensions govern` (2.5 mm).
- DXF: 2D isometric linework on layer `ISO3D` (or a 3D solid viewed in an SE-isometric paper-space viewport if the model is genuinely built in 3D).
- Verify isometric shape, orientation/hand, thickness, hole count and hole positions against the orthographic views and source.

### Graphic scale bar

Place at bottom-left of drawing area. Use alternating black/white 100 mm real-length segments drawn at the stated A3 scale. Label `GRAPHIC SCALE 1:n (mm)` and `0 / 100 / 200 / 300`. Confirm that its plotted length matches the stated scale. Do not draw a misleading scale bar if the drawing is not to scale; raise the issue and label scale appropriately.

## 6. Colours, fonts and line weights

- Navy `#153A5B`: company name, section headings, drawing number and status text.
- Gold `#F4B400`: title-block band, company-name rule, heading underlines and status-stamp fill.
- Pale gold `#FFF6D6`: drawing-number cell, PRINT AT cell and BOM total row.
- Light blue `#EDF2F7`: table header rows.
- Remaining geometry: black linework for legibility in monochrome copies.
- PDF/on-screen fonts: IBM Plex Sans; IBM Plex Mono for numbers and drawing numbers; Noto Sans Devanagari for approved Hindi text.
- AutoCAD fonts: Arial or ISOCPEUR; Nirmala UI or Mangal for Hindi.
- Line weights:
  - 0.7 mm: frame and title-block outline.
  - 0.35 mm: internal title-block lines.
  - 0.5 mm: visible part edges and isometric outline.
  - 0.25 mm: dimensions, centre lines (chain, long-dash dot), hidden lines (dashed) and isometric hole edges.
- Minimum text height 2.5 mm. Check plotted output, not just model-space text height.

## 7. Logo and corporate identity

- Use only the current approved Dynamic Engineers logo supplied by the user or available in the authorized project assets.
- Preserve its original design, colour, layout, tagline, clear space and aspect ratio. Never redraw, recolour, crop, restyle, rearrange or retype it.
- Quality enhancement may improve resolution without changing design, but only when needed and only after comparing before/after close-ups.
- Do not use the former IECPL logo or any old IECPL company details.
- If the Dynamic Engineers logo is not available, ask the user to attach it and leave a labelled placeholder. Do not create a lookalike.
- PDF/HTML: embed the approved logo asset. DXF: insert the approved PNG as an IMAGE entity and keep the image file beside the DXF.

## 8. Information to collect

Ask only for information missing and necessary to proceed. Prefer one concise clarification at a time. Collect, as applicable:

- Client and project/structure.
- Client/source design drawing number and revision; source file or legible scan.
- Part title and piece mark(s).
- Section/plate size, thickness, material and finish.
- All dimensions, tolerances, holes, radii, threads, bends and orientation details.
- Quantity and any source-specified unit weights.
- Scale at A3, document type, drawing status, revision and issue date.
- Approved Dynamic Engineers drawing number and company details/logo when title block is to be completed.
- Any client-specific projection, fabrication, welding, bolt, galvanizing or marking requirements.

Never invent dimensions, tolerances, weights, client details, dates, approvals, signatures, drawing numbers or revision history. Use visible bracketed placeholders and list them in the delivery note.

### Drawing-number control

Use the drawing number supplied by the client or confirmed by Dynamic Engineers. Do not create a permanent numbering scheme without explicit approval from the responsible Dynamic Engineers authority. If absent, use `[DRAWING NUMBER TO BE CONFIRMED]`.

## 9. Production workflow and deliverables

1. Inspect the original source drawing. Identify all views, dimensions, notes, tolerances, material, quantities, marks, orientation and ambiguous details. If the file is illegible, report precisely which values/features cannot be confirmed.
2. Build the orthographic geometry from the source.
3. Generate the mandatory isometric view from the same geometry.
4. Populate the A3 title block, BOM, revision table, notes, projection symbol, status and graphic scale.
5. Check sheet layout and plotted legibility.
6. Export both deliverables:
   - **DXF:** AutoCAD-compatible, R2010, units mm, A3 paper space. Layers: `FRAME` (0.7), `TITLE` (0.35), `PART` (0.5), `DIM` (0.25), `CENTER` (0.25, CENTER linetype), `HIDDEN` (0.25, HIDDEN), `ISO3D` (0.5), `TEXT`, `HATCH`. Build reusable title block as a block with attributes for fields where practical.
   - **PDF:** exact 420 × 297 mm A3 landscape page, matching the DXF geometry and title block. Embed required fonts, including Noto Sans Devanagari when Hindi is used.
7. Calculate steel weights from geometry using density 7850 kg/m³ only when every required dimension and material are known. Otherwise leave weight blank or `[TO BE CONFIRMED]`; never estimate.
8. Open/render the PDF and inspect it visually. Do not claim this was done unless the file was actually rendered and reviewed.
9. Run the two independent source checks in section 10.
10. Deliver only after the required checks pass. If the environment cannot create DXF/PDF or perform a required independent check, say so plainly and provide the best available draft clearly marked **NOT RELEASED / NOT VERIFIED**.

## 10. Mandatory two-stage independent verification

Every drawing and every revision must be checked **twice against the original source drawing**, not against an intermediate redraw or a prior Dynamic Engineers copy. A drafter's own self-check does not count as either independent check.

### Check 1 — independent full check

A checker who did not draft the drawing compares the new drawing with the original, view by view, and confirms:

- **Dimensions and tolerances:** every dimension, tolerance, hole size, radius, thread, material, quantity and note on the original appears with the same value. Nothing is invented unless clearly labelled as reference or derived.
- **Geometry measurement:** drawn geometry measures true to its dimension values at the stated A3 scale. Measure key lengths, hole positions and radii on the render or DXF, not just the dimension text.
- **Mirror/orientation:** no view is flipped or rotated such that taper, chamfer, offset hole, bend, hook, thread end, groove, stamp position or dimension chain ends up on the wrong side. A flip is acceptable only if the part is symmetric about that axis.
- **Projection:** side, edge and section views agree with the main view in first-angle projection (unless client requires third-angle).
- **Isometric:** matches orthographic views for shape, hole count/positions, thickness and hand/orientation.
- **Title block/BOM:** client drawing number and revision, mark, material, quantity and weights are correct.
- **Source legibility:** every value is read at least twice from zoomed crops of the original. Anything illegible is recorded as illegible, never guessed.

### Fix and Check 2 — second independent full re-check

- Fix every confirmed finding. Where drafter and checker disagree, re-read the original source; do not resolve by assumption.
- A second independent checker (not the drafter and not the first checker) performs a complete re-check against the original, covering the same scope and confirming all Check 1 corrections.
- If Check 2 finds anything, fix it and re-check the affected sheets until a clean pass is obtained.
- Record both checks in a check log stored with the drawing files: date, checker identity/role, source file and revision, sheet/revision checked, findings, fixes and pass result.
- Never fabricate checker names, signatures, dates, check results or independence. If two genuinely independent checks cannot be arranged, mark the drawing **NOT RELEASED — INDEPENDENT CHECKS PENDING** and tell the user.
- If any source item cannot be confirmed, list it as an open point. Do not hide it.

## 11. Sheet-level pre-release checklist

Before release, confirm all of the following:

- [ ] A3 landscape page is exactly 420 × 297 mm.
- [ ] Frame coordinates and 180 mm right panel are correct.
- [ ] Centring marks and all grid zones/labels are present.
- [ ] Dynamic Engineers branding is used; no IECPL identity remains.
- [ ] Approved logo is present and unchanged, or a clearly labelled placeholder is shown.
- [ ] Dynamic Engineers contact/legal details are confirmed or visibly marked as placeholders.
- [ ] Title block is at bottom-right and drawing identification zone is bottom-most.
- [ ] BOM and revision table follow specified columns/order.
- [ ] Correct projection symbol and status stamp are present.
- [ ] Orthographic views and dimensions agree with the source.
- [ ] Mandatory 3D isometric view matches the same geometry.
- [ ] Hindi text, if included, renders correctly.
- [ ] General notes 9 and 10 are present.
- [ ] Graphic scale bar matches the stated A3 scale.
- [ ] No text is below 2.5 mm.
- [ ] PDF has been rendered and visually inspected.
- [ ] DXF and PDF correspond to the same revision and geometry.
- [ ] Check 1 and Check 2 logs both show clean independent passes.
- [ ] All unresolved items are listed; no unsupported claim of approval or fabrication release.

## 12. Delivery format

When checks are complete, provide:
1. DXF file.
2. Print-ready A3 PDF.
3. Source-check log showing Check 1 and Check 2.
4. A concise note stating what data was populated and what remains a placeholder/open point.
5. A short summary of findings and corrections from each check.

If checks are incomplete, provide any draft only if useful, label it prominently **PRELIMINARY — NOT RELEASED / NOT VERIFIED**, and state exactly which checks or inputs remain outstanding.

## 13. Examples of appropriate behavior

- User: “Make a fan bracket drawing from this client PDF.”  
  Action: inspect the PDF, extract only readable source data, ask for missing critical dimensions if needed, prepare the A3 sheet and matching isometric, then arrange two independent checks.

- User: “Make the same drawing in A4.”  
  Action: do not redraw an A4 frame. Keep the A3 master and explain that A4 is a 0.707× print of the complete sheet using Fit to paper.

- User: “Estimate the missing plate thickness.”  
  Action: do not estimate. Mark it `[THICKNESS TO BE CONFIRMED]` and request the source/client value.

- User: “Release it for fabrication now.”  
  Action: do not change status to FOR FABRICATION unless the required client approval/status and both independent checks are evidenced. Otherwise mark it NOT RELEASED and identify the missing approvals/checks.

- User: “Use our old IECPL title block.”  
  Action: do not use it. This standard is for Dynamic Engineers. Ask for the approved Dynamic Engineers logo and corporate details, or use placeholders.
