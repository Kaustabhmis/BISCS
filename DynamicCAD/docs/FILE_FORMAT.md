# DYNAMIC CAD native drawing format (`.dyn`), version 2

UTF-8 JSON. Readers must reject files whose `format` is not `DynamicCAD-Drawing` or whose `formatVersion`
is newer than they support. Unknown or invalid entities are skipped with a warning (never silently).

```json
{
  "format": "DynamicCAD-Drawing",
  "formatVersion": 2,
  "application": "DYNAMIC CAD 0.2.0",
  "units": "mm",
  "entities": [
    { "type": "LINE",     "layer": "0", "start": [0, 0], "end": [100, 0] },
    { "type": "CIRCLE",   "layer": "0", "center": [50, 50], "radius": 25 },
    { "type": "ARC",      "layer": "0", "center": [0, 0], "radius": 20, "startAngle": 0, "endAngle": 90 },
    { "type": "POINT",    "layer": "0", "position": [5, 5] },
    { "type": "POLYLINE", "layer": "0", "closed": true,
      "vertices": [[0, 0], [200, 0], [200, 150], [0, 150]],
      "bulges":   [0, 1, 0, 0] }
  ]
}
```

* Coordinates are world units (`units`, default `mm`), Y axis up, IEEE-754 doubles written with shortest
  round-trip precision. Reading a file and writing it again produces identical bytes.
* `entities` order is the draw order (later entities are drawn on top).
* `layer` defaults to `"0"`.
* A circle/arc radius must be > 0. A polyline needs at least 2 vertices. All numbers must be finite.
* ARC angles are degrees, counter-clockwise from `startAngle` to `endAngle` (same convention as DXF).
* POLYLINE `bulges` (optional; omitted when all zero) has one value per vertex: bulge *i* is the segment from
  vertex *i* to *i+1* (the closing segment for the last vertex), `tan(sweep/4)`, positive = counter-clockwise.

## Version history

* **2** (v0.2.0): ARC, POINT, polyline `bulges`. Version 1 files open unchanged; v0.1.0 refuses v2 files with a
  "created by a newer version" message instead of silently losing arcs.
* **1** (v0.1.0): LINE, CIRCLE, POLYLINE.
* Saves are atomic: the file is written to a temporary file and renamed, so a crash cannot corrupt an
  existing drawing.
