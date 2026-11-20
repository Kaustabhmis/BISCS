// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/CircleEntity.h"

#include "geometry/Geometry.h"

#include <cmath>

namespace dyncad {

BoundingBox CircleEntity::bounds() const {
    return {center_ - Vec2{radius_, radius_}, center_ + Vec2{radius_, radius_}};
}

double CircleEntity::distanceTo(const Vec2& p) const { return std::abs(distance(p, center_) - radius_); }

bool CircleEntity::crossesRect(const BoundingBox& rect) const {
    return geom::circleIntersectsRect(center_, radius_, rect);
}

std::vector<Vec2> CircleEntity::gripPoints() const {
    return {center_, center_ + Vec2{radius_, 0}, center_ + Vec2{0, radius_}, center_ - Vec2{radius_, 0},
            center_ - Vec2{0, radius_}};
}

} // namespace dyncad
