# DYNAMIC CAD: Technical Architecture

## 1. Technology stack (decided)

| Concern | Choice | Why | Licence / obligation |
|---|---|---|---|
| Language | C++17 | Native speed, deterministic memory, industry standard for CAD kernels | n/a |
| GUI | **Qt 6 Widgets** (6.5 LTS for Windows releases) | Mature desktop toolkit, high-DPI, native Windows look, dockable panels, printing/PDF built in | **LGPL v3**: must link dynamically, ship Qt as replaceable DLLs, provide notices and a way to get Qt's source. No Qt source modifications. Commercial Qt is *not* needed. |
| Rendering | QPainter (raster) now; OpenGL renderer later, **only if measurements show a need** | QPainter already draws 100k entities in about 40 ms (see §6). Simpler and works on every office PC and over Remote Desktop. | Part of Qt (LGPL) |
| Geometry | Own 2D engine (`src/geometry`) | Full control of precision; no licence risk | Proprietary (ours) |
| Future 3D | Open CASCADE Technology | Only mature open B-rep kernel | LGPL 2.1 **with OCCT exception**: dynamic linking, notices. Evaluate when 3D starts. |
| DXF | **Own reader/writer** (planned, Phase 5) | DXF is a documented text format. Common free libraries are GPL (libdxfrw, dxflib GPL edition), which would force us to publish our source. | Proprietary (ours) |
| DWG | Separate workstream (Phase 5) | Options: ODA Teigha (paid membership), LibreDWG (**GPL v3, cannot be used**), or DXF-only. | Decision needed before any spend |
| Database | SQLite (when needed: libraries, licence cache) | Embedded, zero admin | Public domain |
| Native format | JSON `.dyn` (`docs/FILE_FORMAT.md`) | Human-readable, diff-able, versioned, exact doubles | Ours |
| Build | CMake 3.21+, Ninja | Works with Visual Studio, VS Code, CI | BSD |
| Tests | Qt Test + CTest | Ships with Qt; GUI tests run headless | LGPL (test-only) |
| Compiler (Windows) | MSVC (Visual Studio 2022 Community / Build Tools) | Best Windows debugging, matches official Qt binaries | Free for individuals and small organisations; larger companies need a VS licence or can use the free Build Tools under its terms. **Check your eligibility.** |
| Installer | **Inno Setup** (planned) | Free, permits commercial use, signs well, simple scripts | Inno Setup licence (free, commercial use allowed) |
| CI | GitHub Actions (Windows MSVC + Linux sanitizer builds) | Real Windows builds without a local Windows PC | n/a |

**Rejected:** GPL libraries (LibreCAD code, libdxfrw, LibreDWG) and static Qt linking (it would breach the LGPL
without a commercial Qt licence). Copying from AutoCAD or using Autodesk SDKs, assets or trademarks is never allowed.

## 2. Layers

```
 app/main.cpp
     |
 ui/  MainWindow, Ribbon, CommandLine, PropertiesPanel, Theme, Icons      (Qt Widgets)
 canvas/CadCanvas  rendering + mouse/keyboard -> selection / command input (Qt Widgets)
 ---------------------------------------------------------------------- dyncad_ui
 commands/   InputParser, CommandProcessor, InteractiveCommand, Draw cmds  (pure C++)
 selection/  SelectionSet, pickEntity, selectInRect                        (pure C++)
 document/   Document, UndoStack, EditCommands                             (pure C++)
 entities/   Entity, LineEntity, CircleEntity, PolylineEntity              (pure C++)
 geometry/   Vec2, BoundingBox, Geometry algorithms                        (pure C++)
 canvas/ViewTransform  world <-> screen math                               (pure C++)
 fileio/     DynFormat                                                     (QtCore JSON)
 ---------------------------------------------------------------------- dyncad_core
```

* **dyncad_core** has no GUI dependency, so the whole engine (geometry, commands, undo, file I/O) is unit-tested
  without a screen, and could later back a command-line batch tool or a plug-in API.
* **Entities never draw themselves.** Rendering lives in the canvas (and later in PDF/print back-ends), so the
  same entity works for screen, PDF and DXF.

## 3. Key design decisions

* **Precision:** all coordinates are `double` in world units (mm by default). Rendering clips segments in world
  space before converting to pixels, so extreme zoom never overflows the raster engine. Typed coordinates are
  applied exactly (never snapped or ortho-constrained). `.dyn` files store doubles with shortest round-trip
  formatting, which is verified bit-exact by tests.
* **Undo/redo:** command pattern (`UndoCommand`). Every edit is an undo step. Erase stores original indices and
  restores draw order with a linear merge (O(n)). The "modified" flag is derived from the undo stack's clean index.
* **Commands:** `InteractiveCommand` is a small state machine fed points, numbers, keywords and Enter. Mouse
  clicks and typed text drive the same object, which is why automated tests can type `L 0,0 100,0 C` and
  check the results.
* **Selection:** pick = nearest curve within the pick-box tolerance, ties go to the top-most entity. Window
  selection needs the entity's bounds fully inside; crossing tests the actual curve (a circle that encloses
  the box is *not* selected; one that touches it is).
* **Change notification:** `Document` listeners (plain `std::function`) keep the core Qt-free; the UI refreshes
  the canvas, properties and title from one callback.
* **Safety:** atomic saves (`QSaveFile`), strict file validation (bad entities are skipped with warnings, bad
  files are rejected without touching the open drawing), a 512 MB file-size guard, and an AddressSanitizer
  CI job.

## 4. Planned extension points

* `EntityType` and `entityToJson/entityFromJson` gain new types (Arc, Ellipse, Spline, Point, Text, Dimension,
  Hatch, BlockReference) without changing existing ones.
* Layers become a `LayerTable` in `Document`. Entities already carry a layer name, and it is saved.
* Object snaps reuse `Entity::gripPoints()` plus new intersection/tangent/perpendicular queries in `geometry/`.
* A spatial index (uniform grid or R-tree) goes behind `pickEntity`/`selectInRect` when drawings exceed ~500k
  entities; measurements are in §6.
* Licensing (`src/licensing`) will be a separate library with a local development mode; no secrets in the client.

## 5. Platform

The release target is Windows 10/11 x64. Development and CI also run on Linux (the same code); the CI workflow
compiles with MSVC on Windows for every push. **Milestone 1 was developed and tested on Linux; the Windows build is
covered by CI but has not yet been run by hand on a Windows desktop.**

## 6. Measured performance (Milestone 1)

Measured by `tests/test_performance` on a 4-core 2.3 GHz Xeon cloud VM (Linux, Release build, offscreen raster):

| Entities | Render (zoom extents) | Render (zoomed in) | One pick | Crossing select | Save | Load |
|---:|---:|---:|---:|---:|---:|---:|
| 10,000 | 6 ms | 1 ms | 0.05 ms | <1 ms | 46 ms | 22 ms |
| 100,000 | 39 ms | 7 ms | 0.8 ms | 1 ms | 483 ms | 242 ms |

These are measurements on one machine, not guarantees; real Windows desktops with on-screen rendering will
differ and should be measured during the Windows acceptance test.
