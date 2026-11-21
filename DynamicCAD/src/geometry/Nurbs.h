// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/BoundingBox.h"

#include <optional>
#include <string>
#include <vector>

namespace dyncad {

// Non-uniform rational B-spline curve (the DXF SPLINE representation).
// knots.size() == ctrl.size() + degree + 1; weights empty (non-rational) or
// the same size as ctrl. The curve is evaluated on [knots[p], knots[n]].
struct NurbsCurve {
    int degree = 3;
    std::vector<double> knots;
    std::vector<Vec2> ctrl;
    std::vector<double> weights;

    bool isValid(std::string* why = nullptr) const;
    double tMin() const { return knots[static_cast<std::size_t>(degree)]; }
    double tMax() const { return knots[ctrl.size()]; }
    Vec2 eval(double t) const;
    // Adaptive polyline approximation; deviation from the curve <= tolerance
    // (checked at segment midpoints, up to a recursion limit).
    std::vector<Vec2> tessellate(double tolerance, std::vector<double>* params = nullptr) const;
    // Parameter of the curve point closest to p, searched in [t0, t1].
    double closestParam(const Vec2& p, double t0, double t1) const;
};

namespace geom {
// Clamped curve with uniform interior knots (passes through first and last
// control points). Degree is reduced if there are too few points.
NurbsCurve clampedUniformSpline(const std::vector<Vec2>& ctrl, int degree = 3);
// Smooth closed (periodic) curve from control points.
NurbsCurve closedUniformSpline(const std::vector<Vec2>& ctrl, int degree = 3);
// Curve passing exactly through all fit points (global interpolation,
// chord-length parameters; Piegl & Tiller, The NURBS Book, A9.1).
std::optional<NurbsCurve> interpolateSpline(const std::vector<Vec2>& fitPoints, int degree = 3);
} // namespace geom

} // namespace dyncad
