// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/Vec2.h"

#include <algorithm>
#include <limits>

namespace dyncad {

// Axis-aligned bounding box. A default-constructed box is empty (invalid).
struct BoundingBox {
    Vec2 min{std::numeric_limits<double>::infinity(), std::numeric_limits<double>::infinity()};
    Vec2 max{-std::numeric_limits<double>::infinity(), -std::numeric_limits<double>::infinity()};

    BoundingBox() = default;
    BoundingBox(const Vec2& a, const Vec2& b)
        : min{std::min(a.x, b.x), std::min(a.y, b.y)}, max{std::max(a.x, b.x), std::max(a.y, b.y)} {}

    bool isValid() const { return min.x <= max.x && min.y <= max.y; }

    void expand(const Vec2& p) {
        min.x = std::min(min.x, p.x); min.y = std::min(min.y, p.y);
        max.x = std::max(max.x, p.x); max.y = std::max(max.y, p.y);
    }
    void expand(const BoundingBox& b) {
        if (!b.isValid()) return;
        expand(b.min);
        expand(b.max);
    }

    double width() const { return isValid() ? max.x - min.x : 0.0; }
    double height() const { return isValid() ? max.y - min.y : 0.0; }
    Vec2 center() const { return (min + max) * 0.5; }

    bool contains(const Vec2& p) const {
        return p.x >= min.x && p.x <= max.x && p.y >= min.y && p.y <= max.y;
    }
    bool contains(const BoundingBox& b) const {
        return b.isValid() && contains(b.min) && contains(b.max);
    }
    bool intersects(const BoundingBox& b) const {
        return isValid() && b.isValid() && min.x <= b.max.x && max.x >= b.min.x &&
               min.y <= b.max.y && max.y >= b.min.y;
    }
    BoundingBox inflated(double d) const {
        if (!isValid()) return *this;
        BoundingBox r = *this;
        r.min -= Vec2{d, d};
        r.max += Vec2{d, d};
        return r;
    }
};

} // namespace dyncad
