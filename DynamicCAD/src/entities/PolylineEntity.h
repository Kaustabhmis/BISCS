// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"

namespace dyncad {

// Straight-segment polyline (arc segments / bulges are planned for Phase 2).
// RECTANGLE produces a closed 4-vertex polyline, matching common CAD practice.
class PolylineEntity final : public Entity {
public:
    PolylineEntity(std::vector<Vec2> vertices, bool closed) : vertices_(std::move(vertices)), closed_(closed) {}

    EntityType type() const override { return EntityType::Polyline; }
    const char* typeName() const override { return "Polyline"; }
    BoundingBox bounds() const override;
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& rect) const override;
    std::vector<Vec2> gripPoints() const override { return vertices_; }
    std::unique_ptr<Entity> clone() const override { return std::make_unique<PolylineEntity>(*this); }

    const std::vector<Vec2>& vertices() const { return vertices_; }
    bool isClosed() const { return closed_; }
    std::size_t segmentCount() const;
    double length() const;
    // Enclosed area (absolute). Only meaningful for closed polylines; 0 otherwise.
    double area() const;

private:
    std::vector<Vec2> vertices_;
    bool closed_;
};

} // namespace dyncad
