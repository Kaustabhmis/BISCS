// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"

#include <optional>
#include <utility>

namespace dyncad {

// Construction line through 'base' along 'dir' (unit vector): infinite in both
// directions (XLINE) or from base onwards (RAY).
class XLineEntity final : public Entity {
public:
    XLineEntity(const Vec2& base, const Vec2& dir, bool ray) : base_(base), dir_(dir.normalized()), ray_(ray) {}

    EntityType type() const override { return EntityType::XLine; }
    const char* typeName() const override { return ray_ ? "Ray" : "Construction line"; }
    BoundingBox bounds() const override { return {base_, base_}; }
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& rect) const override;
    bool insideRect(const BoundingBox&) const override { return false; } // never fully inside
    bool isInfinite() const override { return true; }
    std::vector<Vec2> gripPoints() const override { return {base_}; }
    std::unique_ptr<Entity> clone() const override { return std::make_unique<XLineEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const Vec2& base() const { return base_; }
    const Vec2& direction() const { return dir_; }
    bool isRay() const { return ray_; }
    double tMin() const;
    // Visible part inside rect (for drawing / primitives).
    std::optional<std::pair<Vec2, Vec2>> clipped(const BoundingBox& rect) const;

private:
    Vec2 base_, dir_;
    bool ray_;
};

} // namespace dyncad
