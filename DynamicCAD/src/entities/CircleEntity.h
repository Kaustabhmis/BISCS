// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"

namespace dyncad {

class CircleEntity final : public Entity {
public:
    CircleEntity(const Vec2& center, double radius) : center_(center), radius_(radius) {}

    EntityType type() const override { return EntityType::Circle; }
    const char* typeName() const override { return "Circle"; }
    BoundingBox bounds() const override;
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& rect) const override;
    std::vector<Vec2> gripPoints() const override;
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;
    std::unique_ptr<Entity> clone() const override { return std::make_unique<CircleEntity>(*this); }

    const Vec2& center() const { return center_; }
    double radius() const { return radius_; }
    double diameter() const { return 2.0 * radius_; }
    double circumference() const { return 2.0 * kPi * radius_; }
    double area() const { return kPi * radius_ * radius_; }

private:
    Vec2 center_;
    double radius_;
};

} // namespace dyncad
