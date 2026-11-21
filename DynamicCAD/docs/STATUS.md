# DYNAMIC CAD: Status Report (v0.4.0, in progress)

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
