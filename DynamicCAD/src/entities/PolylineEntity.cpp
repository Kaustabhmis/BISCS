// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/PolylineEntity.h"

#include "geometry/Geometry.h"

#include <cmath>
#include <limits>

namespace dyncad {

BoundingBox PolylineEntity::bounds() const {
    BoundingBox b;
    for (const Vec2& v : vertices_) b.expand(v);
    return b;
}

std::size_t PolylineEntity::segmentCount() const {
    if (vertices_.size() < 2) return 0;
    return vertices_.size() - 1 + ((closed_ && vertices_.size() > 2) ? 1 : 0);
}

double PolylineEntity::distanceTo(const Vec2& p) const {
    if (vertices_.empty()) return std::numeric_limits<double>::infinity();
    if (vertices_.size() == 1) return distance(p, vertices_.front());
    double best = std::numeric_limits<double>::infinity();
    const std::size_t n = segmentCount();
    for (std::size_t i = 0; i < n; ++i) {
        const Vec2& a = vertices_[i];
        const Vec2& b = vertices_[(i + 1) % vertices_.size()];
        best = std::min(best, geom::distancePointToSegment(p, a, b));
    }
    return best;
}

bool PolylineEntity::crossesRect(const BoundingBox& rect) const {
    if (!rect.intersects(bounds())) return false;
    if (vertices_.size() == 1) return rect.contains(vertices_.front());
    const std::size_t n = segmentCount();
    for (std::size_t i = 0; i < n; ++i) {
        if (geom::segmentIntersectsRect(vertices_[i], vertices_[(i + 1) % vertices_.size()], rect)) return true;
    }
    return false;
}

double PolylineEntity::length() const { return geom::polylineLength(vertices_, closed_); }

double PolylineEntity::area() const { return closed_ ? std::abs(geom::polygonSignedArea(vertices_)) : 0.0; }

} // namespace dyncad
