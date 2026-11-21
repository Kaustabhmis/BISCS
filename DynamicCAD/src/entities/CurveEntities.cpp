// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/CurveEntities.h"

#include "geometry/Arc.h"
#include "geometry/Geometry.h"

#include <cmath>
#include <limits>

namespace dyncad {

// ---------------------------------------------------------------- ellipse

std::vector<Vec2> EllipseEntity::gripPoints() const {
    if (g_.isFull())
        return {g_.center, g_.center + g_.major, g_.center - g_.major, g_.center + g_.minor(), g_.center - g_.minor()};
    return {g_.center, g_.pointAt(g_.startParam), g_.pointAt(g_.startParam + g_.sweep())};
}

std::unique_ptr<Entity> EllipseEntity::transformed(const Affine2D& xf) const {
    const Vec2 c = xf.apply(g_.center);
    const Vec2 M = xf.applyVector(g_.major), m = xf.applyVector(g_.minor());
    // Principal axes of the image: eigen-decomposition of J J^T, J = [M m].
    const double a = M.x * M.x + m.x * m.x, b = M.x * M.y + m.x * m.y, d = M.y * M.y + m.y * m.y;
    const double mean = 0.5 * (a + d), dev = std::sqrt(0.25 * (a - d) * (a - d) + b * b);
    const double l1 = mean + dev, l2 = std::max(0.0, mean - dev);
    if (!(l1 > 0.0) || !(l2 > 0.0)) return nullptr; // collapsed to a line
    const double theta = 0.5 * std::atan2(2.0 * b, a - d);
    EllipseGeom out;
    out.center = c;
    out.major = Vec2::fromPolar(std::sqrt(l1), theta);
    out.ratio = std::min(1.0, std::sqrt(l2) / std::sqrt(l1));
    if (!g_.isFull()) {
        // Recover the parameters of the transformed end points in the new frame.
        auto paramOf = [&](const Vec2& q) {
            const Vec2 rel = q - c;
            const Vec2 uM = out.major.normalized(), um{-uM.y, uM.x};
            return std::atan2(rel.dot(um) / out.minorRadius(), rel.dot(uM) / out.majorRadius());
        };
        double s = paramOf(xf.apply(g_.pointAt(g_.startParam)));
        double e = paramOf(xf.apply(g_.pointAt(g_.startParam + g_.sweep())));
        if (xf.det() < 0) std::swap(s, e);
        out.startParam = s;
        out.endParam = e;
        if (out.endParam <= out.startParam) out.endParam += 2.0 * kPi;
    }
    auto ent = std::make_unique<EllipseEntity>(out);
    ent->copyStyleFrom(*this);
    return ent;
}

// ---------------------------------------------------------------- spline

SplineEntity::SplineEntity(NurbsCurve c) : curve_(std::move(c)) {
    BoundingBox cb;
    for (const Vec2& p : curve_.ctrl) cb.expand(p);
    const double size = std::max({cb.width(), cb.height(), 1e-12});
    pts_ = curve_.tessellate(size * 1e-5, &params_);
    for (const Vec2& p : pts_) bounds_.expand(p);
}

double SplineEntity::distanceTo(const Vec2& p) const {
    double best = std::numeric_limits<double>::infinity();
    std::size_t bi = 0;
    for (std::size_t i = 1; i < pts_.size(); ++i) {
        const double d = geom::distancePointToSegment(p, pts_[i - 1], pts_[i]);
        if (d < best) { best = d; bi = i; }
    }
    if (bi == 0 || params_.size() != pts_.size()) return best;
    // Refine on the true curve over the neighbouring segments.
    const double t0 = params_[bi > 1 ? bi - 2 : 0], t1 = params_[std::min(bi + 1, params_.size() - 1)];
    const double t = curve_.closestParam(p, t0, t1);
    return std::min(best, distance(curve_.eval(t), p));
}

bool SplineEntity::crossesRect(const BoundingBox& r) const {
    if (!r.intersects(bounds_)) return false;
    for (std::size_t i = 1; i < pts_.size(); ++i)
        if (geom::segmentIntersectsRect(pts_[i - 1], pts_[i], r)) return true;
    return false;
}

double SplineEntity::length() const { return geom::polylineLength(pts_, false); }

bool SplineEntity::isClosed() const { return pts_.size() > 2 && nearlyEqual(pts_.front(), pts_.back(), bounds_.width() * 1e-9 + 1e-12); }

std::unique_ptr<Entity> SplineEntity::transformed(const Affine2D& xf) const {
    NurbsCurve c = curve_;
    for (Vec2& p : c.ctrl) p = xf.apply(p); // NURBS are affinely invariant
    auto ent = std::make_unique<SplineEntity>(std::move(c));
    ent->copyStyleFrom(*this);
    return ent;
}

} // namespace dyncad
