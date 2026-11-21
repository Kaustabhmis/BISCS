// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/BoundingBox.h"

#include <vector>

namespace dyncad {

// Ellipse or elliptical arc in the DXF convention:
//   P(t) = center + major*cos(t) + minor*sin(t),  minor = ratio * rot90(major)
// with 0 < ratio <= 1 and the arc running counter-clockwise (increasing t)
// from startParam to endParam (radians).
struct EllipseGeom {
    Vec2 center;
    Vec2 major{1, 0};
    double ratio = 1.0;
    double startParam = 0.0;
    double endParam = 6.283185307179586;

    Vec2 minor() const { return Vec2{-major.y, major.x} * ratio; }
    Vec2 pointAt(double t) const;
    double sweep() const;      // (0, 2*pi]
    bool isFull() const;
    bool containsParam(double t, double eps = 1e-12) const;
    double majorRadius() const { return major.length(); }
    double minorRadius() const { return major.length() * ratio; }
};

namespace geom {
BoundingBox ellipseBounds(const EllipseGeom& e);
std::vector<Vec2> tessellateEllipse(const EllipseGeom& e, double tolerance, int maxSegments = 8192);
double distancePointToEllipse(const Vec2& p, const EllipseGeom& e);
bool ellipseIntersectsRect(const EllipseGeom& e, const BoundingBox& rect);
double ellipseLength(const EllipseGeom& e); // numerical, relative error < 1e-10
} // namespace geom

} // namespace dyncad
