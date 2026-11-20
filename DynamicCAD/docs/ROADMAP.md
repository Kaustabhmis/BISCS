# DYNAMIC CAD: Development Roadmap

Each milestone ends with: compile (Windows CI + Linux), all tests green (including sanitizer build), a status
report, and preserved working code. A feature counts as done only when it works **and** has tests.

| # | Milestone | Content | State |
|---|---|---|---|
| M1 | Core application | Window, ribbon, menus, canvas (grid, crosshair, zoom, pan, coordinates), command line, status bar, New/Open/Save/Save As (.dyn), undo/redo, shortcuts, LINE, CIRCLE, RECTANGLE, selection (click/window/crossing), ERASE | **Done** (see STATUS.md) |
| M2 | Drawing engine I | Object snaps (endpoint, midpoint, centre, intersection, perpendicular, tangent, nearest) with markers; POLYLINE (incl. arc segments), ARC, POINT; editable Properties panel; grip editing | Next |
| M3 | Editing I | MOVE, COPY, ROTATE, MIRROR, SCALE, OFFSET, ERASE improvements, EXPLODE, JOIN; clipboard copy/paste | |
| M4 | Editing II + geometry | TRIM, EXTEND, FILLET, CHAMFER, STRETCH, ARRAY (rect/polar); ELLIPSE, POLYGON, SPLINE | |
| M5 | Layers & properties | Layer manager panel (on/off, freeze, lock, colour), colours, linetypes (CENTER, HIDDEN...), lineweights, polar tracking, dynamic input tooltip | |
| M6 | Annotation | TEXT, MTEXT, dimension styles, linear/aligned/angular/radius/diameter dimensions, leaders, MEASURE/DIST/AREA | |
| M7 | Blocks & hatch | Block definitions/insertions with attributes, HATCH (ANSI31 etc. own pattern definitions), spatial index | |
| M8 | Engineering sheets | Paper space / layouts, A4–A1 sheets; **Dynamic Engineers A3 master sheet per `docs/standards/dynamic-engineers-drawing-standard.md`** (frame, zones, title block, BOM, revision table, projection symbol, status stamp, scale bar) | |
| M9 | Output | PDF plotting (exact 420 × 297 mm), print preview, printing, SVG export | |
| M10 | DXF | Own DXF R2010 reader/writer: geometry, layers, linetypes, text, dimensions, blocks; compatibility warnings; automated round-trip tests; manual verification by opening exports in a licensed AutoCAD / other CAD | |
| M11 | DWG evaluation | Written comparison (ODA membership cost vs DXF-only vs other lawful options), test against real customer drawings; no compatibility claim until validated | |
| M12 | Licensing | Local dev mode first: trial, activation key, machine binding, offline grace; server later (no secrets in the client) | |
| M13 | Release candidate | Inno Setup installer, code signing, crash recovery/autosave, update check, user guide, Windows acceptance testing on office PCs | |
