# DYNAMIC CAD: Status Report (Milestone 1, v0.1.0)

## Environment used

* Linux cloud container (Ubuntu 24.04), GCC 13.3, CMake 3.28, Ninja, Qt 6.4.2 (Ubuntu packages).
* **No Windows machine was available.** The code is portable C++17/Qt 6 and a GitHub Actions job compiles and tests
  it with MSVC + Qt 6.5.3 on Windows Server 2022.
* **Windows CI result (run #1): build, all 8 test programs and windeployqt packaging passed** on
  `windows-2022` with MSVC and Qt 6.5.3. The Linux ASan/UBSan job also passed.
  Hands-on testing on a Windows 10/11 desktop (real mouse, display scaling, an ordinary office PC) is still outstanding.

## Completed and tested

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
* All other drawing/editing commands, text, dimensions, blocks, hatch, sheets, PDF, DXF, licensing, installer.
* Autosave / crash recovery; recent-files list; application `.ico` resource (the window icon is set at runtime).

## Known limitations

* Grid snap follows the visible (adaptive) grid spacing; a fixed snap spacing setting will come with drafting settings.
* Right-click always acts as Enter (no context menu yet).
