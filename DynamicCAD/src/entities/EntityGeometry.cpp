// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "entities/EntityGeometry.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "entities/XLineEntity.h"

#include <cmath>

namespace dyncad {

namespace {
bool keep(const Primitive& p, const BoundingBox& region) { return !region.isValid() || region.intersects(p.bounds()); }

void addPolyPoints(const std::vector<Vec2>& pts, std::vector<Primitive>& out, const BoundingBox& region) {
    for (std::size_t i = 1; i < pts.size(); ++i) {
        if (region.isValid() && !region.intersects(BoundingBox(pts[i - 1], pts[i]))) continue;
        Primitive p = Primitive::segment(pts[i - 1], pts[i]);
        p.approximate = true;
        out.push_back(p);
    }
}
} // namespace

std::vector<Primitive> entityPrimitives(const Entity& e, const BoundingBox& region, double relTol) {
    std::vector<Primitive> out;
    switch (e.type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(e);
        Primitive p = Primitive::segment(l.start(), l.end());
        if (keep(p, region)) out.push_back(p);
        break;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(e);
        ArcGeom g{c.center(), c.radius(), 0.0, 2.0 * kPi};
        Primitive p = Primitive::fromArc(g);
        if (keep(p, region)) out.push_back(p);
        break;
    }
    case EntityType::Arc: {
        Primitive p = Primitive::fromArc(static_cast<const ArcEntity&>(e).geom());
        if (keep(p, region)) out.push_back(p);
        break;
    }
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(e);
        for (std::size_t i = 0; i < pl.segmentCount(); ++i) {
            Primitive p = pl.segmentArc(i) ? Primitive::fromArc(*pl.segmentArc(i)) : Primitive::segment(pl.segmentStart(i), pl.segmentEnd(i));
            if (keep(p, region)) out.push_back(p);
        }
        break;
    }
    case EntityType::Ellipse: {
        const EllipseGeom& g = static_cast<const EllipseEntity&>(e).geom();
        addPolyPoints(geom::tessellateEllipse(g, g.majorRadius() * relTol, 1 << 16), out, region);
        break;
    }
    case EntityType::Spline:
        addPolyPoints(static_cast<const SplineEntity&>(e).approximation(), out, region);
        break;
    case EntityType::XLine: {
        const auto& x = static_cast<const XLineEntity&>(e);
        // Unbounded: clip to the region, or to a very large box around the base.
        const BoundingBox box = region.isValid() ? region : BoundingBox(x.base() - Vec2{1e9, 1e9}, x.base() + Vec2{1e9, 1e9});
        if (auto c = x.clipped(box)) out.push_back(Primitive::segment(c->first, c->second));
        break;
    }
    case EntityType::Point:
        break;
    }
    return out;
}

EntityKeyPoints entityKeyPoints(const Entity& e) {
    EntityKeyPoints k;
    auto quads = [&](const Vec2& c, double r, const ArcGeom* arc) {
        for (int q = 0; q < 4; ++q) {
            const double a = q * kPi / 2.0;
            if (!arc || arc->containsAngle(a)) k.quadrants.push_back(c + Vec2::fromPolar(r, a));
        }
    };
    switch (e.type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(e);
        k.endpoints = {l.start(), l.end()};
        k.midpoints = {(l.start() + l.end()) * 0.5};
        break;
    }
    case EntityType::Circle: {
        const auto& c = static_cast<const CircleEntity&>(e);
        k.centers = {c.center()};
        quads(c.center(), c.radius(), nullptr);
        break;
    }
    case EntityType::Arc: {
        const ArcGeom g = static_cast<const ArcEntity&>(e).geom();
        k.endpoints = {g.startPoint(), g.endPoint()};
        k.midpoints = {g.pointAtAngle(g.startAngle + g.sweep / 2.0)};
        k.centers = {g.center};
        quads(g.center, g.radius, &g);
        break;
    }
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(e);
        k.endpoints = pl.vertices();
        for (std::size_t i = 0; i < pl.segmentCount(); ++i) {
            if (auto a = pl.segmentArc(i)) {
                k.midpoints.push_back(a->pointAtAngle(a->startAngle + a->sweep / 2.0));
                k.centers.push_back(a->center);
                quads(a->center, a->radius, &*a);
            } else {
                k.midpoints.push_back((pl.segmentStart(i) + pl.segmentEnd(i)) * 0.5);
            }
        }
        if (pl.isClosed() && pl.vertices().size() >= 3 && !pl.hasArcs()) { // centroid of closed straight shapes
            double a2 = 0, cx = 0, cy = 0;
            const auto& v = pl.vertices();
            for (std::size_t i = 0; i < v.size(); ++i) {
                const Vec2& p = v[i];
                const Vec2& q = v[(i + 1) % v.size()];
                const double cr = p.cross(q);
                a2 += cr;
                cx += (p.x + q.x) * cr;
                cy += (p.y + q.y) * cr;
            }
            if (std::abs(a2) > 0) k.centers.push_back({cx / (3 * a2), cy / (3 * a2)});
        }
        break;
    }
    case EntityType::Ellipse: {
        const EllipseGeom& g = static_cast<const EllipseEntity&>(e).geom();
        k.centers = {g.center};
        for (double t : {0.0, kPi / 2, kPi, 3 * kPi / 2})
            if (g.containsParam(t)) k.quadrants.push_back(g.pointAt(t));
        if (!g.isFull()) {
            k.endpoints = {g.pointAt(g.startParam), g.pointAt(g.startParam + g.sweep())};
            k.midpoints = {g.pointAt(g.startParam + g.sweep() / 2)};
        }
        break;
    }
    case EntityType::Spline: {
        const auto& s = static_cast<const SplineEntity&>(e);
        const auto& a = s.approximation();
        if (!a.empty() && !s.isClosed()) k.endpoints = {a.front(), a.back()};
        break;
    }
    case EntityType::Point:
        k.nodes = {static_cast<const PointEntity&>(e).position()};
        break;
    case EntityType::XLine: {
        const auto& x = static_cast<const XLineEntity&>(e);
        if (x.isRay()) k.endpoints = {x.base()};
        else k.midpoints = {x.base()};
        break;
    }
    }
    return k;
}

} // namespace dyncad
