// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/Arc.h"

#include <vector>

namespace dyncad {

// A simple curve piece: straight segment or circular arc (full circle = arc
// with |sweep| = 2*pi). Every entity can be decomposed into primitives
// (ellipses and splines approximately), which drives intersection snaps and,
// later, TRIM / EXTEND / BREAK.
struct Primitive {
    enum class Kind { Segment, Arc } kind = Kind::Segment;
    Vec2 a, b;          // Segment
    ArcGeom arc;        // Arc
    bool approximate = false;

    static Primitive segment(const Vec2& a, const Vec2& b) { Primitive p; p.a = a; p.b = b; return p; }
    static Primitive fromArc(const ArcGeom& g) { Primitive p; p.kind = Kind::Arc; p.arc = g; return p; }
    BoundingBox bounds() const;
    Vec2 closestPoint(const Vec2& p) const;
};

namespace geom {
// Intersection points of two primitives (tangencies count once).
std::vector<Vec2> intersect(const Primitive& p, const Primitive& q);
// Full-line / full-circle variants (extensions), used by EXTEND and apparent snaps.
std::vector<Vec2> intersectLines(const Vec2& a, const Vec2& b, const Vec2& c, const Vec2& d);
std::vector<Vec2> intersectLineCircle(const Vec2& a, const Vec2& b, const Vec2& center, double r);
std::vector<Vec2> intersectCircles(const Vec2& c1, double r1, const Vec2& c2, double r2);
// Tangent points on a circle seen from an external point p.
std::vector<Vec2> tangentPoints(const Vec2& p, const Vec2& center, double r);
} // namespace geom

} // namespace dyncad
