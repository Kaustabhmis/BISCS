// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/BoundingBox.h"

#include <optional>
#include <vector>

namespace dyncad {

// Circular arc: centre, radius, start angle and signed sweep (radians,
// positive = counter-clockwise). |sweep| <= 2*pi.
struct ArcGeom {
    Vec2 center;
    double radius = 0.0;
    double startAngle = 0.0;
    double sweep = 0.0;

    Vec2 pointAtAngle(double ang) const { return center + Vec2::fromPolar(radius, ang); }
    Vec2 startPoint() const { return pointAtAngle(startAngle); }
    Vec2 endPoint() const { return pointAtAngle(startAngle + sweep); }
    double length() const;
    // True if direction 'ang' lies on the arc (inclusive of end points).
    bool containsAngle(double ang, double eps = 1e-12) const;
};

namespace geom {

// Normalises an angle (radians) into [0, 2*pi).
double normalizeAngle(double rad);

// Arc segment of a polyline from p1 to p2 with DXF bulge = tan(sweep/4).
std::optional<ArcGeom> arcFromBulge(const Vec2& p1, const Vec2& p2, double bulge);
// Counter-clockwise arc from startDeg to endDeg (degrees), sweep in (0, 360].
ArcGeom arcFromDegrees(const Vec2& center, double radius, double startDeg, double endDeg);

BoundingBox arcBounds(const ArcGeom& arc);
double distancePointToArc(const Vec2& p, const ArcGeom& arc);
bool arcIntersectsRect(const ArcGeom& arc, const BoundingBox& rect);
// Signed area between the chord and the arc (positive for CCW sweep).
double arcSegmentArea(const ArcGeom& arc);
// Points along the arc with chord deviation <= tolerance (same units as radius).
std::vector<Vec2> tessellateArc(const ArcGeom& arc, double tolerance, int maxSegments = 4096);

} // namespace geom
} // namespace dyncad
