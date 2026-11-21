"""Generates the DXF test fixtures used by tests/test_dxf.cpp.

Uses ezdxf (MIT licence) purely as a *test tool* to produce standards-conforming
DXF files in several AutoCAD format versions. ezdxf is not part of DYNAMIC CAD.

    python -m venv venv && venv/bin/pip install ezdxf
    venv/bin/python generate_dxf_fixtures.py

Every value here is mirrored by an expectation in tests/test_dxf.cpp.
"""
import os

import ezdxf
from ezdxf import units

HERE = os.path.dirname(os.path.abspath(__file__))
VERSIONS = {"R12": "AC1009", "R2000": "AC1015", "R2010": "AC1024", "R2018": "AC1032"}


def build(version: str) -> ezdxf.document.Drawing:
    doc = ezdxf.new(version)
    doc.units = units.MM
    doc.header["$INSUNITS"] = 4
    doc.layers.add("PART", color=7)
    doc.layers.add("CENTER", color=1)
    hidden = doc.layers.add("HIDDEN", color=3)
    hidden.off()
    modern = version != "R12"

    # Block BOLT: a circle on layer 0 (inherits the INSERT's layer) + a centre line.
    bolt = doc.blocks.new("BOLT", base_point=(0, 0))
    bolt.add_circle((0, 0), 5, dxfattribs={"layer": "0"})
    bolt.add_line((-8, 0), (8, 0), dxfattribs={"layer": "CENTER"})

    # Block PLATE: nested BOLT + a line.
    plate = doc.blocks.new("PLATE", base_point=(0, 0))
    plate.add_line((0, 0), (20, 0), dxfattribs={"layer": "PART"})
    plate.add_blockref("BOLT", (10, 0))

    msp = doc.modelspace()
    msp.add_line((0, 0), (100, 0), dxfattribs={"layer": "PART"})                       # 1
    msp.add_circle((50, 50), 10, dxfattribs={"layer": "PART"})                         # 2
    msp.add_arc((0, 0), 20, 0, 90, dxfattribs={"layer": "PART"})                       # 3
    pts = [(200, 0, 0), (300, 0, 1.0), (300, 100, 0), (200, 100, 0)]                  # (x, y, bulge)
    if modern:
        msp.add_lwpolyline(pts, format="xyb", close=True, dxfattribs={"layer": "PART"})  # 4
    else:
        pl = msp.add_polyline2d([(x, y) for x, y, _ in pts], close=True, dxfattribs={"layer": "PART"})
        for v, (_, _, b) in zip(pl.vertices, pts):
            v.dxf.bulge = b
    msp.add_point((5, 5), dxfattribs={"layer": "PART"})                                # 5
    msp.add_blockref("BOLT", (500, 500), dxfattribs={"layer": "PART", "xscale": 2, "yscale": 2,
                                                     "rotation": 90})                  # 6, 7
    msp.add_blockref("PLATE", (1000, 0), dxfattribs={"layer": "PART"})                # 8, 9, 10
    # Mirrored arc: OCS with extrusion (0,0,-1), as AutoCAD writes after MIRROR.
    msp.add_arc((100, 200), 10, 0, 90, dxfattribs={"layer": "PART", "extrusion": (0, 0, -1)})  # 11

    # Unsupported content that must be reported, not silently dropped.
    msp.add_text("HELLO", dxfattribs={"layer": "PART", "height": 3.5})
    if modern:
        msp.add_mtext("NOTE", dxfattribs={"layer": "PART"})
        msp.add_spline([(0, 0), (10, 10), (20, 0), (30, 10)])
        msp.add_ellipse((0, 0), major_axis=(10, 0), ratio=0.5)

    # Paper space content is skipped (model space only).
    doc.layouts.get("Layout1").add_line((0, 0), (10, 10))
    return doc


def curves() -> ezdxf.document.Drawing:
    """Ellipses, splines, solids and stretched blocks (expectations in test_dxf.cpp)."""
    import math
    doc = ezdxf.new("R2010")
    doc.header["$INSUNITS"] = 4
    msp = doc.modelspace()
    # 1: ellipse arc, upper half, major 20 along X, ratio 0.5
    msp.add_ellipse((0, 0), major_axis=(20, 0), ratio=0.5, start_param=0, end_param=math.pi)
    # 2: the same arc mirrored the AutoCAD way (extrusion 0,0,-1) -> lower-left... see test
    e = msp.add_ellipse((100, 0), major_axis=(20, 0), ratio=0.5, start_param=0, end_param=math.pi / 2)
    e.dxf.extrusion = (0, 0, -1)
    # 3: rational quadratic spline = exact quarter circle of radius 10 about (200,0)
    msp.add_rational_spline(control_points=[(210, 0), (210, 10), (200, 10)], weights=[1, math.sqrt(0.5), 1],
                            degree=2, knots=[0, 0, 0, 1, 1, 1])
    # 4: open cubic B-spline by control points
    msp.add_open_spline(control_points=[(0, 100), (10, 120), (30, 80), (40, 100)], degree=3)
    # 5: SOLID triangle (corners 3 and 4 equal) and 6: SOLID quad in DXF 1-2-4-3 order
    msp.add_solid([(300, 0), (320, 0), (310, 20)])
    msp.add_solid([(400, 0), (420, 0), (400, 10), (420, 10)])
    # 7: circle r=5 in a block inserted with scale (3, 1) -> ellipse 15 x 5
    blk = doc.blocks.new("DOT")
    blk.add_circle((0, 0), 5)
    msp.add_blockref("DOT", (500, 0), dxfattribs={"xscale": 3, "yscale": 1})
    return doc


def sample_flange() -> ezdxf.document.Drawing:
    """Illustrative flange drawing for users to try DXF import (not a real design)."""
    import math
    doc = ezdxf.new("R2010")
    doc.units = units.MM
    doc.header["$INSUNITS"] = 4
    for name, color in (("PART", 7), ("CENTER", 1), ("HOLES", 4), ("TEXT", 2)):
        doc.layers.add(name, color=color)
    hole = doc.blocks.new("HOLE_M16", base_point=(0, 0))
    hole.add_circle((0, 0), 8.75, dxfattribs={"layer": "0"})
    hole.add_line((-12, 0), (12, 0), dxfattribs={"layer": "CENTER"})
    hole.add_line((0, -12), (0, 12), dxfattribs={"layer": "CENTER"})
    msp = doc.modelspace()
    # 240 x 240 plate with R20 corners (bulge = tan(90deg / 4)).
    b = math.tan(math.radians(90) / 4)
    w, r = 120, 20
    # bulge belongs to the vertex that *starts* the arc segment
    pts = [(-w + r, -w, 0), (w - r, -w, b), (w, -w + r, 0), (w, w - r, b), (w - r, w, 0), (-w + r, w, b),
           (-w, w - r, 0), (-w, -w + r, b)]
    msp.add_lwpolyline(pts, format="xyb", close=True, dxfattribs={"layer": "PART"})
    msp.add_circle((0, 0), 50, dxfattribs={"layer": "PART"})
    msp.add_circle((0, 0), 80, dxfattribs={"layer": "CENTER"})  # pitch circle
    for i in range(6):
        a = math.radians(90 + i * 60)
        msp.add_blockref("HOLE_M16", (80 * math.cos(a), 80 * math.sin(a)),
                         dxfattribs={"layer": "HOLES", "rotation": i * 60})
    msp.add_line((-140, 0), (140, 0), dxfattribs={"layer": "CENTER"})
    msp.add_line((0, -140), (0, 140), dxfattribs={"layer": "CENTER"})
    # Side view, 16 thick, with the bore shown by two lines.
    msp.add_lwpolyline([(180, -120), (196, -120), (196, 120), (180, 120)], close=True, dxfattribs={"layer": "PART"})
    msp.add_line((180, -50), (196, -50), dxfattribs={"layer": "PART"})
    msp.add_line((180, 50), (196, 50), dxfattribs={"layer": "PART"})
    msp.add_arc((0, 0), 100, 200, 250, dxfattribs={"layer": "PART"})
    msp.add_text("SAMPLE FLANGE - ILLUSTRATIVE ONLY", dxfattribs={"layer": "TEXT", "height": 5, "insert": (-120, -165)})
    return doc


def main():
    out = os.path.join(HERE, "dxf")
    os.makedirs(out, exist_ok=True)
    for version in VERSIONS:
        build(version).saveas(os.path.join(out, f"mixed_{version}.dxf"))
    curves().saveas(os.path.join(out, "curves_R2010.dxf"))
    samples = os.path.join(HERE, "..", "..", "docs", "samples")
    sample_flange().saveas(os.path.join(samples, "sample-flange.dxf"))
    print("written to", out, "and", os.path.normpath(samples))


if __name__ == "__main__":
    main()
