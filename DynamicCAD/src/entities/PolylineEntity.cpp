// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/PolylineEntity.h"

#include "geometry/Geometry.h"

#include <cmath>
#include <limits>

namespace dyncad {

PolylineEntity::PolylineEntity(std::vector<Vec2> vertices, bool closed)
    : vertices_(std::move(vertices)), bulges_(vertices_.size(), 0.0), closed_(closed) {}

PolylineEntity::PolylineEntity(std::vector<Vec2> vertices, std::vector<double> bulges, bool closed)
    : vertices_(std::move(vertices)), bulges_(std::move(bulges)), closed_(closed) {
    bulges_.resize(vertices_.size(), 0.0);
}

bool PolylineEntity::hasArcs() const {
    const std::size_t n = segmentCount();
    for (std::size_t i = 0; i < n; ++i)
        if (bulges_[i] != 0.0) return true;
    return false;
}

std::size_t PolylineEntity::segmentCount() const {
    const std::size_t n = vertices_.size();
    if (n < 2) return 0;
    if (!closed_) return n - 1;
    // A closed 2-vertex polyline only has a distinct closing segment when it is
    // an arc (e.g. a full circle made of two half-circle bulges).
    if (n == 2) return bulges_[1] != 0.0 ? 2 : 1;
    return n;
}

std::optional<ArcGeom> PolylineEntity::segmentArc(std::size_t i) const {
    return geom::arcFromBulge(segmentStart(i), segmentEnd(i), bulges_[i]);
}

BoundingBox PolylineEntity::bounds() const {
    BoundingBox b;
    for (const Vec2& v : vertices_) b.expand(v);
    const std::size_t n = segmentCount();
    for (std::size_t i = 0; i < n; ++i)
        if (auto a = segmentArc(i)) b.expand(geom::arcBounds(*a));
    return b;
}

double PolylineEntity::distanceTo(const Vec2& p) const {
    if (vertices_.empty()) return std::numeric_limits<double>::infinity();
    if (vertices_.size() == 1) return distance(p, vertices_.front());
    double best = std::numeric_limits<double>::infinity();
    const std::size_t n = segmentCount();
    for (std::size_t i = 0; i < n; ++i) {
        const auto arc = segmentArc(i);
        const double d = arc ? geom::distancePointToArc(p, *arc)
                             : geom::distancePointToSegment(p, segmentStart(i), segmentEnd(i));
        best = std::min(best, d);
    }
    return best;
}

bool PolylineEntity::crossesRect(const BoundingBox& rect) const {
    if (!rect.intersects(bounds())) return false;
    if (vertices_.size() == 1) return rect.contains(vertices_.front());
    const std::size_t n = segmentCount();
    for (std::size_t i = 0; i < n; ++i) {
        if (auto a = segmentArc(i)) {
            if (geom::arcIntersectsRect(*a, rect)) return true;
        } else if (geom::segmentIntersectsRect(segmentStart(i), segmentEnd(i), rect)) {
            return true;
        }
    }
    return false;
}

double PolylineEntity::length() const {
    double len = 0.0;
    const std::size_t n = segmentCount();
    for (std::size_t i = 0; i < n; ++i) {
        if (auto a = segmentArc(i)) len += a->length();
        else len += distance(segmentStart(i), segmentEnd(i));
    }
    return len;
}

double PolylineEntity::area() const {
    if (!closed_ || vertices_.size() < 2) return 0.0;
    double a = geom::polygonSignedArea(vertices_);
    const std::size_t n = segmentCount();
    for (std::size_t i = 0; i < n; ++i)
        if (auto arc = segmentArc(i)) a += geom::arcSegmentArea(*arc);
    return std::abs(a);
}

std::unique_ptr<Entity> PolylineEntity::transformed(const Affine2D& xf) const {
    const bool arcs = hasArcs();
    if (arcs && !xf.isSimilarity()) return nullptr;
    std::vector<Vec2> v;
    v.reserve(vertices_.size());
    for (const Vec2& p : vertices_) v.push_back(xf.apply(p));
    std::vector<double> b = bulges_;
    if (xf.det() < 0)
        for (double& x : b) x = -x; // mirroring reverses arc direction
    auto out = std::make_unique<PolylineEntity>(std::move(v), std::move(b), closed_);
    out->setLayer(layer());
    return out;
}

} // namespace dyncad
