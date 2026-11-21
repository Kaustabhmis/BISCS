# DYNAMIC CAD: Status Report (v0.9.0)

**Summary.** Milestones 1–11 are done and tested; M12 (DWG evaluation) and M13 (licensing design) are written up;
M14 delivered autosave, crash recovery, recent files and the Windows installer. 17 automated test programs pass on
Linux (normal and AddressSanitizer/UBSan builds) and on Windows (GitHub Actions, MSVC).

What is **not** done yet is listed at the end of every section and in "Before a commercial release" below.

## Milestone 14: release candidate items (partly done)

| Feature | Verified by |
|---|---|
| Autosave every 5 minutes (`SAVETIME n`, 0 = off) into the per-user data folder; skipped while a command is running; never overwrites the user's drawing | `test_recovery` |
| Crash recovery: each session holds a lock; autosaves of sessions that ended abnormally (including killed processes with stale locks) are offered at the next start: Recover / keep for later / Discard. A recovered drawing stays "modified" until saved; DXF sources are never overwritten | `test_recovery` (orphan detection, stale lock, full recover → save cycle) |
| File → Open Recent (10 files, Clear List) | `test_recovery::recentFiles` |
| Windows installer (NSIS): Program Files, Start menu, optional desktop shortcut, `.dyn` association, uninstaller, installs the Visual C++ runtime if missing | Windows CI artifact |

**Not yet:** code signing (needs a paid certificate: approval required), update check, printed user guide,
acceptance testing on Dynamic Engineers office PCs.

## Milestone 13: licensing (design only)

No licence enforcement in this build (stated in Help → About). Public-key design, no secrets in the client:
see [LICENSING.md](LICENSING.md). Implementation waits for pricing/edition decisions and a licence server.

## Milestone 12: DWG evaluation (done as a decision document)

DWG is **not** supported; DXF is the exchange format in both directions. Options (ODA membership, LibreDWG/GPL
rejected, RealDWG, own reader) are compared in [DWG_EVALUATION.md](DWG_EVALUATION.md).

## Milestone 11: DXF export (done)

| Feature | Verified by |
|---|---|
| Own DXF writer, AutoCAD 2000 (AC1015) ASCII: HEADER, CLASSES, TABLES (VPORT, LTYPE, LAYER, STYLE, VIEW, UCS, APPID, DIMSTYLE, BLOCK_RECORD), BLOCKS, ENTITIES, OBJECTS (layouts, groups, multiline style, plot-style dictionaries) | `test_dxf_export::structureAndHandles` (sections, unique handles, every owner/pointer resolves, $HANDSEED) |
| LINE, CIRCLE, ARC, POINT, LWPOLYLINE (bulges, width), ELLIPSE, SPLINE (NURBS), XLINE, RAY, TEXT, MTEXT, DIMENSION (all five kinds, with graphics block), LEADER, INSERT (nested blocks), HATCH (pattern lines, islands, bulged boundaries) | `test_dxf_export::roundTripThroughReader` (exact coordinates after export → import) |
| Layers (colour, true colour, off, frozen, locked, no-plot, linetype, lineweight), linetypes, entity colour/linetype/lineweight/ltscale, units, LTSCALE | same |
| Text in the declared code page (Latin-1 symbols as bytes, others as `\U+XXXX`) | same |
| External check: exported files audited with ezdxf 1.4.5 (MIT; development only, not shipped): **0 errors, 0 fixes**; rendered by ezdxf's independent renderer and compared visually | `tests/tools/audit_dxf_with_ezdxf.py` |
| File → Export DXF, `DXFOUT` | |

**Not yet:** opening the exported files in AutoCAD itself (not available here; please test), DXF R12 output for very
old software, per-dimension style overrides (all dimensions use the first dimension's style in the DIMSTYLE table),
leader text is exported as a separate MTEXT.

## Milestones 9–10: drawing sheets, PDF and printing (done)

| Feature | Verified by |
|---|---|
| `SHEET`: Dynamic Engineers A3 landscape master sheet per `docs/standards/dynamic-engineers-drawing-standard.md` (frame 20/10 mm margins, centring marks, zones 1–8/A–F, 180 mm information panel with 10 general notes, BOM, revision table, first-angle symbol, status stamp, title block with approvals/identification row, graphic scale bar), or ISO A4–A0 portrait/landscape sheets with a compact title block | `test_sheets_plot::dynamicEngineersSheetGeometry`, `isoSheetsAllSizes`, review image `docs/screenshots/m9-sheet-de-a3.png` |
| Sheets at any drawing scale 1:n (the sheet is n× paper size in model space, so it plots exactly at 1:n); fixed graphics as one block, editable fields as text; company details are bracketed placeholders | `sheetCommandOneUndoAndSaveRoundTrip` |
| `PLOT` dialog (Ctrl+P): paper A4–A0, orientation, area (Sheet / Extents / Display), scale Fit or 1:n, monochrome, lineweights; Export PDF, Print, Preview | |
| Vector PDF at the exact paper size (A3 = 1190.55 × 841.89 pt), text as real fonts | `pdfExportPageSize` |
| Plot scale accuracy: 100 units at 1:5 measured 20.0 mm (±0.1 mm at 254 dpi); 1.00 mm lineweight measured 1.0 mm; colour 7 plots black | `plotScaleAccuracyRaster`, `plotLineweightWidth` |

**Open points from the standard (shown when SHEET runs):** general notes use 2.5 mm text instead of 3.0 mm so all ten
fit; first-angle symbol orientation must be checked against ISO 5456-2; logo, legal name, address, format number and
ownership wording are placeholders until approved.
**Not yet:** paper-space layouts/viewports, SVG export, plot style tables, editing title-block fields in a form.

## Milestone 8: blocks and hatching (done)

BLOCK / INSERT / EXPLODE / PURGE, nested blocks, layer-0 and ByBlock inheritance, HATCH (SOLID, ANSI31, ANSI32,
ANSI37, NET, LINE, DASH; pick point with automatic islands or select objects), DXF HATCH import, `.dyn` v7.
Verified by `test_blocks_hatch`. **Not yet:** block attributes, gradient fills, associative hatches, dynamic blocks.
DXF import still expands block references into separate objects.

## Milestone 7: annotation (done)

TEXT/DTEXT, MTEXT, DIMLINEAR, DIMALIGNED, DIMANGULAR, DIMRADIUS, DIMDIAMETER, LEADER, DIST, AREA, ID; dimensions
update with STRETCH and grips; DXF import of TEXT, MTEXT, DIMENSION, LEADER; `.dyn` v6. Verified by
`test_annotation`, `test_gui`. **Not yet:** dimension style manager, ordinate/arc-length dimensions, tolerances,
multileaders, rich MTEXT formatting (formatting codes are stripped on import).

## Before a commercial release

1. Open DXF exports in AutoCAD and other CAD programs used by customers; fix anything reported.
2. Acceptance testing on Dynamic Engineers office PCs (Windows 10 and 11) with real drawings.
3. Approve company details for the title block; verify the projection symbol.
4. Decide licensing model; implement per LICENSING.md.
5. Code-signing certificate (paid) so Windows SmartScreen does not warn.
6. Decide on DWG (DWG_EVALUATION.md).


## Milestone 6: layers and properties (done)

| Feature | Verified by |
|---|---|
| Layer table: create, rename (objects follow, one undo), delete (only empty, not 0/current), current layer, on/off, freeze, lock, colour, linetype, lineweight | `test_layers`, `test_gui::layersColoursAndProperties` |
| Hidden (off/frozen) layers: not drawn, not selectable, no snaps, not cut by TRIM; locked layers: drawn faded, not selectable, still snap | `test_layers::visibilityAffectsPickSnapSelect`, pixel check |
| Per-object colour (ByLayer, 255 colour indices, true RGB), linetype, lineweight, linetype scale; new objects go on the current layer | `test_layers::resolveAndCurrentLayer` |
| Linetypes: Continuous, DASHED, HIDDEN, CENTER, DASHDOT, PHANTOM, DOT, BORDER, DIVIDE (own mm definitions) + any defined in DXF; dashes in drawing units, stable while panning; global LTSCALE | pixel check of dash gaps |
| Lineweights: 24 standard values; LWT toggle shows them on screen | screenshot |
| Layer manager panel (dock, tabbed with Properties) | `test_gui` |
| Home ribbon "Layers & Properties": current-layer drop-down (moves selected objects), colour/linetype/lineweight drop-downs, MATCHPROP | `test_gui` |
| Editable Properties panel: layer/colour/linetype/lineweight/linetype scale for any selection; coordinates, radius, angles, length, width, vertices for one object | `test_gui` (`editGeometry`) |
| MATCHPROP (MA), LAYER (LA), LTSCALE, LWDISPLAY | `test_layers` |
| `.dyn` v5 stores layers, linetypes, current layer, LTSCALE and per-object properties (bit-exact round trip) | `test_layers::stylesSurviveSaveAndTransform` |
| DXF: LAYER table (colour, true colour, off, frozen, locked, linetype, lineweight), LTYPE table, entity colour/true colour/linetype/lineweight/ltscale, ByBlock inside blocks, $LTSCALE, $CLAYER | `test_layers::dxfLayersColorsLinetypes` |

**Found and fixed during this milestone:** a potential crash (panels rebuilding the widget whose signal was still
running; refreshes are now queued); axis lines drawn over red centre lines hid their dashes (axes dimmed).

**Not yet:** plot styles, transparency, complex linetypes with text/shapes, layer filters/states, a "current colour"
for new objects (new objects are ByLayer), editing every spline/ellipse property in the panel.

**Performance note:** drawing 100,000 objects with per-object style resolution: about 83 ms on the test VM
(was 58 ms without styles).

## Milestone 5: editing (done)

| Command | Options / behaviour | Verified by (`test_modify`, 16 cases) |
|---|---|---|
| MOVE, COPY | pre- or post-selection; `@dx,dy` = displacement from the base point; COPY repeats until Enter | ids and draw order kept; one undo step |
| ROTATE | angle typed or picked; Copy | exact 90° |
| SCALE | factor typed or picked; Reference (old → new length); Copy | |
| MIRROR | any mirror line; erase source Y/N | arcs stay counter-clockwise |
| ARRAY | Rectangular (rows, columns, spacings); Polar (items, fill angle, rotate Y/N) | positions exact |
| OFFSET | distance or Through; lines, circles, arcs, xlines, polylines incl. arc segments and closed shapes | rounded-rectangle offset area exact |
| TRIM | quick mode (every object cuts); lines, arcs, circles → arcs, polylines (width kept); no edge → erase | |
| EXTEND | to the nearest boundary; lines, arcs, open polylines | |
| FILLET / CHAMFER | two lines (radius/distances, 0 = sharp corner), Polyline option (all corners) | tangent points and centre exact |
| BREAK | two points, or `@` to split; circles become arcs | |
| STRETCH | crossing window; vertices inside move, objects fully inside move | |
| JOIN | lines/arcs/open polylines touching end to end, any order/direction; collinear lines → one line | |
| EXPLODE | polylines → lines and arcs | |
| Grips | click a grip of a selected object: endpoints, vertices, radius, arc shape, ellipse axes, spline control points; Shift+click still deselects | `test_gui::gripDragAndClipboard` |
| Clipboard | Ctrl+C / Ctrl+X / Ctrl+V (also between two DYNAMIC CAD windows); paste with insertion point | |
| UI | Modify ribbon tab and menu; every button starts a real command | `test_gui` |

**Found and fixed during this milestone:** Shift+click on a grip started grip editing instead of deselecting.

**Not yet:** TRIM/EXTEND/BREAK of ellipses and splines, fence/crossing trim, associative arrays, LENGTHEN,
multiple hot grips.

## Milestone 4: remaining drawing commands (done)

| Command | Options | Verified by |
|---|---|---|
| XLINE / RAY | through points (repeat), Hor, Ver, Ang; infinite lines are pickable anywhere, never window-selected, ignored by zoom extents | `test_commands`, `test_selection::infiniteLines` |
| DONUT | inside/outside diameter (disc when inside = 0), repeated centres | ring hit-testing, outer radius exact |
| REVCLOUD | rectangular cloud, Arc length | scallop count and outward bulge |
| ELLIPSE Arc | start/end angle by point or degrees from the major axis | end points exact |
| PLINE Width | constant width, drawn at true scale | `test_commands` |
| DXF | XLINE, RAY, LWPOLYLINE/POLYLINE constant width; tapered widths reported | `test_dxf::xlinesAndPolylineWidths` |

**Bug found and fixed:** construction lines could not be clicked or snapped far from their base point (bounding-box
pre-filter); now handled for infinite entities.

## Milestone 3b: snaps and drafting aids (done)

| Feature | Verified by |
|---|---|
| Object snaps: Endpoint, Midpoint, Center (offered when hovering the curve), Quadrant, Intersection (exact for lines/arcs/circles/polylines; ellipses and splines to 1e-7 of size), Perpendicular, Tangent, Nearest, Node | `test_snapping` (11 cases) |
| Priorities: precise snaps beat Nearest; Intersection beats a nearby Midpoint | `test_snapping` |
| Snap markers (distinct shapes) + label; OSNAP F3 with a mode menu (saved) | `test_gui::objectSnapWithMouse`, screenshot |
| One-shot overrides typed at point prompts: END MID CEN QUA INT PER TAN NEA NOD | `test_snapping`, `test_gui` (PER via mouse) |
| Polar tracking F10 with increments 5–90° (POLARANG), dotted tracking ray, exact axis directions; exclusive with ORTHO; direct distance follows the tracked angle | `test_snapping` |
| Dynamic input F12: X/Y or Length/Angle tooltip at the cursor, echoes typed input | screenshot |
| Performance: object snap 1.0 ms per mouse move on 100,000 entities (all modes) | `test_performance` |


## Environment used

* Linux cloud container (Ubuntu 24.04), GCC 13.3, CMake 3.28, Ninja, Qt 6.4.2 (Ubuntu packages).
* DXF test fixtures generated with ezdxf 1.4.5 (MIT licence; test tool only, not shipped).
* **No Windows machine was available.** The code is portable C++17/Qt 6 and a GitHub Actions job compiles and tests
  it with MSVC + Qt 6.5.3 on Windows Server 2022.
* **Windows CI result (run #1): build, all 8 test programs and windeployqt packaging passed** on
  `windows-2022` with MSVC and Qt 6.5.3. The Linux ASan/UBSan job also passed.
  Hands-on testing on a Windows 10/11 desktop (real mouse, display scaling, an ordinary office PC) is still outstanding.

## Milestone 3: 2D drawing tools (done)

| Tool | Options | Verified by |
|---|---|---|
| PLINE | line/arc segments (arcs tangent to the previous segment), Close, Undo, Esc keeps the drawn part | `test_commands::plineWithArcs` (area incl. arc = 100 + 12.5π) |
| ARC | 3 points (either direction), Center-start-end, included angle (±) | `test_commands::arcVariants` |
| ELLIPSE | axis end points, Center; longer "other axis" becomes the major axis | `test_commands::ellipseVariants`, `test_geometry::ellipseGeometry` (perimeter vs Ramanujan) |
| SPLINE | through fit points (global cubic interpolation), control vertices, Close | passes through every fit point to < 1e-6 |
| RECTANGLE | Fillet (rounded), Chamfer, Dimensions + side; too-large fillet falls back to sharp with a message | exact areas |
| SQUARE | click or typed side; direction from cursor | |
| POLYGON | 3–1024 sides, Inscribed/Circumscribed, Edge; typed radius gives a horizontal bottom edge | hexagon area 150√3 |
| POINT, ARROW | arrow: filled head (3:1), Size, Double, one undo step | arrow tip exactly at the clicked point (`test_gui`) |
| New geometry | Ellipse/elliptical arc (exact under any affine transform), NURBS (rational, exact circles), filled polylines | `test_geometry` (21 cases) |
| DXF | ELLIPSE (incl. mirrored extrusion), SPLINE (rational, control or fit points), SOLID/TRACE (filled), circles in stretched blocks → exact ellipses | `test_dxf::curvesEllipsesSplinesSolids` |
| Transparent commands | ZOOM, GRID, SNAP, ORTHO, HELP work mid-command (`'ZOOM` too) without capturing options like `C`/`U` | `test_commands::transparentActions` |
| Ribbon | Draw (6) + Shapes (5) groups; every button starts a real command | `test_gui::ribbonDrawToolsWithMouse` |

**Found and fixed during this milestone:** spline hit-testing was only accurate to ~2e-4 (now refined on the exact
curve, needed for object snaps); `ZOOM` was rejected while a command waited for input.

**Not in this milestone:** elliptical-arc option of ELLIPSE (imported ones work), XLINE/RAY, DONUT, REVCLOUD,
MLINE, polyline widths, hatch patterns (arrowheads use solid fill).

## Milestone 2: DXF import (done)

| Feature | How it was verified |
|---|---|
| Own DXF tokenizer + reader (R12, 2000, 2010, 2018); CRLF, BOM, ANSI/UTF-8 names | `test_dxf`: identical expectations pass on fixtures in all 4 versions |
| LINE, CIRCLE, ARC, POINT, LWPOLYLINE, old POLYLINE/VERTEX/SEQEND, bulges | exact coordinates, polyline area incl. arc segments |
| Blocks: nested INSERT, scale, rotation, MINSERT arrays, mirroring, layer-0 inheritance | expected world coordinates checked to 1e-9 |
| OCS extrusion (0,0,-1) (AutoCAD's mirrored arcs/circles) | mirrored arc 0..90 → 90..180 at (-100,200) |
| Units ($INSUNITS, $MEASUREMENT fallback) with "assumed" warning | R12 (no units) vs 2000+ |
| Honest report: unsupported types counted (TEXT, MTEXT, DIMENSION, HATCH, SPLINE, ELLIPSE, ATTRIB...), paper space, Z-projection, tilted planes, xrefs, missing blocks, off/frozen layers, truncated files | `test_dxf` + GUI dialog/command-line report |
| Robustness: binary DXF and renamed DWG detected; malformed/truncated files rejected without touching the open drawing; ~3,000 corrupted variants never crash (also under AddressSanitizer) | `test_dxf::survivesCorruptedFiles` |
| Imported drawing saves to `.dyn` v2 and reopens bit-exactly; DXF never overwritten | `test_dxf`, `test_gui` |
| Performance: 200,000-line DXF (8 MB) imports in about 0.2 s | `test_dxf::largeFilePerformance` |
| ARC / POINT entities and polyline arc segments: selection, rendering (≤0.25 px deviation), properties | `test_geometry` (17 cases), `test_gui` (click-select an imported arc) |

**DXF limitations (honest list):** text, dimensions, leaders, hatches, splines, ellipses, solids, images and
xrefs are reported but not imported yet; only model space; colours/linetypes/lineweights are not yet displayed
(all geometry draws in one colour); layer on/off is not yet respected. Test files were generated with ezdxf; **no
DXF saved by AutoCAD itself has been tested yet.** Please send a few real drawings.

## Milestone 1: completed and tested

| Feature | How it was verified |
|---|---|
| CMake project, 3 targets (`dyncad_core`, `dyncad_ui`, `DynamicCAD`) | Clean build, zero compiler warnings (`-Wall -Wextra -Wpedantic`) |
| Geometry engine (distances, clipping, circle/rect, 3-point circle, area, ortho, grid snap, grid step) | `test_geometry` (11 cases incl. large-coordinate precision) |
| Document, undo/redo, modified flag, erase restoring draw order | `test_document` (100k-entity erase/undo in 17 ms) |
| Coordinate input: absolute, relative, polar, direct distance, keywords; locale-independent numbers | `test_commands` |
| LINE (Undo, Close, Enter, repeat), CIRCLE (radius, Diameter, 2P, 3P), RECTANGLE, ERASE (pre/post selection), ORTHO | `test_commands` (14 cases) |
| Pick, window and crossing selection | `test_selection` + `test_gui` with real mouse events |
| Zoom at cursor, pan, zoom extents, clamping | `test_view` + `test_gui` (wheel and middle-drag events) |
| Native .dyn save/open: bit-exact round trip, atomic save, corrupt/foreign/newer files rejected, bad entities skipped with warnings | `test_fileio` (+ sample drawing loads) |
| Full GUI: command line typing, typing on canvas, mouse drawing, right-click Enter, grid snap, Delete, Ctrl+Z/Y, Esc, save/reopen, window title | `test_gui` (8 cases, headless) |
| Memory safety | Whole suite passes under AddressSanitizer + UBSan; LeakSanitizer clean for all engine tests |
| Performance | `test_performance` (numbers in ARCHITECTURE.md §6) |

## Bugs found and fixed by the tests during this milestone

1. **Crash on closing a drawing window** (heap corruption): child widgets outlived the document. Fixed in `~MainWindow`.
2. **Wrong relative coordinates after `U` inside LINE**: `@dx,dy` was measured from the undone point. Fixed.

## Not done yet (by design, next milestones)

* Object snaps (endpoint/midpoint/centre/...), polar tracking, dynamic input tooltip.
* Layers UI, colours, linetypes, lineweights (entities already store a layer name, saved in files).
* Properties panel is **read-only** (shows true geometry: lengths, areas, radii).
* All other drawing/editing commands, text, dimensions, blocks (as editable objects), hatch, sheets, PDF, DXF export, DWG, licensing, installer.
* Autosave / crash recovery; recent-files list; application `.ico` resource (the window icon is set at runtime).

## Known limitations

* Grid snap follows the visible (adaptive) grid spacing; a fixed snap spacing setting will come with drafting settings.
* Right-click always acts as Enter (no context menu yet).
