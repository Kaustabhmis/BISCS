// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"
#include "geometry/Intersections.h"

#include <vector>

namespace dyncad {

// Decomposes an entity into segments and arcs. Lines, circles, arcs and
// polylines are exact; ellipses and splines are approximated to within
// relTol * (entity size) and marked approximate. Only primitives whose bounds
// meet 'region' are returned (pass an invalid box for all).
std::vector<Primitive> entityPrimitives(const Entity& e, const BoundingBox& region = BoundingBox(), double relTol = 1e-7);

// Key points of an entity used by object snaps.
struct EntityKeyPoints {
    std::vector<Vec2> endpoints, midpoints, centers, quadrants, nodes;
};
EntityKeyPoints entityKeyPoints(const Entity& e);

} // namespace dyncad
