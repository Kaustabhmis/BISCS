// DYNAMIC CAD - Copyright (c) Dynamic Engineers. All rights reserved.
#include "commands/CurveEdit.h"

#include "entities/ArcEntity.h"
#include "entities/CircleEntity.h"
#include "entities/CurveEntities.h"
#include "entities/EntityGeometry.h"
#include "entities/LineEntity.h"
#include "entities/PolylineEntity.h"
#include "entities/XLineEntity.h"
#include "geometry/Geometry.h"

#include <algorithm>
#include <cmath>
#include <limits>

namespace dyncad {

namespace {
constexpr double kParamEps = 1e-9;

double angleOf(const Vec2& c, const Vec2& p) { return std::atan2(p.y - c.y, p.x - c.x); }

// Fraction t of point p (on the primitive) along it.
double fractionOn(const Primitive& pr, const Vec2& p) {
    if (pr.kind == Primitive::Kind::Segment) {
        const Vec2 d = pr.b - pr.a;
        const double l2 = d.lengthSquared();
        return l2 > 0 ? std::clamp((p - pr.a).dot(d) / l2, 0.0, 1.0) : 0.0;
    }
    const ArcGeom& g = pr.arc;
    double rel = angleOf(g.center, p) - g.startAngle;
    if (g.sweep >= 0) { rel = geom::normalizeAngle(rel); if (rel > g.sweep + 1e-12 && 2 * kPi - rel < 1e-9) rel = 0; }
    else { rel = -geom::normalizeAngle(-rel); if (-rel > -g.sweep + 1e-12 && 2 * kPi + rel < 1e-9) rel = 0; }
    return std::clamp(rel / g.sweep, 0.0, 1.0);
}

Vec2 pointOn(const Primitive& pr, double t) {
    if (pr.kind == Primitive::Kind::Segment) return pr.a + (pr.b - pr.a) * t;
    return pr.arc.pointAtAngle(pr.arc.startAngle + pr.arc.sweep * t);
}

Primitive subPrim(const Primitive& pr, double t0, double t1) {
    if (pr.kind == Primitive::Kind::Segment) return Primitive::segment(pointOn(pr, t0), pointOn(pr, t1));
    ArcGeom g = pr.arc;
    g.startAngle = pr.arc.startAngle + pr.arc.sweep * t0;
    g.sweep = pr.arc.sweep * (t1 - t0);
    return Primitive::fromArc(g);
}

EntityPtr arcEntityFrom(const ArcGeom& g) {
    double s = radToDeg(g.startAngle), e = radToDeg(g.startAngle + g.sweep);
    if (g.sweep < 0) std::swap(s, e);
    return std::make_shared<ArcEntity>(g.center, g.radius, s, e);
}

EntityPtr polylineFrom(const std::vector<Primitive>& prims, bool closed) {
    std::vector<Vec2> v;
    std::vector<double> b;
    for (const Primitive& p : prims) {
        const Vec2 s = p.kind == Primitive::Kind::Segment ? p.a : p.arc.startPoint();
        if (v.empty() || !nearlyEqual(v.back(), s, 0.0)) { v.push_back(s); b.push_back(0.0); }
        b.back() = p.kind == Primitive::Kind::Arc ? std::tan(p.arc.sweep / 4.0) : 0.0;
        v.push_back(p.kind == Primitive::Kind::Segment ? p.b : p.arc.endPoint());
        b.push_back(0.0);
    }
    if (closed && v.size() > 2 && nearlyEqual(v.front(), v.back(), 1e-12)) { v.pop_back(); b.pop_back(); }
    return std::make_shared<PolylineEntity>(std::move(v), std::move(b), closed);
}
} // namespace

// ================================================================ EditPath

Vec2 EditPath::pointAt(double u) const {
    const double n = length();
    if (closed) { u = std::fmod(u, n); if (u < 0) u += n; }
    u = std::clamp(u, 0.0, n);
    std::size_t i = std::min(static_cast<std::size_t>(u), prims.size() - 1);
    return pointOn(prims[i], u - static_cast<double>(i));
}

double EditPath::paramOf(const Vec2& p) const {
    double best = std::numeric_limits<double>::infinity(), bu = 0;
    for (std::size_t i = 0; i < prims.size(); ++i) {
        const Vec2 q = prims[i].closestPoint(p);
        const double d = distance(p, q);
        if (d < best) { best = d; bu = static_cast<double>(i) + fractionOn(prims[i], q); }
    }
    return bu;
}

std::vector<double> EditPath::paramsOnPrim(std::size_t i, const std::vector<Vec2>& pts) const {
    std::vector<double> out;
    for (const Vec2& p : pts) out.push_back(static_cast<double>(i) + fractionOn(prims[i], p));
    return out;
}

EntityPtr EditPath::piece(double u0, double u1) const {
    const double n = length();
    std::vector<Primitive> out;
    double u = u0;
    while (u < u1 - kParamEps) {
        const double wrapped = closed ? std::fmod(u, n) : u;
        const std::size_t i = std::min(static_cast<std::size_t>(wrapped), prims.size() - 1);
        const double segEnd = (u - wrapped) + static_cast<double>(i) + 1.0; // end of this primitive in unwrapped u
        const double t0 = wrapped - static_cast<double>(i);
        const double t1 = std::min(1.0, t0 + (u1 - u));
        out.push_back(subPrim(prims[i], t0, t1));
        u = std::min(u1, segEnd);
    }
    if (out.empty()) return nullptr;
    EntityPtr e;
    if (sourceType == EntityType::Line && out.size() == 1 && out[0].kind == Primitive::Kind::Segment) {
        e = std::make_shared<LineEntity>(out[0].a, out[0].b);
    } else if ((sourceType == EntityType::Arc || sourceType == EntityType::Circle) && out.size() >= 1) {
        // One arc on the same circle (pieces of a circle may straddle its seam).
        ArcGeom g = out.front().arc;
        double sweep = 0;
        for (const Primitive& p : out) sweep += p.arc.sweep;
        g.sweep = sweep;
        e = arcEntityFrom(g);
    } else {
        auto pl = polylineFrom(out, false);
        static_cast<PolylineEntity&>(*pl).setWidth(width);
        e = pl;
    }
    e->setStyle(style);
    return e;
}

std::optional<EditPath> editPathOf(const Entity& e) {
    EditPath p;
    p.sourceType = e.type();
    p.style = e.style();
    switch (e.type()) {
    case EntityType::Line:
    case EntityType::Arc:
        p.prims = entityPrimitives(e);
        break;
    case EntityType::Circle:
        p.prims = entityPrimitives(e);
        p.closed = true;
        break;
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(e);
        p.prims = entityPrimitives(e);
        p.closed = pl.isClosed();
        p.width = pl.width();
        break;
    }
    default:
        return std::nullopt;
    }
    if (p.prims.empty()) return std::nullopt;
    return p;
}

std::vector<double> cuttingParams(const EditPath& path, const Document& doc, EntityId self) {
    std::vector<double> out;
    BoundingBox pb;
    for (const auto& pr : path.prims) pb.expand(pr.bounds());
    pb = pb.inflated(1e-9 * (1.0 + std::max(pb.width(), pb.height())));
    for (const auto& ep : doc.entities()) {
        if (ep->id() == self || !doc.isVisible(*ep)) continue;
        if (!ep->isInfinite() && !pb.intersects(ep->bounds())) continue;
        const auto others = entityPrimitives(*ep, pb);
        for (std::size_t i = 0; i < path.prims.size(); ++i)
            for (const Primitive& o : others) {
                const auto pts = geom::intersect(path.prims[i], o);
                for (double u : path.paramsOnPrim(i, pts)) out.push_back(u);
            }
    }
    std::sort(out.begin(), out.end());
    out.erase(std::unique(out.begin(), out.end(), [](double a, double b) { return std::abs(a - b) < kParamEps; }), out.end());
    return out;
}

// ================================================================ TRIM / EXTEND

std::string TrimCommand::prompt() const {
    return extend_ ? "EXTEND  Pick the end of an object to extend to the nearest boundary (Enter to finish):"
                   : "TRIM  Pick the part of an object to remove (all objects cut; Enter to finish):";
}

bool TrimCommand::trimAt(CommandContext& ctx, const Vec2& p) {
    const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
    if (!id) { ctx.say("No object at that point."); return false; }
    auto ent = ctx.doc.findEntity(id);
    auto path = editPathOf(*ent);
    if (!path) { ctx.say(std::string(ent->typeName()) + " cannot be trimmed in this version."); return false; }
    const auto cuts = cuttingParams(*path, ctx.doc, id);
    const double n = path->length();
    const double up = path->paramOf(p);
    std::vector<EntityPtr> keep;
    if (!path->closed) {
        double lo = 0, hi = n;
        for (double c : cuts) {
            if (c <= kParamEps || c >= n - kParamEps) continue;
            if (c < up) lo = std::max(lo, c);
            else hi = std::min(hi, c);
        }
        if (lo == 0 && hi == n) {
            // No cutting edge: AutoCAD erases the object entirely in quick mode.
            ctx.doc.eraseWithUndo({id});
            ctx.selection.remove(id);
            return true;
        }
        if (lo > kParamEps) keep.push_back(path->piece(0, lo));
        if (hi < n - kParamEps) keep.push_back(path->piece(hi, n));
    } else {
        if (cuts.size() < 2) { ctx.say("A closed object needs at least two cutting edges to trim."); return false; }
        double lo = cuts.back() - n, hi = cuts.front() + n;
        for (double c : cuts) {
            if (c < up) lo = std::max(lo, c);
            if (c > up) hi = std::min(hi, c);
        }
        keep.push_back(path->piece(hi, lo + n)); // the rest, going round from hi to lo
    }
    keep.erase(std::remove(keep.begin(), keep.end(), nullptr), keep.end());
    ctx.doc.changeWithUndo({id}, std::move(keep), "Trim");
    ctx.selection.remove(id);
    return true;
}

bool TrimCommand::extendAt(CommandContext& ctx, const Vec2& p) {
    const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
    if (!id) { ctx.say("No object at that point."); return false; }
    auto ent = ctx.doc.findEntity(id);
    auto path = editPathOf(*ent);
    if (!path || path->closed) { ctx.say(std::string(ent->typeName()) + " cannot be extended."); return false; }
    const bool atEnd = path->paramOf(p) > path->length() / 2.0;
    Primitive last = atEnd ? path->prims.back() : path->prims.front();
    // Extension piece starting at the chosen end, pointing away from the object.
    Primitive ext;
    const BoundingBox all = ctx.doc.extents();
    const double far = 4.0 * (all.isValid() ? std::max(all.width(), all.height()) : 1.0) + 1.0;
    if (last.kind == Primitive::Kind::Segment) {
        const Vec2 from = atEnd ? last.b : last.a;
        const Vec2 dir = (atEnd ? last.b - last.a : last.a - last.b).normalized();
        ext = Primitive::segment(from, from + dir * far);
    } else {
        ArcGeom g = last.arc;
        const double rest = 2.0 * kPi - std::abs(g.sweep);
        if (rest <= 1e-9) { ctx.say("A full circle cannot be extended."); return false; }
        ArcGeom e;
        e.center = g.center;
        e.radius = g.radius;
        if (atEnd) { e.startAngle = g.startAngle + g.sweep; e.sweep = std::copysign(rest, g.sweep); }
        else { e.startAngle = g.startAngle; e.sweep = -std::copysign(rest, g.sweep); }
        ext = Primitive::fromArc(e);
    }
    // Nearest boundary crossing along the extension.
    double bestT = std::numeric_limits<double>::infinity();
    Vec2 hit;
    for (const auto& ep : ctx.doc.entities()) {
        if (ep->id() == id || !ctx.doc.isVisible(*ep)) continue;
        for (const Primitive& o : entityPrimitives(*ep, ext.bounds().inflated(1e-9)))
            for (const Vec2& x : geom::intersect(ext, o)) {
                const double t = fractionOn(ext, x);
                if (t > 1e-12 && t < bestT) { bestT = t; hit = x; }
            }
    }
    if (!std::isfinite(bestT)) { ctx.say("No boundary found in that direction."); return false; }
    // Rebuild with the moved end.
    std::vector<Primitive> prims = path->prims;
    Primitive& end = atEnd ? prims.back() : prims.front();
    if (end.kind == Primitive::Kind::Segment) {
        (atEnd ? end.b : end.a) = hit;
    } else {
        const double add = ext.arc.sweep * bestT;
        if (atEnd) end.arc.sweep += add;
        else { end.arc.startAngle += add; end.arc.sweep -= add; }
    }
    EntityPtr out;
    if (path->sourceType == EntityType::Line) out = std::make_shared<LineEntity>(prims[0].a, prims[0].b);
    else if (path->sourceType == EntityType::Arc) out = arcEntityFrom(prims[0].arc);
    else {
        out = polylineFrom(prims, false);
        static_cast<PolylineEntity&>(*out).setWidth(path->width);
    }
    out->setStyle(path->style);
    ctx.doc.modifyWithUndo({{id, out}}, "Extend");
    return true;
}

CommandStatus TrimCommand::point(CommandContext& ctx, const Vec2& p) {
    if (extend_) extendAt(ctx, p);
    else trimAt(ctx, p);
    return CommandStatus::Continue; // keep picking until Enter
}

// ================================================================ BREAK

std::string BreakCommand::prompt() const {
    return target_ ? "BREAK  Specify second break point (or @ for the same point):"
                   : "BREAK  Select object at the first break point:";
}

CommandStatus BreakCommand::point(CommandContext& ctx, const Vec2& p) {
    if (!target_) {
        const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
        if (!id) { ctx.say("No object at that point."); return CommandStatus::Continue; }
        if (!editPathOf(*ctx.doc.findEntity(id))) { ctx.say("That object cannot be broken in this version."); return CommandStatus::Continue; }
        target_ = id;
        first_ = p;
        return CommandStatus::Continue;
    }
    auto ent = ctx.doc.findEntity(target_);
    if (!ent) return CommandStatus::Cancelled;
    auto path = editPathOf(*ent);
    const double n = path->length();
    double a = path->paramOf(*first_), b = path->paramOf(p);
    std::vector<EntityPtr> keep;
    if (!path->closed) {
        if (a > b) std::swap(a, b);
        if (std::abs(b - a) < kParamEps) { // split at one point
            if (a <= kParamEps || a >= n - kParamEps) { ctx.say("Cannot split at an end point."); return CommandStatus::Continue; }
            keep = {path->piece(0, a), path->piece(a, n)};
        } else {
            if (a > kParamEps) keep.push_back(path->piece(0, a));
            if (b < n - kParamEps) keep.push_back(path->piece(b, n));
        }
    } else {
        if (std::abs(b - a) < kParamEps) { ctx.say("A closed object needs two different break points."); return CommandStatus::Continue; }
        // Remove from the first point to the second going forward; keep the rest.
        if (b < a) b += n;
        keep.push_back(path->piece(b, a + n));
    }
    keep.erase(std::remove(keep.begin(), keep.end(), nullptr), keep.end());
    ctx.doc.changeWithUndo({target_}, std::move(keep), "Break");
    ctx.selection.remove(target_);
    return CommandStatus::Done;
}

// ================================================================ OFFSET

double OffsetCommand::dist_ = 10.0;

namespace {
// Offset of an EditPath-able polyline by signed distance s (left of travel > 0).
EntityPtr offsetPolyline(const PolylineEntity& pl, double s, std::string* why) {
    const std::size_t m = pl.segmentCount();
    struct Off { Primitive p; bool arc; bool ccw; };
    std::vector<Off> offs;
    for (std::size_t i = 0; i < m; ++i) {
        const Vec2 a = pl.segmentStart(i), b = pl.segmentEnd(i);
        if (auto arc = pl.segmentArc(i)) {
            const bool ccw = arc->sweep > 0;
            const double r2 = ccw ? arc->radius - s : arc->radius + s;
            if (r2 <= arc->radius * 1e-9) { if (why) *why = "the offset distance is larger than an arc radius"; return nullptr; }
            ArcGeom g = *arc;
            g.radius = r2;
            offs.push_back({Primitive::fromArc(g), true, ccw});
        } else {
            const Vec2 d = (b - a).normalized();
            if (d.lengthSquared() == 0) continue;
            const Vec2 n{-d.y, d.x};
            offs.push_back({Primitive::segment(a + n * s, b + n * s), false, false});
        }
    }
    if (offs.empty()) { if (why) *why = "nothing to offset"; return nullptr; }
    auto startOf = [](const Off& o) { return o.arc ? o.p.arc.startPoint() : o.p.a; };
    auto endOf = [](const Off& o) { return o.arc ? o.p.arc.endPoint() : o.p.b; };
    auto join = [&](const Off& x, const Off& y) -> std::vector<Vec2> {
        std::vector<Vec2> cand;
        if (!x.arc && !y.arc) cand = geom::intersectLines(x.p.a, x.p.b, y.p.a, y.p.b);
        else if (!x.arc) cand = geom::intersectLineCircle(x.p.a, x.p.b, y.p.arc.center, y.p.arc.radius);
        else if (!y.arc) cand = geom::intersectLineCircle(y.p.a, y.p.b, x.p.arc.center, x.p.arc.radius);
        else cand = geom::intersectCircles(x.p.arc.center, x.p.arc.radius, y.p.arc.center, y.p.arc.radius);
        const Vec2 ref = endOf(x);
        if (cand.empty()) return {endOf(x), startOf(y)}; // no corner: bridge the gap
        Vec2 best = cand.front();
        for (const Vec2& c : cand) if (distance(c, ref) < distance(best, ref)) best = c;
        return {best};
    };
    const bool closed = pl.isClosed();
    // Vertex list: start, joins..., end (closed: joins only).
    std::vector<std::vector<Vec2>> joins(offs.size()); // joins[i] = points between offs[i-1] and offs[i]
    for (std::size_t i = 1; i < offs.size(); ++i) joins[i] = join(offs[i - 1], offs[i]);
    if (closed) joins[0] = join(offs.back(), offs[0]);
    std::vector<Vec2> v;
    std::vector<double> bl;
    auto push = [&](const Vec2& p) {
        if (!v.empty() && nearlyEqual(v.back(), p, 1e-12)) return;
        v.push_back(p);
        bl.push_back(0.0);
    };
    for (std::size_t i = 0; i < offs.size(); ++i) {
        if (i == 0) {
            if (closed) for (const Vec2& p : joins[0]) push(p);
            else push(startOf(offs[0]));
        } else {
            for (const Vec2& p : joins[i]) push(p);
        }
        const std::size_t segStart = v.size() - 1;
        const Vec2 segEnd = (i + 1 < offs.size()) ? joins[i + 1].front() : (closed ? joins[0].front() : endOf(offs[i]));
        if (offs[i].arc) {
            const ArcGeom& g = offs[i].p.arc;
            const Vec2 p0 = v[segStart];
            double ang = std::atan2((p0 - g.center).cross(segEnd - g.center), (p0 - g.center).dot(segEnd - g.center));
            if (offs[i].ccw && ang < 0) ang += 2 * kPi;
            if (!offs[i].ccw && ang > 0) ang -= 2 * kPi;
            bl[segStart] = std::tan(ang / 4.0);
        }
        if (!(closed && i + 1 == offs.size())) push(segEnd);
    }
    if (closed && v.size() > 1 && nearlyEqual(v.front(), v.back(), 1e-12)) { v.pop_back(); bl.pop_back(); }
    if (v.size() < 2) { if (why) *why = "the offset collapses"; return nullptr; }
    auto out = std::make_shared<PolylineEntity>(std::move(v), std::move(bl), closed);
    out->setWidth(pl.width());
    return out;
}
} // namespace

EntityPtr offsetEntity(const Entity& e, double d, const Vec2& side, std::string* why) {
    if (!(d > 0)) { if (why) *why = "the offset distance must be greater than zero"; return nullptr; }
    EntityPtr out;
    switch (e.type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(e);
        const Vec2 dir = (l.end() - l.start()).normalized();
        const Vec2 n{-dir.y, dir.x};
        const double sgn = dir.cross(side - l.start()) >= 0 ? 1.0 : -1.0;
        out = std::make_shared<LineEntity>(l.start() + n * (d * sgn), l.end() + n * (d * sgn));
        break;
    }
    case EntityType::XLine: {
        const auto& x = static_cast<const XLineEntity&>(e);
        const Vec2 n{-x.direction().y, x.direction().x};
        const double sgn = x.direction().cross(side - x.base()) >= 0 ? 1.0 : -1.0;
        out = std::make_shared<XLineEntity>(x.base() + n * (d * sgn), x.direction(), x.isRay());
        break;
    }
    case EntityType::Circle:
    case EntityType::Arc: {
        const bool circ = e.type() == EntityType::Circle;
        const Vec2 c = circ ? static_cast<const CircleEntity&>(e).center() : static_cast<const ArcEntity&>(e).center();
        const double r = circ ? static_cast<const CircleEntity&>(e).radius() : static_cast<const ArcEntity&>(e).radius();
        const double r2 = distance(side, c) > r ? r + d : r - d;
        if (r2 <= 0) { if (why) *why = "the offset distance is larger than the radius"; return nullptr; }
        if (circ) out = std::make_shared<CircleEntity>(c, r2);
        else {
            const auto& a = static_cast<const ArcEntity&>(e);
            out = std::make_shared<ArcEntity>(c, r2, a.startDeg(), a.endDeg());
        }
        break;
    }
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(e);
        // Side from the nearest segment: left of travel = positive.
        double best = std::numeric_limits<double>::infinity();
        double sgn = 1.0;
        for (std::size_t i = 0; i < pl.segmentCount(); ++i) {
            double dist;
            double sg;
            if (auto a = pl.segmentArc(i)) {
                dist = geom::distancePointToArc(side, *a);
                const bool inside = distance(side, a->center) < a->radius;
                sg = (inside == (a->sweep > 0)) ? 1.0 : -1.0; // inside of a CCW arc is its left
            } else {
                dist = geom::distancePointToSegment(side, pl.segmentStart(i), pl.segmentEnd(i));
                sg = (pl.segmentEnd(i) - pl.segmentStart(i)).cross(side - pl.segmentStart(i)) >= 0 ? 1.0 : -1.0;
            }
            if (dist < best) { best = dist; sgn = sg; }
        }
        out = offsetPolyline(pl, d * sgn, why);
        break;
    }
    default:
        if (why) *why = std::string(e.typeName()) + " cannot be offset in this version";
        return nullptr;
    }
    if (out) out->copyStyleFrom(e);
    return out;
}

std::string OffsetCommand::prompt() const {
    switch (stage_) {
    case Stage::Distance: {
        char b[64];
        std::snprintf(b, sizeof b, "%g", dist_);
        return std::string("OFFSET  Specify offset distance or [Through] <") + (through_ ? "Through" : b) + ">:";
    }
    case Stage::Pick: return "OFFSET  Select object to offset (Enter to finish):";
    case Stage::Side: return through_ ? "OFFSET  Specify through point:" : "OFFSET  Specify point on side to offset:";
    }
    return {};
}

CommandStatus OffsetCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Distance) {
        if (!(v > 0)) { ctx.say("Offset distance must be greater than zero."); return CommandStatus::Continue; }
        dist_ = v;
        through_ = false;
        stage_ = Stage::Pick;
        doc_ = &ctx.doc;
        return CommandStatus::Continue;
    }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus OffsetCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::Distance && (kw == "T" || kw == "THROUGH")) { through_ = true; stage_ = Stage::Pick; doc_ = &ctx.doc; return CommandStatus::Continue; }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus OffsetCommand::enter(CommandContext& ctx) {
    if (stage_ == Stage::Distance) { stage_ = Stage::Pick; doc_ = &ctx.doc; return CommandStatus::Continue; }
    return CommandStatus::Done;
}

CommandStatus OffsetCommand::point(CommandContext& ctx, const Vec2& p) {
    doc_ = &ctx.doc;
    if (stage_ == Stage::Distance) { ctx.say("Type the offset distance, or T for Through."); return CommandStatus::Continue; }
    if (stage_ == Stage::Pick) {
        const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
        if (!id) { ctx.say("No object at that point."); return CommandStatus::Continue; }
        target_ = id;
        stage_ = Stage::Side;
        return CommandStatus::Continue;
    }
    auto ent = ctx.doc.findEntity(target_);
    stage_ = Stage::Pick;
    if (!ent) return CommandStatus::Continue;
    const double d = through_ ? ent->distanceTo(p) : dist_;
    std::string why;
    auto off = offsetEntity(*ent, d, p, &why);
    if (!off) { ctx.say("Cannot offset: " + why + "."); return CommandStatus::Continue; }
    ctx.doc.addWithUndo({off}, "Offset");
    return CommandStatus::Continue;
}

void OffsetCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (stage_ != Stage::Side || !doc_) return;
    auto ent = doc_->findEntity(target_);
    if (!ent) return;
    const double d = through_ ? ent->distanceTo(cursor) : dist_;
    if (auto off = offsetEntity(*ent, d, cursor)) out.push_back(off->clone());
}

// ================================================================ FILLET / CHAMFER

namespace {
struct LineCorner {
    Vec2 x;           // intersection of the infinite lines
    Vec2 u1, u2;      // unit directions from x towards the kept parts
    Vec2 far1, far2;  // kept far end points
};

std::optional<LineCorner> lineCorner(const Entity& e1, const Vec2& p1, const Entity& e2, const Vec2& p2, std::string* why) {
    if (e1.type() != EntityType::Line || e2.type() != EntityType::Line) {
        if (why) *why = "pick two lines (or use the Polyline option)";
        return std::nullopt;
    }
    const auto& l1 = static_cast<const LineEntity&>(e1);
    const auto& l2 = static_cast<const LineEntity&>(e2);
    auto xs = geom::intersectLines(l1.start(), l1.end(), l2.start(), l2.end());
    if (xs.empty()) { if (why) *why = "the lines are parallel"; return std::nullopt; }
    LineCorner c;
    c.x = xs[0];
    auto side = [&](const LineEntity& l, const Vec2& pick, Vec2& u, Vec2& far) {
        const Vec2 d = (l.end() - l.start()).normalized();
        // Keep the side of the intersection where the user picked.
        const double s = (pick - c.x).dot(d) >= 0 ? 1.0 : -1.0;
        u = d * s;
        far = (l.start() - c.x).dot(u) > (l.end() - c.x).dot(u) ? l.start() : l.end();
        return (far - c.x).dot(u) > 0;
    };
    if (!side(l1, p1, c.u1, c.far1) || !side(l2, p2, c.u2, c.far2)) {
        if (why) *why = "the picked side of a line does not reach the corner";
        return std::nullopt;
    }
    return c;
}
} // namespace

std::optional<CornerResult> filletLines(const Entity& e1, const Vec2& p1, const Entity& e2, const Vec2& p2, double r,
                                        std::string* why) {
    auto c = lineCorner(e1, p1, e2, p2, why);
    if (!c) return std::nullopt;
    CornerResult out;
    if (r <= 0) {
        out.first = std::make_shared<LineEntity>(c->x, c->far1);
        out.second = std::make_shared<LineEntity>(c->x, c->far2);
    } else {
        const double theta = std::acos(std::clamp(c->u1.dot(c->u2), -1.0, 1.0));
        if (theta < 1e-9 || theta > kPi - 1e-9) { if (why) *why = "the lines are collinear"; return std::nullopt; }
        const double t = r / std::tan(theta / 2.0);
        if (t > (c->far1 - c->x).dot(c->u1) + 1e-12 || t > (c->far2 - c->x).dot(c->u2) + 1e-12) {
            if (why) *why = "the radius is too large for these lines";
            return std::nullopt;
        }
        const Vec2 t1 = c->x + c->u1 * t, t2 = c->x + c->u2 * t;
        const Vec2 center = c->x + (c->u1 + c->u2).normalized() * (r / std::sin(theta / 2.0));
        out.first = std::make_shared<LineEntity>(t1, c->far1);
        out.second = std::make_shared<LineEntity>(t2, c->far2);
        double a1 = geom::angleDeg(center, t1), a2 = geom::angleDeg(center, t2);
        if ((t1 - center).cross(t2 - center) < 0) std::swap(a1, a2);
        out.joint = std::make_shared<ArcEntity>(center, r, a1, a2);
        out.joint->copyStyleFrom(e1);
    }
    out.first->copyStyleFrom(e1);
    out.second->copyStyleFrom(e2);
    return out;
}

std::optional<CornerResult> chamferLines(const Entity& e1, const Vec2& p1, const Entity& e2, const Vec2& p2, double d1,
                                         double d2, std::string* why) {
    auto c = lineCorner(e1, p1, e2, p2, why);
    if (!c) return std::nullopt;
    if (d1 > (c->far1 - c->x).dot(c->u1) + 1e-12 || d2 > (c->far2 - c->x).dot(c->u2) + 1e-12) {
        if (why) *why = "the chamfer distances are too large for these lines";
        return std::nullopt;
    }
    CornerResult out;
    const Vec2 a = c->x + c->u1 * d1, b = c->x + c->u2 * d2;
    out.first = std::make_shared<LineEntity>(a, c->far1);
    out.second = std::make_shared<LineEntity>(b, c->far2);
    if (d1 > 0 || d2 > 0) {
        out.joint = std::make_shared<LineEntity>(a, b);
        out.joint->copyStyleFrom(e1);
    }
    out.first->copyStyleFrom(e1);
    out.second->copyStyleFrom(e2);
    return out;
}

EntityPtr filletPolyline(const Entity& e, double r, bool chamfer, int* corners, std::string* why) {
    if (e.type() != EntityType::Polyline) { if (why) *why = "pick a polyline"; return nullptr; }
    const auto& pl = static_cast<const PolylineEntity&>(e);
    if (pl.hasArcs()) { if (why) *why = "polylines with arc segments are not supported yet"; return nullptr; }
    const auto& v = pl.vertices();
    const std::size_t n = v.size();
    const bool closed = pl.isClosed();
    std::vector<Vec2> nv;
    std::vector<double> nb;
    int done = 0;
    for (std::size_t i = 0; i < n; ++i) {
        const bool interior = closed || (i > 0 && i + 1 < n);
        if (!interior || r <= 0) { nv.push_back(v[i]); nb.push_back(0.0); continue; }
        const Vec2 prev = v[(i + n - 1) % n], cur = v[i], next = v[(i + 1) % n];
        const Vec2 a = (prev - cur), b = (next - cur);
        const double la = a.length(), lb = b.length();
        const Vec2 ua = a / la, ub = b / lb;
        const double theta = std::acos(std::clamp(ua.dot(ub), -1.0, 1.0));
        if (theta < 1e-9 || theta > kPi - 1e-9) { nv.push_back(cur); nb.push_back(0.0); continue; }
        const double t = chamfer ? r : r / std::tan(theta / 2.0);
        if (t > la / 2.0 + 1e-12 || t > lb / 2.0 + 1e-12) { nv.push_back(cur); nb.push_back(0.0); continue; } // too short
        nv.push_back(cur + ua * t);
        nb.push_back(0.0);
        if (!chamfer) {
            const double turn = (cur - prev).cross(next - cur) > 0 ? 1.0 : -1.0; // left turn = CCW arc
            nb.back() = turn * std::tan((kPi - theta) / 4.0);
        }
        nv.push_back(cur + ub * t);
        nb.push_back(0.0);
        ++done;
    }
    if (corners) *corners = done;
    if (!done) { if (why) *why = "no corner was long enough"; return nullptr; }
    auto out = std::make_shared<PolylineEntity>(std::move(nv), std::move(nb), closed);
    out->setWidth(pl.width());
    out->copyStyleFrom(e);
    return out;
}

double CornerCommand::radius_ = 0.0;
double CornerCommand::d1_ = 10.0;
double CornerCommand::d2_ = 10.0;

CommandStatus CornerCommand::start(CommandContext& ctx) {
    char b[96];
    if (chamfer_) std::snprintf(b, sizeof b, "Current chamfer distances: %g, %g", d1_, d2_);
    else std::snprintf(b, sizeof b, "Current fillet radius: %g", radius_);
    ctx.say(b);
    return CommandStatus::Continue;
}

std::string CornerCommand::prompt() const {
    switch (stage_) {
    case Stage::First: return chamfer_ ? "CHAMFER  Select first line or [Distance/Polyline]:" : "FILLET  Select first line or [Radius/Polyline]:";
    case Stage::Second: return name() + "  Select second line:";
    case Stage::Radius: return "FILLET  Specify fillet radius:";
    case Stage::Dist1: return "CHAMFER  Specify first chamfer distance:";
    case Stage::Dist2: return "CHAMFER  Specify second chamfer distance:";
    case Stage::Polyline: return name() + "  Select polyline:";
    }
    return {};
}

CommandStatus CornerCommand::number(CommandContext& ctx, double v, const std::optional<Vec2>& cursor) {
    if (stage_ == Stage::Radius || stage_ == Stage::Dist1 || stage_ == Stage::Dist2) {
        if (v < 0) { ctx.say("Value cannot be negative."); return CommandStatus::Continue; }
        if (stage_ == Stage::Radius) { radius_ = v; stage_ = Stage::First; }
        else if (stage_ == Stage::Dist1) { d1_ = v; d2_ = v; stage_ = Stage::Dist2; }
        else { d2_ = v; stage_ = Stage::First; }
        return CommandStatus::Continue;
    }
    return InteractiveCommand::number(ctx, v, cursor);
}

CommandStatus CornerCommand::keyword(CommandContext& ctx, const std::string& kw) {
    if (stage_ == Stage::First) {
        if (!chamfer_ && (kw == "R" || kw == "RADIUS")) { stage_ = Stage::Radius; return CommandStatus::Continue; }
        if (chamfer_ && (kw == "D" || kw == "DISTANCE")) { stage_ = Stage::Dist1; return CommandStatus::Continue; }
        if (kw == "P" || kw == "POLYLINE") { stage_ = Stage::Polyline; return CommandStatus::Continue; }
    }
    return InteractiveCommand::keyword(ctx, kw);
}

CommandStatus CornerCommand::enter(CommandContext&) {
    if (stage_ == Stage::Dist2) { stage_ = Stage::First; return CommandStatus::Continue; } // second = first
    return CommandStatus::Cancelled;
}

CommandStatus CornerCommand::point(CommandContext& ctx, const Vec2& p) {
    const EntityId id = pickEntity(ctx.doc, p, ctx.pickTolerance);
    if (stage_ == Stage::Radius || stage_ == Stage::Dist1 || stage_ == Stage::Dist2) { ctx.say("Type a value."); return CommandStatus::Continue; }
    if (!id) { ctx.say("No object at that point."); return CommandStatus::Continue; }
    std::string why;
    if (stage_ == Stage::Polyline) {
        int n = 0;
        auto out = filletPolyline(*ctx.doc.findEntity(id), chamfer_ ? d1_ : radius_, chamfer_, &n, &why);
        if (!out) { ctx.say("Cannot " + std::string(chamfer_ ? "chamfer" : "fillet") + ": " + why + "."); return CommandStatus::Continue; }
        ctx.doc.modifyWithUndo({{id, out}}, chamfer_ ? "Chamfer" : "Fillet");
        ctx.say(std::to_string(n) + (n == 1 ? " corner done." : " corners done."));
        return CommandStatus::Done;
    }
    if (stage_ == Stage::First) { first_ = id; pick1_ = p; stage_ = Stage::Second; return CommandStatus::Continue; }
    if (id == first_) { ctx.say("Select a different line."); return CommandStatus::Continue; }
    auto e1 = ctx.doc.findEntity(first_), e2 = ctx.doc.findEntity(id);
    if (!e1 || !e2) return CommandStatus::Cancelled;
    auto res = chamfer_ ? chamferLines(*e1, pick1_, *e2, p, d1_, d2_, &why) : filletLines(*e1, pick1_, *e2, p, radius_, &why);
    if (!res) { ctx.say("Cannot " + std::string(chamfer_ ? "chamfer" : "fillet") + ": " + why + "."); stage_ = Stage::First; return CommandStatus::Continue; }
    std::vector<EntityPtr> add{res->first, res->second};
    if (res->joint) add.push_back(res->joint);
    ctx.doc.changeWithUndo({first_, id}, std::move(add), chamfer_ ? "Chamfer" : "Fillet");
    return CommandStatus::Done;
}

// ================================================================ STRETCH

std::optional<Vec2> StretchCommand::basePoint() const {
    if (c1_ && !c2_) return c1_;
    return base_;
}

std::string StretchCommand::prompt() const {
    if (!c1_) return "STRETCH  Specify first corner of the crossing window:";
    if (!c2_) return "STRETCH  Specify opposite corner:";
    if (!base_) return "STRETCH  Specify base point:";
    return "STRETCH  Specify second point (or @dx,dy):";
}

EntityPtr StretchCommand::stretched(const Entity& e, const BoundingBox& w, const Vec2& d) {
    if (e.insideRect(w)) return EntityPtr(e.transformed(Affine2D::translation(d)));
    if (!e.crossesRect(w)) return nullptr;
    auto mv = [&](const Vec2& p) { return w.contains(p) ? p + d : p; };
    EntityPtr out;
    switch (e.type()) {
    case EntityType::Line: {
        const auto& l = static_cast<const LineEntity&>(e);
        out = std::make_shared<LineEntity>(mv(l.start()), mv(l.end()));
        break;
    }
    case EntityType::Polyline: {
        const auto& pl = static_cast<const PolylineEntity&>(e);
        std::vector<Vec2> v;
        for (const Vec2& p : pl.vertices()) v.push_back(mv(p));
        auto np = std::make_shared<PolylineEntity>(std::move(v), pl.bulges(), pl.isClosed());
        np->setWidth(pl.width());
        np->setFilled(pl.isFilled());
        out = np;
        break;
    }
    case EntityType::Spline: {
        NurbsCurve c = static_cast<const SplineEntity&>(e).curve();
        for (Vec2& p : c.ctrl) p = mv(p);
        out = std::make_shared<SplineEntity>(std::move(c));
        break;
    }
    case EntityType::Circle:
    case EntityType::Ellipse:
    case EntityType::Point:
    case EntityType::XLine: {
        // Move only if the defining point (centre / position / base) is inside.
        const auto grips = e.gripPoints();
        if (!grips.empty() && w.contains(grips.front())) out = EntityPtr(e.transformed(Affine2D::translation(d)));
        break;
    }
    case EntityType::Arc: // arcs move only when completely inside
        break;
    }
    if (out) out->copyStyleFrom(e);
    return out;
}

CommandStatus StretchCommand::point(CommandContext& ctx, const Vec2& p) {
    doc_ = &ctx.doc;
    if (!c1_) { c1_ = p; return CommandStatus::Continue; }
    if (!c2_) { c2_ = p; return CommandStatus::Continue; }
    if (!base_) { base_ = p; return CommandStatus::Continue; }
    const BoundingBox w(*c1_, *c2_);
    const Vec2 d = p - *base_;
    std::vector<std::pair<EntityId, EntityPtr>> repl;
    for (const auto& e : ctx.doc.entities())
        if (auto s = stretched(*e, w, d)) repl.emplace_back(e->id(), s);
    if (repl.empty()) ctx.say("No objects were inside the crossing window.");
    else ctx.doc.modifyWithUndo(std::move(repl), "Stretch");
    return CommandStatus::Done;
}

void StretchCommand::preview(const Vec2& cursor, std::vector<std::unique_ptr<Entity>>& out) const {
    if (c1_ && !c2_) {
        out.push_back(std::make_unique<PolylineEntity>(std::vector<Vec2>{*c1_, {cursor.x, c1_->y}, cursor, {c1_->x, cursor.y}}, true));
        return;
    }
    if (!base_ || !doc_) return;
    const BoundingBox w(*c1_, *c2_);
    std::size_t n = 0;
    for (const auto& e : doc_->entities()) {
        if (auto s = stretched(*e, w, cursor - *base_)) {
            out.push_back(s->clone());
            if (++n > 300) break;
        }
    }
}

} // namespace dyncad
