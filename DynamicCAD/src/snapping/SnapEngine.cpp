// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "snapping/SnapEngine.h"

#include "entities/EntityGeometry.h"
#include "geometry/Geometry.h"

#include <cmath>
#include <limits>

namespace dyncad {

const char* snapModeName(SnapMode m) {
    switch (m) {
    case SnapEndpoint: return "Endpoint";
    case SnapMidpoint: return "Midpoint";
    case SnapCenter: return "Center";
    case SnapQuadrant: return "Quadrant";
    case SnapIntersection: return "Intersection";
    case SnapPerpendicular: return "Perpendicular";
    case SnapTangent: return "Tangent";
    case SnapNearest: return "Nearest";
    case SnapNode: return "Node";
    default: return "";
    }
}

std::optional<SnapMode> snapModeFromKeyword(const std::string& kw) {
    if (kw == "END" || kw == "ENDP") return SnapEndpoint;
    if (kw == "MID") return SnapMidpoint;
    if (kw == "CEN") return SnapCenter;
    if (kw == "QUA") return SnapQuadrant;
    if (kw == "INT") return SnapIntersection;
    if (kw == "PER") return SnapPerpendicular;
    if (kw == "TAN") return SnapTangent;
    if (kw == "NEA") return SnapNearest;
    if (kw == "NOD") return SnapNode;
    return std::nullopt;
}

namespace {

// Lower rank wins when two candidates are about equally close.
int rank(SnapMode m) {
    switch (m) {
    case SnapEndpoint: case SnapIntersection: case SnapNode: return 0;
    case SnapCenter: return 1;
    case SnapMidpoint: case SnapQuadrant: return 2;
    case SnapPerpendicular: case SnapTangent: return 3;
    default: return 4; // nearest
    }
}

struct Best {
    std::optional<SnapResult> r;
    double score = std::numeric_limits<double>::infinity();
    int rk = 99;
    void offer(const Vec2& p, SnapMode m, EntityId id, double dist, double aperture) {
        if (dist > aperture) return;
        const int rr = rank(m);
        // Precise snaps beat "nearest"; otherwise closest wins, rank breaks near-ties.
        const bool better = !r || (rr < 4 && rk == 4) || ((rr == 4) == (rk == 4) && (dist < score - aperture * 0.05 || (std::abs(dist - score) <= aperture * 0.05 && rr < rk)));
        if (better) { r = SnapResult{p, m, id}; score = dist; rk = rr; }
    }
};

} // namespace

std::optional<SnapResult> SnapEngine::find(const Document& doc, const Vec2& cursor, double aperture, std::uint32_t modes,
                                           const std::optional<Vec2>& base) const {
    if (modes == 0 || !(aperture > 0)) return std::nullopt;
    const BoundingBox probe(cursor - Vec2{aperture, aperture}, cursor + Vec2{aperture, aperture});
    Best best;
    struct Near { EntityId id; std::vector<Primitive> prims; };
    std::vector<Near> nearby;

    for (const auto& ep : doc.entities()) {
        const Entity& e = *ep;
        const BoundingBox b = e.bounds();
        // Every snap point of an entity (centres included) lies inside its bounds.
        if (!e.isInfinite() && !probe.intersects(b)) continue;
        const bool curveNear = e.distanceTo(cursor) <= aperture;
        const EntityKeyPoints k = entityKeyPoints(e);
        if (modes & SnapCenter) {
            // Centre snaps when hovering over the curve or near the centre itself.
            for (const Vec2& c : k.centers) {
                const double d = distance(c, cursor);
                if (d <= aperture) best.offer(c, SnapCenter, e.id(), d, aperture);
                else if (curveNear) best.offer(c, SnapCenter, e.id(), aperture * 0.5, aperture);
            }
        }
        auto offerAll = [&](const std::vector<Vec2>& pts, SnapMode m) {
            if (!(modes & m)) return;
            for (const Vec2& p : pts) best.offer(p, m, e.id(), distance(p, cursor), aperture);
        };
        offerAll(k.endpoints, SnapEndpoint);
        offerAll(k.midpoints, SnapMidpoint);
        offerAll(k.quadrants, SnapQuadrant);
        offerAll(k.nodes, SnapNode);
        if (!curveNear) continue;
        Near n{e.id(), entityPrimitives(e, probe)};
        if (n.prims.empty()) continue;
        for (const Primitive& p : n.prims) {
            if (modes & SnapNearest) {
                const Vec2 q = p.closestPoint(cursor);
                best.offer(q, SnapNearest, e.id(), distance(q, cursor), aperture);
            }
            if (base && (modes & SnapPerpendicular)) {
                std::optional<Vec2> foot;
                if (p.kind == Primitive::Kind::Segment) {
                    const Vec2 d = p.b - p.a;
                    if (d.lengthSquared() > 0) {
                        const double t = (*base - p.a).dot(d) / d.lengthSquared();
                        if (t >= 0 && t <= 1) foot = p.a + d * t;
                    }
                } else if (!nearlyEqual(*base, p.arc.center, 0.0)) {
                    for (double sgn : {1.0, -1.0}) {
                        const Vec2 q = p.arc.center + (*base - p.arc.center).normalized() * (p.arc.radius * sgn);
                        if (p.arc.containsAngle(std::atan2(q.y - p.arc.center.y, q.x - p.arc.center.x), 1e-9) &&
                            (!foot || distance(q, cursor) < distance(*foot, cursor)))
                            foot = q;
                    }
                }
                if (foot) best.offer(*foot, SnapPerpendicular, e.id(), distance(*foot, cursor), aperture);
            }
            if (base && (modes & SnapTangent) && p.kind == Primitive::Kind::Arc && !p.approximate) {
                for (const Vec2& t : geom::tangentPoints(*base, p.arc.center, p.arc.radius))
                    if (p.arc.containsAngle(std::atan2(t.y - p.arc.center.y, t.x - p.arc.center.x), 1e-9))
                        best.offer(t, SnapTangent, e.id(), distance(t, cursor), aperture);
            }
        }
        nearby.push_back(std::move(n));
    }

    if (modes & SnapIntersection) {
        // Pairs of different entities, plus non-adjacent pieces of one polyline.
        for (std::size_t i = 0; i < nearby.size(); ++i)
            for (std::size_t j = i; j < nearby.size(); ++j)
                for (std::size_t a = 0; a < nearby[i].prims.size(); ++a)
                    for (std::size_t b = (i == j ? a + 2 : 0); b < nearby[j].prims.size(); ++b)
                        for (const Vec2& x : geom::intersect(nearby[i].prims[a], nearby[j].prims[b]))
                            best.offer(x, SnapIntersection, nearby[i].id, distance(x, cursor), aperture);
    }
    return best.r;
}

std::optional<PolarResult> polarTrack(const Vec2& base, const Vec2& cursor, double incrementDeg, double tolWorld) {
    const Vec2 d = cursor - base;
    const double len = d.length();
    if (!(incrementDeg > 0) || len <= tolWorld) return std::nullopt;
    const double ang = geom::angleDeg(base, cursor);
    const double k = std::round(ang / incrementDeg);
    const double snapped = std::fmod(k * incrementDeg, 360.0);
    const Vec2 u = Vec2::fromPolar(1.0, degToRad(snapped));
    const double along = d.dot(u);
    if (along <= 0) return std::nullopt;
    if (std::abs(u.cross(d)) > tolWorld) return std::nullopt;
    // Exact axis directions avoid cos(90 deg) = 6e-17 noise.
    Vec2 dir = u;
    if (std::fmod(snapped, 90.0) == 0.0) {
        const int q = static_cast<int>(snapped / 90.0) % 4;
        dir = q == 0 ? Vec2{1, 0} : q == 1 ? Vec2{0, 1} : q == 2 ? Vec2{-1, 0} : Vec2{0, -1};
    }
    return PolarResult{base + dir * along, snapped};
}

} // namespace dyncad
