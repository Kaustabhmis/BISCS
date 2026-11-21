// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"
#include "geometry/Arc.h"

namespace dyncad {

// Circular arc, counter-clockwise from startDeg to endDeg (degrees), the same
// convention as DXF so imported values are kept exactly.
class ArcEntity final : public Entity {
public:
    ArcEntity(const Vec2& center, double radius, double startDeg, double endDeg)
        : center_(center), radius_(radius), startDeg_(startDeg), endDeg_(endDeg) {}

    EntityType type() const override { return EntityType::Arc; }
    const char* typeName() const override { return "Arc"; }
    BoundingBox bounds() const override { return geom::arcBounds(geom()); }
    double distanceTo(const Vec2& p) const override { return geom::distancePointToArc(p, geom()); }
    bool crossesRect(const BoundingBox& rect) const override { return geom::arcIntersectsRect(geom(), rect); }
    std::vector<Vec2> gripPoints() const override;
    std::unique_ptr<Entity> clone() const override { return std::make_unique<ArcEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const Vec2& center() const { return center_; }
    double radius() const { return radius_; }
    double startDeg() const { return startDeg_; }
    double endDeg() const { return endDeg_; }
    ArcGeom geom() const { return geom::arcFromDegrees(center_, radius_, startDeg_, endDeg_); }
    double sweepDeg() const { return radToDeg(geom().sweep); }
    double length() const { return geom().length(); }

private:
    Vec2 center_;
    double radius_;
    double startDeg_;
    double endDeg_;
};

// Single point (DXF POINT). Displayed as a small fixed-size marker.
class PointEntity final : public Entity {
public:
    explicit PointEntity(const Vec2& p) : pos_(p) {}

    EntityType type() const override { return EntityType::Point; }
    const char* typeName() const override { return "Point"; }
    BoundingBox bounds() const override { return {pos_, pos_}; }
    double distanceTo(const Vec2& p) const override { return distance(p, pos_); }
    bool crossesRect(const BoundingBox& rect) const override { return rect.contains(pos_); }
    std::vector<Vec2> gripPoints() const override { return {pos_}; }
    std::unique_ptr<Entity> clone() const override { return std::make_unique<PointEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const Vec2& position() const { return pos_; }

private:
    Vec2 pos_;
};

} // namespace dyncad
