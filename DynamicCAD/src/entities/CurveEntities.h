// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "entities/Entity.h"
#include "geometry/Ellipse.h"
#include "geometry/Nurbs.h"

namespace dyncad {

// Ellipse or elliptical arc (DXF ELLIPSE convention, see EllipseGeom).
class EllipseEntity final : public Entity {
public:
    explicit EllipseEntity(const EllipseGeom& g) : g_(g) {}

    EntityType type() const override { return EntityType::Ellipse; }
    const char* typeName() const override { return g_.isFull() ? "Ellipse" : "Elliptical arc"; }
    BoundingBox bounds() const override { return geom::ellipseBounds(g_); }
    double distanceTo(const Vec2& p) const override { return geom::distancePointToEllipse(p, g_); }
    bool crossesRect(const BoundingBox& r) const override { return geom::ellipseIntersectsRect(g_, r); }
    std::vector<Vec2> gripPoints() const override;
    std::unique_ptr<Entity> clone() const override { return std::make_unique<EllipseEntity>(*this); }
    // Any affine transform maps an ellipse to an ellipse, so this never fails
    // for non-degenerate transforms (also used for circles in stretched blocks).
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const EllipseGeom& geom() const { return g_; }
    double length() const { return geom::ellipseLength(g_); }
    double area() const { return g_.isFull() ? kPi * g_.majorRadius() * g_.minorRadius() : 0.0; }

private:
    EllipseGeom g_;
};

// NURBS spline (DXF SPLINE). Hit-testing finds the nearest segment of a cached
// approximation, then refines on the exact curve; rendering is re-tessellated per zoom.
class SplineEntity final : public Entity {
public:
    explicit SplineEntity(NurbsCurve c);

    EntityType type() const override { return EntityType::Spline; }
    const char* typeName() const override { return "Spline"; }
    BoundingBox bounds() const override { return bounds_; }
    double distanceTo(const Vec2& p) const override;
    bool crossesRect(const BoundingBox& r) const override;
    std::vector<Vec2> gripPoints() const override { return curve_.ctrl; }
    std::unique_ptr<Entity> clone() const override { return std::make_unique<SplineEntity>(*this); }
    std::unique_ptr<Entity> transformed(const Affine2D& xf) const override;

    const NurbsCurve& curve() const { return curve_; }
    const std::vector<Vec2>& approximation() const { return pts_; }
    double length() const;
    bool isClosed() const;

private:
    NurbsCurve curve_;
    std::vector<Vec2> pts_;
    std::vector<double> params_; // curve parameter of each pts_ entry
    BoundingBox bounds_;
};

} // namespace dyncad
