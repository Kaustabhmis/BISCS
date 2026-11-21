# DYNAMIC CAD native drawing format (`.dyn`), version 5

UTF-8 JSON. Readers must reject files whose `format` is not `DynamicCAD-Drawing` or whose `formatVersion`
is newer than they support. Unknown or invalid entities are skipped with a warning (never silently).

```json
{
  "format": "DynamicCAD-Drawing",
  "formatVersion": 5,
  "application": "DYNAMIC CAD 0.5.0",
  "units": "mm",
  "layers": [
    { "name": "0", "color": "7", "linetype": "Continuous", "lineweight": -3,
      "on": true, "frozen": false, "locked": false, "plot": true },
    { "name": "CENTER", "color": "1", "linetype": "CENTER", "lineweight": 25,
      "on": true, "frozen": false, "locked": false, "plot": true }
  ],
  "currentLayer": "0",
  "ltscale": 1.0,
  "linetypes": [ { "name": "MYDASH", "description": "custom", "pattern": [2, -1, 0, -1] } ],
  "entities": [
    { "type": "LINE",     "layer": "0", "start": [0, 0], "end": [100, 0] },
    { "type": "CIRCLE",   "layer": "0", "center": [50, 50], "radius": 25 },
    { "type": "ARC",      "layer": "0", "center": [0, 0], "radius": 20, "startAngle": 0, "endAngle": 90 },
    { "type": "POINT",    "layer": "0", "position": [5, 5] },
    { "type": "ELLIPSE",  "layer": "0", "center": [0, 0], "majorAxis": [20, 0], "ratio": 0.5,
      "startParam": 0, "endParam": 3.141592653589793 },
    { "type": "SPLINE",   "layer": "0", "degree": 3, "knots": [0, 0, 0, 0, 1, 1, 1, 1],
      "controlPoints": [[0, 0], [10, 20], [30, -20], [40, 0]] },
    { "type": "POLYLINE", "layer": "0", "closed": true,
      "vertices": [[0, 0], [200, 0], [200, 150], [0, 150]],
      "bulges":   [0, 1, 0, 0], "filled": false }
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

* ELLIPSE follows DXF: `majorAxis` is the vector from the centre to the end of the major axis, `ratio` = minor/major
  (0 < ratio ≤ 1), optional `startParam`/`endParam` (radians, counter-clockwise) for elliptical arcs.
* SPLINE is a NURBS curve: `degree`, `knots` (count = control points + degree + 1, non-decreasing),
  `controlPoints`, optional `weights` (> 0) for rational curves.
* POLYLINE `filled: true` (closed polylines only) draws a solid fill.

* Per-entity `color` ("ByLayer", "ByBlock", "1"–"255" or "#RRGGBB"), `linetype` (name, "ByLayer", "ByBlock"),
  `lineweight` (1/100 mm; -1 ByLayer, -2 ByBlock, -3 Default) and `ltscale` are written only when not the default.
* `layers` always contains layer "0". Built-in linetypes are not written; `linetypes` lists only extra ones
  (pattern in drawing units: positive dash, negative gap, 0 dot).
* XLINE / RAY: `base` and unit `direction`. POLYLINE `width`: constant width.

## Version history

* **7** (v0.7.0): `blocks` table (name, description, entities; nested blocks), INSERT (`block`, `position`,
  `scale` [x, y], `rotation`), HATCH (`loops` with `vertices`/`bulges`, `pattern` with `name`, `solid`, `scale`,
  `angle`, `families` of `angle`/`origin`/`offset`/`dashes`).
* **6** (v0.6.0): TEXT / MTEXT (`insert`, `text`, `height`, `rotation`, `justify`, `font`, `wrapWidth`),
  DIMENSION (`kind`, points `a`/`b`/`c`, `location`, `angle`, `textOverride`, `style`), LEADER (`points`, `text`,
  `style`).
* **5** (v0.5.0): layers, linetypes, colours, lineweights, linetype scales.
* **4** (v0.4.0): XLINE, RAY, polyline width.

* **3** (v0.3.0): ELLIPSE, SPLINE, filled polylines.

* **2** (v0.2.0): ARC, POINT, polyline `bulges`. Version 1 files open unchanged; v0.1.0 refuses v2 files with a
  "created by a newer version" message instead of silently losing arcs.
* **1** (v0.1.0): LINE, CIRCLE, POLYLINE.
* Saves are atomic: the file is written to a temporary file and renamed, so a crash cannot corrupt an
  existing drawing.
