# DYNAMIC CAD native drawing format (`.dyn`), version 1

UTF-8 JSON. Readers must reject files whose `format` is not `DynamicCAD-Drawing` or whose `formatVersion`
is newer than they support. Unknown or invalid entities are skipped with a warning (never silently).

```json
{
  "format": "DynamicCAD-Drawing",
  "formatVersion": 1,
  "application": "DYNAMIC CAD 0.1.0",
  "units": "mm",
  "entities": [
    { "type": "LINE",     "layer": "0", "start": [0, 0], "end": [100, 0] },
    { "type": "CIRCLE",   "layer": "0", "center": [50, 50], "radius": 25 },
    { "type": "POLYLINE", "layer": "0", "closed": true,
      "vertices": [[0, 0], [200, 0], [200, 150], [0, 150]] }
  ]
}
```

* Coordinates are world units (`units`, default `mm`), Y axis up, IEEE-754 doubles written with shortest
  round-trip precision. Reading a file and writing it again produces identical bytes.
* `entities` order is the draw order (later entities are drawn on top).
* `layer` defaults to `"0"`.
* A circle radius must be > 0. A polyline needs at least 2 vertices. All numbers must be finite.
* Saves are atomic: the file is written to a temporary file and renamed, so a crash cannot corrupt an
  existing drawing.
