// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "geometry/Ellipse.h"

#include "geometry/Arc.h"
#include "geometry/Geometry.h"

#include <cmath>
#include <limits>

namespace dyncad {

Vec2 EllipseGeom::pointAt(double t) const { return center + major * std::cos(t) + minor() * std::sin(t); }

double EllipseGeom::sweep() const {
    const double d = endParam - startParam;
    if (d >= 2.0 * kPi - 1e-12) return 2.0 * kPi;
    double s = geom::normalizeAngle(d);
    if (s <= 1e-15) s = 2.0 * kPi;
    return s;
}

bool EllipseGeom::isFull() const { return sweep() >= 2.0 * kPi - 1e-12; }

bool EllipseGeom::containsParam(double t, double eps) const {
    if (isFull()) return true;
    const double d = geom::normalizeAngle(t - startParam);
    return d <= sweep() + eps || d >= 2.0 * kPi - eps;
}

namespace geom {

BoundingBox ellipseBounds(const EllipseGeom& e) {
    const Vec2 M = e.major, m = e.minor();
    BoundingBox b;
    if (e.isFull()) {
        const double hx = std::hypot(M.x, m.x), hy = std::hypot(M.y, m.y);
        b.expand(e.center - Vec2{hx, hy});
        b.expand(e.center + Vec2{hx, hy});
        return b;
    }
    b.expand(e.pointAt(e.startParam));
    b.expand(e.pointAt(e.startParam + e.sweep()));
    const double tx = std::atan2(m.x, M.x), ty = std::atan2(m.y, M.y);
    for (double t : {tx, tx + kPi, ty, ty + kPi})
        if (e.containsParam(t)) b.expand(e.pointAt(t));
    return b;
}

std::vector<Vec2> tessellateEllipse(const EllipseGeom& e, double tolerance, int maxSegments) {
    // The ellipse is an affine compression of its major circle, so the chord
    // error never exceeds that of the circle of radius a with the same step.
    const double a = e.majorRadius();
    int n;
    if (tolerance > 0.0 && a > tolerance) n = static_cast<int>(std::ceil(e.sweep() / (2.0 * std::acos(1.0 - tolerance / a))));
    else n = static_cast<int>(std::ceil(e.sweep() / (kPi / 2.0)));
    n = std::max(4, std::min(n, maxSegments));
    std::vector<Vec2> pts;
    pts.reserve(static_cast<std::size_t>(n) + 1);
    const double s = e.sweep();
    for (int i = 0; i <= n; ++i) pts.push_back(e.pointAt(e.startParam + s * i / n));
    return pts;
}

double distancePointToEllipse(const Vec2& p, const EllipseGeom& e) {
    // Coarse sampling followed by Newton refinement of the parameter.
    const double s = e.sweep();
    const int n = 256;
    double bestT = e.startParam, bestD = std::numeric_limits<double>::infinity();
    for (int i = 0; i <= n; ++i) {
        const double t = e.startParam + s * i / n;
        const double d = (e.pointAt(t) - p).lengthSquared();
        if (d < bestD) { bestD = d; bestT = t; }
    }
    const Vec2 M = e.major, m = e.minor();
    double t = bestT;
    for (int it = 0; it < 30; ++it) {
        const Vec2 P = e.pointAt(t) - p;
        const Vec2 d1 = M * -std::sin(t) + m * std::cos(t);
        const Vec2 d2 = M * -std::cos(t) - m * std::sin(t);
        const double f = P.dot(d1), fp = d1.dot(d1) + P.dot(d2);
        if (fp == 0.0) break;
        const double step = f / fp;
        double nt = t - step;
        if (!e.isFull()) { // stay inside the arc
            const double lo = e.startParam, hi = e.startParam + s;
            double rel = nt;
            while (rel < lo - kPi) rel += 2 * kPi;
            while (rel > hi + kPi) rel -= 2 * kPi;
            nt = std::clamp(rel, lo, hi);
        }
        if (std::abs(nt - t) < 1e-15) { t = nt; break; }
        t = nt;
    }
    double best = std::min(std::sqrt(bestD), distance(e.pointAt(t), p));
    if (!e.isFull()) {
        best = std::min(best, distance(p, e.pointAt(e.startParam)));
        best = std::min(best, distance(p, e.pointAt(e.startParam + s)));
    }
    return best;
}

bool ellipseIntersectsRect(const EllipseGeom& e, const BoundingBox& rect) {
    if (!rect.intersects(ellipseBounds(e))) return false;
    const auto pts = tessellateEllipse(e, e.majorRadius() * 1e-7, 16384);
    for (std::size_t i = 1; i < pts.size(); ++i)
        if (segmentIntersectsRect(pts[i - 1], pts[i], rect)) return true;
    return false;
}

double ellipseLength(const EllipseGeom& e) {
    // Composite Gauss-Legendre (5 points) over many sub-intervals.
    static const double x[5] = {0.0, -0.5384693101056831, 0.5384693101056831, -0.9061798459386640, 0.9061798459386640};
    static const double w[5] = {0.5688888888888889, 0.4786286704993665, 0.4786286704993665, 0.2369268850561891,
                                0.2369268850561891};
    const Vec2 M = e.major, m = e.minor();
    const double s = e.sweep();
    const int n = 512;
    const double h = s / n;
    double sum = 0.0;
    for (int i = 0; i < n; ++i) {
        const double mid = e.startParam + (i + 0.5) * h;
        for (int k = 0; k < 5; ++k) {
            const double t = mid + 0.5 * h * x[k];
            sum += w[k] * (M * -std::sin(t) + m * std::cos(t)).length();
        }
    }
    return sum * 0.5 * h;
}

} // namespace geom
} // namespace dyncad
