// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"
#include "geometry/Arc.h"

#include <optional>

namespace dyncad {

// Polyline of straight and circular-arc segments. bulge[i] describes the
// segment from vertex i to vertex i+1 (DXF convention: bulge = tan(sweep/4),
// 0 = straight, positive = counter-clockwise). RECTANGLE produces a closed
// 4-vertex polyline, matching common CAD practice.
class PolylineEntity final : public Entity {
public:
    PolylineEntity(std::vector<Vec2> vertices, bool closed);
    PolylineEntity(std::vector<Vec2> vertices, std::vector<double> bulges, bool closed);

    EntityType type() const override { return EntityType::Polyline; }
    const char* typeName() const override { return "Polyline"; }
    BoundingBox bounds() const override;
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& rect) const override;
    std::vector<Vec2> gripPoints() const override { return vertices_; }
    std::unique_ptr<Entity> clone() const override { return std::make_unique<PolylineEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const std::vector<Vec2>& vertices() const { return vertices_; }
    const std::vector<double>& bulges() const { return bulges_; }
    bool hasArcs() const;
    bool isClosed() const { return closed_; }
    std::size_t segmentCount() const;
    // Segment i as an arc, or nullopt if it is straight.
    std::optional<ArcGeom> segmentArc(std::size_t i) const;
    Vec2 segmentStart(std::size_t i) const { return vertices_[i]; }
    Vec2 segmentEnd(std::size_t i) const { return vertices_[(i + 1) % vertices_.size()]; }
    double length() const;
    // Enclosed area (absolute), including arc segments. 0 for open polylines.
    double area() const;

private:
    std::vector<Vec2> vertices_;
    std::vector<double> bulges_; // same size as vertices_
    bool closed_;
};

} // namespace dyncad
