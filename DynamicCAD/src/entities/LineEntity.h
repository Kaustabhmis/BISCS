// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"

namespace dyncad {

class LineEntity final : public Entity {
public:
    LineEntity(const Vec2& start, const Vec2& end) : start_(start), end_(end) {}

    EntityType type() const override { return EntityType::Line; }
    const char* typeName() const override { return "Line"; }
    BoundingBox bounds() const override { return {start_, end_}; }
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& rect) const override;
    std::vector<Vec2> gripPoints() const override;
    std::unique_ptr<Entity> clone() const override { return std::make_unique<LineEntity>(*this); }

    const Vec2& start() const { return start_; }
    const Vec2& end() const { return end_; }
    double length() const { return distance(start_, end_); }
    double angleDeg() const;

private:
    Vec2 start_;
    Vec2 end_;
};

} // namespace dyncad
