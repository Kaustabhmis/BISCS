// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include "geometry/Vec2.h"

#include <algorithm>
#include <cmath>

namespace dyncad {

// 2D affine transform:  x' = a*x + c*y + tx,   y' = b*x + d*y + ty.
// Used for block insertion (DXF INSERT), OCS->WCS mapping and, later,
// MOVE / ROTATE / SCALE / MIRROR.
struct Affine2D {
    double a = 1, b = 0, c = 0, d = 1, tx = 0, ty = 0;

    Vec2 apply(const Vec2& p) const { return {a * p.x + c * p.y + tx, b * p.x + d * p.y + ty}; }
    Vec2 applyVector(const Vec2& v) const { return {a * v.x + c * v.y, b * v.x + d * v.y}; }

    // Composition: (L * R).apply(p) == L.apply(R.apply(p)).
    Affine2D operator*(const Affine2D& r) const {
        Affine2D o;
        o.a = a * r.a + c * r.b;
        o.b = b * r.a + d * r.b;
        o.c = a * r.c + c * r.d;
        o.d = b * r.c + d * r.d;
        o.tx = a * r.tx + c * r.ty + tx;
        o.ty = b * r.tx + d * r.ty + ty;
        return o;
    }

    double det() const { return a * d - b * c; }
    bool isIdentity() const { return a == 1 && b == 0 && c == 0 && d == 1 && tx == 0 && ty == 0; }
    // True if the transform preserves circles (uniform scale, rotation,
    // translation, optional mirror).
    bool isSimilarity(double relEps = 1e-9) const {
        const double l1 = std::hypot(a, b), l2 = std::hypot(c, d);
        if (!(l1 > 0) || !(l2 > 0)) return false;
        const double tol = relEps * std::max(l1, l2);
        return std::abs(l1 - l2) <= tol && std::abs(a * c + b * d) <= tol * std::max(l1, l2);
    }
    double uniformScale() const { return std::sqrt(std::abs(det())); }

    static Affine2D translation(const Vec2& t) { Affine2D m; m.tx = t.x; m.ty = t.y; return m; }
    static Affine2D scaling(double sx, double sy) { Affine2D m; m.a = sx; m.d = sy; return m; }
    static Affine2D rotation(double rad) {
        Affine2D m;
        const double cs = std::cos(rad), sn = std::sin(rad);
        m.a = cs; m.b = sn; m.c = -sn; m.d = cs;
        return m;
    }
    // Exact rotation for multiples of 90 degrees (avoids cos(90) = 6e-17 noise).
    static Affine2D rotationDeg(double deg);
};

inline Affine2D Affine2D::rotationDeg(double deg) {
    const double r = std::fmod(deg, 360.0);
    const double n = r < 0 ? r + 360.0 : r;
    Affine2D m;
    if (n == 0.0) return m;
    if (n == 90.0) { m.a = 0; m.b = 1; m.c = -1; m.d = 0; return m; }
    if (n == 180.0) { m.a = -1; m.d = -1; return m; }
    if (n == 270.0) { m.a = 0; m.b = -1; m.c = 1; m.d = 0; return m; }
    return rotation(degToRad(deg));
}

} // namespace dyncad
