// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/HatchEntity.h"

#include "geometry/Arc.h"
#include "geometry/Geometry.h"

#include <algorithm>
#include <cmath>
#include <limits>

namespace dyncad {

std::vector<std::string> builtinHatchNames() { return {"SOLID", "ANSI31", "ANSI32", "ANSI37", "NET", "LINE", "DASH"}; }

HatchPattern makeHatchPattern(const std::string& rawName, double scale, double angleDeg) {
    HatchPattern p;
    p.name = upperName(rawName);
    if (!(scale > 0)) scale = 1.0;
    p.scale = scale;
    p.angle = angleDeg;
    auto fam = [&](double ang, double spacing, double shift, std::vector<double> dashes = {}, Vec2 origin = {}) {
        // Lines at 'ang'; successive lines 'spacing' apart (perpendicular),
        // shifted 'shift' along the line direction.
        HatchLineFamily f;
        f.angleDeg = ang + angleDeg;
        const double r = degToRad(f.angleDeg);
        const Vec2 u{std::cos(r), std::sin(r)}, n{-u.y, u.x};
        f.origin = origin * scale;
        f.offset = (u * shift + n * spacing) * scale;
        for (double& d : dashes) d *= scale;
        f.dashes = std::move(dashes);
        p.families.push_back(f);
    };
    const double s = 3.175; // basic spacing (1/8 inch), mm at scale 1
    if (p.name == "SOLID") { p.solid = true; return p; }
    p.solid = false;
    if (p.name == "ANSI31") fam(45, s, 0);
    else if (p.name == "ANSI32") { fam(45, 3 * s, 0); fam(45, 3 * s, 0, {}, Vec2::fromPolar(s, degToRad(135))); }
    else if (p.name == "ANSI37") { fam(45, s, 0); fam(135, s, 0); }
    else if (p.name == "NET") { fam(0, s, 0); fam(90, s, 0); }
    else if (p.name == "LINE") fam(0, s, 0);
    else if (p.name == "DASH") fam(0, s, s, {s, -s});
    else { p.name = "ANSI31"; fam(45, s, 0); }
    return p;
}

HatchEntity::HatchEntity(std::vector<HatchLoop> loops, HatchPattern pattern) : loops_(std::move(loops)), pattern_(std::move(pattern)) {
    for (auto& l : loops_) l.bulges.resize(l.vertices.size(), 0.0);
}

std::vector<std::vector<Vec2>> HatchEntity::loopPolygons(double tol) const {
    std::vector<std::vector<Vec2>> out;
    for (const auto& l : loops_) {
        std::vector<Vec2> poly;
        const std::size_t n = l.vertices.size();
        for (std::size_t i = 0; i < n; ++i) {
            const Vec2 a = l.vertices[i], b = l.vertices[(i + 1) % n];
            if (auto arc = geom::arcFromBulge(a, b, l.bulges[i])) {
                auto pts = geom::tessellateArc(*arc, tol);
                poly.insert(poly.end(), pts.begin(), pts.end() - 1);
            } else {
                poly.push_back(a);
            }
        }
        if (poly.size() >= 3) out.push_back(std::move(poly));
    }
    return out;
}

BoundingBox HatchEntity::bounds() const {
    BoundingBox b;
    for (const auto& l : loops_) {
        const std::size_t n = l.vertices.size();
        for (std::size_t i = 0; i < n; ++i) {
            b.expand(l.vertices[i]);
            if (auto arc = geom::arcFromBulge(l.vertices[i], l.vertices[(i + 1) % n], l.bulges[i])) b.expand(geom::arcBounds(*arc));
        }
    }
    return b;
}

bool HatchEntity::contains(const Vec2& p) const {
    const BoundingBox b = bounds();
    if (!b.contains(p)) return false;
    bool in = false;
    for (const auto& poly : loopPolygons(std::max(b.width(), b.height()) * 1e-5)) {
        for (std::size_t i = 0, j = poly.size() - 1; i < poly.size(); j = i++)
            if (((poly[i].y > p.y) != (poly[j].y > p.y)) &&
                (p.x < (poly[j].x - poly[i].x) * (p.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x))
                in = !in;
    }
    return in;
}

double HatchEntity::area() const {
    // Signed areas of loops with arcs; even-odd: outer positive, holes subtract.
    double total = 0;
    std::vector<double> areas;
    for (const auto& l : loops_) {
        double a = geom::polygonSignedArea(l.vertices);
        const std::size_t n = l.vertices.size();
        for (std::size_t i = 0; i < n; ++i)
            if (auto arc = geom::arcFromBulge(l.vertices[i], l.vertices[(i + 1) % n], l.bulges[i])) a += geom::arcSegmentArea(*arc);
        areas.push_back(std::abs(a));
    }
    if (areas.empty()) return 0;
    const std::size_t outer = static_cast<std::size_t>(std::max_element(areas.begin(), areas.end()) - areas.begin());
    total = areas[outer];
    for (std::size_t i = 0; i < areas.size(); ++i)
        if (i != outer) total -= areas[i];
    return total;
}

double HatchEntity::distanceTo(const Vec2& p) const {
    if (contains(p)) return 0.0;
    double d = std::numeric_limits<double>::infinity();
    for (const auto& l : loops_) {
        const std::size_t n = l.vertices.size();
        for (std::size_t i = 0; i < n; ++i) {
            const Vec2 a = l.vertices[i], b = l.vertices[(i + 1) % n];
            if (auto arc = geom::arcFromBulge(a, b, l.bulges[i])) d = std::min(d, geom::distancePointToArc(p, *arc));
            else d = std::min(d, geom::distancePointToSegment(p, a, b));
        }
    }
    return d;
}

bool HatchEntity::crossesRect(const BoundingBox& r) const {
    if (!r.intersects(bounds())) return false;
    for (const auto& poly : loopPolygons(std::max(bounds().width(), bounds().height()) * 1e-5))
        for (std::size_t i = 0; i < poly.size(); ++i)
            if (geom::segmentIntersectsRect(poly[i], poly[(i + 1) % poly.size()], r)) return true;
    return contains(r.center());
}

std::vector<Vec2> HatchEntity::gripPoints() const {
    const BoundingBox b = bounds();
    return {b.center()};
}

std::unique_ptr<Entity> HatchEntity::transformed(const Affine2D& xf) const {
    const bool arcs = std::any_of(loops_.begin(), loops_.end(), [](const HatchLoop& l) {
        return std::any_of(l.bulges.begin(), l.bulges.end(), [](double b) { return b != 0.0; });
    });
    if (!xf.isSimilarity() && (arcs || !pattern_.solid)) return nullptr;
    auto out = std::make_unique<HatchEntity>(*this);
    out->cacheValid_ = false;
    for (auto& l : out->loops_) {
        for (Vec2& v : l.vertices) v = xf.apply(v);
        if (xf.det() < 0) for (double& b : l.bulges) b = -b;
    }
    const double s = xf.uniformScale();
    for (auto& f : out->pattern_.families) {
        const Vec2 u = xf.applyVector(Vec2::fromPolar(1.0, degToRad(f.angleDeg)));
        f.angleDeg = radToDeg(std::atan2(u.y, u.x));
        f.origin = xf.apply(f.origin);
        f.offset = xf.applyVector(f.offset);
        for (double& d : f.dashes) d *= s;
    }
    out->pattern_.scale *= s;
    return out;
}

const std::vector<std::pair<Vec2, Vec2>>& HatchEntity::cachedSegments(bool* truncated) const {
    if (!cacheValid_) {
        cache_ = patternSegments(20000, &cacheTruncated_);
        cacheValid_ = true;
    }
    if (truncated) *truncated = cacheTruncated_;
    return cache_;
}

std::vector<std::pair<Vec2, Vec2>> HatchEntity::patternSegments(std::size_t limit, bool* truncated) const {
    std::vector<std::pair<Vec2, Vec2>> out;
    if (truncated) *truncated = false;
    if (pattern_.solid) return out;
    const BoundingBox box = bounds();
    if (!box.isValid()) return out;
    const auto polys = loopPolygons(std::max(box.width(), box.height()) * 1e-4);
    std::size_t lines = 0;
    for (const auto& f : pattern_.families) {
        const double r = degToRad(f.angleDeg);
        const Vec2 u{std::cos(r), std::sin(r)}, n{-u.y, u.x};
        const double spacing = f.offset.dot(n);
        if (std::abs(spacing) < 1e-12) continue;
        // Range of line indices whose lines cross the bounding box.
        double kmin = 1e300, kmax = -1e300;
        for (const Vec2& c : {box.min, Vec2{box.max.x, box.min.y}, box.max, Vec2{box.min.x, box.max.y}}) {
            const double k = (c - f.origin).dot(n) / spacing;
            kmin = std::min(kmin, k);
            kmax = std::max(kmax, k);
        }
        const long long k0 = static_cast<long long>(std::floor(kmin)), k1 = static_cast<long long>(std::ceil(kmax));
        for (long long k = k0; k <= k1; ++k) {
            if (++lines > limit) { if (truncated) *truncated = true; return out; }
            const Vec2 o = f.origin + f.offset * static_cast<double>(k);
            // Intersections of the line o + u t with all loop edges.
            std::vector<double> ts;
            for (const auto& poly : polys)
                for (std::size_t i = 0; i < poly.size(); ++i) {
                    const Vec2 a = poly[i], b = poly[(i + 1) % poly.size()];
                    const double da = (a - o).dot(n), db = (b - o).dot(n);
                    if ((da > 0) == (db > 0)) continue; // same side (half-open rule avoids double counting)
                    const double t = da / (da - db);
                    ts.push_back((a + (b - a) * t - o).dot(u));
                }
            std::sort(ts.begin(), ts.end());
            for (std::size_t i = 0; i + 1 < ts.size(); i += 2) {
                const double t0 = ts[i], t1 = ts[i + 1];
                if (f.dashes.empty()) { out.emplace_back(o + u * t0, o + u * t1); continue; }
                // Dash pattern phase anchored at the family origin line.
                double plen = 0;
                for (double d : f.dashes) plen += std::abs(d);
                if (plen <= 0) { out.emplace_back(o + u * t0, o + u * t1); continue; }
                double t = std::floor(t0 / plen) * plen;
                int guard = 0;
                while (t < t1 && ++guard < 100000) {
                    for (double d : f.dashes) {
                        const double len = std::abs(d);
                        if (d > 0) {
                            const double a = std::max(t, t0), b = std::min(t + len, t1);
                            if (b > a) out.emplace_back(o + u * a, o + u * b);
                        } else if (d == 0 && t >= t0 && t <= t1) {
                            out.emplace_back(o + u * t, o + u * t);
                        }
                        t += len;
                        if (t >= t1) break;
                    }
                }
            }
        }
    }
    return out;
}

} // namespace dyncad
