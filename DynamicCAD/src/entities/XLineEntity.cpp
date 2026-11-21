// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/XLineEntity.h"

#include "geometry/Geometry.h"

#include <cmath>
#include <limits>

namespace dyncad {

double XLineEntity::tMin() const { return ray_ ? 0.0 : -std::numeric_limits<double>::infinity(); }

double XLineEntity::distanceTo(const Vec2& p) const {
    const Vec2 d = p - base_;
    const double t = d.dot(dir_);
    if (ray_ && t < 0) return d.length();
    return std::abs(dir_.cross(d));
}

std::optional<std::pair<Vec2, Vec2>> XLineEntity::clipped(const BoundingBox& rect) const {
    return geom::clipParametric(base_, dir_, tMin(), std::numeric_limits<double>::infinity(), rect);
}

bool XLineEntity::crossesRect(const BoundingBox& rect) const { return clipped(rect).has_value(); }

std::unique_ptr<Entity> XLineEntity::transformed(const Affine2D& xf) const {
    const Vec2 d = xf.applyVector(dir_);
    if (!(d.length() > 0)) return nullptr;
    auto e = std::make_unique<XLineEntity>(xf.apply(base_), d, ray_);
    e->copyStyleFrom(*this);
    return e;
}

} // namespace dyncad
