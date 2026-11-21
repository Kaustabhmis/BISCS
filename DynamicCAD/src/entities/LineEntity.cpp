// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/LineEntity.h"

#include "geometry/Geometry.h"

namespace dyncad {

double LineEntity::distanceTo(const Vec2& p) const { return geom::distancePointToSegment(p, start_, end_); }

bool LineEntity::crossesRect(const BoundingBox& rect) const { return geom::segmentIntersectsRect(start_, end_, rect); }

std::vector<Vec2> LineEntity::gripPoints() const { return {start_, (start_ + end_) * 0.5, end_}; }

double LineEntity::angleDeg() const { return geom::angleDeg(start_, end_); }

} // namespace dyncad

namespace dyncad {
std::unique_ptr<Entity> LineEntity::transformed(const Affine2D& xf) const {
    auto e = std::make_unique<LineEntity>(xf.apply(start_), xf.apply(end_));
    e->setLayer(layer());
    return e;
}
} // namespace dyncad
