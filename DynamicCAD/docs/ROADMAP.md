# DYNAMIC CAD: Development Roadmap

Each milestone ends with: compile (Windows CI + Linux), all tests green (including sanitizer build), a status
report, and preserved working code. A feature counts as done only when it works **and** has tests.

| # | Milestone | Content | State |
|---|---|---|---|
| M1 | Core application | Window, ribbon, menus, canvas (grid, crosshair, zoom, pan, coordinates), command line, status bar, New/Open/Save/Save As (.dyn), undo/redo, shortcuts, LINE, CIRCLE, RECTANGLE, selection (click/window/crossing), ERASE | **Done** (see STATUS.md) |
| M2 | **DXF import** (moved forward at the owner's request) | Own DXF reader R12–2018: LINE, CIRCLE, ARC, LWPOLYLINE/POLYLINE with bulges, POINT, INSERT (nested, scaled, rotated, mirrored, MINSERT), layers, units, OCS; import report; ARC/POINT/bulge entities; .dyn format v2 | **Done** |
| M3 | **2D drawing tools** (owner's request) | PLINE (arcs), ARC, ELLIPSE, SPLINE (fit/CV, NURBS), POLYGON, SQUARE, POINT, ARROW, RECTANGLE Fillet/Chamfer/Dimensions; DXF ELLIPSE/SPLINE/SOLID import; transparent ZOOM/GRID/SNAP/ORTHO; .dyn v3 | **Done** |
| M3b | **Drafting aids** | Object snaps, polar tracking, dynamic input | **Done** |
| M4 | **Remaining drawing commands** | XLINE, RAY, DONUT, REVCLOUD, elliptical arc, polyline width | **Done** |
| M5 | **Editing** | MOVE … EXPLODE, grips, clipboard | **Done** |
| M6 | **Layers & properties** | Layer manager, colours, linetypes, lineweights, MATCHPROP, editable properties, DXF styles | **Done** |
| (old M3b) | Drafting aids | (merged into M3b–M6 above) | Done |
| M7 | **Annotation** | TEXT, MTEXT, linear/aligned/angular/radius/diameter dimensions, leaders, DIST/AREA/ID | **Done** (dimension style manager later) |
| M8 | Blocks & hatch | Block definitions/insertions, HATCH (own pattern definitions); attributes and spatial index later | **Done** (attributes pending) |
| M9 | Engineering sheets | Paper space / layouts, A4–A1 sheets; **Dynamic Engineers A3 master sheet per `docs/standards/dynamic-engineers-drawing-standard.md`** (frame, zones, title block, BOM, revision table, projection symbol, status stamp, scale bar) | **Done** (sheets in model space; layouts/viewports later) |
| M10 | Output | PDF plotting (exact 420 × 297 mm), print preview, printing, SVG export | **Done** except SVG |
| M11 | DXF II | DXF **export** (AutoCAD 2000 format) and import of text, dimensions, hatches, splines, ellipses as those entities are added; extend own reader/writer: geometry, layers, linetypes, text, dimensions, blocks; compatibility warnings; automated round-trip tests; manual verification by opening exports in a licensed AutoCAD / other CAD | **Done** (export AutoCAD 2000; manual AutoCAD check pending) |
| M12 | DWG evaluation | Written comparison (ODA membership cost vs DXF-only vs other lawful options), test against real customer drawings; no compatibility claim until validated | **Done**: DWG_EVALUATION.md (DXF only for now) |
| M13 | Licensing | Local dev mode first: trial, activation key, machine binding, offline grace; server later (no secrets in the client) | Design written (LICENSING.md); implementation awaits decisions |
| M14 | Release candidate | Installer (NSIS), code signing, crash recovery/autosave, update check, user guide, Windows acceptance testing on office PCs | Partly: installer, autosave, crash recovery, recent files done; signing, update check, user guide, acceptance tests open |
