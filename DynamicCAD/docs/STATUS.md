# DYNAMIC CAD: Status Report (v0.2.0)

## Environment used

* Linux cloud container (Ubuntu 24.04), GCC 13.3, CMake 3.28, Ninja, Qt 6.4.2 (Ubuntu packages).
* DXF test fixtures generated with ezdxf 1.4.5 (MIT licence; test tool only, not shipped).
* **No Windows machine was available.** The code is portable C++17/Qt 6 and a GitHub Actions job compiles and tests
  it with MSVC + Qt 6.5.3 on Windows Server 2022.
* **Windows CI result (run #1): build, all 8 test programs and windeployqt packaging passed** on
  `windows-2022` with MSVC and Qt 6.5.3. The Linux ASan/UBSan job also passed.
  Hands-on testing on a Windows 10/11 desktop (real mouse, display scaling, an ordinary office PC) is still outstanding.

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
