// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/BoundingBox.h"
#include "geometry/Vec2.h"

#include <optional>
#include <utility>
#include <vector>

// Pure 2D computational geometry used by entities, selection, snapping and rendering.
// No GUI dependencies so every function is unit-testable.
namespace dyncad::geom {

inline constexpr double kEpsilon = 1e-9;

Vec2 closestPointOnSegment(const Vec2& p, const Vec2& a, const Vec2& b);
double distancePointToSegment(const Vec2& p, const Vec2& a, const Vec2& b);

// Clips segment a-b to rect (Liang-Barsky). Returns nullopt if fully outside.
std::optional<std::pair<Vec2, Vec2>> clipSegment(const Vec2& a, const Vec2& b, const BoundingBox& rect);
bool segmentIntersectsRect(const Vec2& a, const Vec2& b, const BoundingBox& rect);

// True if the circle *curve* (not the disc) touches the closed rectangle region.
bool circleIntersectsRect(const Vec2& center, double radius, const BoundingBox& rect);

// Circle through three points: returns {center, radius}, or nullopt if collinear.
std::optional<std::pair<Vec2, double>> circleFrom3Points(const Vec2& a, const Vec2& b, const Vec2& c);

// Shoelace formula. Positive for counter-clockwise vertex order.
double polygonSignedArea(const std::vector<Vec2>& vertices);
double polylineLength(const std::vector<Vec2>& vertices, bool closed);

// Constrains p to the horizontal or vertical line through base (ORTHO mode).
Vec2 orthoConstrain(const Vec2& base, const Vec2& p);
Vec2 snapToGrid(const Vec2& p, double step);

// Picks a "nice" grid step (1, 2, 5 x 10^n world units) so that grid lines
// are at least minPixelSpacing pixels apart at the given zoom.
double gridStepForScale(double pixelsPerUnit, double minPixelSpacing);

// Angle of vector (b - a) in degrees, normalised to [0, 360).
double angleDeg(const Vec2& a, const Vec2& b);

} // namespace dyncad::geom
