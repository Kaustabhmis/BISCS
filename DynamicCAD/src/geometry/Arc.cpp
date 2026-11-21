// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "geometry/Arc.h"

#include "geometry/Geometry.h"

#include <cmath>

namespace dyncad {

double ArcGeom::length() const { return radius * std::abs(sweep); }

bool ArcGeom::containsAngle(double ang, double eps) const {
    if (std::abs(sweep) >= 2.0 * kPi) return true;
    const double d = sweep >= 0 ? geom::normalizeAngle(ang - startAngle) : geom::normalizeAngle(startAngle - ang);
    const double span = std::abs(sweep);
    return d <= span + eps || d >= 2.0 * kPi - eps; // near start, from either side
}

namespace geom {

double normalizeAngle(double rad) {
    double r = std::fmod(rad, 2.0 * kPi);
    if (r < 0) r += 2.0 * kPi;
    if (r >= 2.0 * kPi) r -= 2.0 * kPi;
    return r;
}

std::optional<ArcGeom> arcFromBulge(const Vec2& p1, const Vec2& p2, double bulge) {
    if (bulge == 0.0 || !std::isfinite(bulge)) return std::nullopt;
    const Vec2 chord = p2 - p1;
    const double c = chord.length();
    if (!(c > 0.0)) return std::nullopt;
    const double sweep = 4.0 * std::atan(bulge);
    const double half = sweep / 2.0;
    const Vec2 u = chord / c;
    const Vec2 left{-u.y, u.x};
    const Vec2 mid = (p1 + p2) * 0.5;
    // Signed distance from chord midpoint to centre (left of travel when > 0).
    const double h = (c / 2.0) * std::cos(half) / std::sin(half);
    ArcGeom a;
    a.center = mid + left * h;
    a.radius = std::abs((c / 2.0) / std::sin(half));
    a.startAngle = std::atan2(p1.y - a.center.y, p1.x - a.center.x);
    a.sweep = sweep;
    return a;
}

ArcGeom arcFromDegrees(const Vec2& center, double radius, double startDeg, double endDeg) {
    ArcGeom a;
    a.center = center;
    a.radius = radius;
    a.startAngle = degToRad(startDeg);
    double sweepDeg = std::fmod(endDeg - startDeg, 360.0);
    if (sweepDeg <= 0.0) sweepDeg += 360.0;
    a.sweep = degToRad(sweepDeg);
    return a;
}

BoundingBox arcBounds(const ArcGeom& arc) {
    BoundingBox b;
    b.expand(arc.startPoint());
    b.expand(arc.endPoint());
    for (int q = 0; q < 4; ++q) {
        const double ang = q * kPi / 2.0;
        if (arc.containsAngle(ang)) b.expand(arc.pointAtAngle(ang));
    }
    return b;
}

double distancePointToArc(const Vec2& p, const ArcGeom& arc) {
    const Vec2 d = p - arc.center;
    if (d.lengthSquared() == 0.0) return arc.radius;
    const double ang = std::atan2(d.y, d.x);
    if (arc.containsAngle(ang)) return std::abs(d.length() - arc.radius);
    return std::min(distance(p, arc.startPoint()), distance(p, arc.endPoint()));
}

bool arcIntersectsRect(const ArcGeom& arc, const BoundingBox& rect) {
    if (!rect.isValid()) return false;
    if (rect.contains(arc.startPoint()) || rect.contains(arc.endPoint())) return true;
    if (!circleIntersectsRect(arc.center, arc.radius, rect)) return false;
    // Otherwise the arc must cross the rectangle boundary.
    const Vec2 corners[4] = {rect.min, {rect.max.x, rect.min.y}, rect.max, {rect.min.x, rect.max.y}};
    for (int i = 0; i < 4; ++i) {
        const Vec2 a = corners[i], dir = corners[(i + 1) % 4] - corners[i];
        const Vec2 f = a - arc.center;
        const double A = dir.dot(dir), B = 2.0 * f.dot(dir), C = f.dot(f) - arc.radius * arc.radius;
        if (A == 0.0) continue;
        const double disc = B * B - 4.0 * A * C;
        if (disc < 0.0) continue;
        const double s = std::sqrt(disc);
        for (double t : {(-B - s) / (2.0 * A), (-B + s) / (2.0 * A)}) {
            if (t < 0.0 || t > 1.0) continue;
            const Vec2 q = a + dir * t;
            if (arc.containsAngle(std::atan2(q.y - arc.center.y, q.x - arc.center.x), 1e-9)) return true;
        }
    }
    return false;
}

double arcSegmentArea(const ArcGeom& arc) {
    const double t = std::abs(arc.sweep);
    const double area = 0.5 * arc.radius * arc.radius * (t - std::sin(t));
    return arc.sweep >= 0 ? area : -area;
}

std::vector<Vec2> tessellateArc(const ArcGeom& arc, double tolerance, int maxSegments) {
    int n = 1;
    if (tolerance > 0.0 && arc.radius > tolerance) {
        const double step = 2.0 * std::acos(1.0 - tolerance / arc.radius);
        n = static_cast<int>(std::ceil(std::abs(arc.sweep) / step));
    } else {
        n = static_cast<int>(std::ceil(std::abs(arc.sweep) / (kPi / 2.0)));
    }
    n = std::max(1, std::min(n, maxSegments));
    std::vector<Vec2> pts;
    pts.reserve(static_cast<std::size_t>(n) + 1);
    pts.push_back(arc.startPoint());
    for (int i = 1; i < n; ++i) pts.push_back(arc.pointAtAngle(arc.startAngle + arc.sweep * i / n));
    pts.push_back(arc.endPoint());
    return pts;
}

} // namespace geom
} // namespace dyncad
