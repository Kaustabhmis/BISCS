// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "geometry/Geometry.h"

#include <cmath>

namespace dyncad::geom {

Vec2 closestPointOnSegment(const Vec2& p, const Vec2& a, const Vec2& b) {
    const Vec2 ab = b - a;
    const double len2 = ab.lengthSquared();
    if (len2 <= 0.0) return a;
    double t = (p - a).dot(ab) / len2;
    t = std::clamp(t, 0.0, 1.0);
    return a + ab * t;
}

double distancePointToSegment(const Vec2& p, const Vec2& a, const Vec2& b) {
    return distance(p, closestPointOnSegment(p, a, b));
}

std::optional<std::pair<Vec2, Vec2>> clipSegment(const Vec2& a, const Vec2& b, const BoundingBox& rect) {
    if (!rect.isValid()) return std::nullopt;
    const Vec2 d = b - a;
    double t0 = 0.0, t1 = 1.0;
    const double p[4] = {-d.x, d.x, -d.y, d.y};
    const double q[4] = {a.x - rect.min.x, rect.max.x - a.x, a.y - rect.min.y, rect.max.y - a.y};
    for (int i = 0; i < 4; ++i) {
        if (p[i] == 0.0) {
            if (q[i] < 0.0) return std::nullopt; // parallel and outside
        } else {
            const double r = q[i] / p[i];
            if (p[i] < 0.0) {
                if (r > t1) return std::nullopt;
                if (r > t0) t0 = r;
            } else {
                if (r < t0) return std::nullopt;
                if (r < t1) t1 = r;
            }
        }
    }
    // Keep exact endpoints when they are not clipped (preserves precision).
    const Vec2 ca = (t0 == 0.0) ? a : a + d * t0;
    const Vec2 cb = (t1 == 1.0) ? b : a + d * t1;
    return std::make_pair(ca, cb);
}

std::optional<std::pair<Vec2, Vec2>> clipParametric(const Vec2& o, const Vec2& d, double t0, double t1,
                                                    const BoundingBox& rect) {
    if (!rect.isValid()) return std::nullopt;
    const double p[4] = {-d.x, d.x, -d.y, d.y};
    const double q[4] = {o.x - rect.min.x, rect.max.x - o.x, o.y - rect.min.y, rect.max.y - o.y};
    for (int i = 0; i < 4; ++i) {
        if (p[i] == 0.0) {
            if (q[i] < 0.0) return std::nullopt;
        } else {
            const double r = q[i] / p[i];
            if (p[i] < 0.0) { if (r > t1) return std::nullopt; if (r > t0) t0 = r; }
            else { if (r < t0) return std::nullopt; if (r < t1) t1 = r; }
        }
    }
    if (!std::isfinite(t0) || !std::isfinite(t1)) return std::nullopt;
    return std::make_pair(o + d * t0, o + d * t1);
}

bool segmentIntersectsRect(const Vec2& a, const Vec2& b, const BoundingBox& rect) {
    return clipSegment(a, b, rect).has_value();
}

bool circleIntersectsRect(const Vec2& c, double r, const BoundingBox& rect) {
    if (!rect.isValid()) return false;
    // Distances from the centre to points of a convex region form the interval
    // [dmin, dmax]; the curve touches the region iff r lies in that interval.
    const double nx = std::clamp(c.x, rect.min.x, rect.max.x);
    const double ny = std::clamp(c.y, rect.min.y, rect.max.y);
    const double dmin = std::hypot(nx - c.x, ny - c.y);
    const double fx = std::max(std::abs(c.x - rect.min.x), std::abs(c.x - rect.max.x));
    const double fy = std::max(std::abs(c.y - rect.min.y), std::abs(c.y - rect.max.y));
    const double dmax = std::hypot(fx, fy);
    return r >= dmin && r <= dmax;
}

std::optional<std::pair<Vec2, double>> circleFrom3Points(const Vec2& a, const Vec2& b, const Vec2& c) {
    const double d = 2.0 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    const double scale = std::max({(b - a).lengthSquared(), (c - a).lengthSquared(), (c - b).lengthSquared()});
    if (scale <= 0.0 || std::abs(d) <= kEpsilon * scale) return std::nullopt;
    const double a2 = a.lengthSquared(), b2 = b.lengthSquared(), c2 = c.lengthSquared();
    const Vec2 center{(a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d,
                      (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d};
    return std::make_pair(center, distance(center, a));
}

double polygonSignedArea(const std::vector<Vec2>& v) {
    if (v.size() < 3) return 0.0;
    double sum = 0.0;
    // Translate to first vertex to reduce floating-point cancellation.
    const Vec2 o = v.front();
    for (std::size_t i = 1; i + 1 < v.size(); ++i)
        sum += (v[i] - o).cross(v[i + 1] - o);
    return 0.5 * sum;
}

double polylineLength(const std::vector<Vec2>& v, bool closed) {
    double len = 0.0;
    for (std::size_t i = 1; i < v.size(); ++i) len += distance(v[i - 1], v[i]);
    if (closed && v.size() > 2) len += distance(v.back(), v.front());
    return len;
}

Vec2 orthoConstrain(const Vec2& base, const Vec2& p) {
    const Vec2 d = p - base;
    return std::abs(d.x) >= std::abs(d.y) ? Vec2{p.x, base.y} : Vec2{base.x, p.y};
}

Vec2 snapToGrid(const Vec2& p, double step) {
    if (!(step > 0.0)) return p;
    return {std::round(p.x / step) * step, std::round(p.y / step) * step};
}

double gridStepForScale(double pixelsPerUnit, double minPixelSpacing) {
    if (!(pixelsPerUnit > 0.0) || !(minPixelSpacing > 0.0)) return 1.0;
    const double raw = minPixelSpacing / pixelsPerUnit;
    const double base = std::pow(10.0, std::floor(std::log10(raw)));
    for (double m : {1.0, 2.0, 5.0, 10.0}) {
        if (base * m >= raw * (1.0 - 1e-12)) return base * m;
    }
    return base * 10.0;
}

double angleDeg(const Vec2& a, const Vec2& b) {
    double deg = radToDeg(std::atan2(b.y - a.y, b.x - a.x));
    if (deg < 0.0) deg += 360.0;
    if (deg >= 360.0) deg -= 360.0;
    return deg;
}

} // namespace dyncad::geom
