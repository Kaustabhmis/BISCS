// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "geometry/Intersections.h"

#include "geometry/Geometry.h"

#include <cmath>

namespace dyncad {

BoundingBox Primitive::bounds() const { return kind == Kind::Segment ? BoundingBox(a, b) : geom::arcBounds(arc); }

Vec2 Primitive::closestPoint(const Vec2& p) const {
    if (kind == Kind::Segment) return geom::closestPointOnSegment(p, a, b);
    const Vec2 d = p - arc.center;
    if (d.lengthSquared() > 0) {
        const double ang = std::atan2(d.y, d.x);
        if (arc.containsAngle(ang)) return arc.pointAtAngle(ang);
    }
    const Vec2 s = arc.startPoint(), e = arc.endPoint();
    return distance(p, s) <= distance(p, e) ? s : e;
}

namespace geom {

std::vector<Vec2> intersectLines(const Vec2& a, const Vec2& b, const Vec2& c, const Vec2& d) {
    const Vec2 r = b - a, s = d - c;
    const double den = r.cross(s);
    const double scale = r.length() * s.length();
    if (scale == 0.0 || std::abs(den) <= 1e-14 * scale) return {};
    const double t = (c - a).cross(s) / den;
    return {a + r * t};
}

std::vector<Vec2> intersectLineCircle(const Vec2& a, const Vec2& b, const Vec2& center, double r) {
    const Vec2 d = b - a;
    const double len2 = d.lengthSquared();
    if (len2 == 0.0) return {};
    // Foot of the perpendicular from the centre, then +- half chord.
    const double t = (center - a).dot(d) / len2;
    const Vec2 foot = a + d * t;
    const double h2 = r * r - (center - foot).lengthSquared();
    const double tol = 1e-12 * r * r;
    if (h2 < -tol) return {};
    if (h2 <= tol) return {foot};
    const Vec2 off = d * (std::sqrt(h2) / std::sqrt(len2));
    return {foot - off, foot + off};
}

std::vector<Vec2> intersectCircles(const Vec2& c1, double r1, const Vec2& c2, double r2) {
    const double d = distance(c1, c2);
    if (d == 0.0) return {};
    const double tol = 1e-12 * std::max(r1, r2);
    if (d > r1 + r2 + tol || d < std::abs(r1 - r2) - tol) return {};
    const double a = (r1 * r1 - r2 * r2 + d * d) / (2.0 * d);
    const double h2 = r1 * r1 - a * a;
    const Vec2 u = (c2 - c1) / d;
    const Vec2 m = c1 + u * a;
    if (h2 <= tol * std::max(r1, r2)) return {m};
    const double h = std::sqrt(h2);
    const Vec2 n{-u.y, u.x};
    return {m + n * h, m - n * h};
}

std::vector<Vec2> tangentPoints(const Vec2& p, const Vec2& center, double r) {
    const double d = distance(p, center);
    if (d <= r) return {};
    // Tangent points lie on the circle with diameter p-centre.
    return intersectCircles(center, r, (p + center) * 0.5, d * 0.5);
}

namespace {
bool onSegment(const Vec2& p, const Vec2& a, const Vec2& b) {
    const double len = distance(a, b);
    const double eps = 1e-9 * std::max(1.0, len);
    return distancePointToSegment(p, a, b) <= eps;
}
bool onArc(const Vec2& p, const ArcGeom& g) {
    return g.containsAngle(std::atan2(p.y - g.center.y, p.x - g.center.x), 1e-9);
}
} // namespace

std::vector<Vec2> intersect(const Primitive& p, const Primitive& q) {
    std::vector<Vec2> out;
    using K = Primitive::Kind;
    if (!p.bounds().inflated(1e-9).intersects(q.bounds().inflated(1e-9))) return out;
    if (p.kind == K::Segment && q.kind == K::Segment) {
        for (const Vec2& x : intersectLines(p.a, p.b, q.a, q.b))
            if (onSegment(x, p.a, p.b) && onSegment(x, q.a, q.b)) out.push_back(x);
        return out;
    }
    if (p.kind == K::Arc && q.kind == K::Arc) {
        for (const Vec2& x : intersectCircles(p.arc.center, p.arc.radius, q.arc.center, q.arc.radius))
            if (onArc(x, p.arc) && onArc(x, q.arc)) out.push_back(x);
        return out;
    }
    const Primitive& s = p.kind == K::Segment ? p : q;
    const Primitive& c = p.kind == K::Segment ? q : p;
    for (const Vec2& x : intersectLineCircle(s.a, s.b, c.arc.center, c.arc.radius))
        if (onSegment(x, s.a, s.b) && onArc(x, c.arc)) out.push_back(x);
    return out;
}

} // namespace geom
} // namespace dyncad
