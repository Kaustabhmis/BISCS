// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#pragma once

#include <cmath>

namespace dyncad {

inline constexpr double kPi = 3.14159265358979323846;

inline constexpr double degToRad(double deg) { return deg * kPi / 180.0; }
inline constexpr double radToDeg(double rad) { return rad * 180.0 / kPi; }

// 2D vector / point in drawing (world) units. Always double precision.
struct Vec2 {
    double x = 0.0;
    double y = 0.0;

    constexpr Vec2() = default;
    constexpr Vec2(double xv, double yv) : x(xv), y(yv) {}

    constexpr Vec2 operator+(const Vec2& o) const { return {x + o.x, y + o.y}; }
    constexpr Vec2 operator-(const Vec2& o) const { return {x - o.x, y - o.y}; }
    constexpr Vec2 operator-() const { return {-x, -y}; }
    constexpr Vec2 operator*(double s) const { return {x * s, y * s}; }
    constexpr Vec2 operator/(double s) const { return {x / s, y / s}; }
    Vec2& operator+=(const Vec2& o) { x += o.x; y += o.y; return *this; }
    Vec2& operator-=(const Vec2& o) { x -= o.x; y -= o.y; return *this; }
    constexpr bool operator==(const Vec2& o) const { return x == o.x && y == o.y; }
    constexpr bool operator!=(const Vec2& o) const { return !(*this == o); }

    constexpr double dot(const Vec2& o) const { return x * o.x + y * o.y; }
    constexpr double cross(const Vec2& o) const { return x * o.y - y * o.x; }
    constexpr double lengthSquared() const { return x * x + y * y; }
    double length() const { return std::hypot(x, y); }
    Vec2 normalized() const {
        const double len = length();
        return len > 0.0 ? Vec2{x / len, y / len} : Vec2{};
    }
    bool isFinite() const { return std::isfinite(x) && std::isfinite(y); }

    static Vec2 fromPolar(double length, double angleRad) {
        return {length * std::cos(angleRad), length * std::sin(angleRad)};
    }
};

constexpr Vec2 operator*(double s, const Vec2& v) { return v * s; }

inline double distance(const Vec2& a, const Vec2& b) { return (b - a).length(); }

inline bool nearlyEqual(const Vec2& a, const Vec2& b, double eps = 1e-9) {
    return std::abs(a.x - b.x) <= eps && std::abs(a.y - b.y) <= eps;
}

} // namespace dyncad
